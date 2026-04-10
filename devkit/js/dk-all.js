/**
 * DK All -- DevKit UI Loader
 * Dynamically loads dk-core.js and all component scripts in the correct order.
 * Include this single file to get the entire DevKit.
 *
 * Usage:
 *   <script src="devkit/js/dk-all.js"></script>
 *
 * @version 0.1.0
 */
;(function () {
  'use strict';

  var base = '';
  var currentScript = document.currentScript;

  if (currentScript && currentScript.src) {
    base = currentScript.src.replace(/[^/]*$/, '');
  }

  var scripts = [
    'dk-core.js',

    /* Forms */
    'components/toggle.js',
    'components/select.js',
    'components/search.js',
    'components/password-toggle.js',
    'components/range.js',
    'components/checkbox.js',
    'components/radio.js',
    'components/file-upload.js',
    'components/tag-input.js',
    'components/number-input.js',
    'components/pin-input.js',
    'components/combobox.js',
    'components/multiselect.js',
    'components/checkbox-card.js',
    'components/radio-card.js',
    'components/toggle-group.js',
    'components/segmented-control.js',

    /* Complex forms */
    'components/date-picker.js',
    'components/time-picker.js',
    'components/date-range-picker.js',
    'components/color-picker.js',
    'components/rating.js',
    'components/rich-text-editor.js',
    'components/editable-text.js',

    /* Data display */
    'components/data-table.js',
    'components/accordion.js',
    'components/calendar.js',
    'components/date-display.js',
    'components/marquee.js',
    'components/json-viewer.js',
    'components/clipboard.js',
    'components/qr-code.js',
    'components/tree-view.js',
    'components/code-block.js',
    'components/kv-editor.js',

    /* Feedback */
    'components/alert-dismiss.js',
    'components/modal.js',
    'components/drawer.js',
    'components/tooltip.js',
    'components/toast.js',
    'components/popover.js',
    'components/hover-card.js',

    /* Marketing */
    'components/pricing-table.js',
    'components/testimonial-slider.js',
    'components/faq.js',
    'components/announcement-bar.js',
    'components/countdown.js',

    /* Application */
    'components/api-playground.js',
    'components/notification-center.js',
    'components/comment-thread.js',
    'components/chat-interface.js',
    'components/checkout-stepper.js',
    'components/kanban-board.js',
    'components/file-browser.js',

    /* Navigation */
    'components/navbar.js',
    'components/sidebar.js',
    'components/tabs.js',
    'components/stepper.js',
    'components/dropdown.js',
    'components/vertical-tabs.js',
    'components/context-menu.js',
    'components/menubar.js',
    'components/navigation-menu.js',
    'components/command-palette.js',

    /* Layout extras */
    'components/scroll-area.js',
    'components/splitter.js',

    /* Utilities */
    'components/theme-toggle.js',
    'components/portal.js',
    'components/presence.js',
    'components/focus-trap.js',
    'components/keyboard-shortcut.js'
  ];

  scripts.forEach(function (src) {
    document.write('<script src="' + base + src + '"><\/script>');
  });
})();
