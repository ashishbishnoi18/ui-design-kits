/**
 * NB API Playground Component
 * Interactive API testing interface with method selection, headers,
 * body editing, and response display.
 *
 * Usage:
 *   <div class="nb-api-playground" data-nb-api-playground>
 *     <div class="nb-api_request-bar">
 *       <select class="nb-api_method-select" data-method="GET">
 *         <option value="GET">GET</option>
 *         <option value="POST">POST</option>
 *         <option value="PUT">PUT</option>
 *         <option value="DELETE">DELETE</option>
 *       </select>
 *       <input class="nb-api_url-input" placeholder="Enter URL..." />
 *       <button class="nb-api_send-btn">Send</button>
 *     </div>
 *     <div class="nb-api_tabs">
 *       <button class="nb-api_tab is-active" data-tab="headers">Headers</button>
 *       <button class="nb-api_tab" data-tab="body">Body</button>
 *     </div>
 *     <div class="nb-api_panel is-active" data-panel="headers">...</div>
 *     <div class="nb-api_panel" data-panel="body">
 *       <textarea class="nb-api_body" placeholder="Request body..."></textarea>
 *     </div>
 *     <div class="nb-api_response">
 *       <div class="nb-api_response-empty">Send a request to see the response</div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:api-send — detail: { method, url, headers, body }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('api-playground', function (el) {

    var methodSelect = NB.$('.nb-api__method-select', el);
    var urlInput     = NB.$('.nb-api__url-input', el);
    var sendBtn      = NB.$('.nb-api__send-btn', el);
    var tabs         = NB.$$('.nb-api__tab', el);
    var panels       = NB.$$('.nb-api__panel', el);
    var responseEl   = NB.$('.nb-api__response', el);

    /* -------------------------------------------------------------- */
    /*  Method select — sync data-method for color coding              */
    /* -------------------------------------------------------------- */

    if (methodSelect) {
      function syncMethod() {
        methodSelect.setAttribute('data-method', methodSelect.value);
      }
      NB.on(methodSelect, 'change', syncMethod);
      syncMethod();
    }

    /* -------------------------------------------------------------- */
    /*  Tabs                                                           */
    /* -------------------------------------------------------------- */

    tabs.forEach(function (tab) {
      NB.on(tab, 'click', function () {
        var target = tab.getAttribute('data-tab');

        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        panels.forEach(function (p) { p.classList.remove('is-active'); });

        tab.classList.add('is-active');
        var panel = NB.$('[data-panel="' + target + '"]', el);
        if (panel) panel.classList.add('is-active');
      });
    });

    /* -------------------------------------------------------------- */
    /*  Add header row                                                 */
    /* -------------------------------------------------------------- */

    var addRowBtns = NB.$$('.nb-api__add-row', el);
    addRowBtns.forEach(function (btn) {
      NB.on(btn, 'click', function () {
        var container = btn.parentElement;
        var row = document.createElement('div');
        row.className = 'nb-api_kv-row';
        row.innerHTML =
          '<input type="text" placeholder="Key" />' +
          '<input type="text" placeholder="Value" />' +
          '<button class="nb-api_kv-remove" type="button">&times;</button>';
        container.insertBefore(row, btn);

        var removeBtn = row.querySelector('.nb-api__kv-remove');
        NB.on(removeBtn, 'click', function () { row.remove(); });
      });
    });

    /* Remove row — existing rows */
    NB.$$('.nb-api__kv-remove', el).forEach(function (btn) {
      NB.on(btn, 'click', function () {
        btn.closest('.nb-api__kv-row').remove();
      });
    });

    /* -------------------------------------------------------------- */
    /*  Collect headers from KV rows                                   */
    /* -------------------------------------------------------------- */

    function collectHeaders() {
      var headersPanel = NB.$('[data-panel="headers"]', el);
      if (!headersPanel) return {};

      var headers = {};
      NB.$$('.nb-api__kv-row', headersPanel).forEach(function (row) {
        var inputs = row.querySelectorAll('input');
        if (inputs.length >= 2) {
          var key = inputs[0].value.trim();
          var val = inputs[1].value.trim();
          if (key) headers[key] = val;
        }
      });
      return headers;
    }

    /* -------------------------------------------------------------- */
    /*  Send                                                           */
    /* -------------------------------------------------------------- */

    if (sendBtn) {
      NB.on(sendBtn, 'click', function () {
        var method  = methodSelect ? methodSelect.value : 'GET';
        var url     = urlInput ? urlInput.value.trim() : '';
        var bodyEl  = NB.$('.nb-api__body', el);
        var body    = bodyEl ? bodyEl.value : '';
        var headers = collectHeaders();

        if (!url) {
          if (urlInput) urlInput.focus();
          return;
        }

        sendBtn.classList.add('is-loading');
        sendBtn.textContent = 'Sending...';

        NB.emit(el, 'nb:api-send', {
          method: method,
          url: url,
          headers: headers,
          body: body,
        });

        /* Simulate a response for demo purposes.
           In production, hook into nb:api-send to make a real fetch. */
        simulateResponse(method, url);
      });
    }

    /* -------------------------------------------------------------- */
    /*  Simulate response (demo)                                       */
    /* -------------------------------------------------------------- */

    function simulateResponse(method, url) {
      setTimeout(function () {
        sendBtn.classList.remove('is-loading');
        sendBtn.textContent = 'Send';

        if (!responseEl) return;

        var statusCode = 200;
        var statusText = '200 OK';
        var statusClass = 'nb-api_status--2xx';
        var responseBody = JSON.stringify({
          message: 'Success',
          method: method,
          url: url,
          timestamp: new Date().toISOString(),
        }, null, 2);

        responseEl.innerHTML =
          '<div class="nb-api_response-bar">' +
            '<span class="nb-api_status ' + statusClass + '">' + statusText + '</span>' +
            '<span class="nb-api_response-meta">247ms &middot; 128 B</span>' +
          '</div>' +
          '<pre class="nb-api_response-body">' + escapeHtml(responseBody) + '</pre>';
      }, 600);
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }
  });

})(window.NB);
