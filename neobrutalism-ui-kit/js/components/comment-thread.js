/**
 * NB Comment Thread Component
 * Nested discussion with reply forms, like buttons, and collapsible threads.
 *
 * Usage:
 *   <div class="nb-comments" data-nb-comment-thread>
 *     <div class="nb-comment">
 *       <img class="nb-comment_avatar" src="..." alt="" />
 *       <div class="nb-comment_body">
 *         <div class="nb-comment_meta">
 *           <span class="nb-comment_author">Jane</span>
 *           <span class="nb-comment_time">2h ago</span>
 *         </div>
 *         <p class="nb-comment_text">Comment text...</p>
 *         <div class="nb-comment_actions">
 *           <button class="nb-comment_action" data-action="like">Like</button>
 *           <button class="nb-comment_action" data-action="reply">Reply</button>
 *           <button class="nb-comment_collapse-btn" data-action="collapse">Collapse</button>
 *         </div>
 *         <div class="nb-comment_reply-form">
 *           <textarea class="nb-comment_reply-input" placeholder="Reply..."></textarea>
 *           <button class="nb-comment_reply-submit">Reply</button>
 *         </div>
 *         <div class="nb-comment_replies">
 *           <!-- nested .nb-comment elements -->
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:comment-like    — detail: { commentEl }
 *   nb:comment-reply   — detail: { parentComment, text }
 *   nb:comment-collapse — detail: { commentEl, collapsed }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('comment-thread', function (el) {

    /* -------------------------------------------------------------- */
    /*  Delegated click handler                                        */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var action = e.target.closest('[data-action]');
      if (!action) return;

      var type = action.getAttribute('data-action');
      var comment = action.closest('.nb-comment');
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

    NB.on(el, 'click', function (e) {
      var submitBtn = e.target.closest('.nb-comment__reply-submit');
      if (!submitBtn) return;

      var form = submitBtn.closest('.nb-comment__reply-form');
      var input = form ? form.querySelector('.nb-comment__reply-input') : null;
      var comment = submitBtn.closest('.nb-comment');

      if (!input || !input.value.trim()) return;

      NB.emit(el, 'nb:comment-reply', {
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

      NB.emit(el, 'nb:comment-like', { commentEl: comment });
    }

    /* -------------------------------------------------------------- */
    /*  Reply toggle                                                   */
    /* -------------------------------------------------------------- */

    function handleReply(comment) {
      var body = comment.querySelector('.nb-comment__body');
      if (!body) return;

      var form = body.querySelector('.nb-comment__reply-form');
      if (!form) return;

      /* Close any other open forms first */
      NB.$$('.nb-comment__reply-form.is-open', el).forEach(function (f) {
        if (f !== form) f.classList.remove('is-open');
      });

      form.classList.toggle('is-open');

      if (form.classList.contains('is-open')) {
        var input = form.querySelector('.nb-comment__reply-input');
        if (input) input.focus();
      }
    }

    /* -------------------------------------------------------------- */
    /*  Collapse / expand thread                                       */
    /* -------------------------------------------------------------- */

    function handleCollapse(btn, comment) {
      var body = comment.querySelector('.nb-comment__body');
      if (!body) return;

      var replies = body.querySelector('.nb-comment__replies');
      if (!replies) return;

      var collapsed = replies.classList.toggle('is-collapsed');
      btn.textContent = collapsed ? 'Expand' : 'Collapse';

      NB.emit(el, 'nb:comment-collapse', {
        commentEl: comment,
        collapsed: collapsed,
      });
    }
  });

})(window.NB);
