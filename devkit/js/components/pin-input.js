/**
 * DK PIN Input Component
 * Individual digit inputs with auto-advance, backspace, and paste support.
 *
 * Usage:
 *   <div class="dk-pin-input" data-dk-pin-input data-dk-length="6">
 *     <!-- Inputs are auto-generated, or provide them: -->
 *     <input class="dk-pin-input_field" maxlength="1" inputmode="numeric">
 *     ...
 *   </div>
 *
 * Data attributes:
 *   data-dk-pin-input          — activates component
 *   data-dk-length="6"         — number of digits (default 4)
 *   data-dk-mask="true"        — mask input as dots (password type)
 *
 * Events:
 *   dk:pin-change   — detail: { value: string, complete: boolean }
 *   dk:pin-complete — detail: { value: string }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('pin-input', function (el) {
    var length = parseInt(el.getAttribute('data-dk-length'), 10) || 4;
    var mask   = el.getAttribute('data-dk-mask') === 'true';

    /* ---------------------------------------------------------------- */
    /*  Auto-generate fields if none exist                               */
    /* ---------------------------------------------------------------- */

    var fields = DK.$$('.dk-pin-input_field', el);

    if (fields.length === 0) {
      for (var i = 0; i < length; i++) {
        var inp = document.createElement('input');
        inp.className = 'dk-pin-input_field';
        inp.type = mask ? 'password' : 'text';
        inp.maxLength = 1;
        inp.setAttribute('inputmode', 'numeric');
        inp.setAttribute('autocomplete', 'one-time-code');
        inp.setAttribute('aria-label', 'Digit ' + (i + 1) + ' of ' + length);
        el.appendChild(inp);
      }
      fields = DK.$$('.dk-pin-input_field', el);
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
        DK.emit(el, 'dk:pin-complete', { value: val });
      } else {
        el.classList.remove('is-complete');
      }

      DK.emit(el, 'dk:pin-change', { value: val, complete: complete });
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
      DK.on(field, 'input', function (e) {
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

      DK.on(field, 'keydown', function (e) {
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
      DK.on(field, 'focus', function () {
        setTimeout(function () { field.select(); }, 0);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Paste support: distribute digits across fields                    */
    /* ---------------------------------------------------------------- */

    DK.on(el, 'paste', function (e) {
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

})(window.DK);
