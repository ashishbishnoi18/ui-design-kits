/**
 * NB Radio Component
 * Handles radio group behavior and emits change events.
 *
 * Usage:
 *   <label class="nb-radio" data-nb-radio>
 *     <input class="nb-radio_input" type="radio" name="group" value="a">
 *     <span class="nb-radio_circle"></span>
 *     <span class="nb-radio_label">Option A</span>
 *   </label>
 *   <label class="nb-radio" data-nb-radio>
 *     <input class="nb-radio_input" type="radio" name="group" value="b">
 *     <span class="nb-radio_circle"></span>
 *     <span class="nb-radio_label">Option B</span>
 *   </label>
 *
 * Events:
 *   nb:radio-change — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('radio', function (el) {
    var input = el.querySelector('.nb-radio__input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var labelEl = el.querySelector('.nb-radio__label');
    if (labelEl && !input.getAttribute('aria-label') && !input.id) {
      var labelId = NB.uid('nb-radio-label');
      labelEl.id = labelId;
      input.setAttribute('aria-labelledby', labelId);
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      if (input.checked) {
        NB.emit(el, 'nb:radio-change', { value: input.value });
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Label click forwarding                                           */
    /*  If the wrapper isn't a <label>, forward clicks to the input      */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      NB.on(el, 'click', function (e) {
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

    NB.on(input, 'keydown', function (e) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' &&
          e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
        return;
      }

      var name = input.name;
      if (!name) return;

      e.preventDefault();

      /* Get all radios in the same group */
      var radios = NB.$$('.nb-radio__input[name="' + name + '"]');
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

})(window.NB);
