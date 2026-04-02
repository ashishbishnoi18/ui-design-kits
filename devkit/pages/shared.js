/**
 * DevKit Shared Page Script
 * - Persists and applies theme (dark/light) across all pages via localStorage
 * - Injects a floating theme toggle button
 * - Highlights current page in navigation
 */
;(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Theme persistence — apply before paint                             */
  /* ------------------------------------------------------------------ */

  var STORAGE_KEY = 'dk-theme';
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.setAttribute('data-theme', saved);
  }

  /* ------------------------------------------------------------------ */
  /*  Inject floating theme toggle button                                */
  /* ------------------------------------------------------------------ */

  function injectToggle() {
    // Don't duplicate
    if (document.getElementById('dk-theme-fab')) return;

    var btn = document.createElement('button');
    btn.id = 'dk-theme-fab';
    btn.setAttribute('aria-label', 'Toggle theme');
    btn.setAttribute('title', 'Toggle dark / light theme');
    btn.innerHTML =
      '<svg class="dk-theme-fab_sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="12" cy="12" r="5"/>' +
        '<line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>' +
        '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
        '<line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>' +
        '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>' +
      '</svg>' +
      '<svg class="dk-theme-fab_moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>' +
      '</svg>';

    // Styles
    var style = document.createElement('style');
    style.textContent =
      '#dk-theme-fab {' +
        'position: fixed; bottom: 24px; right: 24px; z-index: 9999;' +
        'width: 44px; height: 44px; border-radius: 50%;' +
        'background: var(--bg-raised); border: 1px solid var(--border-default);' +
        'color: var(--text-secondary); cursor: pointer;' +
        'display: flex; align-items: center; justify-content: center;' +
        'transition: all 200ms ease; box-shadow: 0 2px 8px rgba(0,0,0,0.3);' +
      '}' +
      '#dk-theme-fab:hover {' +
        'border-color: var(--accent); color: var(--accent-text);' +
        'transform: scale(1.08);' +
      '}' +
      '[data-theme="dark"] .dk-theme-fab_sun { display: block; }' +
      '[data-theme="dark"] .dk-theme-fab_moon { display: none; }' +
      '[data-theme="light"] .dk-theme-fab_sun { display: none; }' +
      '[data-theme="light"] .dk-theme-fab_moon { display: block; }' +
      /* Default to dark if no attribute */
      '.dk-theme-fab_sun { display: block; }' +
      '.dk-theme-fab_moon { display: none; }';

    document.head.appendChild(style);
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') || 'dark';
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Highlight current page in navbar links                             */
  /* ------------------------------------------------------------------ */

  function highlightCurrentNav() {
    var currentFile = location.pathname.split('/').pop() || 'index.html';

    // Navbar links
    var navLinks = document.querySelectorAll('.dk-navbar_link');
    navLinks.forEach(function (link) {
      link.classList.remove('is-active');
      var href = link.getAttribute('href');
      if (href && href.split('#')[0] === currentFile) {
        link.classList.add('is-active');
      }
    });

    // Sidebar links
    var sideLinks = document.querySelectorAll('.dk-sidebar_link, [class*="sidebar"] a');
    sideLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href && href.split('#')[0] === currentFile) {
        link.classList.add('is-active');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Init on DOMContentLoaded                                           */
  /* ------------------------------------------------------------------ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectToggle();
      highlightCurrentNav();
    });
  } else {
    injectToggle();
    highlightCurrentNav();
  }
})();
