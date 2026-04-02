/**
 * DK Alert Dismiss Component
 * Handles dismissing alerts with a fade-out animation and DOM removal.
 *
 * Usage:
 *   <div class="dk-alert dk-alert--info" data-dk-alert>
 *     <span class="dk-alert_icon">...</span>
 *     <div class="dk-alert_content">
 *       <div class="dk-alert_title">Title</div>
 *       Message text
 *     </div>
 *     <button class="dk-alert_close" data-dk-alert-dismiss>
 *       &times;
 *     </button>
 *   </div>
 *
 * Events:
 *   dk:alert-dismiss — on the alert element, before removal
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Dismiss handler                                                    */
  /* ------------------------------------------------------------------ */

  function dismissAlert(alertEl) {
    if (!alertEl || alertEl._dkDismissed) return;
    alertEl._dkDismissed = true;

    DK.emit(alertEl, 'dk:alert-dismiss');

    /* Fade out */
    alertEl.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    alertEl.style.opacity = '0';
    alertEl.style.transform = 'translateY(-4px)';

    /* Remove from DOM after transition */
    setTimeout(function () {
      if (alertEl.parentNode) {
        alertEl.parentNode.removeChild(alertEl);
      }
    }, 160);
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  DK.register('alert', function (el) {
    var closeBtn = el.querySelector('[data-dk-alert-dismiss]');
    if (!closeBtn) return;

    DK.on(closeBtn, 'click', function () {
      dismissAlert(el);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Delegated click handler for dismiss buttons                        */
  /* ------------------------------------------------------------------ */

  DK.on(document, 'click', function (e) {
    var btn = e.target.closest('[data-dk-alert-dismiss]');
    if (!btn) return;

    var alert = btn.closest('.dk-alert');
    if (alert) {
      dismissAlert(alert);
    }
  });

})(window.DK);
