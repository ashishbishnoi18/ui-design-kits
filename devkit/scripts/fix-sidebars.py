#!/usr/bin/env python3
"""
Fix sidebars on all 156 component documentation pages.
Replaces partial/minimal sidebars with a unified sidebar showing ALL components
organized by category.
"""

import os
import re
import glob

COMPONENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'components')

# Category display order
CATEGORY_ORDER = [
    'layout',
    'typography',
    'forms',
    'data-display',
    'navigation',
    'feedback',
    'marketing',
    'application',
    'utility',
]

CATEGORY_TITLES = {
    'layout': 'Layout',
    'typography': 'Typography',
    'forms': 'Forms',
    'data-display': 'Data Display',
    'navigation': 'Navigation',
    'feedback': 'Feedback',
    'marketing': 'Marketing',
    'application': 'Application',
    'utility': 'Utility',
}

# Special display name overrides (filename without .html -> display name)
SPECIAL_NAMES = {
    'select-native': 'Select (Native)',
    'code-inline': 'Code Inline',
    'description-list': 'Description List',
    'rtl': 'RTL',
    'faq': 'FAQ',
    'cta-section': 'CTA Section',
    'pin-input': 'PIN Input',
    'qr-code': 'QR Code',
    'api-playground': 'API Playground',
    'json-viewer': 'JSON Viewer',
    'kbd': 'Kbd',
}


def filename_to_display_name(filename):
    """Convert a filename like 'hover-card.html' to 'Hover Card'."""
    stem = filename.replace('.html', '')
    if stem in SPECIAL_NAMES:
        return SPECIAL_NAMES[stem]
    return ' '.join(word.capitalize() for word in stem.split('-'))


def extract_category(filepath):
    """Extract category slug from the breadcrumb nav of an HTML file.

    Specifically targets the docs-breadcrumb element to avoid matching
    sidebar links that also contain index.html#category references.
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # First find the breadcrumb nav block (may span multiple lines)
    breadcrumb_match = re.search(
        r'<nav class="docs-breadcrumb">(.*?)</nav>',
        content, re.DOTALL
    )
    if breadcrumb_match:
        breadcrumb_html = breadcrumb_match.group(1)
        cat_match = re.search(r'index\.html#([a-z-]+)', breadcrumb_html)
        if cat_match:
            return cat_match.group(1)
    return None


def build_sidebar_html(category_components, active_filename=None):
    """Build the complete sidebar HTML string."""
    parts = []
    parts.append('<aside class="docs-sidebar">')
    parts.append('<div class="docs-sidebar_header">')
    parts.append('<a href="../index.html" class="docs-brand">DevKit</a>')
    parts.append('</div>')
    parts.append('<nav class="docs-sidebar_nav">')

    for cat_slug in CATEGORY_ORDER:
        if cat_slug not in category_components:
            continue
        components = category_components[cat_slug]
        parts.append('<div class="docs-nav-group">')
        parts.append(f'<div class="docs-nav-group_title">{CATEGORY_TITLES[cat_slug]}</div>')
        for fname, display_name in components:
            if fname == active_filename:
                parts.append(f'<a href="{fname}" class="docs-nav-link is-active">{display_name}</a>')
            else:
                parts.append(f'<a href="{fname}" class="docs-nav-link">{display_name}</a>')
        parts.append('</div>')

    parts.append('</nav>')
    parts.append('</aside>')
    return ''.join(parts)


def replace_sidebar(filepath, sidebar_html):
    """Replace the <aside class="docs-sidebar">...</aside> in the file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match from <aside class="docs-sidebar"> to </aside> (greedy within reason)
    # Use DOTALL so . matches newlines
    pattern = r'<aside class="docs-sidebar">.*?</aside>'
    new_content, count = re.subn(pattern, sidebar_html, content, count=1, flags=re.DOTALL)

    if count == 0:
        print(f"  WARNING: No sidebar found in {os.path.basename(filepath)}")
        return False

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True


def main():
    html_files = sorted(glob.glob(os.path.join(COMPONENTS_DIR, '*.html')))
    print(f"Found {len(html_files)} HTML files in {COMPONENTS_DIR}\n")

    # Step 1: Extract categories from breadcrumbs
    file_categories = {}
    missing_category = []
    for filepath in html_files:
        fname = os.path.basename(filepath)
        cat = extract_category(filepath)
        if cat:
            file_categories[fname] = cat
        else:
            missing_category.append(fname)
            print(f"  WARNING: No category found for {fname}")

    print(f"Categorized {len(file_categories)} files")
    if missing_category:
        print(f"  Missing category: {missing_category}")

    # Step 2: Build category -> [(filename, display_name)] mapping
    category_components = {}
    for fname, cat in sorted(file_categories.items()):
        if cat not in category_components:
            category_components[cat] = []
        display_name = filename_to_display_name(fname)
        category_components[cat].append((fname, display_name))

    # Sort components within each category alphabetically by display name
    for cat in category_components:
        category_components[cat].sort(key=lambda x: x[1].lower())

    # Print summary
    print("\nCategory breakdown:")
    for cat_slug in CATEGORY_ORDER:
        if cat_slug in category_components:
            print(f"  {CATEGORY_TITLES[cat_slug]}: {len(category_components[cat_slug])} components")

    total_components = sum(len(v) for v in category_components.values())
    print(f"\nTotal components in sidebar: {total_components}")

    # Step 3: Replace sidebars in all files
    print("\nProcessing files...")
    success_count = 0
    fail_count = 0
    for filepath in html_files:
        fname = os.path.basename(filepath)
        sidebar_html = build_sidebar_html(category_components, active_filename=fname)
        if replace_sidebar(filepath, sidebar_html):
            success_count += 1
        else:
            fail_count += 1

    print(f"\nDone! Successfully updated: {success_count}, Failed: {fail_count}")


if __name__ == '__main__':
    main()
