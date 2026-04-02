/**
 * DK Radio Card Component
 * Card-styled radio buttons with single-select group behavior.
 *
 * Usage:
 *   <div class="dk-radio-card-group" data-dk-radio-card role="radiogroup" aria-label="Plans">
 *     <label class="dk-radio-card">
 *       <input class="dk-radio-card_input" type="radio" name="plan" value="free">
 *       <span class="dk-radio-card_indicator"><span class="dk-radio-card_indicator-dot"></span></span>
 *       <span class="dk-radio-card_title">Free</span>
 *       <span class="dk-radio-card_description">For personal projects</span>
 *     </label>
 *     <label class="dk-radio-card">
 *       <input class="dk-radio-card_input" type="radio" name="plan" value="pro">
 *       <span class="dk-radio-card_indicator"><span class="dk-radio-card_indicator-dot"></span></span>
 *       <span class="dk-radio-card_title">Pro</span>
 *       <span class="dk-radio-card_description">For teams</span>
 *     </label>
 *   </div>
 *
 * Note: data-dk-radio-card goes on the GROUP container, not individual cards.
 *
 * Events:
 *   dk:radio-card-change — detail: { value: string }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('radio-card', function (group) {
    var cards = DK.$$('.dk-radio-card', group);
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
        var input = card.querySelector('.dk-radio-card_input');
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
      var input = card.querySelector('.dk-radio-card_input');
      if (!input) return;

      DK.on(input, 'change', function () {
        syncAll();
        DK.emit(group, 'dk:radio-card-change', { value: input.value || '' });
      });

      /* Click forwarding if wrapper is not a <label> */
      if (card.tagName.toLowerCase() !== 'label') {
        DK.on(card, 'click', function (e) {
          if (e.target === input) return;
          input.checked = true;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowDown/Right = next, ArrowUp/Left = previous        */
    /* ---------------------------------------------------------------- */

    DK.on(group, 'keydown', function (e) {
      var inputs = cards.map(function (c) {
        return c.querySelector('.dk-radio-card_input');
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

})(window.DK);
