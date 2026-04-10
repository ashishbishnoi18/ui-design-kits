/**
 * NB Editable Text Component
 * Inline text that becomes an input on click or Enter.
 *
 * Usage:
 *   <div data-nb-editable class="nb-editable">
 *     <button type="button" class="nb-editable_display">
 *       <span class="nb-editable_text">Click to edit</span>
 *       <svg class="nb-editable_display-icon" viewBox="0 0 12 12" fill="none"
 *            stroke="currentColor" stroke-width="1.5">
 *         <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/>
 *       </svg>
 *     </button>
 *     <div class="nb-editable_edit">
 *       <input class="nb-editable_input" type="text">
 *       <div class="nb-editable_actions">
 *         <button type="button" class="nb-editable_action nb-editable_action--confirm" aria-label="Confirm">
 *           <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5"/></svg>
 *         </button>
 *         <button type="button" class="nb-editable_action nb-editable_action--cancel" aria-label="Cancel">
 *           <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l6 6M9 3l-6 6"/></svg>
 *         </button>
 *       </div>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-nb-editable  — init marker, optional type: "text" (default) or "number"
 *   data-nb-value     — initial value
 *   data-nb-placeholder — placeholder for empty state
 *
 * Events:
 *   nb:editable-save   — detail: { value: string, previousValue: string }
 *   nb:editable-cancel — detail: { value: string }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('editable', function (el) {

    var display = NB.$('.nb-editable__display', el);
    var textEl = NB.$('.nb-editable__text', el);
    var editWrap = NB.$('.nb-editable__edit', el);
    var inputEl = NB.$('.nb-editable__input', el);
    var confirmBtn = NB.$('.nb-editable__action--confirm', el);
    var cancelBtn = NB.$('.nb-editable__action--cancel', el);

    if (!display || !inputEl) return;

    var type = el.getAttribute('data-nb-editable') || 'text';
    var placeholder = el.getAttribute('data-nb-placeholder') || 'Click to edit';
    var currentValue = el.getAttribute('data-nb-value') || (textEl ? textEl.textContent.trim() : '');
    var previousValue = currentValue;

    // Set input type
    if (type === 'number') {
      inputEl.type = 'number';
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA setup                                                       */
    /* ---------------------------------------------------------------- */

    display.setAttribute('role', 'button');
    display.setAttribute('aria-label', 'Click to edit: ' + (currentValue || placeholder));

    /* ---------------------------------------------------------------- */
    /*  Display rendering                                                */
    /* ---------------------------------------------------------------- */

    function renderDisplay() {
      if (textEl) {
        if (currentValue) {
          textEl.textContent = currentValue;
          display.classList.remove('is-empty');
        } else {
          textEl.textContent = placeholder;
          display.classList.add('is-empty');
        }
      }
      display.setAttribute('aria-label', 'Click to edit: ' + (currentValue || placeholder));
    }

    /* ---------------------------------------------------------------- */
    /*  Start editing                                                     */
    /* ---------------------------------------------------------------- */

    function startEditing() {
      previousValue = currentValue;
      el.classList.add('is-editing');
      inputEl.value = currentValue;
      inputEl.focus();
      inputEl.select();
    }

    /* ---------------------------------------------------------------- */
    /*  Confirm                                                          */
    /* ---------------------------------------------------------------- */

    function confirm() {
      var newVal = inputEl.value;
      if (type === 'number') {
        newVal = inputEl.value;
      }
      currentValue = newVal;
      el.setAttribute('data-nb-value', currentValue);
      el.classList.remove('is-editing');
      renderDisplay();
      display.focus();
      NB.emit(el, 'nb:editable-save', {
        value: currentValue,
        previousValue: previousValue
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Cancel                                                           */
    /* ---------------------------------------------------------------- */

    function cancel() {
      el.classList.remove('is-editing');
      renderDisplay();
      display.focus();
      NB.emit(el, 'nb:editable-cancel', { value: currentValue });
    }

    /* ---------------------------------------------------------------- */
    /*  Event bindings                                                   */
    /* ---------------------------------------------------------------- */

    NB.on(display, 'click', function (e) {
      e.preventDefault();
      startEditing();
    });

    NB.on(display, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startEditing();
      }
    });

    NB.on(inputEl, 'keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    // Blur = confirm (common UX expectation)
    NB.on(inputEl, 'blur', function (e) {
      // Only confirm if we're not clicking the cancel/confirm buttons
      var related = e.relatedTarget;
      if (related && (related === confirmBtn || related === cancelBtn)) return;
      // Small delay to allow button clicks to fire first
      setTimeout(function () {
        if (el.classList.contains('is-editing')) {
          confirm();
        }
      }, 100);
    });

    if (confirmBtn) {
      NB.on(confirmBtn, 'click', function (e) {
        e.preventDefault();
        confirm();
      });
    }

    if (cancelBtn) {
      NB.on(cancelBtn, 'click', function (e) {
        e.preventDefault();
        cancel();
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    renderDisplay();
  });

})(window.NB);
