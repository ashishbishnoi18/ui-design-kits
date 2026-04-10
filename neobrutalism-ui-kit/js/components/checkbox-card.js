/**
 * NB Checkbox Card Component
 * Card-styled checkbox with full-card click area.
 *
 * Usage:
 *   <label class="nb-checkbox-card" data-nb-checkbox-card>
 *     <input class="nb-checkbox-card_input" type="checkbox" name="features" value="api">
 *     <span class="nb-checkbox-card_indicator">
 *       <svg class="nb-checkbox-card_indicator-icon" viewBox="0 0 12 12">
 *         <path d="M2.5 6l2.5 2.5 4.5-5" fill="none" stroke="currentColor" stroke-width="1.5"/>
 *       </svg>
 *     </span>
 *     <span class="nb-checkbox-card_title">API Access</span>
 *     <span class="nb-checkbox-card_description">Full REST API with webhooks</span>
 *   </label>
 *
 * Events:
 *   nb:checkbox-card-change — detail: { checked: boolean, value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('checkbox-card', function (el) {
    var input = el.querySelector('.nb-checkbox-card_input');
    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  Sync visual state                                                */
    /* ---------------------------------------------------------------- */

    function syncState() {
      if (input.checked) {
        el.classList.add('is-checked');
      } else {
        el.classList.remove('is-checked');
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'change', function () {
      syncState();
      NB.emit(el, 'nb:checkbox-card-change', {
        checked: input.checked,
        value: input.value || ''
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Click forwarding (if wrapper is not a <label>)                   */
    /* ---------------------------------------------------------------- */

    if (el.tagName.toLowerCase() !== 'label') {
      NB.on(el, 'click', function (e) {
        if (e.target === input) return;
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard: Space to toggle (when card is focused)                 */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      if (e.key === ' ' && e.target === el) {
        e.preventDefault();
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    /* Initialize state */
    syncState();
  });

})(window.NB);
