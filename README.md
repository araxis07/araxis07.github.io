# Pavornprat Mokarat — Portfolio

Personal portfolio website for **Pavornprat Mokarat**, a junior software developer focused on full-stack products, dependable engineering, and thoughtful user experiences.

## Live site

[araxis07.github.io](https://araxis07.github.io)

## Highlights

- Responsive one-page portfolio
- Developer Index layout matching the GitHub profile, with Deep Space / Nebula colors and terminal typography
- Subtle starfield, reveal and pointer animations; pause control, saved motion preference and system reduced-motion support
- Accessible navigation, mobile menu, keyboard-friendly case study dialogs and readable content without JavaScript
- Selected full-stack projects, experience, skills, education, and contact details
- Six project case studies, retaining the original content, source links and screenshots
- Animated System Map with four project categories and six selectable project nodes; portrait layout on narrow screens, keyboard access and motion-pause support
- GitHub activity snapshot and primary-language distribution, with an explicit snapshot date and a pinned source link
- Dependency-free HTML, CSS, and JavaScript

## GitHub data

The GitHub section uses the public snapshot dated **2026-11-09** from the [profile repository](https://github.com/araxis07/araxis07/blob/af28b15ec89c831ae3993e51be75753ef0534b6a/data/github-stats.json). Language bars count each repository's primary language; they do not measure proficiency or lines of code. The figures are a dated snapshot and do not refresh automatically.

## Local preview

Serve the repository root with any static file server, or open `index.html` directly.

## System Map

Edit `data/system-map.json`, then run `python3 scripts/system_map.py` to regenerate the marked inline SVG in `index.html`. The data and renderer are shared with the profile repository. The map groups projects by product focus; its animated paths illustrate those categories. Selecting a project opens its existing case study; without JavaScript, the link opens the repository.

## Deployment

GitHub Pages publishes the website directly from the repository root after each push to `main`.

