/**
 * NB Tooltip Component
 * Shows tooltip content on mouseenter/focus, hides on mouseleave/blur.
 * Adds `is-visible` class with a slight delay for smoother UX.
 *
 * Usage:
 *   <span class="nb-tooltip nb-tooltip--top" data-nb-tooltip>
 *     Hover me
 *     <span class="nb-tooltip_content">Tooltip text</span>
 *   </span>
 *
 * Options (via data attributes):
 *   data-nb-tooltip-delay="200"  — show delay in ms (default: 100)
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tooltip', function (el) {
    var content = el.querySelector('.nb-tooltip__content');
    if (!content) return;

    var delay = parseInt(el.getAttribute('data-nb-tooltip-delay'), 10) || 100;
    var showTimer = null;
    var hideTimer = null;

    /* Ensure ARIA */
    var tooltipId = content.id || NB.uid('tooltip');
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

    NB.on(el, 'mouseenter', show);
    NB.on(el, 'mouseleave', hide);
    NB.on(el, 'focusin', show);
    NB.on(el, 'focusout', hide);

    /* Return cleanup for NB.destroy() */
    return function () {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  });

})(window.NB);
