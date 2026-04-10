/**
 * NB Rating Component
 * Star rating with click-to-set, hover preview, half-star, and read-only modes.
 *
 * Usage:
 *   <div data-nb-rating class="nb-rating" data-nb-value="3" data-nb-max="5">
 *   </div>
 *
 * Attributes:
 *   data-nb-rating   — "half" for half-star support, "readonly" for read-only
 *   data-nb-value    — initial value (number)
 *   data-nb-max      — max stars (default: 5)
 *
 * Events:
 *   nb:rating-change — detail: { value: number, max: number }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  var STAR_SVG = '<svg viewBox="0 0 20 20"><path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 13.87l-4.94 2.83.94-5.49-4-3.9 5.53-.8L10 1.5z"/></svg>';

  NB.register('rating', function (el) {

    var mode = (el.getAttribute('data-nb-rating') || '').toLowerCase();
    var isHalf = mode === 'half';
    var isReadonly = mode === 'readonly';
    var max = parseInt(el.getAttribute('data-nb-max'), 10) || 5;
    var value = parseFloat(el.getAttribute('data-nb-value')) || 0;
    var hoverValue = -1;
    var stars = [];

    /* ---------------------------------------------------------------- */
    /*  Build                                                            */
    /* ---------------------------------------------------------------- */

    function build() {
      el.setAttribute('role', 'radiogroup');
      el.setAttribute('aria-label', 'Rating');

      if (isReadonly) {
        el.classList.add('is-readonly');
        el.setAttribute('aria-readonly', 'true');
      }

      for (var i = 1; i <= max; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'nb-rating_star';
        btn.innerHTML = STAR_SVG;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-label', i + ' star' + (i !== 1 ? 's' : ''));
        btn.setAttribute('data-value', i);

        if (isReadonly) {
          btn.setAttribute('tabindex', '-1');
          btn.disabled = true;
        } else {
          btn.setAttribute('tabindex', i === Math.ceil(value) || (value === 0 && i === 1) ? '0' : '-1');
        }

        // Half-star fill overlay
        if (isHalf) {
          var fillOverlay = document.createElement('span');
          fillOverlay.className = 'nb-rating_star-fill';
          fillOverlay.innerHTML = STAR_SVG;
          btn.appendChild(fillOverlay);
        }

        stars.push(btn);
        el.appendChild(btn);

        if (!isReadonly) {
          (function (starBtn, starValue) {
            NB.on(starBtn, 'click', function (e) {
              e.stopPropagation();
              if (isHalf) {
                handleHalfClick(e, starBtn, starValue);
              } else {
                setValue(starValue);
              }
            });

            NB.on(starBtn, 'mouseenter', function (e) {
              if (isHalf) {
                handleHalfHover(e, starBtn, starValue);
              } else {
                hoverValue = starValue;
                renderStars();
              }
            });
          })(btn, i);
        }
      }

      if (!isReadonly) {
        NB.on(el, 'mouseleave', function () {
          hoverValue = -1;
          renderStars();
        });

        NB.on(el, 'keydown', handleKeydown);
      }

      renderStars();
    }

    /* ---------------------------------------------------------------- */
    /*  Half-star logic                                                  */
    /* ---------------------------------------------------------------- */

    function handleHalfClick(e, btn, starValue) {
      var rect = btn.getBoundingClientRect();
      var isLeft = (e.clientX - rect.left) < rect.width / 2;
      var newVal = isLeft ? starValue - 0.5 : starValue;
      setValue(newVal);
    }

    function handleHalfHover(e, btn, starValue) {
      var rect = btn.getBoundingClientRect();
      var isLeft = (e.clientX - rect.left) < rect.width / 2;
      hoverValue = isLeft ? starValue - 0.5 : starValue;
      renderStars();

      // Track mouse within the star for half-hover
      var moveHandler = function (me) {
        var isL = (me.clientX - rect.left) < rect.width / 2;
        var newHover = isL ? starValue - 0.5 : starValue;
        if (newHover !== hoverValue) {
          hoverValue = newHover;
          renderStars();
        }
      };
      NB.on(btn, 'mousemove', moveHandler);
      var leaveHandler = function () {
        NB.off(btn, 'mousemove', moveHandler);
        NB.off(btn, 'mouseleave', leaveHandler);
      };
      NB.on(btn, 'mouseleave', leaveHandler);
    }

    /* ---------------------------------------------------------------- */
    /*  Set value                                                        */
    /* ---------------------------------------------------------------- */

    function setValue(newVal) {
      value = newVal;
      el.setAttribute('data-nb-value', value);
      hoverValue = -1;
      renderStars();
      updateTabindex();
      NB.emit(el, 'nb:rating-change', { value: value, max: max });
    }

    /* ---------------------------------------------------------------- */
    /*  Render                                                           */
    /* ---------------------------------------------------------------- */

    function renderStars() {
      var displayVal = hoverValue >= 0 ? hoverValue : value;
      var isHovering = hoverValue >= 0;

      stars.forEach(function (btn, idx) {
        var starNum = idx + 1;
        btn.classList.remove('is-filled', 'is-half', 'is-hover');
        btn.setAttribute('aria-checked', starNum <= value ? 'true' : 'false');

        if (starNum <= Math.floor(displayVal)) {
          btn.classList.add(isHovering ? 'is-hover' : 'is-filled');
        } else if (isHalf && starNum - 0.5 === displayVal) {
          btn.classList.add('is-half');
          if (isHovering) btn.classList.add('is-hover');
        }
      });
    }

    function updateTabindex() {
      var activeIdx = Math.ceil(value) - 1;
      if (activeIdx < 0) activeIdx = 0;
      stars.forEach(function (btn, idx) {
        btn.setAttribute('tabindex', idx === activeIdx ? '0' : '-1');
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      var current = document.activeElement;
      var idx = stars.indexOf(current);
      if (idx < 0) return;

      var step = isHalf ? 0.5 : 1;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault();
          if (value < max) setValue(value + step);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault();
          if (value > step) setValue(value - step);
          else if (value > 0) setValue(0);
          break;
        case 'Home':
          e.preventDefault();
          setValue(isHalf ? 0.5 : 1);
          break;
        case 'End':
          e.preventDefault();
          setValue(max);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          setValue(idx + 1);
          break;
      }

      // Focus the correct star after value change
      var newIdx = Math.ceil(value) - 1;
      if (newIdx >= 0 && newIdx < stars.length) {
        stars[newIdx].focus();
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();
  });

})(window.NB);
