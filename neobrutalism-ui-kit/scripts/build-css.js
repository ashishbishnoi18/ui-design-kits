#!/usr/bin/env node
/**
 * Build Script — CSS Bundle
 * Resolves all @import statements in nb-all.css into a single file,
 * then minifies it. No external dependencies required.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, '..', 'css');
const ENTRY = path.join(CSS_DIR, 'nb-all.css');
const OUT = path.join(__dirname, '..', 'dist', 'nb-ui-kit.css');
const OUT_MIN = path.join(__dirname, '..', 'dist', 'nb-ui-kit.min.css');

/**
 * Recursively resolve @import statements relative to the file's directory.
 */
function resolveImports(filePath) {
  const dir = path.dirname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  return content.replace(/@import\s+["']([^"']+)["']\s*;/g, (match, importPath) => {
    const resolved = path.resolve(dir, importPath);
    if (!fs.existsSync(resolved)) {
      console.warn('  Warning: import not found:', resolved);
      return match;
    }
    return resolveImports(resolved);
  });
}

/**
 * Basic CSS minification — good enough for a zero-dependency build.
 */
function minify(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')     // remove comments
    .replace(/\s+/g, ' ')                  // collapse whitespace
    .replace(/\s*([{}:;,>+~])\s*/g, '$1')  // remove space around symbols
    .replace(/;}/g, '}')                    // remove trailing semicolons
    .replace(/^\s+|\s+$/g, '');             // trim
}

// Build
console.log('Building CSS bundle...');
const bundled = `/*! NB UI Kit v1.0.0 | MIT License | github.com/ashishbishnoi18/nb-ui-kit */\n` + resolveImports(ENTRY);
const minified = `/*! NB UI Kit v1.0.0 | MIT License */\n` + minify(bundled);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, bundled, 'utf8');
fs.writeFileSync(OUT_MIN, minified, 'utf8');

const fullSize = (Buffer.byteLength(bundled) / 1024).toFixed(1);
const minSize = (Buffer.byteLength(minified) / 1024).toFixed(1);

console.log(`  dist/nb-ui-kit.css     ${fullSize} KB`);
console.log(`  dist/nb-ui-kit.min.css ${minSize} KB`);
console.log('Done.');
