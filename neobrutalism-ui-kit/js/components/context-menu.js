/**
 * NB Context Menu Component
 * Right-click context menus with keyboard navigation.
 *
 * Usage:
 *   <div data-nb-context-menu="my-ctx">Right-click here</div>
 *
 *   <div class="nb-context-menu" id="my-ctx" role="menu">
 *     <button class="nb-context-menu_item" role="menuitem">Cut</button>
 *     <button class="nb-context-menu_item" role="menuitem">Copy</button>
 *     <div class="nb-context-menu_divider"></div>
 *     <button class="nb-context-menu_item" role="menuitem">
 *       Delete
 *       <span class="nb-context-menu_shortcut">Del</span>
 *     </button>
 *   </div>
 *
 * Events:
 *   nb:context-menu-open  — detail: { id, x, y }
 *   nb:context-menu-close — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var activeMenu = null;

  /* ------------------------------------------------------------------ */
  /*  Close active menu                                                  */
  /* ------------------------------------------------------------------ */

  function closeActive() {
    if (!activeMenu) return;
    activeMenu.classList.remove('is-open');
    activeMenu.setAttribute('aria-hidden', 'true');
    NB.emit(activeMenu, 'nb:context-menu-close', { id: activeMenu.id || null });
    activeMenu = null;
  }

  /* ------------------------------------------------------------------ */
  /*  Open a menu at coordinates                                         */
  /* ------------------------------------------------------------------ */

  function openMenu(menu, x, y) {
    closeActive();
    activeMenu = menu;

    /* Position at cursor */
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');

    /* Clamp to viewport */
    var rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (y - rect.height) + 'px';
    }

    /* Focus first item */
    var first = NB.$('.nb-context-menu_item:not([disabled])', menu);
    if (first) first.focus();

    NB.emit(menu, 'nb:context-menu-open', { id: menu.id || null, x: x, y: y });
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard navigation                                                */
  /* ------------------------------------------------------------------ */

  function handleKeydown(e) {
    if (!activeMenu) return;

    var items = NB.$$('.nb-context-menu_item:not([disabled])', activeMenu);
    if (!items.length) return;

    var idx = items.indexOf(document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0].focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (idx !== -1) {
          items[idx].click();
          closeActive();
        }
        break;
      case 'Escape':
        e.preventDefault();
        closeActive();
        break;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Global listeners                                                   */
  /* ------------------------------------------------------------------ */

  function handleContextMenu(e) {
    var trigger = e.target.closest('[data-nb-context-menu]');
    if (!trigger) return;

    e.preventDefault();
    var menuId = trigger.getAttribute('data-nb-context-menu');
    var menu = document.getElementById(menuId);
    if (menu) openMenu(menu, e.clientX, e.clientY);
  }

  function handleClick() {
    closeActive();
  }

  NB.on(document, 'contextmenu', handleContextMenu);
  NB.on(document, 'click', handleClick);
  NB.on(document, 'keydown', handleKeydown);

  /** Remove all global listeners (called by NB.destroy). */
  NB._addCleanup(document, function () {
    NB.off(document, 'contextmenu', handleContextMenu);
    NB.off(document, 'click', handleClick);
    NB.off(document, 'keydown', handleKeydown);
  });

  /* Expose API */
  NB.contextMenu = {
    open: openMenu,
    close: closeActive
  };

})(window.NB);
