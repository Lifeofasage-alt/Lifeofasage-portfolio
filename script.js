// === Theme toggle (dark / light) =====================================
(function(){
  const root = document.documentElement;
  const btn  = document.getElementById('themeToggle');

  // 1) Pick saved theme or system preference
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');

  setTheme(initial);

  // 2) Click to toggle
  if (btn) {
    btn.addEventListener('click', () => {
      const next = (root.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
      setTheme(next);
    });
  }

  // Helpers
  function setTheme(theme){
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
      updateToggle(false); // false = not pressed (means "switch to dark")
    } else {
      root.setAttribute('data-theme', 'dark');
      updateToggle(true);  // true  = pressed (means "switch to light")
    }
    localStorage.setItem('theme', theme);
  }

  function updateToggle(isDark){
    if (!btn) return;
    // isDark == current theme is dark
    // show opposite icon as an affordance
    btn.textContent = isDark ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', String(isDark));
    // Optional: tweak border for visibility
    btn.style.borderColor = isDark ? '#333' : '#e0e0ea';
  }
})();


// ===== Mobile menu toggle =====
const menuBtn = document.getElementById('menuBtn');
const siteMenu = document.getElementById('site-menu');

if (menuBtn && siteMenu) {
  menuBtn.addEventListener('click', () => {
    const isOpen = siteMenu.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(isOpen));
  });

  siteMenu.addEventListener('click', (e) => {
    if (e.target.matches('a[href^="#"]')) {
      siteMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  const MQ = window.matchMedia('(min-width: 801px)');
  MQ.addEventListener?.('change', () => {
    if (MQ.matches) {
      siteMenu.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===== Active section highlighter =====
const navLinks = Array.from(document.querySelectorAll('.menu a[href^="#"]'));
const sections = navLinks
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);

if (sections.length && navLinks.length) {
  const byId = Object.fromEntries(navLinks.map(a => [a.getAttribute('href'), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = '#' + entry.target.id;
      const link = byId[id];
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, {
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0.01
  });

  sections.forEach(sec => io.observe(sec));
}

// ===== Footer year =====
const yearSpan = document.getElementById('year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();
// === Mobile drawer + active-section highlight =========================
(function(){
  const menuBtn = document.getElementById('menuBtn');
  const menu    = document.getElementById('site-menu');

  if (!menuBtn || !menu) return;

  // Create backdrop overlay once
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  document.body.appendChild(backdrop);

  const openMenu = () => {
    menu.classList.add('open');
    document.body.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    backdrop.classList.add('show');
  };
  const closeMenu = () => {
    menu.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    backdrop.classList.remove('show');
  };
  const toggleMenu = () => (menu.classList.contains('open') ? closeMenu() : openMenu());

  menuBtn.addEventListener('click', toggleMenu);
  backdrop.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
  // Close after clicking a link (use event delegation)
  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a) closeMenu();
  });

  // ----- Active section highlight (scroll spy)
  const links = Array.from(menu.querySelectorAll('a[href^="#"]'));
  const linkMap = new Map(
    links.map(a => [a.getAttribute('href').slice(1), a])
  );
  const sections = Array.from(document.querySelectorAll('main section[id]'));

  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = linkMap.get(id);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, {
    rootMargin: '-40% 0px -50% 0px',  // activates around mid viewport
    threshold: 0.01
  });

  sections.forEach(sec => spy.observe(sec));
})();
// === Scroll reveal (micro-interactions) ===============================
(function(){
  // Choose what to reveal (keep it simple & lightweight)
  const targets = document.querySelectorAll(
    '.card, .directory-card, .skill, .about-copy, .hero-text'
  );
  if (!targets.length) return;

  targets.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver((entries, o) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        o.unobserve(entry.target); // reveal only once
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(el => obs.observe(el));
})();
// === Nav: set "Home" active on first load & improve focus styles =====
(function(){
  const menu = document.getElementById('site-menu');
  if (!menu) return;

  // 1) Set Home active initially (before scroll observers kick in)
  const homeLink = menu.querySelector('a[href="#home"]');
  if (homeLink) {
    // remove any existing active
    menu.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    homeLink.classList.add('active');
  }

  // 2) Add a visible focus ring for keyboard users (JS adds a class to body)
  function setKeyboardMode(e){
    if (e.key === 'Tab') document.body.classList.add('kbd-nav');
  }
  window.addEventListener('keydown', setKeyboardMode, { once: true });
})();
// === Contact form: show success note on ?sent=1 ======================
(function(){
  const params = new URLSearchParams(location.search);
  const sent = params.get('sent');
  if (sent === '1') {
    const contact = document.querySelector('#contact .section, #contact') || document.getElementById('contact');
    const form = document.querySelector('#contact .contact-form');
    if (contact || form) {
      const host = (form || contact);
      const note = document.createElement('div');
      note.className = 'alert';
      note.textContent = '✅ Message sent! I’ll get back to you soon.';
      host.parentNode.insertBefore(note, host); // show above the form
    }
    // Optional: clean the URL so ?sent=1 disappears on refresh
    if (history.replaceState) {
      const clean = location.href.replace(/\?sent=1/, '').replace(/#contact$/, '');
      history.replaceState({}, '', clean + '#contact');
    }
  }
})();
// === Nav: set "Home" active on first load & improve focus styles =====
(function(){
  const menu = document.getElementById('site-menu');
  if (!menu) return;

  // 1) Set Home active initially (before scroll observers kick in)
  const homeLink = menu.querySelector('a[href="#home"]');
  if (homeLink) {
    // remove any existing active
    menu.querySelectorAll('a').forEach(a => a.classList.remove('active'));
    homeLink.classList.add('active');
  }

  // 2) Add a visible focus ring for keyboard users (JS adds a class to body)
  function setKeyboardMode(e){
    if (e.key === 'Tab') document.body.classList.add('kbd-nav');
  }
  window.addEventListener('keydown', setKeyboardMode, { once: true });
})();
// === Back to Top ======================================================
(function(){
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  const THRESHOLD = 400; // show after 400px scrolled
  let ticking = false;

  function onScroll(){
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > THRESHOLD) {
          btn.classList.add('show');
        } else {
          btn.classList.remove('show');
        }
        ticking = false;
      });
      ticking = true;
    }
  }

  // Smooth scroll to top (uses browser smooth if enabled in CSS)
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.blur(); // remove focus ring after click
  });

  // Init + listen
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
// === Contact form: lightweight validation + success message ===
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const sendBtn = document.getElementById('sendBtn');
  const alertBox = document.getElementById('formAlert');
  const fields = [
    { el: document.getElementById('name'),    errEl: document.getElementById('name-error'),    min: 2,  label: 'Name' },
    { el: document.getElementById('email'),   errEl: document.getElementById('email-error'),   type: 'email', label: 'Email' },
    { el: document.getElementById('message'), errEl: document.getElementById('message-error'), min: 10, label: 'Message' },
  ];

  // Helpers
  function showError(field, msg) {
    field.el.classList.add('is-invalid');
    field.el.classList.remove('is-valid');
    if (field.errEl) field.errEl.textContent = msg || 'This field is required.';
  }
  function clearError(field) {
    field.el.classList.remove('is-invalid');
    field.el.classList.remove('is-valid'); // reset until we confirm valid
    if (field.errEl) field.errEl.textContent = '';
  }
  function markValid(field) {
    field.el.classList.remove('is-invalid');
    field.el.classList.add('is-valid');
    if (field.errEl) field.errEl.textContent = '';
  }
  function isEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  // Live input feedback
  fields.forEach(f => {
    f.el.addEventListener('input', () => {
      const v = f.el.value.trim();
      if (!v) return clearError(f);
      if (f.type === 'email' && !isEmail(v)) {
        showError(f, 'Please enter a valid email.');
      } else if (f.min && v.length < f.min) {
        showError(f, `${f.label} must be at least ${f.min} characters.`);
      } else {
        markValid(f);
      }
    });
  });

  // Prevent double submit
  let submitting = false;

  form.addEventListener('submit', (e) => {
    // Manual validation
    let ok = true;
    fields.forEach(f => {
      const v = f.el.value.trim();
      if (!v) { showError(f, `${f.label} is required.`); ok = false; return; }
      if (f.type === 'email' && !isEmail(v)) { showError(f, 'Please enter a valid email.'); ok = false; return; }
      if (f.min && v.length < f.min) { showError(f, `${f.label} must be at least ${f.min} characters.`); ok = false; return; }
      markValid(f);
    });

    if (!ok || submitting) {
      e.preventDefault();
      return;
    }

    // UX: loading state
    submitting = true;
    sendBtn.disabled = true;
    const original = sendBtn.textContent;
    sendBtn.textContent = 'Sending...';

    // Let FormSubmit handle the POST normally
    // (If you want to AJAX it later, we can switch.)
    setTimeout(() => {
      // restore if the page doesn't navigate for some reason
      sendBtn.textContent = original;
      sendBtn.disabled = false;
      submitting = false;
    }, 8000);
  });

  // Show success message if redirected with ?sent=1 (from _next)
  // Works with both ?sent=1 and #contact?sent=1
  (function showSuccessIfNeeded() {
    const search = window.location.search;
    const hash = window.location.hash;
    if (search.includes('sent=1') || hash.includes('sent=1')) {
      if (alertBox) {
        alertBox.hidden = false;
        alertBox.textContent = '✅ Thanks! Your message has been sent.';
      }
      // Clean the URL so the alert doesn't persist on refresh
      const cleanURL = window.location.href
        .replace('?sent=1', '')
        .replace('#contact?sent=1', '#contact');
      history.replaceState({}, document.title, cleanURL);
    }
  })();
})();
// === Simple spam check (random math question) =========================
(function(){
  const qSpan = document.getElementById('humanQuestion');
  const input = document.getElementById('human');
  const err   = document.getElementById('humanError');
  const form  = document.getElementById('contactForm');
  if (!qSpan || !input || !form) return;

  // Build a tiny random sum (2–9) + (2–9)
  const a = Math.floor(Math.random()*8) + 2;
  const b = Math.floor(Math.random()*8) + 2;
  const answer = a + b;
  qSpan.textContent = `${a} + ${b} = ?`;

  // Validate on submit
  form.addEventListener('submit', (e) => {
    const user = parseInt(input.value.trim(), 10);
    if (Number.isNaN(user) || user !== answer) {
      e.preventDefault();
      err.textContent = 'Answer is incorrect. Please try again.';
      input.focus();
    } else {
      err.textContent = '';
    }
  });
})();
// === Inline AJAX submit for contact form (FormSubmit) ===
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const alertBox = document.getElementById('formAlert');
  const submitBtn = form.querySelector('button[type="submit"]');

  // Helper to show alert
  function showAlert(type, msg) {
    alertBox.textContent = msg;
    alertBox.hidden = false;
    alertBox.classList.remove('success', 'error', 'show');
    alertBox.classList.add(type);
    // trigger fade-in
    requestAnimationFrame(() => alertBox.classList.add('show'));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: if filled, silently ignore
    const honey = form.querySelector('[name="_honey"]');
    if (honey && honey.value.trim()) return;

    // Build AJAX URL (switch to /ajax/ for JSON response)
    const ajaxUrl = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
    const data = new FormData(form);

    // Button state
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch(ajaxUrl, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      // FormSubmit returns JSON like: { success: "true", message: "…"}
      const json = await res.json().catch(() => ({}));

      if (res.ok && (json.success === true || json.success === 'true')) {
        showAlert('success', '✅ Message sent! I’ll get back to you via email shortly.');
        form.reset();
      } else {
        const msg = json.message || 'Something went wrong. Please try again or email me directly.';
        showAlert('error', `⚠️ ${msg}`);
      }
    } catch (err) {
      showAlert('error', '⚠️ Network error. Please check your connection and try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
})();










