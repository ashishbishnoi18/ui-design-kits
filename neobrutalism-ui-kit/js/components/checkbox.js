/**
 * NB Checkbox Component
 * Handles label click forwarding and emits change events.
 *
 * Usage:
 *   <label class="nb-checkbox" data-nb-checkbox>
 *     <input class="nb-checkbox_input" type="checkbox">
 *     <span class="nb-checkbox_box"></span>
 *     <span class="nb-checkbox_label">Remember me</span>
 *   </label>
 *
 * Events:
 *   nb:checkbox-change — detail: { checked: boolean }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('checkbox', function (el) {
    var input = el.querySelector('.nb-checkbox__input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var labelEl = el.querySelector('.nb-checkbox__label');
    if (labelEl && !input.getAttribute('aria-label') && !input.id) {
      var labelId = NB.uid('nb-checkbox-label');
      labelEl.id = labelId;
      input.setAttribute('aria-labelledby', labelId);
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      NB.emit(el, 'nb:checkbox-change', { checked: input.checked });
    });

    /* ---------------------------------------------------------------- */
    /*  Label click forwarding                                           */
    /*  If the wrapper isn't a <label>, forward clicks to the input      */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      NB.on(el, 'click', function (e) {
        /* Don't double-toggle if the click was on the input itself */
        if (e.target === input) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });

})(window.NB);
