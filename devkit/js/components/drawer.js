/**
 * DK Drawer Component
 * Slide-in panel from right, left, or bottom with backdrop, Escape key,
 * and focus trap.
 *
 * Usage:
 *   <div class="dk-drawer-backdrop" data-dk-drawer>
 *     <div class="dk-drawer dk-drawer--right" id="my-drawer">
 *       <div class="dk-drawer_header">
 *         <h3 class="dk-drawer_title">Title</h3>
 *         <button class="dk-drawer_close">&times;</button>
 *       </div>
 *       <div class="dk-drawer_body">Content</div>
 *     </div>
 *   </div>
 *
 *   <button data-dk-drawer-open="my-drawer">Open</button>
 *
 * API:
 *   DK.drawer.open(id)
 *   DK.drawer.close(id)
 *
 * Events:
 *   dk:drawer-open   — detail: { id }
 *   dk:drawer-close  — detail: { id }
 *
 * @requires dk-core.js
 */
;(function (DK) {
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
    var backdrop = drawer.closest('.dk-drawer-backdrop');
    var panel = drawer.classList.contains('dk-drawer') ? drawer : drawer.querySelector('.dk-drawer');

    if (!panel || panel.classList.contains('is-open')) return;

    lockBody();
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    if (backdrop) {
      backdrop.classList.add('is-open');
    }

    panel._dkReleaseFocus = DK.trapFocus(panel);
    openDrawers.push(id);

    DK.emit(panel, 'dk:drawer-open', { id: id });
  }

  function closeDrawer(id) {
    var drawer = document.getElementById(id);
    if (!drawer) return;

    var backdrop = drawer.closest('.dk-drawer-backdrop');
    var panel = drawer.classList.contains('dk-drawer') ? drawer : drawer.querySelector('.dk-drawer');

    if (!panel || !panel.classList.contains('is-open')) return;

    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');

    if (backdrop) {
      backdrop.classList.remove('is-open');
    }

    if (panel._dkReleaseFocus) {
      panel._dkReleaseFocus();
      panel._dkReleaseFocus = null;
    }

    var idx = openDrawers.indexOf(id);
    if (idx !== -1) openDrawers.splice(idx, 1);

    unlockBody();
    DK.emit(panel, 'dk:drawer-close', { id: id });
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  DK.register('drawer', function (el) {
    /* el may be the backdrop or the drawer panel itself */
    var backdrop = el.classList.contains('dk-drawer-backdrop') ? el : null;
    var drawers = backdrop
      ? DK.$$('.dk-drawer', backdrop)
      : [el];

    drawers.forEach(function (panel) {
      var id = panel.id;
      if (!id) {
        id = DK.uid('drawer');
        panel.id = id;
      }

      panel.setAttribute('aria-hidden', 'true');

      /* Close button */
      var closeBtn = panel.querySelector('.dk-drawer_close');
      if (closeBtn) {
        DK.on(closeBtn, 'click', function () {
          closeDrawer(id);
        });
      }

      /* Escape key */
      DK.on(panel, 'keydown', function (e) {
        if (e.key === 'Escape') {
          closeDrawer(id);
        }
      });
    });

    /* Backdrop click */
    if (backdrop) {
      DK.on(backdrop, 'click', function (e) {
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
    var trigger = e.target.closest('[data-dk-drawer-open]');
    if (trigger) {
      var targetId = trigger.getAttribute('data-dk-drawer-open');
      if (targetId) openDrawer(targetId);
    }
  }

  DK.on(document, 'click', handleOpenTrigger);

  /** Remove the delegated open-trigger listener (called by DK.destroy). */
  DK._addCleanup(document, function () {
    DK.off(document, 'click', handleOpenTrigger);
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  DK.drawer = {
    open: openDrawer,
    close: closeDrawer,
  };

})(window.DK);
