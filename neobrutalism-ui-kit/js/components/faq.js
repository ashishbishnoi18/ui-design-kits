/**
 * NB FAQ Component
 * Accordion-based FAQ with smooth expand/collapse animation.
 * Uses a plus/x icon rotation pattern for the toggle indicator.
 * Schema-friendly: works with itemscope/itemprop markup.
 *
 * Usage:
 *   <div class="nb-faq" data-nb-faq>
 *     <div class="nb-faq_item" itemscope itemprop="mainEntity"
 *          itemtype="https://schema.org/Question">
 *       <button class="nb-faq_question" itemprop="name">
 *         Question text?
 *         <svg class="nb-faq_icon">...</svg>
 *       </button>
 *       <div class="nb-faq_answer" itemscope itemprop="acceptedAnswer"
 *            itemtype="https://schema.org/Answer">
 *         <div class="nb-faq_answer-body" itemprop="text">
 *           Answer text here.
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-faq           — multi-open (default)
 *   data-nb-faq="single"  — only one open at a time
 *
 * Events:
 *   nb:faq-toggle — detail: { item, open }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('faq', function (el) {
    var mode     = el.getAttribute('data-nb-faq');
    var isSingle = mode === 'single';
    var items    = NB.$$('.nb-faq__item', el);

    if (!items.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    items.forEach(function (item) {
      var question = NB.$('.nb-faq__question', item);
      var answer   = NB.$('.nb-faq__answer', item);
      if (!question || !answer) return;

      var answerId   = answer.id || NB.uid('nb-faq-a');
      var questionId = question.id || NB.uid('nb-faq-q');

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
      var question = NB.$('.nb-faq__question', item);
      var answer   = NB.$('.nb-faq__answer', item);
      if (!question || !answer) return;

      item.classList.remove('is-open');
      question.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = '0';
    }

    function openItem(item) {
      var question = NB.$('.nb-faq__question', item);
      var answer   = NB.$('.nb-faq__answer', item);
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

      NB.emit(el, 'nb:faq-toggle', {
        item: item,
        open: !isOpen,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Event delegation                                               */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var question = e.target.closest('.nb-faq__question');
      if (!question) return;

      var item = question.closest('.nb-faq__item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard: Enter / Space                                        */
    /* -------------------------------------------------------------- */

    NB.on(el, 'keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;

      var question = e.target.closest('.nb-faq__question');
      if (!question) return;

      var item = question.closest('.nb-faq__item');
      if (!item || !el.contains(item)) return;

      e.preventDefault();
      toggleItem(item);
    });
  });

})(window.NB);
