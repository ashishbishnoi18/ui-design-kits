/**
 * NB Multiselect Component
 * Multi-value select with chips, dropdown checkboxes, and search filtering.
 *
 * Usage:
 *   <div class="nb-multiselect" data-nb-multiselect>
 *     <div class="nb-multiselect_trigger" tabindex="0" role="combobox"
 *          aria-expanded="false" aria-haspopup="listbox">
 *       <span class="nb-multiselect_placeholder">Select items...</span>
 *     </div>
 *     <div class="nb-multiselect_dropdown" role="listbox" aria-multiselectable="true">
 *       <input class="nb-multiselect_search" type="text" placeholder="Filter...">
 *       <div class="nb-multiselect_option" data-value="a">
 *         <span class="nb-multiselect_check"><svg class="nb-multiselect_check-icon" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></span>
 *         Option A
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:multiselect-change — detail: { values: string[], labels: string[] }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('multiselect', function (el) {
    var trigger     = el.querySelector('.nb-multiselect__trigger');
    var dropdown    = el.querySelector('.nb-multiselect__dropdown');
    var search      = el.querySelector('.nb-multiselect__search');
    var placeholder = el.querySelector('.nb-multiselect__placeholder');

    if (!trigger || !dropdown) return;

    var allOptions  = NB.$$('.nb-multiselect__option', dropdown);
    var selected    = [];
    var isOpen      = false;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    var dropdownId = dropdown.id || NB.uid('nb-multiselect-dd');
    dropdown.id = dropdownId;
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-controls', dropdownId);
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-multiselectable', 'true');

    allOptions.forEach(function (opt) {
      opt.setAttribute('role', 'option');
      opt.setAttribute('aria-selected', 'false');
      if (!opt.id) opt.id = NB.uid('nb-multi-opt');
    });

    /* ---------------------------------------------------------------- */
    /*  Open / Close                                                     */
    /* ---------------------------------------------------------------- */

    function open() {
      if (isOpen) return;
      isOpen = true;
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');

      if (search) {
        search.value = '';
        filterOptions('');
        search.focus();
      }

      NB.on(document, 'click', onOutsideClick, true);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      NB.off(document, 'click', onOutsideClick, true);
      trigger.focus();
    }

    function toggle() {
      isOpen ? close() : open();
    }

    /* ---------------------------------------------------------------- */
    /*  Chip rendering                                                   */
    /* ---------------------------------------------------------------- */

    function renderChips() {
      /* Remove old chips */
      NB.$$('.nb-multiselect__chip', trigger).forEach(function (c) { c.remove(); });

      if (selected.length === 0) {
        if (placeholder) placeholder.style.display = '';
        return;
      }

      if (placeholder) placeholder.style.display = 'none';

      selected.forEach(function (item) {
        var chip = document.createElement('span');
        chip.className = 'nb-multiselect_chip';
        chip.setAttribute('data-value', item.value);

        var text = document.createTextNode(item.label);
        var remove = document.createElement('button');
        remove.className = 'nb-multiselect_chip-remove';
        remove.type = 'button';
        remove.textContent = '\u00d7';
        remove.setAttribute('aria-label', 'Remove ' + item.label);

        chip.appendChild(text);
        chip.appendChild(remove);

        /* Insert before placeholder or chevron */
        var chevron = trigger.querySelector('.nb-multiselect__chevron');
        if (chevron) {
          trigger.insertBefore(chip, chevron);
        } else {
          trigger.appendChild(chip);
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function getOptionData(opt) {
      return {
        value: opt.getAttribute('data-value') || opt.textContent.trim(),
        label: opt.textContent.trim()
      };
    }

    function isSelected(value) {
      return selected.some(function (s) { return s.value === value; });
    }

    function toggleOption(opt) {
      var data = getOptionData(opt);

      if (isSelected(data.value)) {
        /* Deselect */
        selected = selected.filter(function (s) { return s.value !== data.value; });
        opt.classList.remove('is-checked');
        opt.setAttribute('aria-selected', 'false');
      } else {
        /* Select */
        selected.push(data);
        opt.classList.add('is-checked');
        opt.setAttribute('aria-selected', 'true');
      }

      renderChips();
      emitChange();
    }

    function deselectByValue(value) {
      selected = selected.filter(function (s) { return s.value !== value; });

      /* Update option state */
      allOptions.forEach(function (opt) {
        var val = opt.getAttribute('data-value') || opt.textContent.trim();
        if (val === value) {
          opt.classList.remove('is-checked');
          opt.setAttribute('aria-selected', 'false');
        }
      });

      renderChips();
      emitChange();
    }

    function emitChange() {
      NB.emit(el, 'nb:multiselect-change', {
        values: selected.map(function (s) { return s.value; }),
        labels: selected.map(function (s) { return s.label; })
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Filtering                                                        */
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
    }

    /* ---------------------------------------------------------------- */
    /*  Event handlers                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(trigger, 'click', function (e) {
      /* Handle chip remove buttons */
      var removeBtn = e.target.closest('.nb-multiselect__chip-remove');
      if (removeBtn) {
        var chip = removeBtn.closest('.nb-multiselect__chip');
        if (chip) {
          e.stopPropagation();
          deselectByValue(chip.getAttribute('data-value'));
        }
        return;
      }
      toggle();
    });

    NB.on(trigger, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        close();
      }
    });

    /* Option clicks */
    NB.on(dropdown, 'click', function (e) {
      var opt = e.target.closest('.nb-multiselect__option');
      if (opt && !opt.classList.contains('is-hidden')) {
        toggleOption(opt);
      }
    });

    /* Search filtering */
    if (search) {
      NB.on(search, 'input', function () {
        filterOptions(search.value);
      });

      NB.on(search, 'keydown', function (e) {
        if (e.key === 'Escape') {
          e.preventDefault();
          close();
        }
        e.stopPropagation();
      });
    }

    /* Click outside */
    function onOutsideClick(e) {
      if (!el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  Init pre-checked options                                         */
    /* ---------------------------------------------------------------- */

    allOptions.forEach(function (opt) {
      if (opt.classList.contains('is-checked')) {
        var data = getOptionData(opt);
        selected.push(data);
        opt.setAttribute('aria-selected', 'true');
      }
    });

    if (selected.length) renderChips();
  });

})(window.NB);
