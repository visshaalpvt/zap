const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');

menuToggle?.addEventListener('click', () => {
  const isOpen = primaryNav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.primary-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    primaryNav.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 55, 250)}ms`;
  revealObserver.observe(element);
});

const diagram = document.querySelector('[data-parallax-root]');
const parallaxItems = diagram?.querySelectorAll('[data-parallax]');

diagram?.addEventListener('pointermove', (event) => {
  const bounds = diagram.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - 0.5;
  const y = (event.clientY - bounds.top) / bounds.height - 0.5;

  diagram.style.transform = `rotateX(${y * -2}deg) rotateY(${x * 2}deg)`;
  parallaxItems?.forEach((item) => {
    const strength = Number(item.dataset.parallax) * 100;
    item.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  });
});

diagram?.addEventListener('pointerleave', () => {
  diagram.style.transform = '';
  parallaxItems?.forEach((item) => {
    item.style.transform = '';
  });
});

const progressBar = document.querySelector('.scroll-progress span');
const flowTrack = document.querySelector('.flow-track');
const updateScrollProgress = () => {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  if (progressBar) progressBar.style.width = `${progress * 100}%`;
};

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

if (flowTrack) {
  const flowObserver = new IntersectionObserver(([entry]) => {
    flowTrack.classList.toggle('active', entry.isIntersecting);
  }, { threshold: 0.2 });
  flowObserver.observe(flowTrack);
}