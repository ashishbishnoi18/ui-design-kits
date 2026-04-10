/**
 * NB Tag Input Component
 * Chip-style tag input with add/remove and keyboard support.
 *
 * Usage:
 *   <div class="nb-tag-input" data-nb-tag-input>
 *     <input class="nb-tag-input_field" type="text" placeholder="Add tag...">
 *   </div>
 *
 * Data attributes:
 *   data-nb-tag-input           — activates component
 *   data-nb-max="10"            — maximum number of tags
 *   data-nb-duplicates="false"  — allow duplicate tags (default false)
 *
 * Events:
 *   nb:tag-add    — detail: { tag: string, tags: string[] }
 *   nb:tag-remove — detail: { tag: string, tags: string[] }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tag-input', function (el) {
    var field = el.querySelector('.nb-tag-input_field');
    if (!field) return;

    var tags      = [];
    var max       = parseInt(el.getAttribute('data-nb-max'), 10) || 0;
    var allowDups = el.getAttribute('data-nb-duplicates') === 'true';

    /* ---------------------------------------------------------------- */
    /*  Rendering                                                        */
    /* ---------------------------------------------------------------- */

    function render() {
      /* Remove existing tag elements */
      var existing = NB.$$('.nb-tag-input_tag', el);
      existing.forEach(function (t) { t.remove(); });

      /* Insert tags before the input field */
      tags.forEach(function (tag, idx) {
        var chip = document.createElement('span');
        chip.className = 'nb-tag-input_tag';

        var text = document.createElement('span');
        text.className = 'nb-tag-input_tag-text';
        text.textContent = tag;

        var remove = document.createElement('button');
        remove.className = 'nb-tag-input_tag-remove';
        remove.type = 'button';
        remove.textContent = '\u00d7';
        remove.setAttribute('aria-label', 'Remove ' + tag);
        remove.setAttribute('data-index', idx);

        chip.appendChild(text);
        chip.appendChild(remove);
        el.insertBefore(chip, field);
      });

      /* Hide input if max reached */
      if (max && tags.length >= max) {
        field.style.display = 'none';
      } else {
        field.style.display = '';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Add / Remove                                                     */
    /* ---------------------------------------------------------------- */

    function addTag(value) {
      var tag = value.trim();
      if (!tag) return;

      /* Check max */
      if (max && tags.length >= max) return;

      /* Check duplicates */
      if (!allowDups) {
        var lower = tag.toLowerCase();
        for (var i = 0; i < tags.length; i++) {
          if (tags[i].toLowerCase() === lower) return;
        }
      }

      tags.push(tag);
      render();
      NB.emit(el, 'nb:tag-add', { tag: tag, tags: tags.slice() });
    }

    function removeTag(idx) {
      if (idx < 0 || idx >= tags.length) return;
      var removed = tags.splice(idx, 1)[0];
      render();
      NB.emit(el, 'nb:tag-remove', { tag: removed, tags: tags.slice() });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard handling                                                */
    /* ---------------------------------------------------------------- */

    NB.on(field, 'keydown', function (e) {
      var val = field.value;

      /* Enter or comma to add tag */
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        var raw = val.replace(/,/g, '');
        addTag(raw);
        field.value = '';
        return;
      }

      /* Backspace on empty input removes last tag */
      if (e.key === 'Backspace' && val === '' && tags.length > 0) {
        removeTag(tags.length - 1);
        return;
      }
    });

    /* Also handle pasting comma-separated values */
    NB.on(field, 'paste', function (e) {
      var pasted = (e.clipboardData || window.clipboardData).getData('text');
      if (pasted.indexOf(',') !== -1) {
        e.preventDefault();
        var parts = pasted.split(',');
        parts.forEach(function (p) { addTag(p); });
        field.value = '';
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Click to focus input                                             */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      if (e.target.closest('.nb-tag-input_tag-remove')) return;
      field.focus();
    });

    /* ---------------------------------------------------------------- */
    /*  Remove button clicks (delegated)                                 */
    /* ---------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var btn = e.target.closest('.nb-tag-input_tag-remove');
      if (!btn) return;
      var idx = parseInt(btn.getAttribute('data-index'), 10);
      if (!isNaN(idx)) removeTag(idx);
    });

    /* ---------------------------------------------------------------- */
    /*  Initialize from existing tag elements                            */
    /* ---------------------------------------------------------------- */

    var initialTags = NB.$$('.nb-tag-input_tag', el);
    initialTags.forEach(function (chip) {
      var text = chip.querySelector('.nb-tag-input_tag-text');
      if (text) tags.push(text.textContent.trim());
    });
    if (initialTags.length) render();
  });

})(window.NB);
