/**
 * DK Editable Text Component
 * Inline text that becomes an input on click or Enter.
 *
 * Usage:
 *   <div data-dk-editable class="dk-editable">
 *     <button type="button" class="dk-editable_display">
 *       <span class="dk-editable_text">Click to edit</span>
 *       <svg class="dk-editable_display-icon" viewBox="0 0 12 12" fill="none"
 *            stroke="currentColor" stroke-width="1.5">
 *         <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/>
 *       </svg>
 *     </button>
 *     <div class="dk-editable_edit">
 *       <input class="dk-editable_input" type="text">
 *       <div class="dk-editable_actions">
 *         <button type="button" class="dk-editable_action dk-editable_action--confirm" aria-label="Confirm">
 *           <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 6l3 3 5-5"/></svg>
 *         </button>
 *         <button type="button" class="dk-editable_action dk-editable_action--cancel" aria-label="Cancel">
 *           <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3l6 6M9 3l-6 6"/></svg>
 *         </button>
 *       </div>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-dk-editable  — init marker, optional type: "text" (default) or "number"
 *   data-dk-value     — initial value
 *   data-dk-placeholder — placeholder for empty state
 *
 * Events:
 *   dk:editable-save   — detail: { value: string, previousValue: string }
 *   dk:editable-cancel — detail: { value: string }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('editable', function (el) {

    var display = DK.$('.dk-editable_display', el);
    var textEl = DK.$('.dk-editable_text', el);
    var editWrap = DK.$('.dk-editable_edit', el);
    var inputEl = DK.$('.dk-editable_input', el);
    var confirmBtn = DK.$('.dk-editable_action--confirm', el);
    var cancelBtn = DK.$('.dk-editable_action--cancel', el);

    if (!display || !inputEl) return;

    var type = el.getAttribute('data-dk-editable') || 'text';
    var placeholder = el.getAttribute('data-dk-placeholder') || 'Click to edit';
    var currentValue = el.getAttribute('data-dk-value') || (textEl ? textEl.textContent.trim() : '');
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
      el.setAttribute('data-dk-value', currentValue);
      el.classList.remove('is-editing');
      renderDisplay();
      display.focus();
      DK.emit(el, 'dk:editable-save', {
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
      DK.emit(el, 'dk:editable-cancel', { value: currentValue });
    }

    /* ---------------------------------------------------------------- */
    /*  Event bindings                                                   */
    /* ---------------------------------------------------------------- */

    DK.on(display, 'click', function (e) {
      e.preventDefault();
      startEditing();
    });

    DK.on(display, 'keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startEditing();
      }
    });

    DK.on(inputEl, 'keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    });

    // Blur = confirm (common UX expectation)
    DK.on(inputEl, 'blur', function (e) {
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
      DK.on(confirmBtn, 'click', function (e) {
        e.preventDefault();
        confirm();
      });
    }

    if (cancelBtn) {
      DK.on(cancelBtn, 'click', function (e) {
        e.preventDefault();
        cancel();
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    renderDisplay();
  });

})(window.DK);
