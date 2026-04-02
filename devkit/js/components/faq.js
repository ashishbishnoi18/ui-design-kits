/**
 * DK FAQ Component
 * Accordion-based FAQ with smooth expand/collapse animation.
 * Uses a plus/x icon rotation pattern for the toggle indicator.
 * Schema-friendly: works with itemscope/itemprop markup.
 *
 * Usage:
 *   <div class="dk-faq" data-dk-faq>
 *     <div class="dk-faq_item" itemscope itemprop="mainEntity"
 *          itemtype="https://schema.org/Question">
 *       <button class="dk-faq_question" itemprop="name">
 *         Question text?
 *         <svg class="dk-faq_icon">...</svg>
 *       </button>
 *       <div class="dk-faq_answer" itemscope itemprop="acceptedAnswer"
 *            itemtype="https://schema.org/Answer">
 *         <div class="dk-faq_answer-body" itemprop="text">
 *           Answer text here.
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-dk-faq           — multi-open (default)
 *   data-dk-faq="single"  — only one open at a time
 *
 * Events:
 *   dk:faq-toggle — detail: { item, open }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('faq', function (el) {
    var mode     = el.getAttribute('data-dk-faq');
    var isSingle = mode === 'single';
    var items    = DK.$$('.dk-faq_item', el);

    if (!items.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      var question = DK.$('.dk-faq_question', item);
      var answer   = DK.$('.dk-faq_answer', item);
      if (!question || !answer) return;

      var answerId   = answer.id || DK.uid('dk-faq-a');
      var questionId = question.id || DK.uid('dk-faq-q');

      answer.id = answerId;
      question.id = questionId;

      question.setAttribute('aria-controls', answerId);
      answer.setAttribute('role', 'region');
      answer.setAttribute('aria-labelledby', questionId);

      var isOpen = item.classList.contains('is-open');
      question.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

      if (isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });

    /* -------------------------------------------------------------- */
    /*  Toggle logic                                                   */
    /* -------------------------------------------------------------- */

    function closeItem(item) {
      var question = DK.$('.dk-faq_question', item);
      var answer   = DK.$('.dk-faq_answer', item);
      if (!question || !answer) return;

      item.classList.remove('is-open');
      question.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = '0';
    }

    function openItem(item) {
      var question = DK.$('.dk-faq_question', item);
      var answer   = DK.$('.dk-faq_answer', item);
      if (!question || !answer) return;

      item.classList.add('is-open');
      question.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }

    function toggleItem(item) {
      var isOpen = item.classList.contains('is-open');

      if (isSingle && !isOpen) {
        items.forEach(function (other) {
          if (other !== item && other.classList.contains('is-open')) {
            closeItem(other);
          }
        });
      }

      if (isOpen) {
        closeItem(item);
      } else {
        openItem(item);
      }

      DK.emit(el, 'dk:faq-toggle', {
        item: item,
        open: !isOpen,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Event delegation                                               */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var question = e.target.closest('.dk-faq_question');
      if (!question) return;

      var item = question.closest('.dk-faq_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard: Enter / Space                                        */
    /* -------------------------------------------------------------- */

    DK.on(el, 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      var question = e.target.closest('.dk-faq_question');
      if (!question) return;

      var item = question.closest('.dk-faq_item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });
  });

})(window.DK);
