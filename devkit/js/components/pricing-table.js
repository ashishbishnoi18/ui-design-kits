/**
 * DK Pricing Table Component
 * Toggles between monthly and annual pricing.
 * Switches visibility of elements with data-dk-price-monthly / data-dk-price-annual.
 *
 * Usage:
 *   <div class="dk-pricing-table" data-dk-pricing-table>
 *     <div class="dk-pricing-table_toggle">
 *       <span class="dk-pricing-table_toggle-label is-active" data-dk-toggle-monthly>Monthly</span>
 *       <button class="dk-pricing-table_toggle-switch" aria-label="Toggle annual pricing"></button>
 *       <span class="dk-pricing-table_toggle-label" data-dk-toggle-annual>Annual</span>
 *       <span class="dk-pricing-table_save">Save 20%</span>
 *     </div>
 *     ...
 *     <span data-dk-price-monthly>$19</span>
 *     <span data-dk-price-annual>$15</span>
 *   </div>
 *
 * Events:
 *   dk:pricing-change — detail: { billing: 'monthly' | 'annual' }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('pricing-table', function (el) {
    var toggle       = DK.$('.dk-pricing-table_toggle-switch', el);
    var labelMonthly = DK.$('[data-dk-toggle-monthly]', el);
    var labelAnnual  = DK.$('[data-dk-toggle-annual]', el);

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
      DK.emit(el, 'dk:pricing-change', {
        billing: isAnnual ? 'annual' : 'monthly',
      });
    }

    /* ----- Setup ARIA ----- */
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-checked', 'false');

    /* ----- Click toggle switch ----- */
    DK.on(toggle, 'click', function () {
      isAnnual = !isAnnual;
      update();
    });

    /* ----- Click labels ----- */
    if (labelMonthly) {
      DK.on(labelMonthly, 'click', function () {
        isAnnual = false;
        update();
      });
    }
    if (labelAnnual) {
      DK.on(labelAnnual, 'click', function () {
        isAnnual = true;
        update();
      });
    }

    /* ----- Keyboard ----- */
    DK.on(toggle, 'keydown', function (e) {
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

})(window.DK);
