/**
 * DK Key-Value Editor Component
 * Editable key-value pair rows for headers, query params, etc.
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var REMOVE_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
    '<line x1="2" y1="2" x2="8" y2="8"/>' +
    '<line x1="8" y1="2" x2="2" y2="8"/>' +
    '</svg>';

  DK.kvEditor = {};

  DK.kvEditor.getData = function (el) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return [];
    return getEntries(el);
  };

  function getEntries(root) {
    var rows = DK.$$('.dk-kv-editor__row', root);
    var entries = [];

    rows.forEach(function (row) {
      var keyInput = DK.$('.dk-kv-editor__key', row);
      var valInput = DK.$('.dk-kv-editor__value', row);
      if (!keyInput || !valInput) return;

      var k = keyInput.value.trim();
      var v = valInput.value.trim();
      if (k || v) {
        entries.push({ key: k, value: v });
      }
    });

    return entries;
  }

  DK.register('kv-editor', function (el) {
    var body = DK.$('.dk-kv-editor__body', el);
    if (!body) {
      body = document.createElement('div');
      body.className = 'dk-kv-editor__body';
    }

    var initialData = [];
    var dataAttr = el.getAttribute('data-dk-kv-editor-data');
    if (dataAttr) {
      try {
        initialData = JSON.parse(dataAttr);
      } catch (err) {
        console.warn('DK kv-editor: invalid JSON in data-dk-kv-editor-data', err);
      }
    }

    var existingRows = DK.$$('.dk-kv-editor__row', el);
    var hasExistingRows = existingRows.length > 0;

    el.innerHTML = '';
    el.classList.add('dk-kv-editor');

    var header = document.createElement('div');
    header.className = 'dk-kv-editor__header';

    var headerKey = document.createElement('span');
    headerKey.className = 'dk-kv-editor__header-cell';
    headerKey.textContent = 'Key';
    header.appendChild(headerKey);

    var headerVal = document.createElement('span');
    headerVal.className = 'dk-kv-editor__header-cell';
    headerVal.textContent = 'Value';
    header.appendChild(headerVal);

    var headerDel = document.createElement('span');
    headerDel.className = 'dk-kv-editor__header-cell dk-kv-editor__header-cell--action';
    header.appendChild(headerDel);

    el.appendChild(header);
    el.appendChild(body);

    if (initialData.length) {
      initialData.forEach(function (pair) {
        body.appendChild(createRow(pair.key || '', pair.value || ''));
      });
    } else if (hasExistingRows) {
      existingRows.forEach(function (row) {
        wireRow(row);
        body.appendChild(row);
      });
    }

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'dk-kv-editor__add';
    addBtn.textContent = '+ Add';
    el.appendChild(addBtn);

    DK.on(addBtn, 'click', function () {
      var row = createRow('', '');
      body.appendChild(row);
      var keyInput = DK.$('.dk-kv-editor__key', row);
      if (keyInput) keyInput.focus();
    });

    function createRow(key, value) {
      var row = document.createElement('div');
      row.className = 'dk-kv-editor__row';

      var keyInput = document.createElement('input');
      keyInput.type = 'text';
      keyInput.className = 'dk-kv-editor__key';
      keyInput.placeholder = 'Key';
      keyInput.value = key;

      var valInput = document.createElement('input');
      valInput.type = 'text';
      valInput.className = 'dk-kv-editor__value';
      valInput.placeholder = 'Value';
      valInput.value = value;

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'dk-kv-editor__remove';
      removeBtn.setAttribute('aria-label', 'Remove row');
      removeBtn.innerHTML = REMOVE_SVG;

      row.appendChild(keyInput);
      row.appendChild(valInput);
      row.appendChild(removeBtn);

      wireRow(row);
      return row;
    }

    function wireRow(row) {
      var keyInput = DK.$('.dk-kv-editor__key', row);
      var valInput = DK.$('.dk-kv-editor__value', row);
      var removeBtn = DK.$('.dk-kv-editor__remove', row);

      if (keyInput) {
        DK.on(keyInput, 'input', function () { emitChange(); });
        DK.on(keyInput, 'keydown', function (e) {
          if (e.key === 'Backspace' && keyInput.value === '' && valInput && valInput.value === '') {
            e.preventDefault();
            removeRow(row);
          }
        });
      }

      if (valInput) {
        DK.on(valInput, 'input', function () { emitChange(); });
      }

      if (removeBtn) {
        DK.on(removeBtn, 'click', function () { removeRow(row); });
      }
    }

    function removeRow(row) {
      if (row.parentNode) row.parentNode.removeChild(row);
      emitChange();
    }

    function emitChange() {
      DK.emit(el, 'dk:kv-change', { entries: getEntries(el) });
    }
  });

})(window.DK);
