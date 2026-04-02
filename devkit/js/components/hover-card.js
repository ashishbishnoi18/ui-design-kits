/**
 * DK Hover Card Component
 * Rich content card that appears on hover with show/hide delays.
 *
 * Usage:
 *   <div class="dk-hover-card" data-dk-hover-card>
 *     <a class="dk-hover-card_trigger" href="#">@username</a>
 *     <div class="dk-hover-card_content">
 *       <div class="dk-hover-card_header">
 *         <img class="dk-hover-card_avatar" src="..." alt="" />
 *         <div>
 *           <div class="dk-hover-card_name">Name</div>
 *           <div class="dk-hover-card_handle">@username</div>
 *         </div>
 *       </div>
 *       <div class="dk-hover-card_body">Bio text here</div>
 *     </div>
 *   </div>
 *
 * Options:
 *   data-dk-hover-show="300"   — show delay in ms (default 300)
 *   data-dk-hover-hide="200"   — hide delay in ms (default 200)
 *
 * Events:
 *   dk:hover-card-open  — detail: { id }
 *   dk:hover-card-close — detail: { id }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('hover-card', function (el) {

    var trigger = DK.$('.dk-hover-card_trigger', el);
    var content = DK.$('.dk-hover-card_content', el);
    if (!trigger || !content) return;

    var showDelay = parseInt(el.getAttribute('data-dk-hover-show'), 10) || 300;
    var hideDelay = parseInt(el.getAttribute('data-dk-hover-hide'), 10) || 200;
    var showTimer = null;
    var hideTimer = null;

    /* -------------------------------------------------------------- */
    /*  ARIA setup                                                     */
    /* -------------------------------------------------------------- */

    var contentId = content.id || DK.uid('dk-hover-card');
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

      el.classList.remove('dk-hover-card--top', 'dk-hover-card--bottom');
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        el.classList.add('dk-hover-card--top');
      } else {
        el.classList.add('dk-hover-card--bottom');
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
        DK.emit(el, 'dk:hover-card-open', { id: contentId });
      }, showDelay);
    }

    function hide() {
      clearTimeout(showTimer);
      hideTimer = setTimeout(function () {
        el.classList.remove('is-open');
        DK.emit(el, 'dk:hover-card-close', { id: contentId });
      }, hideDelay);
    }

    /* -------------------------------------------------------------- */
    /*  Event handlers                                                 */
    /* -------------------------------------------------------------- */

    DK.on(trigger, 'mouseenter', show);
    DK.on(trigger, 'mouseleave', hide);

    DK.on(content, 'mouseenter', function () {
      clearTimeout(hideTimer);
    });

    DK.on(content, 'mouseleave', hide);

    /* Focus support */
    DK.on(trigger, 'focus', show);
    DK.on(trigger, 'blur', hide);

  });
})(window.DK);
