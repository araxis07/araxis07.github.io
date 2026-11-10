const root = document.documentElement;
root.classList.add('js-ready');
const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navMenu = document.querySelector('[data-nav-menu]');
const navLinks = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
const sections = [...document.querySelectorAll('main > section[id]')];
const motionToggle = document.querySelector('[data-motion-toggle]');
const motionSymbol = document.querySelector('[data-motion-symbol]');
const progress = document.querySelector('[data-reading-progress]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

const closeNavigation = (restoreFocus = false) => {
  const wasOpen = navToggle?.getAttribute('aria-expanded') === 'true';
  navToggle?.setAttribute('aria-expanded', 'false');
  navToggle?.setAttribute('aria-label', 'Open navigation');
  navMenu?.classList.remove('open');
  if (restoreFocus && wasOpen) navToggle?.focus();
};
navToggle?.addEventListener('click', () => {
  if (navToggle.getAttribute('aria-expanded') === 'true') return closeNavigation();
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Close navigation');
  navMenu?.classList.add('open');
  navMenu?.querySelector('a')?.focus();
});
navLinks.forEach((link) => link.addEventListener('click', () => closeNavigation()));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNavigation(true);
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeNavigation();
}, { passive: true });

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute('href') === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
  sections.forEach((section) => sectionObserver.observe(section));
}

const dialogOpeners = new WeakMap();
const caseDialogs = [...document.querySelectorAll('.case-study-dialog')];
const caseFromHash = () => caseDialogs.find((dialog) => `#${dialog.id}` === window.location.hash);
const openCaseStudy = (dialog, opener) => {
  if (dialog.open) return;
  caseDialogs.forEach((other) => { if (other.open) other.close(); });
  closeNavigation();
  if (opener) dialogOpeners.set(dialog, opener);
  root.classList.add('dialog-open');
  dialog.showModal();
  const shell = dialog.querySelector('.case-study-shell');
  if (shell) shell.scrollTop = 0;
  dialog.querySelector('.dialog-close')?.focus();
};
const syncCaseStudy = () => {
  const target = caseFromHash();
  caseDialogs.forEach((dialog) => { if (dialog.open && dialog !== target) dialog.close(); });
  if (target) openCaseStudy(target);
};
document.querySelectorAll('[data-case-study-open]').forEach((button) => {
  button.addEventListener('click', (event) => {
    const dialog = document.getElementById(button.dataset.caseStudyOpen);
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
    // Keep normal link actions such as opening a new tab available.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    history.pushState({ portfolioCase: dialog.id, returnHash: location.hash }, '', `#${dialog.id}`);
    openCaseStudy(dialog, button);
  });
});
caseDialogs.forEach((dialog) => {
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (caseDialogs.some((other) => other.open)) return;
    root.classList.remove('dialog-open');
    if (location.hash === `#${dialog.id}`) {
      if (history.state?.portfolioCase === dialog.id) history.back();
      else history.replaceState(null, '', '#projects');
    }
    const opener = dialogOpeners.get(dialog) || document.querySelector(`.project-case-study[data-case-study-open="${dialog.id}"]`);
    opener?.focus({ preventScroll: true });
  });
});
window.addEventListener('popstate', syncCaseStudy);
window.addEventListener('hashchange', syncCaseStudy);
syncCaseStudy();

// Keep the complete map available without making mobile readers scroll past it.
const systemMap = document.getElementById('system-map');
if (systemMap && window.matchMedia('(max-width:760px)').matches && location.hash !== '#system-map') systemMap.open = false;
window.addEventListener('hashchange', () => {
  if (systemMap && location.hash === '#system-map') systemMap.open = true;
});

let scrollFrame = 0;
const updateScroll = () => {
  header?.classList.toggle('scrolled', window.scrollY > 20);
  const distance = root.scrollHeight - window.innerHeight;
  const ratio = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
  if (progress) progress.style.transform = `scaleX(${ratio})`;
  scrollFrame = 0;
};
window.addEventListener('scroll', () => {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScroll);
}, { passive: true });
window.addEventListener('resize', updateScroll, { passive: true });
updateScroll();

