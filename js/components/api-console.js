/**
 * NB API Console Component
 * Console/log output panel with timestamped, level-colored entries.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Static API                                                         */
  /* ------------------------------------------------------------------ */

  NB.console = {};

  /**
   * Append a log entry to a console element.
   * @param {HTMLElement|string} el      — the console element or its ID
   * @param {string}             message — log text
   * @param {string}            [level]  — 'info' | 'warn' | 'error' | 'success' (default 'info')
   */
  NB.console.log = function (el, message, level) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return;

    level = level || 'info';

    /* Remove empty-state message if present */
    var empty = NB.$('.nb-console__empty', el);
    if (empty) {
      empty.parentNode.removeChild(empty);
    }

    /* Build log line */
    var line = document.createElement('div');
    line.className = 'nb-console__line';

    var time = document.createElement('span');
    time.className = 'nb-console__time';
    time.textContent = formatTime();
    line.appendChild(time);

    var levelSpan = document.createElement('span');
    levelSpan.className = 'nb-console__level nb-console__level--' + level;
    levelSpan.textContent = level;
    line.appendChild(levelSpan);

    var msg = document.createElement('span');
    msg.className = 'nb-console__msg';
    msg.textContent = message;
    line.appendChild(msg);

    el.appendChild(line);

    /* Enforce max lines */
    var max = parseInt(el.getAttribute('data-nb-api-console-max'), 10);
    if (max > 0) {
      var lines = NB.$$('.nb-console__line', el);
      while (lines.length > max) {
        lines[0].parentNode.removeChild(lines[0]);
        lines.shift();
      }
    }

    /* Auto-scroll to bottom */
    el.scrollTop = el.scrollHeight;
  };

  /**
   * Clear all log entries from a console element.
   * @param {HTMLElement|string} el — the console element or its ID
   */
  NB.console.clear = function (el) {
    if (typeof el === 'string') {
      el = document.getElementById(el);
    }
    if (!el) return;

    var lines = NB.$$('.nb-console__line', el);
    lines.forEach(function (line) {
      line.parentNode.removeChild(line);
    });

    addEmptyState(el);
  };

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function formatTime() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    var s = String(now.getSeconds()).padStart(2, '0');
    return h + ':' + m + ':' + s;
  }

  function addEmptyState(el) {
    var empty = document.createElement('div');
    empty.className = 'nb-console__empty';
    empty.textContent = 'No log entries.';
    el.appendChild(empty);
  }

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  NB.register('api-console', function (el) {
    el.classList.add('nb-console');

    /* Add empty state if no children */
    if (!el.children.length) {
      addEmptyState(el);
    }
  });

})(window.NB);
