/**
 * NB Search Component
 * Manages clear button visibility, clear-on-click, and Cmd+K / Ctrl+K
 * keyboard shortcut to focus the search input.
 *
 * Usage:
 *   <div class="nb-search" data-nb-search>
 *     <span class="nb-search_icon">
 *       <svg>...</svg>
 *     </span>
 *     <input class="nb-search_input" type="text" placeholder="Search...">
 *     <button class="nb-search_clear" type="button" aria-label="Clear search">
 *       <svg>...</svg>
 *     </button>
 *     <span class="nb-search_shortcut">&#8984;K</span>
 *   </div>
 *
 * Events:
 *   nb:search-clear — fired when the input is cleared
 *   nb:search-focus — fired when focused via keyboard shortcut
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('search', function (el) {
    var input = el.querySelector('.nb-search__input');
    var clear = el.querySelector('.nb-search__clear');

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

    NB.on(input, 'input', updateClearVisibility);

    /* Set initial state */
    updateClearVisibility();

    /* ---------------------------------------------------------------- */
    /*  Clear on click                                                   */
    /* ---------------------------------------------------------------- */

    if (clear) {
      NB.on(clear, 'click', function (e) {
        e.preventDefault();
        input.value = '';
        updateClearVisibility();
        input.focus();
        NB.emit(el, 'nb:search-clear');
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
        NB.emit(el, 'nb:search-focus');
      }
    }

    NB.on(document, 'keydown', onGlobalKeydown);

    /* ---------------------------------------------------------------- */
    /*  Escape to blur                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'keydown', function (e) {
      if (e.key === 'Escape') {
        input.blur();
      }
    });

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'keydown', onGlobalKeydown);
    };
  });

})(window.NB);
