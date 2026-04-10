/**
 * NB Chat Interface Component
 * Full chat UI with message input, auto-scroll, and typing indicator.
 *
 * Usage:
 *   <div class="nb-chat" data-nb-chat>
 *     <div class="nb-chat_header">...</div>
 *     <div class="nb-chat_messages">
 *       <!-- .nb-chat-message elements -->
 *       <div class="nb-chat_typing">
 *         <div class="nb-chat_typing-dots"><span></span><span></span><span></span></div>
 *         <span>typing...</span>
 *       </div>
 *     </div>
 *     <div class="nb-chat_input">
 *       <textarea class="nb-chat_input-field" placeholder="Type a message..."></textarea>
 *       <button class="nb-chat_send-btn">
 *         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
 *           <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>
 *         </svg>
 *       </button>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:chat-send — detail: { text }
 *
 * API:
 *   NB.chat.scrollToBottom()
 *   NB.chat.showTyping()
 *   NB.chat.hideTyping()
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('chat', function (el) {

    var messagesEl = NB.$('.nb-chat__messages', el);
    var inputField = NB.$('.nb-chat__input-field', el);
    var sendBtn    = NB.$('.nb-chat__send-btn', el);
    var typingEl   = NB.$('.nb-chat__typing', el);

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

      NB.emit(el, 'nb:chat-send', { text: text });

      /* Create and append sent message bubble */
      var msgDiv = document.createElement('div');
      msgDiv.className = 'nb-chat-message nb-chat-message-sent';
      msgDiv.innerHTML =
        '<div>' +
          '<div class="nb-chat-message_bubble">' + escapeHtml(text) + '</div>' +
          '<div class="nb-chat-message_time">' + formatTime() + '</div>' +
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
      NB.on(sendBtn, 'click', sendMessage);
    }

    /* -------------------------------------------------------------- */
    /*  Enter key sends (Shift+Enter for newline)                      */
    /* -------------------------------------------------------------- */

    if (inputField) {
      NB.on(inputField, 'keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      /* Auto-resize textarea */
      NB.on(inputField, 'input', function () {
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

    NB.chat = NB.chat || {};
    NB.chat.scrollToBottom = scrollToBottom;
    NB.chat.showTyping = showTyping;
    NB.chat.hideTyping = hideTyping;
  });

})(window.NB);
