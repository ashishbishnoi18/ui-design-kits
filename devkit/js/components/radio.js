/**
 * DK Radio Component
 * Handles radio group behavior and emits change events.
 *
 * Usage:
 *   <label class="dk-radio" data-dk-radio>
 *     <input class="dk-radio_input" type="radio" name="group" value="a">
 *     <span class="dk-radio_circle"></span>
 *     <span class="dk-radio_label">Option A</span>
 *   </label>
 *   <label class="dk-radio" data-dk-radio>
 *     <input class="dk-radio_input" type="radio" name="group" value="b">
 *     <span class="dk-radio_circle"></span>
 *     <span class="dk-radio_label">Option B</span>
 *   </label>
 *
 * Events:
 *   dk:radio-change — detail: { value: string }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('radio', function (el) {
    var input = el.querySelector('.dk-radio_input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var labelEl = el.querySelector('.dk-radio_label');
    if (labelEl && !input.getAttribute('aria-label') && !input.id) {
      var labelId = DK.uid('dk-radio-label');
      labelEl.id = labelId;
      input.setAttribute('aria-labelledby', labelId);
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(input, 'change', function () {
      if (input.checked) {
        DK.emit(el, 'dk:radio-change', { value: input.value });
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Label click forwarding                                           */
    /*  If the wrapper isn't a <label>, forward clicks to the input      */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      DK.on(el, 'click', function (e) {
        if (e.target === input) return;
        if (!input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Arrow keys for radio group navigation                  */
    /* ---------------------------------------------------------------- */

    DK.on(input, 'keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' &&
          e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        return;
      }

      var name = input.name;
      if (!name) return;

      e.preventDefault();

      /* Get all radios in the same group */
      var radios = DK.$$('.dk-radio_input[name="' + name + '"]');
      if (radios.length <= 1) return;

      var currentIndex = radios.indexOf(input);
      var nextIndex;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        nextIndex = currentIndex < radios.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : radios.length - 1;
      }

      var nextRadio = radios[nextIndex];
      if (nextRadio && !nextRadio.disabled) {
        nextRadio.checked = true;
        nextRadio.focus();
        nextRadio.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

})(window.DK);
