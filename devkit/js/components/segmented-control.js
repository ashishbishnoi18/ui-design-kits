/**
 * DK Segmented Control Component
 * Button group selector with sliding indicator animation.
 *
 * Usage:
 *   <div class="dk-segmented" data-dk-segmented role="radiogroup" aria-label="View mode">
 *     <div class="dk-segmented_indicator"></div>
 *     <button class="dk-segmented_item is-active" data-value="day" role="radio" aria-checked="true">Day</button>
 *     <button class="dk-segmented_item" data-value="week" role="radio" aria-checked="false">Week</button>
 *     <button class="dk-segmented_item" data-value="month" role="radio" aria-checked="false">Month</button>
 *   </div>
 *
 * Events:
 *   dk:segmented-change — detail: { value: string, index: number }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('segmented', function (el) {
    var indicator = el.querySelector('.dk-segmented_indicator');
    var items     = DK.$$('.dk-segmented_item', el);

    if (!items.length) return;

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    if (!el.getAttribute('role')) {
      el.setAttribute('role', 'radiogroup');
    }

    items.forEach(function (item) {
      item.setAttribute('role', 'radio');
      item.setAttribute('aria-checked',
        item.classList.contains('is-active') ? 'true' : 'false'
      );
    });

    /* ---------------------------------------------------------------- */
    /*  Indicator positioning                                            */
    /* ---------------------------------------------------------------- */

    function moveIndicator(target, animate) {
      if (!indicator) return;

      var elRect     = el.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();

      var offsetLeft = targetRect.left - elRect.left;
      var width      = targetRect.width;

      if (!animate) {
        indicator.style.transition = 'none';
      }

      indicator.style.width     = width + 'px';
      indicator.style.transform = 'translateX(' + (offsetLeft - 3) + 'px)';

      if (!animate) {
        /* Force reflow then re-enable transition */
        indicator.offsetHeight; /* eslint-disable-line no-unused-expressions */
        indicator.style.transition = '';
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Selection                                                        */
    /* ---------------------------------------------------------------- */

    function activate(item, animate) {
      /* Deactivate all */
      items.forEach(function (i) {
        i.classList.remove('is-active');
        i.setAttribute('aria-checked', 'false');
        i.setAttribute('tabindex', '-1');
      });

      /* Activate selected */
      item.classList.add('is-active');
      item.setAttribute('aria-checked', 'true');
      item.setAttribute('tabindex', '0');

      moveIndicator(item, animate !== false);

      var idx   = items.indexOf(item);
      var value = item.getAttribute('data-value') || '';

      DK.emit(el, 'dk:segmented-change', { value: value, index: idx });
    }

    /* ---------------------------------------------------------------- */
    /*  Click handlers                                                   */
    /* ---------------------------------------------------------------- */

    items.forEach(function (item) {
      DK.on(item, 'click', function (e) {
        e.preventDefault();
        activate(item, true);
        item.focus();
      });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    DK.on(el, 'keydown', function (e) {
      var idx = items.indexOf(document.activeElement);
      if (idx === -1) return;

      var nextIdx = -1;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIdx = idx < items.length - 1 ? idx + 1 : 0;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIdx = idx > 0 ? idx - 1 : items.length - 1;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIdx = items.length - 1;
      }

      if (nextIdx >= 0) {
        activate(items[nextIdx], true);
        items[nextIdx].focus();
      }
    });

    /* ---------------------------------------------------------------- */
    /*  Initialize: position indicator on the active item (no animation) */
    /* ---------------------------------------------------------------- */

    var active = el.querySelector('.dk-segmented_item.is-active');
    if (active) {
      activate(active, false);
    } else if (items[0]) {
      activate(items[0], false);
    }

    /* Re-position on window resize */
    var resizeTimer;
    DK.on(window, 'resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var current = el.querySelector('.dk-segmented_item.is-active');
        if (current) moveIndicator(current, false);
      }, 100);
    });
  });

})(window.DK);
