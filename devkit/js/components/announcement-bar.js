/**
 * DK Announcement Bar Component
 * Dismissable top-of-page notification bar with localStorage persistence.
 *
 * Usage:
 *   <div class="dk-announcement-bar" data-dk-announcement-bar
 *        data-dk-announcement-id="promo-2026">
 *     <span class="dk-announcement-bar_text">
 *       Big news! Check out our latest release.
 *     </span>
 *     <a class="dk-announcement-bar_link" href="#">Learn more &rarr;</a>
 *     <button class="dk-announcement-bar_close" aria-label="Dismiss">
 *       <svg>...</svg>
 *     </button>
 *   </div>
 *
 * Attributes:
 *   data-dk-announcement-id — unique key for localStorage persistence
 *                              (if absent, dismissal is session-only)
 *
 * Events:
 *   dk:announcement-dismiss — detail: { id }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var STORAGE_PREFIX = 'dk-announcement-dismissed-';

  DK.register('announcement-bar', function (el) {
    var closeBtn = DK.$('.dk-announcement-bar_close', el);
    var id       = el.getAttribute('data-dk-announcement-id') || '';

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

        DK.emit(el, 'dk:announcement-dismiss', { id: id });
      }, 200);
    }

    /* -------------------------------------------------------------- */
    /*  Bind close button                                              */
    /* -------------------------------------------------------------- */

    if (closeBtn) {
      DK.on(closeBtn, 'click', function (e) {
        e.preventDefault();
        dismiss();
      });
    }

    /* -------------------------------------------------------------- */
    /*  Public API on element                                          */
    /* -------------------------------------------------------------- */

    el._dkDismiss = dismiss;
  });

})(window.DK);
