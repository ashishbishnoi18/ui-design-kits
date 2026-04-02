/**
 * DK Marquee Component
 * Clones track children for seamless looping. Supports pausable and speed options.
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('marquee', function (el) {
    var track = DK.$('.dk-marquee_track', el);
    if (!track || track.dataset.dkCloned) return;

    /* ---------------------------------------------------------------- */
    /*  Read options                                                     */
    /* ---------------------------------------------------------------- */

    var attrVal = el.getAttribute('data-dk-marquee') || '';
    var speed = el.getAttribute('data-dk-marquee-speed');

    if (attrVal === 'pausable' || attrVal === 'pause') {
      el.classList.add('is-pausable');
    }

    if (speed === 'slow') el.classList.add('dk-marquee--slow');
    if (speed === 'fast') el.classList.add('dk-marquee--fast');

    /* ---------------------------------------------------------------- */
    /*  Clone children for seamless loop                                 */
    /* ---------------------------------------------------------------- */

    var items = Array.prototype.slice.call(track.children);
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });

    track.dataset.dkCloned = 'true';
  });

})(window.DK);
