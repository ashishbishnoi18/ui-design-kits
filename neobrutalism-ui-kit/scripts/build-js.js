#!/usr/bin/env node
/**
 * Build Script — JS Bundle
 * Concatenates nb-core.js and all component scripts into a single file,
 * then minifies it. No external dependencies required.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', 'js');
const OUT = path.join(__dirname, '..', 'dist', 'nb-ui-kit.js');
const OUT_MIN = path.join(__dirname, '..', 'dist', 'nb-ui-kit.min.js');

// Read nb-all.js to get the script list in correct order
const loaderSrc = fs.readFileSync(path.join(JS_DIR, 'nb-all.js'), 'utf8');
const scriptMatches = loaderSrc.match(/'([^']+\.js)'/g);

if (!scriptMatches) {
  console.error('Could not parse script list from nb-all.js');
  process.exit(1);
}

const scripts = scriptMatches.map(s => s.replace(/'/g, ''));

console.log('Building JS bundle...');

const banner = `/*! NB UI Kit v1.0.0 | MIT License | github.com/ashishbishnoi18/nb-ui-kit */\n`;
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

const bundled = banner + parts.join('\n\n');

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

const minified = `/*! NB UI Kit v1.0.0 | MIT License */\n` + minify(bundled);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, bundled, 'utf8');
fs.writeFileSync(OUT_MIN, minified, 'utf8');

const fullSize = (Buffer.byteLength(bundled) / 1024).toFixed(1);
const minSize = (Buffer.byteLength(minified) / 1024).toFixed(1);

console.log(`  dist/nb-ui-kit.js     ${fullSize} KB`);
console.log(`  dist/nb-ui-kit.min.js ${minSize} KB`);
console.log('Done.');
