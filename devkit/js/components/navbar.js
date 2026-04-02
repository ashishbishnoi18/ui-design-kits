/**
 * DK Navbar Component
 * Mobile hamburger toggle: show/hide nav on click.
 * Closes on outside click and Escape key.
 *
 * Usage:
 *   <nav data-dk-navbar class="dk-navbar">
 *     <div class="dk-navbar_brand">...</div>
 *     <button class="dk-navbar_mobile-toggle" aria-label="Toggle navigation" aria-expanded="false">
 *       <span class="dk-navbar_mobile-toggle-icon"></span>
 *     </button>
 *     <div class="dk-navbar_nav">...</div>
 *     <div class="dk-navbar_actions">...</div>
 *   </nav>
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('navbar', function (el) {

    var toggle = DK.$('.dk-navbar_mobile-toggle', el);
    var nav = DK.$('.dk-navbar_nav', el);

    if (!toggle || !nav) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var navId = nav.id || DK.uid('dk-navbar-nav');
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
      DK.emit(el, 'dk:navbar-open');
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      syncAria();
      DK.emit(el, 'dk:navbar-close');
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

    DK.on(toggle, 'click', handleToggle);
    DK.on(document, 'click', handleOutsideClick);
    DK.on(document, 'keydown', handleKeydown);

    // Ensure initial ARIA state
    syncAria();
  });

})(window.DK);
