/**
 * DK QR Code Component
 * Generates a QR code as an SVG element using a simple QR encoding algorithm.
 * @requires dk-core.js
 */
;(function (DK) {
  'use strict';

  /* ================================================================== */
  /*  Minimal QR encoder (Version 1-4, Mode Byte, ECC L)                */
  /*  Simplified implementation for short text/URLs.                     */
  /* ================================================================== */

  var ALIGNMENT = { 2: [6, 18], 3: [6, 22], 4: [6, 26] };
  var EC_CODEWORDS = { 1: 7, 2: 10, 3: 15, 4: 20 };
  var DATA_CAPACITY = { 1: 17, 2: 32, 3: 53, 4: 78 };
  var SIZES = { 1: 21, 2: 25, 3: 29, 4: 33 };

  /* ---- Galois Field GF(256) tables ---- */

  var EXP = new Array(256);
  var LOG = new Array(256);

  (function () {
    var x = 1;
    for (var i = 0; i < 256; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x >= 256) x ^= 0x11d;
    }
    LOG[0] = undefined;
  })();

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
  }

  /* ---- Reed-Solomon ECC ---- */

  function rsGenPoly(n) {
    var poly = [1];
    for (var i = 0; i < n; i++) {
      var next = new Array(poly.length + 1);
      for (var j = 0; j < next.length; j++) next[j] = 0;
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var msg = new Array(data.length + ecLen);
    for (var i = 0; i < msg.length; i++) msg[i] = 0;
    for (var i = 0; i < data.length; i++) msg[i] = data[i];

    for (var i = 0; i < data.length; i++) {
      var coef = msg[i];
      if (coef === 0) continue;
      for (var j = 0; j < gen.length; j++) {
        msg[i + j] ^= gfMul(gen[j], coef);
      }
    }

    return msg.slice(data.length);
  }

  /* ---- Bit stream helpers ---- */

  function BitStream() {
    this.bits = [];
  }

  BitStream.prototype.push = function (val, len) {
    for (var i = len - 1; i >= 0; i--) {
      this.bits.push((val >> i) & 1);
    }
  };

  BitStream.prototype.toBytes = function () {
    while (this.bits.length % 8 !== 0) this.bits.push(0);
    var bytes = [];
    for (var i = 0; i < this.bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | this.bits[i + j];
      bytes.push(b);
    }
    return bytes;
  };

  /* ---- Data encoding (byte mode) ---- */

  function encodeData(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 128) {
        bytes.push(c);
      } else if (c < 2048) {
        bytes.push(0xc0 | (c >> 6));
        bytes.push(0x80 | (c & 0x3f));
      } else {
        bytes.push(0xe0 | (c >> 12));
        bytes.push(0x80 | ((c >> 6) & 0x3f));
        bytes.push(0x80 | (c & 0x3f));
      }
    }

    // Determine version
    var version = 1;
    for (var v = 1; v <= 4; v++) {
      if (bytes.length <= DATA_CAPACITY[v]) { version = v; break; }
      if (v === 4) version = 4;
    }

    var dataCapacity = DATA_CAPACITY[version];
    var ecCount = EC_CODEWORDS[version];

    var bs = new BitStream();
    bs.push(0b0100, 4); // byte mode indicator
    bs.push(bytes.length, version >= 1 ? 8 : 16); // character count

    for (var i = 0; i < bytes.length; i++) {
      bs.push(bytes[i], 8);
    }

    bs.push(0, 4); // terminator

    var dataBytes = bs.toBytes();

    // Pad to capacity
    var padPatterns = [0xEC, 0x11];
    var padIdx = 0;
    while (dataBytes.length < dataCapacity) {
      dataBytes.push(padPatterns[padIdx % 2]);
      padIdx++;
    }

    dataBytes = dataBytes.slice(0, dataCapacity);

    var ecBytes = rsEncode(dataBytes, ecCount);

    return { version: version, data: dataBytes.concat(ecBytes) };
  }

  /* ---- Matrix construction ---- */

  function createMatrix(version) {
    var size = SIZES[version];
    var matrix = [];
    var reserved = [];
    for (var r = 0; r < size; r++) {
      matrix[r] = new Array(size);
      reserved[r] = new Array(size);
      for (var c = 0; c < size; c++) {
        matrix[r][c] = 0;
        reserved[r][c] = false;
      }
    }
    return { matrix: matrix, reserved: reserved, size: size };
  }

  function placeFinderPattern(m, row, col) {
    for (var r = -1; r <= 7; r++) {
      for (var c = -1; c <= 7; c++) {
        var rr = row + r, cc = col + c;
        if (rr < 0 || rr >= m.size || cc < 0 || cc >= m.size) continue;
        var v = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        m.matrix[rr][cc] = v ? 1 : 0;
        m.reserved[rr][cc] = true;
      }
    }
  }

  function placeTimingPatterns(m) {
    for (var i = 8; i < m.size - 8; i++) {
      m.matrix[6][i] = i % 2 === 0 ? 1 : 0;
      m.reserved[6][i] = true;
      m.matrix[i][6] = i % 2 === 0 ? 1 : 0;
      m.reserved[i][6] = true;
    }
  }

  function placeAlignmentPattern(m, version) {
    var positions = ALIGNMENT[version];
    if (!positions) return;
    for (var i = 0; i < positions.length; i++) {
      for (var j = 0; j < positions.length; j++) {
        var r = positions[i], c = positions[j];
        // Skip if overlaps with finder pattern
        if ((r <= 8 && c <= 8) || (r <= 8 && c >= m.size - 8) || (r >= m.size - 8 && c <= 8)) continue;
        for (var dr = -2; dr <= 2; dr++) {
          for (var dc = -2; dc <= 2; dc++) {
            var v = Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0);
            m.matrix[r + dr][c + dc] = v ? 1 : 0;
            m.reserved[r + dr][c + dc] = true;
          }
        }
      }
    }
  }

  function reserveFormatInfo(m) {
    for (var i = 0; i <= 8; i++) {
      if (i < m.size) { m.reserved[8][i] = true; m.reserved[i][8] = true; }
    }
    for (var i = 0; i < 8; i++) {
      m.reserved[8][m.size - 1 - i] = true;
      m.reserved[m.size - 1 - i][8] = true;
    }
    m.matrix[m.size - 8][8] = 1;
    m.reserved[m.size - 8][8] = true;
  }

  function placeData(m, data) {
    var bitIdx = 0;
    var totalBits = data.length * 8;
    var isUpward = true;

    for (var col = m.size - 1; col >= 0; col -= 2) {
      if (col === 6) col = 5; // skip timing column

      var rows = isUpward
        ? (function (s) { var a = []; for (var i = s - 1; i >= 0; i--) a.push(i); return a; })(m.size)
        : (function (s) { var a = []; for (var i = 0; i < s; i++) a.push(i); return a; })(m.size);

      for (var ri = 0; ri < rows.length; ri++) {
        var r = rows[ri];
        for (var dc = 0; dc <= 1; dc++) {
          var c = col - dc;
          if (c < 0) continue;
          if (m.reserved[r][c]) continue;
          if (bitIdx < totalBits) {
            var byteIdx = Math.floor(bitIdx / 8);
            var bitPos = 7 - (bitIdx % 8);
            m.matrix[r][c] = (data[byteIdx] >> bitPos) & 1;
            bitIdx++;
          }
        }
      }

      isUpward = !isUpward;
    }
  }

  function applyMask0(m) {
    for (var r = 0; r < m.size; r++) {
      for (var c = 0; c < m.size; c++) {
        if (!m.reserved[r][c] && (r + c) % 2 === 0) {
          m.matrix[r][c] ^= 1;
        }
      }
    }
  }

  function placeFormatInfo(m) {
    // Format info for ECC L + mask 0: pre-computed
    var FORMAT_BITS = 0x77c4;
    var bits = [];
    for (var i = 14; i >= 0; i--) bits.push((FORMAT_BITS >> i) & 1);

    // Around top-left finder
    for (var i = 0; i <= 5; i++) m.matrix[8][i] = bits[i];
    m.matrix[8][7] = bits[6];
    m.matrix[8][8] = bits[7];
    m.matrix[7][8] = bits[8];
    for (var i = 9; i <= 14; i++) m.matrix[14 - i][8] = bits[i];

    // Around other finders
    for (var i = 0; i <= 7; i++) m.matrix[8][m.size - 1 - i] = bits[i];
    for (var i = 0; i <= 6; i++) m.matrix[m.size - 1 - i][8] = bits[14 - i];
  }

  /* ---- Generate full QR matrix ---- */

  function generateQR(text) {
    var encoded = encodeData(text);
    var m = createMatrix(encoded.version);

    placeFinderPattern(m, 0, 0);
    placeFinderPattern(m, 0, m.size - 7);
    placeFinderPattern(m, m.size - 7, 0);
    placeTimingPatterns(m);
    placeAlignmentPattern(m, encoded.version);
    reserveFormatInfo(m);
    placeData(m, encoded.data);
    applyMask0(m);
    placeFormatInfo(m);

    return m;
  }

  /* ---- Render as SVG ---- */

  function renderSVG(m, fgColor, bgColor) {
    var size = m.size;
    var q = 4; // quiet zone
    var total = size + q * 2;

    var paths = [];
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (m.matrix[r][c]) {
          paths.push('M' + (c + q) + ',' + (r + q) + 'h1v1h-1z');
        }
      }
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + bgColor + '"/>' +
      '<path d="' + paths.join('') + '" fill="' + fgColor + '"/>' +
      '</svg>';
  }

  /* ================================================================== */
  /*  Component                                                          */
  /* ================================================================== */

  DK.register('qr', function (el) {
    var text = el.getAttribute('data-dk-qr');
    if (!text || text === 'true') return;

    el.classList.add('dk-qr');

    var style = getComputedStyle(el);
    var fgColor = style.getPropertyValue('--text-primary').trim() || '#e5e5e5';
    var bgColor = 'transparent';

    try {
      var m = generateQR(text);
      el.innerHTML = renderSVG(m, fgColor, bgColor);
    } catch (err) {
      console.warn('DK qr-code: generation failed', err);
      el.textContent = 'QR Error';
    }
  });

})(window.DK);
