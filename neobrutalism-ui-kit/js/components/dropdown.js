/**
 * NB Dropdown Component
 * Toggle menu on trigger click. Close on outside click / Escape.
 * Arrow key navigation of items. Full ARIA: menu, menuitem, haspopup, expanded.
 *
 * Usage:
 *   <div data-nb-dropdown class="nb-dropdown">
 *     <button class="nb-dropdown_trigger">Options</button>
 *     <div class="nb-dropdown_menu">
 *       <div class="nb-dropdown_header">Section</div>
 *       <button class="nb-dropdown_item">Edit</button>
 *       <button class="nb-dropdown_item">Duplicate</button>
 *       <div class="nb-dropdown_divider"></div>
 *       <button class="nb-dropdown_item">Delete</button>
 *     </div>
 *   </div>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('dropdown', function (el) {

    var trigger = NB.$('.nb-dropdown__trigger', el);
    var menu = NB.$('.nb-dropdown__menu', el);

    if (!trigger || !menu) return;

    var items = NB.$$('.nb-dropdown__item', menu);
    var focusedIndex = -1;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var menuId = menu.id || NB.uid('nb-dropdown-menu');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);

    items.forEach(function (item) {
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
    });

    /* -------------------------------------------------------------- */
    /*  State helpers                                                   */
    /* -------------------------------------------------------------- */

    function isOpen() {
      return el.classList.contains('is-open');
    }

    function clearFocus() {
      items.forEach(function (item) {
        item.classList.remove('is-focused');
      });
      focusedIndex = -1;
    }

    function focusItem(index) {
      clearFocus();
      if (index < 0 || index >= items.length) return;
      focusedIndex = index;
      items[focusedIndex].classList.add('is-focused');
      items[focusedIndex].focus();
    }

    /* -------------------------------------------------------------- */
    /*  Open / close                                                   */
    /* -------------------------------------------------------------- */

    function open() {
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      NB.emit(el, 'nb:dropdown-open');

      // Focus first item
      if (items.length) {
        focusItem(0);
      }
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      clearFocus();
      NB.emit(el, 'nb:dropdown-close');
    }

    function toggle(e) {
      e.stopPropagation();
      if (isOpen()) {
        close();
        trigger.focus();
      } else {
        open();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Item selection                                                  */
    /* -------------------------------------------------------------- */

    function selectItem(item) {
      NB.emit(el, 'nb:dropdown-select', {
        value: item.textContent.trim(),
        item: item,
      });
      close();
      trigger.focus();
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
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    function handleKeydown(e) {
      if (!isOpen() && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        if (el.contains(document.activeElement)) {
          e.preventDefault();
          open();
          return;
        }
      }

      if (!isOpen()) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          trigger.focus();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (focusedIndex < items.length - 1) {
            focusItem(focusedIndex + 1);
          } else {
            focusItem(0);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (focusedIndex > 0) {
            focusItem(focusedIndex - 1);
          } else {
            focusItem(items.length - 1);
          }
          break;

        case 'Home':
          e.preventDefault();
          focusItem(0);
          break;

        case 'End':
          e.preventDefault();
          focusItem(items.length - 1);
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            selectItem(items[focusedIndex]);
          }
          break;

        case 'Tab':
          close();
          break;
      }
    }

    /* -------------------------------------------------------------- */
    /*  Item click                                                     */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      NB.on(item, 'click', function (e) {
        e.stopPropagation();
        selectItem(item);
      });

      // Hover focus
      NB.on(item, 'mouseenter', function () {
        focusItem(items.indexOf(item));
      });
    });

    /* -------------------------------------------------------------- */
    /*  Bind events                                                    */
    /* -------------------------------------------------------------- */

    NB.on(trigger, 'click', toggle);
    NB.on(document, 'click', handleOutsideClick);
    NB.on(el, 'keydown', handleKeydown);

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'click', handleOutsideClick);
    };
  });

})(window.NB);
