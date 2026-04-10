/**
 * NB Number Input Component
 * Numeric stepper with increment/decrement buttons and keyboard support.
 *
 * Usage:
 *   <div class="nb-number-input" data-nb-number-input>
 *     <button class="nb-number-input_btn" type="button" data-nb-action="decrement">&minus;</button>
 *     <input class="nb-number-input_field" type="number" value="0">
 *     <button class="nb-number-input_btn" type="button" data-nb-action="increment">+</button>
 *   </div>
 *
 * Data attributes:
 *   data-nb-number-input   — activates component
 *   data-nb-min="0"        — minimum value
 *   data-nb-max="100"      — maximum value
 *   data-nb-step="1"       — step increment
 *
 * Events:
 *   nb:number-change — detail: { value: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('number-input', function (el) {
    var field   = el.querySelector('.nb-number-input_field');
    var btnDec  = el.querySelector('[data-nb-action="decrement"]');
    var btnInc  = el.querySelector('[data-nb-action="increment"]');

    if (!field) return;

    var min  = parseFloat(el.getAttribute('data-nb-min'));
    var max  = parseFloat(el.getAttribute('data-nb-max'));
    var step = parseFloat(el.getAttribute('data-nb-step')) || 1;

    var hasMin = !isNaN(min);
    var hasMax = !isNaN(max);

    /* Sync native attributes */
    if (hasMin) field.setAttribute('min', min);
    if (hasMax) field.setAttribute('max', max);
    field.setAttribute('step', step);

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getValue() {
      var v = parseFloat(field.value);
      return isNaN(v) ? 0 : v;
    }

    function clamp(val) {
      if (hasMin && val < min) return min;
      if (hasMax && val > max) return max;
      return val;
    }

    function setValue(val) {
      var clamped = clamp(val);
      /* Round to step precision to avoid floating point issues */
      var decimals = (String(step).split('.')[1] || '').length;
      field.value = clamped.toFixed(decimals);
      NB.emit(el, 'nb:number-change', { value: clamped });
    }

    function increment() {
      setValue(getValue() + step);
    }

    function decrement() {
      setValue(getValue() - step);
    }

    /* ---------------------------------------------------------------- */
    /*  Button clicks                                                    */
    /* ---------------------------------------------------------------- */

    if (btnDec) {
      NB.on(btnDec, 'click', function (e) {
        e.preventDefault();
        decrement();
        field.focus();
      });
    }

    if (btnInc) {
      NB.on(btnInc, 'click', function (e) {
        e.preventDefault();
        increment();
        field.focus();
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowUp / ArrowDown                                    */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'keydown', function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        increment();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        decrement();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Validate on blur                                                 */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'blur', function () {
      var v = getValue();
      setValue(v);
    });

    /* ---------------------------------------------------------------- */
    /*  Input change                                                     */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'change', function () {
      var v = getValue();
      setValue(v);
    });
  });

})(window.NB);
