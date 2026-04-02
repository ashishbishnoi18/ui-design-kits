/**
 * DK Keyboard Shortcut Component
 * Renders keyboard shortcut display and optionally registers handlers.
 *
 * Usage:
 *   <!-- Display only -->
 *   <span class="dk-shortcut" data-dk-shortcut="ctrl+k">
 *     <kbd>Ctrl</kbd><span class="dk-shortcut_sep">+</span><kbd>K</kbd>
 *   </span>
 *
 *   <!-- With handler -->
 *   <span class="dk-shortcut" data-dk-shortcut="ctrl+k" data-dk-shortcut-action="openSearch">
 *     <kbd>Ctrl</kbd><span class="dk-shortcut_sep">+</span><kbd>K</kbd>
 *   </span>
 *
 * Combo format: "ctrl+shift+k", "meta+enter", "alt+1"
 * Modifier keys: ctrl, shift, alt, meta (Cmd on Mac)
 *
 * Events:
 *   dk:shortcut-triggered — detail: { combo, action }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var registeredShortcuts = [];

  /* ------------------------------------------------------------------ */
  /*  Parse combo string                                                 */
  /* ------------------------------------------------------------------ */

  function parseCombo(str) {
    var parts = str.toLowerCase().split('+').map(function (s) { return s.trim(); });
    return {
      ctrl:  parts.indexOf('ctrl') !== -1,
      shift: parts.indexOf('shift') !== -1,
      alt:   parts.indexOf('alt') !== -1,
      meta:  parts.indexOf('meta') !== -1 || parts.indexOf('cmd') !== -1,
      key:   parts.filter(function (p) {
        return ['ctrl', 'shift', 'alt', 'meta', 'cmd'].indexOf(p) === -1;
      })[0] || ''
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Match event to combo                                               */
  /* ------------------------------------------------------------------ */

  function matchCombo(e, combo) {
    if (combo.ctrl  !== e.ctrlKey)  return false;
    if (combo.shift !== e.shiftKey) return false;
    if (combo.alt   !== e.altKey)   return false;
    if (combo.meta  !== e.metaKey)  return false;
    return e.key.toLowerCase() === combo.key;
  }

  /* ------------------------------------------------------------------ */
  /*  Global keydown listener                                            */
  /* ------------------------------------------------------------------ */

  DK.on(document, 'keydown', function (e) {
    for (var i = 0; i < registeredShortcuts.length; i++) {
      var s = registeredShortcuts[i];
      if (matchCombo(e, s.combo)) {
        e.preventDefault();
        DK.emit(s.el, 'dk:shortcut-triggered', {
          combo: s.comboStr,
          action: s.action
        });
      }
    }
  });

  /* ------------------------------------------------------------------ */
  /*  Component registration                                             */
  /* ------------------------------------------------------------------ */

  DK.register('shortcut', function (el) {

    var comboStr = el.getAttribute('data-dk-shortcut');
    var action = el.getAttribute('data-dk-shortcut-action');

    if (!comboStr) return;

    /* Register the keyboard handler if action is specified */
    if (action) {
      var combo = parseCombo(comboStr);
      registeredShortcuts.push({
        el: el,
        combo: combo,
        comboStr: comboStr,
        action: action
      });
    }

  });

  /* Expose API */
  DK.shortcut = {
    register: function (comboStr, callback) {
      var combo = parseCombo(comboStr);
      var entry = {
        el: document.body,
        combo: combo,
        comboStr: comboStr,
        action: 'custom'
      };
      registeredShortcuts.push(entry);

      DK.on(document.body, 'dk:shortcut-triggered', function (e) {
        if (e.detail && e.detail.combo === comboStr) {
          callback(e);
        }
      });

      return function unregister() {
        var idx = registeredShortcuts.indexOf(entry);
        if (idx !== -1) registeredShortcuts.splice(idx, 1);
      };
    }
  };

})(window.DK);
