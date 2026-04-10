/**
 * NB JSON Viewer Component
 * Collapsible JSON tree with syntax coloring and copy button.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var COPY_ICON =
    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.5"/>' +
    '</svg>';

  var CHECK_ICON =
    '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  NB.register('json-viewer', function (el) {

    /* ---------------------------------------------------------------- */
    /*  Read JSON                                                        */
    /* ---------------------------------------------------------------- */

    var raw = el.getAttribute('data-nb-json-viewer');

    if (!raw || raw === '' || raw === 'true') {
      var scriptEl = NB.$('script[type="application/json"]', el);
      if (scriptEl) {
        raw = scriptEl.textContent;
      } else {
        raw = el.textContent.trim();
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

    var lineNumbers = el.hasAttribute('data-nb-json-lines');
    var rawJSON = JSON.stringify(data, null, 2);

    /* ---------------------------------------------------------------- */
    /*  Build UI                                                         */
    /* ---------------------------------------------------------------- */

    el.innerHTML = '';
    el.classList.add('nb-json');
    if (lineNumbers) el.classList.add('nb-json--line-numbers');

    // Copy button
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'nb-json_copy';
    copyBtn.innerHTML = COPY_ICON + ' Copy';
    copyBtn.setAttribute('aria-label', 'Copy JSON');
    el.appendChild(copyBtn);

    NB.on(copyBtn, 'click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(rawJSON).then(function () {
          showCopied();
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = rawJSON;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showCopied();
      }
    });

    function showCopied() {
      copyBtn.innerHTML = CHECK_ICON + ' Copied!';
      copyBtn.classList.add('is-copied');
      setTimeout(function () {
        copyBtn.innerHTML = COPY_ICON + ' Copy';
        copyBtn.classList.remove('is-copied');
      }, 2000);
    }

    // Build tree
    var tree = buildNode(null, data, 0, false);
    el.appendChild(tree);

    /* ---------------------------------------------------------------- */
    /*  Build a node                                                     */
    /* ---------------------------------------------------------------- */

    function buildNode(key, value, depth, isLast) {
      var node = document.createElement('div');
      node.className = 'nb-json_node';

      var type = getType(value);

      if (type === 'object' || type === 'array') {
        buildCompound(node, key, value, type, depth, isLast);
      } else {
        buildPrimitive(node, key, value, type, isLast);
      }

      return node;
    }

    /* ---------------------------------------------------------------- */
    /*  Compound node                                                    */
    /* ---------------------------------------------------------------- */

    function buildCompound(node, key, value, type, depth, isLast) {
      var open = type === 'array' ? '[' : '{';
      var close = type === 'array' ? ']' : '}';
      var keys = Object.keys(value);
      var count = keys.length;
      var label = type === 'array'
        ? count + ' item' + (count !== 1 ? 's' : '')
        : count + ' key' + (count !== 1 ? 's' : '');

      var collapsed = depth >= 2;

      // Line
      var line = document.createElement('div');
      line.className = 'nb-json_line';

      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'nb-json_toggle';
      toggle.innerHTML = '<svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 2l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
      if (collapsed) toggle.classList.add('is-collapsed');
      line.appendChild(toggle);

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json_key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json_colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var bracket = document.createElement('span');
      bracket.className = 'nb-json_bracket';
      bracket.textContent = open;
      line.appendChild(bracket);

      var countSpan = document.createElement('span');
      countSpan.className = 'nb-json_count';
      countSpan.textContent = label;
      if (!collapsed) countSpan.style.display = 'none';
      line.appendChild(countSpan);

      var closeInline = document.createElement('span');
      closeInline.className = 'nb-json_bracket';
      closeInline.textContent = close;
      if (!collapsed) closeInline.style.display = 'none';
      line.appendChild(closeInline);

      var commaInline = null;
      if (!isLast) {
        commaInline = document.createElement('span');
        commaInline.className = 'nb-json_comma';
        commaInline.textContent = ',';
        if (!collapsed) commaInline.style.display = 'none';
        line.appendChild(commaInline);
      }

      node.appendChild(line);

      // Children
      var children = document.createElement('div');
      children.className = 'nb-json_children';
      if (collapsed) children.classList.add('is-collapsed');

      for (var i = 0; i < keys.length; i++) {
        var ck = type === 'array' ? null : keys[i];
        children.appendChild(buildNode(ck, value[keys[i]], depth + 1, i === keys.length - 1));
      }
      node.appendChild(children);

      // Closing line
      var closingLine = document.createElement('div');
      closingLine.className = 'nb-json_line nb-json_closing';

      var closingBracket = document.createElement('span');
      closingBracket.className = 'nb-json_bracket';
      closingBracket.textContent = close;
      closingLine.appendChild(closingBracket);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json_comma';
        comma.textContent = ',';
        closingLine.appendChild(comma);
      }

      if (collapsed) closingLine.style.display = 'none';
      node.appendChild(closingLine);

      // Toggle handler
      NB.on(toggle, 'click', function () {
        var nowCollapsed = !toggle.classList.contains('is-collapsed');
        toggle.classList.toggle('is-collapsed', nowCollapsed);
        children.classList.toggle('is-collapsed', nowCollapsed);
        countSpan.style.display = nowCollapsed ? '' : 'none';
        closeInline.style.display = nowCollapsed ? '' : 'none';
        closingLine.style.display = nowCollapsed ? 'none' : '';
        if (commaInline) commaInline.style.display = nowCollapsed ? '' : 'none';
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Primitive node                                                   */
    /* ---------------------------------------------------------------- */

    function buildPrimitive(node, key, value, type, isLast) {
      var line = document.createElement('div');
      line.className = 'nb-json_line';

      if (key !== null) {
        var keySpan = document.createElement('span');
        keySpan.className = 'nb-json_key';
        keySpan.textContent = '"' + key + '"';
        line.appendChild(keySpan);

        var colon = document.createElement('span');
        colon.className = 'nb-json_colon';
        colon.textContent = ': ';
        line.appendChild(colon);
      }

      var valSpan = document.createElement('span');
      valSpan.className = 'nb-json_value nb-json_value--' + type;

      if (type === 'string') valSpan.textContent = '"' + value + '"';
      else if (type === 'null') valSpan.textContent = 'null';
      else valSpan.textContent = String(value);

      line.appendChild(valSpan);

      if (!isLast) {
        var comma = document.createElement('span');
        comma.className = 'nb-json_comma';
        comma.textContent = ',';
        line.appendChild(comma);
      }

      node.appendChild(line);
    }

    /* ---------------------------------------------------------------- */
    /*  Type helper                                                      */
    /* ---------------------------------------------------------------- */

    function getType(v) {
      if (v === null) return 'null';
      if (Array.isArray(v)) return 'array';
      return typeof v;
    }
  });

})(window.NB);
