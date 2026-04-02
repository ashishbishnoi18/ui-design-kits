/**
 * DK Context Menu Component
 * Right-click context menus with keyboard navigation.
 *
 * Usage:
 *   <div data-dk-context-menu="my-ctx">Right-click here</div>
 *
 *   <div class="dk-context-menu" id="my-ctx" role="menu">
 *     <button class="dk-context-menu_item" role="menuitem">Cut</button>
 *     <button class="dk-context-menu_item" role="menuitem">Copy</button>
 *     <div class="dk-context-menu_divider"></div>
 *     <button class="dk-context-menu_item" role="menuitem">
 *       Delete
 *       <span class="dk-context-menu_shortcut">Del</span>
 *     </button>
 *   </div>
 *
 * Events:
 *   dk:context-menu-open  — detail: { id, x, y }
 *   dk:context-menu-close — detail: { id }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var activeMenu = null;

  /* ------------------------------------------------------------------ */
  /*  Close active menu                                                  */
  /* ------------------------------------------------------------------ */

  function closeActive() {
    if (!activeMenu) return;
    activeMenu.classList.remove('is-open');
    activeMenu.setAttribute('aria-hidden', 'true');
    DK.emit(activeMenu, 'dk:context-menu-close', { id: activeMenu.id || null });
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
    var first = DK.$('.dk-context-menu_item:not([disabled])', menu);
    if (first) first.focus();

    DK.emit(menu, 'dk:context-menu-open', { id: menu.id || null, x: x, y: y });
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard navigation                                                */
  /* ------------------------------------------------------------------ */

  function handleKeydown(e) {
    if (!activeMenu) return;

    var items = DK.$$('.dk-context-menu_item:not([disabled])', activeMenu);
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

  DK.on(document, 'contextmenu', function (e) {
    var trigger = e.target.closest('[data-dk-context-menu]');
    if (!trigger) return;

    e.preventDefault();
    var menuId = trigger.getAttribute('data-dk-context-menu');
    var menu = document.getElementById(menuId);
    if (menu) openMenu(menu, e.clientX, e.clientY);
  });

  DK.on(document, 'click', function () {
    closeActive();
  });

  DK.on(document, 'keydown', handleKeydown);

  /* Expose API */
  DK.contextMenu = {
    open: openMenu,
    close: closeActive
  };

})(window.DK);
