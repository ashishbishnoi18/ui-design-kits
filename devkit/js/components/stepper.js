/**
 * DK Stepper Component
 * Manages multi-step indicator state. Exposes API for next/prev/goTo.
 * Updates is-active and is-complete classes on steps.
 *
 * Usage:
 *   <div data-dk-stepper class="dk-stepper">
 *     <div class="dk-stepper_step is-complete">
 *       <div class="dk-stepper_indicator"><span class="dk-stepper_indicator-text">1</span></div>
 *       <span class="dk-stepper_label">Account</span>
 *     </div>
 *     <div class="dk-stepper_connector"></div>
 *     <div class="dk-stepper_step is-active">
 *       <div class="dk-stepper_indicator"><span class="dk-stepper_indicator-text">2</span></div>
 *       <span class="dk-stepper_label">Profile</span>
 *     </div>
 *     <div class="dk-stepper_connector"></div>
 *     <div class="dk-stepper_step">
 *       <div class="dk-stepper_indicator"><span class="dk-stepper_indicator-text">3</span></div>
 *       <span class="dk-stepper_label">Review</span>
 *     </div>
 *   </div>
 *
 * JS API:
 *   DK.stepper.next()   — advance to next step
 *   DK.stepper.prev()   — go back one step
 *   DK.stepper.goTo(n)  — jump to step n (0-indexed)
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('stepper', function (el) {

    var steps = DK.$$('.dk-stepper_step', el);
    if (!steps.length) return;

    /* -------------------------------------------------------------- */
    /*  Determine current step from markup                             */
    /* -------------------------------------------------------------- */

    var currentIndex = 0;

    steps.forEach(function (step, i) {
      if (step.classList.contains('is-active')) {
        currentIndex = i;
      }
    });

    /* -------------------------------------------------------------- */
    /*  Update step states                                             */
    /* -------------------------------------------------------------- */

    function updateSteps() {
      steps.forEach(function (step, i) {
        step.classList.remove('is-active', 'is-complete');

        if (i < currentIndex) {
          step.classList.add('is-complete');
        } else if (i === currentIndex) {
          step.classList.add('is-active');
        }
      });

      // Update connector states: connectors follow the step that precedes them
      var connectors = DK.$$('.dk-stepper_connector', el);
      connectors.forEach(function (conn, i) {
        if (i < currentIndex) {
          conn.style.background = 'var(--accent)';
        } else {
          conn.style.background = '';
        }
      });

      DK.emit(el, 'dk:stepper-change', {
        step: currentIndex,
        total: steps.length,
      });
    }

    /* -------------------------------------------------------------- */
    /*  Navigation methods                                             */
    /* -------------------------------------------------------------- */

    function next() {
      if (currentIndex < steps.length - 1) {
        currentIndex++;
        updateSteps();
      }
    }

    function prev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateSteps();
      }
    }

    function goTo(n) {
      if (typeof n !== 'number') return;
      var index = Math.max(0, Math.min(n, steps.length - 1));
      currentIndex = index;
      updateSteps();
    }

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    DK.stepper = DK.stepper || {};
    DK.stepper.next = next;
    DK.stepper.prev = prev;
    DK.stepper.goTo = goTo;

    DK.stepper.getCurrent = function () {
      return currentIndex;
    };

    DK.stepper.getTotal = function () {
      return steps.length;
    };

    // Initialize from markup state
    updateSteps();
  });

})(window.DK);
