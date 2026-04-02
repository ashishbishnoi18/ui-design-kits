/**
 * DK Vertical Tabs Component
 * Vertical tab navigation with arrow key support (up/down, Home/End).
 * Full ARIA: role=tablist orientation=vertical, role=tab, role=tabpanel.
 *
 * Usage:
 *   <div data-dk-vtabs class="dk-vtabs">
 *     <div class="dk-vtabs_list">
 *       <button class="dk-vtabs_tab is-active" data-dk-vtab="panel-1">Tab 1</button>
 *       <button class="dk-vtabs_tab" data-dk-vtab="panel-2">Tab 2</button>
 *     </div>
 *     <div class="dk-vtabs_panel is-active" id="panel-1">Content 1</div>
 *     <div class="dk-vtabs_panel" id="panel-2">Content 2</div>
 *   </div>
 *
 * Events:
 *   dk:vtab-change — detail: { tab, panel }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('vtabs', function (el) {

    var tablist = DK.$('.dk-vtabs_list', el);
    var tabs = DK.$$('.dk-vtabs_tab', el);
    var panels = DK.$$('.dk-vtabs_panel', el);

    if (!tablist || !tabs.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    tablist.setAttribute('role', 'tablist');
    tablist.setAttribute('aria-orientation', 'vertical');

    tabs.forEach(function (tab, i) {
      var panelId = tab.getAttribute('data-dk-vtab');
      var tabId = tab.id || DK.uid('dk-vtab');
      tab.id = tabId;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('tabindex', tab.classList.contains('is-active') ? '0' : '-1');
      tab.setAttribute('aria-selected', String(tab.classList.contains('is-active')));
      if (panelId) tab.setAttribute('aria-controls', panelId);

      var panel = panelId ? document.getElementById(panelId) : panels[i];
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
        panel.setAttribute('tabindex', '0');
      }
    });

    /* -------------------------------------------------------------- */
    /*  Activate tab                                                   */
    /* -------------------------------------------------------------- */

    function activate(tab) {
      tabs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      panels.forEach(function (p) { p.classList.remove('is-active'); });

      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      tab.setAttribute('tabindex', '0');
      tab.focus();

      var panelId = tab.getAttribute('data-dk-vtab');
      var panel = panelId ? document.getElementById(panelId) : null;
      if (panel) panel.classList.add('is-active');

      DK.emit(el, 'dk:vtab-change', { tab: tab, panel: panel });
    }

    /* -------------------------------------------------------------- */
    /*  Click handler                                                  */
    /* -------------------------------------------------------------- */

    DK.on(tablist, 'click', function (e) {
      var tab = e.target.closest('.dk-vtabs_tab');
      if (tab) activate(tab);
    });

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    DK.on(tablist, 'keydown', function (e) {
      var idx = tabs.indexOf(document.activeElement);
      if (idx === -1) return;

      var next;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          next = tabs[(idx + 1) % tabs.length];
          break;
        case 'ArrowUp':
          e.preventDefault();
          next = tabs[(idx - 1 + tabs.length) % tabs.length];
          break;
        case 'Home':
          e.preventDefault();
          next = tabs[0];
          break;
        case 'End':
          e.preventDefault();
          next = tabs[tabs.length - 1];
          break;
      }

      if (next) activate(next);
    });

  });
})(window.DK);
