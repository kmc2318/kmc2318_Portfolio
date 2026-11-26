(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const header = $('.site-header');
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', updateHeader, { passive: true }); updateHeader();
  const toggle = $('.menu-toggle'), menu = $('.mobile-menu');
  function closeMenu(focus = true) {
    if (!menu || menu.hidden) return;
    menu.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'メニューを開く');
    document.body.classList.remove('menu-open'); toggle.hidden = false;
    $$('main, .site-footer, .brand, .site-nav').forEach(n => n.inert = false);
    if (focus) toggle.focus();
  }
  toggle?.addEventListener('click', () => {
    if (!menu.hidden) { closeMenu(); return; }
    menu.hidden = false; toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'メニューを閉じる');
    document.body.classList.add('menu-open'); toggle.hidden = true;
    $$('main, .site-footer, .brand, .site-nav').forEach(n => n.inert = true);
    $('a', menu).focus();
  });
  $('.mobile-close', menu)?.addEventListener('click', () => closeMenu());
  $$('a', menu || document.createElement('div')).forEach(a => a.addEventListener('click', () => closeMenu(false)));
  addEventListener('keydown', e => {
    if (!menu || menu.hidden) return;
    if (e.key === 'Escape') closeMenu();
    if (e.key === 'Tab') {
      const all = $$('button, a', menu); const index = all.indexOf(document.activeElement);
      if (e.shiftKey && index <= 0) { e.preventDefault(); all.at(-1).focus(); }
      if (!e.shiftKey && index === all.length - 1) { e.preventDefault(); all[0].focus(); }
    }
  });
  matchMedia('(min-width:768px)').addEventListener('change', e => { if (e.matches) closeMenu(false); });
  const nav = $('.site-nav'), indicator = $('.nav-indicator');
  function moveIndicator(a) { if (!a || !indicator) return; if (a.hash === '#contact') { indicator.style.width = '0px'; return; } indicator.style.width = a.offsetWidth + 'px'; indicator.style.transform = `translateX(${a.offsetLeft}px)`; }
  const navLinks = nav ? $$('a', nav) : [];
  navLinks.forEach(a => { a.addEventListener('mouseenter', () => moveIndicator(a)); a.addEventListener('focus', () => moveIndicator(a)); });
  nav?.addEventListener('mouseleave', () => moveIndicator($('[aria-current]', nav) || navLinks[0]));
  moveIndicator(navLinks.find(a => a.hash === (location.pathname.endsWith('about.html') ? '#about' : '#works')) || navLinks[0]);
  addEventListener('resize', () => moveIndicator($('[aria-current]', nav) || navLinks[0]));
  document.fonts?.ready.then(() => moveIndicator($('[aria-current]', nav) || navLinks[0]));
  // Resolve navigation from document position, including short bottom sections.
  const home = document.body.classList.contains('home');
  const navSections = ['works', 'approach', 'about', 'contact'].map(id => document.getElementById(id)).filter(Boolean);
  function activateNavigation(id) {
    $$('.site-nav a, .mobile-menu nav a').forEach(a => {
      if (a.hash === '#' + id) a.setAttribute('aria-current', home ? 'location' : 'page');
      else a.removeAttribute('aria-current');
    });
    moveIndicator(navLinks.find(a => a.hash === '#' + id));
  }
  function updateNavigation() {
    if (!home) { activateNavigation(location.pathname.endsWith('about.html') ? 'about' : 'works'); return; }
    const threshold = (header?.offsetHeight || 72) + Math.min(innerHeight * .2, 160);
    let current = 'top';
    for (const section of navSections) if (section.getBoundingClientRect().top <= threshold) current = section.id;
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 24) current = 'contact';
    activateNavigation(current);
  }
  let scheduled = false;
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { updateNavigation(); scheduled = false; });
  }, { passive: true });
  addEventListener('resize', updateNavigation);
  addEventListener('hashchange', updateNavigation);
  document.fonts?.ready.then(updateNavigation);
  updateNavigation();
  const toc = $('.case-toc');
  if (toc) {
    const observer = new IntersectionObserver(entries => {
      entries.filter(e => e.isIntersecting).forEach(e => {
        $$('a', toc).forEach(a => {
          if (a.hash === '#' + e.target.id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -65% 0px' });
    $$('.case-body > section[id]').forEach(s => observer.observe(s));
  }
  const dialog = $('.lightbox'); let imageGroup = [], imageIndex = 0, opener;
  function showImage(index) {
    imageIndex = (index + imageGroup.length) % imageGroup.length;
    const source = $('img', imageGroup[imageIndex]), dest = $('img', dialog);
    dest.src = source.dataset.full || source.currentSrc || source.src; dest.alt = source.alt; dest.width = source.width; dest.height = source.height;
    $('.caption', dialog).textContent = imageGroup[imageIndex].hasAttribute('data-lightbox-nocaption') ? '' : `${imageIndex + 1} / ${imageGroup.length} — ${source.alt}`;
    $$('[data-lightbox-prev], [data-lightbox-next]', dialog).forEach(b => b.hidden = imageGroup.length < 2);
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-lightbox]'); if (!b || !dialog) return;
    opener = b; imageGroup = $$('[data-lightbox]', b.closest('[data-work], section') || document); imageIndex = imageGroup.indexOf(b);
    showImage(imageIndex); dialog.showModal(); $('.lightbox-close', dialog).focus();
  });
  $('.lightbox-close', dialog)?.addEventListener('click', () => dialog.close());
  $('[data-lightbox-prev]', dialog)?.addEventListener('click', () => showImage(imageIndex - 1));
  $('[data-lightbox-next]', dialog)?.addEventListener('click', () => showImage(imageIndex + 1));
  dialog?.addEventListener('keydown', e => { if (['ArrowLeft','ArrowRight'].includes(e.key)) { e.preventDefault(); showImage(imageIndex + (e.key === 'ArrowRight' ? 1 : -1)); } });
  dialog?.addEventListener('close', () => opener?.focus());
  dialog?.addEventListener('click', e => { if (e.target === dialog) {const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();} });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('is-revealed');reveal.unobserve(entry.target);}
    }), {threshold:.15});
    $$('.work-feature, .affiliation__item, .gallery-side, .work-data, .approach-step, .home .w01__body, .home .ab__text, .home .w04__top .w-text, .home .data__text, .home .w06 .w-text, .home .w07 .w-text, .home .steps>div').forEach((el,i) => {
      el.dataset.reveal = ''; el.style.setProperty('--reveal-delay', `${Math.min(i % 4,3)*80}ms`);
      if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-revealed');
      reveal.observe(el);
    });
    document.documentElement.classList.add('js');
  }
  $$('[data-comparison]').forEach(root => {
    const tabs = $$('[role=tab]', root), panels = $$('[role=tabpanel]', root);
    const small = matchMedia('(max-width:767px)'); let current = 0;
    function select(index, focus = false) {
      current = index;
      tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === current)); tab.tabIndex = i === current ? 0 : -1; });
      panels.forEach((panel, i) => { panel.hidden = small.matches && i !== current; });
      if (focus) tabs[current].focus();
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', e => {
        const next = {ArrowLeft:(i + tabs.length - 1) % tabs.length, ArrowRight:(i + 1) % tabs.length, Home:0, End:tabs.length - 1}[e.key];
        if (next !== undefined) { e.preventDefault(); select(next, true); }
      });
    });
    root.classList.add('tabs-ready'); small.addEventListener('change', () => select(current)); select(0);
  });
  const form = $('#contact-form');
  form?.addEventListener('submit', async e => {
    e.preventDefault(); if (!form.reportValidity()) return;
    const button = $('button[type=submit]', form), status = $('#contact-status'); if (button.disabled) return;
    button.disabled = true; status.textContent = '送信中です…';
    try {
      const response = await fetch(form.action, {method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
      if (!response.ok) throw new Error('send-failed');
      form.hidden = true; const success = $('#contact-success'); success.hidden = false; success.focus(); form.reset();
    } catch { status.textContent = '送信できませんでした。通信状況を確認してもう一度お試しいただくか、メールでご連絡ください。'; }
    finally {button.disabled = false;}
  });
})();
