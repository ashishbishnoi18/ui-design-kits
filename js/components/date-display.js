/**
 * NB Date Display Component
 * Formats dates as relative time, short, or long format with optional live updates.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('date', function (el) {
    var isoString = el.getAttribute('data-nb-date');
    if (!isoString) return;

    var date = new Date(isoString);
    if (isNaN(date.getTime())) {
      console.warn('NB date-display: invalid date "' + isoString + '"');
      return;
    }

    var format = el.getAttribute('data-nb-date-format') || 'relative';
    var live = el.getAttribute('data-nb-date-live') === 'true';
    var intervalId = null;

    /* ---------------------------------------------------------------- */
    /*  Formatters                                                       */
    /* ---------------------------------------------------------------- */

    /**
     * Return a human-readable relative time string.
     * @param {Date} d
     * @returns {string}
     */
    function formatRelative(d) {
      var now = Date.now();
      var diffMs = now - d.getTime();
      var diffSec = Math.floor(diffMs / 1000);
      var diffMin = Math.floor(diffSec / 60);
      var diffHr = Math.floor(diffMin / 60);
      var diffDay = Math.floor(diffHr / 24);
      var diffMonth = Math.floor(diffDay / 30);
      var diffYear = Math.floor(diffDay / 365);

      if (diffSec < 60) return 'just now';
      if (diffMin < 60) return diffMin + (diffMin === 1 ? ' minute ago' : ' minutes ago');
      if (diffHr < 24) return diffHr + (diffHr === 1 ? ' hour ago' : ' hours ago');
      if (diffDay < 30) return diffDay + (diffDay === 1 ? ' day ago' : ' days ago');
      if (diffMonth < 12) return diffMonth + (diffMonth === 1 ? ' month ago' : ' months ago');
      return diffYear + (diffYear === 1 ? ' year ago' : ' years ago');
    }

    /**
     * Format as short date: "Mar 14, 2026"
     * @param {Date} d
     * @returns {string}
     */
    function formatShort(d) {
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    /**
     * Format as long date: "March 14, 2026"
     * @param {Date} d
     * @returns {string}
     */
    function formatLong(d) {
      return d.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function render() {
      var text;

      switch (format) {
        case 'short':
          text = formatShort(date);
          break;
        case 'long':
          text = formatLong(date);
          break;
        case 'relative':
        default:
          text = formatRelative(date);
          break;
      }

      el.textContent = text;
    }

    // Initial render
    render();

    // Set the datetime attribute for accessibility / SEO
    if (el.tagName === 'TIME' && !el.getAttribute('datetime')) {
      el.setAttribute('datetime', isoString);
    }

    /* ---------------------------------------------------------------- */
    /*  Live update                                                      */
    /* ---------------------------------------------------------------- */

    if (live) {
      intervalId = setInterval(render, 60000);
    }
  });

})(window.NB);
