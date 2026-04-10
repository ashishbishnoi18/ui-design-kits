/**
 * NB Stepper Component
 * Manages multi-step indicator state. Exposes API for next/prev/goTo.
 * Updates is-active and is-complete classes on steps.
 *
 * Usage:
 *   <div data-nb-stepper class="nb-stepper">
 *     <div class="nb-stepper_step is-complete">
 *       <div class="nb-stepper_indicator"><span class="nb-stepper_indicator-text">1</span></div>
 *       <span class="nb-stepper_label">Account</span>
 *     </div>
 *     <div class="nb-stepper_connector"></div>
 *     <div class="nb-stepper_step is-active">
 *       <div class="nb-stepper_indicator"><span class="nb-stepper_indicator-text">2</span></div>
 *       <span class="nb-stepper_label">Profile</span>
 *     </div>
 *     <div class="nb-stepper_connector"></div>
 *     <div class="nb-stepper_step">
 *       <div class="nb-stepper_indicator"><span class="nb-stepper_indicator-text">3</span></div>
 *       <span class="nb-stepper_label">Review</span>
 *     </div>
 *   </div>
 *
 * JS API:
 *   NB.stepper.next()   — advance to next step
 *   NB.stepper.prev()   — go back one step
 *   NB.stepper.goTo(n)  — jump to step n (0-indexed)
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('stepper', function (el) {

    var steps = NB.$$('.nb-stepper__step', el);
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
      var connectors = NB.$$('.nb-stepper__connector', el);
      connectors.forEach(function (conn, i) {
        if (i < currentIndex) {
          conn.style.background = 'var(--accent)';
        } else {
          conn.style.background = '';
        }
      });

      NB.emit(el, 'nb:stepper-change', {
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

    NB.stepper = NB.stepper || {};
    NB.stepper.next = next;
    NB.stepper.prev = prev;
    NB.stepper.goTo = goTo;

    NB.stepper.getCurrent = function () {
      return currentIndex;
    };

    NB.stepper.getTotal = function () {
      return steps.length;
    };

    // Initialize from markup state
    updateSteps();
  });

})(window.NB);
