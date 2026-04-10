/**
 * NB Password Toggle Component
 * Toggles password input visibility between 'password' and 'text'.
 * Updates the toggle icon to reflect the current state.
 *
 * Usage:
 *   <div class="nb-password" data-nb-password>
 *     <input class="nb-password_input" type="password" placeholder="Password">
 *     <button class="nb-password_toggle" type="button" aria-label="Show password">
 *       <svg class="nb-password_icon-show"><!-- eye icon --></svg>
 *       <svg class="nb-password_icon-hide" style="display:none"><!-- eye-off icon --></svg>
 *     </button>
 *   </div>
 *
 * Events:
 *   nb:password-toggle — detail: { visible: boolean }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('password', function (el) {
    var input    = el.querySelector('.nb-password__input');
    var toggleEl = el.querySelector('.nb-password__toggle');

    if (!input || !toggleEl) return;

    var iconShow = el.querySelector('.nb-password__icon-show');
    var iconHide = el.querySelector('.nb-password__icon-hide');

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

    NB.on(toggleEl, 'click', function (e) {
      e.preventDefault();
      isVisible = !isVisible;
      updateState();
      input.focus();
      NB.emit(el, 'nb:password-toggle', { visible: isVisible });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Enter/Space on toggle button                           */
    /* ---------------------------------------------------------------- */

    NB.on(toggleEl, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isVisible = !isVisible;
        updateState();
        input.focus();
        NB.emit(el, 'nb:password-toggle', { visible: isVisible });
      }
    });

    /* Set initial state */
    updateState();
  });

})(window.NB);
