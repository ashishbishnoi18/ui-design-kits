/**
 * NB Checkout Stepper Component
 * Multi-step checkout flow with Shipping, Payment, Review panels.
 * Uses the stepper pattern for step indicators.
 *
 * Usage:
 *   <div class="nb-checkout" data-nb-checkout>
 *     <div class="nb-checkout_steps">
 *       <div class="nb-checkout_step is-active">
 *         <div class="nb-checkout_step-number"><span class="nb-checkout_step-text">1</span></div>
 *         <span class="nb-checkout_step-label">Shipping</span>
 *       </div>
 *       <div class="nb-checkout_connector"></div>
 *       <div class="nb-checkout_step">
 *         <div class="nb-checkout_step-number"><span class="nb-checkout_step-text">2</span></div>
 *         <span class="nb-checkout_step-label">Payment</span>
 *       </div>
 *       <div class="nb-checkout_connector"></div>
 *       <div class="nb-checkout_step">
 *         <div class="nb-checkout_step-number"><span class="nb-checkout_step-text">3</span></div>
 *         <span class="nb-checkout_step-label">Review</span>
 *       </div>
 *     </div>
 *     <div class="nb-checkout_panel is-active" data-step="0">...</div>
 *     <div class="nb-checkout_panel" data-step="1">...</div>
 *     <div class="nb-checkout_panel" data-step="2">...</div>
 *     <div class="nb-checkout_nav">
 *       <button class="nb-checkout_btn nb-checkout_btn--back">Back</button>
 *       <button class="nb-checkout_btn nb-checkout_btn--next">Next</button>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:checkout-step — detail: { step, total }
 *   nb:checkout-complete
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('checkout', function (el) {

    var steps      = NB.$$('.nb-checkout__step', el);
    var connectors = NB.$$('.nb-checkout__connector', el);
    var panels     = NB.$$('.nb-checkout__panel', el);
    var backBtn    = NB.$('.nb-checkout__btn--back', el);
    var nextBtn    = NB.$('.nb-checkout__btn--next', el);

    if (!steps.length || !panels.length) return;

    var currentStep = 0;
    var totalSteps  = steps.length;

    /* -------------------------------------------------------------- */
    /*  Determine initial step from markup                             */
    /* -------------------------------------------------------------- */

    steps.forEach(function (step, i) {
      if (step.classList.contains('is-active')) {
        currentStep = i;
      }
    });

    /* -------------------------------------------------------------- */
    /*  Update UI                                                      */
    /* -------------------------------------------------------------- */

    function update() {
      /* Update step indicators */
      steps.forEach(function (step, i) {
        step.classList.remove('is-active', 'is-complete');
        if (i < currentStep) {
          step.classList.add('is-complete');
        } else if (i === currentStep) {
          step.classList.add('is-active');
        }
      });

      /* Update connectors */
      connectors.forEach(function (conn, i) {
        conn.style.background = i < currentStep ? 'var(--accent)' : '';
      });

      /* Show active panel */
      panels.forEach(function (panel) {
        panel.classList.remove('is-active');
      });
      var activePanel = NB.$('[data-step="' + currentStep + '"]', el);
      if (activePanel) activePanel.classList.add('is-active');

      /* Update button states */
      if (backBtn) {
        backBtn.disabled = currentStep === 0;
      }

      if (nextBtn) {
        if (currentStep === totalSteps - 1) {
          nextBtn.textContent = 'Place Order';
        } else {
          nextBtn.textContent = 'Next';
        }
      }

      NB.emit(el, 'nb:checkout-step', {
        step: currentStep,
        total: totalSteps,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Navigation                                                     */
    /* -------------------------------------------------------------- */

    function next() {
      if (currentStep < totalSteps - 1) {
        currentStep++;
        update();
      } else {
        /* Final step — complete */
        NB.emit(el, 'nb:checkout-complete');
      }
    }

    function prev() {
      if (currentStep > 0) {
        currentStep--;
        update();
      }
    }

    function goTo(n) {
      if (typeof n !== 'number') return;
      currentStep = Math.max(0, Math.min(n, totalSteps - 1));
      update();
    }

    /* Button clicks */
    if (nextBtn) NB.on(nextBtn, 'click', next);
    if (backBtn) NB.on(backBtn, 'click', prev);

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    NB.checkout = NB.checkout || {};
    NB.checkout.next = next;
    NB.checkout.prev = prev;
    NB.checkout.goTo = goTo;
    NB.checkout.getCurrent = function () { return currentStep; };

    /* Initialize */
    update();
  });

})(window.NB);
