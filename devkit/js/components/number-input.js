/**
 * DK Number Input Component
 * Numeric stepper with increment/decrement buttons and keyboard support.
 *
 * Usage:
 *   <div class="dk-number-input" data-dk-number-input>
 *     <button class="dk-number-input_btn" type="button" data-dk-action="decrement">&minus;</button>
 *     <input class="dk-number-input_field" type="number" value="0">
 *     <button class="dk-number-input_btn" type="button" data-dk-action="increment">+</button>
 *   </div>
 *
 * Data attributes:
 *   data-dk-number-input   — activates component
 *   data-dk-min="0"        — minimum value
 *   data-dk-max="100"      — maximum value
 *   data-dk-step="1"       — step increment
 *
 * Events:
 *   dk:number-change — detail: { value: number }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('number-input', function (el) {
    var field   = el.querySelector('.dk-number-input_field');
    var btnDec  = el.querySelector('[data-dk-action="decrement"]');
    var btnInc  = el.querySelector('[data-dk-action="increment"]');

    if (!field) return;

    var min  = parseFloat(el.getAttribute('data-dk-min'));
    var max  = parseFloat(el.getAttribute('data-dk-max'));
    var step = parseFloat(el.getAttribute('data-dk-step')) || 1;

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
      DK.emit(el, 'dk:number-change', { value: clamped });
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
      DK.on(btnDec, 'click', function (e) {
        e.preventDefault();
        decrement();
        field.focus();
      });
    }

    if (btnInc) {
      DK.on(btnInc, 'click', function (e) {
        e.preventDefault();
        increment();
        field.focus();
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowUp / ArrowDown                                    */
    /* ---------------------------------------------------------------- */

    DK.on(field, 'keydown', function (e) {
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

    DK.on(field, 'blur', function () {
      var v = getValue();
      setValue(v);
    });

    /* ---------------------------------------------------------------- */
    /*  Input change                                                     */
    /* ---------------------------------------------------------------- */

    DK.on(field, 'change', function () {
      var v = getValue();
      setValue(v);
    });
  });

})(window.DK);
