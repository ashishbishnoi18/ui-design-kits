/**
 * NB JSON Viewer Component
 * Collapsible JSON tree viewer with syntax-colored primitives.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('json-viewer', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Read JSON source                                                 */
    /* ---------------------------------------------------------------- */

    var raw = el.getAttribute('data-nb-json-viewer');

    if (!raw || raw === '' || raw === 'true') {
      var scriptEl = NB.$('script[type="application/json"]', el);
      if (scriptEl) {
        raw = scriptEl.textContent;
      } else {
        var dataEl = NB.$('.nb-json-viewer__data', el);
        if (dataEl) {
          raw = dataEl.textContent;
        }
      }
    }

    if (!raw) return;

    var data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      console.warn('NB json-viewer: invalid JSON', err);
      return;
    }

    /* ---------------------------------------------------------------- */
    /*  Clear source elements and build tree                             */
    /* ---------------------------------------------------------------- */

    el.innerHTML = '';
    el.classList.add('nb-json-viewer');

    var tree = buildNode(null, data, 0, false);
    el.appendChild(tree);

    /* ---------------------------------------------------------------- */
    /*  Build a single node                                              */
    /* ---------------------------------------------------------------- */

    function buildNode(key, value, depth, isLast) {
      var node = document.createElement('div');
      node.className = 'nb-json-node';

      var type = getType(value);

      if (type === 'object' || type === 'array') {
        buildCompoundNode(node, key, value, type, depth, isLast);
      } else {
        buildPrimitiveNode(node, key, value, type, isLast);
      }

      return node;
    }

    /* ---------------------------------------------------------------- */
    /*  Compound node (object / array)                                   */
    /* ---------------------------------------------------------------- */

    function buildCompoundNode(node, key, value, type, depth, isLast) {
      var openBracket = type === 'array' ? '[' : '{';
      var closeBracket = type === 'array' ? ']' : '}';
      var keys = Object.keys(value);
      var count = keys.length;
      var countLabel = type === 'array'
        ? count + ' item' + (count !== 1 ? 's' : '')
        : count + ' key' + (count !== 1 ? 's' : '');

      var collapsed = depth >= 2;

      /* --- Line with toggle, key, opening bracket --- */
      var line = document.createElement('div');
      line.className = 'nb-json-node__line';

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nb-json-node__toggle';
      toggle.textContent = '\u25B6';
      if (collapsed) toggle.classList.add('is-collapsed');
      line.appendChild(toggle);

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json-node__key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json-node__colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var bracket = document.createElement('span');
      bracket.className = 'nb-json-node__bracket';
      bracket.textContent = openBracket;
      line.appendChild(bracket);

      /* Collapsed count preview */
      var countSpan = document.createElement('span');
      countSpan.className = 'nb-json-node__count';
      countSpan.textContent = countLabel;
      if (!collapsed) countSpan.style.display = 'none';
      line.appendChild(countSpan);

      /* Collapsed closing bracket (inline) */
      var closeBracketCollapsed = document.createElement('span');
      closeBracketCollapsed.className = 'nb-json-node__bracket';
      closeBracketCollapsed.textContent = closeBracket;
      if (!collapsed) closeBracketCollapsed.style.display = 'none';
      line.appendChild(closeBracketCollapsed);

      /* Comma after collapsed inline bracket */
      if (!isLast) {
        var commaCollapsed = document.createElement('span');
        commaCollapsed.className = 'nb-json-node__comma';
        commaCollapsed.textContent = ',';
        if (!collapsed) commaCollapsed.style.display = 'none';
        line.appendChild(commaCollapsed);
      }

      node.appendChild(line);

      /* --- Children container --- */
      var children = document.createElement('div');
      children.className = 'nb-json-node__children';
      if (collapsed) children.classList.add('is-collapsed');

      for (var i = 0; i < keys.length; i++) {
        var childKey = type === 'array' ? null : keys[i];
        var childValue = value[keys[i]];
        var childIsLast = i === keys.length - 1;
        children.appendChild(buildNode(childKey, childValue, depth + 1, childIsLast));
      }

      node.appendChild(children);

      /* --- Closing bracket (expanded) --- */
      var closingLine = document.createElement('div');
      closingLine.className = 'nb-json-node__line nb-json-node__closing';

      var closingBracket = document.createElement('span');
      closingBracket.className = 'nb-json-node__bracket';
      closingBracket.textContent = closeBracket;
      closingLine.appendChild(closingBracket);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json-node__comma';
        comma.textContent = ',';
        closingLine.appendChild(comma);
      }

      if (collapsed) closingLine.style.display = 'none';
      node.appendChild(closingLine);

      /* --- Toggle handler --- */
      NB.on(toggle, 'click', function () {
        var isNowCollapsed = !toggle.classList.contains('is-collapsed');

        toggle.classList.toggle('is-collapsed', isNowCollapsed);
        children.classList.toggle('is-collapsed', isNowCollapsed);

        countSpan.style.display = isNowCollapsed ? '' : 'none';
        closeBracketCollapsed.style.display = isNowCollapsed ? '' : 'none';
        closingLine.style.display = isNowCollapsed ? 'none' : '';

        if (commaCollapsed) {
          commaCollapsed.style.display = isNowCollapsed ? '' : 'none';
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Primitive node (string, number, boolean, null)                    */
    /* ---------------------------------------------------------------- */

    function buildPrimitiveNode(node, key, value, type, isLast) {
      var line = document.createElement('div');
      line.className = 'nb-json-node__line';

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json-node__key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json-node__colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var valSpan = document.createElement('span');
      valSpan.className = 'nb-json-node__value nb-json-node__value--' + type;

      if (type === 'string') {
        valSpan.textContent = '"' + value + '"';
      } else if (type === 'null') {
        valSpan.textContent = 'null';
      } else {
        valSpan.textContent = String(value);
      }

      line.appendChild(valSpan);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json-node__comma';
        comma.textContent = ',';
        line.appendChild(comma);
      }

      node.appendChild(line);
    }

    /* ---------------------------------------------------------------- */
    /*  Type helper                                                      */
    /* ---------------------------------------------------------------- */

    function getType(value) {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value; // 'string', 'number', 'boolean', 'object'
    }
  });

})(window.NB);
