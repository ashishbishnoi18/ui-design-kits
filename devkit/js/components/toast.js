/**
 * DK Toast Component
 * Programmatic toast notifications with auto-dismiss and hover pause.
 *
 * Usage:
 *   <!-- Container (place once in your page) -->
 *   <div class="dk-toast-container dk-toast-container--top-right"
 *        data-dk-toast-container></div>
 *
 * API:
 *   DK.toast({ title, message, type, duration, closable })
 *   DK.toast.success(message, options?)
 *   DK.toast.danger(message, options?)
 *   DK.toast.warning(message, options?)
 *   DK.toast.info(message, options?)
 *
 * Options:
 *   title    — string (optional heading)
 *   message  — string (required body text)
 *   type     — 'success' | 'danger' | 'warning' | 'info' (default: none)
 *   duration — ms before auto-dismiss (default: 5000, 0 = no auto)
 *   closable — show close button (default: true)
 *
 * Events:
 *   dk:toast-dismiss — on the toast element, detail: { type }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var container = null;
  var DEFAULT_DURATION = 5000;

  /* ------------------------------------------------------------------ */
  /*  SVG icons by type                                                  */
  /* ------------------------------------------------------------------ */

  var ICONS = {
    success:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    danger:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info:
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };

  var CLOSE_ICON =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* ------------------------------------------------------------------ */
  /*  Find or create container                                           */
  /* ------------------------------------------------------------------ */

  function getContainer() {
    if (container && document.body.contains(container)) return container;

    container = document.querySelector('[data-dk-toast-container]');
    if (!container) {
      container = document.createElement('div');
      container.className = 'dk-toast-container dk-toast-container--top-right';
      container.setAttribute('data-dk-toast-container', '');
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-relevant', 'additions');
      document.body.appendChild(container);
    }
    return container;
  }

  /* ------------------------------------------------------------------ */
  /*  Dismiss a toast                                                    */
  /* ------------------------------------------------------------------ */

  function dismiss(toastEl) {
    if (toastEl._dkDismissed) return;
    toastEl._dkDismissed = true;

    toastEl.classList.add('is-exiting');
    DK.emit(toastEl, 'dk:toast-dismiss', {
      type: toastEl._dkType || null,
    });

    /* Remove after animation */
    setTimeout(function () {
      if (toastEl.parentNode) {
        toastEl.parentNode.removeChild(toastEl);
      }
    }, 220);
  }

  /* ------------------------------------------------------------------ */
  /*  Create & show toast                                                */
  /* ------------------------------------------------------------------ */

  function createToast(opts) {
    if (typeof opts === 'string') {
      opts = { message: opts };
    }

    var type = opts.type || '';
    var title = opts.title || '';
    var message = opts.message || '';
    var duration = opts.duration !== undefined ? opts.duration : DEFAULT_DURATION;
    var closable = opts.closable !== undefined ? opts.closable : true;

    /* Build element */
    var toast = document.createElement('div');
    toast.className = 'dk-toast' + (type ? ' dk-toast--' + type : '');
    toast.setAttribute('role', 'alert');
    toast._dkType = type;

    var html = '';

    /* Icon */
    if (type && ICONS[type]) {
      html += '<span class="dk-toast_icon">' + ICONS[type] + '</span>';
    }

    /* Content */
    html += '<div class="dk-toast_content">';
    if (title) {
      html += '<div class="dk-toast_title">' + escapeHtml(title) + '</div>';
    }
    if (message) {
      html += '<div class="dk-toast_message">' + escapeHtml(message) + '</div>';
    }
    html += '</div>';

    /* Close */
    if (closable) {
      html +=
        '<button class="dk-toast_close" aria-label="Dismiss">' +
        CLOSE_ICON +
        '</button>';
    }

    toast.innerHTML = html;

    /* Close button handler */
    if (closable) {
      var closeBtn = toast.querySelector('.dk-toast_close');
      DK.on(closeBtn, 'click', function () {
        dismiss(toast);
      });
    }

    /* Auto-dismiss timer */
    var timer = null;

    function startTimer() {
      if (duration > 0) {
        timer = setTimeout(function () {
          dismiss(toast);
        }, duration);
      }
    }

    function pauseTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    /* Pause on hover */
    DK.on(toast, 'mouseenter', pauseTimer);
    DK.on(toast, 'mouseleave', startTimer);

    /* Append and start */
    getContainer().appendChild(toast);
    startTimer();

    return toast;
  }

  /* ------------------------------------------------------------------ */
  /*  HTML escape                                                        */
  /* ------------------------------------------------------------------ */

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /*  Shortcut methods                                                   */
  /* ------------------------------------------------------------------ */

  createToast.success = function (message, opts) {
    return createToast(Object.assign({ type: 'success', message: message }, opts || {}));
  };

  createToast.danger = function (message, opts) {
    return createToast(Object.assign({ type: 'danger', message: message }, opts || {}));
  };

  createToast.warning = function (message, opts) {
    return createToast(Object.assign({ type: 'warning', message: message }, opts || {}));
  };

  createToast.info = function (message, opts) {
    return createToast(Object.assign({ type: 'info', message: message }, opts || {}));
  };

  /* ------------------------------------------------------------------ */
  /*  Register container element (for ARIA)                              */
  /* ------------------------------------------------------------------ */

  DK.register('toast-container', function (el) {
    container = el;
    if (!el.getAttribute('aria-live')) {
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-relevant', 'additions');
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  DK.toast = createToast;

})(window.DK);
