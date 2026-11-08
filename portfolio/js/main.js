'use strict';

/* ── Theme Toggle (Light & Dark Mode) ── */
const THEME_STORAGE_KEY = 'mpv-portfolio-theme';

function applyTheme(theme, save = true) {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  const toggles = document.querySelectorAll('#themeToggle, #themeToggleMobile, .theme-toggle');
  toggles.forEach(btn => {
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  });

  const toggleLabels = document.querySelectorAll('#themeToggleLabel, .theme-toggle-label');
  toggleLabels.forEach(lbl => {
    lbl.textContent = isDark ? 'Light' : 'Dark';
  });

  if (save) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch (_) {}
  }
}

function resolveInitialTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
  } catch (_) {}
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

const currentTheme = document.documentElement.getAttribute('data-theme') || resolveInitialTheme();
applyTheme(currentTheme, false);

function bindThemeToggles() {
  const toggles = document.querySelectorAll('#themeToggle, #themeToggleMobile, .theme-toggle');
  toggles.forEach(btn => {
    btn.addEventListener('click', () => {
      const activeIsDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const nextTheme = activeIsDark ? 'light' : 'dark';
      applyTheme(nextTheme, true);
    });
  });
}
bindThemeToggles();

// Follow later system changes only when no explicit user preference has been saved
try {
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      let hasExplicitUserSave = false;
      try {
        hasExplicitUserSave = !!localStorage.getItem(THEME_STORAGE_KEY);
      } catch (_) {}
      if (!hasExplicitUserSave) {
        applyTheme(e.matches ? 'dark' : 'light', false);
      }
    });
  }
} catch (_) {}

const resumePrintBtn = document.getElementById('resumePrintBtn');
if (resumePrintBtn) {
  resumePrintBtn.addEventListener('click', () => {
    window.print();
  });
}

const yearEl = document.getElementById('footerYear');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');

function setMenuOpen(open) {
  navMenu.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute(
    'aria-label',
    open ? 'Close navigation menu' : 'Open navigation menu'
  );
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.contains('is-open');
    setMenuOpen(!isOpen);
  });

  navMenu.querySelectorAll('.nav__link, .nav__cta').forEach(link => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
      setMenuOpen(false);
      navToggle.focus();
    }
  });

  document.addEventListener('click', e => {
    if (
      navMenu.classList.contains('is-open') &&
      !navToggle.contains(e.target) &&
      !navMenu.contains(e.target)
    ) {
      setMenuOpen(false);
    }
  });
}

const sections = document.querySelectorAll('main section[id]');
const navLinks  = document.querySelectorAll('.nav__link');

const linkMap = new Map();
navLinks.forEach(link => {
  const href = link.getAttribute('href');
  if (href && href.startsWith('#')) {
    const id = href.replace('#', '');
    linkMap.set(id, link);
  }
});

function setActiveLink(activeId) {
  navLinks.forEach(link => link.classList.remove('active'));
  const activeLink = linkMap.get(activeId);
  if (activeLink) activeLink.classList.add('active');
}

const observerOptions = {
  root:       null,
  rootMargin: '-60px 0px -35% 0px',
  threshold:  0,
};

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setActiveLink(entry.target.getAttribute('id'));
    }
  });
}, observerOptions);

sections.forEach(section => sectionObserver.observe(section));

const galleryModal   = document.getElementById('galleryModal');
const modalImage     = document.getElementById('modalImage');
const modalCaption   = document.getElementById('modalCaption');
const modalClose     = document.getElementById('modalClose');
const modalBackdrop  = document.getElementById('modalBackdrop');
const modalImgWrap   = galleryModal ? galleryModal.querySelector('.modal__image-wrapper') : null;
let lastActiveFocusElement = null;

function openModal(src, caption, altText) {
  if (!galleryModal || !modalImage) return;
  lastActiveFocusElement = document.activeElement;
  modalImage.src = src;
  modalImage.alt = altText || caption || '';
  if (modalCaption) modalCaption.textContent = caption || '';
  if (modalImgWrap) modalImgWrap.classList.remove('is-zoomed');
  galleryModal.classList.add('is-active');
  galleryModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (modalClose) modalClose.focus();
}

function closeModal() {
  if (!galleryModal) return;
  if (modalImgWrap) modalImgWrap.classList.remove('is-zoomed');
  galleryModal.classList.remove('is-active');
  galleryModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (lastActiveFocusElement && typeof lastActiveFocusElement.focus === 'function') {
    lastActiveFocusElement.focus();
  }
}

// Toggle zoom on modal preview for reading fine print
if (modalImgWrap) {
  modalImgWrap.addEventListener('click', () => {
    modalImgWrap.classList.toggle('is-zoomed');
  });
}

