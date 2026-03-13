/**
 * NB Search Component
 * Search input with debounced events, dropdown results, and keyboard navigation.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var DEBOUNCE_MS = 200;

  NB.register('search', function (el) {
    var input = NB.$('.nb-search__input', el);
    if (!input) return;

    var clearBtn = NB.$('.nb-search__clear', el);
    var resultsEl = NB.$('.nb-search__results', el);
    var shortcutEnabled = el.getAttribute('data-nb-search-shortcut') === 'true';

    var debounceTimer = null;

    /* ---------------------------------------------------------------- */
    /*  Helpers                                                          */
    /* ---------------------------------------------------------------- */

    function getResultItems() {
      return resultsEl ? NB.$$('.nb-search__result', resultsEl) : [];
    }

    function getFocusedIndex() {
      var items = getResultItems();
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains('is-focused')) return i;
      }
      return -1;
    }

    function clearFocus() {
      var items = getResultItems();
      items.forEach(function (item) {
        item.classList.remove('is-focused');
      });
    }

    function focusItem(index) {
      var items = getResultItems();
      if (!items.length) return;

      clearFocus();

      // Clamp index
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;

      items[index].classList.add('is-focused');

      // Scroll into view if needed
      if (items[index].scrollIntoView) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Dropdown visibility                                              */
    /* ---------------------------------------------------------------- */

    function openDropdown() {
      if (!resultsEl) return;
      resultsEl.classList.add('is-open');

      // Show "No results" if the dropdown is empty
      var items = getResultItems();
      if (!items.length) {
        ensureEmptyMessage();
      } else {
        removeEmptyMessage();
      }
    }

    function closeDropdown() {
      if (!resultsEl) return;
      resultsEl.classList.remove('is-open');
      clearFocus();
    }

    function isOpen() {
      return resultsEl ? resultsEl.classList.contains('is-open') : false;
    }

    function ensureEmptyMessage() {
      if (!resultsEl) return;
      if (NB.$('.nb-search__empty', resultsEl)) return;

      var emptyEl = document.createElement('div');
      emptyEl.className = 'nb-search__empty';
      emptyEl.textContent = 'No results found';
      resultsEl.appendChild(emptyEl);
    }

    function removeEmptyMessage() {
      if (!resultsEl) return;
      var emptyEl = NB.$('.nb-search__empty', resultsEl);
      if (emptyEl && emptyEl.parentNode) {
        emptyEl.parentNode.removeChild(emptyEl);
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Clear button                                                     */
    /* ---------------------------------------------------------------- */

    function updateClearButton() {
      if (!clearBtn) return;
      if (input.value.length > 0) {
        clearBtn.classList.add('is-active');
      } else {
        clearBtn.classList.remove('is-active');
      }
    }

    // Initial state
    updateClearButton();

    if (clearBtn) {
      NB.on(clearBtn, 'click', function (e) {
        e.preventDefault();
        input.value = '';
        updateClearButton();
        closeDropdown();
        input.focus();

        NB.emit(el, 'nb:search-input', { query: '' });
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Debounced input                                                  */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'input', function () {
      updateClearButton();

      if (debounceTimer) clearTimeout(debounceTimer);

      debounceTimer = setTimeout(function () {
        var query = input.value;

        NB.emit(el, 'nb:search-input', { query: query });

        if (query.length > 0) {
          openDropdown();
        } else {
          closeDropdown();
        }
      }, DEBOUNCE_MS);
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    NB.on(input, 'keydown', function (e) {
      var items = getResultItems();

      switch (e.key) {
        case 'ArrowDown':
        case 'Down':
          e.preventDefault();
          if (!isOpen() && input.value.length > 0) {
            openDropdown();
          }
          if (items.length) {
            var downIdx = getFocusedIndex();
            focusItem(downIdx + 1);
          }
          break;

        case 'ArrowUp':
        case 'Up':
          e.preventDefault();
          if (items.length) {
            var upIdx = getFocusedIndex();
            focusItem(upIdx - 1);
          }
          break;

        case 'Enter':
          e.preventDefault();
          var enterIdx = getFocusedIndex();
          if (enterIdx >= 0 && items[enterIdx]) {
            var value = items[enterIdx].textContent;
            NB.emit(el, 'nb:search-select', { value: value, index: enterIdx });
            closeDropdown();
          }
          break;

        case 'Escape':
          if (isOpen()) {
            e.preventDefault();
            closeDropdown();
          }
          break;
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Result item click                                                */
    /* ---------------------------------------------------------------- */

    if (resultsEl) {
      NB.on(resultsEl, 'click', function (e) {
        var item = e.target.closest('.nb-search__result');
        if (!item) return;

        var items = getResultItems();
        var idx = items.indexOf(item);
        var value = item.textContent;

        NB.emit(el, 'nb:search-select', { value: value, index: idx });
        closeDropdown();
      });

      // Observe results container for child changes to manage empty state
      if (typeof MutationObserver !== 'undefined') {
        var observer = new MutationObserver(function () {
          if (!isOpen()) return;
          var items = getResultItems();
          if (!items.length) {
            ensureEmptyMessage();
          } else {
            removeEmptyMessage();
          }
        });
        observer.observe(resultsEl, { childList: true });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Click outside                                                    */
    /* ---------------------------------------------------------------- */

    NB.on(document, 'click', function (e) {
      if (!el.contains(e.target) && isOpen()) {
        closeDropdown();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard shortcut: Cmd+K / Ctrl+K                                */
    /* ---------------------------------------------------------------- */

    if (shortcutEnabled) {
      NB.on(document, 'keydown', function (e) {
        var isMac = navigator.platform.indexOf('Mac') > -1 ||
                    navigator.userAgent.indexOf('Mac') > -1;
        var modifier = isMac ? e.metaKey : e.ctrlKey;

        if (modifier && e.key === 'k') {
          e.preventDefault();
          input.focus();
          input.select();
        }
      });
    }
  });

})(window.NB);
