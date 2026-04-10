#!/usr/bin/env node
/**
 * Build Script — JS Bundle
 * Concatenates dk-core.js and all component scripts into a single file,
 * then minifies it. No external dependencies required.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', 'js');
const LOADER = path.join(JS_DIR, 'dk-all.js');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUT = path.join(DIST_DIR, 'devkit.js');
const OUT_MIN = path.join(DIST_DIR, 'devkit.min.js');
const OUT_MAP = path.join(DIST_DIR, 'devkit.js.map');

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const VERSION = pkg.version;

/**
 * VLQ encoding for source maps.
 */
function toVLQ(value) {
  let vlq = value < 0 ? ((-value) << 1) | 1 : value << 1;
  let encoded = '';
  const VLQ_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  do {
    let digit = vlq & 0x1F;
    vlq >>>= 5;
    if (vlq > 0) digit |= 0x20;
    encoded += VLQ_CHARS[digit];
  } while (vlq > 0);
  return encoded;
}

/**
 * Generate a v3 source map JSON for the bundled JS.
 */
function generateSourceMap(bundledContent, scriptEntries) {
  const sourceFiles = [];
  const sourcesContent = [];
  const lineRanges = []; // { sourceIndex, startLine (in bundle), lineCount }

  for (const entry of scriptEntries) {
    const relativePath = path.relative(DIST_DIR, entry.filePath);
    sourceFiles.push(relativePath);
    sourcesContent.push(entry.content);
    lineRanges.push({
      sourceIndex: sourceFiles.length - 1,
      startLine: entry.startLine,
      lineCount: entry.content.split('\n').length
    });
  }

  const bundledLines = bundledContent.split('\n');
  const mappingLines = [];
  let prevSourceIndex = 0;
  let prevSourceLine = 0;

  for (let i = 0; i < bundledLines.length; i++) {
    // Find which source file this line belongs to
    let mapped = false;
    for (const range of lineRanges) {
      if (i >= range.startLine && i < range.startLine + range.lineCount) {
        const sourceLine = i - range.startLine;
        const srcIndexDelta = range.sourceIndex - prevSourceIndex;
        const srcLineDelta = sourceLine - prevSourceLine;

        mappingLines.push(
          toVLQ(0) + toVLQ(srcIndexDelta) + toVLQ(srcLineDelta) + toVLQ(0)
        );

        prevSourceIndex = range.sourceIndex;
        prevSourceLine = sourceLine;
        mapped = true;
        break;
      }
    }
    if (!mapped) {
      mappingLines.push('');
    }
  }

  return JSON.stringify({
    version: 3,
    file: 'devkit.js',
    sources: sourceFiles,
    sourcesContent: sourcesContent,
    mappings: mappingLines.join(';')
  });
}

/**
 * Basic JS minification — removes comments and collapses whitespace.
 * For production, consider using terser for better results.
 */
function minify(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')            // block comments
    .replace(/(?<![:'"])\/\/(?!['"]).*/g, '')      // line comments (rough)
    .replace(/\n\s*\n/g, '\n')                    // blank lines
    .replace(/^\s+/gm, '')                        // leading whitespace
    .trim();
}

try {
  // Read dk-all.js to get the script list in correct order
  const loaderSrc = fs.readFileSync(LOADER, 'utf8');
  const scriptMatches = loaderSrc.match(/'([^']+\.js)'/g);

  if (!scriptMatches) {
    console.warn('No scripts found in dk-all.js — creating empty bundle.');
    const BANNER = `/*! DevKit v${VERSION} | MIT License */\n`;
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, BANNER + '/* No scripts bundled */\n', 'utf8');
    fs.writeFileSync(OUT_MIN, BANNER, 'utf8');
    console.log('Done (empty bundle).');
    process.exit(0);
  }

  const scripts = scriptMatches.map(s => s.replace(/'/g, ''));

  console.log('Building JS bundle...');

  const BANNER = `/*! DevKit v${VERSION} | MIT License */\n`;
  const parts = [];
  const scriptEntries = []; // Track file paths and line positions for source map
  let currentLine = BANNER.split('\n').length - 1; // Account for banner lines

  scripts.forEach(script => {
    const filePath = path.join(JS_DIR, script);
    if (!fs.existsSync(filePath)) {
      console.warn('  Warning: script not found:', filePath);
      return;
    }
    const separator = `/* --- ${script} --- */`;
    parts.push(separator);
    currentLine++; // separator line
    currentLine++; // blank line from join('\n\n')

    const content = fs.readFileSync(filePath, 'utf8');
    scriptEntries.push({
      filePath: filePath,
      content: content,
      startLine: currentLine
    });

    parts.push(content);
    currentLine += content.split('\n').length;
    currentLine++; // blank line from join('\n\n')
  });

  const bundled = BANNER + parts.join('\n\n');

  // Generate source map
  const sourceMap = generateSourceMap(bundled, scriptEntries);

  const minified = BANNER + minify(bundled);

  const SOURCE_MAP_COMMENT_JS = '\n//# sourceMappingURL=devkit.js.map';

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, bundled + SOURCE_MAP_COMMENT_JS, 'utf8');
  fs.writeFileSync(OUT_MIN, minified + SOURCE_MAP_COMMENT_JS, 'utf8');
  fs.writeFileSync(OUT_MAP, sourceMap, 'utf8');

  const fullSize = (Buffer.byteLength(bundled) / 1024).toFixed(1);
  const minSize = (Buffer.byteLength(minified) / 1024).toFixed(1);
  const mapSize = (Buffer.byteLength(sourceMap) / 1024).toFixed(1);

  console.log(`  dist/devkit.js     ${fullSize} KB`);
  console.log(`  dist/devkit.min.js ${minSize} KB`);
  console.log(`  dist/devkit.js.map ${mapSize} KB`);
  console.log('Done.');
} catch (err) {
  console.error('JS build failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}
