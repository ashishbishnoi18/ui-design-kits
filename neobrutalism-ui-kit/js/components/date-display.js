/**
 * NB Date Display Component
 * Renders formatted dates with relative time support and auto-updates.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTH_LONG = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  var activeInstances = [];
  var timerStarted = false;

  /* ------------------------------------------------------------------ */
  /*  Format helpers                                                     */
  /* ------------------------------------------------------------------ */

  function formatRelative(date) {
    var now = Date.now();
    var diff = now - date.getTime();
    var absDiff = Math.abs(diff);
    var seconds = Math.floor(absDiff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    var weeks = Math.floor(days / 7);
    var months = Math.floor(days / 30);
    var years = Math.floor(days / 365);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    if (weeks < 5) return weeks + 'w ago';
    if (months < 12) return months + 'mo ago';
    return years + 'y ago';
  }

  function formatShort(date) {
    return MONTH_SHORT[date.getMonth()] + ' ' + date.getDate();
  }

  function formatLong(date) {
    return MONTH_LONG[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  function formatAbsolute(date) {
    return MONTH_LONG[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear() +
      ' at ' + date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
  }

  /* ------------------------------------------------------------------ */
  /*  Auto-update timer                                                  */
  /* ------------------------------------------------------------------ */

  function startTimer() {
    if (timerStarted) return;
    timerStarted = true;

    setInterval(function () {
      activeInstances.forEach(function (inst) {
        inst.update();
      });
    }, 60000);
  }

  /* ------------------------------------------------------------------ */
  /*  Component                                                          */
  /* ------------------------------------------------------------------ */

  NB.register('date', function (el) {
    var timestamp = el.getAttribute('data-nb-date');
    var format = el.getAttribute('data-nb-date-format') || 'relative';

    if (!timestamp || timestamp === 'true') return;

    var date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      var parts = timestamp.split('-');
      if (parts.length === 3) {
        date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      }
      if (isNaN(date.getTime())) return;
    }

    el.classList.add('nb-date');

    function update() {
      var text;
      switch (format) {
        case 'short':
          text = formatShort(date);
          el.classList.add('nb-date--compact');
          break;
        case 'long':
          text = formatLong(date);
          el.classList.add('nb-date--long');
          break;
        case 'relative':
        default:
          text = formatRelative(date);
          el.classList.add('nb-date--relative');

          var diff = Date.now() - date.getTime();
          if (diff < 300000) {
            el.classList.add('nb-date--recent');
          } else {
            el.classList.remove('nb-date--recent');
          }
          break;
      }

      el.textContent = text;
      el.setAttribute('title', formatAbsolute(date));
    }

    update();

    if (format === 'relative') {
      activeInstances.push({ update: update });
      startTimer();
    }
  });

})(window.NB);
