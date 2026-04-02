#!/usr/bin/env node
/**
 * Build Script — CSS Bundle
 * Resolves all @import statements in dk-all.css into a single file,
 * then minifies it. No external dependencies required.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, '..', 'css');
const ENTRY = path.join(CSS_DIR, 'dk-all.css');
const OUT = path.join(__dirname, '..', 'dist', 'devkit.css');
const OUT_MIN = path.join(__dirname, '..', 'dist', 'devkit.min.css');

/**
 * Recursively resolve @import statements relative to the file's directory.
 * Skips external URLs (http, https, url()).
 */
function resolveImports(filePath) {
  const dir = path.dirname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  return content.replace(/@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/g, (match, importPath) => {
    // Skip external imports (Google Fonts, CDNs, etc.)
    if (importPath.startsWith('http://') || importPath.startsWith('https://')) {
      return match;
    }

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

const BANNER = `/*! DevKit v0.1.0 | MIT License */\n`;
const bundled = BANNER + resolveImports(ENTRY);
const minified = BANNER + minify(bundled);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, bundled, 'utf8');
fs.writeFileSync(OUT_MIN, minified, 'utf8');

const fullSize = (Buffer.byteLength(bundled) / 1024).toFixed(1);
const minSize = (Buffer.byteLength(minified) / 1024).toFixed(1);

console.log(`  dist/devkit.css     ${fullSize} KB`);
console.log(`  dist/devkit.min.css ${minSize} KB`);
console.log('Done.');
