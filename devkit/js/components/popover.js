/**
 * DK Popover Component
 * Toggle popover content on trigger click. Closes on outside click
 * or Escape key. Manages ARIA attributes.
 *
 * Usage:
 *   <div class="dk-popover dk-popover--bottom" data-dk-popover>
 *     <button class="dk-popover_trigger">Click me</button>
 *     <div class="dk-popover_content">
 *       <div class="dk-popover_arrow"></div>
 *       Popover content
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:popover-open  — detail: { id }
 *   dk:popover-close — detail: { id }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var openPopovers = [];

  /* ------------------------------------------------------------------ */
  /*  Close a specific popover                                           */
  /* ------------------------------------------------------------------ */

  function closePopover(el) {
    if (!el.classList.contains('is-open')) return;

    el.classList.remove('is-open');

    var content = el.querySelector('.dk-popover_content');
    if (content) {
      content.setAttribute('aria-hidden', 'true');
    }

    var trigger = el.querySelector('.dk-popover_trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'false');
    }

    var idx = openPopovers.indexOf(el);
    if (idx !== -1) openPopovers.splice(idx, 1);

    DK.emit(el, 'dk:popover-close', { id: el.id || null });
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

    var content = el.querySelector('.dk-popover_content');
    if (content) {
      content.setAttribute('aria-hidden', 'false');
    }

    var trigger = el.querySelector('.dk-popover_trigger');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }

    openPopovers.push(el);
    DK.emit(el, 'dk:popover-open', { id: el.id || null });
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  DK.register('popover', function (el) {
    if (!el.id) {
      el.id = DK.uid('popover');
    }

    var trigger = el.querySelector('.dk-popover_trigger');
    var content = el.querySelector('.dk-popover_content');

    if (!trigger || !content) return;

    /* ARIA setup */
    var contentId = content.id || DK.uid('popover-content');
    content.id = contentId;
    content.setAttribute('role', 'dialog');
    content.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', contentId);

    /* Toggle on trigger click */
    DK.on(trigger, 'click', function (e) {
      e.stopPropagation();
      if (el.classList.contains('is-open')) {
        closePopover(el);
      } else {
        openPopover(el);
      }
    });

    /* Escape key */
    DK.on(el, 'keydown', function (e) {
      if (e.key === 'Escape' && el.classList.contains('is-open')) {
        closePopover(el);
        trigger.focus();
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Close on outside click — delegated                                 */
  /* ------------------------------------------------------------------ */

  DK.on(document, 'click', function (e) {
    if (!openPopovers.length) return;

    var popovers = openPopovers.slice();
    for (var i = 0; i < popovers.length; i++) {
      if (!popovers[i].contains(e.target)) {
        closePopover(popovers[i]);
      }
    }
  });

})(window.DK);
