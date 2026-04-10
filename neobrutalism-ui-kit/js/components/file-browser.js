/**
 * NB File Browser Component
 * File/folder tree with context menu, breadcrumb navigation,
 * and grid/list view toggle.
 *
 * Usage:
 *   <div class="nb-file-browser" data-nb-file-browser>
 *     <div class="nb-file-browser_toolbar">
 *       <div class="nb-file-browser_breadcrumb">
 *         <button class="nb-file-browser_breadcrumb-item" data-path="/">~</button>
 *         <span class="nb-file-browser_breadcrumb-sep">/</span>
 *         <button class="nb-file-browser_breadcrumb-item" data-path="/src">src</button>
 *       </div>
 *       <div class="nb-file-browser_view-toggle">
 *         <button class="nb-file-browser_view-btn is-active" data-view="list">...</button>
 *         <button class="nb-file-browser_view-btn" data-view="grid">...</button>
 *       </div>
 *     </div>
 *     <div class="nb-file-browser_list">
 *       <div class="nb-file-browser_list-header">
 *         <span>Name</span><span>Size</span><span>Modified</span><span></span>
 *       </div>
 *       <div class="nb-file-browser_row" data-type="folder" data-name="src">
 *         <div class="nb-file-browser_name">
 *           <svg class="nb-file-browser_icon nb-file-browser_icon--folder">...</svg>
 *           <span class="nb-file-browser_name-text">src</span>
 *         </div>
 *         <span class="nb-file-browser_size">--</span>
 *         <span class="nb-file-browser_modified">Mar 28</span>
 *         <div class="nb-file-browser_row-actions">
 *           <button class="nb-file-browser_row-action">...</button>
 *         </div>
 *       </div>
 *     </div>
 *     <div class="nb-file-browser_grid" style="display:none">...</div>
 *     <div class="nb-file-browser_context-menu">
 *       <button class="nb-file-browser_context-item" data-action="open">Open</button>
 *       <button class="nb-file-browser_context-item" data-action="rename">Rename</button>
 *       <button class="nb-file-browser_context-item" data-action="copy">Copy</button>
 *       <div class="nb-file-browser_context-divider"></div>
 *       <button class="nb-file-browser_context-item nb-file-browser_context-item--danger" data-action="delete">Delete</button>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:file-select   — detail: { name, type }
 *   nb:file-action   — detail: { action, name, type }
 *   nb:file-navigate — detail: { path }
 *   nb:file-view     — detail: { view: 'list'|'grid' }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('file-browser', function (el) {

    var listView    = NB.$('.nb-file-browser_list', el);
    var gridView    = NB.$('.nb-file-browser_grid', el);
    var contextMenu = NB.$('.nb-file-browser_context-menu', el);
    var viewBtns    = NB.$$('.nb-file-browser_view-btn', el);

    var currentView   = 'list';
    var selectedTarget = null;

    /* -------------------------------------------------------------- */
    /*  View toggle                                                    */
    /* -------------------------------------------------------------- */

    viewBtns.forEach(function (btn) {
      NB.on(btn, 'click', function () {
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

        NB.emit(el, 'nb:file-view', { view: view });
      });
    });

    /* -------------------------------------------------------------- */
    /*  Row / grid item click — select                                 */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var row = e.target.closest('.nb-file-browser_row, .nb-file-browser_grid-item');
      if (!row) return;

      /* Deselect all */
      NB.$$('.nb-file-browser_row.is-selected, .nb-file-browser_grid-item.is-selected', el)
        .forEach(function (r) { r.classList.remove('is-selected'); });

      row.classList.add('is-selected');

      var name = row.getAttribute('data-name') || '';
      var type = row.getAttribute('data-type') || 'file';

      NB.emit(el, 'nb:file-select', { name: name, type: type });
    });

    /* Double-click to open folder ------------------------------------- */

    NB.on(el, 'dblclick', function (e) {
      var row = e.target.closest('.nb-file-browser_row, .nb-file-browser_grid-item');
      if (!row) return;

      var type = row.getAttribute('data-type') || 'file';
      var name = row.getAttribute('data-name') || '';

      if (type === 'folder') {
        NB.emit(el, 'nb:file-navigate', { path: name });
      }
    });

    /* -------------------------------------------------------------- */
    /*  Breadcrumb navigation                                          */
    /* -------------------------------------------------------------- */

    NB.on(el, 'click', function (e) {
      var crumb = e.target.closest('.nb-file-browser_breadcrumb-item');
      if (!crumb) return;

      var path = crumb.getAttribute('data-path') || '/';
      NB.emit(el, 'nb:file-navigate', { path: path });
    });

    /* -------------------------------------------------------------- */
    /*  Context menu                                                   */
    /* -------------------------------------------------------------- */

    if (contextMenu) {
      /* Show on right-click */
      NB.on(el, 'contextmenu', function (e) {
        var row = e.target.closest('.nb-file-browser_row, .nb-file-browser_grid-item');
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
      NB.on(contextMenu, 'click', function (e) {
        var item = e.target.closest('.nb-file-browser_context-item');
        if (!item) return;

        var action = item.getAttribute('data-action') || '';
        var name = selectedTarget ? selectedTarget.getAttribute('data-name') || '' : '';
        var type = selectedTarget ? selectedTarget.getAttribute('data-type') || 'file' : 'file';

        NB.emit(el, 'nb:file-action', {
          action: action,
          name: name,
          type: type,
        });

        closeContextMenu();
      });

      /* Close on click outside */
      NB.on(document, 'click', function () {
        closeContextMenu();
      });

      /* Close on Escape */
      NB.on(document, 'keydown', function (e) {
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

    NB.on(el, 'click', function (e) {
      var actionBtn = e.target.closest('.nb-file-browser_row-action');
      if (!actionBtn) return;

      e.stopPropagation();

      var row = actionBtn.closest('.nb-file-browser_row');
      if (!row || !contextMenu) return;

      selectedTarget = row;

      var rect = actionBtn.getBoundingClientRect();
      contextMenu.style.left = rect.left + 'px';
      contextMenu.style.top = (rect.bottom + 4) + 'px';
      contextMenu.classList.add('is-open');
    });
  });

})(window.NB);
