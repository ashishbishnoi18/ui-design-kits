/**
 * DK Focus Trap Component
 * Traps focus within an element. Wraps the core DK.trapFocus() utility
 * as a registerable component.
 *
 * Usage:
 *   <div data-dk-focus-trap>
 *     <input type="text" />
 *     <button>Submit</button>
 *   </div>
 *
 * Options:
 *   data-dk-focus-trap-active="true|false"  — start active (default: true)
 *
 * @requires dk-core.js (DK.trapFocus)
 */
;(function (DK) {
  'use strict';

  DK.register('focus-trap', function (el) {

    var isActive = el.getAttribute('data-dk-focus-trap-active') !== 'false';
    var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    function getFocusable() {
      return Array.prototype.slice.call(el.querySelectorAll(FOCUSABLE)).filter(function (f) {
        return f.offsetParent !== null;
      });
    }

    function handleKeydown(e) {
      if (e.key !== 'Tab') return;

      var focusable = getFocusable();
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function activate() {
      isActive = true;
      el.addEventListener('keydown', handleKeydown);
      /* Focus first focusable element */
      var focusable = getFocusable();
      if (focusable.length) focusable[0].focus();
    }

    function deactivate() {
      isActive = false;
      el.removeEventListener('keydown', handleKeydown);
    }

    if (isActive) activate();

    /* Expose methods on element */
    el._dkFocusTrap = {
      activate: activate,
      deactivate: deactivate
    };

  });
})(window.DK);
