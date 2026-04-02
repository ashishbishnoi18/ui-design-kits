/**
 * DK API Playground Component
 * Interactive API testing interface with method selection, headers,
 * body editing, and response display.
 *
 * Usage:
 *   <div class="dk-api-playground" data-dk-api-playground>
 *     <div class="dk-api_request-bar">
 *       <select class="dk-api_method-select" data-method="GET">
 *         <option value="GET">GET</option>
 *         <option value="POST">POST</option>
 *         <option value="PUT">PUT</option>
 *         <option value="DELETE">DELETE</option>
 *       </select>
 *       <input class="dk-api_url-input" placeholder="Enter URL..." />
 *       <button class="dk-api_send-btn">Send</button>
 *     </div>
 *     <div class="dk-api_tabs">
 *       <button class="dk-api_tab is-active" data-tab="headers">Headers</button>
 *       <button class="dk-api_tab" data-tab="body">Body</button>
 *     </div>
 *     <div class="dk-api_panel is-active" data-panel="headers">...</div>
 *     <div class="dk-api_panel" data-panel="body">
 *       <textarea class="dk-api_body" placeholder="Request body..."></textarea>
 *     </div>
 *     <div class="dk-api_response">
 *       <div class="dk-api_response-empty">Send a request to see the response</div>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:api-send — detail: { method, url, headers, body }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('api-playground', function (el) {

    var methodSelect = DK.$('.dk-api_method-select', el);
    var urlInput     = DK.$('.dk-api_url-input', el);
    var sendBtn      = DK.$('.dk-api_send-btn', el);
    var tabs         = DK.$$('.dk-api_tab', el);
    var panels       = DK.$$('.dk-api_panel', el);
    var responseEl   = DK.$('.dk-api_response', el);

    /* -------------------------------------------------------------- */
    /*  Method select — sync data-method for color coding              */
    /* -------------------------------------------------------------- */

    if (methodSelect) {
      function syncMethod() {
        methodSelect.setAttribute('data-method', methodSelect.value);
      }
      DK.on(methodSelect, 'change', syncMethod);
      syncMethod();
    }

    /* -------------------------------------------------------------- */
    /*  Tabs                                                           */
    /* -------------------------------------------------------------- */

    tabs.forEach(function (tab) {
      DK.on(tab, 'click', function () {
        var target = tab.getAttribute('data-tab');

        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        panels.forEach(function (p) { p.classList.remove('is-active'); });

        tab.classList.add('is-active');
        var panel = DK.$('[data-panel="' + target + '"]', el);
        if (panel) panel.classList.add('is-active');
      });
    });

    /* -------------------------------------------------------------- */
    /*  Add header row                                                 */
    /* -------------------------------------------------------------- */

    var addRowBtns = DK.$$('.dk-api_add-row', el);
    addRowBtns.forEach(function (btn) {
      DK.on(btn, 'click', function () {
        var container = btn.parentElement;
        var row = document.createElement('div');
        row.className = 'dk-api_kv-row';
        row.innerHTML =
          '<input type="text" placeholder="Key" />' +
          '<input type="text" placeholder="Value" />' +
          '<button class="dk-api_kv-remove" type="button">&times;</button>';
        container.insertBefore(row, btn);

        var removeBtn = row.querySelector('.dk-api_kv-remove');
        DK.on(removeBtn, 'click', function () { row.remove(); });
      });
    });

    /* Remove row — existing rows */
    DK.$$('.dk-api_kv-remove', el).forEach(function (btn) {
      DK.on(btn, 'click', function () {
        btn.closest('.dk-api_kv-row').remove();
      });
    });

    /* -------------------------------------------------------------- */
    /*  Collect headers from KV rows                                   */
    /* -------------------------------------------------------------- */

    function collectHeaders() {
      var headersPanel = DK.$('[data-panel="headers"]', el);
      if (!headersPanel) return {};

      var headers = {};
      DK.$$('.dk-api_kv-row', headersPanel).forEach(function (row) {
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
      DK.on(sendBtn, 'click', function () {
        var method  = methodSelect ? methodSelect.value : 'GET';
        var url     = urlInput ? urlInput.value.trim() : '';
        var bodyEl  = DK.$('.dk-api_body', el);
        var body    = bodyEl ? bodyEl.value : '';
        var headers = collectHeaders();

        if (!url) {
          if (urlInput) urlInput.focus();
          return;
        }

        sendBtn.classList.add('is-loading');
        sendBtn.textContent = 'Sending...';

        DK.emit(el, 'dk:api-send', {
          method: method,
          url: url,
          headers: headers,
          body: body,
        });

        /* Simulate a response for demo purposes.
           In production, hook into dk:api-send to make a real fetch. */
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
        var statusClass = 'dk-api_status--2xx';
        var responseBody = JSON.stringify({
          message: 'Success',
          method: method,
          url: url,
          timestamp: new Date().toISOString(),
        }, null, 2);

        responseEl.innerHTML =
          '<div class="dk-api_response-bar">' +
            '<span class="dk-api_status ' + statusClass + '">' + statusText + '</span>' +
            '<span class="dk-api_response-meta">247ms &middot; 128 B</span>' +
          '</div>' +
          '<pre class="dk-api_response-body">' + escapeHtml(responseBody) + '</pre>';
      }, 600);
    }

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }
  });

})(window.DK);
