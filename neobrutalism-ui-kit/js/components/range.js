/**
 * NB Range Component
 * Updates value display and track fill width on input.
 * Emits nb:range-change events.
 *
 * Usage:
 *   <div class="nb-range" data-nb-range>
 *     <div class="nb-range_label-row">
 *       <span>Volume</span>
 *       <span class="nb-range_value">50</span>
 *     </div>
 *     <div class="nb-range_track">
 *       <input class="nb-range_input" type="range" min="0" max="100" value="50">
 *       <div class="nb-range_track-fill"></div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:range-change — detail: { value: number, min: number, max: number, percent: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('range', function (el) {
    var input     = el.querySelector('.nb-range__input');
    var valueEl   = el.querySelector('.nb-range__value');
    var trackFill = el.querySelector('.nb-range__track-fill');

    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  Calculate percentage                                             */
    /* ---------------------------------------------------------------- */

    function getPercent() {
      var min = parseFloat(input.min) || 0;
      var max = parseFloat(input.max) || 100;
      var val = parseFloat(input.value) || 0;
      if (max === min) return 0;
      return ((val - min) / (max - min)) * 100;
    }

    /* ---------------------------------------------------------------- */
    /*  Update display                                                   */
    /* ---------------------------------------------------------------- */

    function update() {
      var pct = getPercent();

      /* Update value text */
      if (valueEl) {
        valueEl.textContent = input.value;
      }

      /* Update track fill width */
      if (trackFill) {
        trackFill.style.width = pct + '%';
      }

      /* ARIA */
      input.setAttribute('aria-valuenow', input.value);
      input.setAttribute('aria-valuemin', input.min || '0');
      input.setAttribute('aria-valuemax', input.max || '100');
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'input', function () {
      update();
      NB.emit(el, 'nb:range-change', {
        value: parseFloat(input.value),
        min: parseFloat(input.min) || 0,
        max: parseFloat(input.max) || 100,
        percent: getPercent()
      });
    });

    /* Also handle programmatic changes */
    NB.on(input, 'change', function () {
      update();
    });

    /* Set initial state */
    update();
  });

})(window.NB);
