/**
 * NB Announcement Bar Component
 * Dismissable top-of-page notification bar with localStorage persistence.
 *
 * Usage:
 *   <div class="nb-announcement-bar" data-nb-announcement-bar
 *        data-nb-announcement-id="promo-2026">
 *     <span class="nb-announcement-bar_text">
 *       Big news! Check out our latest release.
 *     </span>
 *     <a class="nb-announcement-bar_link" href="#">Learn more &rarr;</a>
 *     <button class="nb-announcement-bar_close" aria-label="Dismiss">
 *       <svg>...</svg>
 *     </button>
 *   </div>
 *
 * Attributes:
 *   data-nb-announcement-id — unique key for localStorage persistence
 *                              (if absent, dismissal is session-only)
 *
 * Events:
 *   nb:announcement-dismiss — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var STORAGE_PREFIX = 'nb-announcement-dismissed-';

  NB.register('announcement-bar', function (el) {
    var closeBtn = NB.$('.nb-announcement-bar_close', el);
    var id       = el.getAttribute('data-nb-announcement-id') || '';

    /* -------------------------------------------------------------- */
    /*  Check if previously dismissed                                  */
    /* -------------------------------------------------------------- */

    if (id) {
      try {
        if (localStorage.getItem(STORAGE_PREFIX + id) === '1') {
          el.classList.add('is-hidden');
          return;
        }
      } catch (e) {
        /* localStorage unavailable — treat as not dismissed */
      }
    }

    /* -------------------------------------------------------------- */
    /*  Dismiss handler                                                */
    /* -------------------------------------------------------------- */

    function dismiss() {
      el.classList.add('is-dismissing');

      /* After transition, fully hide */
      setTimeout(function () {
        el.classList.add('is-hidden');
        el.classList.remove('is-dismissing');

        /* Remember dismissal */
        if (id) {
          try {
            localStorage.setItem(STORAGE_PREFIX + id, '1');
          } catch (e) {
            /* ignore */
          }
        }

        NB.emit(el, 'nb:announcement-dismiss', { id: id });
      }, 200);
    }

    /* -------------------------------------------------------------- */
    /*  Bind close button                                              */
    /* -------------------------------------------------------------- */

    if (closeBtn) {
      NB.on(closeBtn, 'click', function (e) {
        e.preventDefault();
        dismiss();
      });
    }

    /* -------------------------------------------------------------- */
    /*  Public API on element                                          */
    /* -------------------------------------------------------------- */

    el._nbDismiss = dismiss;
  });

})(window.NB);
