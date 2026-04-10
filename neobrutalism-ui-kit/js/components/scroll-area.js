/**
 * NB Scroll Area Component
 * Auto-hide scrollbar after inactivity. Works alongside native scroll.
 *
 * Usage:
 *   <div class="nb-scroll-area" data-nb-scroll-area>
 *     <!-- scrollable content -->
 *   </div>
 *
 * Options:
 *   data-nb-scroll-idle="2000"  — idle timeout in ms (default 1500)
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('scroll-area', function (el) {

    var idleDelay = parseInt(el.getAttribute('data-nb-scroll-idle'), 10) || 1500;
    var timer = null;

    function showScrollbar() {
      el.classList.remove('is-idle');
      clearTimeout(timer);
      timer = setTimeout(function () {
        el.classList.add('is-idle');
      }, idleDelay);
    }

    /* Start idle */
    el.classList.add('is-idle');

    /* Show on scroll */
    NB.on(el, 'scroll', showScrollbar);

    /* Show on hover */
    NB.on(el, 'mouseenter', function () {
      el.classList.remove('is-idle');
      clearTimeout(timer);
    });

    NB.on(el, 'mouseleave', function () {
      timer = setTimeout(function () {
        el.classList.add('is-idle');
      }, idleDelay);
    });

  });
})(window.NB);
