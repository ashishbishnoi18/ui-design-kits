/**
 * DK Command Palette Component
 * Cmd+K / Ctrl+K searchable launcher overlay with fuzzy filtering.
 *
 * Usage:
 *   <div class="dk-command-palette" id="cmd-palette" data-dk-command-palette>
 *     <div class="dk-command_dialog" role="dialog" aria-label="Command palette">
 *       <div class="dk-command_search">
 *         <svg class="dk-command_search-icon">...</svg>
 *         <input class="dk-command_input" placeholder="Type a command..." />
 *       </div>
 *       <div class="dk-command_results">
 *         <div class="dk-command_group">
 *           <div class="dk-command_group-label">Navigation</div>
 *           <button class="dk-command_item" data-dk-command-value="dashboard">
 *             Dashboard
 *             <span class="dk-command_item-shortcut">Ctrl+D</span>
 *           </button>
 *         </div>
 *       </div>
 *       <div class="dk-command_footer">
 *         <span><kbd>&uarr;&darr;</kbd> Navigate</span>
 *         <span><kbd>&crarr;</kbd> Select</span>
 *         <span><kbd>Esc</kbd> Close</span>
 *       </div>
 *     </div>
 *   </div>
 *
 * API:
 *   DK.commandPalette.open(id?)
 *   DK.commandPalette.close()
 *
 * Events:
 *   dk:command-open   — on the palette element
 *   dk:command-close  — on the palette element
 *   dk:command-select — detail: { value, item }
 *
 * @requires dk-core.js
 */
;(function (DK) {
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
      document.querySelector('[data-dk-command-palette]');
    if (!el || el.classList.contains('is-open')) return;

    activePalette = el;
    allItems = DK.$$('.dk-command_item', el);
    lockScroll();

    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');

    /* Trap focus inside the dialog */
    var dialog = DK.$('.dk-command_dialog', el) || el;
    releaseFocusTrap = DK.trapFocus(dialog);

    var input = DK.$('.dk-command_input', el);
    if (input) {
      input.value = '';
      setTimeout(function () { input.focus(); }, 50);
    }

    resetFilter();
    DK.emit(el, 'dk:command-open');
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

    DK.emit(activePalette, 'dk:command-close');
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
      DK.$$('.dk-command_group', activePalette).forEach(function (g) {
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
      var value = item.getAttribute('data-dk-command-value') || '';
      var match = fuzzyMatch(query, text) || fuzzyMatch(query, value);
      item.style.display = match ? '' : 'none';
      item.classList.remove('is-active');
    });

    /* Hide empty groups */
    if (activePalette) {
      DK.$$('.dk-command_group', activePalette).forEach(function (g) {
        var hasVisible = DK.$$('.dk-command_item', g).some(function (i) {
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
    var value = item.getAttribute('data-dk-command-value') || item.textContent.trim();
    DK.emit(activePalette, 'dk:command-select', { value: value, item: item });
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

  DK.on(document, 'keydown', handleGlobalKeydown);

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  DK.register('command-palette', function (el) {

    el.setAttribute('aria-hidden', 'true');

    var input = DK.$('.dk-command_input', el);

    /* Input filtering */
    if (input) {
      DK.on(input, 'input', function () {
        filterItems(input.value.trim());
      });
    }

    /* Click on backdrop to close */
    DK.on(el, 'click', function (e) {
      if (e.target === el) closePalette();
    });

    /* Click on item */
    DK.on(el, 'click', function (e) {
      var item = e.target.closest('.dk-command_item');
      if (item) selectItem(item);
    });

    /* Keyboard nav */
    DK.on(el, 'keydown', function (e) {
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

    /* Return cleanup for DK.destroy() */
    return function () {
      DK.off(document, 'keydown', handleGlobalKeydown);
      if (releaseFocusTrap) {
        releaseFocusTrap();
        releaseFocusTrap = null;
      }
    };
  });

  /* Expose API */
  DK.commandPalette = {
    open: openPalette,
    close: closePalette
  };

})(window.DK);
