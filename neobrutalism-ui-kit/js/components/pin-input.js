/**
 * NB PIN Input Component
 * Individual digit inputs with auto-advance, backspace, and paste support.
 *
 * Usage:
 *   <div class="nb-pin-input" data-nb-pin-input data-nb-length="6">
 *     <!-- Inputs are auto-generated, or provide them: -->
 *     <input class="nb-pin-input_field" maxlength="1" inputmode="numeric">
 *     ...
 *   </div>
 *
 * Data attributes:
 *   data-nb-pin-input          — activates component
 *   data-nb-length="6"         — number of digits (default 4)
 *   data-nb-mask="true"        — mask input as dots (password type)
 *
 * Events:
 *   nb:pin-change   — detail: { value: string, complete: boolean }
 *   nb:pin-complete — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('pin-input', function (el) {
    var length = parseInt(el.getAttribute('data-nb-length'), 10) || 4;
    var mask   = el.getAttribute('data-nb-mask') === 'true';

    /* ---------------------------------------------------------------- */
    /*  Auto-generate fields if none exist                               */
    /* ---------------------------------------------------------------- */

    var fields = NB.$$('.nb-pin-input_field', el);

    if (fields.length === 0) {
      for (var i = 0; i < length; i++) {
        var inp = document.createElement('input');
        inp.className = 'nb-pin-input_field';
        inp.type = mask ? 'password' : 'text';
        inp.maxLength = 1;
        inp.setAttribute('inputmode', 'numeric');
        inp.setAttribute('autocomplete', 'one-time-code');
        inp.setAttribute('aria-label', 'Digit ' + (i + 1) + ' of ' + length);
        el.appendChild(inp);
      }
      fields = NB.$$('.nb-pin-input_field', el);
    }

    /* Trim to length */
    fields = fields.slice(0, length);

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', 'PIN input');

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getFullValue() {
      var val = '';
      for (var i = 0; i < fields.length; i++) {
        val += fields[i].value || '';
      }
      return val;
    }

    function checkComplete() {
      var val = getFullValue();
      var complete = val.length === length;

      if (complete) {
        el.classList.add('is-complete');
        NB.emit(el, 'nb:pin-complete', { value: val });
      } else {
        el.classList.remove('is-complete');
      }

      NB.emit(el, 'nb:pin-change', { value: val, complete: complete });
    }

    function updateFilledState() {
      fields.forEach(function (f) {
        if (f.value) {
          f.classList.add('is-filled');
        } else {
          f.classList.remove('is-filled');
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Input handling                                                    */
    /* ---------------------------------------------------------------- */

    fields.forEach(function (field, idx) {
      NB.on(field, 'input', function (e) {
        /* Allow only single digit */
        var val = field.value.replace(/[^0-9]/g, '');
        field.value = val.slice(0, 1);

        updateFilledState();

        /* Auto-advance to next */
        if (field.value && idx < fields.length - 1) {
          fields[idx + 1].focus();
          fields[idx + 1].select();
        }

        checkComplete();
      });

      NB.on(field, 'keydown', function (e) {
        /* Backspace: clear current, then move back */
        if (e.key === 'Backspace') {
          if (!field.value && idx > 0) {
            e.preventDefault();
            fields[idx - 1].value = '';
            fields[idx - 1].focus();
            updateFilledState();
            checkComplete();
          }
          return;
        }

        /* ArrowLeft / ArrowRight */
        if (e.key === 'ArrowLeft' && idx > 0) {
          e.preventDefault();
          fields[idx - 1].focus();
          fields[idx - 1].select();
          return;
        }
        if (e.key === 'ArrowRight' && idx < fields.length - 1) {
          e.preventDefault();
          fields[idx + 1].focus();
          fields[idx + 1].select();
          return;
        }
      });

      /* Select all on focus */
      NB.on(field, 'focus', function () {
        setTimeout(function () { field.select(); }, 0);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Paste support: distribute digits across fields                    */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'paste', function (e) {
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      var digits = pasted.replace(/[^0-9]/g, '').split('');

      if (digits.length === 0) return;
      e.preventDefault();

      for (var i = 0; i < fields.length && i < digits.length; i++) {
        fields[i].value = digits[i];
      }

      /* Focus the next empty field or the last field */
      var nextEmpty = digits.length < fields.length ? digits.length : fields.length - 1;
      fields[nextEmpty].focus();

      updateFilledState();
      checkComplete();
    });
  });

})(window.NB);
