/**
 * NB Countdown Component
 * Counts down to a target datetime, updating every second.
 * Zero-pads all values, uses mono font from CSS.
 *
 * Usage:
 *   <div class="nb-countdown" data-nb-countdown="2026-12-31T23:59:59">
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-days>00</span>
 *       <span class="nb-countdown_label">Days</span>
 *     </div>
 *     <span class="nb-countdown_sep">:</span>
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-hours>00</span>
 *       <span class="nb-countdown_label">Hours</span>
 *     </div>
 *     <span class="nb-countdown_sep">:</span>
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-minutes>00</span>
 *       <span class="nb-countdown_label">Min</span>
 *     </div>
 *     <span class="nb-countdown_sep">:</span>
 *     <div class="nb-countdown_unit">
 *       <span class="nb-countdown_value" data-nb-seconds>00</span>
 *       <span class="nb-countdown_label">Sec</span>
 *     </div>
 *     <span class="nb-countdown_expired">Timer expired</span>
 *   </div>
 *
 * Attributes:
 *   data-nb-countdown — target datetime (ISO 8601 or any Date-parseable string)
 *
 * Events:
 *   nb:countdown-tick    — detail: { days, hours, minutes, seconds, total }
 *   nb:countdown-expired — when timer reaches zero
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('countdown', function (el) {
    var targetStr = el.getAttribute('data-nb-countdown');
    if (!targetStr) return;

    var target = new Date(targetStr).getTime();
    if (isNaN(target)) {
      console.warn('NB Countdown: invalid date "' + targetStr + '"');
      return;
    }

    var dayEl   = el.querySelector('[data-nb-days]');
    var hourEl  = el.querySelector('[data-nb-hours]');
    var minEl   = el.querySelector('[data-nb-minutes]');
    var secEl   = el.querySelector('[data-nb-seconds]');

    var timer   = null;
    var expired = false;

    /* -------------------------------------------------------------- */
    /*  Zero-pad                                                       */
    /* -------------------------------------------------------------- */

    function pad(n) {
      return n < 10 ? '0' + n : String(n);
    }

    /* -------------------------------------------------------------- */
    /*  Update display                                                 */
    /* -------------------------------------------------------------- */

    function tick() {
      var now  = Date.now();
      var diff = target - now;

      if (diff <= 0) {
        diff = 0;
        if (!expired) {
          expired = true;
          el.classList.add('is-expired');
          NB.emit(el, 'nb:countdown-expired');
          if (timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      }

      var totalSeconds = Math.floor(diff / 1000);
      var days    = Math.floor(totalSeconds / 86400);
      var hours   = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      if (dayEl)  dayEl.textContent  = pad(days);
      if (hourEl) hourEl.textContent = pad(hours);
      if (minEl)  minEl.textContent  = pad(minutes);
      if (secEl)  secEl.textContent  = pad(seconds);

      NB.emit(el, 'nb:countdown-tick', {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        total: totalSeconds,
      });
    }

    /* -------------------------------------------------------------- */
    /*  ARIA                                                           */
    /* -------------------------------------------------------------- */

    el.setAttribute('role', 'timer');
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', 'Countdown timer');
    }
    el.setAttribute('aria-live', 'off'); /* avoid flooding screen readers */

    /* -------------------------------------------------------------- */
    /*  Start                                                          */
    /* -------------------------------------------------------------- */

    tick(); /* immediate first render */
    if (!expired) {
      timer = setInterval(tick, 1000);
    }

    /* -------------------------------------------------------------- */
    /*  Cleanup on element removal (MutationObserver safety)           */
    /* -------------------------------------------------------------- */

    el._nbDestroy = function () {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
  });

})(window.NB);
