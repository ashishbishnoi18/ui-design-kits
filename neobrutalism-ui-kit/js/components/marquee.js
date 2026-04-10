/**
 * NB Marquee Component
 * Clones track children for seamless looping. Supports pausable and speed options.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('marquee', function (el) {
    var track = NB.$('.nb-marquee__track', el);
    if (!track || track.dataset.nbCloned) return;

    /* ---------------------------------------------------------------- */
    /*  Read options                                                     */
    /* ---------------------------------------------------------------- */

    var attrVal = el.getAttribute('data-nb-marquee') || '';
    var speed = el.getAttribute('data-nb-marquee-speed');

    if (attrVal === 'pausable' || attrVal === 'pause') {
      el.classList.add('is-pausable');
    }

    if (speed === 'slow') el.classList.add('nb-marquee--slow');
    if (speed === 'fast') el.classList.add('nb-marquee--fast');

    /* ---------------------------------------------------------------- */
    /*  Clone children for seamless loop                                 */
    /* ---------------------------------------------------------------- */

    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    track.dataset.nbCloned = 'true';
  });

})(window.NB);
