/**
 * NB Popover Component
 * Toggle popover content on trigger click. Closes on outside click
 * or Escape key. Manages ARIA attributes.
 *
 * Usage:
 *   <div class="nb-popover nb-popover--bottom" data-nb-popover>
 *     <button class="nb-popover_trigger">Click me</button>
 *     <div class="nb-popover_content">
 *       <div class="nb-popover_arrow"></div>
 *       Popover content
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:popover-open  — detail: { id }
 *   nb:popover-close — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var openPopovers = [];

  /* ------------------------------------------------------------------ */
  /*  Close a specific popover                                           */
  /* ------------------------------------------------------------------ */

  function closePopover(el) {
    if (!el.classList.contains('is-open')) return;

    el.classList.remove('is-open');

    var content = el.querySelector('.nb-popover__content');
    if (content) {
      content.setAttribute('aria-hidden', 'true');
    }

    var trigger = el.querySelector('.nb-popover__trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }

    var idx = openPopovers.indexOf(el);
    if (idx !== -1) openPopovers.splice(idx, 1);

    NB.emit(el, 'nb:popover-close', { id: el.id || null });
  }

  /* ------------------------------------------------------------------ */
  /*  Open a specific popover                                            */
  /* ------------------------------------------------------------------ */

  function openPopover(el) {
    if (el.classList.contains('is-open')) return;

    /* Close all other open popovers */
    var others = openPopovers.slice();
    for (var i = 0; i < others.length; i++) {
      closePopover(others[i]);
    }

    el.classList.add('is-open');

    var content = el.querySelector('.nb-popover__content');
    if (content) {
      content.setAttribute('aria-hidden', 'false');
    }

    var trigger = el.querySelector('.nb-popover__trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }

    openPopovers.push(el);
    NB.emit(el, 'nb:popover-open', { id: el.id || null });
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('popover', function (el) {
    if (!el.id) {
      el.id = NB.uid('popover');
    }

    var trigger = el.querySelector('.nb-popover__trigger');
    var content = el.querySelector('.nb-popover__content');

    if (!trigger || !content) return;

    /* ARIA setup */
    var contentId = content.id || NB.uid('popover-content');
    content.id = contentId;
    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', contentId);

    /* Toggle on trigger click */
    NB.on(trigger, 'click', function (e) {
      e.stopPropagation();
      if (el.classList.contains('is-open')) {
        closePopover(el);
      } else {
        openPopover(el);
      }
    });

    /* Escape key */
    NB.on(el, 'keydown', function (e) {
      if (e.key === 'Escape' && el.classList.contains('is-open')) {
        closePopover(el);
        trigger.focus();
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Close on outside click — delegated                                 */
  /* ------------------------------------------------------------------ */

  NB.on(document, 'click', function (e) {
    if (!openPopovers.length) return;

    var popovers = openPopovers.slice();
    for (var i = 0; i < popovers.length; i++) {
      if (!popovers[i].contains(e.target)) {
        closePopover(popovers[i]);
      }
    }
  });

})(window.NB);
