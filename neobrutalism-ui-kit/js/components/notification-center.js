/**
 * NB Notification Center Component
 * Dropdown notification panel with badge count, mark-read,
 * and mark-all-read functionality.
 *
 * Usage:
 *   <div class="nb-notifications" data-nb-notification-center>
 *     <button class="nb-notifications_trigger">
 *       <svg>...</svg>
 *       <span class="nb-notifications_badge">3</span>
 *     </button>
 *     <div class="nb-notifications_panel">
 *       <div class="nb-notifications_header">
 *         <h3 class="nb-notifications_title">Notifications</h3>
 *         <button class="nb-notifications_mark-all">Mark all read</button>
 *       </div>
 *       <ul class="nb-notifications_list">
 *         <li class="nb-notification_item is-unread" data-notification-id="1">
 *           <div class="nb-notification_icon nb-notification_icon--info">...</div>
 *           <div class="nb-notification_content">
 *             <p class="nb-notification_text">...</p>
 *             <span class="nb-notification_time">2m ago</span>
 *           </div>
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 *
 * Events:
 *   nb:notification-read     — detail: { id }
 *   nb:notification-read-all
 *   nb:notification-toggle   — detail: { open }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('notification-center', function (el) {

    var trigger  = NB.$('.nb-notifications__trigger', el);
    var panel    = NB.$('.nb-notifications__panel', el);
    var badge    = NB.$('.nb-notifications__badge', el);
    var markAll  = NB.$('.nb-notifications__mark-all', el);

    if (!trigger || !panel) return;

    /* -------------------------------------------------------------- */
    /*  Toggle panel                                                   */
    /* -------------------------------------------------------------- */

    function openPanel() {
      panel.classList.add('is-open');
      NB.emit(el, 'nb:notification-toggle', { open: true });
    }

    function closePanel() {
      panel.classList.remove('is-open');
      NB.emit(el, 'nb:notification-toggle', { open: false });
    }

    function togglePanel() {
      if (panel.classList.contains('is-open')) {
        closePanel();
      } else {
        openPanel();
      }
    }

    NB.on(trigger, 'click', function (e) {
      e.stopPropagation();
      togglePanel();
    });

    /* Close on outside click */
    NB.on(document, 'click', function (e) {
      if (!el.contains(e.target) && panel.classList.contains('is-open')) {
        closePanel();
      }
    });

    /* Close on Escape */
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
        trigger.focus();
      }
    });

    /* -------------------------------------------------------------- */
    /*  Badge count                                                    */
    /* -------------------------------------------------------------- */

    function updateBadge() {
      var unread = NB.$$('.nb-notification__item.is-unread', el);
      var count = unread.length;

      if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.setAttribute('data-count', count);
      }
    }

    /* -------------------------------------------------------------- */
    /*  Mark read on click                                             */
    /* -------------------------------------------------------------- */

    NB.on(panel, 'click', function (e) {
      var item = e.target.closest('.nb-notification__item');
      if (!item) return;

      if (item.classList.contains('is-unread')) {
        item.classList.remove('is-unread');
        var id = item.getAttribute('data-notification-id') || '';
        NB.emit(el, 'nb:notification-read', { id: id });
        updateBadge();
      }
    });

    /* -------------------------------------------------------------- */
    /*  Mark all read                                                  */
    /* -------------------------------------------------------------- */

    if (markAll) {
      NB.on(markAll, 'click', function () {
        NB.$$('.nb-notification__item.is-unread', el).forEach(function (item) {
          item.classList.remove('is-unread');
        });
        updateBadge();
        NB.emit(el, 'nb:notification-read-all');
      });
    }

    /* Initial badge count */
    updateBadge();
  });

})(window.NB);
