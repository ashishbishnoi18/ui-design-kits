/**
 * DK Range Component
 * Updates value display and track fill width on input.
 * Emits dk:range-change events.
 *
 * Usage:
 *   <div class="dk-range" data-dk-range>
 *     <div class="dk-range_label-row">
 *       <span>Volume</span>
 *       <span class="dk-range_value">50</span>
 *     </div>
 *     <div class="dk-range_track">
 *       <input class="dk-range_input" type="range" min="0" max="100" value="50">
 *       <div class="dk-range_track-fill"></div>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:range-change — detail: { value: number, min: number, max: number, percent: number }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('range', function (el) {
    var input     = el.querySelector('.dk-range_input');
    var valueEl   = el.querySelector('.dk-range_value');
    var trackFill = el.querySelector('.dk-range_track-fill');

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

    DK.on(input, 'input', function () {
      update();
      DK.emit(el, 'dk:range-change', {
        value: parseFloat(input.value),
        min: parseFloat(input.min) || 0,
        max: parseFloat(input.max) || 100,
        percent: getPercent()
      });
    });

    /* Also handle programmatic changes */
    DK.on(input, 'change', function () {
      update();
    });

    /* Set initial state */
    update();
  });

})(window.DK);
