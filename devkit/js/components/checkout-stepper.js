/**
 * DK Checkout Stepper Component
 * Multi-step checkout flow with Shipping, Payment, Review panels.
 * Uses the stepper pattern for step indicators.
 *
 * Usage:
 *   <div class="dk-checkout" data-dk-checkout>
 *     <div class="dk-checkout_steps">
 *       <div class="dk-checkout_step is-active">
 *         <div class="dk-checkout_step-number"><span class="dk-checkout_step-text">1</span></div>
 *         <span class="dk-checkout_step-label">Shipping</span>
 *       </div>
 *       <div class="dk-checkout_connector"></div>
 *       <div class="dk-checkout_step">
 *         <div class="dk-checkout_step-number"><span class="dk-checkout_step-text">2</span></div>
 *         <span class="dk-checkout_step-label">Payment</span>
 *       </div>
 *       <div class="dk-checkout_connector"></div>
 *       <div class="dk-checkout_step">
 *         <div class="dk-checkout_step-number"><span class="dk-checkout_step-text">3</span></div>
 *         <span class="dk-checkout_step-label">Review</span>
 *       </div>
 *     </div>
 *     <div class="dk-checkout_panel is-active" data-step="0">...</div>
 *     <div class="dk-checkout_panel" data-step="1">...</div>
 *     <div class="dk-checkout_panel" data-step="2">...</div>
 *     <div class="dk-checkout_nav">
 *       <button class="dk-checkout_btn dk-checkout_btn--back">Back</button>
 *       <button class="dk-checkout_btn dk-checkout_btn--next">Next</button>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:checkout-step — detail: { step, total }
 *   dk:checkout-complete
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('checkout', function (el) {

    var steps      = DK.$$('.dk-checkout_step', el);
    var connectors = DK.$$('.dk-checkout_connector', el);
    var panels     = DK.$$('.dk-checkout_panel', el);
    var backBtn    = DK.$('.dk-checkout_btn--back', el);
    var nextBtn    = DK.$('.dk-checkout_btn--next', el);

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
      var activePanel = DK.$('[data-step="' + currentStep + '"]', el);
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

      DK.emit(el, 'dk:checkout-step', {
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
        DK.emit(el, 'dk:checkout-complete');
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
    if (nextBtn) DK.on(nextBtn, 'click', next);
    if (backBtn) DK.on(backBtn, 'click', prev);

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    DK.checkout = DK.checkout || {};
    DK.checkout.next = next;
    DK.checkout.prev = prev;
    DK.checkout.goTo = goTo;
    DK.checkout.getCurrent = function () { return currentStep; };

    /* Initialize */
    update();
  });

})(window.DK);