// Global modal triggers (.gallery-trigger, .cert-view-trigger, .cert-expand-trigger)
document.addEventListener('click', e => {
  const trigger = e.target.closest('.gallery-trigger, .cert-view-trigger, .cert-expand-trigger');
  if (!trigger) return;
  const src = trigger.getAttribute('data-gallery-src');
  const caption = trigger.getAttribute('data-gallery-caption');
  const card = trigger.closest('.cert-card, .project-card, article');
  const img = trigger.querySelector('img') || (card ? card.querySelector('img') : null);
  const altText = img ? img.getAttribute('alt') : '';
  if (src) {
    e.preventDefault();
    openModal(src, caption, altText);
  }
});

// Keyboard accessibility for preview cards
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList.contains('gallery-trigger')) {
    e.preventDefault();
    e.target.click();
  }
});

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener('click', closeModal);
}

// Trap focus inside modal & handle Escape
document.addEventListener('keydown', e => {
  if (!galleryModal || !galleryModal.classList.contains('is-active')) return;

  if (e.key === 'Escape') {
    closeModal();
    return;
  }

  if (e.key === 'Tab') {
    const focusables = Array.from(galleryModal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
});

/* ── 3D Coverflow Work Project Gallery ── */
const workGallery     = document.getElementById('workGallery');
const wgSlides        = Array.from(document.querySelectorAll('.wg-slide'));
const wgDotsWrap      = document.getElementById('wgDots');
const wgSelectorsWrap = document.getElementById('wgSelectors');
const wgPrevBtn       = document.getElementById('wgPrevBtn');
const wgNextBtn       = document.getElementById('wgNextBtn');
const wgStatusPill    = document.getElementById('wgStatusPill');
const wgLiveAnnouncer = document.getElementById('wgLiveAnnouncer');
const wgDetails       = document.getElementById('wgDetails');
const wgBadge         = document.getElementById('wgBadge');
const wgTitle         = document.getElementById('wgTitle');
const wgSubtitle      = document.getElementById('wgSubtitle');
const wgDesc          = document.getElementById('wgDesc');
const wgTech          = document.getElementById('wgTech');
const wgRole          = document.getElementById('wgRole');
const wgDemoLink      = document.getElementById('wgDemoLink');
const wgRepoLink      = document.getElementById('wgRepoLink');

const TECH_ICON_MAP = {
  'React': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="2.2" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/></svg>',
  'Node.js': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2"/><path d="M9.5 9.5v5l5-2.5-5-2.5z"/></svg>',
  'MongoDB': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2C7.5 7 6.5 11.5 8.5 16c1.1 2.4 3.5 4 3.5 4s2.4-1.6 3.5-4c2-4.5 1-9-3.5-14z"/><line x1="12" y1="22" x2="12" y2="14"/></svg>',
  'MapLibre': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z"/><circle cx="12" cy="11" r="2.3"/></svg>',
  'Socket.IO': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polygon points="13 7 8 13 12 13 11 17 16 11 12 11 13 7"/></svg>',
  'Dart': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l8-8 8 8-8 8-8-8z"/></svg>',
  'Flutter': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="14 3 5 12 8.5 15.5 19 5"/><polyline points="11.5 15.5 15 19 19 19 13.5 13.5"/></svg>',
  'Firebase': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M5 18L8.5 4l3.5 6 4-4 3 12-7 4-7-4z"/></svg>',
  'PHP': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="6"/><path d="M8 14l1-4h2a1.5 1.5 0 0 1 0 3H9.5"/></svg>',
  'MySQL': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  'Python': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-4 0-4 2-4 4v2h5v1H6c-2 0-3 1.5-3 4s1 4 3 4h2v-2c0-2 1.5-3 3.5-3h4c1.5 0 2.5-1 2.5-2.5V7c0-2-1.5-4-6-4z"/><path d="M12 21c4 0 4-2 4-4v-2h-5v-1h7c2 0 3-1.5 3-4s-1-4-3-4h-2v2c0 2-1.5 3-3.5 3h-4C7 11 6 12 6 13.5V17c0 2 1.5 4 6 4z"/></svg>',
  'HTML5': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><polygon points="4 3 20 3 18.5 19 12 21 5.5 19 4 3"/></svg>',
  'CSS3': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><polygon points="4 3 20 3 18.5 19 12 21 5.5 19 4 3"/><polyline points="8.5 8 15.5 8 15 15 12 16 9 15"/></svg>',
  'Render': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/></svg>',
  'default': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
};

if (workGallery && wgSlides.length > 0) {
  const totalSlides   = wgSlides.length;
  let activeIdx       = 0;
  let pointerStartX   = null;
  let pointerStartY   = null;
  let didDrag         = false;
  let detailsTimerId  = null;

  const dotButtons = wgSlides.map((slide, idx) => {
    const title = slide.getAttribute('data-title') || `Project ${idx + 1}`;
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = idx === 0 ? 'work-gallery__dot is-active' : 'work-gallery__dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    dot.setAttribute('aria-label', `Slide ${idx + 1}: ${title}`);
    dot.addEventListener('click', () => {
      goToSlide(idx);
    });
    if (wgDotsWrap) wgDotsWrap.appendChild(dot);
    return dot;
  });

  const selectorButtons = wgSlides.map((slide, idx) => {
    const navTitle = slide.getAttribute('data-nav-title') || slide.getAttribute('data-title') || `Project ${idx + 1}`;
    const numStr   = String(idx + 1).padStart(2, '0');
    const btn      = document.createElement('button');
    btn.type = 'button';
    btn.className = idx === 0 ? 'work-gallery__selector-btn is-active' : 'work-gallery__selector-btn';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    btn.innerHTML = `<span class="work-gallery__selector-num">${numStr}</span><span>${navTitle}</span>`;
    btn.addEventListener('click', () => {
      goToSlide(idx);
    });
    if (wgSelectorsWrap) wgSelectorsWrap.appendChild(btn);
    return btn;
  });

  function computePositionTag(index, current, total) {
    let diff = (index - current) % total;
    if (diff < 0) diff += total;
    if (diff > total / 2) diff -= total;
    if (diff === 0) return '0';
    if (diff === -1) return '-1';
    if (diff === 1) return '1';
    if (diff === -2) return '-2';
    if (diff === 2) return '2';
    return 'hidden';
  }

  function renderTechChips(csv) {
    if (!wgTech) return;
    wgTech.innerHTML = '';
    csv
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'work-gallery__tech-chip';
        const iconSvg = TECH_ICON_MAP[tag] || TECH_ICON_MAP.default;
        chip.innerHTML = `${iconSvg}<span>${tag}</span>`;
        wgTech.appendChild(chip);
      });
  }

  function applySlideDataToDOM(slide, idx) {
    const statusText   = slide.getAttribute('data-status') || 'FEATURED PROJECT';
    const badgeText    = slide.getAttribute('data-badge') || 'PROJECT';
    const titleText    = slide.getAttribute('data-title') || '';
    const subtitleText = slide.getAttribute('data-subtitle') || '';
    const descText     = slide.getAttribute('data-desc') || '';
    const techCsv      = slide.getAttribute('data-tech') || '';
    const roleText     = slide.getAttribute('data-role') || 'Full-Stack Developer';
    const demoUrl      = slide.getAttribute('data-demo') || '';
    const repoUrl      = slide.getAttribute('data-repo') || '';

    const paddedCurrent = String(idx + 1).padStart(2, '0');
    const paddedTotal   = String(totalSlides).padStart(2, '0');
    if (wgStatusPill) {
      wgStatusPill.textContent = `${statusText} \u00B7 ${paddedCurrent} / ${paddedTotal}`;
    }

    if (wgBadge) wgBadge.textContent = badgeText;
    if (wgTitle) wgTitle.textContent = titleText;
    if (wgSubtitle) wgSubtitle.textContent = subtitleText;
    if (wgDesc) wgDesc.textContent = descText;
    if (wgRole) wgRole.textContent = roleText;

    renderTechChips(techCsv);

    if (wgDemoLink) {
      if (demoUrl) {
        wgDemoLink.href = demoUrl;
        if (demoUrl.startsWith('#')) {
          wgDemoLink.removeAttribute('target');
          wgDemoLink.removeAttribute('rel');
        } else {
          wgDemoLink.setAttribute('target', '_blank');
          wgDemoLink.setAttribute('rel', 'noopener noreferrer');
        }
        wgDemoLink.classList.remove('is-hidden');
      } else {
        wgDemoLink.classList.add('is-hidden');
      }
    }

    if (wgRepoLink) {
      if (repoUrl) {
        wgRepoLink.href = repoUrl;
        wgRepoLink.classList.remove('is-hidden');
      } else {
        wgRepoLink.classList.add('is-hidden');
      }
    }

    if (wgLiveAnnouncer) {
      wgLiveAnnouncer.textContent = `Showing project ${idx + 1} of ${totalSlides}: ${titleText}`;
    }
  }

  function updateActiveDetails(slide, idx, immediate = false) {
    if (!wgDetails) return;
    if (detailsTimerId) {
      clearTimeout(detailsTimerId);
      detailsTimerId = null;
    }

    if (immediate) {
      applySlideDataToDOM(slide, idx);
      wgDetails.classList.remove('is-switching');
      return;
    }

    wgDetails.classList.add('is-switching');
    detailsTimerId = setTimeout(() => {
      applySlideDataToDOM(slide, idx);
      wgDetails.classList.remove('is-switching');
      detailsTimerId = null;
    }, 145);
  }

  function goToSlide(targetIndex, immediate = false) {
    const nextIdx = ((targetIndex % totalSlides) + totalSlides) % totalSlides;
    if (!immediate && nextIdx === activeIdx) return;
    activeIdx = nextIdx;

    wgSlides.forEach((slide, idx) => {
      const pos = computePositionTag(idx, activeIdx, totalSlides);
      slide.setAttribute('data-pos', pos);
      slide.setAttribute('tabindex', pos === '0' ? '0' : '-1');
      slide.setAttribute('aria-hidden', pos === 'hidden' ? 'true' : 'false');
    });

    dotButtons.forEach((dot, idx) => {
      const isAct = idx === activeIdx;
      dot.classList.toggle('is-active', isAct);
      dot.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });

    selectorButtons.forEach((btn, idx) => {
      const isAct = idx === activeIdx;
      btn.classList.toggle('is-active', isAct);
      btn.setAttribute('aria-selected', isAct ? 'true' : 'false');
    });

    updateActiveDetails(wgSlides[activeIdx], activeIdx, immediate);
  }

  // Initialize first slide chips & status
  goToSlide(0, true);

  function openActiveSlideModal() {
    const currentSlide = wgSlides[activeIdx];
    if (!currentSlide) return;
    const src     = currentSlide.getAttribute('data-gallery-src');
    const caption = currentSlide.getAttribute('data-gallery-caption');
    const img     = currentSlide.querySelector('img');
    const altText = img ? img.getAttribute('alt') : '';
    if (src) openModal(src, caption, altText);
  }

  wgSlides.forEach((slide, idx) => {
    slide.addEventListener('click', e => {
      if (didDrag) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (idx === activeIdx) {
        openActiveSlideModal();
      } else {
        goToSlide(idx);
      }
    });

    slide.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (idx === activeIdx) {
          openActiveSlideModal();
        } else {
          goToSlide(idx);
        }
      }
    });
  });

  if (wgPrevBtn) {
    wgPrevBtn.addEventListener('click', () => {
      goToSlide(activeIdx - 1);
    });
  }

  if (wgNextBtn) {
    wgNextBtn.addEventListener('click', () => {
      goToSlide(activeIdx + 1);
    });
  }

  // Keyboard navigation when focus is inside carousel or selector bar
  const projectsSection = document.getElementById('projects');
  if (projectsSection) {
    projectsSection.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const withinCarousel = workGallery.contains(document.activeElement) ||
        (wgSelectorsWrap && wgSelectorsWrap.contains(document.activeElement));
      if (!withinCarousel) return;
      e.preventDefault();
      if (e.key === 'ArrowRight') {
        goToSlide(activeIdx + 1);
      } else if (e.key === 'ArrowLeft') {
        goToSlide(activeIdx - 1);
      }
    });
  }

  // Touch & horizontal mouse dragging with threshold + accidental click suppression
  workGallery.addEventListener('pointerdown', e => {
    if (e.target.closest('button, a')) return;
    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    didDrag = false;
  });

  workGallery.addEventListener('pointermove', e => {
    if (pointerStartX === null || pointerStartY === null) return;
    const dx = Math.abs(e.clientX - pointerStartX);
    const dy = Math.abs(e.clientY - pointerStartY);
    if (dx > 12 && dx > dy) {
      didDrag = true;
    }
  });

  workGallery.addEventListener('pointerup', e => {
    if (pointerStartX === null) return;
    const deltaX = e.clientX - pointerStartX;
    const deltaY = pointerStartY !== null ? Math.abs(e.clientY - pointerStartY) : 0;
    pointerStartX = null;
    pointerStartY = null;

    if (Math.abs(deltaX) >= 40 && Math.abs(deltaX) > deltaY) {
      didDrag = true;
      if (deltaX < 0) goToSlide(activeIdx + 1);
      else goToSlide(activeIdx - 1);
      setTimeout(() => {
        didDrag = false;
      }, 80);
    } else {
      setTimeout(() => {
        didDrag = false;
      }, 0);
    }
  });

  workGallery.addEventListener('pointercancel', () => {
    pointerStartX = null;
    pointerStartY = null;
    didDrag = false;
  });
}

