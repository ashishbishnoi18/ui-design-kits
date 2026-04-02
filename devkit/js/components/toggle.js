/**
 * DK Toggle Component
 * Manages toggle/switch state and emits change events.
 *
 * Usage:
 *   <label class="dk-toggle" data-dk-toggle>
 *     <input class="dk-toggle_input" type="checkbox">
 *     <span class="dk-toggle_track">
 *       <span class="dk-toggle_thumb"></span>
 *     </span>
 *     <span class="dk-toggle_label">Label</span>
 *   </label>
 *
 * Events:
 *   dk:toggle-change — detail: { checked: boolean }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('toggle', function (el) {
    var input = el.querySelector('.dk-toggle_input');
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
      DK.emit(el, 'dk:toggle-change', { checked: input.checked });
    }

    DK.on(input, 'change', onChange);
  });

})(window.DK);
