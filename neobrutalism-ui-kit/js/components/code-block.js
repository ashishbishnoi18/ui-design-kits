/**
 * NB Code Block Component
 * Copy-to-clipboard functionality for code blocks.
 * Optionally integrates with Prism.js for syntax highlighting.
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('code-block', function (el) {
    var copyBtn = NB.$('.nb-code-block__copy', el);
    var codeEl = NB.$('code', el);

    if (!copyBtn || !codeEl) return;

    NB.on(copyBtn, 'click', function (e) {
      e.preventDefault();

      var text = codeEl.textContent;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showCopied();
        });
      } else {
        // Fallback for older browsers
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          showCopied();
        } catch (err) {
          console.warn('NB code-block: copy failed', err);
        }
        document.body.removeChild(textarea);
      }
    });

    function showCopied() {
      var original = copyBtn.textContent;
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('is-copied');

      setTimeout(function () {
        copyBtn.textContent = original;
        copyBtn.classList.remove('is-copied');
      }, 2000);
    }
  });

})(window.NB);
