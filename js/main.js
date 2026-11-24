document.getElementById('year').textContent = new Date().getFullYear();
const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('.motion-toggle');
let paused = preference.matches;
function updateMotion() {
  document.body.classList.toggle('motion-paused', paused);
  document.documentElement.classList.toggle('motion-paused', paused);
  toggle.setAttribute('aria-pressed', String(paused));
  toggle.textContent = paused ? 'Enable animations' : 'Pause animations';
  document.querySelector('.hero').style.setProperty('--hero-drift', '0px');
  document.querySelectorAll('[data-animated]').forEach(img => {
    img.src = paused ? img.dataset.still : img.dataset.animated;
  });
}
toggle.addEventListener('click', () => { paused = !paused; updateMotion(); });
preference.addEventListener('change', event => { paused = event.matches; updateMotion(); });
updateMotion();
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) {
      entry.target.classList.remove('pending');
      revealObserver.unobserve(entry.target);
    }});
  }, { threshold: 0.08 });
  document.querySelectorAll('.game-chapter, .game-intro, .press-quote, .contact > div, .community > div, .community > img, .awards').forEach(section => section.classList.add('reveal'));
  document.querySelectorAll('.reveal').forEach((section, index) => {
    section.classList.add(index % 2 ? 'from-right' : 'from-left');
    if (!paused && section.getBoundingClientRect().top > window.innerHeight) section.classList.add('pending');
    revealObserver.observe(section);
  });
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const link = document.querySelector(`.header nav a[href="#${entry.target.id}"]`);
      if (link) { if (entry.isIntersecting) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); }
    });
  }, { rootMargin: '-15% 0px -45% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
}

// Move only the artwork: text, video and navigation remain stable.
const hero = document.querySelector('.hero');
const parallaxImages = [...document.querySelectorAll('#game .game-intro > img, #game .screenshot-pair img, .community > img')];
let parallaxFrame = 0;
function queueParallax() {
  if (window.matchMedia('(max-width: 700px), (hover: none)').matches || paused) {
    hero.style.setProperty('--hero-drift', '0px');
    parallaxImages.forEach(image => image.style.setProperty('--image-drift', '0px'));
    return;
  }
  if (parallaxFrame) return;
  parallaxFrame = requestAnimationFrame(() => {
    parallaxFrame = 0;
    const distance = Math.min(Math.max(-hero.getBoundingClientRect().top, 0), hero.offsetHeight);
    hero.style.setProperty('--hero-drift', paused ? '0px' : `${Math.min(distance * 0.12, 90)}px`);
    const limit = window.innerWidth < 600 ? 8 : 16;
    parallaxImages.forEach(image => {
      const box = image.getBoundingClientRect();
      const offset = Math.max(-limit, Math.min(limit, (window.innerHeight / 2 - (box.top + box.height / 2)) * 0.035));
      image.style.setProperty('--image-drift', paused ? '0px' : `${offset.toFixed(2)}px`);
    });
  });
}
window.addEventListener('scroll', queueParallax, { passive: true });
window.addEventListener('resize', queueParallax, { passive: true });
toggle.addEventListener('click', queueParallax);
preference.addEventListener('change', queueParallax);
queueParallax();

// Progressive navigation: all links remain visible without JavaScript.
const menuButton = document.querySelector('.menu-toggle');
const header = document.querySelector('.header');
const navigation = document.getElementById('main-navigation');
const compactNavigation = window.matchMedia('(max-width: 1000px)');
menuButton.hidden = false;
header.classList.add('nav-enhanced');
function closeMenu(returnFocus = false) {
  header.classList.remove('menu-open');
  document.body.classList.remove('menu-visible');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.querySelector('span').textContent = 'Menu';
  if (returnFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const opened = header.classList.toggle('menu-open');
  document.body.classList.toggle('menu-visible', opened);
  menuButton.setAttribute('aria-expanded', String(opened));
  menuButton.querySelector('span').textContent = opened ? 'Close' : 'Menu';
});
navigation.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link || !compactNavigation.matches) return;
  closeMenu();
  if (link.hash) {
    const target = document.getElementById(link.hash.slice(1));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }
});
header.addEventListener('keydown', event => {
  if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true);
});
compactNavigation.addEventListener('change', () => closeMenu());

// Keep keyboard navigation inside the open full-screen menu.
header.addEventListener('keydown', event => {
  if (event.key !== 'Tab' || !header.classList.contains('menu-open') || !compactNavigation.matches) return;
  const controls = [menuButton, ...navigation.querySelectorAll('a')].filter(el => el.getClientRects().length);
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

// Reveal artwork only when its image is ready, without delaying page controls.
const heroArtwork = new Image();
function showHeroArtwork() { hero.classList.add('art-ready'); }
heroArtwork.onload = showHeroArtwork;
heroArtwork.onerror = showHeroArtwork;
heroArtwork.src = 'assets/images/hero-cat.png';
if (heroArtwork.complete) showHeroArtwork();
