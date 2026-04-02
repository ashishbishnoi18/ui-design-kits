/**
 * DK Chat Interface Component
 * Full chat UI with message input, auto-scroll, and typing indicator.
 *
 * Usage:
 *   <div class="dk-chat" data-dk-chat>
 *     <div class="dk-chat_header">...</div>
 *     <div class="dk-chat_messages">
 *       <!-- .dk-chat-message elements -->
 *       <div class="dk-chat_typing">
 *         <div class="dk-chat_typing-dots"><span></span><span></span><span></span></div>
 *         <span>typing...</span>
 *       </div>
 *     </div>
 *     <div class="dk-chat_input">
 *       <textarea class="dk-chat_input-field" placeholder="Type a message..."></textarea>
 *       <button class="dk-chat_send-btn">
 *         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 *           <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>
 *         </svg>
 *       </button>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:chat-send — detail: { text }
 *
 * API:
 *   DK.chat.scrollToBottom()
 *   DK.chat.showTyping()
 *   DK.chat.hideTyping()
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('chat', function (el) {

    var messagesEl = DK.$('.dk-chat_messages', el);
    var inputField = DK.$('.dk-chat_input-field', el);
    var sendBtn    = DK.$('.dk-chat_send-btn', el);
    var typingEl   = DK.$('.dk-chat_typing', el);

    if (!messagesEl) return;

    /* -------------------------------------------------------------- */
    /*  Scroll to bottom                                               */
    /* -------------------------------------------------------------- */

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    /* Initial scroll */
    scrollToBottom();

    /* -------------------------------------------------------------- */
    /*  Send message                                                   */
    /* -------------------------------------------------------------- */

    function sendMessage() {
      if (!inputField) return;
      var text = inputField.value.trim();
      if (!text) return;

      DK.emit(el, 'dk:chat-send', { text: text });

      /* Create and append sent message bubble */
      var msgDiv = document.createElement('div');
      msgDiv.className = 'dk-chat-message dk-chat-message-sent';
      msgDiv.innerHTML =
        '<div>' +
          '<div class="dk-chat-message_bubble">' + escapeHtml(text) + '</div>' +
          '<div class="dk-chat-message_time">' + formatTime() + '</div>' +
        '</div>';

      /* Insert before typing indicator if it exists, else append */
      if (typingEl) {
        messagesEl.insertBefore(msgDiv, typingEl);
      } else {
        messagesEl.appendChild(msgDiv);
      }

      inputField.value = '';
      inputField.style.height = '';
      scrollToBottom();
    }

    /* -------------------------------------------------------------- */
    /*  Send button click                                              */
    /* -------------------------------------------------------------- */

    if (sendBtn) {
      DK.on(sendBtn, 'click', sendMessage);
    }

    /* -------------------------------------------------------------- */
    /*  Enter key sends (Shift+Enter for newline)                      */
    /* -------------------------------------------------------------- */

    if (inputField) {
      DK.on(inputField, 'keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      /* Auto-resize textarea */
      DK.on(inputField, 'input', function () {
        inputField.style.height = '';
        inputField.style.height = Math.min(inputField.scrollHeight, 120) + 'px';
      });
    }

    /* -------------------------------------------------------------- */
    /*  Typing indicator                                               */
    /* -------------------------------------------------------------- */

    function showTyping() {
      if (typingEl) {
        typingEl.classList.add('is-visible');
        scrollToBottom();
      }
    }

    function hideTyping() {
      if (typingEl) {
        typingEl.classList.remove('is-visible');
      }
    }

    /* -------------------------------------------------------------- */
    /*  Auto-scroll on new messages (MutationObserver)                  */
    /* -------------------------------------------------------------- */

    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function () {
        /* Scroll only if user is near the bottom already */
        var threshold = 80;
        var atBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < threshold;
        if (atBottom) scrollToBottom();
      });

      observer.observe(messagesEl, { childList: true, subtree: true });
    }

    /* -------------------------------------------------------------- */
    /*  Helpers                                                        */
    /* -------------------------------------------------------------- */

    function escapeHtml(str) {
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    function formatTime() {
      var now = new Date();
      var h = now.getHours();
      var m = now.getMinutes();
      var ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      m = m < 10 ? '0' + m : m;
      return h + ':' + m + ' ' + ampm;
    }

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    DK.chat = DK.chat || {};
    DK.chat.scrollToBottom = scrollToBottom;
    DK.chat.showTyping = showTyping;
    DK.chat.hideTyping = hideTyping;
  });

})(window.DK);