/* ── Editorial Hero Animations (Staggered PORTFOLIO, Letter-by-Letter Name & Role Typewriter) ── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroBgChars = document.querySelectorAll('#heroBgWord .hero__bg-char');
heroBgChars.forEach((charEl, idx) => {
  charEl.style.setProperty('--bg-char-index', String(idx));
});

const heroSection = document.querySelector('.hero');

const heroRoleText = document.getElementById('heroRoleText');

if (heroRoleText) {
  if (prefersReducedMotion) {
    heroRoleText.textContent = 'ASPIRING FULL-STACK DEVELOPER';
  } else {
    const PHRASES = [
      'ASPIRING FULL-STACK DEVELOPER',
      'MUSIC ENTHUSIAST',
      'NATURE PHOTOGRAPHER'
    ];
    const TYPE_SPEED = 75;
    const DELETE_SPEED = 40;
    const HOLD_TIME = 2500;
    const PAUSE_EMPTY = 400;

    let phraseIdx = 0;
    let charIdx = PHRASES[0].length;
    let isDeleting = false;
    let roleTimer = null;
    let isHeroVisible = true;
    let isTabVisible = !document.hidden;

    // Start with the complete initial phrase
    heroRoleText.textContent = PHRASES[0];

    function scheduleNext(delay) {
      clearTimeout(roleTimer);
      if (!isHeroVisible || !isTabVisible) {
        roleTimer = null;
        return;
      }
      roleTimer = setTimeout(tickRole, delay);
    }

    function tickRole() {
      const currentPhrase = PHRASES[phraseIdx];

      if (!isDeleting) {
        // Typing forward
        if (charIdx < currentPhrase.length) {
          charIdx++;
          heroRoleText.textContent = currentPhrase.slice(0, charIdx);
          scheduleNext(TYPE_SPEED);
        } else {
          // Finished typing phrase, hold for 2.5 seconds
          isDeleting = true;
          scheduleNext(HOLD_TIME);
        }
      } else {
        // Deleting backward
        if (charIdx > 0) {
          charIdx--;
          heroRoleText.textContent = currentPhrase.slice(0, charIdx);
          scheduleNext(DELETE_SPEED);
        } else {
          // Finished deleting, transition to next phrase
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % PHRASES.length;
          scheduleNext(PAUSE_EMPTY);
        }
      }
    }

    // Schedule initial deletion after holding phrase 0 for 2.5s
    scheduleNext(HOLD_TIME);

    // Sync animation state when tab or hero visibility toggles
    function syncHeroAnimationState() {
      const shouldRun = isHeroVisible && isTabVisible;
      if (heroSection) {
        heroSection.classList.toggle('is-paused', !shouldRun);
      }
      if (shouldRun) {
        if (!roleTimer) {
          scheduleNext(TYPE_SPEED);
        }
      } else {
        if (roleTimer) {
          clearTimeout(roleTimer);
          roleTimer = null;
        }
      }
    }

    // Tab visibility listener
    document.addEventListener('visibilitychange', () => {
      isTabVisible = !document.hidden;
      syncHeroAnimationState();
    });

    // Viewport intersection listener
    if (heroSection) {
      const heroObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            isHeroVisible = entry.isIntersecting;
            syncHeroAnimationState();
          });
        },
        { threshold: 0.08 }
      );
      heroObserver.observe(heroSection);
    }
  }
}

/* ── About Section One-Time Reveal & Off-Screen Animation Pause ── */
const aboutSection = document.getElementById('about');
const aboutRevealEls = document.querySelectorAll('[data-about-reveal]');

