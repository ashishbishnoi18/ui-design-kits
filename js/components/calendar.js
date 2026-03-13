/**
 * NB Calendar Component
 * Interactive calendar grid with keyboard navigation and date selection.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  SVG icons                                                          */
  /* ------------------------------------------------------------------ */

  var CHEVRON_LEFT =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var CHEVRON_RIGHT =
    '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  var MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Parse an ISO date string (YYYY-MM-DD) into a local-midnight Date.
   * Falls back to new Date(str) for full ISO strings.
   */
  function parseISO(str) {
    if (!str) return null;
    var parts = str.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  /** Return "YYYY-MM-DD" for a Date. */
  function toISO(d) {
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return (
      y +
      '-' +
      (m < 10 ? '0' + m : m) +
      '-' +
      (day < 10 ? '0' + day : day)
    );
  }

  /** Compare two dates by year-month-day only. */
  function sameDay(a, b) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Component                                                          */
  /* ------------------------------------------------------------------ */

  NB.register('calendar', function (el) {
    var valueAttr = el.getAttribute('data-nb-calendar-value');
    var minDate = parseISO(el.getAttribute('data-nb-calendar-min'));
    var maxDate = parseISO(el.getAttribute('data-nb-calendar-max'));

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var selectedDate = parseISO(valueAttr) || new Date(today);
    selectedDate.setHours(0, 0, 0, 0);

    // viewMonth / viewYear control which month is displayed
    var viewMonth = selectedDate.getMonth();
    var viewYear = selectedDate.getFullYear();

    // DOM references
    var headerEl = null;
    var titleEl = null;
    var prevBtn = null;
    var nextBtn = null;
    var gridEl = null;

    /* ---------------------------------------------------------------- */
    /*  Scaffold                                                         */
    /* ---------------------------------------------------------------- */

    function buildScaffold() {
      el.innerHTML = '';
      el.classList.add('nb-calendar');

      // Header
      headerEl = document.createElement('div');
      headerEl.className = 'nb-calendar__header';

      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'nb-calendar__prev';
      prevBtn.setAttribute('aria-label', 'Previous month');
      prevBtn.innerHTML = CHEVRON_LEFT;

      titleEl = document.createElement('span');
      titleEl.className = 'nb-calendar__title';

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'nb-calendar__next';
      nextBtn.setAttribute('aria-label', 'Next month');
      nextBtn.innerHTML = CHEVRON_RIGHT;

      var navEl = document.createElement('div');
      navEl.className = 'nb-calendar__nav';
      navEl.appendChild(prevBtn);
      navEl.appendChild(nextBtn);

      headerEl.appendChild(titleEl);
      headerEl.appendChild(navEl);
      el.appendChild(headerEl);

      // Weekday headers
      var weekdaysEl = document.createElement('div');
      weekdaysEl.className = 'nb-calendar__weekdays';
      WEEKDAY_LABELS.forEach(function (label) {
        var span = document.createElement('span');
        span.className = 'nb-calendar__weekday';
        span.textContent = label;
        weekdaysEl.appendChild(span);
      });
      el.appendChild(weekdaysEl);

      // Grid
      gridEl = document.createElement('div');
      gridEl.className = 'nb-calendar__grid';
      gridEl.setAttribute('role', 'grid');
      el.appendChild(gridEl);
    }

    buildScaffold();

    /* ---------------------------------------------------------------- */
    /*  Rendering                                                        */
    /* ---------------------------------------------------------------- */

    function isDisabled(d) {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    }

    function renderGrid() {
      // Update title
      titleEl.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;

      // Clear grid
      gridEl.innerHTML = '';

      // First day of the displayed month
      var firstOfMonth = new Date(viewYear, viewMonth, 1);
      var startDow = firstOfMonth.getDay(); // 0 = Sun

      // Last day of the displayed month
      var lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
      var totalDays = lastOfMonth.getDate();

      // Days from previous month to fill the first row
      var prevMonthLast = new Date(viewYear, viewMonth, 0);
      var prevMonthDays = prevMonthLast.getDate();

      // Build 6 rows x 7 cols = 42 cells
      var cellDate;
      var totalCells = 42;

      for (var i = 0; i < totalCells; i++) {
        var dayNum;
        var isOtherMonth = false;

        if (i < startDow) {
          // Previous month
          dayNum = prevMonthDays - startDow + 1 + i;
          cellDate = new Date(viewYear, viewMonth - 1, dayNum);
          isOtherMonth = true;
        } else if (i - startDow >= totalDays) {
          // Next month
          dayNum = i - startDow - totalDays + 1;
          cellDate = new Date(viewYear, viewMonth + 1, dayNum);
          isOtherMonth = true;
        } else {
          // Current month
          dayNum = i - startDow + 1;
          cellDate = new Date(viewYear, viewMonth, dayNum);
        }

        cellDate.setHours(0, 0, 0, 0);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nb-calendar__day';
        btn.textContent = cellDate.getDate();
        btn.setAttribute('data-date', toISO(cellDate));

        if (isOtherMonth) btn.classList.add('nb-calendar__day--other-month');
        if (sameDay(cellDate, today)) btn.classList.add('nb-calendar__day--today');
        if (sameDay(cellDate, selectedDate)) btn.classList.add('nb-calendar__day--selected');

        if (isDisabled(cellDate)) {
          btn.classList.add('nb-calendar__day--disabled');
          btn.disabled = true;
        }

        gridEl.appendChild(btn);
      }
    }

    renderGrid();

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function goToPrevMonth() {
      viewMonth -= 1;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear -= 1;
      }
      renderGrid();
    }

    function goToNextMonth() {
      viewMonth += 1;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear += 1;
      }
      renderGrid();
    }

    NB.on(prevBtn, 'click', function (e) {
      e.preventDefault();
      goToPrevMonth();
    });

    NB.on(nextBtn, 'click', function (e) {
      e.preventDefault();
      goToNextMonth();
    });

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectDate(d) {
      selectedDate = new Date(d);
      selectedDate.setHours(0, 0, 0, 0);

      // Ensure the selected month is visible
      viewMonth = selectedDate.getMonth();
      viewYear = selectedDate.getFullYear();

      renderGrid();

      NB.emit(el, 'nb:calendar-select', {
        date: new Date(selectedDate),
        iso: toISO(selectedDate),
      });
    }

    NB.on(gridEl, 'click', function (e) {
      var btn = e.target.closest('.nb-calendar__day');
      if (!btn || btn.disabled) return;

      var iso = btn.getAttribute('data-date');
      var d = parseISO(iso);
      if (d) selectDate(d);
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    NB.on(gridEl, 'keydown', function (e) {
      var focused = document.activeElement;
      if (!focused || !focused.classList.contains('nb-calendar__day')) return;

      var iso = focused.getAttribute('data-date');
      var d = parseISO(iso);
      if (!d) return;

      var newDate = null;

      switch (e.key) {
        case 'ArrowLeft':
        case 'Left':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() - 1);
          break;

        case 'ArrowRight':
        case 'Right':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 1);
          break;

        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() - 7);
          break;

        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          newDate = new Date(d);
          newDate.setDate(newDate.getDate() + 7);
          break;

        case 'Enter':
          e.preventDefault();
          if (!focused.disabled) selectDate(d);
          return;

        case 'Escape':
          e.preventDefault();
          focused.blur();
          return;

        default:
          return;
      }

      if (!newDate) return;
      newDate.setHours(0, 0, 0, 0);

      if (isDisabled(newDate)) return;

      // Adjust view if we crossed a month boundary
      if (newDate.getMonth() !== viewMonth || newDate.getFullYear() !== viewYear) {
        viewMonth = newDate.getMonth();
        viewYear = newDate.getFullYear();
        renderGrid();
      }

      // Focus the corresponding button
      var target = gridEl.querySelector('[data-date="' + toISO(newDate) + '"]');
      if (target) target.focus();
    });
  });

})(window.NB);
