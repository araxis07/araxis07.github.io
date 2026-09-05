const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('[data-nav-toggle]');
const navMenu = document.querySelector('[data-nav-menu]');
const navLinks = [...document.querySelectorAll('.nav-menu a[href^="#"]')];
const sections = [...document.querySelectorAll('main section[id]')];

const setHeaderState = () => {
  header?.classList.toggle('scrolled', window.scrollY > 24);
};

const closeNavigation = () => {
  navToggle?.setAttribute('aria-expanded', 'false');
  navToggle?.setAttribute('aria-label', 'Open navigation');
  navMenu?.classList.remove('open');
};

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  navMenu?.classList.toggle('open', !isOpen);
});

navLinks.forEach((link) => link.addEventListener('click', closeNavigation));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeNavigation();
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });

sections.forEach((section) => sectionObserver.observe(section));

const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');

const bindPointerMotion = (element, update, reset) => {
  let animationFrame = 0;
  let latestEvent;

  const handlePointerMove = (event) => {
    latestEvent = event;
    if (animationFrame) return;

    animationFrame = window.requestAnimationFrame(() => {
      update(latestEvent);
      animationFrame = 0;
    });
  };

  const handlePointerLeave = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
    reset();
  };

  element.addEventListener('pointermove', handlePointerMove, { passive: true });
  element.addEventListener('pointerleave', handlePointerLeave);

  return () => {
    handlePointerLeave();
    element.removeEventListener('pointermove', handlePointerMove);
    element.removeEventListener('pointerleave', handlePointerLeave);
  };
};

const setMotionVariables = (element, variableNames) => {
  variableNames.forEach((variableName) => element.style.removeProperty(variableName));
};

const enableDepthMotion = () => {
  if (reduceMotionQuery.matches || !finePointerQuery.matches) return () => {};

  document.documentElement.classList.add('motion-ready');
  const cleanups = [];
  const orbitStage = document.querySelector('.orbit-stage');

  if (orbitStage) {
    cleanups.push(bindPointerMotion(
      orbitStage,
      (event) => {
        const bounds = orbitStage.getBoundingClientRect();
        const pointerX = (event.clientX - bounds.left) / bounds.width - 0.5;
        const pointerY = (event.clientY - bounds.top) / bounds.height - 0.5;

        orbitStage.style.setProperty('--orbit-rx', `${pointerY * -8}deg`);
        orbitStage.style.setProperty('--orbit-ry', `${pointerX * 10}deg`);
        orbitStage.style.setProperty('--orbit-x', `${pointerX * 10}px`);
        orbitStage.style.setProperty('--orbit-y', `${pointerY * 8}px`);
      },
      () => setMotionVariables(orbitStage, ['--orbit-rx', '--orbit-ry', '--orbit-x', '--orbit-y']),
    ));
  }

  document.querySelectorAll('.project-card').forEach((card) => {
    card.classList.add('motion-3d');
    cleanups.push(bindPointerMotion(
      card,
      (event) => {
        const bounds = card.getBoundingClientRect();
        const positionX = (event.clientX - bounds.left) / bounds.width;
        const positionY = (event.clientY - bounds.top) / bounds.height;

        card.style.setProperty('--card-rx', `${(0.5 - positionY) * 7}deg`);
        card.style.setProperty('--card-ry', `${(positionX - 0.5) * 9}deg`);
        card.style.setProperty('--glow-x', `${positionX * 100}%`);
        card.style.setProperty('--glow-y', `${positionY * 100}%`);
      },
      () => setMotionVariables(card, ['--card-rx', '--card-ry', '--glow-x', '--glow-y']),
    ));
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
    document.documentElement.classList.remove('motion-ready');
    document.querySelectorAll('.project-card.motion-3d').forEach((card) => card.classList.remove('motion-3d'));
  };
};

let disableDepthMotion = enableDepthMotion();
const refreshDepthMotion = () => {
  disableDepthMotion();
  disableDepthMotion = enableDepthMotion();
};

reduceMotionQuery.addEventListener('change', refreshDepthMotion);
finePointerQuery.addEventListener('change', refreshDepthMotion);

window.addEventListener('scroll', setHeaderState, { passive: true });
setHeaderState();

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
