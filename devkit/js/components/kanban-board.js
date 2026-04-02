/**
 * DK Kanban Board Component
 * Column-based task board with HTML5 drag-and-drop between columns.
 *
 * Usage:
 *   <div class="dk-kanban" data-dk-kanban>
 *     <div class="dk-kanban_column">
 *       <div class="dk-kanban_column-header">
 *         <h3 class="dk-kanban_column-title">
 *           To Do <span class="dk-kanban_column-count">3</span>
 *         </h3>
 *       </div>
 *       <div class="dk-kanban_cards">
 *         <div class="dk-kanban_card" draggable="true">
 *           <p class="dk-kanban_card-title">Task title</p>
 *           <div class="dk-kanban_card-labels">
 *             <span class="dk-kanban_card-label dk-kanban_card-label--blue">Feature</span>
 *           </div>
 *           <div class="dk-kanban_card-footer">
 *             <img class="dk-kanban_card-avatar" src="..." alt="" />
 *             <span class="dk-kanban_card-meta">DK-42</span>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:kanban-move — detail: { card, fromColumn, toColumn, position }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('kanban', function (el) {

    var draggedCard = null;
    var sourceColumn = null;

    /* -------------------------------------------------------------- */
    /*  Update column counts                                           */
    /* -------------------------------------------------------------- */

    function updateCounts() {
      DK.$$('.dk-kanban_column', el).forEach(function (col) {
        var cards = DK.$$('.dk-kanban_card', col);
        var countEl = col.querySelector('.dk-kanban_column-count');
        if (countEl) countEl.textContent = cards.length;
      });
    }

    /* -------------------------------------------------------------- */
    /*  Drag start                                                     */
    /* -------------------------------------------------------------- */

    DK.on(el, 'dragstart', function (e) {
      var card = e.target.closest('.dk-kanban_card');
      if (!card) return;

      draggedCard = card;
      sourceColumn = card.closest('.dk-kanban_column');
      card.classList.add('is-dragging');

      /* Required for Firefox */
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    /* -------------------------------------------------------------- */
    /*  Drag end                                                       */
    /* -------------------------------------------------------------- */

    DK.on(el, 'dragend', function () {
      if (draggedCard) {
        draggedCard.classList.remove('is-dragging');
      }

      /* Remove all drag-over highlights */
      DK.$$('.dk-kanban_column.is-drag-over', el).forEach(function (col) {
        col.classList.remove('is-drag-over');
      });

      draggedCard = null;
      sourceColumn = null;
    });

    /* -------------------------------------------------------------- */
    /*  Drag over — allow drop                                         */
    /* -------------------------------------------------------------- */

    DK.on(el, 'dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      var column = e.target.closest('.dk-kanban_column');
      if (!column || !draggedCard) return;

      /* Highlight the column */
      DK.$$('.dk-kanban_column.is-drag-over', el).forEach(function (col) {
        if (col !== column) col.classList.remove('is-drag-over');
      });
      column.classList.add('is-drag-over');

      /* Position the card within the list */
      var cardsContainer = column.querySelector('.dk-kanban_cards');
      if (!cardsContainer) return;

      var afterCard = getInsertPosition(cardsContainer, e.clientY);
      if (afterCard) {
        cardsContainer.insertBefore(draggedCard, afterCard);
      } else {
        cardsContainer.appendChild(draggedCard);
      }
    });

    /* -------------------------------------------------------------- */
    /*  Drop                                                           */
    /* -------------------------------------------------------------- */

    DK.on(el, 'drop', function (e) {
      e.preventDefault();

      var column = e.target.closest('.dk-kanban_column');
      if (!column || !draggedCard) return;

      column.classList.remove('is-drag-over');

      /* Determine position index */
      var cardsContainer = column.querySelector('.dk-kanban_cards');
      var cards = cardsContainer ? DK.$$('.dk-kanban_card', cardsContainer) : [];
      var position = cards.indexOf(draggedCard);

      updateCounts();

      DK.emit(el, 'dk:kanban-move', {
        card: draggedCard,
        fromColumn: sourceColumn,
        toColumn: column,
        position: position,
      });
    });

    /* -------------------------------------------------------------- */
    /*  Drag enter / leave for column highlight                        */
    /* -------------------------------------------------------------- */

    DK.on(el, 'dragenter', function (e) {
      var column = e.target.closest('.dk-kanban_column');
      if (column && draggedCard) {
        column.classList.add('is-drag-over');
      }
    });

    DK.on(el, 'dragleave', function (e) {
      var column = e.target.closest('.dk-kanban_column');
      if (column && !column.contains(e.relatedTarget)) {
        column.classList.remove('is-drag-over');
      }
    });

    /* -------------------------------------------------------------- */
    /*  Determine insertion position based on cursor Y                  */
    /* -------------------------------------------------------------- */

    function getInsertPosition(container, y) {
      var cards = DK.$$('.dk-kanban_card:not(.is-dragging)', container);
      var closest = null;
      var closestOffset = Number.NEGATIVE_INFINITY;

      cards.forEach(function (card) {
        var box = card.getBoundingClientRect();
        var offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closestOffset) {
          closestOffset = offset;
          closest = card;
        }
      });

      return closest;
    }

    /* Initial count update */
    updateCounts();
  });

})(window.DK);
