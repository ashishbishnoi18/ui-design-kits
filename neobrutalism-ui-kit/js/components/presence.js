/**
 * NB Presence Component
 * Animate enter/exit of elements. Adds animation class on enter,
 * waits for animationend before removing on exit.
 *
 * Usage:
 *   <div data-nb-presence
 *        data-nb-enter="nb-fade-in"
 *        data-nb-exit="nb-fade-out">
 *     Content to animate
 *   </div>
 *
 * API:
 *   NB.presence.enter(el)  — trigger enter animation
 *   NB.presence.exit(el)   — trigger exit animation (removes after animationend)
 *   NB.presence.toggle(el) — toggle between enter and exit
 *
 * Events:
 *   nb:presence-enter    — after enter animation starts
 *   nb:presence-entered  — after enter animation ends
 *   nb:presence-exit     — after exit animation starts
 *   nb:presence-exited   — after exit animation ends
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  function enter(el) {
    var enterClass = el.getAttribute('data-nb-enter') || 'nb-fade-in';
    var exitClass = el.getAttribute('data-nb-exit') || 'nb-fade-out';

    el.classList.remove(exitClass);
    el.style.display = '';
    el.classList.add(enterClass);

    NB.emit(el, 'nb:presence-enter');

    function onEnd() {
      el.removeEventListener('animationend', onEnd);
      NB.emit(el, 'nb:presence-entered');
    }

    el.addEventListener('animationend', onEnd);
  }

  function exit(el) {
    var enterClass = el.getAttribute('data-nb-enter') || 'nb-fade-in';
    var exitClass = el.getAttribute('data-nb-exit') || 'nb-fade-out';

    el.classList.remove(enterClass);
    el.classList.add(exitClass);

    NB.emit(el, 'nb:presence-exit');

    function onEnd() {
      el.removeEventListener('animationend', onEnd);
      el.classList.remove(exitClass);
      el.style.display = 'none';
      NB.emit(el, 'nb:presence-exited');
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

  NB.register('presence', function (el) {
    /* Auto-hide on init if data-nb-presence-hidden is set */
    if (el.hasAttribute('data-nb-presence-hidden')) {
      el.style.display = 'none';
    }
  });

  /* Expose API */
  NB.presence = {
    enter: enter,
    exit: exit,
    toggle: toggle
  };

})(window.NB);
