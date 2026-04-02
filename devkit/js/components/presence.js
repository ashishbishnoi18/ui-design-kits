/**
 * DK Presence Component
 * Animate enter/exit of elements. Adds animation class on enter,
 * waits for animationend before removing on exit.
 *
 * Usage:
 *   <div data-dk-presence
 *        data-dk-enter="dk-fade-in"
 *        data-dk-exit="dk-fade-out">
 *     Content to animate
 *   </div>
 *
 * API:
 *   DK.presence.enter(el)  — trigger enter animation
 *   DK.presence.exit(el)   — trigger exit animation (removes after animationend)
 *   DK.presence.toggle(el) — toggle between enter and exit
 *
 * Events:
 *   dk:presence-enter    — after enter animation starts
 *   dk:presence-entered  — after enter animation ends
 *   dk:presence-exit     — after exit animation starts
 *   dk:presence-exited   — after exit animation ends
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  function enter(el) {
    var enterClass = el.getAttribute('data-dk-enter') || 'dk-fade-in';
    var exitClass = el.getAttribute('data-dk-exit') || 'dk-fade-out';

    el.classList.remove(exitClass);
    el.style.display = '';
    el.classList.add(enterClass);

    DK.emit(el, 'dk:presence-enter');

    function onEnd() {
      el.removeEventListener('animationend', onEnd);
      DK.emit(el, 'dk:presence-entered');
    }

    el.addEventListener('animationend', onEnd);
  }

  function exit(el) {
    var enterClass = el.getAttribute('data-dk-enter') || 'dk-fade-in';
    var exitClass = el.getAttribute('data-dk-exit') || 'dk-fade-out';

    el.classList.remove(enterClass);
    el.classList.add(exitClass);

    DK.emit(el, 'dk:presence-exit');

    function onEnd() {
      el.removeEventListener('animationend', onEnd);
      el.classList.remove(exitClass);
      el.style.display = 'none';
      DK.emit(el, 'dk:presence-exited');
    }

    el.addEventListener('animationend', onEnd);
  }

  function toggle(el) {
    if (el.style.display === 'none' || getComputedStyle(el).display === 'none') {
      enter(el);
    } else {
      exit(el);
    }
  }

  DK.register('presence', function (el) {
    /* Auto-hide on init if data-dk-presence-hidden is set */
    if (el.hasAttribute('data-dk-presence-hidden')) {
      el.style.display = 'none';
    }
  });

  /* Expose API */
  DK.presence = {
    enter: enter,
    exit: exit,
    toggle: toggle
  };

})(window.DK);
