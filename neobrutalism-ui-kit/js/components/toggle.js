/**
 * NB Toggle Component
 * Manages toggle/switch state and emits change events.
 *
 * Usage:
 *   <label class="nb-toggle" data-nb-toggle>
 *     <input class="nb-toggle_input" type="checkbox">
 *     <span class="nb-toggle_track">
 *       <span class="nb-toggle_thumb"></span>
 *     </span>
 *     <span class="nb-toggle_label">Label</span>
 *   </label>
 *
 * Events:
 *   nb:toggle-change — detail: { checked: boolean }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('toggle', function (el) {
    var input = el.querySelector('.nb-toggle__input');
    if (!input) return;

    /* Ensure ARIA role */
    if (!input.getAttribute('role')) {
      input.setAttribute('role', 'switch');
    }
    input.setAttribute('aria-checked', String(input.checked));

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    function onChange() {
      input.setAttribute('aria-checked', String(input.checked));
      NB.emit(el, 'nb:toggle-change', { checked: input.checked });
    }

    NB.on(input, 'change', onChange);
  });

})(window.NB);
