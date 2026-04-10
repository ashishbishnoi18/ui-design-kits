/**
 * NB Drawer Component
 * Slide-in panel from right, left, or bottom with backdrop, Escape key,
 * and focus trap.
 *
 * Usage:
 *   <div class="nb-drawer-backdrop" data-nb-drawer>
 *     <div class="nb-drawer nb-drawer--right" id="my-drawer">
 *       <div class="nb-drawer_header">
 *         <h3 class="nb-drawer_title">Title</h3>
 *         <button class="nb-drawer_close">&times;</button>
 *       </div>
 *       <div class="nb-drawer_body">Content</div>
 *     </div>
 *   </div>
 *
 *   <button data-nb-drawer-open="my-drawer">Open</button>
 *
 * API:
 *   NB.drawer.open(id)
 *   NB.drawer.close(id)
 *
 * Events:
 *   nb:drawer-open   — detail: { id }
 *   nb:drawer-close  — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var openDrawers = [];

  /* ------------------------------------------------------------------ */
  /*  Scroll lock                                                        */
  /* ------------------------------------------------------------------ */

  function lockBody() {
    if (openDrawers.length > 0) return;
    document.body.style.overflow = 'hidden';
  }

  function unlockBody() {
    if (openDrawers.length > 0) return;
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function openDrawer(id) {
    var drawer = document.getElementById(id);
    if (!drawer) return;

    /* Determine if the target is the drawer itself or a backdrop wrapper */
    var backdrop = drawer.closest('.nb-drawer-backdrop');
    var panel = drawer.classList.contains('nb-drawer') ? drawer : drawer.querySelector('.nb-drawer');

    if (!panel || panel.classList.contains('is-open')) return;

    lockBody();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    if (backdrop) {
      backdrop.classList.add('is-open');
    }

    panel._nbReleaseFocus = NB.trapFocus(panel);
    openDrawers.push(id);

    NB.emit(panel, 'nb:drawer-open', { id: id });
  }

  function closeDrawer(id) {
    var drawer = document.getElementById(id);
    if (!drawer) return;

    var backdrop = drawer.closest('.nb-drawer-backdrop');
    var panel = drawer.classList.contains('nb-drawer') ? drawer : drawer.querySelector('.nb-drawer');

    if (!panel || !panel.classList.contains('is-open')) return;

    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');

    if (backdrop) {
      backdrop.classList.remove('is-open');
    }

    if (panel._nbReleaseFocus) {
      panel._nbReleaseFocus();
      panel._nbReleaseFocus = null;
    }

    var idx = openDrawers.indexOf(id);
    if (idx !== -1) openDrawers.splice(idx, 1);

    unlockBody();
    NB.emit(panel, 'nb:drawer-close', { id: id });
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('drawer', function (el) {
    /* el may be the backdrop or the drawer panel itself */
    var backdrop = el.classList.contains('nb-drawer-backdrop') ? el : null;
    var drawers = backdrop
      ? NB.$$('.nb-drawer', backdrop)
      : [el];

    drawers.forEach(function (panel) {
      var id = panel.id;
      if (!id) {
        id = NB.uid('drawer');
        panel.id = id;
      }

      panel.setAttribute('aria-hidden', 'true');

      /* Close button */
      var closeBtn = panel.querySelector('.nb-drawer__close');
      if (closeBtn) {
        NB.on(closeBtn, 'click', function () {
          closeDrawer(id);
        });
      }

      /* Escape key */
      NB.on(panel, 'keydown', function (e) {
        if (e.key === 'Escape') {
          closeDrawer(id);
        }
      });
    });

    /* Backdrop click */
    if (backdrop) {
      NB.on(backdrop, 'click', function (e) {
        if (e.target === backdrop) {
          /* Close the first open drawer in this backdrop */
          drawers.forEach(function (panel) {
            if (panel.classList.contains('is-open') && panel.id) {
              closeDrawer(panel.id);
            }
          });
        }
      });
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Open triggers — delegated                                          */
  /* ------------------------------------------------------------------ */

  function handleOpenTrigger(e) {
    var trigger = e.target.closest('[data-nb-drawer-open]');
    if (trigger) {
      var targetId = trigger.getAttribute('data-nb-drawer-open');
      if (targetId) openDrawer(targetId);
    }
  }

  NB.on(document, 'click', handleOpenTrigger);

  /** Remove the delegated open-trigger listener (called by NB.destroy). */
  NB._addCleanup(document, function () {
    NB.off(document, 'click', handleOpenTrigger);
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  NB.drawer = {
    open: openDrawer,
    close: closeDrawer,
  };

})(window.NB);
