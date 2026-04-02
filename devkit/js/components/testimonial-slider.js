/**
 * DK Testimonial Slider Component
 * Carousel of testimonial slides with auto-advance and pause on hover.
 *
 * Usage:
 *   <div class="dk-testimonial-slider" data-dk-testimonial-slider
 *        data-dk-interval="5000">
 *     <div class="dk-testimonial-slider_track">
 *       <div class="dk-testimonial-slider_slide">...</div>
 *       <div class="dk-testimonial-slider_slide">...</div>
 *     </div>
 *     <div class="dk-testimonial-slider_nav">
 *       <button class="dk-testimonial-slider_prev" aria-label="Previous">
 *         <svg>...</svg>
 *       </button>
 *       <div class="dk-testimonial-slider_dots"></div>
 *       <button class="dk-testimonial-slider_next" aria-label="Next">
 *         <svg>...</svg>
 *       </button>
 *     </div>
 *   </div>
 *
 * Attributes:
 *   data-dk-interval — auto-advance interval in ms (default: 5000, 0 = off)
 *
 * Events:
 *   dk:slide-change — detail: { index, total }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  DK.register('testimonial-slider', function (el) {
    var track    = DK.$('.dk-testimonial-slider_track', el);
    var slides   = DK.$$('.dk-testimonial-slider_slide', el);
    var prevBtn  = DK.$('.dk-testimonial-slider_prev', el);
    var nextBtn  = DK.$('.dk-testimonial-slider_next', el);
    var dotsWrap = DK.$('.dk-testimonial-slider_dots', el);

    if (!track || slides.length < 2) return;

    var total    = slides.length;
    var current  = 0;
    var interval = parseInt(el.getAttribute('data-dk-interval'), 10);
    if (isNaN(interval)) interval = 5000;
    var timer    = null;

    /* -------------------------------------------------------------- */
    /*  Build dot indicators                                          */
    /* -------------------------------------------------------------- */

    var dots = [];
    if (dotsWrap) {
      for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.className = 'dk-testimonial-slider_dot';
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        dot.setAttribute('type', 'button');
        if (i === 0) dot.classList.add('is-active');
        dots.push(dot);
        dotsWrap.appendChild(dot);
      }
    }

    /* -------------------------------------------------------------- */
    /*  Go to slide                                                    */
    /* -------------------------------------------------------------- */

    function goTo(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;

      current = index;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';

      /* Update dots */
      for (var d = 0; d < dots.length; d++) {
        dots[d].classList.toggle('is-active', d === current);
      }

      /* Update prev/next disabled state */
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;

      /* Emit event */
      DK.emit(el, 'dk:slide-change', { index: current, total: total });
    }

    /* -------------------------------------------------------------- */
    /*  Auto-advance                                                   */
    /* -------------------------------------------------------------- */

    function startAuto() {
      stopAuto();
      if (interval > 0) {
        timer = setInterval(function () {
          goTo(current + 1);
        }, interval);
      }
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    /* Pause on hover */
    DK.on(el, 'mouseenter', stopAuto);
    DK.on(el, 'mouseleave', startAuto);

    /* Pause on focus within (keyboard users) */
    DK.on(el, 'focusin', stopAuto);
    DK.on(el, 'focusout', function (e) {
      if (!el.contains(e.relatedTarget)) startAuto();
    });

    /* -------------------------------------------------------------- */
    /*  Navigation buttons                                             */
    /* -------------------------------------------------------------- */

    if (prevBtn) {
      DK.on(prevBtn, 'click', function () {
        goTo(current - 1);
        startAuto(); // restart timer on manual nav
      });
    }

    if (nextBtn) {
      DK.on(nextBtn, 'click', function () {
        goTo(current + 1);
        startAuto();
      });
    }

    /* -------------------------------------------------------------- */
    /*  Dot click                                                      */
    /* -------------------------------------------------------------- */

    if (dotsWrap) {
      DK.on(dotsWrap, 'click', function (e) {
        var dot = e.target.closest('.dk-testimonial-slider_dot');
        if (!dot) return;
        var idx = dots.indexOf(dot);
        if (idx >= 0) {
          goTo(idx);
          startAuto();
        }
      });
    }

    /* -------------------------------------------------------------- */
    /*  Keyboard navigation                                            */
    /* -------------------------------------------------------------- */

    DK.on(el, 'keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goTo(current - 1);
        startAuto();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goTo(current + 1);
        startAuto();
      }
    });

    /* -------------------------------------------------------------- */
    /*  ARIA                                                           */
    /* -------------------------------------------------------------- */

    el.setAttribute('role', 'region');
    el.setAttribute('aria-roledescription', 'carousel');
    if (!el.getAttribute('aria-label')) {
      el.setAttribute('aria-label', 'Testimonials');
    }

    slides.forEach(function (slide, idx) {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', 'Slide ' + (idx + 1) + ' of ' + total);
    });

    /* -------------------------------------------------------------- */
    /*  Init                                                           */
    /* -------------------------------------------------------------- */

    goTo(0);
    startAuto();
  });

})(window.DK);
