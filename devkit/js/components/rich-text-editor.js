/**
 * DK Rich Text Editor Component
 * Toolbar with formatting commands and a contenteditable area.
 *
 * Usage:
 *   <div data-dk-editor class="dk-editor">
 *     <div class="dk-editor_toolbar">
 *       <div class="dk-editor_toolbar-group">
 *         <button type="button" class="dk-editor_btn" data-dk-cmd="bold" aria-label="Bold">
 *           <svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2h5a3 3 0 012 5.24A3.5 3.5 0 019.5 14H4V2zm2 5h3a1 1 0 100-2H6v2zm0 2v3h3.5a1.5 1.5 0 000-3H6z"/></svg>
 *         </button>
 *         <button type="button" class="dk-editor_btn" data-dk-cmd="italic" aria-label="Italic">
 *           <svg viewBox="0 0 16 16" fill="currentColor"><path d="M6 2h6v2h-2.2l-2.6 8H9v2H3v-2h2.2l2.6-8H6V2z"/></svg>
 *         </button>
 *         <!-- ... more buttons -->
 *       </div>
 *     </div>
 *     <div class="dk-editor_content" contenteditable="true" data-placeholder="Start writing..."></div>
 *   </div>
 *
 * Supported data-dk-cmd values:
 *   bold, italic, underline, strikethrough, link, heading, ul, ol, code, quote
 *
 * Events:
 *   dk:editor-change — detail: { html: string }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var CMD_MAP = {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikeThrough',
    ul: 'insertUnorderedList',
    ol: 'insertOrderedList'
  };

  var QUERY_MAP = {
    bold: 'bold',
    italic: 'italic',
    underline: 'underline',
    strikethrough: 'strikeThrough',
    ul: 'insertUnorderedList',
    ol: 'insertOrderedList'
  };

  DK.register('editor', function (el) {

    var toolbar = DK.$('.dk-editor_toolbar', el);
    var content = DK.$('.dk-editor_content', el);
    if (!content) return;

    var buttons = toolbar ? DK.$$('.dk-editor_btn[data-dk-cmd]', toolbar) : [];
    var linkDialog = null;
    var linkInput = null;

    /* ---------------------------------------------------------------- */
    /*  Ensure contenteditable                                           */
    /* ---------------------------------------------------------------- */

    content.setAttribute('contenteditable', 'true');
    content.setAttribute('role', 'textbox');
    content.setAttribute('aria-multiline', 'true');
    content.setAttribute('aria-label', 'Rich text editor');

    // Generate unique id for ARIA linking
    var contentId = content.id || DK.uid('dk-editor-content');
    content.id = contentId;

    /* ---------------------------------------------------------------- */
    /*  Link dialog                                                      */
    /* ---------------------------------------------------------------- */

    function buildLinkDialog() {
      linkDialog = document.createElement('div');
      linkDialog.className = 'dk-editor_link-dialog is-hidden';

      linkInput = document.createElement('input');
      linkInput.type = 'url';
      linkInput.className = 'dk-editor_link-input';
      linkInput.placeholder = 'https://...';
      linkInput.setAttribute('aria-label', 'Link URL');

      var applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.className = 'dk-editor_link-btn';
      applyBtn.textContent = 'Apply';

      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'dk-editor_link-btn';
      cancelBtn.textContent = 'Cancel';

      linkDialog.appendChild(linkInput);
      linkDialog.appendChild(applyBtn);
      linkDialog.appendChild(cancelBtn);
      el.appendChild(linkDialog);

      DK.on(applyBtn, 'click', function () {
        var url = linkInput.value.trim();
        if (url) {
          content.focus();
          restoreSelection();
          document.execCommand('createLink', false, url);
          emitChange();
        }
        closeLinkDialog();
      });

      DK.on(cancelBtn, 'click', closeLinkDialog);

      DK.on(linkInput, 'keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          applyBtn.click();
        } else if (e.key === 'Escape') {
          closeLinkDialog();
        }
      });
    }

    var savedRange = null;

    function saveSelection() {
      var sel = window.getSelection();
      if (sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0).cloneRange();
      }
    }

    function restoreSelection() {
      if (savedRange) {
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    }

    function openLinkDialog() {
      saveSelection();
      linkDialog.classList.remove('is-hidden');
      linkInput.value = '';
      linkInput.focus();
    }

    function closeLinkDialog() {
      linkDialog.classList.add('is-hidden');
      content.focus();
      restoreSelection();
    }

    /* ---------------------------------------------------------------- */
    /*  Command execution                                                */
    /* ---------------------------------------------------------------- */

    function execCmd(cmd) {
      content.focus();

      if (cmd === 'link') {
        openLinkDialog();
        return;
      }

      if (cmd === 'heading') {
        // Toggle between h2 and paragraph
        var current = document.queryCommandValue('formatBlock');
        if (current === 'h2' || current === 'H2') {
          document.execCommand('formatBlock', false, 'p');
        } else {
          document.execCommand('formatBlock', false, 'h2');
        }
        updateActiveStates();
        emitChange();
        return;
      }

      if (cmd === 'code') {
        // Wrap selection in <code>
        var sel = window.getSelection();
        if (sel.rangeCount > 0) {
          var range = sel.getRangeAt(0);
          var text = range.toString();
          if (text) {
            // Check if already in code
            var parent = sel.anchorNode.parentElement;
            if (parent && parent.tagName === 'CODE') {
              // Remove code wrapper
              var textNode = document.createTextNode(parent.textContent);
              parent.parentNode.replaceChild(textNode, parent);
            } else {
              var code = document.createElement('code');
              range.surroundContents(code);
            }
          }
        }
        updateActiveStates();
        emitChange();
        return;
      }

      if (cmd === 'quote') {
        var currentBlock = document.queryCommandValue('formatBlock');
        if (currentBlock === 'blockquote' || currentBlock === 'BLOCKQUOTE') {
          document.execCommand('formatBlock', false, 'p');
        } else {
          document.execCommand('formatBlock', false, 'blockquote');
        }
        updateActiveStates();
        emitChange();
        return;
      }

      // Standard commands
      var execName = CMD_MAP[cmd];
      if (execName) {
        document.execCommand(execName, false, null);
        updateActiveStates();
        emitChange();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Active states                                                     */
    /* ---------------------------------------------------------------- */

    function updateActiveStates() {
      buttons.forEach(function (btn) {
        var cmd = btn.getAttribute('data-dk-cmd');
        var isActive = false;

        if (QUERY_MAP[cmd]) {
          isActive = document.queryCommandState(QUERY_MAP[cmd]);
        } else if (cmd === 'heading') {
          var val = document.queryCommandValue('formatBlock');
          isActive = val === 'h2' || val === 'H2' || val === 'h1' || val === 'H1' || val === 'h3' || val === 'H3';
        } else if (cmd === 'quote') {
          var qVal = document.queryCommandValue('formatBlock');
          isActive = qVal === 'blockquote' || qVal === 'BLOCKQUOTE';
        } else if (cmd === 'code') {
          var sel = window.getSelection();
          if (sel.anchorNode) {
            var p = sel.anchorNode.parentElement;
            isActive = p && p.tagName === 'CODE';
          }
        }

        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', String(isActive));
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Change emission                                                  */
    /* ---------------------------------------------------------------- */

    function emitChange() {
      DK.emit(el, 'dk:editor-change', { html: content.innerHTML });
    }

    /* ---------------------------------------------------------------- */
    /*  Button clicks                                                    */
    /* ---------------------------------------------------------------- */

    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', 'false');
      DK.on(btn, 'mousedown', function (e) {
        // Prevent focus loss from content area
        e.preventDefault();
      });
      DK.on(btn, 'click', function (e) {
        e.preventDefault();
        var cmd = btn.getAttribute('data-dk-cmd');
        execCmd(cmd);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Content events                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(content, 'input', function () {
      emitChange();
    });

    DK.on(content, 'keyup', updateActiveStates);
    DK.on(content, 'mouseup', updateActiveStates);

    // Keyboard shortcuts
    DK.on(content, 'keydown', function (e) {
      if (e.ctrlKey || e.metaKey) {
        var key = e.key.toLowerCase();
        if (key === 'b') { e.preventDefault(); execCmd('bold'); }
        else if (key === 'i') { e.preventDefault(); execCmd('italic'); }
        else if (key === 'u') { e.preventDefault(); execCmd('underline'); }
        else if (key === 'k') { e.preventDefault(); execCmd('link'); }
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    buildLinkDialog();
  });

})(window.DK);