if (aboutRevealEls.length > 0) {
  if (prefersReducedMotion) {
    aboutRevealEls.forEach(el => el.classList.add('is-revealed'));
  } else {
    const aboutRevealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );
    aboutRevealEls.forEach(el => aboutRevealObserver.observe(el));
  }
}

if (aboutSection && !prefersReducedMotion) {
  const aboutVisibilityObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        aboutSection.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0.02 }
  );
  aboutVisibilityObserver.observe(aboutSection);
}

/* ── Work Gallery One-Time Reveal & Off-Screen Animation Pause ── */
const projectsSectionEl = document.getElementById('projects');
const wgRevealEls = document.querySelectorAll('[data-wg-reveal]');

if (wgRevealEls.length > 0) {
  if (prefersReducedMotion) {
    wgRevealEls.forEach(el => el.classList.add('is-revealed'));
  } else {
    const wgRevealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );
    wgRevealEls.forEach(el => wgRevealObserver.observe(el));
  }
}

if (projectsSectionEl && !prefersReducedMotion) {
  const wgVisibilityObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        projectsSectionEl.classList.toggle('is-visible', entry.isIntersecting);
      });
    },
    { threshold: 0.02 }
  );
  wgVisibilityObserver.observe(projectsSectionEl);
}

/* ── Unified Page Scroll Progress Bar & Reveal Orchestration ── */
const progressBar = document.getElementById('scrollProgressBar');
let cachedViewportHeight = window.innerHeight;
let cachedDocHeight = Math.max(1, document.documentElement.scrollHeight - cachedViewportHeight);
let cachedParallaxItems = [];

