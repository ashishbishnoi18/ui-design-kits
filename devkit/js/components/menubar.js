/**
 * DK Menubar Component
 * Horizontal menubar with nested dropdown submenus.
 * Hover-to-open behavior, full ARIA: menubar, menuitem, haspopup, expanded.
 *
 * Usage:
 *   <nav class="dk-menubar" data-dk-menubar>
 *     <button class="dk-menubar_item">
 *       File
 *       <div class="dk-menubar_submenu">
 *         <button class="dk-menubar_submenu-item">New</button>
 *         <button class="dk-menubar_submenu-item">Open</button>
 *         <div class="dk-menubar_divider"></div>
 *         <button class="dk-menubar_submenu-item">Save</button>
 *       </div>
 *     </button>
 *     <button class="dk-menubar_item">Edit</button>
 *   </nav>
 *
 * Events:
 *   dk:menubar-open  — detail: { item }
 *   dk:menubar-close — detail: { item }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('menubar', function (el) {

    var items = DK.$$(':scope > .dk-menubar_item', el);
    var isBarActive = false;

    if (!items.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    el.setAttribute('role', 'menubar');

    items.forEach(function (item) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '0');

      var submenu = DK.$('.dk-menubar_submenu', item);
      if (submenu) {
        var subId = submenu.id || DK.uid('dk-menubar-sub');
        submenu.id = subId;
        submenu.setAttribute('role', 'menu');
        item.setAttribute('aria-haspopup', 'true');
        item.setAttribute('aria-expanded', 'false');
        item.setAttribute('aria-controls', subId);

        DK.$$('.dk-menubar_submenu-item', submenu).forEach(function (si) {
          si.setAttribute('role', 'menuitem');
          si.setAttribute('tabindex', '-1');
        });
      }
    });

    /* -------------------------------------------------------------- */
    /*  Open / Close                                                   */
    /* -------------------------------------------------------------- */

    function openItem(item) {
      closeAll();
      item.classList.add('is-open');
      item.setAttribute('aria-expanded', 'true');
      isBarActive = true;

      var first = DK.$('.dk-menubar_submenu-item', item);
      if (first) first.focus();

      DK.emit(el, 'dk:menubar-open', { item: item });
    }

    function closeItem(item) {
      item.classList.remove('is-open');
      item.setAttribute('aria-expanded', 'false');
      DK.emit(el, 'dk:menubar-close', { item: item });
    }

    function closeAll() {
      items.forEach(function (item) {
        if (item.classList.contains('is-open')) closeItem(item);
      });
      isBarActive = false;
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      DK.on(item, 'click', function (e) {
        if (e.target.closest('.dk-menubar_submenu-item')) return;
        e.stopPropagation();
        if (item.classList.contains('is-open')) {
          closeItem(item);
          isBarActive = false;
        } else {
          openItem(item);
        }
      });

      /* Hover to open when bar is active */
      DK.on(item, 'mouseenter', function () {
        if (isBarActive && !item.classList.contains('is-open')) {
          openItem(item);
        }
      });
    });

    /* -------------------------------------------------------------- */
    /*  Submenu item click                                             */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var subItem = e.target.closest('.dk-menubar_submenu-item');
      if (subItem) closeAll();
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    DK.on(el, 'keydown', function (e) {
      var activeItem = document.activeElement;
      var parentItem = activeItem.closest('.dk-menubar_item');

      /* Top-level navigation */
      if (items.indexOf(activeItem) !== -1) {
        var idx = items.indexOf(activeItem);

        switch (e.key) {
          case 'ArrowRight':
            e.preventDefault();
            items[(idx + 1) % items.length].focus();
            if (isBarActive) openItem(items[(idx + 1) % items.length]);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            items[(idx - 1 + items.length) % items.length].focus();
            if (isBarActive) openItem(items[(idx - 1 + items.length) % items.length]);
            break;
          case 'ArrowDown':
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (DK.$('.dk-menubar_submenu', activeItem)) {
              openItem(activeItem);
            }
            break;
          case 'Escape':
            e.preventDefault();
            closeAll();
            break;
        }
        return;
      }

      /* Submenu navigation */
      if (parentItem && activeItem.classList.contains('dk-menubar_submenu-item')) {
        var subItems = DK.$$('.dk-menubar_submenu-item', parentItem);
        var subIdx = subItems.indexOf(activeItem);

        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            subItems[(subIdx + 1) % subItems.length].focus();
            break;
          case 'ArrowUp':
            e.preventDefault();
            subItems[(subIdx - 1 + subItems.length) % subItems.length].focus();
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            activeItem.click();
            break;
          case 'Escape':
            e.preventDefault();
            closeItem(parentItem);
            parentItem.focus();
            break;
          case 'ArrowRight': {
            e.preventDefault();
            var pIdx = items.indexOf(parentItem);
            var nextItem = items[(pIdx + 1) % items.length];
            closeItem(parentItem);
            if (DK.$('.dk-menubar_submenu', nextItem)) {
              openItem(nextItem);
            } else {
              nextItem.focus();
            }
            break;
          }
          case 'ArrowLeft': {
            e.preventDefault();
            var pIdx2 = items.indexOf(parentItem);
            var prevItem = items[(pIdx2 - 1 + items.length) % items.length];
            closeItem(parentItem);
            if (DK.$('.dk-menubar_submenu', prevItem)) {
              openItem(prevItem);
            } else {
              prevItem.focus();
            }
            break;
          }
        }
      }
    });

    /* -------------------------------------------------------------- */
    /*  Close on outside click                                         */
    /* -------------------------------------------------------------- */

    DK.on(document, 'click', function (e) {
      if (!el.contains(e.target)) closeAll();
    });

  });
})(window.DK);
