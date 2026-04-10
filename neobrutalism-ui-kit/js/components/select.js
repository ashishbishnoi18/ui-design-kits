/**
 * NB Select Component
 * Custom dropdown select with keyboard navigation, search filtering,
 * and full ARIA support.
 *
 * Usage:
 *   <div class="nb-select" data-nb-select>
 *     <button class="nb-select_trigger" type="button" aria-haspopup="listbox">
 *       <span class="nb-select_value">Choose...</span>
 *       <svg class="nb-select_chevron">...</svg>
 *     </button>
 *     <div class="nb-select_menu" role="listbox">
 *       <input class="nb-select_search" type="text" placeholder="Search...">
 *       <div class="nb-select_option" role="option" data-value="a">Option A</div>
 *       <div class="nb-select_option" role="option" data-value="b">Option B</div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:select-change — detail: { value: string, label: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('select', function (el) {
    var trigger = el.querySelector('.nb-select__trigger');
    var menu    = el.querySelector('.nb-select__menu');
    var search  = el.querySelector('.nb-select__search');
    var valueEl = el.querySelector('.nb-select__value');

    if (!trigger || !menu) return;

    var options     = [];
    var focusIndex  = -1;
    var isOpen      = false;
    var placeholder = valueEl ? valueEl.textContent : '';

    /* ---------------------------------------------------------------- */
    /*  Gather options                                                   */
    /* ---------------------------------------------------------------- */

    function refreshOptions() {
      options = NB.$$('.nb-select__option:not(.is-hidden)', menu);
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var menuId = menu.id || NB.uid('nb-select-menu');
    menu.id = menuId;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);
    menu.setAttribute('role', 'listbox');

    var allOptions = NB.$$('.nb-select__option', menu);
    allOptions.forEach(function (opt, i) {
      opt.setAttribute('role', 'option');
      if (!opt.id) opt.id = NB.uid('nb-select-opt');
      opt.setAttribute('aria-selected', 'false');
    });

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function open() {
      if (isOpen) return;
      isOpen = true;
      menu.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      refreshOptions();
      focusIndex = -1;

      /* Highlight active option if one exists */
      var active = menu.querySelector('.nb-select__option.is-active');
      if (active) {
        var idx = options.indexOf(active);
        if (idx >= 0) setFocus(idx);
      }

      if (search) {
        search.value = '';
        filterOptions('');
        search.focus();
      }

      NB.on(document, 'click', onOutsideClick, true);
      NB.on(document, 'keydown', onKeydown);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      focusIndex = -1;
      clearFocus();
      trigger.focus();
      NB.off(document, 'click', onOutsideClick, true);
      NB.off(document, 'keydown', onKeydown);
    }

    function toggle() {
      isOpen ? close() : open();
    }

    /* ---------------------------------------------------------------- */
    /*  Focus management                                                 */
    /* ---------------------------------------------------------------- */

    function clearFocus() {
      options.forEach(function (opt) {
        opt.classList.remove('is-focused');
      });
      trigger.removeAttribute('aria-activedescendant');
    }

    function setFocus(idx) {
      clearFocus();
      if (idx < 0 || idx >= options.length) return;
      focusIndex = idx;
      options[idx].classList.add('is-focused');
      trigger.setAttribute('aria-activedescendant', options[idx].id);

      /* Scroll into view */
      options[idx].scrollIntoView({ block: 'nearest' });
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function selectOption(opt) {
      /* Clear previous active */
      allOptions.forEach(function (o) {
        o.classList.remove('is-active');
        o.setAttribute('aria-selected', 'false');
      });

      opt.classList.add('is-active');
      opt.setAttribute('aria-selected', 'true');

      var value = opt.getAttribute('data-value') || opt.textContent.trim();
      var label = opt.textContent.trim();

      if (valueEl) {
        valueEl.textContent = label;
        valueEl.classList.remove('nb-select_placeholder');
      }

      close();
      NB.emit(el, 'nb:select-change', { value: value, label: label });
    }

    /* ---------------------------------------------------------------- */
    /*  Search / filter                                                  */
    /* ---------------------------------------------------------------- */

    function filterOptions(query) {
      var q = query.toLowerCase().trim();

      allOptions.forEach(function (opt) {
        var text = opt.textContent.toLowerCase();
        if (q === '' || text.indexOf(q) !== -1) {
          opt.classList.remove('is-hidden');
        } else {
          opt.classList.add('is-hidden');
        }
      });

      refreshOptions();
      focusIndex = -1;

      /* Show/hide empty message */
      var empty = menu.querySelector('.nb-select__empty');
      if (empty) {
        empty.style.display = options.length === 0 ? 'block' : 'none';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(trigger, 'click', function (e) {
      e.preventDefault();
      toggle();
    });

    /* Keyboard on trigger when closed */
    NB.on(trigger, 'keydown', function (e) {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open();
      }
    });

    /* Option clicks */
    NB.on(menu, 'click', function (e) {
      var opt = e.target.closest('.nb-select__option');
      if (opt && !opt.classList.contains('is-hidden')) {
        selectOption(opt);
      }
    });

    /* Search input */
    if (search) {
      NB.on(search, 'input', function () {
        filterOptions(search.value);
      });

      /* Prevent search keystrokes from bubbling to trigger close */
      NB.on(search, 'keydown', function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          refreshOptions();
          if (options.length > 0) setFocus(0);
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          refreshOptions();
          if (focusIndex >= 0 && focusIndex < options.length) {
            selectOption(options[focusIndex]);
          }
          return;
        }
        /* Let other keys pass through for typing */
        e.stopPropagation();
      });
    }

    /* Global keyboard when open */
    function onKeydown(e) {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          close();
          break;

        case 'ArrowDown':
          e.preventDefault();
          refreshOptions();
          if (options.length === 0) break;
          setFocus(focusIndex < options.length - 1 ? focusIndex + 1 : 0);
          break;

        case 'ArrowUp':
          e.preventDefault();
          refreshOptions();
          if (options.length === 0) break;
          setFocus(focusIndex > 0 ? focusIndex - 1 : options.length - 1);
          break;

        case 'Enter':
          e.preventDefault();
          if (focusIndex >= 0 && focusIndex < options.length) {
            selectOption(options[focusIndex]);
          }
          break;

        case 'Home':
          e.preventDefault();
          refreshOptions();
          if (options.length > 0) setFocus(0);
          break;

        case 'End':
          e.preventDefault();
          refreshOptions();
          if (options.length > 0) setFocus(options.length - 1);
          break;
      }
    }

    /* Click outside to close */
    function onOutsideClick(e) {
      if (!el.contains(e.target)) {
        close();
      }
    }
  });

})(window.NB);
