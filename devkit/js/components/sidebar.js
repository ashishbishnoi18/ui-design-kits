/**
 * DK Sidebar Component
 * Toggles `is-collapsed` on desktop. Shows/hides with backdrop on mobile.
 * Handles window resize to clean up mobile state when returning to desktop.
 *
 * Usage:
 *   <aside data-dk-sidebar class="dk-sidebar">
 *     <div class="dk-sidebar_header">
 *       <div class="dk-sidebar_logo">...</div>
 *       <button data-dk-sidebar-toggle aria-label="Toggle sidebar">...</button>
 *     </div>
 *     ...
 *   </aside>
 *   <div class="dk-sidebar_backdrop"></div>
 *
 * External trigger (e.g. in a navbar):
 *   <button data-dk-sidebar-open aria-label="Open sidebar">...</button>
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var MOBILE_BREAKPOINT = 768;

  DK.register('sidebar', function (el) {

    var toggleBtn = DK.$('[data-dk-sidebar-toggle]', el);
    var backdrop = el.nextElementSibling;

    // Validate backdrop
    if (!backdrop || !backdrop.classList.contains('dk-sidebar_backdrop')) {
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
      DK.emit(el, 'dk:sidebar-toggle', {
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
      DK.emit(el, 'dk:sidebar-open');
    }

    function closeMobile() {
      el.classList.remove('is-mobile-open');
      if (backdrop) backdrop.style.display = '';
      document.body.style.overflow = '';
      DK.emit(el, 'dk:sidebar-close');
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

    var externalOpeners = DK.$$('[data-dk-sidebar-open]');
    externalOpeners.forEach(function (btn) {
      DK.on(btn, 'click', function () {
        if (isMobile()) {
          openMobile();
        } else {
          if (el.classList.contains('is-collapsed')) {
            el.classList.remove('is-collapsed');
            DK.emit(el, 'dk:sidebar-toggle', { collapsed: false });
          }
        }
      });
    });

    /* -------------------------------------------------------------- */
    /*  Bind events                                                    */
    /* -------------------------------------------------------------- */

    if (toggleBtn) {
      DK.on(toggleBtn, 'click', toggleCollapse);
    }

    if (backdrop) {
      DK.on(backdrop, 'click', closeMobile);
    }

    DK.on(window, 'resize', handleResize);
    DK.on(document, 'keydown', handleKeydown);

    /* Return cleanup for DK.destroy() */
    DK._addCleanup(el, function () {
      DK.off(window, 'resize', handleResize);
      DK.off(document, 'keydown', handleKeydown);
      clearTimeout(resizeTimer);
    });

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    DK.sidebar = DK.sidebar || {};
    DK.sidebar.collapse = function () {
      el.classList.add('is-collapsed');
      DK.emit(el, 'dk:sidebar-toggle', { collapsed: true });
    };
    DK.sidebar.expand = function () {
      el.classList.remove('is-collapsed');
      DK.emit(el, 'dk:sidebar-toggle', { collapsed: false });
    };
    DK.sidebar.openMobile = openMobile;
    DK.sidebar.closeMobile = closeMobile;
  });

})(window.DK);
