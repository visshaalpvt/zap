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

// Start a Conversation Interactive Modal Controller
const modalBackdrop = document.getElementById('conversation-modal-backdrop');
const modalCloseBtn = document.getElementById('modal-close-btn');
const copyEmailBtn = document.getElementById('copy-email-btn');
const copyBadge = document.getElementById('copy-badge');

const openConversationModal = () => {
  if (!modalBackdrop) return;
  modalBackdrop.classList.add('is-open');
  modalBackdrop.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeConversationModal = () => {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove('is-open');
  modalBackdrop.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

modalCloseBtn?.addEventListener('click', closeConversationModal);

modalBackdrop?.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) {
    closeConversationModal();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalBackdrop?.classList.contains('is-open')) {
    closeConversationModal();
  }
});

// Trigger modal on "Start a conversation" buttons
document.querySelectorAll('.start-conversation-btn, .button-light[href^="mailto:"]').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    openConversationModal();
  });
});

// One-tap Copy Email with instant visual feedback
copyEmailBtn?.addEventListener('click', async () => {
  const email = 'vetrivelandm@gmail.com';
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(email);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = email;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    if (copyBadge) {
      copyBadge.textContent = 'COPIED!';
      copyBadge.classList.add('copied');
      setTimeout(() => {
        copyBadge.textContent = 'COPY';
        copyBadge.classList.remove('copied');
      }, 2500);
    }
  } catch {
    window.location.href = `mailto:${email}`;
  }
});