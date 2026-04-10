/**
 * NB Alert Dismiss Component
 * Handles dismissing alerts with a fade-out animation and DOM removal.
 *
 * Usage:
 *   <div class="nb-alert nb-alert--info" data-nb-alert>
 *     <span class="nb-alert_icon">...</span>
 *     <div class="nb-alert_content">
 *       <div class="nb-alert_title">Title</div>
 *       Message text
 *     </div>
 *     <button class="nb-alert_close" data-nb-alert-dismiss>
 *       &times;
 *     </button>
 *   </div>
 *
 * Events:
 *   nb:alert-dismiss — on the alert element, before removal
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Dismiss handler                                                    */
  /* ------------------------------------------------------------------ */

  function dismissAlert(alertEl) {
    if (!alertEl || alertEl._nbDismissed) return;
    alertEl._nbDismissed = true;

    NB.emit(alertEl, 'nb:alert-dismiss');

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

  NB.register('alert', function (el) {
    var closeBtn = el.querySelector('[data-nb-alert-dismiss]');
    if (!closeBtn) return;

    NB.on(closeBtn, 'click', function () {
      dismissAlert(el);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Delegated click handler for dismiss buttons                        */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'click', function (e) {
    var btn = e.target.closest('[data-nb-alert-dismiss]');
    if (!btn) return;

    var alert = btn.closest('.nb-alert');
    if (alert) {
      dismissAlert(alert);
    }
  });

})(window.NB);
