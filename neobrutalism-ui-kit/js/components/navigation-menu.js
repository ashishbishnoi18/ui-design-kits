/**
 * NB Navigation Menu Component
 * Mega-menu style navigation with multi-column content panels.
 *
 * Usage:
 *   <nav class="nb-nav-menu" data-nb-nav-menu>
 *     <button class="nb-nav-menu_trigger" data-nb-nav-target="panel-1">Products</button>
 *     <button class="nb-nav-menu_trigger" data-nb-nav-target="panel-2">Resources</button>
 *
 *     <div class="nb-nav-menu_content" id="panel-1">
 *       <div class="nb-nav-menu_columns">
 *         <div class="nb-nav-menu_column">
 *           <div class="nb-nav-menu_heading">Platform</div>
 *           <a href="#" class="nb-nav-menu_link">
 *             <span class="nb-nav-menu_link-title">API</span>
 *             <span class="nb-nav-menu_link-desc">Build integrations</span>
 *           </a>
 *         </div>
 *       </div>
 *     </div>
 *   </nav>
 *
 * Events:
 *   nb:nav-menu-open  — detail: { trigger, panel }
 *   nb:nav-menu-close — detail: { trigger, panel }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('nav-menu', function (el) {

    var triggers = NB.$$('.nb-nav-menu_trigger', el);
    var panels = NB.$$('.nb-nav-menu_content', el);
    var activePanel = null;
    var activeTrigger = null;
    var closeTimer = null;

    if (!triggers.length) return;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      var targetId = trigger.getAttribute('data-nb-nav-target');
      if (targetId) {
        trigger.setAttribute('aria-haspopup', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-controls', targetId);
      }
    });

    panels.forEach(function (panel) {
      panel.setAttribute('aria-hidden', 'true');
    });

    /* -------------------------------------------------------------- */
    /*  Open / Close                                                   */
    /* -------------------------------------------------------------- */

    function openPanel(trigger) {
      if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }

      var targetId = trigger.getAttribute('data-nb-nav-target');
      var panel = targetId ? document.getElementById(targetId) : null;
      if (!panel) return;

      if (activePanel && activePanel !== panel) {
        closePanel();
      }

      activeTrigger = trigger;
      activePanel = panel;

      trigger.classList.add('is-active');
      trigger.setAttribute('aria-expanded', 'true');
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');

      NB.emit(el, 'nb:nav-menu-open', { trigger: trigger, panel: panel });
    }

    function closePanel() {
      if (!activePanel) return;

      activeTrigger.classList.remove('is-active');
      activeTrigger.setAttribute('aria-expanded', 'false');
      activePanel.classList.remove('is-open');
      activePanel.setAttribute('aria-hidden', 'true');

      NB.emit(el, 'nb:nav-menu-close', { trigger: activeTrigger, panel: activePanel });

      activePanel = null;
      activeTrigger = null;
    }

    function scheduleClose() {
      closeTimer = setTimeout(closePanel, 150);
    }

    /* -------------------------------------------------------------- */
    /*  Event handlers                                                 */
    /* -------------------------------------------------------------- */

    triggers.forEach(function (trigger) {
      NB.on(trigger, 'click', function (e) {
        e.preventDefault();
        if (activeTrigger === trigger) {
          closePanel();
        } else {
          openPanel(trigger);
        }
      });

      NB.on(trigger, 'mouseenter', function () {
        openPanel(trigger);
      });

      NB.on(trigger, 'mouseleave', function () {
        scheduleClose();
      });
    });

    panels.forEach(function (panel) {
      NB.on(panel, 'mouseenter', function () {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
      });

      NB.on(panel, 'mouseleave', function () {
        scheduleClose();
      });
    });

    /* Escape closes */
    NB.on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && activePanel) {
        closePanel();
        if (activeTrigger) activeTrigger.focus();
      }
    });

    /* Close on outside click */
    NB.on(document, 'click', function (e) {
      if (activePanel && !el.contains(e.target)) {
        closePanel();
      }
    });

  });
})(window.NB);
