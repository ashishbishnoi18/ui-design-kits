/**
 * NB Date Range Picker Component
 * Dual calendar with start/end selection, range highlighting, and presets.
 *
 * Usage:
 *   <div data-nb-date-range class="nb-date-range">
 *     <div class="nb-date-range_inputs">
 *       <input class="nb-date-range_input" placeholder="Start date" readonly>
 *       <span class="nb-date-range_separator">&rarr;</span>
 *       <input class="nb-date-range_input" placeholder="End date" readonly>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-date-range — init marker
 *   data-nb-format     — date format (default: "YYYY-MM-DD")
 *
 * Events:
 *   nb:range-change — detail: { start: Date|null, end: Date|null, startStr: string, endStr: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MONTHS = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  var DAYS_SHORT = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  var PRESETS = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 14 days', days: 14 },
    { label: 'Last 30 days', days: 30 },
    { label: 'This month', days: -1 },
    { label: 'Last month', days: -2 }
  ];

  NB.register('date-range', function (el) {

    var inputs = NB.$$('.nb-date-range_input', el);
    if (inputs.length < 2) return;
    var startInput = inputs[0];
    var endInput = inputs[1];

    var format = el.getAttribute('data-nb-format') || 'YYYY-MM-DD';
    var startDate = null;
    var endDate = null;
    var hoverDate = null; // for preview
    var leftYear, leftMonth;
    var dropdown = null;
    var leftCal = null;
    var rightCal = null;
    var releaseFocus = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function parseISO(s) {
      var p = s.split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    function toISO(d) {
      return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
    }

    function formatDate(d) {
      if (!d) return '';
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

    function stripTime(d) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    /* ---------------------------------------------------------------- */
    /*  Build DOM                                                        */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'nb-date-range_dropdown';
      dropdown.setAttribute('role', 'dialog');
      dropdown.setAttribute('aria-modal', 'true');
      dropdown.setAttribute('aria-label', 'Choose date range');

      // Presets
      var presets = document.createElement('div');
      presets.className = 'nb-date-range_presets';
      PRESETS.forEach(function (p) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nb-date-range_preset';
        btn.textContent = p.label;
        btn.setAttribute('tabindex', '-1');
        NB.on(btn, 'click', function (e) {
          e.stopPropagation();
          applyPreset(p);
          NB.$$('.nb-date-range_preset', presets).forEach(function (b) {
            b.classList.remove('is-active');
          });
          btn.classList.add('is-active');
        });
        presets.appendChild(btn);
      });
      dropdown.appendChild(presets);

      // Calendars
      var cals = document.createElement('div');
      cals.className = 'nb-date-range_calendars';

      leftCal = buildCalendar('left');
      rightCal = buildCalendar('right');
      cals.appendChild(leftCal);
      cals.appendChild(rightCal);
      dropdown.appendChild(cals);

      el.appendChild(dropdown);
    }

    function buildCalendar(side) {
      var cal = document.createElement('div');
      cal.className = 'nb-date-range_calendar';
      cal.setAttribute('data-side', side);

      var header = document.createElement('div');
      header.className = 'nb-date-range_header';

      var title = document.createElement('span');
      title.className = 'nb-date-range_title';

      if (side === 'left') {
        var prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'nb-date-range_nav-btn';
        prevBtn.innerHTML = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2L4 7l5 5"/></svg>';
        prevBtn.setAttribute('aria-label', 'Previous month');
        NB.on(prevBtn, 'click', function (e) { e.stopPropagation(); changeMonth(-1); });
        header.appendChild(prevBtn);
      }

      header.appendChild(title);

      if (side === 'right') {
        var nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'nb-date-range_nav-btn';
        nextBtn.innerHTML = '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 2l5 5-5 5"/></svg>';
        nextBtn.setAttribute('aria-label', 'Next month');
        NB.on(nextBtn, 'click', function (e) { e.stopPropagation(); changeMonth(1); });
        header.appendChild(nextBtn);
      }

      cal.appendChild(header);

      // Weekdays
      var weekdays = document.createElement('div');
      weekdays.className = 'nb-date-range_weekdays';
      DAYS_SHORT.forEach(function (d) {
        var span = document.createElement('span');
        span.className = 'nb-date-range_weekday';
        span.textContent = d;
        weekdays.appendChild(span);
      });
      cal.appendChild(weekdays);

      var days = document.createElement('div');
      days.className = 'nb-date-range_days';
      cal.appendChild(days);

      return cal;
    }

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function render() {
      renderMonth(leftCal, leftYear, leftMonth);
      // Right calendar is always next month
      var rYear = leftMonth === 11 ? leftYear + 1 : leftYear;
      var rMonth = (leftMonth + 1) % 12;
      renderMonth(rightCal, rYear, rMonth);
    }

    function renderMonth(cal, year, month) {
      var title = NB.$('.nb-date-range_title', cal);
      title.textContent = MONTHS[month] + ' ' + year;

      var grid = NB.$('.nb-date-range_days', cal);
      grid.innerHTML = '';

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      var daysInPrev = new Date(year, month, 0).getDate();
      var today = new Date();

      // Prev month fill
      for (var p = firstDay - 1; p >= 0; p--) {
        var pd = new Date(year, month - 1, daysInPrev - p);
        addRangeDay(grid, pd, true);
      }

      // Current
      for (var d = 1; d <= daysInMonth; d++) {
        addRangeDay(grid, new Date(year, month, d), false);
      }

      // Fill to complete weeks
      var total = firstDay + daysInMonth;
      var remaining = (Math.ceil(total / 7) * 7) - total;
      for (var n = 1; n <= remaining; n++) {
        addRangeDay(grid, new Date(year, month + 1, n), true);
      }
    }

    function addRangeDay(grid, date, isOutside) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nb-date-range_day';
      btn.textContent = date.getDate();
      btn.setAttribute('tabindex', '-1');
      btn.setAttribute('data-date', toISO(date));

      var today = new Date();
      if (sameDay(date, today)) btn.classList.add('is-today');
      if (isOutside) btn.classList.add('is-outside');

      var ds = stripTime(date);

      if (startDate && sameDay(ds, startDate)) btn.classList.add('is-start');
      if (endDate && sameDay(ds, endDate)) btn.classList.add('is-end');

      // In-range
      if (startDate && endDate && ds > startDate && ds < endDate) {
        btn.classList.add('is-in-range');
      }

      // Hover preview
      if (startDate && !endDate && hoverDate) {
        var rangeStart = startDate < hoverDate ? startDate : hoverDate;
        var rangeEnd = startDate < hoverDate ? hoverDate : startDate;
        if (ds > rangeStart && ds < rangeEnd) {
          btn.classList.add('is-in-range');
        }
        if (sameDay(ds, hoverDate)) {
          btn.classList.add(startDate < hoverDate ? 'is-end' : 'is-start');
        }
      }

      NB.on(btn, 'click', function (e) {
        e.stopPropagation();
        handleDayClick(date);
      });

      NB.on(btn, 'mouseenter', function () {
        if (startDate && !endDate) {
          hoverDate = stripTime(date);
          render();
        }
      });

      grid.appendChild(btn);
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function handleDayClick(date) {
      var d = stripTime(date);
      if (!startDate || (startDate && endDate)) {
        // Start new selection
        startDate = d;
        endDate = null;
        hoverDate = null;
      } else {
        // Set end
        if (d < startDate) {
          endDate = startDate;
          startDate = d;
        } else {
          endDate = d;
        }
        hoverDate = null;
      }
      updateInputs();
      render();

      if (startDate && endDate) {
        emitChange();
      }
    }

    function updateInputs() {
      startInput.value = formatDate(startDate);
      endInput.value = formatDate(endDate);
    }

    function emitChange() {
      NB.emit(el, 'nb:range-change', {
        start: startDate,
        end: endDate,
        startStr: formatDate(startDate),
        endStr: formatDate(endDate)
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Presets                                                           */
    /* ---------------------------------------------------------------- */

    function applyPreset(preset) {
      var now = new Date();
      var today = stripTime(now);

      if (preset.days === 0) {
        startDate = today;
        endDate = today;
      } else if (preset.days === -1) {
        // This month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = today;
      } else if (preset.days === -2) {
        // Last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        endDate = today;
        startDate = new Date(today.getTime() - preset.days * 86400000);
      }

      leftYear = startDate.getFullYear();
      leftMonth = startDate.getMonth();
      hoverDate = null;
      updateInputs();
      render();
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function changeMonth(delta) {
      leftMonth += delta;
      if (leftMonth > 11) { leftMonth = 0; leftYear++; }
      if (leftMonth < 0) { leftMonth = 11; leftYear--; }
      render();
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      var ref = startDate || new Date();
      leftYear = ref.getFullYear();
      leftMonth = ref.getMonth();
      render();
      el.classList.add('is-open');
      startInput.setAttribute('aria-expanded', 'true');
      releaseFocus = NB.trapFocus(dropdown);
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      startInput.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      startInput.focus();
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
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

    startInput.setAttribute('aria-label', 'Start date');
    endInput.setAttribute('aria-label', 'End date');
    startInput.setAttribute('aria-haspopup', 'dialog');
    startInput.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();

    NB.on(startInput, 'click', function () { isOpen() ? close() : open(); });
    NB.on(endInput, 'click', function () { isOpen() ? close() : open(); });
    NB.on(el, 'keydown', handleKeydown);
    NB.on(document, 'click', handleOutsideClick);
  });

})(window.NB);
