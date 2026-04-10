/**
 * DK Modal Component
 * Manages modal open/close, backdrop click, Escape key, focus trap,
 * and body scroll lock.
 *
 * Usage:
 *   <div class="dk-modal-backdrop" id="my-modal" data-dk-modal>
 *     <div class="dk-modal">
 *       <div class="dk-modal_header">
 *         <h3 class="dk-modal_title">Title</h3>
 *         <button class="dk-modal_close">&times;</button>
 *       </div>
 *       <div class="dk-modal_body">Content</div>
 *       <div class="dk-modal_footer">Actions</div>
 *     </div>
 *   </div>
 *
 *   <button data-dk-modal-open="my-modal">Open</button>
 *
 * API:
 *   DK.modal.open(id)
 *   DK.modal.close(id)
 *   DK.modal.closeAll()
 *
 * Events:
 *   dk:modal-open   — detail: { id }
 *   dk:modal-close  — detail: { id }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var openModals = [];
  var scrollbarWidth = 0;

  /* ------------------------------------------------------------------ */
  /*  Scrollbar width measurement                                        */
  /* ------------------------------------------------------------------ */

  function measureScrollbar() {
    var outer = document.createElement('div');
    outer.style.cssText =
      'position:fixed;top:0;left:0;width:50px;height:50px;overflow:scroll;visibility:hidden;';
    document.body.appendChild(outer);
    scrollbarWidth = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);
  }

  /* ------------------------------------------------------------------ */
  /*  Scroll lock                                                        */
  /* ------------------------------------------------------------------ */

  function lockBody() {
    if (openModals.length > 0) return; // already locked
    if (!scrollbarWidth) measureScrollbar();
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth) {
      document.body.style.paddingRight = scrollbarWidth + 'px';
    }
  }

  function unlockBody() {
    if (openModals.length > 0) return; // other modals still open
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function openModal(id) {
    var backdrop = document.getElementById(id);
    if (!backdrop || backdrop.classList.contains('is-open')) return;

    lockBody();
    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');

    var modal = backdrop.querySelector('.dk-modal');
    if (modal) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
    }

    // Store release function for focus trap
    backdrop._dkReleaseFocus = DK.trapFocus(modal || backdrop);
    openModals.push(id);

    DK.emit(backdrop, 'dk:modal-open', { id: id });
  }

  function closeModal(id) {
    var backdrop = document.getElementById(id);
    if (!backdrop || !backdrop.classList.contains('is-open')) return;

    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');

    // Release focus trap
    if (backdrop._dkReleaseFocus) {
      backdrop._dkReleaseFocus();
      backdrop._dkReleaseFocus = null;
    }

    // Remove from open list
    var idx = openModals.indexOf(id);
    if (idx !== -1) openModals.splice(idx, 1);

    unlockBody();
    DK.emit(backdrop, 'dk:modal-close', { id: id });
  }

  function closeAll() {
    var ids = openModals.slice();
    for (var i = 0; i < ids.length; i++) {
      closeModal(ids[i]);
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  DK.register('modal', function (backdrop) {
    var id = backdrop.id;
    if (!id) {
      id = DK.uid('modal');
      backdrop.id = id;
    }

    backdrop.setAttribute('aria-hidden', 'true');

    /* Close button */
    var closeBtn = backdrop.querySelector('.dk-modal_close');
    if (closeBtn) {
      DK.on(closeBtn, 'click', function () {
        closeModal(id);
      });
    }

    /* Backdrop click */
    DK.on(backdrop, 'click', function (e) {
      if (e.target === backdrop) {
        closeModal(id);
      }
    });

    /* Escape key */
    DK.on(backdrop, 'keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal(id);
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Open triggers — delegated                                          */
  /* ------------------------------------------------------------------ */

  function handleOpenTrigger(e) {
    var trigger = e.target.closest('[data-dk-modal-open]');
    if (trigger) {
      var targetId = trigger.getAttribute('data-dk-modal-open');
      if (targetId) openModal(targetId);
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

  DK.modal = {
    open: openModal,
    close: closeModal,
    closeAll: closeAll,
  };

})(window.DK);
