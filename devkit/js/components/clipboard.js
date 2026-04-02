/**
 * DK Clipboard Component
 * Copy-to-clipboard with visual feedback and icon swap.
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var COPY_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/>' +
    '<path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" stroke="currentColor" stroke-width="1.5"/>' +
    '</svg>';

  var CHECK_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M3 8.5l3.5 3.5 6.5-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  DK.register('clipboard', function (el) {
    var target = el.getAttribute('data-dk-clipboard');
    var iconEl = DK.$('.dk-clipboard_icon', el);

    el.classList.add('dk-clipboard');

    // Create tooltip
    var tooltip = document.createElement('span');
    tooltip.className = 'dk-clipboard_tooltip';
    tooltip.textContent = 'Copied!';
    el.appendChild(tooltip);

    // Set initial icon if icon slot exists
    if (iconEl) {
      iconEl.innerHTML = COPY_SVG;
    }

    /* ---------------------------------------------------------------- */
    /*  Get text to copy                                                 */
    /* ---------------------------------------------------------------- */

    function getTextToCopy() {
      // If target is a selector, get text from that element
      if (target && target !== 'true' && target !== '') {
        var targetEl = document.querySelector(target);
        if (targetEl) {
          return targetEl.textContent || targetEl.value || '';
        }
      }

      // Otherwise use data attribute text or button text
      var text = el.getAttribute('data-dk-clipboard-text');
      if (text) return text;

      return el.textContent.replace('Copied!', '').trim();
    }

    /* ---------------------------------------------------------------- */
    /*  Copy action                                                      */
    /* ---------------------------------------------------------------- */

    function doCopy() {
      var text = getTextToCopy();
      if (!text) return;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(showFeedback);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showFeedback();
      }
    }

    function showFeedback() {
      el.classList.add('is-copied');
      if (iconEl) iconEl.innerHTML = CHECK_SVG;

      DK.emit(el, 'dk:clipboard-copy');

      setTimeout(function () {
        el.classList.remove('is-copied');
        if (iconEl) iconEl.innerHTML = COPY_SVG;
      }, 2000);
    }

    DK.on(el, 'click', function (e) {
      e.preventDefault();
      doCopy();
    });
  });

})(window.DK);
