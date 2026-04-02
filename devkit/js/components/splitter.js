/**
 * DK Splitter Component
 * Draggable divider between two panes. Horizontal or vertical layout.
 *
 * Usage:
 *   <div class="dk-splitter" data-dk-splitter="horizontal">
 *     <div class="dk-splitter_pane" style="flex: 0 0 50%">Left</div>
 *     <div class="dk-splitter_handle" tabindex="0"></div>
 *     <div class="dk-splitter_pane" style="flex: 1">Right</div>
 *   </div>
 *
 * Options:
 *   data-dk-splitter="horizontal|vertical"
 *   data-dk-min="100"  — min size in px for first pane
 *   data-dk-max="800"  — max size in px for first pane
 *
 * Events:
 *   dk:splitter-resize — detail: { size, percent }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('splitter', function (el) {

    var handle = DK.$('.dk-splitter_handle', el);
    var panes = DK.$$('.dk-splitter_pane', el);
    if (!handle || panes.length < 2) return;

    var isVertical = el.getAttribute('data-dk-splitter') === 'vertical';
    var minSize = parseInt(el.getAttribute('data-dk-min'), 10) || 50;
    var maxSize = parseInt(el.getAttribute('data-dk-max'), 10) || Infinity;

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

      DK.emit(el, 'dk:splitter-resize', { size: clampedSize, percent: percent });
    }

    function onMouseUp() {
      el.classList.remove('is-resizing');
      handle.classList.remove('is-dragging');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }

    DK.on(handle, 'mousedown', function (e) {
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

    DK.on(handle, 'keydown', function (e) {
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
      DK.emit(el, 'dk:splitter-resize', { size: newSize, percent: percent });
    });

  });
})(window.DK);
