/**
 * DK Select Component
 * Custom dropdown select with keyboard navigation, search filtering,
 * and full ARIA support.
 *
 * Usage:
 *   <div class="dk-select" data-dk-select>
 *     <button class="dk-select_trigger" type="button" aria-haspopup="listbox">
 *       <span class="dk-select_value">Choose...</span>
 *       <svg class="dk-select_chevron">...</svg>
 *     </button>
 *     <div class="dk-select_menu" role="listbox">
 *       <input class="dk-select_search" type="text" placeholder="Search...">
 *       <div class="dk-select_option" role="option" data-value="a">Option A</div>
 *       <div class="dk-select_option" role="option" data-value="b">Option B</div>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:select-change — detail: { value: string, label: string }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('select', function (el) {
    var trigger = el.querySelector('.dk-select_trigger');
    var menu    = el.querySelector('.dk-select_menu');
    var search  = el.querySelector('.dk-select_search');
    var valueEl = el.querySelector('.dk-select_value');

    if (!trigger || !menu) return;

    var options     = [];
    var focusIndex  = -1;
    var isOpen      = false;
    var placeholder = valueEl ? valueEl.textContent : '';

    /* ---------------------------------------------------------------- */
    /*  Gather options                                                   */
    /* ---------------------------------------------------------------- */

    function refreshOptions() {
      options = DK.$$('.dk-select_option:not(.is-hidden)', menu);
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    var menuId = menu.id || DK.uid('dk-select-menu');
    menu.id = menuId;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);
    menu.setAttribute('role', 'listbox');

    var allOptions = DK.$$('.dk-select_option', menu);
    allOptions.forEach(function (opt, i) {
      opt.setAttribute('role', 'option');
      if (!opt.id) opt.id = DK.uid('dk-select-opt');
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
      var active = menu.querySelector('.dk-select_option.is-active');
      if (active) {
        var idx = options.indexOf(active);
        if (idx >= 0) setFocus(idx);
      }

      if (search) {
        search.value = '';
        filterOptions('');
        search.focus();
      }

      DK.on(document, 'click', onOutsideClick, true);
      DK.on(document, 'keydown', onKeydown);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      menu.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      focusIndex = -1;
      clearFocus();
      trigger.focus();
      DK.off(document, 'click', onOutsideClick, true);
      DK.off(document, 'keydown', onKeydown);
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
        valueEl.classList.remove('dk-select_placeholder');
      }

      close();
      DK.emit(el, 'dk:select-change', { value: value, label: label });
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
      var empty = menu.querySelector('.dk-select_empty');
      if (empty) {
        empty.style.display = options.length === 0 ? 'block' : 'none';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(trigger, 'click', function (e) {
      e.preventDefault();
      toggle();
    });

    /* Keyboard on trigger when closed */
    DK.on(trigger, 'keydown', function (e) {
      if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        open();
      }
    });

    /* Option clicks */
    DK.on(menu, 'click', function (e) {
      var opt = e.target.closest('.dk-select_option');
      if (opt && !opt.classList.contains('is-hidden')) {
        selectOption(opt);
      }
    });

    /* Search input */
    if (search) {
      DK.on(search, 'input', function () {
        filterOptions(search.value);
      });

      /* Prevent search keystrokes from bubbling to trigger close */
      DK.on(search, 'keydown', function (e) {
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

})(window.DK);
