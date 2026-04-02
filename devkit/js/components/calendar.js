/**
 * DK Calendar Component
 * Interactive month grid with keyboard navigation and date selection.
 * Emits dk:calendar-select on date pick.
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var CHEVRON_LEFT =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var CHEVRON_RIGHT =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  var MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function parseISO(str) {
    if (!str) return null;
    var p = str.split('-');
    if (p.length === 3) return new Date(+p[0], +p[1] - 1, +p[2]);
    var d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  function toISO(d) {
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
           a.getMonth() === b.getMonth() &&
           a.getDate() === b.getDate();
  }

  /* ------------------------------------------------------------------ */
  /*  Component                                                          */
  /* ------------------------------------------------------------------ */

  DK.register('calendar', function (el) {
    var valueAttr = el.getAttribute('data-dk-calendar');
    var minDate = parseISO(el.getAttribute('data-dk-calendar-min'));
    var maxDate = parseISO(el.getAttribute('data-dk-calendar-max'));
    var eventsAttr = el.getAttribute('data-dk-calendar-events');

    var events = {};
    if (eventsAttr) {
      try {
        var arr = JSON.parse(eventsAttr);
        arr.forEach(function (iso) { events[iso] = true; });
      } catch (e) { /* ignore */ }
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var selected = (valueAttr && valueAttr !== 'true') ? parseISO(valueAttr) : new Date(today);
    if (selected) selected.setHours(0, 0, 0, 0);

    var viewMonth = selected ? selected.getMonth() : today.getMonth();
    var viewYear = selected ? selected.getFullYear() : today.getFullYear();

    var titleEl, gridEl, prevBtn, nextBtn;

    /* ---------------------------------------------------------------- */
    /*  Build scaffold                                                   */
    /* ---------------------------------------------------------------- */

    function build() {
      el.innerHTML = '';
      el.classList.add('dk-calendar');

      var header = document.createElement('div');
      header.className = 'dk-calendar_header';

      titleEl = document.createElement('span');
      titleEl.className = 'dk-calendar_title';

      var nav = document.createElement('div');
      nav.className = 'dk-calendar_nav';

      prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.setAttribute('aria-label', 'Previous month');
      prevBtn.innerHTML = CHEVRON_LEFT;

      nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.setAttribute('aria-label', 'Next month');
      nextBtn.innerHTML = CHEVRON_RIGHT;

      nav.appendChild(prevBtn);
      nav.appendChild(nextBtn);

      header.appendChild(titleEl);
      header.appendChild(nav);
      el.appendChild(header);

      var weekdays = document.createElement('div');
      weekdays.className = 'dk-calendar_weekdays';
      WEEKDAYS.forEach(function (d) {
        var s = document.createElement('span');
        s.textContent = d;
        weekdays.appendChild(s);
      });
      el.appendChild(weekdays);

      gridEl = document.createElement('div');
      gridEl.className = 'dk-calendar_grid';
      gridEl.setAttribute('role', 'grid');
      el.appendChild(gridEl);
    }

    build();

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function isDisabled(d) {
      if (minDate && d < minDate) return true;
      if (maxDate && d > maxDate) return true;
      return false;
    }

    function render() {
      titleEl.textContent = MONTHS[viewMonth] + ' ' + viewYear;
      gridEl.innerHTML = '';

      var first = new Date(viewYear, viewMonth, 1);
      var startDow = first.getDay();
      var lastDay = new Date(viewYear, viewMonth + 1, 0).getDate();
      var prevLast = new Date(viewYear, viewMonth, 0).getDate();

      for (var i = 0; i < 42; i++) {
        var dayNum, cellDate, isOther = false;

        if (i < startDow) {
          dayNum = prevLast - startDow + 1 + i;
          cellDate = new Date(viewYear, viewMonth - 1, dayNum);
          isOther = true;
        } else if (i - startDow >= lastDay) {
          dayNum = i - startDow - lastDay + 1;
          cellDate = new Date(viewYear, viewMonth + 1, dayNum);
          isOther = true;
        } else {
          dayNum = i - startDow + 1;
          cellDate = new Date(viewYear, viewMonth, dayNum);
        }

        cellDate.setHours(0, 0, 0, 0);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dk-calendar_day';
        btn.textContent = cellDate.getDate();
        btn.setAttribute('data-date', toISO(cellDate));

        if (isOther) btn.classList.add('is-other-month');
        if (sameDay(cellDate, today)) btn.classList.add('is-today');
        if (selected && sameDay(cellDate, selected)) btn.classList.add('is-selected');
        if (events[toISO(cellDate)]) btn.classList.add('has-event');

        if (isDisabled(cellDate)) {
          btn.classList.add('is-disabled');
          btn.disabled = true;
        }

        gridEl.appendChild(btn);
      }
    }

    render();

    /* ---------------------------------------------------------------- */
    /*  Navigation                                                       */
    /* ---------------------------------------------------------------- */

    function prevMonth() {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      render();
    }

    function nextMonth() {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      render();
    }

    DK.on(prevBtn, 'click', function (e) { e.preventDefault(); prevMonth(); });
    DK.on(nextBtn, 'click', function (e) { e.preventDefault(); nextMonth(); });

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectDate(d) {
      selected = new Date(d);
      selected.setHours(0, 0, 0, 0);
      viewMonth = selected.getMonth();
      viewYear = selected.getFullYear();
      render();
      DK.emit(el, 'dk:calendar-select', { date: new Date(selected), iso: toISO(selected) });
    }

    DK.on(gridEl, 'click', function (e) {
      var btn = e.target.closest('.dk-calendar_day');
      if (!btn || btn.disabled) return;
      var d = parseISO(btn.getAttribute('data-date'));
      if (d) selectDate(d);
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    DK.on(gridEl, 'keydown', function (e) {
      var focused = document.activeElement;
      if (!focused || !focused.classList.contains('dk-calendar_day')) return;

      var d = parseISO(focused.getAttribute('data-date'));
      if (!d) return;

      var nd = null;
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() - 1); break;
        case 'ArrowRight': e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() + 1); break;
        case 'ArrowUp':    e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() - 7); break;
        case 'ArrowDown':  e.preventDefault(); nd = new Date(d); nd.setDate(nd.getDate() + 7); break;
        case 'Enter':      e.preventDefault(); if (!focused.disabled) selectDate(d); return;
        default: return;
      }

      if (!nd || isDisabled(nd)) return;
      nd.setHours(0, 0, 0, 0);

      if (nd.getMonth() !== viewMonth || nd.getFullYear() !== viewYear) {
        viewMonth = nd.getMonth();
        viewYear = nd.getFullYear();
        render();
      }

      var target = gridEl.querySelector('[data-date="' + toISO(nd) + '"]');
      if (target) target.focus();
    });
  });

})(window.DK);
