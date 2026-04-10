/**
 * DevKit Shared Page Script
 * - Persists and applies theme (dark/light) across all pages via localStorage
 * - Injects a floating theme toggle button
 * - Highlights current page in navigation
 * - Persists sidebar toggle state
 * - Provides form validation for auth pages
 */
;(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Theme persistence — apply before paint                             */
  /* ------------------------------------------------------------------ */

  var STORAGE_KEY = 'dk-theme';
  var SIDEBAR_KEY = 'dk-sidebar-collapsed';
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
  /*  Highlight current page in navbar / sidebar links                   */
  /* ------------------------------------------------------------------ */

  function highlightCurrentNav() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Highlight matching nav links
    document.querySelectorAll('nav a, [class*="sidebar"] a').forEach(function(link) {
      var linkPage = link.getAttribute('href');
      if (!linkPage || linkPage === '#') return;
      var linkFilename = linkPage.split('/').pop().split('?')[0].split('#')[0];
      if (linkFilename === currentPage) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Sidebar toggle state persistence                                   */
  /* ------------------------------------------------------------------ */

  function restoreSidebarState() {
    var sidebar = document.querySelector('.dk-sidebar');
    if (!sidebar) return;

    var collapsed = false;
    try { collapsed = localStorage.getItem(SIDEBAR_KEY) === 'true'; } catch (e) {}

    if (collapsed) {
      sidebar.classList.add('is-collapsed');
    }

    // Listen for sidebar toggle clicks
    var toggleBtn = document.querySelector('.dk-sidebar-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var isNowCollapsed = sidebar.classList.contains('is-collapsed');
        try { localStorage.setItem(SIDEBAR_KEY, String(!isNowCollapsed)); } catch (e) {}
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Form validation for auth pages                                     */
  /* ------------------------------------------------------------------ */

  function initFormValidation() {
    var forms = document.querySelectorAll('.auth-page form');
    if (!forms.length) return;

    forms.forEach(function(form) {
      form.setAttribute('novalidate', '');

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var valid = true;

        // Clear previous errors
        form.querySelectorAll('.form-error').forEach(function(el) {
          el.hidden = true;
          el.textContent = '';
        });
        form.querySelectorAll('[aria-invalid]').forEach(function(el) {
          el.removeAttribute('aria-invalid');
        });

        // Validate each required field
        var inputs = form.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
        inputs.forEach(function(input) {
          var error = input.closest('.dk-field') ?
            input.closest('.dk-field').querySelector('.form-error') : null;
          // For password inputs inside dk-password wrapper
          if (!error) {
            var wrapper = input.closest('.dk-password');
            if (wrapper) {
              error = wrapper.parentElement.querySelector('.form-error');
            }
          }
          if (!error) return;

          var val = input.value.trim();

          // Required check
          if (!val) {
            valid = false;
            input.setAttribute('aria-invalid', 'true');
            error.textContent = 'This field is required.';
            error.hidden = false;
            return;
          }

          // Email format check
          if (input.type === 'email') {
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(val)) {
              valid = false;
              input.setAttribute('aria-invalid', 'true');
              error.textContent = 'Please enter a valid email address.';
              error.hidden = false;
              return;
            }
          }

          // Password min length check
          if (input.type === 'password' && input.autocomplete !== 'current-password') {
            if (val.length < 8) {
              valid = false;
              input.setAttribute('aria-invalid', 'true');
              error.textContent = 'Password must be at least 8 characters.';
              error.hidden = false;
              return;
            }
          }
        });

        // Password match check (signup page)
        var pw = form.querySelector('#password');
        var pwConfirm = form.querySelector('#password-confirm');
        if (pw && pwConfirm && pw.value && pwConfirm.value) {
          if (pw.value !== pwConfirm.value) {
            valid = false;
            var confirmError = pwConfirm.closest('.dk-field') ?
              pwConfirm.closest('.dk-field').querySelector('.form-error') : null;
            if (confirmError) {
              pwConfirm.setAttribute('aria-invalid', 'true');
              confirmError.textContent = 'Passwords do not match.';
              confirmError.hidden = false;
            }
          }
        }

        if (valid) {
          // Form is valid — in a real app this would submit
          // For the template, just show a quick visual confirmation
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Init on DOMContentLoaded                                           */
  /* ------------------------------------------------------------------ */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectToggle();
      highlightCurrentNav();
      restoreSidebarState();
      initFormValidation();
    });
  } else {
    injectToggle();
    highlightCurrentNav();
    restoreSidebarState();
    initFormValidation();
  }
})();