function refreshScrollMetrics() {
  cachedViewportHeight = window.innerHeight;
  cachedDocHeight = Math.max(1, document.documentElement.scrollHeight - cachedViewportHeight);

  if (!prefersReducedMotion && window.innerWidth > 860) {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    cachedParallaxItems = Array.from(document.querySelectorAll(
      '.about__ambient, .about__orbit, .skills__ambient, .skills__orbit, .certificates__ambient, .certificates__orbit, .hero__bg-word'
    )).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        centerDocY: rect.top + scrollTop + (rect.height / 2)
      };
    });
  } else {
    cachedParallaxItems = [];
  }
}

window.addEventListener('resize', refreshScrollMetrics, { passive: true });
window.addEventListener('orientationchange', refreshScrollMetrics, { passive: true });
refreshScrollMetrics();

// Tab Visibility API: pause decorative animations when tab is backgrounded
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('tab-hidden', document.hidden);
});

let scrollFrameActive = false;
function onScrollTick() {
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;

  // 1. GPU-accelerated progress bar (no layout thrashing, pure compositor scaleX)
  if (progressBar && cachedDocHeight > 0) {
    const progress = Math.min(1, Math.max(0, scrollY / cachedDocHeight));
    progressBar.style.transform = `scaleX(${progress})`;
  }

  // 2. Parallax: pure arithmetic with cached document positions (zero getBoundingClientRect on scroll)
  if (cachedParallaxItems.length > 0) {
    const viewportCenter = scrollY + (cachedViewportHeight / 2);
    for (let i = 0; i < cachedParallaxItems.length; i++) {
      const item = cachedParallaxItems[i];
      const centerDiff = item.centerDocY - viewportCenter;
      if (Math.abs(centerDiff) <= cachedViewportHeight * 1.1) {
        const shift = Math.max(-15, Math.min(15, centerDiff * -0.035));
        item.el.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
      }
    }
  }

  scrollFrameActive = false;
}

