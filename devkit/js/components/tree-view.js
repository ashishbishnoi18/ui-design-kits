/**
 * DK Tree View Component
 * Hierarchical expandable tree with keyboard navigation and ARIA roles.
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var CHEVRON_SVG =
    '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">' +
    '<path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';

  var FOLDER_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M2 4.5A1.5 1.5 0 0 1 3.5 3H6l1.5 1.5H12.5A1.5 1.5 0 0 1 14 6v6a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12V4.5z" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>';

  var FILE_SVG =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4 2h5l4 4v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.2"/>' +
    '<path d="M9 2v4h4" stroke="currentColor" stroke-width="1.2"/>' +
    '</svg>';

  DK.register('tree', function (el) {

    el.classList.add('dk-tree');
    el.setAttribute('role', 'tree');

    var nodes = DK.$$('.dk-tree_node', el);
    var allLabels = [];

    /* ---------------------------------------------------------------- */
    /*  Setup each node                                                  */
    /* ---------------------------------------------------------------- */

    nodes.forEach(function (node) {
      var label = DK.$('.dk-tree_label', node);
      if (!label) return;

      var children = DK.$('.dk-tree_children', node);
      var isLeaf = !children || children.children.length === 0;

      // ARIA
      node.setAttribute('role', 'treeitem');
      if (children) children.setAttribute('role', 'group');

      // Make label focusable
      if (!label.hasAttribute('tabindex')) {
        label.setAttribute('tabindex', '-1');
      }

      allLabels.push(label);

      // Toggle icon
      var toggle = DK.$('.dk-tree_toggle', node);
      if (!toggle) {
        toggle = document.createElement('span');
        toggle.className = 'dk-tree_toggle' + (isLeaf ? ' dk-tree_toggle--leaf' : '');
        toggle.innerHTML = CHEVRON_SVG;
        label.insertBefore(toggle, label.firstChild);
      }

      // Node icon (folder/file)
      var icon = DK.$('.dk-tree_icon', node);
      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'dk-tree_icon' + (isLeaf ? '' : ' dk-tree_icon--folder');
        icon.innerHTML = isLeaf ? FILE_SVG : FOLDER_SVG;
        // Insert after toggle
        if (toggle.nextSibling) {
          label.insertBefore(icon, toggle.nextSibling);
        } else {
          label.appendChild(icon);
        }
      }

      // Default collapsed state
      if (!node.classList.contains('is-collapsed') && !node.hasAttribute('data-dk-tree-open')) {
        // Leave root-level nodes expanded, collapse deeper ones
        var depth = getDepth(node);
        if (depth >= 2) {
          node.classList.add('is-collapsed');
        }
      }

      // Update aria-expanded
      if (!isLeaf) {
        label.setAttribute('aria-expanded', node.classList.contains('is-collapsed') ? 'false' : 'true');
      }
    });

    // First focusable label gets tabindex=0
    if (allLabels.length) {
      allLabels[0].setAttribute('tabindex', '0');
    }

    /* ---------------------------------------------------------------- */
    /*  Depth helper                                                     */
    /* ---------------------------------------------------------------- */

    function getDepth(node) {
      var d = 0;
      var parent = node.parentElement;
      while (parent && parent !== el) {
        if (parent.classList.contains('dk-tree_children')) d++;
        parent = parent.parentElement;
      }
      return d;
    }

    /* ---------------------------------------------------------------- */
    /*  Toggle                                                           */
    /* ---------------------------------------------------------------- */

    function toggleNode(node) {
      var children = DK.$('.dk-tree_children', node);
      if (!children || children.children.length === 0) return;

      var label = DK.$('.dk-tree_label', node);
      var isCollapsed = node.classList.contains('is-collapsed');

      node.classList.toggle('is-collapsed');

      if (label) {
        label.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
      }
    }

    /* ---------------------------------------------------------------- */
    /*  Click handler                                                    */
    /* ---------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var label = e.target.closest('.dk-tree_label');
      if (!label) return;

      var node = label.closest('.dk-tree_node');
      if (!node || !el.contains(node)) return;

      e.preventDefault();

      // Toggle expand/collapse
      toggleNode(node);

      // Set active state
      allLabels.forEach(function (l) { l.classList.remove('is-active'); });
      label.classList.add('is-active');

      // Focus management
      allLabels.forEach(function (l) { l.setAttribute('tabindex', '-1'); });
      label.setAttribute('tabindex', '0');
      label.focus();

      DK.emit(el, 'dk:tree-select', { node: node, label: label });
    });

    /* ---------------------------------------------------------------- */
    /*  Keyboard navigation                                              */
    /* ---------------------------------------------------------------- */

    function getVisibleLabels() {
      return allLabels.filter(function (l) {
        return l.offsetParent !== null;
      });
    }

    DK.on(el, 'keydown', function (e) {
      var focused = document.activeElement;
      if (!focused || !focused.classList.contains('dk-tree_label')) return;

      var visible = getVisibleLabels();
      var idx = visible.indexOf(focused);
      if (idx === -1) return;

      var node = focused.closest('.dk-tree_node');
      var children = node ? DK.$('.dk-tree_children', node) : null;
      var isLeaf = !children || children.children.length === 0;
      var isCollapsed = node && node.classList.contains('is-collapsed');

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (idx < visible.length - 1) focusLabel(visible[idx + 1]);
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (idx > 0) focusLabel(visible[idx - 1]);
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (!isLeaf && isCollapsed) {
            toggleNode(node);
          } else if (!isLeaf) {
            // Focus first child
            var childLabels = getVisibleLabels();
            var nextIdx = childLabels.indexOf(focused);
            if (nextIdx < childLabels.length - 1) focusLabel(childLabels[nextIdx + 1]);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (!isLeaf && !isCollapsed) {
            toggleNode(node);
          } else {
            // Focus parent
            var parentChildren = node ? node.parentElement : null;
            if (parentChildren && parentChildren.classList.contains('dk-tree_children')) {
              var parentNode = parentChildren.closest('.dk-tree_node');
              if (parentNode) {
                var parentLabel = DK.$('.dk-tree_label', parentNode);
                if (parentLabel) focusLabel(parentLabel);
              }
            }
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          toggleNode(node);

          allLabels.forEach(function (l) { l.classList.remove('is-active'); });
          focused.classList.add('is-active');

          DK.emit(el, 'dk:tree-select', { node: node, label: focused });
          break;

        case 'Home':
          e.preventDefault();
          if (visible.length) focusLabel(visible[0]);
          break;

        case 'End':
          e.preventDefault();
          if (visible.length) focusLabel(visible[visible.length - 1]);
          break;

        default:
          return;
      }
    });

    function focusLabel(label) {
      allLabels.forEach(function (l) { l.setAttribute('tabindex', '-1'); });
      label.setAttribute('tabindex', '0');
      label.focus();
    }
  });

})(window.DK);
