/* Progressive enhancement: the portfolio is readable without animation libraries. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const root = document.documentElement;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let savedMotion = null;
  try { savedMotion = localStorage.getItem('aa-studio-motion'); } catch (_) { /* Privacy mode. */ }
  let motionEnabled = savedMotion === null ? !preference.matches : savedMotion === 'on';
  let lenis = null;
  let lenisTick = null;
  let motionContext = null;
  let lastDialogTrigger = null;
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const motionButton = $('.motion-toggle');
  const stage = $('#hero-art');
  const structureButton = $('.structure-toggle');
  const progress = $('.reading-progress');
  window.portfolioState = { ready: false, gsap: hasGsap, lenis: false, scene: 'fallback', motion: motionEnabled };

  function refreshMotion() {
    root.dataset.motion = motionEnabled ? 'on' : 'off';
    window.portfolioState.motion = motionEnabled;
    motionButton.setAttribute('aria-pressed', String(!motionEnabled));
    const label = motionEnabled ? 'Pause decorative motion' : 'Enable decorative motion';
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    $('.motion-label').textContent = motionEnabled ? 'Motion on' : 'Motion off';
    $('.motion-icon').textContent = motionEnabled ? '\u2161' : '\u25B7';
    if (motionContext) { motionContext.revert(); motionContext = null; }
    if (lenis) {
      if (lenisTick && hasGsap) gsap.ticker.remove(lenisTick);
      lenis.destroy(); lenis = null; lenisTick = null;
    }
    window.portfolioState.lenis = false;
    if (motionEnabled && window.Lenis && hasGsap && matchMedia('(pointer:fine)').matches) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, syncTouch: false, anchors: false });
      lenis.on('scroll', ScrollTrigger.update);
      lenisTick = time => lenis.raf(time * 1000);
      gsap.ticker.add(lenisTick);
      gsap.ticker.lagSmoothing(0);
      window.portfolioState.lenis = true;
    }
    if (motionEnabled && hasGsap) {
      motionContext = gsap.context(() => {
        $$('[data-reveal]').forEach(element => {
          if (element.getBoundingClientRect().top <= innerHeight - 40) return;
          gsap.from(element, { y: 36, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: element, start: 'top 93%', once: true } });
        });
        gsap.to('.about-asterisk', { rotation: 100, ease: 'none', scrollTrigger: { trigger: '.about-section', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });
      ScrollTrigger.refresh();
    }
    window.dispatchEvent(new CustomEvent('portfolio:motion', { detail: { enabled: motionEnabled } }));
  }
  motionButton.addEventListener('click', () => {
    motionEnabled = !motionEnabled;
    savedMotion = motionEnabled ? 'on' : 'off';
    try { localStorage.setItem('aa-studio-motion', savedMotion); } catch (_) { /* Optional. */ }
    refreshMotion();
  });
  preference.addEventListener('change', event => {
    if (savedMotion === null) { motionEnabled = !event.matches; refreshMotion(); }
  });
  refreshMotion();
  if (motionEnabled && hasGsap) {
    gsap.from('.title-line > span', { yPercent: 110, rotation: 2, duration: 1.1, stagger: 0.14, ease: 'power4.out', clearProps: 'transform' });
    gsap.from('.hero-intro, .primary-link', { y: 16, opacity: 0, duration: 0.85, stagger: 0.12, delay: 0.4, ease: 'power3.out', clearProps: 'all' });
  }

  // Both the WebGL scene and the CSS fallback respond to the same accessible button.
  structureButton.addEventListener('click', () => {
    const exploded = structureButton.getAttribute('aria-pressed') !== 'true';
    structureButton.setAttribute('aria-pressed', String(exploded));
    $('.structure-label').textContent = exploded ? 'Bring it together' : 'Take it apart';
    stage.classList.toggle('is-exploded', exploded);
    window.dispatchEvent(new CustomEvent('portfolio:structure', { detail: { exploded } }));
  });

  const menu = $('#mobile-menu');
  const menuToggle = $('.menu-toggle');
  function closeMenu() { menu.close(); if (lenis) lenis.start(); }
  menuToggle.addEventListener('click', () => { if (lenis) lenis.stop(); menu.showModal(); });
  $('.menu-close').addEventListener('click', closeMenu);
  menu.addEventListener('close', () => { if (lenis) lenis.start(); });
  menu.addEventListener('click', event => { if (event.target === menu) closeMenu(); });
  const desktopBreakpoint = matchMedia('(min-width: 761px)');
  desktopBreakpoint.addEventListener('change', event => { if (event.matches && menu.open) closeMenu(); });
  $$('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', event => {
    const target = document.getElementById(anchor.getAttribute('href').slice(1));
    if (!target) return;
    if (menu.open) closeMenu();
    if (lenis) {
      event.preventDefault();
      history.pushState(null, '', anchor.getAttribute('href'));
      lenis.scrollTo(target, { offset: -90, duration: 1.1, onComplete: () => { if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true }); } });
    }
  }));
  window.addEventListener('popstate', () => { if (lenis && location.hash) { const target = document.getElementById(location.hash.slice(1)); if (target) lenis.scrollTo(target, { immediate: true, offset: -90 }); } });

  function updateProgress() {
    const range = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0})`;
  }
  let scrollQueued = false;
  window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(() => { updateProgress(); scrollQueued = false; }); } }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();
  const sections = $$('#work, #about, #toolkit, #contact');
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { $$('.desktop-nav a').forEach(a => a.removeAttribute('aria-current')); const active = $(`.desktop-nav a[href="#${entry.target.id}"]`); if (active) active.setAttribute('aria-current', 'location'); } });
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  sections.forEach(section => navObserver.observe(section));

  // Small, deliberate interactions; no content or click targets chase the cursor.
  if (hasGsap && matchMedia('(pointer:fine)').matches) {
    $$('.project-open, .round-arrow').forEach(visual => {
      const target = visual.closest('a, button');
      target.addEventListener('pointermove', event => {
        if (!motionEnabled) return;
        const r = target.getBoundingClientRect();
        gsap.to(visual, { x: (event.clientX - r.left - r.width / 2) * 0.09, y: (event.clientY - r.top - r.height / 2) * 0.09, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
      });
      target.addEventListener('pointerleave', () => gsap.to(visual, { x: 0, y: 0, duration: motionEnabled ? 0.7 : 0, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' }));
    });
  }

  // This is explicitly a diagram, never a fabricated live service status.
  const traceButton = $('.trace-button');
  const traceCaption = $('.trace-caption');
  const poster = $('.system-poster');
  const timers = [];
  traceButton.addEventListener('click', () => {
    if (traceButton.disabled) return;
    traceButton.disabled = true;
    poster.classList.remove('trace-active');
    void poster.offsetWidth;
    poster.classList.add('trace-active');
    traceCaption.textContent = '01 / An order event is produced.';
    const delay = motionEnabled ? 720 : 80;
    timers.push(setTimeout(() => { traceCaption.textContent = '02 / Kafka carries the event between services.'; }, delay));
    timers.push(setTimeout(() => { traceCaption.textContent = '03 / Inventory processes the reservation or rejection.'; }, delay * 2));
    timers.push(setTimeout(() => { poster.classList.remove('trace-active'); traceButton.disabled = false; traceCaption.textContent = 'Order \u2192 Kafka \u2192 Inventory. Replay to follow the flow.'; }, delay * 3 + 350));
  });

  const projects = {
    commerce: { eyebrow: '01 / APPLICATION SYSTEMS', title: 'E-commerce, one event at a time.', intro: 'A personal e-commerce platform with independent Product, Order, and Inventory services, connected through Apache Kafka, MongoDB, and Docker Compose.', focus: 'Exploring how an order event reaches inventory processing, and how reservation and rejection workflows fit into an asynchronous system. The diagram on this page is an illustrative sketch, not a live monitor.', tools: 'Docker Compose / Apache Kafka / MongoDB', url: 'https://github.com/zeez000/ecommerce-platform' },
    pipeline: { eyebrow: '02 / DELIVERY AUTOMATION', title: 'From commit to confidence.', intro: 'A hands-on CI/CD practice project built around Git, GitHub workflows, and delivery automation concepts.', focus: 'Exploring repeatable build and deployment experiments, understanding workflow steps, and making changes easier to track. This is a learning project rather than a claim of production-scale delivery.', tools: 'Git / GitHub workflows / CI/CD concepts', url: 'https://github.com/zeez000/devops-cicd-project' },
    lab: { eyebrow: '03 / HANDS-ON EXPLORATION', title: 'A lab for the what-ifs.', intro: 'A practical DevOps learning lab for Linux workflows, containerization experiments, and tooling.', focus: 'Learning through small experiments: work with a tool, understand its behaviour, troubleshoot the result, and document the next step. The repository is the place to inspect the actual work.', tools: 'Linux / Containers / DevOps practice', url: 'https://github.com/zeez000/devops' }
  };
  const projectDialog = $('#project-dialog');
  function closeProject() { projectDialog.close(); }
  $$('[data-project]').forEach(button => button.addEventListener('click', () => {
    const project = projects[button.dataset.project];
    if (!project) return;
    lastDialogTrigger = button;
    $('.dialog-content').innerHTML = `<p class="eyebrow">${project.eyebrow}</p><h2 id="dialog-title">${project.title}</h2><p>${project.intro}</p><h3>THE FOCUS</h3><p>${project.focus}</p><h3>THE TOOLS</h3><p>${project.tools}</p><a class="text-link" href="${project.url}" target="_blank" rel="noopener noreferrer">Inspect the repository <span aria-hidden="true">\u2197</span></a>`;
    if (lenis) lenis.stop();
    projectDialog.showModal();
    if (motionEnabled && hasGsap) gsap.fromTo(projectDialog, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', clearProps: 'all' });
  }));
  $('.dialog-close').addEventListener('click', closeProject);
  projectDialog.addEventListener('close', () => { if (lenis) lenis.start(); if (lastDialogTrigger) lastDialogTrigger.focus({ preventScroll: true }); });
  projectDialog.addEventListener('click', event => { if (event.target === projectDialog) { const r = projectDialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeProject(); } });

  const copyButton = $('.copy-email');
  copyButton.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('abdzeez000@gmail.com');
      copyButton.innerHTML = 'Copied <span aria-hidden="true">\u2713</span>';
      $('.copy-status').textContent = 'Email address copied to clipboard.';
      timers.push(setTimeout(() => { copyButton.innerHTML = 'Copy email <span aria-hidden="true">\u29C9</span>'; }, 2400));
    } catch (_) { $('.copy-status').textContent = 'Copy was unavailable. Use the email link: abdzeez000@gmail.com.'; }
  });
  const clock = $('.local-time');
  function updateClock() { clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()) + ' IST'; }
  updateClock();
  const clockTimer = setInterval(updateClock, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { updateClock(); if (hasGsap) ScrollTrigger.refresh(); } });
  window.addEventListener('pagehide', event => { if (!event.persisted) { timers.forEach(clearTimeout); clearInterval(clockTimer); navObserver.disconnect(); if (lenis) lenis.destroy(); if (lenisTick && hasGsap) gsap.ticker.remove(lenisTick); if (motionContext) motionContext.revert(); } });
  document.fonts.ready.then(() => { if (hasGsap) ScrollTrigger.refresh(); updateProgress(); });
  window.portfolioState.ready = true;
})();
