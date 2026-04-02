/**
 * DK Combobox Component
 * Autocomplete text input with filterable dropdown and keyboard navigation.
 *
 * Usage:
 *   <div class="dk-combobox" data-dk-combobox>
 *     <input class="dk-combobox_input" type="text" placeholder="Search..." role="combobox"
 *            aria-expanded="false" aria-autocomplete="list">
 *     <div class="dk-combobox_list" role="listbox">
 *       <div class="dk-combobox_option" role="option" data-value="react">React</div>
 *       <div class="dk-combobox_option" role="option" data-value="vue">Vue</div>
 *     </div>
 *     <div class="dk-combobox_empty">No results found</div>
 *   </div>
 *
 * Events:
 *   dk:combobox-select — detail: { value: string, label: string }
 *   dk:combobox-change — detail: { query: string }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('combobox', function (el) {
    var input     = el.querySelector('.dk-combobox_input');
    var listbox   = el.querySelector('.dk-combobox_list');
    var emptyMsg  = el.querySelector('.dk-combobox_empty');

    if (!input || !listbox) return;

    var allOptions = [];
    var visibleOptions = [];
    var highlightIndex = -1;
    var isOpen = false;

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var listId = listbox.id || DK.uid('dk-combobox-list');
    listbox.id = listId;

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', listId);
    listbox.setAttribute('role', 'listbox');

    function setupOptions() {
      allOptions = DK.$$('.dk-combobox_option', listbox);
      allOptions.forEach(function (opt) {
        opt.setAttribute('role', 'option');
        if (!opt.id) opt.id = DK.uid('dk-combo-opt');
      });
    }

    setupOptions();

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function open() {
      if (isOpen) return;
      isOpen = true;
      el.classList.add('is-open');
      input.setAttribute('aria-expanded', 'true');
      DK.on(document, 'click', onOutsideClick, true);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      el.classList.remove('is-open');
      input.setAttribute('aria-expanded', 'false');
      highlightIndex = -1;
      clearHighlight();
      input.removeAttribute('aria-activedescendant');
      DK.off(document, 'click', onOutsideClick, true);
    }

    /* ---------------------------------------------------------------- */
    /*  Filtering                                                        */
    /* ---------------------------------------------------------------- */

    function filter(query) {
      var q = query.toLowerCase().trim();

      allOptions.forEach(function (opt) {
        var text = opt.textContent.toLowerCase();
        if (q === '' || text.indexOf(q) !== -1) {
          opt.classList.remove('is-hidden');
        } else {
          opt.classList.add('is-hidden');
        }
      });

      visibleOptions = allOptions.filter(function (opt) {
        return !opt.classList.contains('is-hidden');
      });

      highlightIndex = -1;
      clearHighlight();

      /* Show/hide empty message */
      if (emptyMsg) {
        if (visibleOptions.length === 0 && q !== '') {
          emptyMsg.classList.add('is-visible');
        } else {
          emptyMsg.classList.remove('is-visible');
        }
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Highlight management                                             */
    /* ---------------------------------------------------------------- */

    function clearHighlight() {
      allOptions.forEach(function (opt) {
        opt.classList.remove('is-highlighted');
      });
    }

    function setHighlight(idx) {
      clearHighlight();
      if (idx < 0 || idx >= visibleOptions.length) return;
      highlightIndex = idx;
      visibleOptions[idx].classList.add('is-highlighted');
      input.setAttribute('aria-activedescendant', visibleOptions[idx].id);
      visibleOptions[idx].scrollIntoView({ block: 'nearest' });
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectOption(opt) {
      var value = opt.getAttribute('data-value') || opt.textContent.trim();
      var label = opt.textContent.trim();

      /* Clear previous selection */
      allOptions.forEach(function (o) { o.classList.remove('is-selected'); });
      opt.classList.add('is-selected');

      input.value = label;
      close();
      input.focus();
      DK.emit(el, 'dk:combobox-select', { value: value, label: label });
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(input, 'input', function () {
      filter(input.value);
      if (!isOpen) open();
      DK.emit(el, 'dk:combobox-change', { query: input.value });
    });

    DK.on(input, 'focus', function () {
      filter(input.value);
      open();
    });

    DK.on(input, 'keydown', function (e) {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        filter(input.value);
        open();
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (visibleOptions.length === 0) break;
          setHighlight(highlightIndex < visibleOptions.length - 1 ? highlightIndex + 1 : 0);
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (visibleOptions.length === 0) break;
          setHighlight(highlightIndex > 0 ? highlightIndex - 1 : visibleOptions.length - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (highlightIndex >= 0 && highlightIndex < visibleOptions.length) {
            selectOption(visibleOptions[highlightIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          close();
          break;

        case 'Home':
          if (isOpen) {
            e.preventDefault();
            if (visibleOptions.length > 0) setHighlight(0);
          }
          break;

        case 'End':
          if (isOpen) {
            e.preventDefault();
            if (visibleOptions.length > 0) setHighlight(visibleOptions.length - 1);
          }
          break;
      }
    });

    /* Option clicks */
    DK.on(listbox, 'click', function (e) {
      var opt = e.target.closest('.dk-combobox_option');
      if (opt && !opt.classList.contains('is-hidden')) {
        selectOption(opt);
      }
    });

    /* Click outside */
    function onOutsideClick(e) {
      if (!el.contains(e.target)) {
        close();
      }
    }
  });

})(window.DK);
