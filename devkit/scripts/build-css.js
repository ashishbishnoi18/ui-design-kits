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
const DIST_DIR = path.join(__dirname, '..', 'dist');
const OUT = path.join(DIST_DIR, 'devkit.css');
const OUT_MIN = path.join(DIST_DIR, 'devkit.min.css');
const OUT_MAP = path.join(DIST_DIR, 'devkit.css.map');

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
const VERSION = pkg.version;

/**
 * Track source files and their line ranges in the bundle for source map generation.
 */
const sourceFiles = [];
let currentLine = 0;

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
 * Resolve imports while tracking source file line ranges for the source map.
 */
function resolveImportsTracked(filePath) {
  const dir = path.dirname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let result = '';

  for (const line of lines) {
    const importMatch = line.match(/@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/);
    if (importMatch) {
      const importPath = importMatch[1];
      if (importPath.startsWith('http://') || importPath.startsWith('https://')) {
        currentLine++;
        result += line + '\n';
        continue;
      }
      const resolved = path.resolve(dir, importPath);
      if (!fs.existsSync(resolved)) {
        console.warn('  Warning: import not found:', resolved);
        currentLine++;
        result += line + '\n';
        continue;
      }
      result += resolveImportsTracked(resolved);
    } else {
      currentLine++;
      result += line + '\n';
    }
  }

  return result;
}

/**
 * Collect all resolved source file paths in import order (leaf files only).
 */
function collectSourceFiles(filePath) {
  const dir = path.dirname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let hasNonImportContent = false;

  for (const line of lines) {
    const importMatch = line.match(/@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/);
    if (importMatch) {
      const importPath = importMatch[1];
      if (!importPath.startsWith('http://') && !importPath.startsWith('https://')) {
        const resolved = path.resolve(dir, importPath);
        if (fs.existsSync(resolved)) {
          collectSourceFiles(resolved);
          continue;
        }
      }
    }
    if (line.trim().length > 0) {
      hasNonImportContent = true;
    }
  }

  if (hasNonImportContent) {
    const relativePath = path.relative(DIST_DIR, filePath);
    if (!sourceFiles.includes(relativePath)) {
      sourceFiles.push(relativePath);
    }
  }
}

/**
 * Generate a v3 source map JSON for the bundled CSS.
 * Uses VLQ-encoded mappings for a basic line-to-line mapping.
 */
function generateSourceMap(bundledContent) {
  // Collect source files in order
  collectSourceFiles(ENTRY);

  const bundledLines = bundledContent.split('\n');

  // Build a mapping from bundle line -> source file index
  // by re-resolving imports and tracking which file each line came from
  const lineToSource = [];
  trackLineSources(ENTRY, lineToSource);

  // VLQ encoding
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

  // Generate mappings: each bundle line maps to column 0 of the corresponding source
  let prevSourceIndex = 0;
  let prevSourceLine = 0;
  const mappingLines = [];

  // Track source line counters per file
  const sourceLineCounters = {};

  for (let i = 0; i < bundledLines.length; i++) {
    const info = lineToSource[i];
    if (!info) {
      mappingLines.push('');
      continue;
    }

    const sourceIndex = sourceFiles.indexOf(info.file);
    if (sourceIndex === -1) {
      mappingLines.push('');
      continue;
    }

    if (!(info.file in sourceLineCounters)) {
      sourceLineCounters[info.file] = 0;
    }
    const sourceLine = sourceLineCounters[info.file]++;

    // Each segment: genColumn, sourceIndex delta, sourceLine delta, sourceColumn
    const genCol = 0;
    const srcIndexDelta = sourceIndex - prevSourceIndex;
    const srcLineDelta = sourceLine - prevSourceLine;
    const srcCol = 0;

    mappingLines.push(
      toVLQ(genCol) + toVLQ(srcIndexDelta) + toVLQ(srcLineDelta) + toVLQ(srcCol)
    );

    prevSourceIndex = sourceIndex;
    prevSourceLine = sourceLine;
  }

  return JSON.stringify({
    version: 3,
    file: 'devkit.css',
    sources: sourceFiles,
    sourcesContent: sourceFiles.map(f => {
      const absPath = path.resolve(DIST_DIR, f);
      return fs.existsSync(absPath) ? fs.readFileSync(absPath, 'utf8') : null;
    }),
    mappings: mappingLines.join(';')
  });
}

/**
 * Track which source file each line in the bundle came from.
 */
function trackLineSources(filePath, lineToSource) {
  const dir = path.dirname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(DIST_DIR, filePath);

  for (const line of lines) {
    const importMatch = line.match(/@import\s+(?:url\()?["']([^"']+)["']\)?\s*;/);
    if (importMatch) {
      const importPath = importMatch[1];
      if (!importPath.startsWith('http://') && !importPath.startsWith('https://')) {
        const resolved = path.resolve(dir, importPath);
        if (fs.existsSync(resolved)) {
          trackLineSources(resolved, lineToSource);
          continue;
        }
      }
    }
    lineToSource.push({ file: relativePath });
  }
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
try {
  console.log('Building CSS bundle...');

  const BANNER = `/*! DevKit v${VERSION} | MIT License */\n`;
  const bundled = BANNER + resolveImports(ENTRY);
  const minified = BANNER + minify(bundled);

  // Generate source map
  const sourceMap = generateSourceMap(bundled);

  const SOURCE_MAP_COMMENT_CSS = '\n/*# sourceMappingURL=devkit.css.map */';

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, bundled + SOURCE_MAP_COMMENT_CSS, 'utf8');
  fs.writeFileSync(OUT_MIN, minified + SOURCE_MAP_COMMENT_CSS, 'utf8');
  fs.writeFileSync(OUT_MAP, sourceMap, 'utf8');

  const fullSize = (Buffer.byteLength(bundled) / 1024).toFixed(1);
  const minSize = (Buffer.byteLength(minified) / 1024).toFixed(1);
  const mapSize = (Buffer.byteLength(sourceMap) / 1024).toFixed(1);

  console.log(`  dist/devkit.css     ${fullSize} KB`);
  console.log(`  dist/devkit.min.css ${minSize} KB`);
  console.log(`  dist/devkit.css.map ${mapSize} KB`);
  console.log('Done.');
} catch (err) {
  console.error('CSS build failed:', err.message);
  console.error(err.stack);
  process.exit(1);
}
