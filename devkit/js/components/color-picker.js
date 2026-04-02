/**
 * DK Color Picker Component
 * Hue slider + saturation/brightness area + hex input + preset swatches.
 *
 * Usage:
 *   <div data-dk-color-picker="#10b981" class="dk-color-picker">
 *     <button type="button" class="dk-color-picker_trigger">
 *       <span class="dk-color-picker_swatch"></span>
 *       <span class="dk-color-picker_value">#10b981</span>
 *     </button>
 *   </div>
 *
 * Attributes:
 *   data-dk-color-picker — default hex value (e.g. "#10b981")
 *
 * Events:
 *   dk:color-change — detail: { hex: string, rgb: {r,g,b}, hsl: {h,s,l} }
 *
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  var DEFAULT_PRESETS = [
    '#ef4444','#f97316','#eab308','#22c55e','#10b981','#06b6d4','#3b82f6','#8b5cf6',
    '#ec4899','#f43f5e','#14b8a6','#6366f1','#a855f7','#d946ef','#64748b','#ffffff'
  ];

  DK.register('color-picker', function (el) {

    var trigger = DK.$('.dk-color-picker_trigger', el);
    var swatch = DK.$('.dk-color-picker_swatch', el);
    var valueEl = DK.$('.dk-color-picker_value', el);
    if (!trigger) return;

    var defaultVal = el.getAttribute('data-dk-color-picker') || '#10b981';
    var hsv = { h: 0, s: 100, v: 100 }; // internal HSV
    var dropdown = null;
    var areaEl = null;
    var areaCursor = null;
    var hueEl = null;
    var hueThumb = null;
    var hexInput = null;
    var previewEl = null;
    var releaseFocus = null;
    var draggingArea = false;
    var draggingHue = false;

    /* ---------------------------------------------------------------- */
    /*  Color conversion                                                 */
    /* ---------------------------------------------------------------- */

    function hsvToRgb(h, s, v) {
      s /= 100; v /= 100;
      var c = v * s;
      var x = c * (1 - Math.abs((h / 60) % 2 - 1));
      var m = v - c;
      var r, g, b;
      if (h < 60)       { r = c; g = x; b = 0; }
      else if (h < 120) { r = x; g = c; b = 0; }
      else if (h < 180) { r = 0; g = c; b = x; }
      else if (h < 240) { r = 0; g = x; b = c; }
      else if (h < 300) { r = x; g = 0; b = c; }
      else              { r = c; g = 0; b = x; }
      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
      };
    }

    function rgbToHsv(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var d = max - min;
      var h = 0, s = max === 0 ? 0 : d / max, v = max;
      if (d !== 0) {
        if (max === r) h = ((g - b) / d + 6) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(v * 100) };
    }

    function rgbToHex(r, g, b) {
      return '#' + [r, g, b].map(function (c) {
        return c.toString(16).padStart(2, '0');
      }).join('');
    }

    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    }

    function rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h = 0, s = 0, l = (max + min) / 2;
      if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = ((g - b) / d + 6) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
      }
      return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function getHex() {
      var rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    }

    /* ---------------------------------------------------------------- */
    /*  Build DOM                                                        */
    /* ---------------------------------------------------------------- */

    function build() {
      dropdown = document.createElement('div');
      dropdown.className = 'dk-color-picker_dropdown';
      dropdown.setAttribute('role', 'dialog');
      dropdown.setAttribute('aria-modal', 'true');
      dropdown.setAttribute('aria-label', 'Choose color');

      // Sat/Brightness area
      areaEl = document.createElement('div');
      areaEl.className = 'dk-color-picker_area';

      var areaBase = document.createElement('div');
      areaBase.className = 'dk-color-picker_area-gradient';

      var areaWhite = document.createElement('div');
      areaWhite.className = 'dk-color-picker_area-gradient dk-color-picker_area-white';

      var areaBlack = document.createElement('div');
      areaBlack.className = 'dk-color-picker_area-gradient dk-color-picker_area-black';

      areaCursor = document.createElement('div');
      areaCursor.className = 'dk-color-picker_area-cursor';

      areaEl.appendChild(areaBase);
      areaEl.appendChild(areaWhite);
      areaEl.appendChild(areaBlack);
      areaEl.appendChild(areaCursor);
      dropdown.appendChild(areaEl);

      // Hue slider
      hueEl = document.createElement('div');
      hueEl.className = 'dk-color-picker_hue';
      hueEl.setAttribute('role', 'slider');
      hueEl.setAttribute('aria-label', 'Hue');
      hueEl.setAttribute('aria-valuemin', '0');
      hueEl.setAttribute('aria-valuemax', '360');
      hueEl.setAttribute('tabindex', '0');

      hueThumb = document.createElement('div');
      hueThumb.className = 'dk-color-picker_hue-thumb';
      hueEl.appendChild(hueThumb);
      dropdown.appendChild(hueEl);

      // Hex row
      var hexRow = document.createElement('div');
      hexRow.className = 'dk-color-picker_hex-row';

      var hexLabel = document.createElement('span');
      hexLabel.className = 'dk-color-picker_hex-label';
      hexLabel.textContent = 'Hex';

      hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.className = 'dk-color-picker_hex-input';
      hexInput.setAttribute('maxlength', '7');
      hexInput.setAttribute('aria-label', 'Hex color value');

      previewEl = document.createElement('div');
      previewEl.className = 'dk-color-picker_preview';

      hexRow.appendChild(hexLabel);
      hexRow.appendChild(hexInput);
      hexRow.appendChild(previewEl);
      dropdown.appendChild(hexRow);

      // Preset swatches
      var swatches = document.createElement('div');
      swatches.className = 'dk-color-picker_swatches';

      DEFAULT_PRESETS.forEach(function (color) {
        var preset = document.createElement('button');
        preset.type = 'button';
        preset.className = 'dk-color-picker_preset';
        preset.style.background = color;
        preset.setAttribute('data-color', color);
        preset.setAttribute('aria-label', 'Color ' + color);
        preset.setAttribute('tabindex', '-1');
        DK.on(preset, 'click', function (e) {
          e.stopPropagation();
          setFromHex(color);
        });
        swatches.appendChild(preset);
      });
      dropdown.appendChild(swatches);

      el.appendChild(dropdown);

      // Event bindings for area/hue
      bindAreaEvents();
      bindHueEvents();

      DK.on(hexInput, 'change', function () {
        var val = hexInput.value.trim();
        if (/^#?[0-9a-fA-F]{3,6}$/.test(val)) {
          if (val[0] !== '#') val = '#' + val;
          setFromHex(val);
        }
      });
    }

    /* ---------------------------------------------------------------- */
    /*  Area (saturation/brightness) drag                                */
    /* ---------------------------------------------------------------- */

    function bindAreaEvents() {
      DK.on(areaEl, 'mousedown', function (e) {
        e.preventDefault();
        draggingArea = true;
        updateAreaFromEvent(e);
      });
      DK.on(document, 'mousemove', function (e) {
        if (!draggingArea) return;
        e.preventDefault();
        updateAreaFromEvent(e);
      });
      DK.on(document, 'mouseup', function () {
        draggingArea = false;
      });
    }

    function updateAreaFromEvent(e) {
      var rect = areaEl.getBoundingClientRect();
      var x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      var y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
      hsv.s = Math.round((x / rect.width) * 100);
      hsv.v = Math.round(100 - (y / rect.height) * 100);
      updateUI();
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Hue slider drag                                                  */
    /* ---------------------------------------------------------------- */

    function bindHueEvents() {
      DK.on(hueEl, 'mousedown', function (e) {
        e.preventDefault();
        draggingHue = true;
        updateHueFromEvent(e);
      });
      DK.on(document, 'mousemove', function (e) {
        if (!draggingHue) return;
        e.preventDefault();
        updateHueFromEvent(e);
      });
      DK.on(document, 'mouseup', function () {
        draggingHue = false;
      });

      // Keyboard on hue slider
      DK.on(hueEl, 'keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          hsv.h = Math.min(360, hsv.h + 1);
          updateUI(); emitChange();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          hsv.h = Math.max(0, hsv.h - 1);
          updateUI(); emitChange();
        }
      });
    }

    function updateHueFromEvent(e) {
      var rect = hueEl.getBoundingClientRect();
      var x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      hsv.h = Math.round((x / rect.width) * 360);
      updateUI();
      emitChange();
    }

    /* ---------------------------------------------------------------- */
    /*  Update UI                                                        */
    /* ---------------------------------------------------------------- */

    function updateUI() {
      var hex = getHex();
      var hueColor = 'hsl(' + hsv.h + ', 100%, 50%)';

      // Area background = pure hue
      var areaBase = areaEl.querySelector('.dk-color-picker_area-gradient');
      areaBase.style.background = hueColor;

      // Cursor position
      areaCursor.style.left = hsv.s + '%';
      areaCursor.style.top = (100 - hsv.v) + '%';

      // Hue thumb
      hueThumb.style.left = (hsv.h / 360 * 100) + '%';
      hueThumb.style.background = hueColor;
      hueEl.setAttribute('aria-valuenow', hsv.h);

      // Hex input
      hexInput.value = hex;
      previewEl.style.background = hex;

      // Trigger swatch
      if (swatch) swatch.style.background = hex;
      if (valueEl) valueEl.textContent = hex;

      // Highlight active preset
      DK.$$('.dk-color-picker_preset', dropdown).forEach(function (p) {
        p.classList.toggle('is-active',
          p.getAttribute('data-color').toLowerCase() === hex.toLowerCase());
      });
    }

    function setFromHex(hex) {
      var rgb = hexToRgb(hex);
      hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      updateUI();
      emitChange();
    }

    function emitChange() {
      var hex = getHex();
      var rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      DK.emit(el, 'dk:color-change', { hex: hex, rgb: rgb, hsl: hsl });
    }

    /* ---------------------------------------------------------------- */
    /*  Open / close                                                     */
    /* ---------------------------------------------------------------- */

    function isOpen() { return el.classList.contains('is-open'); }

    function open() {
      if (isOpen()) return;
      el.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      updateUI();
      releaseFocus = DK.trapFocus(dropdown);
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      if (releaseFocus) { releaseFocus(); releaseFocus = null; }
      trigger.focus();
    }

    /* ---------------------------------------------------------------- */
    /*  Keyboard                                                         */
    /* ---------------------------------------------------------------- */

    function handleKeydown(e) {
      if (e.key === 'Escape' && isOpen()) {
        e.preventDefault();
        close();
      }
    }

    function handleOutsideClick(e) {
      if (isOpen() && !el.contains(e.target)) close();
    }

    /* ---------------------------------------------------------------- */
    /*  ARIA                                                             */
    /* ---------------------------------------------------------------- */

    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-expanded', 'false');

    /* ---------------------------------------------------------------- */
    /*  Init                                                             */
    /* ---------------------------------------------------------------- */

    build();
    setFromHex(defaultVal);

    DK.on(trigger, 'click', function (e) {
      e.stopPropagation();
      isOpen() ? close() : open();
    });
    DK.on(el, 'keydown', handleKeydown);
    DK.on(document, 'click', handleOutsideClick);
  });

})(window.DK);
