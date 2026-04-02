/**
 * DK File Browser Component
 * File/folder tree with context menu, breadcrumb navigation,
 * and grid/list view toggle.
 *
 * Usage:
 *   <div class="dk-file-browser" data-dk-file-browser>
 *     <div class="dk-file-browser_toolbar">
 *       <div class="dk-file-browser_breadcrumb">
 *         <button class="dk-file-browser_breadcrumb-item" data-path="/">~</button>
 *         <span class="dk-file-browser_breadcrumb-sep">/</span>
 *         <button class="dk-file-browser_breadcrumb-item" data-path="/src">src</button>
 *       </div>
 *       <div class="dk-file-browser_view-toggle">
 *         <button class="dk-file-browser_view-btn is-active" data-view="list">...</button>
 *         <button class="dk-file-browser_view-btn" data-view="grid">...</button>
 *       </div>
 *     </div>
 *     <div class="dk-file-browser_list">
 *       <div class="dk-file-browser_list-header">
 *         <span>Name</span><span>Size</span><span>Modified</span><span></span>
 *       </div>
 *       <div class="dk-file-browser_row" data-type="folder" data-name="src">
 *         <div class="dk-file-browser_name">
 *           <svg class="dk-file-browser_icon dk-file-browser_icon--folder">...</svg>
 *           <span class="dk-file-browser_name-text">src</span>
 *         </div>
 *         <span class="dk-file-browser_size">--</span>
 *         <span class="dk-file-browser_modified">Mar 28</span>
 *         <div class="dk-file-browser_row-actions">
 *           <button class="dk-file-browser_row-action">...</button>
 *         </div>
 *       </div>
 *     </div>
 *     <div class="dk-file-browser_grid" style="display:none">...</div>
 *     <div class="dk-file-browser_context-menu">
 *       <button class="dk-file-browser_context-item" data-action="open">Open</button>
 *       <button class="dk-file-browser_context-item" data-action="rename">Rename</button>
 *       <button class="dk-file-browser_context-item" data-action="copy">Copy</button>
 *       <div class="dk-file-browser_context-divider"></div>
 *       <button class="dk-file-browser_context-item dk-file-browser_context-item--danger" data-action="delete">Delete</button>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:file-select   — detail: { name, type }
 *   dk:file-action   — detail: { action, name, type }
 *   dk:file-navigate — detail: { path }
 *   dk:file-view     — detail: { view: 'list'|'grid' }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('file-browser', function (el) {

    var listView    = DK.$('.dk-file-browser_list', el);
    var gridView    = DK.$('.dk-file-browser_grid', el);
    var contextMenu = DK.$('.dk-file-browser_context-menu', el);
    var viewBtns    = DK.$$('.dk-file-browser_view-btn', el);

    var currentView   = 'list';
    var selectedTarget = null;

    /* -------------------------------------------------------------- */
    /*  View toggle                                                    */
    /* -------------------------------------------------------------- */

    viewBtns.forEach(function (btn) {
      DK.on(btn, 'click', function () {
        var view = btn.getAttribute('data-view');
        if (view === currentView) return;

        currentView = view;

        viewBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        if (view === 'list') {
          if (listView) listView.style.display = '';
          if (gridView) gridView.style.display = 'none';
        } else {
          if (listView) listView.style.display = 'none';
          if (gridView) gridView.style.display = '';
        }

        DK.emit(el, 'dk:file-view', { view: view });
      });
    });

    /* -------------------------------------------------------------- */
    /*  Row / grid item click — select                                 */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var row = e.target.closest('.dk-file-browser_row, .dk-file-browser_grid-item');
      if (!row) return;

      /* Deselect all */
      DK.$$('.dk-file-browser_row.is-selected, .dk-file-browser_grid-item.is-selected', el)
        .forEach(function (r) { r.classList.remove('is-selected'); });

      row.classList.add('is-selected');

      var name = row.getAttribute('data-name') || '';
      var type = row.getAttribute('data-type') || 'file';

      DK.emit(el, 'dk:file-select', { name: name, type: type });
    });

    /* Double-click to open folder ------------------------------------- */

    DK.on(el, 'dblclick', function (e) {
      var row = e.target.closest('.dk-file-browser_row, .dk-file-browser_grid-item');
      if (!row) return;

      var type = row.getAttribute('data-type') || 'file';
      var name = row.getAttribute('data-name') || '';

      if (type === 'folder') {
        DK.emit(el, 'dk:file-navigate', { path: name });
      }
    });

    /* -------------------------------------------------------------- */
    /*  Breadcrumb navigation                                          */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var crumb = e.target.closest('.dk-file-browser_breadcrumb-item');
      if (!crumb) return;

      var path = crumb.getAttribute('data-path') || '/';
      DK.emit(el, 'dk:file-navigate', { path: path });
    });

    /* -------------------------------------------------------------- */
    /*  Context menu                                                   */
    /* -------------------------------------------------------------- */

    if (contextMenu) {
      /* Show on right-click */
      DK.on(el, 'contextmenu', function (e) {
        var row = e.target.closest('.dk-file-browser_row, .dk-file-browser_grid-item');
        if (!row) {
          closeContextMenu();
          return;
        }

        e.preventDefault();
        selectedTarget = row;

        /* Position the menu */
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
        contextMenu.classList.add('is-open');

        /* Ensure menu doesn't overflow viewport */
        requestAnimationFrame(function () {
          var rect = contextMenu.getBoundingClientRect();
          if (rect.right > window.innerWidth) {
            contextMenu.style.left = (e.clientX - rect.width) + 'px';
          }
          if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (e.clientY - rect.height) + 'px';
          }
        });
      });

      /* Context menu item click */
      DK.on(contextMenu, 'click', function (e) {
        var item = e.target.closest('.dk-file-browser_context-item');
        if (!item) return;

        var action = item.getAttribute('data-action') || '';
        var name = selectedTarget ? selectedTarget.getAttribute('data-name') || '' : '';
        var type = selectedTarget ? selectedTarget.getAttribute('data-type') || 'file' : 'file';

        DK.emit(el, 'dk:file-action', {
          action: action,
          name: name,
          type: type,
        });

        closeContextMenu();
      });

      /* Close on click outside */
      DK.on(document, 'click', function () {
        closeContextMenu();
      });

      /* Close on Escape */
      DK.on(document, 'keydown', function (e) {
        if (e.key === 'Escape') closeContextMenu();
      });
    }

    function closeContextMenu() {
      if (contextMenu) {
        contextMenu.classList.remove('is-open');
      }
      selectedTarget = null;
    }

    /* -------------------------------------------------------------- */
    /*  Row action button (three-dot menu)                              */
    /* -------------------------------------------------------------- */

    DK.on(el, 'click', function (e) {
      var actionBtn = e.target.closest('.dk-file-browser_row-action');
      if (!actionBtn) return;

      e.stopPropagation();

      var row = actionBtn.closest('.dk-file-browser_row');
      if (!row || !contextMenu) return;

      selectedTarget = row;

      var rect = actionBtn.getBoundingClientRect();
      contextMenu.style.left = rect.left + 'px';
      contextMenu.style.top = (rect.bottom + 4) + 'px';
      contextMenu.classList.add('is-open');
    });
  });

})(window.DK);
