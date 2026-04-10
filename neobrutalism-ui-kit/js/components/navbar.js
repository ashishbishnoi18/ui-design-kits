/**
 * NB Navbar Component
 * Mobile hamburger toggle: show/hide nav on click.
 * Closes on outside click and Escape key.
 *
 * Usage:
 *   <nav data-nb-navbar class="nb-navbar">
 *     <div class="nb-navbar_brand">...</div>
 *     <button class="nb-navbar_mobile-toggle" aria-label="Toggle navigation" aria-expanded="false">
 *       <span class="nb-navbar_mobile-toggle-icon"></span>
 *     </button>
 *     <div class="nb-navbar_nav">...</div>
 *     <div class="nb-navbar_actions">...</div>
 *   </nav>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('navbar', function (el) {

    var toggle = NB.$('.nb-navbar__mobile-toggle', el);
    var nav = NB.$('.nb-navbar__nav', el);

    if (!toggle || !nav) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var navId = nav.id || NB.uid('nb-navbar-nav');
    nav.id = navId;
    toggle.setAttribute('aria-controls', navId);

    function isOpen() {
      return el.classList.contains('is-open');
    }

    function syncAria() {
      toggle.setAttribute('aria-expanded', String(isOpen()));
    }

    /* -------------------------------------------------------------- */
    /*  Toggle                                                         */
    /* -------------------------------------------------------------- */

    function open() {
      el.classList.add('is-open');
      syncAria();
      NB.emit(el, 'nb:navbar-open');
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      syncAria();
      NB.emit(el, 'nb:navbar-close');
    }

    function handleToggle(e) {
      e.stopPropagation();
      if (isOpen()) {
        close();
      } else {
        open();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Outside click                                                   */
    /* -------------------------------------------------------------- */

    function handleOutsideClick(e) {
      if (!isOpen()) return;
      if (!el.contains(e.target)) {
        close();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Escape key                                                     */
    /* -------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        close();
        toggle.focus();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Bind events                                                    */
    /* -------------------------------------------------------------- */

    NB.on(toggle, 'click', handleToggle);
    NB.on(document, 'click', handleOutsideClick);
    NB.on(document, 'keydown', handleKeydown);

    // Ensure initial ARIA state
    syncAria();

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'click', handleOutsideClick);
      NB.off(document, 'keydown', handleKeydown);
    };
  });

})(window.NB);