window.addEventListener('scroll', () => {
  if (!scrollFrameActive) {
    window.requestAnimationFrame(onScrollTick);
    scrollFrameActive = true;
  }
}, { passive: true });

onScrollTick();

// Progressive Enhancement Flag
document.documentElement.classList.add('anim-ready');

// Stagger Index Initialization for Words across all sections
document.querySelectorAll('.about-word, .wg-word, .po-word, .skills-word, .cert-word, .contact-word').forEach(word => {
  const idx = word.getAttribute('data-word-idx') || '0';
  word.style.setProperty('--word-idx', idx);
});

// Stagger Index Initialization for Cards (80ms spacing)
document.querySelectorAll('.about__card, .contact__card').forEach((card, idx) => {
  if (!card.hasAttribute('data-item-idx')) {
    card.setAttribute('data-item-idx', String(idx % 4));
  }
  const itemIdx = card.getAttribute('data-item-idx') || String(idx % 4);
  card.style.setProperty('--item-idx', itemIdx);
});

// Unified 15% Viewport Entrance Observer (play once, settle smoothly)
const revealTargetSelectors = [
  '.about__header-row',
  '.about__statement-card',
  '.about__story-col',
  '.about__card',
  '.work-gallery__header',
  '.work-gallery-wrap',
  '.contact__header',
  '.contact__card',
  '.site-footer'
];

const unifiedRevealElements = document.querySelectorAll(revealTargetSelectors.join(', '));
if (unifiedRevealElements.length > 0) {
  if (prefersReducedMotion) {
    unifiedRevealElements.forEach(el => el.classList.add('is-revealed'));
  } else {
    const unifiedObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
            if (entry.target.classList.contains('contact__card')) {
              setTimeout(() => {
                entry.target.style.transitionDelay = '0ms';
              }, 1000);
            }
          }
        });
      },
      { threshold: 0.15 }
    );

    unifiedRevealElements.forEach(el => unifiedObserver.observe(el));
  }
}

