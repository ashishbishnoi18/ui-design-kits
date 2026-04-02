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
const OUT = path.join(__dirname, '..', 'dist', 'devkit.js');
const OUT_MIN = path.join(__dirname, '..', 'dist', 'devkit.min.js');

// Read dk-all.js to get the script list in correct order
const loaderSrc = fs.readFileSync(LOADER, 'utf8');
const scriptMatches = loaderSrc.match(/'([^']+\.js)'/g);

if (!scriptMatches) {
  console.warn('No scripts found in dk-all.js — creating empty bundle.');
  const BANNER = `/*! DevKit v0.1.0 | MIT License */\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, BANNER + '/* No scripts bundled */\n', 'utf8');
  fs.writeFileSync(OUT_MIN, BANNER, 'utf8');
  console.log('Done (empty bundle).');
  process.exit(0);
}

const scripts = scriptMatches.map(s => s.replace(/'/g, ''));

console.log('Building JS bundle...');

const BANNER = `/*! DevKit v0.1.0 | MIT License */\n`;
const parts = [];

scripts.forEach(script => {
  const filePath = path.join(JS_DIR, script);
  if (!fs.existsSync(filePath)) {
    console.warn('  Warning: script not found:', filePath);
    return;
  }
  parts.push(`/* --- ${script} --- */`);
  parts.push(fs.readFileSync(filePath, 'utf8'));
});

const bundled = BANNER + parts.join('\n\n');

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

const minified = BANNER + minify(bundled);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, bundled, 'utf8');
fs.writeFileSync(OUT_MIN, minified, 'utf8');

const fullSize = (Buffer.byteLength(bundled) / 1024).toFixed(1);
const minSize = (Buffer.byteLength(minified) / 1024).toFixed(1);

console.log(`  dist/devkit.js     ${fullSize} KB`);
console.log(`  dist/devkit.min.js ${minSize} KB`);
console.log('Done.');
