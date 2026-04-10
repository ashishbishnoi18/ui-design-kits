/**
 * NB Data Table Component
 * Adds sorting to table columns via sort buttons.
 * Rearranges tbody rows on click, cycling through asc / desc / none.
 * Emits `nb:table-sort` with `{ column, direction }` detail.
 *
 * Usage:
 *   <div class="nb-data-table" data-nb-data-table>
 *     <table class="nb-table">
 *       <thead>
 *         <tr>
 *           <th><button class="nb-data-table_sort-btn" data-col="0">Name</button></th>
 *           <th><button class="nb-data-table_sort-btn" data-col="1">Value</button></th>
 *         </tr>
 *       </thead>
 *       <tbody>...</tbody>
 *     </table>
 *   </div>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  /** Sort direction cycle: none -> ascending -> descending -> none */
  var CYCLE = { none: 'ascending', ascending: 'descending', descending: 'none' };

  NB.register('data-table', function (el) {
    var table   = NB.$('.nb-table', el) || el.querySelector('table');
    if (!table) return;

    var tbody   = table.querySelector('tbody');
    if (!tbody) return;

    var sortBtns = NB.$$('.nb-data-table_sort-btn', el);
    if (!sortBtns.length) return;

    /* -------------------------------------------------------------- */
    /*  State                                                          */
    /* -------------------------------------------------------------- */

    var currentBtn   = null;
    var currentDir   = 'none';
    var originalRows = null; // snapshot for resetting to "none"

    /* -------------------------------------------------------------- */
    /*  Helpers                                                        */
    /* -------------------------------------------------------------- */

    /**
     * Extract sortable text content from a cell.
     * Strips whitespace and lowercases for natural comparison.
     */
    function getCellValue(row, colIndex) {
      var cell = row.children[colIndex];
      if (!cell) return '';

      // Prefer data-sort-value attribute for custom sort keys
      var explicit = cell.getAttribute('data-sort-value');
      if (explicit !== null) return explicit;

      return (cell.textContent || '').trim().toLowerCase();
    }

    /**
     * Compare two values — tries numeric first, falls back to string.
     */
    function compare(a, b) {
      var numA = parseFloat(a);
      var numB = parseFloat(b);

      // Both are valid numbers
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }

      // String comparison
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }

    /**
     * Sort and re-append rows into tbody.
     */
    function sortRows(colIndex, direction) {
      if (!originalRows) {
        // Snapshot the original DOM order on first sort
        originalRows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
      }

      var rows;

      if (direction === 'none') {
        // Restore original order
        rows = originalRows.slice();
      } else {
        rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
        rows.sort(function (rowA, rowB) {
          var valA = getCellValue(rowA, colIndex);
          var valB = getCellValue(rowB, colIndex);
          var result = compare(valA, valB);
          return direction === 'descending' ? -result : result;
        });
      }

      // Re-append in new order (moves existing DOM nodes)
      var frag = document.createDocumentFragment();
      for (var i = 0; i < rows.length; i++) {
        frag.appendChild(rows[i]);
      }
      tbody.appendChild(frag);
    }

    /* -------------------------------------------------------------- */
    /*  Reset ARIA on all buttons                                      */
    /* -------------------------------------------------------------- */

    function resetAllButtons() {
      for (var i = 0; i < sortBtns.length; i++) {
        sortBtns[i].removeAttribute('aria-sort');
      }
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    function handleSort(e) {
      var btn = e.currentTarget;
      var colIndex = parseInt(btn.getAttribute('data-col'), 10);
      if (isNaN(colIndex)) return;

      // Determine new direction
      var prevDir = btn === currentBtn ? currentDir : 'none';
      var nextDir = CYCLE[prevDir];

      // Reset all, then set active
      resetAllButtons();

      if (nextDir !== 'none') {
        btn.setAttribute('aria-sort', nextDir);
      }

      currentBtn = btn;
      currentDir = nextDir;

      // Sort
      sortRows(colIndex, nextDir);

      // Emit event
      NB.emit(el, 'nb:table-sort', {
        column: colIndex,
        direction: nextDir
      });
    }

    /* -------------------------------------------------------------- */
    /*  Bind                                                           */
    /* -------------------------------------------------------------- */

    for (var i = 0; i < sortBtns.length; i++) {
      NB.on(sortBtns[i], 'click', handleSort);
    }
  });

})(window.NB);
