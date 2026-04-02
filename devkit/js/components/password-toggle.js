/**
 * DK Password Toggle Component
 * Toggles password input visibility between 'password' and 'text'.
 * Updates the toggle icon to reflect the current state.
 *
 * Usage:
 *   <div class="dk-password" data-dk-password>
 *     <input class="dk-password_input" type="password" placeholder="Password">
 *     <button class="dk-password_toggle" type="button" aria-label="Show password">
 *       <svg class="dk-password_icon-show"><!-- eye icon --></svg>
 *       <svg class="dk-password_icon-hide" style="display:none"><!-- eye-off icon --></svg>
 *     </button>
 *   </div>
 *
 * Events:
 *   dk:password-toggle — detail: { visible: boolean }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('password', function (el) {
    var input    = el.querySelector('.dk-password_input');
    var toggleEl = el.querySelector('.dk-password_toggle');

    if (!input || !toggleEl) return;

    var iconShow = el.querySelector('.dk-password_icon-show');
    var iconHide = el.querySelector('.dk-password_icon-hide');

    /* ---------------------------------------------------------------- */
    /*  State                                                            */
    /* ---------------------------------------------------------------- */

    var isVisible = false;

    function updateState() {
      if (isVisible) {
        input.type = 'text';
        toggleEl.setAttribute('aria-label', 'Hide password');
        if (iconShow) iconShow.style.display = 'none';
        if (iconHide) iconHide.style.display = '';
      } else {
        input.type = 'password';
        toggleEl.setAttribute('aria-label', 'Show password');
        if (iconShow) iconShow.style.display = '';
        if (iconHide) iconHide.style.display = 'none';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle handler                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(toggleEl, 'click', function (e) {
      e.preventDefault();
      isVisible = !isVisible;
      updateState();
      input.focus();
      DK.emit(el, 'dk:password-toggle', { visible: isVisible });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Enter/Space on toggle button                           */
    /* ---------------------------------------------------------------- */

    DK.on(toggleEl, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isVisible = !isVisible;
        updateState();
        input.focus();
        DK.emit(el, 'dk:password-toggle', { visible: isVisible });
      }
    });

    /* Set initial state */
    updateState();
  });

})(window.DK);