/* ── All Projects Overview Showcase Interactions & Scroll Reveals ── */
const projectsOverviewEl = document.getElementById('projects-overview');
if (projectsOverviewEl) {
  // Stagger index setup for header words
  const poWords = projectsOverviewEl.querySelectorAll('.po-word');
  poWords.forEach(word => {
    const idx = word.getAttribute('data-word-idx') || '0';
    word.style.setProperty('--word-idx', idx);
  });

  // Stagger index setup for tech chips and letter-by-letter project titles
  const poPanels = Array.from(projectsOverviewEl.querySelectorAll('[data-po-panel]'));
  poPanels.forEach(panel => {
    const titleEl = panel.querySelector('[data-po-title]');
    if (titleEl) {
      const titleText = titleEl.getAttribute('data-po-title') || titleEl.textContent.trim();
      titleEl.innerHTML = '';
      titleText.split('').forEach((char, cIdx) => {
        const span = document.createElement('span');
        if (char === ' ') {
          span.className = 'po-title-char po-title-char--space';
          span.innerHTML = '&nbsp;';
        } else {
          span.className = 'po-title-char';
          span.textContent = char;
        }
        span.style.setProperty('--char-idx', String(cIdx));
        span.setAttribute('aria-hidden', 'true');
        titleEl.appendChild(span);
      });
      // Accessible screen-reader text
      const srSpan = document.createElement('span');
      srSpan.className = 'sr-only';
      srSpan.textContent = titleText;
      titleEl.appendChild(srSpan);
    }

    const techTags = panel.querySelectorAll('.tech-tag');
    techTags.forEach((tag, tIdx) => {
      tag.style.setProperty('--chip-idx', String(tIdx));
    });

    // Main screenshot click opens modal
    const mainImg = panel.querySelector('.project-featured__main-img');
    const expandBtn = panel.querySelector('.project-featured__expand-btn');

    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        const src = expandBtn.getAttribute('data-gallery-src');
        const caption = expandBtn.getAttribute('data-gallery-caption');
        const alt = mainImg ? mainImg.getAttribute('alt') : '';
        if (src) openModal(src, caption, alt);
      });
    }

    if (mainImg) {
      mainImg.addEventListener('click', () => {
        if (expandBtn) {
          expandBtn.click();
        } else {
          openModal(mainImg.src, mainImg.getAttribute('alt'), mainImg.getAttribute('alt'));
        }
      });
    }

    // Slides & Photo Navigation (Arrows & Thumbnails)
    let slides = [];
    const rawSlides = panel.getAttribute('data-slides');
    if (rawSlides) {
      try {
        slides = JSON.parse(rawSlides);
      } catch (err) {
        slides = [];
      }
    }

    let currentSlideIdx = 0;
    const prevArrow = panel.querySelector('[data-po-prev]');
    const nextArrow = panel.querySelector('[data-po-next]');
    const slideCounter = panel.querySelector('[data-po-slide-counter]');
    const thumbs = Array.from(panel.querySelectorAll('.project-thumb'));

    function goToSlide(newIdx) {
      if (!slides || slides.length === 0) return;
      currentSlideIdx = (newIdx + slides.length) % slides.length;
      const targetSlide = slides[currentSlideIdx];
      if (!targetSlide || !mainImg) return;

      // Update counter text e.g. 01 / 03
      if (slideCounter) {
        const cPadded = String(currentSlideIdx + 1).padStart(2, '0');
        const tPadded = String(slides.length).padStart(2, '0');
        slideCounter.textContent = `${cPadded} / ${tPadded}`;
      }

      // Update active state on thumbnails
      thumbs.forEach(t => {
        const tIdx = parseInt(t.getAttribute('data-slide-target'), 10);
        const isActive = tIdx === currentSlideIdx;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      // Switch main image with crossfade
      if (prefersReducedMotion) {
        mainImg.src = targetSlide.src;
        mainImg.alt = targetSlide.alt || '';
        if (expandBtn) {
          expandBtn.setAttribute('data-gallery-src', targetSlide.src);
          expandBtn.setAttribute('data-gallery-caption', targetSlide.caption || '');
        }
      } else {
        mainImg.classList.add('is-fading');
        setTimeout(() => {
          mainImg.src = targetSlide.src;
          mainImg.alt = targetSlide.alt || '';
          if (expandBtn) {
            expandBtn.setAttribute('data-gallery-src', targetSlide.src);
            expandBtn.setAttribute('data-gallery-caption', targetSlide.caption || '');
          }
          mainImg.classList.remove('is-fading');
        }, 180);
      }
    }

    if (prevArrow) {
      prevArrow.addEventListener('click', () => {
        goToSlide(currentSlideIdx - 1);
      });
    }

    if (nextArrow) {
      nextArrow.addEventListener('click', () => {
        goToSlide(currentSlideIdx + 1);
      });
    }

    // Thumbnail click switches main screenshot preview
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        const target = parseInt(thumb.getAttribute('data-slide-target'), 10);
        if (!isNaN(target)) {
          goToSlide(target);
        }
      });
    });
  });

  // Enable animation classes
  projectsOverviewEl.classList.add('po-anim-ready');

  // Reveal header & panels when ~20% visible
  const poHeader = projectsOverviewEl.querySelector('[data-po-header]');
  if (poHeader) {
    if (prefersReducedMotion) {
      poHeader.classList.add('is-revealed');
    } else {
      const headerObs = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              poHeader.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      headerObs.observe(poHeader);
    }
  }

  const poCounterEl = document.getElementById('poProjectCounter');
  const showcaseItems = Array.from(projectsOverviewEl.querySelectorAll('.project-showcase-item'));
  const totalItems = showcaseItems.length;

  if (prefersReducedMotion) {
    showcaseItems.forEach(item => {
      const panel = item.querySelector('[data-po-panel]');
      if (panel) panel.classList.add('is-revealed');
    });
  } else {
    const panelObs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    showcaseItems.forEach(item => {
      const panel = item.querySelector('[data-po-panel]');
      if (panel) panelObs.observe(panel);
    });
  }

  // Counter synchronization on scroll (single shared observer)
  if (poCounterEl && totalItems > 0) {
    const counterObs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const itemIdx = Number(entry.target.getAttribute('data-project-index') || 0);
            const currentPadded = String(itemIdx + 1).padStart(2, '0');
            const totalPadded = String(totalItems).padStart(2, '0');
            poCounterEl.textContent = `${currentPadded} / ${totalPadded}`;
          }
        });
      },
      { threshold: 0.4 }
    );
    showcaseItems.forEach(item => counterObs.observe(item));
  }
}