const bindPointerMotion = (element, update, reset) => {
  let frame = 0;
  let latestEvent;
  const move = (event) => {
    latestEvent = event;
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      update(latestEvent);
      frame = 0;
    });
  };
  const leave = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    reset();
  };
  element.addEventListener('pointermove', move, { passive: true });
  element.addEventListener('pointerleave', leave);
  return () => {
    leave();
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerleave', leave);
  };
};
const removeVars = (el, names) => names.forEach((name) => el.style.removeProperty(name));
let motionCleanups = [];
const stopPointerMotion = () => {
  motionCleanups.forEach((cleanup) => cleanup());
  motionCleanups = [];
  root.classList.remove('motion-ready');
};
const startPointerMotion = () => {
  if (!finePointer.matches) return;
  root.classList.add('motion-ready');
  const stage = document.querySelector('.orbit-stage');
  if (stage) motionCleanups.push(bindPointerMotion(stage, (event) => {
    const b = stage.getBoundingClientRect();
    stage.style.setProperty('--orbit-rx', `${((event.clientY - b.top) / b.height - 0.5) * -5}deg`);
    stage.style.setProperty('--orbit-ry', `${((event.clientX - b.left) / b.width - 0.5) * 7}deg`);
  }, () => removeVars(stage, ['--orbit-rx', '--orbit-ry'])));
  document.querySelectorAll('.project-card').forEach((card) => {
    card.classList.add('motion-3d');
    motionCleanups.push(bindPointerMotion(card, (event) => {
      const b = card.getBoundingClientRect();
      const x = (event.clientX - b.left) / b.width;
      const y = (event.clientY - b.top) / b.height;
      card.style.setProperty('--card-rx', `${(0.5 - y) * 3}deg`);
      card.style.setProperty('--card-ry', `${(x - 0.5) * 4}deg`);
      card.style.setProperty('--glow-x', `${x * 100}%`);
      card.style.setProperty('--glow-y', `${y * 100}%`);
    }, () => removeVars(card, ['--card-rx', '--card-ry', '--glow-x', '--glow-y'])));
  });
};

const canvas = document.getElementById('starfield');
const ctx = canvas?.getContext('2d');
let stars = [];
let skyWidth = 0;
let skyHeight = 0;
let skyFrame = 0;
let lastSkyTime = 0;
let motionPaused = false;
try { motionPaused = localStorage.getItem('araxis-motion') === 'paused'; } catch { /* Storage is optional. */ }
const shouldAnimate = () => !motionPaused && !reducedMotion.matches && !document.hidden;
const drawSky = (delta = 0) => {
  if (!ctx) return;
  ctx.clearRect(0, 0, skyWidth, skyHeight);
  stars.forEach((star) => {
    star.y -= delta * star.speed;
    if (star.y < -3) star.y = skyHeight + 3;
    ctx.fillStyle = `rgba(178,190,226,${star.alpha})`;
    ctx.fillRect(star.x, star.y, star.radius, star.radius);
  });
};
const animateSky = (time) => {
  skyFrame = 0;
  if (!shouldAnimate()) return;
  if (time - lastSkyTime > 33) {
    drawSky(Math.min(66, time - lastSkyTime));
    lastSkyTime = time;
  }
  skyFrame = window.requestAnimationFrame(animateSky);
};
const resizeSky = () => {
  if (!canvas || !ctx) return;
  skyWidth = window.innerWidth;
  skyHeight = window.innerHeight;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(skyWidth * ratio);
  canvas.height = Math.round(skyHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const count = Math.min(66, Math.floor(skyWidth * skyHeight / 19000));
  stars = Array.from({ length: count }, () => ({ x: Math.random() * skyWidth, y: Math.random() * skyHeight, radius: 0.5 + Math.random(), alpha: 0.1 + Math.random() * 0.25, speed: 0.001 + Math.random() * 0.002 }));
  drawSky();
};
const refreshMotion = () => {
  const paused = motionPaused || reducedMotion.matches;
  root.dataset.motion = paused ? 'paused' : 'running';
  motionToggle?.setAttribute('aria-pressed', String(paused));
  motionToggle?.setAttribute('aria-label', reducedMotion.matches ? 'Animations reduced by system setting' : paused ? 'Resume animations' : 'Pause animations');
  if (motionToggle) motionToggle.disabled = reducedMotion.matches;
  if (motionSymbol) motionSymbol.textContent = paused ? '▷' : 'Ⅱ';
  stopPointerMotion();
  if (!paused) startPointerMotion();
  if (skyFrame) window.cancelAnimationFrame(skyFrame);
  skyFrame = 0;
  lastSkyTime = 0;
  drawSky();
  if (ctx && shouldAnimate()) skyFrame = window.requestAnimationFrame(animateSky);
};
motionToggle?.addEventListener('click', () => {
  motionPaused = !motionPaused;
  try { localStorage.setItem('araxis-motion', motionPaused ? 'paused' : 'running'); } catch { /* Keep the current session usable. */ }
  refreshMotion();
});
reducedMotion.addEventListener('change', refreshMotion);
finePointer.addEventListener('change', refreshMotion);
document.addEventListener('visibilitychange', refreshMotion);
window.addEventListener('resize', resizeSky, { passive: true });
resizeSky();
refreshMotion();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
