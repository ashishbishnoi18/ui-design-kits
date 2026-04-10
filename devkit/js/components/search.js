/**
 * DK Search Component
 * Manages clear button visibility, clear-on-click, and Cmd+K / Ctrl+K
 * keyboard shortcut to focus the search input.
 *
 * Usage:
 *   <div class="dk-search" data-dk-search>
 *     <span class="dk-search_icon">
 *       <svg>...</svg>
 *     </span>
 *     <input class="dk-search_input" type="text" placeholder="Search...">
 *     <button class="dk-search_clear" type="button" aria-label="Clear search">
 *       <svg>...</svg>
 *     </button>
 *     <span class="dk-search_shortcut">&#8984;K</span>
 *   </div>
 *
 * Events:
 *   dk:search-clear — fired when the input is cleared
 *   dk:search-focus — fired when focused via keyboard shortcut
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('search', function (el) {
    var input = el.querySelector('.dk-search_input');
    var clear = el.querySelector('.dk-search_clear');

    if (!input) return;

    /* ---------------------------------------------------------------- */
    /*  Clear button visibility                                          */
    /* ---------------------------------------------------------------- */

    function updateClearVisibility() {
      if (!clear) return;
      if (input.value.length > 0) {
        clear.classList.add('is-visible');
      } else {
        clear.classList.remove('is-visible');
      }
    }

    DK.on(input, 'input', updateClearVisibility);

    /* Set initial state */
    updateClearVisibility();

    /* ---------------------------------------------------------------- */
    /*  Clear on click                                                   */
    /* ---------------------------------------------------------------- */

    if (clear) {
      DK.on(clear, 'click', function (e) {
        e.preventDefault();
        input.value = '';
        updateClearVisibility();
        input.focus();
        DK.emit(el, 'dk:search-clear');
        /* Also trigger an input event so consumers can react */
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Cmd+K / Ctrl+K shortcut to focus                                 */
    /* ---------------------------------------------------------------- */

    function onGlobalKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
        DK.emit(el, 'dk:search-focus');
      }
    }

    DK.on(document, 'keydown', onGlobalKeydown);

    /* ---------------------------------------------------------------- */
    /*  Escape to blur                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(input, 'keydown', function (e) {
      if (e.key === 'Escape') {
        input.blur();
      }
    });

    /* Return cleanup for DK.destroy() */
    return function () {
      DK.off(document, 'keydown', onGlobalKeydown);
    };
  });

})(window.DK);
