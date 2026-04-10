/**
 * NB Modal Component
 * Manages modal open/close, backdrop click, Escape key, focus trap,
 * and body scroll lock.
 *
 * Usage:
 *   <div class="nb-modal-backdrop" id="my-modal" data-nb-modal>
 *     <div class="nb-modal">
 *       <div class="nb-modal_header">
 *         <h3 class="nb-modal_title">Title</h3>
 *         <button class="nb-modal_close">&times;</button>
 *       </div>
 *       <div class="nb-modal_body">Content</div>
 *       <div class="nb-modal_footer">Actions</div>
 *     </div>
 *   </div>
 *
 *   <button data-nb-modal-open="my-modal">Open</button>
 *
 * API:
 *   NB.modal.open(id)
 *   NB.modal.close(id)
 *   NB.modal.closeAll()
 *
 * Events:
 *   nb:modal-open   — detail: { id }
 *   nb:modal-close  — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
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

    var modal = backdrop.querySelector('.nb-modal');
    if (modal) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
    }

    // Store release function for focus trap
    backdrop._nbReleaseFocus = NB.trapFocus(modal || backdrop);
    openModals.push(id);

    NB.emit(backdrop, 'nb:modal-open', { id: id });
  }

  function closeModal(id) {
    var backdrop = document.getElementById(id);
    if (!backdrop || !backdrop.classList.contains('is-open')) return;

    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');

    // Release focus trap
    if (backdrop._nbReleaseFocus) {
      backdrop._nbReleaseFocus();
      backdrop._nbReleaseFocus = null;
    }

    // Remove from open list
    var idx = openModals.indexOf(id);
    if (idx !== -1) openModals.splice(idx, 1);

    unlockBody();
    NB.emit(backdrop, 'nb:modal-close', { id: id });
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

  NB.register('modal', function (backdrop) {
    var id = backdrop.id;
    if (!id) {
      id = NB.uid('modal');
      backdrop.id = id;
    }

    backdrop.setAttribute('aria-hidden', 'true');

    /* Close button */
    var closeBtn = backdrop.querySelector('.nb-modal__close');
    if (closeBtn) {
      NB.on(closeBtn, 'click', function () {
        closeModal(id);
      });
    }

    /* Backdrop click */
    NB.on(backdrop, 'click', function (e) {
      if (e.target === backdrop) {
        closeModal(id);
      }
    });

    /* Escape key */
    NB.on(backdrop, 'keydown', function (e) {
      if (e.key === 'Escape') {
        closeModal(id);
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Open triggers — delegated                                          */
  /* ------------------------------------------------------------------ */

  function handleOpenTrigger(e) {
    var trigger = e.target.closest('[data-nb-modal-open]');
    if (trigger) {
      var targetId = trigger.getAttribute('data-nb-modal-open');
      if (targetId) openModal(targetId);
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

  NB.modal = {
    open: openModal,
    close: closeModal,
    closeAll: closeAll,
  };

})(window.NB);
