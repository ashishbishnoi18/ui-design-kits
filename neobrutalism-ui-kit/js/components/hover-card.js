/**
 * NB Hover Card Component
 * Rich content card that appears on hover with show/hide delays.
 *
 * Usage:
 *   <div class="nb-hover-card" data-nb-hover-card>
 *     <a class="nb-hover-card_trigger" href="#">@username</a>
 *     <div class="nb-hover-card_content">
 *       <div class="nb-hover-card_header">
 *         <img class="nb-hover-card_avatar" src="..." alt="" />
 *         <div>
 *           <div class="nb-hover-card_name">Name</div>
 *           <div class="nb-hover-card_handle">@username</div>
 *         </div>
 *       </div>
 *       <div class="nb-hover-card_body">Bio text here</div>
 *     </div>
 *   </div>
 *
 * Options:
 *   data-nb-hover-show="300"   — show delay in ms (default 300)
 *   data-nb-hover-hide="200"   — hide delay in ms (default 200)
 *
 * Events:
 *   nb:hover-card-open  — detail: { id }
 *   nb:hover-card-close — detail: { id }
 *
 * @requires nb-core.js
 */
;(function (NB) {
  'use strict';

  NB.register('hover-card', function (el) {

    var trigger = NB.$('.nb-hover-card_trigger', el);
    var content = NB.$('.nb-hover-card_content', el);
    if (!trigger || !content) return;

    var showDelay = parseInt(el.getAttribute('data-nb-hover-show'), 10) || 300;
    var hideDelay = parseInt(el.getAttribute('data-nb-hover-hide'), 10) || 200;
    var showTimer = null;
    var hideTimer = null;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var contentId = content.id || NB.uid('nb-hover-card');
    content.id = contentId;
    content.setAttribute('role', 'tooltip');
    trigger.setAttribute('aria-describedby', contentId);

    /* -------------------------------------------------------------- */
    /*  Auto-position                                                  */
    /* -------------------------------------------------------------- */

    function autoPosition() {
      var rect = el.getBoundingClientRect();
      var spaceBelow = window.innerHeight - rect.bottom;
      var spaceAbove = rect.top;

      el.classList.remove('nb-hover-card--top', 'nb-hover-card--bottom');
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        el.classList.add('nb-hover-card--top');
      } else {
        el.classList.add('nb-hover-card--bottom');
      }
    }

    /* -------------------------------------------------------------- */
    /*  Show / Hide                                                    */
    /* -------------------------------------------------------------- */

    function show() {
      clearTimeout(hideTimer);
      showTimer = setTimeout(function () {
        autoPosition();
        el.classList.add('is-open');
        NB.emit(el, 'nb:hover-card-open', { id: contentId });
      }, showDelay);
    }

    function hide() {
      clearTimeout(showTimer);
      hideTimer = setTimeout(function () {
        el.classList.remove('is-open');
        NB.emit(el, 'nb:hover-card-close', { id: contentId });
      }, hideDelay);
    }

    /* -------------------------------------------------------------- */
    /*  Event handlers                                                 */
    /* -------------------------------------------------------------- */

    NB.on(trigger, 'mouseenter', show);
    NB.on(trigger, 'mouseleave', hide);

    NB.on(content, 'mouseenter', function () {
      clearTimeout(hideTimer);
    });

    NB.on(content, 'mouseleave', hide);

    /* Focus support */
    NB.on(trigger, 'focus', show);
    NB.on(trigger, 'blur', hide);

  });
})(window.NB);
