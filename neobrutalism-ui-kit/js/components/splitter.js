/**
 * NB Splitter Component
 * Draggable divider between two panes. Horizontal or vertical layout.
 *
 * Usage:
 *   <div class="nb-splitter" data-nb-splitter="horizontal">
 *     <div class="nb-splitter_pane" style="flex: 0 0 50%">Left</div>
 *     <div class="nb-splitter_handle" tabindex="0"></div>
 *     <div class="nb-splitter_pane" style="flex: 1">Right</div>
 *   </div>
 *
 * Options:
 *   data-nb-splitter="horizontal|vertical"
 *   data-nb-min="100"  — min size in px for first pane
 *   data-nb-max="800"  — max size in px for first pane
 *
 * Events:
 *   nb:splitter-resize — detail: { size, percent }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('splitter', function (el) {

    var handle = NB.$('.nb-splitter__handle', el);
    var panes = NB.$$('.nb-splitter__pane', el);
    if (!handle || panes.length < 2) return;

    var isVertical = el.getAttribute('data-nb-splitter') === 'vertical';
    var minSize = parseInt(el.getAttribute('data-nb-min'), 10) || 50;
    var maxSize = parseInt(el.getAttribute('data-nb-max'), 10) || Infinity;

    var firstPane = panes[0];
    var startPos = 0;
    var startSize = 0;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', isVertical ? 'horizontal' : 'vertical');
    handle.setAttribute('aria-valuenow', '50');
    handle.setAttribute('aria-valuemin', '0');
    handle.setAttribute('aria-valuemax', '100');

    /* -------------------------------------------------------------- */
    /*  Drag handling                                                  */
    /* -------------------------------------------------------------- */

    function onMouseMove(e) {
      var containerRect = el.getBoundingClientRect();
      var totalSize = isVertical ? containerRect.height : containerRect.width;
      var delta = isVertical ? (e.clientY - startPos) : (e.clientX - startPos);
      var newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
      var clampedSize = Math.min(newSize, totalSize - minSize);

      firstPane.style.flex = '0 0 ' + clampedSize + 'px';

      var percent = Math.round((clampedSize / totalSize) * 100);
      handle.setAttribute('aria-valuenow', String(percent));

      NB.emit(el, 'nb:splitter-resize', { size: clampedSize, percent: percent });
    }

    function onMouseUp() {
      el.classList.remove('is-resizing');
      handle.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    NB.on(handle, 'mousedown', function (e) {
      e.preventDefault();
      startPos = isVertical ? e.clientY : e.clientX;
      startSize = isVertical ? firstPane.offsetHeight : firstPane.offsetWidth;

      el.classList.add('is-resizing');
      handle.classList.add('is-dragging');

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard resize                                                */
    /* -------------------------------------------------------------- */

    var STEP = 10;

    NB.on(handle, 'keydown', function (e) {
      var size = isVertical ? firstPane.offsetHeight : firstPane.offsetWidth;
      var containerRect = el.getBoundingClientRect();
      var totalSize = isVertical ? containerRect.height : containerRect.width;
      var newSize;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          newSize = Math.max(minSize, size - STEP);
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          newSize = Math.min(Math.min(maxSize, totalSize - minSize), size + STEP);
          break;
        case 'Home':
          e.preventDefault();
          newSize = minSize;
          break;
        case 'End':
          e.preventDefault();
          newSize = Math.min(maxSize, totalSize - minSize);
          break;
        default:
          return;
      }

      firstPane.style.flex = '0 0 ' + newSize + 'px';
      var percent = Math.round((newSize / totalSize) * 100);
      handle.setAttribute('aria-valuenow', String(percent));
      NB.emit(el, 'nb:splitter-resize', { size: newSize, percent: percent });
    });

  });
})(window.NB);
