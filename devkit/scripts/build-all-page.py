#!/usr/bin/env python3
"""
Build devkit/docs/index.html — single page with sidebar listing all 156 components
and inline previews grouped by category.
"""

import os
import re
from collections import OrderedDict

COMPONENTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs', 'components')
OUTPUT_FILE    = os.path.join(os.path.dirname(__file__), '..', 'docs', 'index.html')

CATEGORY_ORDER = [
    'Layout', 'Typography', 'Forms', 'Data Display', 'Navigation',
    'Feedback', 'Marketing', 'Application', 'Utility',
]

# Tags that are categories, not types — used to filter them out
CATEGORY_TAGS = set(CATEGORY_ORDER + ['Uncategorized'])


def extract_h1(content):
    m = re.search(r'<h1>(.*?)</h1>', content, re.DOTALL)
    return m.group(1).strip() if m else None


def extract_category(content):
    m = re.search(r'<nav class="docs-breadcrumb">.*?<a href="[^"]*#[^"]*">([^<]+)</a>', content, re.DOTALL)
    return m.group(1).strip() if m else 'Uncategorized'


def extract_preview(content):
    m = re.search(r'<div\s+class="docs-preview-panel"[^>]*>', content)
    if not m:
        return None
    inner_start = m.end()
    depth = 1
    i = inner_start
    while i < len(content) and depth > 0:
        next_open  = content.find('<div', i)
        next_close = content.find('</div>', i)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            i = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                return content[inner_start:next_close].strip()
            i = next_close + 6
    return None


def extract_code_panel(content):
    """Extract the inner HTML of the docs-code-panel div."""
    m = re.search(r'<div\s+class="docs-code-panel"[^>]*>', content)
    if not m:
        return None
    inner_start = m.end()
    depth = 1
    i = inner_start
    while i < len(content) and depth > 0:
        next_open  = content.find('<div', i)
        next_close = content.find('</div>', i)
        if next_close == -1:
            break
        if next_open != -1 and next_open < next_close:
            depth += 1
            i = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                return content[inner_start:next_close].strip()
            i = next_close + 6
    return None


def extract_api_table(content):
    """Extract the full <table class="docs-api-table">...</table> HTML."""
    m = re.search(r'<table class="docs-api-table">.*?</table>', content, re.DOTALL)
    return m.group(0) if m else None


def extract_type_badge(content):
    """Extract the component type tag (CSS, CSS+JS, etc.), skipping category tags."""
    tags = re.findall(r'<span class="docs-tag">([^<]+)</span>', content)
    for tag in tags:
        if tag.strip() not in CATEGORY_TAGS:
            return tag.strip()
    return 'CSS'  # fallback


