/**
 * NB Command Palette Component
 * Cmd+K / Ctrl+K searchable launcher overlay with fuzzy filtering.
 *
 * Usage:
 *   <div class="nb-command-palette" id="cmd-palette" data-nb-command-palette>
 *     <div class="nb-command_dialog" role="dialog" aria-label="Command palette">
 *       <div class="nb-command_search">
 *         <svg class="nb-command_search-icon">...</svg>
 *         <input class="nb-command_input" placeholder="Type a command..." />
 *       </div>
 *       <div class="nb-command_results">
 *         <div class="nb-command_group">
 *           <div class="nb-command_group-label">Navigation</div>
 *           <button class="nb-command_item" data-nb-command-value="dashboard">
 *             Dashboard
 *             <span class="nb-command_item-shortcut">Ctrl+D</span>
 *           </button>
 *         </div>
 *       </div>
 *       <div class="nb-command_footer">
 *         <span><kbd>&uarr;&darr;</kbd> Navigate</span>
 *         <span><kbd>&crarr;</kbd> Select</span>
 *         <span><kbd>Esc</kbd> Close</span>
 *       </div>
 *     </div>
 *   </div>
 *
 * API:
 *   NB.commandPalette.open(id?)
 *   NB.commandPalette.close()
 *
 * Events:
 *   nb:command-open   — on the palette element
 *   nb:command-close  — on the palette element
 *   nb:command-select — detail: { value, item }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var activePalette = null;
  var allItems = [];
  var visibleItems = [];
  var activeIndex = -1;
  var releaseFocusTrap = null;

  /* ------------------------------------------------------------------ */
  /*  Fuzzy match                                                        */
  /* ------------------------------------------------------------------ */

  function fuzzyMatch(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();
    var qi = 0;
    for (var ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
  }

  /* ------------------------------------------------------------------ */
  /*  Scroll lock                                                        */
  /* ------------------------------------------------------------------ */

  function lockScroll() {
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------ */
  /*  Open / Close                                                       */
  /* ------------------------------------------------------------------ */

  function openPalette(id) {
    var el = id ? document.getElementById(id) :
      document.querySelector('[data-nb-command-palette]');
    if (!el || el.classList.contains('is-open')) return;

    activePalette = el;
    allItems = NB.$$('.nb-command__item', el);
    lockScroll();

    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');

    /* Trap focus inside the dialog */
    var dialog = NB.$('.nb-command__dialog', el) || el;
    releaseFocusTrap = NB.trapFocus(dialog);

    var input = NB.$('.nb-command__input', el);
    if (input) {
      input.value = '';
      setTimeout(function () { input.focus(); }, 50);
    }

    resetFilter();
    NB.emit(el, 'nb:command-open');
  }

  function closePalette() {
    if (!activePalette) return;

    activePalette.classList.remove('is-open');
    activePalette.setAttribute('aria-hidden', 'true');

    /* Release focus trap */
    if (releaseFocusTrap) {
      releaseFocusTrap();
      releaseFocusTrap = null;
    }

    unlockScroll();

    NB.emit(activePalette, 'nb:command-close');
    activePalette = null;
    allItems = [];
    visibleItems = [];
    activeIndex = -1;
  }

  /* ------------------------------------------------------------------ */
  /*  Filtering                                                          */
  /* ------------------------------------------------------------------ */

  function resetFilter() {
    allItems.forEach(function (item) {
      item.style.display = '';
      item.classList.remove('is-active');
    });

    /* Show all groups */
    if (activePalette) {
      NB.$$('.nb-command__group', activePalette).forEach(function (g) {
        g.style.display = '';
      });
    }

    visibleItems = allItems.slice();
    activeIndex = visibleItems.length > 0 ? 0 : -1;
    updateHighlight();
  }

  function filterItems(query) {
    if (!query) { resetFilter(); return; }

    allItems.forEach(function (item) {
      var text = item.textContent || '';
      var value = item.getAttribute('data-nb-command-value') || '';
      var match = fuzzyMatch(query, text) || fuzzyMatch(query, value);
      item.style.display = match ? '' : 'none';
      item.classList.remove('is-active');
    });

    /* Hide empty groups */
    if (activePalette) {
      NB.$$('.nb-command__group', activePalette).forEach(function (g) {
        var hasVisible = NB.$$('.nb-command__item', g).some(function (i) {
          return i.style.display !== 'none';
        });
        g.style.display = hasVisible ? '' : 'none';
      });
    }

    visibleItems = allItems.filter(function (i) { return i.style.display !== 'none'; });
    activeIndex = visibleItems.length > 0 ? 0 : -1;
    updateHighlight();
  }

  /* ------------------------------------------------------------------ */
  /*  Highlight management                                               */
  /* ------------------------------------------------------------------ */

  function updateHighlight() {
    visibleItems.forEach(function (item, i) {
      item.classList.toggle('is-active', i === activeIndex);
    });
    if (activeIndex >= 0 && visibleItems[activeIndex]) {
      visibleItems[activeIndex].scrollIntoView({ block: 'nearest' });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Select item                                                        */
  /* ------------------------------------------------------------------ */

  function selectItem(item) {
    var value = item.getAttribute('data-nb-command-value') || item.textContent.trim();
    NB.emit(activePalette, 'nb:command-select', { value: value, item: item });
    closePalette();
  }

  /* ------------------------------------------------------------------ */
  /*  Global Cmd+K / Ctrl+K                                              */
  /* ------------------------------------------------------------------ */

  function handleGlobalKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (activePalette) {
        closePalette();
      } else {
        openPalette();
      }
    }
  }

  NB.on(document, 'keydown', handleGlobalKeydown);

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('command-palette', function (el) {

    el.setAttribute('aria-hidden', 'true');

    var input = NB.$('.nb-command__input', el);

    /* Input filtering */
    if (input) {
      NB.on(input, 'input', function () {
        filterItems(input.value.trim());
      });
    }

    /* Click on backdrop to close */
    NB.on(el, 'click', function (e) {
      if (e.target === el) closePalette();
    });

    /* Click on item */
    NB.on(el, 'click', function (e) {
      var item = e.target.closest('.nb-command__item');
      if (item) selectItem(item);
    });

    /* Keyboard nav */
    NB.on(el, 'keydown', function (e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (visibleItems.length) {
            activeIndex = (activeIndex + 1) % visibleItems.length;
            updateHighlight();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (visibleItems.length) {
            activeIndex = (activeIndex - 1 + visibleItems.length) % visibleItems.length;
            updateHighlight();
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && visibleItems[activeIndex]) {
            selectItem(visibleItems[activeIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closePalette();
          break;
      }
    });

    /* Return cleanup for NB.destroy() */
    return function () {
      NB.off(document, 'keydown', handleGlobalKeydown);
      if (releaseFocusTrap) {
        releaseFocusTrap();
        releaseFocusTrap = null;
      }
    };
  });

  /* Expose API */
  NB.commandPalette = {
    open: openPalette,
    close: closePalette
  };

})(window.NB);
