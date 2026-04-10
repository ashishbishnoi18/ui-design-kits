/**
 * NB Portal Component
 * Moves element content to the end of document.body (teleporting).
 * Useful for modals, tooltips, and overlays that need to escape
 * overflow/stacking-context constraints.
 *
 * Usage:
 *   <div data-nb-portal>
 *     <div class="nb-modal-backdrop">...</div>
 *   </div>
 *
 * Options:
 *   data-nb-portal-target="#custom-container"  — teleport to a specific element
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('portal', function (el) {

    var targetSelector = el.getAttribute('data-nb-portal-target');
    var target = targetSelector ? document.querySelector(targetSelector) : document.body;
    if (!target) target = document.body;

    /* Store original position for potential cleanup */
    var placeholder = document.createComment('nb-portal:' + (el.id || NB.uid('portal')));
    el.parentNode.insertBefore(placeholder, el);

    /* Move all children to target */
    var fragment = document.createDocumentFragment();
    while (el.firstChild) {
      fragment.appendChild(el.firstChild);
    }

    /* Track moved nodes for cleanup */
    var movedNodes = Array.prototype.slice.call(fragment.childNodes);
    target.appendChild(fragment);

    /* Expose restore method */
    el._nbPortalRestore = function () {
      movedNodes.forEach(function (node) {
        el.appendChild(node);
      });
      if (placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
      }
    };

  });
})(window.NB);