def scan_components():
    categories = OrderedDict((c, []) for c in CATEGORY_ORDER)
    categories['Uncategorized'] = []
    for fname in sorted(os.listdir(COMPONENTS_DIR)):
        if not fname.endswith('.html'):
            continue
        fpath = os.path.join(COMPONENTS_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        name      = extract_h1(content)
        cat       = extract_category(content)
        preview   = extract_preview(content)
        code      = extract_code_panel(content)
        api_table = extract_api_table(content)
        type_badge = extract_type_badge(content)
        if not name or not preview:
            print(f'  SKIP {fname}: name={name!r}, preview={"found" if preview else "MISSING"}')
            continue
        stem = fname[:-5]
        bucket = cat if cat in categories else 'Uncategorized'
        categories[bucket].append((stem, name, preview, code, api_table, type_badge))
    for cat in categories:
        categories[cat].sort(key=lambda t: t[1].lower())
    return OrderedDict((c, items) for c, items in categories.items() if items)


def slug(category):
    return category.lower().replace(' ', '-')


def build_html(categories):
    total = sum(len(v) for v in categories.values())

    # Build sidebar nav groups — each component listed individually
    sidebar_groups = []
    for cat, items in categories.items():
        links = []
        for stem, name, *_ in items:
            links.append(f'        <a href="#comp-{stem}" class="docs-nav-link">{name}</a>')
        sidebar_groups.append(f'''      <div class="docs-nav-group">
        <div class="docs-nav-group_title">{cat} <span style="opacity:.5">({len(items)})</span></div>
{chr(10).join(links)}
      </div>''')

    sidebar_nav = '\n'.join(sidebar_groups)

    # Build component sections
    sections = []
    for cat, items in categories.items():
        entries = []
        for stem, name, preview, code, api_table, type_badge in items:
            code_html = code if code else '<pre><code>See detail page for source code.</code></pre>'
            api_html = api_table if api_table else '<p class="ce-no-api">See detail page for full API reference.</p>'
            entries.append(f'''    <div class="component-entry" id="comp-{stem}">
      <div class="component-entry_header">
        <h3 class="component-entry_name"><a href="components/{stem}.html">{name}</a></h3>
        <span class="component-entry_badge">{type_badge}</span>
      </div>
      <div class="component-entry_tabs">
        <button class="ce-tab is-active" data-ce-tab="preview">Preview</button>
        <button class="ce-tab" data-ce-tab="code">Code</button>
        <button class="ce-tab" data-ce-tab="api">API</button>
      </div>
      <div class="ce-panel" data-ce-panel="preview">
        {preview}
      </div>
      <div class="ce-panel" data-ce-panel="code" style="display:none">
        {code_html}
      </div>
      <div class="ce-panel" data-ce-panel="api" style="display:none">
        {api_html}
      </div>
    </div>''')
        section_html = '\n'.join(entries)
        sections.append(f'''  <section class="docs-section" id="cat-{slug(cat)}">
    <h2 class="category-heading">{cat} <span class="category-count">({len(items)})</span></h2>
{section_html}
  </section>''')

    body_sections = '\n\n'.join(sections)

    page = f'''<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevKit — Component Library</title>
  <link rel="stylesheet" href="../css/dk-all.css">
  <link rel="stylesheet" href="styles.css">
  <style>
    .component-entry {{
      margin-bottom: 40px;
      padding-bottom: 40px;
      border-bottom: 1px solid var(--border);
    }}
    .component-entry:last-child {{
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }}
    .component-entry_name {{
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 0;
      color: var(--text);
    }}
    .component-entry_name a {{
      color: inherit;
      text-decoration: none;
      transition: color var(--transition);
    }}
    .component-entry_name a:hover {{
      color: var(--accent);
    }}
    .component-entry_header {{
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }}
    .component-entry_badge {{
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--bg-hover);
      border: 1px solid var(--border);
      color: var(--text-muted);
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .component-entry_tabs {{
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 0;
    }}
    .ce-tab {{
      padding: 8px 16px;
      font-size: 13px;
      color: var(--text-muted);
      border: none;
      background: none;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      font-family: var(--font-sans);
      transition: color 150ms, border-color 150ms;
    }}
    .ce-tab:hover {{
      color: var(--text);
    }}
    .ce-tab.is-active {{
      color: var(--accent);
      border-bottom-color: var(--accent);
    }}
    .ce-panel {{
      padding: 20px;
    }}
    .ce-panel pre {{
      margin: 0;
      padding: 16px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
    }}
    .ce-panel code {{
      font-family: var(--font-mono);
      font-size: 13px;
      color: var(--text);
    }}
    .ce-no-api {{
      color: var(--text-muted);
      font-size: 13px;
      font-style: italic;
    }}
    .category-heading {{
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 32px;
      padding-bottom: 12px;
      border-bottom: 2px solid var(--accent);
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .category-count {{
      font-weight: 400;
      font-size: 14px;
      opacity: .5;
      text-transform: none;
      letter-spacing: 0;
    }}
    .docs-section + .docs-section {{
      margin-top: 56px;
    }}
    .index-header {{
      margin-bottom: 40px;
    }}
    .index-header h1 {{
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }}
    .index-header p {{
      color: var(--text-muted);
      font-size: 15px;
    }}
    .index-header .accent {{
      color: var(--accent);
      font-weight: 600;
    }}
    /* Active sidebar link highlight */
    .docs-nav-link.is-active {{
      color: var(--accent) !important;
    }}
    /* API table inside ce-panel */
    .ce-panel .docs-api-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }}
    .ce-panel .docs-api-table th,
    .ce-panel .docs-api-table td {{
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border);
    }}
    .ce-panel .docs-api-table th {{
      color: var(--text-muted);
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .ce-panel .docs-api-table code {{
      font-size: 12px;
      padding: 1px 5px;
      background: var(--bg-surface);
      border-radius: 3px;
    }}
  </style>
</head>
<body>
  <aside class="docs-sidebar">
    <div class="docs-sidebar_header">
      <a href="index.html" class="docs-brand">DevKit</a>
      <span class="docs-version">v0.1.0</span>
    </div>
    <nav class="docs-sidebar_nav">
{sidebar_nav}
    </nav>
  </aside>

  <main class="docs-main">
    <div class="index-header">
      <h1>Components</h1>
      <p><span class="accent">{total}</span> components for building modern interfaces</p>
    </div>

{body_sections}
  </main>

  <script>
  // Tab switching for Preview / Code / API panels
  document.querySelectorAll('.ce-tab').forEach(function(tab) {{
    tab.addEventListener('click', function() {{
      var entry = tab.closest('.component-entry');
      entry.querySelectorAll('.ce-tab').forEach(function(t) {{ t.classList.remove('is-active'); }});
      tab.classList.add('is-active');
      var target = tab.dataset.ceTab;
      entry.querySelectorAll('.ce-panel').forEach(function(p) {{
        p.style.display = p.dataset.cePanel === target ? '' : 'none';
      }});
    }});
  }});
  </script>
  <script>
  // Highlight active sidebar link on scroll
  ;(function() {{
    var links = document.querySelectorAll('.docs-nav-link');
    var entries = [];
    links.forEach(function(link) {{
      var id = link.getAttribute('href');
      if (id && id.startsWith('#')) {{
        var el = document.getElementById(id.slice(1));
        if (el) entries.push({{ link: link, el: el }});
      }}
    }});
    var ticking = false;
    function onScroll() {{
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {{
        var scrollY = window.scrollY + 120;
        var current = null;
        for (var i = 0; i < entries.length; i++) {{
          if (entries[i].el.offsetTop <= scrollY) current = entries[i];
        }}
        links.forEach(function(l) {{ l.classList.remove('is-active'); }});
        if (current) current.link.classList.add('is-active');
        ticking = false;
      }});
    }}
    window.addEventListener('scroll', onScroll, {{ passive: true }});
    onScroll();
  }})();
  </script>
  <script>
  ;(function(){{
    var K='dk-theme',s;
    try{{s=localStorage.getItem(K)}}catch(e){{}}
    if(s==='light'||s==='dark')document.documentElement.setAttribute('data-theme',s);
    function go(){{
      if(document.getElementById('dk-theme-fab'))return;
      var b=document.createElement('button');
      b.id='dk-theme-fab';
      b.title='Toggle theme';
      b.setAttribute('aria-label','Toggle theme');
      b.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
      b.style.cssText='position:fixed;bottom:24px;right:24px;z-index:9999;width:44px;height:44px;border-radius:50%;background:var(--bg-raised,#111);border:1px solid var(--border-default,#1a1a1a);color:var(--text-secondary,#999);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 200ms;box-shadow:0 2px 8px rgba(0,0,0,.3)';
      document.body.appendChild(b);
      b.addEventListener('click',function(){{
        var c=document.documentElement.getAttribute('data-theme')||'dark';
        var n=c==='dark'?'light':'dark';
        document.documentElement.setAttribute('data-theme',n);
        try{{localStorage.setItem(K,n)}}catch(e){{}}
      }});
    }}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
  }})();
  </script>
</body>
</html>'''

    return page


if __name__ == '__main__':
    print(f'Scanning {COMPONENTS_DIR} ...')
    cats = scan_components()
    total = sum(len(v) for v in cats.values())
    for c, items in cats.items():
        print(f'  {c}: {len(items)} components')
    print(f'  TOTAL: {total}')

    page = build_html(cats)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(page)
    print(f'\nWrote {OUTPUT_FILE} ({len(page):,} bytes)')
