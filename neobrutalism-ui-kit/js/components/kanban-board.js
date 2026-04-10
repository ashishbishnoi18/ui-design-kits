/**
 * NB Kanban Board Component
 * Column-based task board with HTML5 drag-and-drop between columns.
 *
 * Usage:
 *   <div class="nb-kanban" data-nb-kanban>
 *     <div class="nb-kanban_column">
 *       <div class="nb-kanban_column-header">
 *         <h3 class="nb-kanban_column-title">
 *           To Do <span class="nb-kanban_column-count">3</span>
 *         </h3>
 *       </div>
 *       <div class="nb-kanban_cards">
 *         <div class="nb-kanban_card" draggable="true">
 *           <p class="nb-kanban_card-title">Task title</p>
 *           <div class="nb-kanban_card-labels">
 *             <span class="nb-kanban_card-label nb-kanban_card-label--blue">Feature</span>
 *           </div>
 *           <div class="nb-kanban_card-footer">
 *             <img class="nb-kanban_card-avatar" src="..." alt="" />
 *             <span class="nb-kanban_card-meta">NB-42</span>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:kanban-move — detail: { card, fromColumn, toColumn, position }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('kanban', function (el) {

    var draggedCard = null;
    var sourceColumn = null;

    /* -------------------------------------------------------------- */
    /*  Update column counts                                           */
    /* -------------------------------------------------------------- */

    function updateCounts() {
      NB.$$('.nb-kanban__column', el).forEach(function (col) {
        var cards = NB.$$('.nb-kanban__card', col);
        var countEl = col.querySelector('.nb-kanban__column-count');
        if (countEl) countEl.textContent = cards.length;
      });
    }

    /* -------------------------------------------------------------- */
    /*  Drag start                                                     */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragstart', function (e) {
      var card = e.target.closest('.nb-kanban__card');
      if (!card) return;

      draggedCard = card;
      sourceColumn = card.closest('.nb-kanban__column');
      card.classList.add('is-dragging');

      /* Required for Firefox */
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
    });

    /* -------------------------------------------------------------- */
    /*  Drag end                                                       */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragend', function () {
      if (draggedCard) {
        draggedCard.classList.remove('is-dragging');
      }

      /* Remove all drag-over highlights */
      NB.$$('.nb-kanban__column.is-drag-over', el).forEach(function (col) {
        col.classList.remove('is-drag-over');
      });

      draggedCard = null;
      sourceColumn = null;
    });

    /* -------------------------------------------------------------- */
    /*  Drag over — allow drop                                         */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      var column = e.target.closest('.nb-kanban__column');
      if (!column || !draggedCard) return;

      /* Highlight the column */
      NB.$$('.nb-kanban__column.is-drag-over', el).forEach(function (col) {
        if (col !== column) col.classList.remove('is-drag-over');
      });
      column.classList.add('is-drag-over');

      /* Position the card within the list */
      var cardsContainer = column.querySelector('.nb-kanban__cards');
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

    NB.on(el, 'drop', function (e) {
      e.preventDefault();

      var column = e.target.closest('.nb-kanban__column');
      if (!column || !draggedCard) return;

      column.classList.remove('is-drag-over');

      /* Determine position index */
      var cardsContainer = column.querySelector('.nb-kanban__cards');
      var cards = cardsContainer ? NB.$$('.nb-kanban__card', cardsContainer) : [];
      var position = cards.indexOf(draggedCard);

      updateCounts();

      NB.emit(el, 'nb:kanban-move', {
        card: draggedCard,
        fromColumn: sourceColumn,
        toColumn: column,
        position: position,
      });
    });

    /* -------------------------------------------------------------- */
    /*  Drag enter / leave for column highlight                        */
    /* -------------------------------------------------------------- */

    NB.on(el, 'dragenter', function (e) {
      var column = e.target.closest('.nb-kanban__column');
      if (column && draggedCard) {
        column.classList.add('is-drag-over');
      }
    });

    NB.on(el, 'dragleave', function (e) {
      var column = e.target.closest('.nb-kanban__column');
      if (column && !column.contains(e.relatedTarget)) {
        column.classList.remove('is-drag-over');
      }
    });

    /* -------------------------------------------------------------- */
    /*  Determine insertion position based on cursor Y                  */
    /* -------------------------------------------------------------- */

    function getInsertPosition(container, y) {
      var cards = NB.$$('.nb-kanban__card:not(.is-dragging)', container);
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

})(window.NB);
