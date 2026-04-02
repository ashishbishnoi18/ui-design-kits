/**
 * DK Theme Toggle Component
 * Toggles `data-theme` between 'dark' and 'light' on <html>.
 * Persists the selection to localStorage and restores it on init.
 * Emits a `dk:theme-change` CustomEvent with `{ theme }` detail.
 *
 * Usage:
 *   <button data-dk-theme-toggle>Toggle theme</button>
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var STORAGE_KEY = 'dk-theme';
  var root = document.documentElement;

  DK.register('theme-toggle', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Restore saved theme on init                                      */
    /* ---------------------------------------------------------------- */

    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage may be unavailable (private browsing, etc.)
    }

    if (saved === 'dark' || saved === 'light') {
      root.setAttribute('data-theme', saved);
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle handler                                                   */
    /* ---------------------------------------------------------------- */

    function toggle() {
      var current = root.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';

      root.setAttribute('data-theme', next);

      // Persist preference
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        // Silently fail if storage is unavailable
      }

      // Notify listeners
      DK.emit(el, 'dk:theme-change', { theme: next });
    }

    /* ---------------------------------------------------------------- */
    /*  Bind click                                                       */
    /* ---------------------------------------------------------------- */

    DK.on(el, 'click', toggle);
  });

})(window.DK);
