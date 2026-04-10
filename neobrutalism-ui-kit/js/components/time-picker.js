/**
 * NB Time Picker Component
 * Scrollable hour/minute columns with optional AM/PM toggle.
 *
 * Usage:
 *   <div data-nb-time-picker="24h" class="nb-time-picker">
 *     <div class="nb-time-picker_input-wrap">
 *       <input class="nb-time-picker_input" placeholder="Select time" readonly>
 *       <svg class="nb-time-picker_icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
 *         <circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/>
 *       </svg>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-time-picker — "12h" or "24h" (default: "24h")
 *   data-nb-value       — initial value (HH:MM or HH:MM AM/PM)
 *   data-nb-step        — minute step (default: 1)
 *
 * Events:
 *   nb:time-change — detail: { value: string, hour: number, minute: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('time-picker', function (el) {

    var input = NB.$('.nb-time-picker_input', el);
    if (!input) return;

    var mode = (el.getAttribute('data-nb-time-picker') || '24h').toLowerCase();
    var is12h = mode === '12h';
    var step = parseInt(el.getAttribute('data-nb-step'), 10) || 1;
    var valStr = el.getAttribute('data-nb-value');

    var selectedHour = -1;
    var selectedMinute = -1;
    var selectedPeriod = 'AM';
    var dropdown = null;
    var hourCol = null;
    var minuteCol = null;
    var releaseFocus = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function pad(n) { return String(n).padStart(2, '0'); }

    function formatTime() {
      if (selectedHour < 0 || selectedMinute < 0) return '';
      if (is12h) {
        var h = selectedHour === 0 ? 12 : (selectedHour > 12 ? selectedHour - 12 : selectedHour);
        return pad(h) + ':' + pad(selectedMinute) + ' ' + selectedPeriod;
      }
      return pad(selectedHour) + ':' + pad(selectedMinute);
    }

    function updateInput() {
      input.value = formatTime();
      if (selectedHour >= 0 && selectedMinute >= 0) {
        NB.emit(el, 'nb:time-change', {
          value: input.value,
          hour: selectedHour,
          minute: selectedMinute
        });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Build DOM                                                        */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-time-picker_dropdown';
      dropdown.setAttribute('role', 'listbox');
      dropdown.setAttribute('aria-label', 'Choose time');

      // Hour column
      hourCol = makeColumn('Hr', buildHours());
      dropdown.appendChild(hourCol);

      dropdown.appendChild(makeDivider());

      // Minute column
      minuteCol = makeColumn('Min', buildMinutes());
      dropdown.appendChild(minuteCol);

      // AM/PM if 12h
      if (is12h) {
        dropdown.appendChild(makeDivider());
        var periodWrap = document.createElement('div');
        periodWrap.className = 'nb-time-picker_period';

        var amBtn = makePeriodBtn('AM');
        var pmBtn = makePeriodBtn('PM');
        periodWrap.appendChild(amBtn);
        periodWrap.appendChild(pmBtn);
        dropdown.appendChild(periodWrap);
      }

      el.appendChild(dropdown);
    }

    function makeColumn(label, items) {
      var col = document.createElement('div');
      col.className = 'nb-time-picker_col';

      var lbl = document.createElement('div');
      lbl.className = 'nb-time-picker_col-label';
      lbl.textContent = label;
      col.appendChild(lbl);

      items.forEach(function (item) { col.appendChild(item); });
      return col;
    }

    function makeDivider() {
      var d = document.createElement('div');
      d.className = 'nb-time-picker_divider';
      return d;
    }

    function buildHours() {
      var max = is12h ? 12 : 23;
      var start = is12h ? 1 : 0;
      var items = [];
      for (var h = start; h <= max; h++) {
        items.push(makeItem(pad(h), h, 'hour'));
      }
      return items;
    }

    function buildMinutes() {
      var items = [];
      for (var m = 0; m < 60; m += step) {
        items.push(makeItem(pad(m), m, 'minute'));
      }
      return items;
    }

    function makeItem(text, value, type) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-time-picker_item';
      btn.textContent = text;
      btn.setAttribute('role', 'option');
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('data-value', value);
      btn.setAttribute('data-type', type);

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        if (type === 'hour') {
          selectedHour = is12h ? to24h(value, selectedPeriod) : value;
          highlightColumn(hourCol, btn);
        } else {
          selectedMinute = value;
          highlightColumn(minuteCol, btn);
        }
        updateInput();
      });

      return btn;
    }

    function makePeriodBtn(period) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-time-picker_period-btn';
      btn.textContent = period;
      btn.setAttribute('tabindex', '-1');

      if (period === selectedPeriod) btn.classList.add('is-active');

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        selectedPeriod = period;
        // Recalculate hour in 24h
        if (selectedHour >= 0) {
          var display12 = selectedHour % 12 || 12;
          selectedHour = to24h(display12, period);
        }
        // Update active states
        NB.$$('.nb-time-picker_period-btn', dropdown).forEach(function (b) {
          b.classList.toggle('is-active', b.textContent === period);
        });
        updateInput();
      });

      return btn;
    }

    function to24h(h12, period) {
      if (period === 'AM') return h12 === 12 ? 0 : h12;
      return h12 === 12 ? 12 : h12 + 12;
    }

    function highlightColumn(col, activeBtn) {
      NB.$$('.nb-time-picker_item', col).forEach(function (b) {
        b.classList.remove('is-selected');
        b.setAttribute('aria-selected', 'false');
      });
      activeBtn.classList.add('is-selected');
      activeBtn.setAttribute('aria-selected', 'true');
      // Scroll into view
      activeBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      el.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      releaseFocus = NB.trapFocus(dropdown);
      // Scroll to selected items
      scrollToSelected(hourCol, selectedHour, 'hour');
      scrollToSelected(minuteCol, selectedMinute, 'minute');
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      input.focus();
    }

    function scrollToSelected(col, value, type) {
      if (value < 0) return;
      var checkVal = value;
      if (type === 'hour' && is12h) {
        checkVal = value % 12 || 12;
      }
      var items = NB.$$('.nb-time-picker_item', col);
      items.forEach(function (b) {
        if (parseInt(b.getAttribute('data-value'), 10) === checkVal) {
          b.classList.add('is-selected');
          b.setAttribute('aria-selected', 'true');
          setTimeout(function () {
            b.scrollIntoView({ block: 'nearest' });
          }, 0);
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
        return;
      }

      if (!isOpen()) return;

      var current = document.activeElement;
      if (!current || !current.classList.contains('nb-time-picker_item')) return;

      var col = current.closest('.nb-time-picker_col');
      if (!col) return;

      var items = NB.$$('.nb-time-picker_item', col);
      var idx = items.indexOf(current);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) items[idx + 1].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) items[idx - 1].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        current.click();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Outside click                                                    */
    /* ---------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (isOpen() && !el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'listbox');
    input.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();

    // Parse initial value
    if (valStr) {
      var parts = valStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (parts) {
        var h = parseInt(parts[1], 10);
        var m = parseInt(parts[2], 10);
        if (is12h && parts[3]) {
          selectedPeriod = parts[3].toUpperCase();
          selectedHour = to24h(h, selectedPeriod);
        } else {
          selectedHour = h;
          if (is12h) selectedPeriod = h >= 12 ? 'PM' : 'AM';
        }
        selectedMinute = m;
        input.value = formatTime();
      }
    }

    NB.on(input, 'click', function () { isOpen() ? close() : open(); });
    NB.on(el, 'keydown', handleKeydown);
    NB.on(document, 'click', handleOutsideClick);
  });

})(window.NB);
