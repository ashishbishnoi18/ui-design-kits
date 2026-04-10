/**
 * NB Radio Card Component
 * Card-styled radio buttons with single-select group behavior.
 *
 * Usage:
 *   <div class="nb-radio-card-group" data-nb-radio-card role="radiogroup" aria-label="Plans">
 *     <label class="nb-radio-card">
 *       <input class="nb-radio-card_input" type="radio" name="plan" value="free">
 *       <span class="nb-radio-card_indicator"><span class="nb-radio-card_indicator-dot"></span></span>
 *       <span class="nb-radio-card_title">Free</span>
 *       <span class="nb-radio-card_description">For personal projects</span>
 *     </label>
 *     <label class="nb-radio-card">
 *       <input class="nb-radio-card_input" type="radio" name="plan" value="pro">
 *       <span class="nb-radio-card_indicator"><span class="nb-radio-card_indicator-dot"></span></span>
 *       <span class="nb-radio-card_title">Pro</span>
 *       <span class="nb-radio-card_description">For teams</span>
 *     </label>
 *   </div>
 *
 * Note: data-nb-radio-card goes on the GROUP container, not individual cards.
 *
 * Events:
 *   nb:radio-card-change — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('radio-card', function (group) {
    var cards = NB.$$('.nb-radio-card', group);
    if (!cards.length) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    if (!group.getAttribute('role')) {
      group.setAttribute('role', 'radiogroup');
    }

    /* ---------------------------------------------------------------- */
    /*  Sync visual state across all cards                               */
    /* ---------------------------------------------------------------- */

    function syncAll() {
      cards.forEach(function (card) {
        var input = card.querySelector('.nb-radio-card_input');
        if (!input) return;

        if (input.checked) {
          card.classList.add('is-active');
        } else {
          card.classList.remove('is-active');
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Change handler on each card                                      */
    /* ---------------------------------------------------------------- */

    cards.forEach(function (card) {
      var input = card.querySelector('.nb-radio-card_input');
      if (!input) return;

      NB.on(input, 'change', function () {
        syncAll();
        NB.emit(group, 'nb:radio-card-change', { value: input.value || '' });
      });

      /* Click forwarding if wrapper is not a <label> */
      if (card.tagName.toLowerCase() !== 'label') {
        NB.on(card, 'click', function (e) {
          if (e.target === input) return;
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowDown/Right = next, ArrowUp/Left = previous        */
    /* ---------------------------------------------------------------- */

    NB.on(group, 'keydown', function (e) {
      var inputs = cards.map(function (c) {
        return c.querySelector('.nb-radio-card_input');
      }).filter(Boolean);

      if (!inputs.length) return;

      var currentIdx = -1;
      for (var i = 0; i < inputs.length; i++) {
        if (document.activeElement === inputs[i] ||
            document.activeElement === cards[i]) {
          currentIdx = i;
          break;
        }
      }

      if (currentIdx === -1) return;

      var nextIdx = -1;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        nextIdx = currentIdx < inputs.length - 1 ? currentIdx + 1 : 0;
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIdx = currentIdx > 0 ? currentIdx - 1 : inputs.length - 1;
      }

      if (nextIdx >= 0) {
        inputs[nextIdx].checked = true;
        inputs[nextIdx].focus();
        inputs[nextIdx].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    /* Initialize */
    syncAll();
  });

})(window.NB);
