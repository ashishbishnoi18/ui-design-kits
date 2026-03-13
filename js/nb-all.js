/**
 * NB All — Neo Brutalism UI Kit Loader
 * Dynamically loads nb-core.js and all component scripts in the correct order.
 * Include this single file to get the entire UI kit.
 *
 * Usage:
 *   <script src="js/nb-all.js"></script>
 *
 * @version 1.0.0
 */
;(function () {
  'use strict';

  var base = '';
  var currentScript = document.currentScript;

  if (currentScript && currentScript.src) {
    base = currentScript.src.replace(/[^/]*$/, '');
  }

  var scripts = [
    'nb-core.js',
    'components/modal.js',
    'components/toast.js',
    'components/dropdown.js',
    'components/tabs.js',
    'components/accordion.js',
    'components/tooltip.js',
    'components/select.js',
    'components/toggle.js',
    'components/file-upload.js',
    'components/table-sort.js',
    'components/password-toggle.js',
    'components/alert-dismiss.js',
    'components/navbar-mobile.js',
    'components/sidebar-toggle.js',
    'components/date-display.js',
    'components/calendar.js',
    'components/search.js'
  ];

  scripts.forEach(function (src) {
    document.write('<script src="' + base + src + '"><\/script>');
  });
})();
