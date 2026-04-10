/**
 * NB Tabs Component
 * Click to activate tab + panel. Arrow keys for navigation.
 * Full ARIA: role=tablist, role=tab, role=tabpanel, aria-selected.
 *
 * Usage:
 *   <div data-nb-tabs class="nb-tabs">
 *     <div class="nb-tabs_list" role="tablist">
 *       <button class="nb-tabs_tab is-active" data-nb-tab="panel-1">Tab 1</button>
 *       <button class="nb-tabs_tab" data-nb-tab="panel-2">Tab 2</button>
 *     </div>
 *     <div class="nb-tabs_panel is-active" id="panel-1">Content 1</div>
 *     <div class="nb-tabs_panel" id="panel-2">Content 2</div>
 *   </div>
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('tabs', function (el) {

    var tablist = NB.$('.nb-tabs__list', el);
    var tabs = NB.$$('.nb-tabs__tab', el);
    var panels = NB.$$('.nb-tabs__panel', el);

    if (!tablist || !tabs.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    tablist.setAttribute('role', 'tablist');

    tabs.forEach(function (tab, i) {
      var panelId = tab.getAttribute('data-nb-tab');
      var tabId = tab.id || NB.uid('nb-tab');
      tab.id = tabId;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('tabindex', tab.classList.contains('is-active') ? '0' : '-1');
      tab.setAttribute('aria-selected', String(tab.classList.contains('is-active')));

      if (panelId) {
        tab.setAttribute('aria-controls', panelId);
        var panel = document.getElementById(panelId);
        if (panel) {
          panel.setAttribute('role', 'tabpanel');
          panel.setAttribute('aria-labelledby', tabId);
          panel.setAttribute('tabindex', '0');
        }
      }
    });

    /* -------------------------------------------------------------- */
    /*  Activate tab                                                   */
    /* -------------------------------------------------------------- */

    function activate(tab) {
      // Deactivate all
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });

      panels.forEach(function (p) {
        p.classList.remove('is-active');
      });

      // Activate selected
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      tab.focus();

      var panelId = tab.getAttribute('data-nb-tab');
      if (panelId) {
        var panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.add('is-active');
        }
      }

      NB.emit(el, 'nb:tab-change', { tab: tab, panelId: panelId });
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    tabs.forEach(function (tab) {
      NB.on(tab, 'click', function () {
        activate(tab);
      });
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    NB.on(tablist, 'keydown', function (e) {
      var currentIndex = tabs.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      var nextIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
          activate(tabs[nextIndex]);
          break;

        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          activate(tabs[nextIndex]);
          break;

        case 'Home':
          e.preventDefault();
          activate(tabs[0]);
          break;

        case 'End':
          e.preventDefault();
          activate(tabs[tabs.length - 1]);
          break;
      }
    });
  });

})(window.NB);
