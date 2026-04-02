/**
 * DK Notification Center Component
 * Dropdown notification panel with badge count, mark-read,
 * and mark-all-read functionality.
 *
 * Usage:
 *   <div class="dk-notifications" data-dk-notification-center>
 *     <button class="dk-notifications_trigger">
 *       <svg>...</svg>
 *       <span class="dk-notifications_badge">3</span>
 *     </button>
 *     <div class="dk-notifications_panel">
 *       <div class="dk-notifications_header">
 *         <h3 class="dk-notifications_title">Notifications</h3>
 *         <button class="dk-notifications_mark-all">Mark all read</button>
 *       </div>
 *       <ul class="dk-notifications_list">
 *         <li class="dk-notification_item is-unread" data-notification-id="1">
 *           <div class="dk-notification_icon dk-notification_icon--info">...</div>
 *           <div class="dk-notification_content">
 *             <p class="dk-notification_text">...</p>
 *             <span class="dk-notification_time">2m ago</span>
 *           </div>
 *         </li>
 *       </ul>
 *     </div>
 *   </div>
 *
 * Events:
 *   dk:notification-read     — detail: { id }
 *   dk:notification-read-all
 *   dk:notification-toggle   — detail: { open }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('notification-center', function (el) {

    var trigger  = DK.$('.dk-notifications_trigger', el);
    var panel    = DK.$('.dk-notifications_panel', el);
    var badge    = DK.$('.dk-notifications_badge', el);
    var markAll  = DK.$('.dk-notifications_mark-all', el);

    if (!trigger || !panel) return;

    /* -------------------------------------------------------------- */
    /*  Toggle panel                                                   */
    /* -------------------------------------------------------------- */

    function openPanel() {
      panel.classList.add('is-open');
      DK.emit(el, 'dk:notification-toggle', { open: true });
    }

    function closePanel() {
      panel.classList.remove('is-open');
      DK.emit(el, 'dk:notification-toggle', { open: false });
    }

    function togglePanel() {
      if (panel.classList.contains('is-open')) {
        closePanel();
      } else {
        openPanel();
      }
    }

    DK.on(trigger, 'click', function (e) {
      e.stopPropagation();
      togglePanel();
    });

    /* Close on outside click */
    DK.on(document, 'click', function (e) {
      if (!el.contains(e.target) && panel.classList.contains('is-open')) {
        closePanel();
      }
    });

    /* Close on Escape */
    DK.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
        trigger.focus();
      }
    });

    /* -------------------------------------------------------------- */
    /*  Badge count                                                    */
    /* -------------------------------------------------------------- */

    function updateBadge() {
      var unread = DK.$$('.dk-notification_item.is-unread', el);
      var count = unread.length;

      if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.setAttribute('data-count', count);
      }
    }

    /* -------------------------------------------------------------- */
    /*  Mark read on click                                             */
    /* -------------------------------------------------------------- */

    DK.on(panel, 'click', function (e) {
      var item = e.target.closest('.dk-notification_item');
      if (!item) return;

      if (item.classList.contains('is-unread')) {
        item.classList.remove('is-unread');
        var id = item.getAttribute('data-notification-id') || '';
        DK.emit(el, 'dk:notification-read', { id: id });
        updateBadge();
      }
    });

    /* -------------------------------------------------------------- */
    /*  Mark all read                                                  */
    /* -------------------------------------------------------------- */

    if (markAll) {
      DK.on(markAll, 'click', function () {
        DK.$$('.dk-notification_item.is-unread', el).forEach(function (item) {
          item.classList.remove('is-unread');
        });
        updateBadge();
        DK.emit(el, 'dk:notification-read-all');
      });
    }

    /* Initial badge count */
    updateBadge();
  });

})(window.DK);
