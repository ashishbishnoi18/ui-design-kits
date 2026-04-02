/**
 * DK Accordion Component
 * Toggles accordion items open/closed with animated max-height.
 * Supports single-open mode via data-dk-accordion="single".
 * Keyboard accessible: Enter / Space to toggle.
 * ARIA: aria-expanded on trigger, aria-controls linking to content panel.
 *
 * Usage:
 *   <div class="dk-accordion" data-dk-accordion>              (multi-open)
 *   <div class="dk-accordion" data-dk-accordion="single">     (single-open)
 *     <div class="dk-accordion_item">
 *       <button class="dk-accordion_trigger">
 *         Section Title
 *         <svg class="dk-accordion_icon">...</svg>
 *       </button>
 *       <div class="dk-accordion_content">
 *         <div class="dk-accordion_body">Content here</div>
 *       </div>
 *     </div>
 *   </div>
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('accordion', function (el) {

    var mode     = el.getAttribute('data-dk-accordion'); // "single" or ""
    var isSingle = mode === 'single';
    var items    = DK.$$('.dk-accordion_item', el);

    if (!items.length) return;

    /* -------------------------------------------------------------- */
    /*  Setup ARIA attributes                                          */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      var trigger = DK.$('.dk-accordion_trigger', item);
      var content = DK.$('.dk-accordion_content', item);
      if (!trigger || !content) return;

      // Generate unique IDs for ARIA linking
      var panelId  = content.id || DK.uid('dk-acc-panel');
      var triggerId = trigger.id || DK.uid('dk-acc-trigger');

      content.id = panelId;
      trigger.id = triggerId;

      trigger.setAttribute('aria-controls', panelId);
      content.setAttribute('role', 'region');
      content.setAttribute('aria-labelledby', triggerId);

      // Set initial ARIA state based on whether item is already open
      var isOpen = item.classList.contains('is-open');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      // If already open, set maxHeight so it displays correctly
      if (isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });

    /* -------------------------------------------------------------- */
    /*  Toggle logic                                                   */
    /* -------------------------------------------------------------- */

    function closeItem(item) {
      var trigger = DK.$('.dk-accordion_trigger', item);
      var content = DK.$('.dk-accordion_content', item);
      if (!trigger || !content) return;

      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      content.style.maxHeight = '0';
    }

    function openItem(item) {
      var trigger = DK.$('.dk-accordion_trigger', item);
      var content = DK.$('.dk-accordion_content', item);
      if (!trigger || !content) return;

      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      content.style.maxHeight = content.scrollHeight + 'px';
    }

    function toggleItem(item) {
      var isOpen = item.classList.contains('is-open');

      // In single mode, close all others first
      if (isSingle && !isOpen) {
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            closeItem(other);
          }
        });
      }

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }
    }

    /* -------------------------------------------------------------- */
    /*  Event delegation                                               */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var trigger = e.target.closest('.dk-accordion_trigger');
      if (!trigger) return;

      var item = trigger.closest('.dk-accordion_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard: Enter / Space                                        */
    /* -------------------------------------------------------------- */

    DK.on(el, 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      var trigger = e.target.closest('.dk-accordion_trigger');
      if (!trigger) return;

      var item = trigger.closest('.dk-accordion_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });

    /* -------------------------------------------------------------- */
    /*  Handle dynamic content height changes                          */
    /* -------------------------------------------------------------- */

    /** Recalculate max-height for all open items. */
    el._dkRecalc = function () {
      items.forEach(function (item) {
        if (!item.classList.contains('is-open')) return;
        var content = DK.$('.dk-accordion_content', item);
        if (content) {
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    };
  });

})(window.DK);
