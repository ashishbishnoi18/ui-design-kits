/**
 * DK Toggle Group Component
 * Button group with single or multi-select toggle behavior.
 *
 * Usage:
 *   <div class="dk-toggle-group" data-dk-toggle-group="single" role="group" aria-label="View">
 *     <button class="dk-toggle-group_btn is-active" data-value="grid">Grid</button>
 *     <button class="dk-toggle-group_btn" data-value="list">List</button>
 *     <button class="dk-toggle-group_btn" data-value="table">Table</button>
 *   </div>
 *
 * Data attributes:
 *   data-dk-toggle-group="single" — single select (default)
 *   data-dk-toggle-group="multi"  — multi select
 *
 * Events:
 *   dk:toggle-group-change — detail: { value: string|string[], active: HTMLElement[] }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('toggle-group', function (el) {
    var mode    = el.getAttribute('data-dk-toggle-group') || 'single';
    var buttons = DK.$$('.dk-toggle-group_btn', el);

    if (!buttons.length) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    if (!el.getAttribute('role')) {
      el.setAttribute('role', 'group');
    }

    buttons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.classList.contains('is-active') ? 'true' : 'false');
    });

    /* ---------------------------------------------------------------- */
    /*  Get current value(s)                                             */
    /* ---------------------------------------------------------------- */

    function getActive() {
      return buttons.filter(function (btn) {
        return btn.classList.contains('is-active');
      });
    }

    function getValue() {
      var active = getActive();
      if (mode === 'single') {
        return active.length ? (active[0].getAttribute('data-value') || '') : '';
      }
      return active.map(function (btn) {
        return btn.getAttribute('data-value') || '';
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle logic                                                     */
    /* ---------------------------------------------------------------- */

    function activate(btn) {
      if (mode === 'single') {
        /* Deactivate all others */
        buttons.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
      } else {
        /* Multi: toggle this button */
        if (btn.classList.contains('is-active')) {
          btn.classList.remove('is-active');
          btn.setAttribute('aria-pressed', 'false');
        } else {
          btn.classList.add('is-active');
          btn.setAttribute('aria-pressed', 'true');
        }
      }

      DK.emit(el, 'dk:toggle-group-change', {
        value: getValue(),
        active: getActive()
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Click handlers                                                   */
    /* ---------------------------------------------------------------- */

    buttons.forEach(function (btn) {
      DK.on(btn, 'click', function (e) {
        e.preventDefault();
        activate(btn);
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard: ArrowLeft / ArrowRight for navigation                  */
    /* ---------------------------------------------------------------- */

    DK.on(el, 'keydown', function (e) {
      var idx = buttons.indexOf(document.activeElement);
      if (idx === -1) return;

      var nextIdx = -1;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIdx = idx < buttons.length - 1 ? idx + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIdx = idx > 0 ? idx - 1 : buttons.length - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIdx = buttons.length - 1;
      }

      if (nextIdx >= 0) {
        buttons[nextIdx].focus();
        if (mode === 'single') {
          activate(buttons[nextIdx]);
        }
      }
    });
  });

})(window.DK);
