/**
 * DK Tooltip Component
 * Shows tooltip content on mouseenter/focus, hides on mouseleave/blur.
 * Adds `is-visible` class with a slight delay for smoother UX.
 *
 * Usage:
 *   <span class="dk-tooltip dk-tooltip--top" data-dk-tooltip>
 *     Hover me
 *     <span class="dk-tooltip_content">Tooltip text</span>
 *   </span>
 *
 * Options (via data attributes):
 *   data-dk-tooltip-delay="200"  — show delay in ms (default: 100)
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('tooltip', function (el) {
    var content = el.querySelector('.dk-tooltip_content');
    if (!content) return;

    var delay = parseInt(el.getAttribute('data-dk-tooltip-delay'), 10) || 100;
    var showTimer = null;
    var hideTimer = null;

    /* Ensure ARIA */
    var tooltipId = content.id || DK.uid('tooltip');
    content.id = tooltipId;
    content.setAttribute('role', 'tooltip');

    /* Find the trigger — first child that is not the content */
    var trigger = el.firstElementChild;
    if (trigger === content) trigger = el;
    trigger.setAttribute('aria-describedby', tooltipId);

    /* ---------------------------------------------------------------- */
    /*  Show / Hide                                                      */
    /* ---------------------------------------------------------------- */

    function show() {
      clearTimeout(hideTimer);
      showTimer = setTimeout(function () {
        el.classList.add('is-visible');
      }, delay);
    }

    function hide() {
      clearTimeout(showTimer);
      hideTimer = setTimeout(function () {
        el.classList.remove('is-visible');
      }, 50);
    }

    /* ---------------------------------------------------------------- */
    /*  Event binding                                                     */
    /* ---------------------------------------------------------------- */

    DK.on(el, 'mouseenter', show);
    DK.on(el, 'mouseleave', hide);
    DK.on(el, 'focusin', show);
    DK.on(el, 'focusout', hide);

    /* Return cleanup for DK.destroy() */
    return function () {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  });

})(window.DK);