/* ── Skills & Technologies Interactions & Scroll Reveals ── */
const skillsSection = document.getElementById('skills');
if (skillsSection) {
  // Stagger index setup for header words
  const skillsWords = skillsSection.querySelectorAll('.skills-word');
  skillsWords.forEach(word => {
    const idx = word.getAttribute('data-word-idx') || '0';
    word.style.setProperty('--word-idx', idx);
  });

  // Stagger index setup for skill tiles within each card
  const skillCards = Array.from(skillsSection.querySelectorAll('[data-skill-card]'));
  skillCards.forEach((card, cardIdx) => {
    card.style.setProperty('--card-idx', String(cardIdx));

    const tiles = card.querySelectorAll('[data-skill-tile]');
    tiles.forEach((tile, tileIdx) => {
      tile.style.setProperty('--tile-idx', String(tileIdx));
    });

    // Pointer-following burgundy spotlight on precise pointer devices
    if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
      card.addEventListener('pointermove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--spot-x', `${x}px`);
        card.style.setProperty('--spot-y', `${y}px`);
      });

      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--spot-x', '-500px');
        card.style.setProperty('--spot-y', '-500px');
      });
    }
  });

  // Enable animation classes
  skillsSection.classList.add('skills-anim-ready');

  // Reveal header when ~20% visible
  const skillsHeader = skillsSection.querySelector('[data-skills-header]');
  if (skillsHeader) {
    if (prefersReducedMotion) {
      skillsHeader.classList.add('is-revealed');
    } else {
      const headerObs = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              skillsHeader.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      headerObs.observe(skillsHeader);
    }
  }

  // Reveal each category card when ~20% visible
  if (prefersReducedMotion) {
    skillCards.forEach(card => card.classList.add('is-revealed'));
  } else {
    const cardObs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    skillCards.forEach(card => cardObs.observe(card));
  }

  // Pause decorative animations when off-screen
  if (!prefersReducedMotion) {
    const skillsVisibilityObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          skillsSection.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.02 }
    );
    skillsVisibilityObserver.observe(skillsSection);
  }
}

/* ── Certificates & Credentials Interactions & Scroll Reveals ── */
const certificatesSection = document.getElementById('certificates');
if (certificatesSection) {
  // Stagger index setup for header words
  const certWords = certificatesSection.querySelectorAll('.cert-word');
  certWords.forEach(word => {
    const idx = word.getAttribute('data-word-idx') || '0';
    word.style.setProperty('--word-idx', idx);
  });

  // Calculate certificate count dynamically
  const certCards = Array.from(certificatesSection.querySelectorAll('[data-cert-card]'));
  const certCountText = document.getElementById('certCountText');
  const certCounterBadge = document.getElementById('certCounterBadge');
  if (certCountText && certCards.length > 0) {
    const countFormatted = String(certCards.length).padStart(2, '0');
    certCountText.textContent = `${countFormatted} certificates`;
    if (certCounterBadge) {
      certCounterBadge.setAttribute('aria-label', `${countFormatted} certificates`);
    }
  }

  // Setup card indexes
  certCards.forEach((card, cardIdx) => {
    card.style.setProperty('--card-idx', String(cardIdx));
  });

  // Enable animation classes
  certificatesSection.classList.add('cert-anim-ready');

  // Reveal header when ~20% visible
  const certHeader = certificatesSection.querySelector('[data-certificates-header]');
  if (certHeader) {
    if (prefersReducedMotion) {
      certHeader.classList.add('is-revealed');
    } else {
      const headerObs = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              certHeader.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      headerObs.observe(certHeader);
    }
  }

  // Reveal each certificate card when ~20% visible
  if (prefersReducedMotion) {
    certCards.forEach(card => card.classList.add('is-revealed'));
  } else {
    const certCardObs = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    certCards.forEach(card => certCardObs.observe(card));
  }

  // Pause decorative animations when off-screen
  if (!prefersReducedMotion) {
    const certVisibilityObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          certificatesSection.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.02 }
    );
    certVisibilityObserver.observe(certificatesSection);
  }
}

// Smart Email handler: mobile devices use mailto: to launch native mail apps, desktop uses web compose
const emailContactCard = document.querySelector('[data-contact-email]');
if (emailContactCard) {
  emailContactCard.addEventListener('click', (e) => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      e.preventDefault();
      window.location.href = 'mailto:mahalalilvillaflores@gmail.com';
    }
  });
}


