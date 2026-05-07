/* ============================================================
   The Golden Fry — site script
   Features: i18n, mobile nav, popup (once/visit), cookie notice,
             gallery lightbox, blog carousel, contact form, scroll header
   ============================================================ */

(function () {
  'use strict';

  /* ----------- Helpers ----------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ============== Year in footer ============== */
  $('#year').textContent = new Date().getFullYear();

  /* ============== i18n ============== */
  const SUPPORTED = ['en', 'fr', 'nl'];
  const STORAGE_KEY = 'tgf_lang';

  function detectLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return SUPPORTED.includes(nav) ? nav : 'en';
  }

  function applyLanguage(lang) {
    if (!translations[lang]) lang = 'en';
    const dict = translations[lang];

    // text content
    $$('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    // placeholders
    $$('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] != null) el.setAttribute('placeholder', dict[key]);
    });
    // <title> & meta description
    if (dict['meta.title']) document.title = dict['meta.title'];
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict['meta.desc']) metaDesc.setAttribute('content', dict['meta.desc']);

    // <html lang>
    document.documentElement.setAttribute('lang', lang);

    // toggle aria-pressed
    $$('.lang-btn').forEach(btn => {
      btn.setAttribute('aria-pressed', btn.dataset.lang === lang ? 'true' : 'false');
    });

    localStorage.setItem(STORAGE_KEY, lang);
    currentLang = lang;
  }

  let currentLang = detectLang();
  applyLanguage(currentLang);

  $$('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
  });

  /* ============== Mobile nav ============== */
  const navToggle = $('#navToggle');
  const mainNav   = $('#mainNav');

  navToggle.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // close on link click (mobile)
  $$('.main-nav a').forEach(a => {
    a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ============== Header scroll state ============== */
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ============== Popup once per visit (sessionStorage) ============== */
  const POPUP_KEY = 'tgf_popup_shown';
  const modal     = $('#welcomeModal');

  function openModal() {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  // Show only once per browsing session (visit)
  if (!sessionStorage.getItem(POPUP_KEY)) {
    setTimeout(() => {
      openModal();
      sessionStorage.setItem(POPUP_KEY, '1');
    }, 1500);
  }
  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
  $('#popupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    closeModal();
  });

  /* ============== Cookie notice ============== */
  const COOKIE_KEY = 'tgf_cookies';
  const cookieEl = $('#cookieNotice');

  if (!localStorage.getItem(COOKIE_KEY)) {
    setTimeout(() => cookieEl.classList.add('show'), 800);
  }
  $('#cookieAccept').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    cookieEl.classList.remove('show');
  });
  $('#cookieDecline').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    cookieEl.classList.remove('show');
  });

  /* ============== Gallery lightbox ============== */
  const galleryItems = $$('.gallery-item');
  const lightbox     = $('#lightbox');
  const lbImg        = $('#lightboxImg');
  const lbCap        = $('#lightboxCaption');
  let   lbIndex      = 0;

  function openLightbox(i) {
    lbIndex = i;
    const item = galleryItems[i];
    const img  = $('img', item);
    const cap  = $('figcaption', item);
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCap.textContent = cap ? cap.textContent : '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function navLightbox(dir) {
    lbIndex = (lbIndex + dir + galleryItems.length) % galleryItems.length;
    openLightbox(lbIndex);
  }

  galleryItems.forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });
  $('#lightboxClose').addEventListener('click', closeLightbox);
  $('#lightboxPrev').addEventListener('click', () => navLightbox(-1));
  $('#lightboxNext').addEventListener('click', () => navLightbox(1));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowRight')  navLightbox(1);
    if (e.key === 'ArrowLeft')   navLightbox(-1);
  });

  /* ============== Blog carousel ============== */
  const track  = $('#carouselTrack');
  const slides = $$('.carousel-slide', track);
  const dotsEl = $('#carouselDots');
  let cIndex   = 0;

  // build dots
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Slide ' + (i + 1));
    b.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(b);
  });
  const dots = $$('button', dotsEl);

  function goTo(i) {
    cIndex = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${cIndex * 100}%)`;
    dots.forEach((d, idx) => d.classList.toggle('active', idx === cIndex));
  }
  goTo(0);

  $('#carouselPrev').addEventListener('click', () => goTo(cIndex - 1));
  $('#carouselNext').addEventListener('click', () => goTo(cIndex + 1));

  // auto-advance
  let auto = setInterval(() => goTo(cIndex + 1), 6000);
  const carouselEl = $('#carousel');
  carouselEl.addEventListener('mouseenter', () => clearInterval(auto));
  carouselEl.addEventListener('mouseleave', () => {
    auto = setInterval(() => goTo(cIndex + 1), 6000);
  });

  // touch swipe
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) goTo(cIndex + (dx < 0 ? 1 : -1));
  });

  /* ============== Contact form ============== */
  const form   = $('#contactForm');
  const status = $('#formStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dict = translations[currentLang] || translations.en;

    const name    = $('#name').value.trim();
    const email   = $('#email').value.trim();
    const message = $('#message').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !emailOk || !message) {
      status.textContent = dict['contact.error'];
      status.className   = 'form-status error';
      return;
    }
    status.textContent = dict['contact.success'];
    status.className   = 'form-status success';
    form.reset();
    setTimeout(() => { status.textContent = ''; status.className = 'form-status'; }, 5000);
  });

})();
