/**
 * DK Checkbox Component
 * Handles label click forwarding and emits change events.
 *
 * Usage:
 *   <label class="dk-checkbox" data-dk-checkbox>
 *     <input class="dk-checkbox_input" type="checkbox">
 *     <span class="dk-checkbox_box"></span>
 *     <span class="dk-checkbox_label">Remember me</span>
 *   </label>
 *
 * Events:
 *   dk:checkbox-change — detail: { checked: boolean }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('checkbox', function (el) {
    var input = el.querySelector('.dk-checkbox_input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var labelEl = el.querySelector('.dk-checkbox_label');
    if (labelEl && !input.getAttribute('aria-label') && !input.id) {
      var labelId = DK.uid('dk-checkbox-label');
      labelEl.id = labelId;
      input.setAttribute('aria-labelledby', labelId);
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(input, 'change', function () {
      DK.emit(el, 'dk:checkbox-change', { checked: input.checked });
    });

    /* ---------------------------------------------------------------- */
    /*  Label click forwarding                                           */
    /*  If the wrapper isn't a <label>, forward clicks to the input      */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      DK.on(el, 'click', function (e) {
        /* Don't double-toggle if the click was on the input itself */
        if (e.target === input) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  });

})(window.DK);
