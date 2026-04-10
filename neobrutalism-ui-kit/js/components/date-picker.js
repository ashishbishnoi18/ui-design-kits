/**
 * NB Date Picker Component
 * Input field + calendar dropdown with month/year navigation.
 * Keyboard: arrows navigate days, Enter selects, Escape closes.
 *
 * Usage:
 *   <div data-nb-date-picker class="nb-date-picker">
 *     <div class="nb-date-picker_input-wrap">
 *       <input class="nb-date-picker_input" placeholder="Select date" readonly>
 *       <svg class="nb-date-picker_icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
 *         <rect x="2" y="3" width="12" height="11" rx="2"/><path d="M2 7h12M5 1v4M11 1v4"/>
 *       </svg>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-date-picker     — init marker
 *   data-nb-format           — date format string (default: "YYYY-MM-DD")
 *   data-nb-min              — minimum date (YYYY-MM-DD)
 *   data-nb-max              — maximum date (YYYY-MM-DD)
 *   data-nb-value            — initial value (YYYY-MM-DD)
 *
 * Events:
 *   nb:date-change — detail: { value: string, date: Date }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MONTHS = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  var DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  NB.register('date-picker', function (el) {

    var input = NB.$('.nb-date-picker_input', el);
    if (!input) return;

    var format = el.getAttribute('data-nb-format') || 'YYYY-MM-DD';
    var minStr = el.getAttribute('data-nb-min');
    var maxStr = el.getAttribute('data-nb-max');
    var valStr = el.getAttribute('data-nb-value');
    var minDate = minStr ? parseISO(minStr) : null;
    var maxDate = maxStr ? parseISO(maxStr) : null;

    var viewYear, viewMonth; // current calendar view
    var selectedDate = null;
    var focusedDay = null;
    var dropdown = null;
    var daysGrid = null;
    var titleEl = null;
    var releaseFocus = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function parseISO(s) {
      var p = s.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    function formatDate(d) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return format.replace('YYYY', y).replace('MM', m).replace('DD', day);
    }

    function sameDay(a, b) {
      return a && b &&
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
    }

    function isDisabled(d) {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    }

    /* ---------------------------------------------------------------- */
    /*  Build calendar DOM                                                */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-date-picker_dropdown';
      dropdown.setAttribute('role', 'dialog');
      dropdown.setAttribute('aria-modal', 'true');
      dropdown.setAttribute('aria-label', 'Choose date');

      // Header
      var header = document.createElement('div');
      header.className = 'nb-date-picker_header';

      var navLeft = document.createElement('div');
      navLeft.className = 'nb-date-picker_nav';

      var prevBtn = makeNavBtn('prev', '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2L4 7l5 5"/></svg>');
      navLeft.appendChild(prevBtn);

      titleEl = document.createElement('span');
      titleEl.className = 'nb-date-picker_title';
      titleEl.setAttribute('aria-live', 'polite');

      var navRight = document.createElement('div');
      navRight.className = 'nb-date-picker_nav';
      var nextBtn = makeNavBtn('next', '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 2l5 5-5 5"/></svg>');
      navRight.appendChild(nextBtn);

      header.appendChild(navLeft);
      header.appendChild(titleEl);
      header.appendChild(navRight);
      dropdown.appendChild(header);

      // Weekday headers
      var weekdays = document.createElement('div');
      weekdays.className = 'nb-date-picker_weekdays';
      weekdays.setAttribute('role', 'row');
      DAYS_SHORT.forEach(function (d) {
        var span = document.createElement('span');
        span.className = 'nb-date-picker_weekday';
        span.textContent = d;
        span.setAttribute('role', 'columnheader');
        weekdays.appendChild(span);
      });
      dropdown.appendChild(weekdays);

      // Days grid
      daysGrid = document.createElement('div');
      daysGrid.className = 'nb-date-picker_days';
      daysGrid.setAttribute('role', 'grid');
      daysGrid.setAttribute('aria-label', 'Calendar');
      dropdown.appendChild(daysGrid);

      el.appendChild(dropdown);

      NB.on(prevBtn, 'click', function (e) { e.stopPropagation(); changeMonth(-1); });
      NB.on(nextBtn, 'click', function (e) { e.stopPropagation(); changeMonth(1); });
    }

    function makeNavBtn(dir, svgHTML) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-date-picker_nav-btn';
      btn.innerHTML = svgHTML;
      btn.setAttribute('aria-label', dir === 'prev' ? 'Previous month' : 'Next month');
      return btn;
    }

    /* ---------------------------------------------------------------- */
    /*  Render days                                                       */
    /* ---------------------------------------------------------------- */

    function render() {
      titleEl.textContent = MONTHS[viewMonth] + ' ' + viewYear;
      daysGrid.innerHTML = '';

      var firstDay = new Date(viewYear, viewMonth, 1).getDay();
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
      var today = new Date();

      // Previous month trailing days
      for (var p = firstDay - 1; p >= 0; p--) {
        var pd = new Date(viewYear, viewMonth - 1, daysInPrev - p);
        addDayBtn(pd, true);
      }

      // Current month
      for (var d = 1; d <= daysInMonth; d++) {
        var cd = new Date(viewYear, viewMonth, d);
        addDayBtn(cd, false);
      }

      // Fill to 42 cells (6 rows)
      var total = firstDay + daysInMonth;
      var remaining = (Math.ceil(total / 7) * 7) - total;
      for (var n = 1; n <= remaining; n++) {
        var nd = new Date(viewYear, viewMonth + 1, n);
        addDayBtn(nd, true);
      }
    }

    function addDayBtn(date, isOutside) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-date-picker_day';
      btn.textContent = date.getDate();
      btn.setAttribute('role', 'gridcell');
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('data-date', date.toISOString().split('T')[0]);

      var today = new Date();
      if (sameDay(date, today)) btn.classList.add('is-today');
      if (sameDay(date, selectedDate)) btn.classList.add('is-selected');
      if (isOutside) btn.classList.add('is-outside');
      if (isDisabled(date)) btn.classList.add('is-disabled');

      if (sameDay(date, focusedDay)) {
        btn.setAttribute('tabindex', '0');
      }

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        selectDate(date);
      });

      daysGrid.appendChild(btn);
    }

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function changeMonth(delta) {
      viewMonth += delta;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      focusedDay = new Date(viewYear, viewMonth, 1);
      render();
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectDate(date) {
      if (isDisabled(date)) return;
      selectedDate = date;
      input.value = formatDate(date);
      el.setAttribute('data-nb-value', date.toISOString().split('T')[0]);
      NB.emit(el, 'nb:date-change', { value: input.value, date: date });
      close();
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      var now = selectedDate || new Date();
      viewYear = now.getFullYear();
      viewMonth = now.getMonth();
      focusedDay = selectedDate || new Date();
      render();
      el.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      releaseFocus = NB.trapFocus(dropdown);
      // Focus the selected or today cell
      var sel = NB.$('.is-selected', daysGrid) || NB.$('.is-today', daysGrid) || NB.$('.nb-date-picker_day', daysGrid);
      if (sel) { sel.setAttribute('tabindex', '0'); sel.focus(); }
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      input.focus();
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (!isOpen()) return;

      var dayBtns = NB.$$('.nb-date-picker_day:not(.is-disabled)', daysGrid);
      var current = document.activeElement;
      var idx = dayBtns.indexOf(current);

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(dayBtns, idx, 1);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(dayBtns, idx, -1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(dayBtns, idx, 7);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(dayBtns, idx, -7);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (current && current.classList.contains('nb-date-picker_day')) {
            var dateStr = current.getAttribute('data-date');
            if (dateStr) selectDate(parseISO(dateStr));
          }
          break;
      }
    }

    function moveFocus(btns, fromIdx, delta) {
      if (fromIdx < 0) return;
      var next = fromIdx + delta;
      if (next >= 0 && next < btns.length) {
        btns.forEach(function (b) { b.setAttribute('tabindex', '-1'); });
        btns[next].setAttribute('tabindex', '0');
        btns[next].focus();
      } else if (delta > 0) {
        changeMonth(1);
        setTimeout(function () {
          var newBtns = NB.$$('.nb-date-picker_day:not(.is-disabled)', daysGrid);
          if (newBtns.length) { newBtns[0].setAttribute('tabindex', '0'); newBtns[0].focus(); }
        }, 0);
      } else {
        changeMonth(-1);
        setTimeout(function () {
          var newBtns = NB.$$('.nb-date-picker_day:not(.is-disabled)', daysGrid);
          if (newBtns.length) {
            var last = newBtns[newBtns.length - 1];
            last.setAttribute('tabindex', '0');
            last.focus();
          }
        }, 0);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Outside click                                                    */
    /* ---------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (isOpen() && !el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();

    if (valStr) {
      selectedDate = parseISO(valStr);
      input.value = formatDate(selectedDate);
    }

    NB.on(input, 'click', function () { isOpen() ? close() : open(); });
    NB.on(el, 'keydown', handleKeydown);
    NB.on(document, 'click', handleOutsideClick);
  });

})(window.NB);
