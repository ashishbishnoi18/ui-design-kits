/**
 * NB Pricing Table Component
 * Toggles between monthly and annual pricing.
 * Switches visibility of elements with data-nb-price-monthly / data-nb-price-annual.
 *
 * Usage:
 *   <div class="nb-pricing-table" data-nb-pricing-table>
 *     <div class="nb-pricing-table_toggle">
 *       <span class="nb-pricing-table_toggle-label is-active" data-nb-toggle-monthly>Monthly</span>
 *       <button class="nb-pricing-table_toggle-switch" aria-label="Toggle annual pricing"></button>
 *       <span class="nb-pricing-table_toggle-label" data-nb-toggle-annual>Annual</span>
 *       <span class="nb-pricing-table_save">Save 20%</span>
 *     </div>
 *     ...
 *     <span data-nb-price-monthly>$19</span>
 *     <span data-nb-price-annual>$15</span>
 *   </div>
 *
 * Events:
 *   nb:pricing-change — detail: { billing: 'monthly' | 'annual' }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('pricing-table', function (el) {
    var toggle       = NB.$('.nb-pricing-table_toggle-switch', el);
    var labelMonthly = NB.$('[data-nb-toggle-monthly]', el);
    var labelAnnual  = NB.$('[data-nb-toggle-annual]', el);

    if (!toggle) return;

    var isAnnual = false;

    function update() {
      if (isAnnual) {
        el.classList.add('is-annual');
        toggle.classList.add('is-annual');
        if (labelMonthly) labelMonthly.classList.remove('is-active');
        if (labelAnnual) labelAnnual.classList.add('is-active');
      } else {
        el.classList.remove('is-annual');
        toggle.classList.remove('is-annual');
        if (labelMonthly) labelMonthly.classList.add('is-active');
        if (labelAnnual) labelAnnual.classList.remove('is-active');
      }

      toggle.setAttribute('aria-checked', String(isAnnual));
      NB.emit(el, 'nb:pricing-change', {
        billing: isAnnual ? 'annual' : 'monthly',
      });
    }

    /* ----- Setup ARIA ----- */
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', 'false');

    /* ----- Click toggle switch ----- */
    NB.on(toggle, 'click', function () {
      isAnnual = !isAnnual;
      update();
    });

    /* ----- Click labels ----- */
    if (labelMonthly) {
      NB.on(labelMonthly, 'click', function () {
        isAnnual = false;
        update();
      });
    }
    if (labelAnnual) {
      NB.on(labelAnnual, 'click', function () {
        isAnnual = true;
        update();
      });
    }

    /* ----- Keyboard ----- */
    NB.on(toggle, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isAnnual = !isAnnual;
        update();
      }
    });

    /* Ensure toggle is focusable */
    if (!toggle.getAttribute('tabindex')) {
      toggle.setAttribute('tabindex', '0');
    }
  });

})(window.NB);
