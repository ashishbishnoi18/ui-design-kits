/**
 * DK Comment Thread Component
 * Nested discussion with reply forms, like buttons, and collapsible threads.
 *
 * Usage:
 *   <div class="dk-comments" data-dk-comment-thread>
 *     <div class="dk-comment">
 *       <img class="dk-comment_avatar" src="..." alt="" />
 *       <div class="dk-comment_body">
 *         <div class="dk-comment_meta">
 *           <span class="dk-comment_author">Jane</span>
 *           <span class="dk-comment_time">2h ago</span>
 *         </div>
 *         <p class="dk-comment_text">Comment text...</p>
 *         <div class="dk-comment_actions">
 *           <button class="dk-comment_action" data-action="like">Like</button>
 *           <button class="dk-comment_action" data-action="reply">Reply</button>
 *           <button class="dk-comment_collapse-btn" data-action="collapse">Collapse</button>
 *         </div>
 *         <div class="dk-comment_reply-form">
 *           <textarea class="dk-comment_reply-input" placeholder="Reply..."></textarea>
 *           <button class="dk-comment_reply-submit">Reply</button>
 *         </div>
 *         <div class="dk-comment_replies">
 *           <!-- nested .dk-comment elements -->
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:comment-like    — detail: { commentEl }
 *   dk:comment-reply   — detail: { parentComment, text }
 *   dk:comment-collapse — detail: { commentEl, collapsed }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('comment-thread', function (el) {

    /* -------------------------------------------------------------- */
    /*  Delegated click handler                                        */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var action = e.target.closest('[data-action]');
      if (!action) return;

      var type = action.getAttribute('data-action');
      var comment = action.closest('.dk-comment');
      if (!comment) return;

      switch (type) {
        case 'like':
          handleLike(action, comment);
          break;
        case 'reply':
          handleReply(comment);
          break;
        case 'collapse':
          handleCollapse(action, comment);
          break;
      }
    });

    /* -------------------------------------------------------------- */
    /*  Submit reply via delegated click                                */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var submitBtn = e.target.closest('.dk-comment_reply-submit');
      if (!submitBtn) return;

      var form = submitBtn.closest('.dk-comment_reply-form');
      var input = form ? form.querySelector('.dk-comment_reply-input') : null;
      var comment = submitBtn.closest('.dk-comment');

      if (!input || !input.value.trim()) return;

      DK.emit(el, 'dk:comment-reply', {
        parentComment: comment,
        text: input.value.trim(),
      });

      input.value = '';
      form.classList.remove('is-open');
    });

    /* -------------------------------------------------------------- */
    /*  Like                                                           */
    /* -------------------------------------------------------------- */

    function handleLike(btn, comment) {
      btn.classList.toggle('is-liked');

      /* Update count if a span child exists */
      var countEl = btn.querySelector('span');
      if (countEl) {
        var current = parseInt(countEl.textContent, 10) || 0;
        countEl.textContent = btn.classList.contains('is-liked')
          ? current + 1
          : Math.max(0, current - 1);
      }

      DK.emit(el, 'dk:comment-like', { commentEl: comment });
    }

    /* -------------------------------------------------------------- */
    /*  Reply toggle                                                   */
    /* -------------------------------------------------------------- */

    function handleReply(comment) {
      var body = comment.querySelector('.dk-comment_body');
      if (!body) return;

      var form = body.querySelector('.dk-comment_reply-form');
      if (!form) return;

      /* Close any other open forms first */
      DK.$$('.dk-comment_reply-form.is-open', el).forEach(function (f) {
        if (f !== form) f.classList.remove('is-open');
      });

      form.classList.toggle('is-open');

      if (form.classList.contains('is-open')) {
        var input = form.querySelector('.dk-comment_reply-input');
        if (input) input.focus();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Collapse / expand thread                                       */
    /* -------------------------------------------------------------- */

    function handleCollapse(btn, comment) {
      var body = comment.querySelector('.dk-comment_body');
      if (!body) return;

      var replies = body.querySelector('.dk-comment_replies');
      if (!replies) return;

      var collapsed = replies.classList.toggle('is-collapsed');
      btn.textContent = collapsed ? 'Expand' : 'Collapse';

      DK.emit(el, 'dk:comment-collapse', {
        commentEl: comment,
        collapsed: collapsed,
      });
    }
  });

})(window.DK);
