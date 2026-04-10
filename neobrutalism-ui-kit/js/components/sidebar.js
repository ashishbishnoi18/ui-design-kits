/**
 * NB Sidebar Component
 * Toggles `is-collapsed` on desktop. Shows/hides with backdrop on mobile.
 * Handles window resize to clean up mobile state when returning to desktop.
 *
 * Usage:
 *   <aside data-nb-sidebar class="nb-sidebar">
 *     <div class="nb-sidebar_header">
 *       <div class="nb-sidebar_logo">...</div>
 *       <button data-nb-sidebar-toggle aria-label="Toggle sidebar">...</button>
 *     </div>
 *     ...
 *   </aside>
 *   <div class="nb-sidebar_backdrop"></div>
 *
 * External trigger (e.g. in a navbar):
 *   <button data-nb-sidebar-open aria-label="Open sidebar">...</button>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var MOBILE_BREAKPOINT = 768;

  NB.register('sidebar', function (el) {

    var toggleBtn = NB.$('[data-nb-sidebar-toggle]', el);
    var backdrop = el.nextElementSibling;

    // Validate backdrop
    if (!backdrop || !backdrop.classList.contains('nb-sidebar_backdrop')) {
      backdrop = null;
    }

    /* -------------------------------------------------------------- */
    /*  Desktop: collapse / expand                                     */
    /* -------------------------------------------------------------- */

    function isMobile() {
      return window.innerWidth <= MOBILE_BREAKPOINT;
    }

    function toggleCollapse() {
      if (isMobile()) {
        toggleMobile();
        return;
      }
      el.classList.toggle('is-collapsed');
      NB.emit(el, 'nb:sidebar-toggle', {
        collapsed: el.classList.contains('is-collapsed'),
      });
    }

    /* -------------------------------------------------------------- */
    /*  Mobile: overlay sidebar                                        */
    /* -------------------------------------------------------------- */

    function openMobile() {
      el.classList.add('is-mobile-open');
      if (backdrop) backdrop.style.display = 'block';
      document.body.style.overflow = 'hidden';
      NB.emit(el, 'nb:sidebar-open');
    }

    function closeMobile() {
      el.classList.remove('is-mobile-open');
      if (backdrop) backdrop.style.display = '';
      document.body.style.overflow = '';
      NB.emit(el, 'nb:sidebar-close');
    }

    function toggleMobile() {
      if (el.classList.contains('is-mobile-open')) {
        closeMobile();
      } else {
        openMobile();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Handle resize: clean up mobile state on breakpoint cross       */
    /* -------------------------------------------------------------- */

    var resizeTimer;

    function handleResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!isMobile() && el.classList.contains('is-mobile-open')) {
          closeMobile();
        }
      }, 100);
    }

    /* -------------------------------------------------------------- */
    /*  Escape key                                                     */
    /* -------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isMobile() && el.classList.contains('is-mobile-open')) {
        closeMobile();
      }
    }

    /* -------------------------------------------------------------- */
    /*  External open triggers                                         */
    /* -------------------------------------------------------------- */

    var externalOpeners = NB.$$('[data-nb-sidebar-open]');
    externalOpeners.forEach(function (btn) {
      NB.on(btn, 'click', function () {
        if (isMobile()) {
          openMobile();
        } else {
          if (el.classList.contains('is-collapsed')) {
            el.classList.remove('is-collapsed');
            NB.emit(el, 'nb:sidebar-toggle', { collapsed: false });
          }
        }
      });
    });

    /* -------------------------------------------------------------- */
    /*  Bind events                                                    */
    /* -------------------------------------------------------------- */

    if (toggleBtn) {
      NB.on(toggleBtn, 'click', toggleCollapse);
    }

    if (backdrop) {
      NB.on(backdrop, 'click', closeMobile);
    }

    NB.on(window, 'resize', handleResize);
    NB.on(document, 'keydown', handleKeydown);

    /* Return cleanup for NB.destroy() */
    NB._addCleanup(el, function () {
      NB.off(window, 'resize', handleResize);
      NB.off(document, 'keydown', handleKeydown);
      clearTimeout(resizeTimer);
    });

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    NB.sidebar = NB.sidebar || {};
    NB.sidebar.collapse = function () {
      el.classList.add('is-collapsed');
      NB.emit(el, 'nb:sidebar-toggle', { collapsed: true });
    };
    NB.sidebar.expand = function () {
      el.classList.remove('is-collapsed');
      NB.emit(el, 'nb:sidebar-toggle', { collapsed: false });
    };
    NB.sidebar.openMobile = openMobile;
    NB.sidebar.closeMobile = closeMobile;
  });

})(window.NB);
