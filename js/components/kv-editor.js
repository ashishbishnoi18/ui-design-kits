/**
 * NB Key-Value Editor Component
 * Editable key-value pair rows for headers, query params, etc.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Small X icon SVG used for the remove button */
  var REMOVE_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
    '<line x1="2" y1="2" x2="8" y2="8"/>' +
    '<line x1="8" y1="2" x2="2" y2="8"/>' +
    '</svg>';

  /* ------------------------------------------------------------------ */
  /*  Static API                                                         */
  /* ------------------------------------------------------------------ */

  NB.kvEditor = {};

  /**
   * Get current entries from a kv-editor element.
   * @param {HTMLElement|string} el — the element or its ID
   * @returns {Array<{key: string, value: string}>}
   */
  NB.kvEditor.getData = function (el) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return [];

    return getEntries(el);
  };

  /* ------------------------------------------------------------------ */
  /*  Shared helpers                                                      */
  /* ------------------------------------------------------------------ */

  function getEntries(root) {
    var rows = NB.$$('.nb-kv-editor__row', root);
    var entries = [];

    rows.forEach(function (row) {
      var keyInput = NB.$('.nb-kv-editor__key', row);
      var valInput = NB.$('.nb-kv-editor__value', row);
      if (!keyInput || !valInput) return;

      var k = keyInput.value.trim();
      var v = valInput.value.trim();
      if (k || v) {
        entries.push({ key: k, value: v });
      }
    });

    return entries;
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('kv-editor', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Build initial DOM                                                */
    /* ---------------------------------------------------------------- */

    var body = NB.$('.nb-kv-editor__body', el);
    if (!body) {
      body = document.createElement('div');
      body.className = 'nb-kv-editor__body';
    }

    /* Parse initial data from attribute */
    var initialData = [];
    var dataAttr = el.getAttribute('data-nb-kv-editor-data');
    if (dataAttr) {
      try {
        initialData = JSON.parse(dataAttr);
      } catch (err) {
        console.warn('NB kv-editor: invalid JSON in data-nb-kv-editor-data', err);
      }
    }

    /* Check for existing rows already in the DOM */
    var existingRows = NB.$$('.nb-kv-editor__row', el);
    var hasExistingRows = existingRows.length > 0;

    /* Build wrapper */
    el.innerHTML = '';
    el.classList.add('nb-kv-editor');

    /* Header row */
    var header = document.createElement('div');
    header.className = 'nb-kv-editor__header';

    var headerKey = document.createElement('span');
    headerKey.className = 'nb-kv-editor__header-cell';
    headerKey.textContent = 'Key';
    header.appendChild(headerKey);

    var headerVal = document.createElement('span');
    headerVal.className = 'nb-kv-editor__header-cell';
    headerVal.textContent = 'Value';
    header.appendChild(headerVal);

    var headerDel = document.createElement('span');
    headerDel.className = 'nb-kv-editor__header-cell nb-kv-editor__header-cell--action';
    header.appendChild(headerDel);

    el.appendChild(header);
    el.appendChild(body);

    /* Populate from attribute data */
    if (initialData.length) {
      initialData.forEach(function (pair) {
        body.appendChild(createRow(pair.key || '', pair.value || ''));
      });
    } else if (hasExistingRows) {
      /* Re-attach existing rows, wiring up events */
      existingRows.forEach(function (row) {
        wireRow(row);
        body.appendChild(row);
      });
    }

    /* Add button */
    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'nb-kv-editor__add';
    addBtn.textContent = '+ Add';
    el.appendChild(addBtn);

    NB.on(addBtn, 'click', function () {
      var row = createRow('', '');
      body.appendChild(row);
      var keyInput = NB.$('.nb-kv-editor__key', row);
      if (keyInput) keyInput.focus();
    });

    /* ---------------------------------------------------------------- */
    /*  Create a row                                                     */
    /* ---------------------------------------------------------------- */

    function createRow(key, value) {
      var row = document.createElement('div');
      row.className = 'nb-kv-editor__row';

      var keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.className = 'nb-kv-editor__key';
      keyInput.placeholder = 'Key';
      keyInput.value = key;

      var valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.className = 'nb-kv-editor__value';
      valInput.placeholder = 'Value';
      valInput.value = value;

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'nb-kv-editor__remove';
      removeBtn.setAttribute('aria-label', 'Remove row');
      removeBtn.innerHTML = REMOVE_SVG;

      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(removeBtn);

      wireRow(row);

      return row;
    }

    /* ---------------------------------------------------------------- */
    /*  Wire events on a row                                             */
    /* ---------------------------------------------------------------- */

    function wireRow(row) {
      var keyInput = NB.$('.nb-kv-editor__key', row);
      var valInput = NB.$('.nb-kv-editor__value', row);
      var removeBtn = NB.$('.nb-kv-editor__remove', row);

      if (keyInput) {
        NB.on(keyInput, 'input', function () {
          emitChange();
        });

        NB.on(keyInput, 'keydown', function (e) {
          if (e.key === 'Backspace' && keyInput.value === '' && valInput && valInput.value === '') {
            e.preventDefault();
            removeRow(row);
          }
        });
      }

      if (valInput) {
        NB.on(valInput, 'input', function () {
          emitChange();
        });
      }

      if (removeBtn) {
        NB.on(removeBtn, 'click', function () {
          removeRow(row);
        });
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Remove a row                                                     */
    /* ---------------------------------------------------------------- */

    function removeRow(row) {
      if (row.parentNode) {
        row.parentNode.removeChild(row);
      }
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Emit change event                                                */
    /* ---------------------------------------------------------------- */

    function emitChange() {
      NB.emit(el, 'nb:kv-change', { entries: getEntries(el) });
    }
  });

})(window.NB);
