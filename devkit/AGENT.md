# DevKit — Agent Reference

## Setup

```html
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">

<!-- CSS -->
<link rel="stylesheet" href="css/dk-all.css">

<!-- JS (optional — adds interactivity) -->
<script src="js/dk-all.js" defer></script>
```

Theme initialization:
```html
<html data-theme="dark">  <!-- dark (default) | light -->
```

---

## Tokens

All canonical semantic tokens use the `--dk-` prefix. An agent can swap `--dk-` for `--nb-` and hit the same categories.

| Token | Default (Dark) |
|-------|----------------|
| `--dk-color-primary` | `#10b981` (emerald-500) |
| `--dk-color-primary-hover` | `#059669` (emerald-600) |
| `--dk-color-surface` | `#0a0a0a` |
| `--dk-color-surface-alt` | `#111111` |
| `--dk-color-border` | `#1a1a1a` |
| `--dk-color-border-strong` | `#333333` |
| `--dk-color-text-primary` | `#e5e5e5` |
| `--dk-color-text-secondary` | `#999999` |
| `--dk-color-text-muted` | `#444444` |
| `--dk-spacing-xs` | `4px` |
| `--dk-spacing-sm` | `8px` |
| `--dk-spacing-md` | `16px` |
| `--dk-spacing-lg` | `24px` |
| `--dk-spacing-xl` | `32px` |
| `--dk-spacing-2xl` | `48px` |
| `--dk-radius-sm` | `4px` |
| `--dk-radius-md` | `6px` |
| `--dk-radius-lg` | `8px` |
| `--dk-radius-full` | `9999px` |
| `--dk-shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--dk-shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` |
| `--dk-shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` |
| `--dk-font-heading` | Inter |
| `--dk-font-body` | Inter |
| `--dk-font-mono` | JetBrains Mono |

---

## Components

### Button `.dk-btn`

**Variants:** `--primary` `--secondary` `--danger` `--ghost` `--outline` `--dark` `--sm` `--lg` `--xl` `--full` `--icon`
**States:** `:hover` `:active` `:focus-visible` `:disabled` `.is-disabled` `.is-loading`
**Slots:** icon-left, label, icon-right

```html
<button class="dk-btn dk-btn--primary">
  <svg data-slot="icon-left" width="14" height="14"><use href="#icon-plus"/></svg>
  <span data-slot="label">Create</span>
</button>
```

```html
<button class="dk-btn dk-btn--ghost dk-btn--sm">Cancel</button>
<button class="dk-btn dk-btn--danger" disabled>Delete</button>
<button class="dk-btn dk-btn--primary dk-btn--full is-loading">Saving…</button>
<button class="dk-btn dk-btn--outline dk-btn--icon"><svg width="14" height="14"><use href="#icon-settings"/></svg></button>
```

### Card `.dk-card`

**Variants:** `--hover` `--bordered` `--ghost`
**Slots:** header, body, footer, media, title, description

```html
<div class="dk-card dk-card--hover">
  <img class="dk-card_img" data-slot="media" src="image.jpg" alt="">
  <div class="dk-card_header" data-slot="header">
    <h3 class="dk-card_title" data-slot="title">Card Title</h3>
    <p class="dk-card_description" data-slot="description">Short description text.</p>
  </div>
  <div class="dk-card_body" data-slot="body">
    <p>Content goes here.</p>
  </div>
  <div class="dk-card_footer" data-slot="footer">
    <button class="dk-btn dk-btn--primary dk-btn--sm">Action</button>
  </div>
</div>
```

### Input / Field `.dk-field`

**States (input):** `:focus` `:focus-visible` `:disabled` `.is-invalid` `.is-valid`
**Slots:** field, label, control, helper-text, error-text

```html
<div class="dk-field" data-slot="field">
  <label class="dk-label" data-slot="label">Email</label>
  <input class="dk-input" data-slot="control" type="email" placeholder="you@example.com">
  <span class="dk-help-text" data-slot="helper-text">We'll never share your email.</span>
</div>
```

```html
<!-- With validation error -->
<div class="dk-field" data-slot="field">
  <label class="dk-label" data-slot="label">Password</label>
  <input class="dk-input is-invalid" data-slot="control" type="password">
  <span class="dk-error-text" data-slot="error-text">Password must be at least 8 characters.</span>
</div>
```

### Select `.dk-select`

**States:** `.is-open` `.is-disabled`
**Slots:** trigger, value, chevron, menu, option

```html
<div class="dk-select" data-dk-select>
  <button class="dk-select_trigger" data-slot="trigger">
    <span class="dk-select_value" data-slot="value">Choose option…</span>
    <span class="dk-select_chevron" data-slot="chevron">▾</span>
  </button>
  <div class="dk-select_menu" data-slot="menu">
    <div class="dk-select_option" data-slot="option" data-value="a">Option A</div>
    <div class="dk-select_option" data-slot="option" data-value="b">Option B</div>
  </div>
</div>
```

### Checkbox `.dk-checkbox`

**States:** `:checked` `:disabled` `:focus-visible`
**Slots:** input, indicator, label

```html
<label class="dk-checkbox">
  <input class="dk-checkbox_input" data-slot="input" type="checkbox">
  <span class="dk-checkbox_box" data-slot="indicator"></span>
  <span class="dk-checkbox_label" data-slot="label">Accept terms</span>
</label>
```

### Radio `.dk-radio`

**States:** `:checked` `:disabled` `:focus-visible`
**Slots:** input, indicator, label

```html
<label class="dk-radio">
  <input class="dk-radio_input" data-slot="input" type="radio" name="plan" value="free">
  <span class="dk-radio_indicator" data-slot="indicator"></span>
  <span class="dk-radio_label" data-slot="label">Free</span>
</label>
```

### Toggle `.dk-toggle`

**States:** `:checked` `:disabled`
**Slots:** input, track, thumb, label

```html
<label class="dk-toggle">
  <input class="dk-toggle_input" data-slot="input" type="checkbox">
  <span class="dk-toggle_track" data-slot="track">
    <span class="dk-toggle_thumb" data-slot="thumb"></span>
  </span>
  <span class="dk-toggle_label" data-slot="label">Notifications</span>
</label>
```

### Alert `.dk-alert`

**Variants:** `--info` `--success` `--warning` `--danger`
**Slots:** icon, content, title, dismiss

```html
<div class="dk-alert dk-alert--success">
  <span class="dk-alert_icon" data-slot="icon">✓</span>
  <div class="dk-alert_content" data-slot="content">
    <strong class="dk-alert_title" data-slot="title">Success!</strong>
    Your changes have been saved.
  </div>
  <button class="dk-alert_close" data-slot="dismiss">×</button>
</div>
```

### Modal `.dk-modal`

**Variants (size):** `--sm` `--lg` `--full`
**States:** `.is-open` (on backdrop)
**Slots:** backdrop, header, title, close, body, footer

```html
<div class="dk-modal-backdrop is-open" data-slot="backdrop">
  <div class="dk-modal dk-modal--sm">
    <div class="dk-modal_header" data-slot="header">
      <h2 class="dk-modal_title" data-slot="title">Confirm Action</h2>
      <button class="dk-modal_close" data-slot="close">×</button>
    </div>
    <div class="dk-modal_body" data-slot="body">
      <p>Are you sure you want to proceed?</p>
    </div>
    <div class="dk-modal_footer" data-slot="footer">
      <button class="dk-btn dk-btn--ghost">Cancel</button>
      <button class="dk-btn dk-btn--primary">Confirm</button>
    </div>
  </div>
</div>
```

### Drawer `.dk-drawer`

**Variants:** `--left` `--right` (default) `--bottom` `--sm` `--lg`
**States:** `.is-open`
**Slots:** header, title, close, body, footer

```html
<div class="dk-drawer dk-drawer--right is-open">
  <div class="dk-drawer_header" data-slot="header">
    <h3 class="dk-drawer_title" data-slot="title">Settings</h3>
    <button class="dk-drawer_close" data-slot="close">×</button>
  </div>
  <div class="dk-drawer_body" data-slot="body">
    <!-- Content -->
  </div>
  <div class="dk-drawer_footer" data-slot="footer">
    <button class="dk-btn dk-btn--primary">Save</button>
  </div>
</div>
```

### Tabs `.dk-tabs`

**Variants:** `--pill` `--bordered`
**States:** `.is-active`
**Slots:** list, tab, panel

```html
<div class="dk-tabs">
  <div class="dk-tabs_list" data-slot="list">
    <button class="dk-tabs_tab is-active" data-slot="tab">Tab 1</button>
    <button class="dk-tabs_tab" data-slot="tab">Tab 2</button>
    <button class="dk-tabs_tab" data-slot="tab">Tab 3</button>
  </div>
  <div class="dk-tabs_panel is-active" data-slot="panel">Panel 1 content</div>
  <div class="dk-tabs_panel" data-slot="panel">Panel 2 content</div>
  <div class="dk-tabs_panel" data-slot="panel">Panel 3 content</div>
</div>
```

### Accordion `.dk-accordion`

**States:** `.is-open` (on item)
**Slots:** item, trigger, icon, content

```html
<div class="dk-accordion" data-dk-accordion>
  <div class="dk-accordion_item is-open" data-slot="item">
    <button class="dk-accordion_trigger" data-slot="trigger">
      Section Title
      <span class="dk-accordion_icon" data-slot="icon">▾</span>
    </button>
    <div class="dk-accordion_content" data-slot="content">
      <p>Accordion content here.</p>
    </div>
  </div>
</div>
```

### Dropdown `.dk-dropdown`

**Variants:** `--right` `--up`
**States:** `.is-open`
**Slots:** trigger, menu, item, divider, header, icon, shortcut

```html
<div class="dk-dropdown" data-dk-dropdown>
  <button class="dk-btn dk-btn--secondary dk-dropdown_trigger" data-slot="trigger">Options</button>
  <div class="dk-dropdown_menu" data-slot="menu">
    <div class="dk-dropdown_header" data-slot="header">Actions</div>
    <button class="dk-dropdown_item" data-slot="item">
      <span class="dk-dropdown_icon" data-slot="icon">✎</span>
      Edit
      <span class="dk-dropdown_shortcut" data-slot="shortcut">⌘E</span>
    </button>
    <button class="dk-dropdown_item" data-slot="item">Duplicate</button>
    <div class="dk-dropdown_divider" data-slot="divider"></div>
    <button class="dk-dropdown_item" data-slot="item">Delete</button>
  </div>
</div>
```

### Navbar `.dk-navbar`

**States:** `.is-open` (mobile)
**Slots:** brand, nav, link, actions, toggle

```html
<nav class="dk-navbar">
  <a class="dk-navbar_brand" data-slot="brand" href="/">AppName</a>
  <div class="dk-navbar_nav" data-slot="nav">
    <a class="dk-navbar_link is-active" data-slot="link" href="/">Home</a>
    <a class="dk-navbar_link" data-slot="link" href="/about">About</a>
    <a class="dk-navbar_link" data-slot="link" href="/pricing">Pricing</a>
  </div>
  <div class="dk-navbar_actions" data-slot="actions">
    <button class="dk-btn dk-btn--primary dk-btn--sm">Sign Up</button>
  </div>
  <button class="dk-navbar_mobile-toggle" data-slot="toggle">☰</button>
</nav>
```

### Hero `.dk-hero`

**Variants:** `--centered` `--split` `--lg`
**Slots:** container, content, eyebrow, title, subtitle, actions, media

```html
<section class="dk-hero dk-hero--split">
  <div class="dk-hero_inner" data-slot="container">
    <div class="dk-hero_content" data-slot="content">
      <span class="dk-hero_eyebrow" data-slot="eyebrow">New in v2.0</span>
      <h1 class="dk-hero_title" data-slot="title">Build Clean Interfaces</h1>
      <p class="dk-hero_subtitle" data-slot="subtitle">A developer-focused component kit.</p>
      <div class="dk-hero_actions" data-slot="actions">
        <button class="dk-btn dk-btn--primary dk-btn--lg">Get Started</button>
        <button class="dk-btn dk-btn--outline dk-btn--lg">Learn More</button>
      </div>
    </div>
    <div class="dk-hero_media" data-slot="media">
      <img src="hero.png" alt="">
    </div>
  </div>
</section>
```

### Table `.dk-table`

**Variants:** `--striped` `--hover` `--compact`
**Slots:** wrapper

```html
<div class="dk-table_wrapper" data-slot="wrapper">
  <table class="dk-table dk-table--striped dk-table--hover">
    <thead>
      <tr><th>Name</th><th>Email</th><th>Role</th></tr>
    </thead>
    <tbody>
      <tr><td>Jane Doe</td><td>jane@example.com</td><td>Admin</td></tr>
      <tr><td>John Smith</td><td>john@example.com</td><td>Editor</td></tr>
    </tbody>
  </table>
</div>
```

### Badge `.dk-badge`

**Variants:** `--primary` `--secondary` `--danger` `--success` `--warning` `--info` `--outline` `--pill` `--lg` `--dot`

```html
<span class="dk-badge dk-badge--success">Active</span>
<span class="dk-badge dk-badge--danger dk-badge--pill">3</span>
<span class="dk-badge dk-badge--dot">New</span>
```

### Avatar `.dk-avatar`

**Variants (size):** `--xs` `--sm` (default) `--lg` `--xl`
**Slots:** image, fallback, indicator

```html
<div class="dk-avatar dk-avatar--lg">
  <img class="dk-avatar_img" data-slot="image" src="avatar.jpg" alt="Jane Doe">
</div>

<div class="dk-avatar">
  <span class="dk-avatar_fallback" data-slot="fallback">JD</span>
</div>
```

### Tooltip `.dk-tooltip`

**Positions:** `data-dk-position="top|bottom|left|right"`
**Slots:** content

```html
<span class="dk-tooltip" data-dk-tooltip>
  Hover me
  <span class="dk-tooltip_content" data-slot="content" data-dk-position="top">Tooltip text</span>
</span>
```

### Toast `.dk-toast`

**Variants:** `--info` `--success` `--warning` `--danger`
**Slots:** icon, content, title, message, close

```html
<div class="dk-toast dk-toast--success">
  <span class="dk-toast_icon" data-slot="icon">✓</span>
  <div class="dk-toast_content" data-slot="content">
    <strong class="dk-toast_title" data-slot="title">Saved</strong>
    <p class="dk-toast_message" data-slot="message">Your changes were saved.</p>
  </div>
  <button class="dk-toast_close" data-slot="close">×</button>
</div>
```

### Progress `.dk-progress`

**Variants (size):** `--sm` `--lg`
**Slots:** label, track, bar

```html
<div class="dk-progress">
  <div class="dk-progress_label" data-slot="label">
    <span>Uploading…</span><span>65%</span>
  </div>
  <div class="dk-progress_track" data-slot="track">
    <div class="dk-progress_bar" data-slot="bar" style="width: 65%"></div>
  </div>
</div>
```

### Spinner `.dk-spinner`

**Variants (size):** `--sm` `--lg` `--xl`

```html
<div class="dk-spinner dk-spinner--lg"></div>
```

### Breadcrumb `.dk-breadcrumb`

**Slots:** item, link, separator, current

```html
<nav class="dk-breadcrumb">
  <span class="dk-breadcrumb_item" data-slot="item">
    <a class="dk-breadcrumb_link" data-slot="link" href="/">Home</a>
    <span class="dk-breadcrumb_separator" data-slot="separator">/</span>
  </span>
  <span class="dk-breadcrumb_item" data-slot="item">
    <a class="dk-breadcrumb_link" data-slot="link" href="/docs">Docs</a>
    <span class="dk-breadcrumb_separator" data-slot="separator">/</span>
  </span>
  <span class="dk-breadcrumb_item" data-slot="item">
    <span class="dk-breadcrumb_current" data-slot="current">Current Page</span>
  </span>
</nav>
```

### Pagination `.dk-pagination`

**Variants:** `--sm`
**States:** `.is-active` `:disabled`
**Slots:** prev, item, ellipsis, next

```html
<nav class="dk-pagination">
  <button class="dk-pagination_prev" data-slot="prev">← Prev</button>
  <button class="dk-pagination_item" data-slot="item">1</button>
  <button class="dk-pagination_item is-active" data-slot="item">2</button>
  <button class="dk-pagination_item" data-slot="item">3</button>
  <span class="dk-pagination_ellipsis" data-slot="ellipsis">…</span>
  <button class="dk-pagination_item" data-slot="item">10</button>
  <button class="dk-pagination_next" data-slot="next">Next →</button>
</nav>
```

### Sidebar `.dk-sidebar`

**States:** `.is-open` `.is-collapsed`
**Slots:** header, nav, group, link, footer

```html
<aside class="dk-sidebar is-open">
  <div class="dk-sidebar_header" data-slot="header">
    <span>Dashboard</span>
  </div>
  <nav class="dk-sidebar_nav" data-slot="nav">
    <div class="dk-sidebar_group" data-slot="group">
      <a class="dk-sidebar_link is-active" data-slot="link" href="/">Overview</a>
      <a class="dk-sidebar_link" data-slot="link" href="/analytics">Analytics</a>
      <a class="dk-sidebar_link" data-slot="link" href="/settings">Settings</a>
    </div>
  </nav>
  <div class="dk-sidebar_footer" data-slot="footer">
    <span>v1.0.0</span>
  </div>
</aside>
```

### Stepper `.dk-stepper`

**States:** `.is-active` `.is-completed`
**Slots:** step, indicator, label, connector

```html
<div class="dk-stepper">
  <div class="dk-stepper_step is-completed" data-slot="step">
    <span class="dk-stepper_indicator" data-slot="indicator">✓</span>
    <span class="dk-stepper_label" data-slot="label">Account</span>
  </div>
  <div class="dk-stepper_connector" data-slot="connector"></div>
  <div class="dk-stepper_step is-active" data-slot="step">
    <span class="dk-stepper_indicator" data-slot="indicator">2</span>
    <span class="dk-stepper_label" data-slot="label">Profile</span>
  </div>
  <div class="dk-stepper_connector" data-slot="connector"></div>
  <div class="dk-stepper_step" data-slot="step">
    <span class="dk-stepper_indicator" data-slot="indicator">3</span>
    <span class="dk-stepper_label" data-slot="label">Review</span>
  </div>
</div>
```

### Stat Card `.dk-stat-card`

**Slots:** label, value, trend, icon

```html
<div class="dk-stat-card">
  <span class="dk-stat-card_label" data-slot="label">Revenue</span>
  <span class="dk-stat-card_value" data-slot="value">$12,450</span>
  <span class="dk-stat-card_trend" data-slot="trend">↑ 12%</span>
</div>
```

### Empty State `.dk-empty-state`

**Slots:** icon, title, description, actions

```html
<div class="dk-empty-state">
  <div class="dk-empty-state_icon" data-slot="icon">📭</div>
  <h3 class="dk-empty-state_title" data-slot="title">No results found</h3>
  <p class="dk-empty-state_description" data-slot="description">Try adjusting your search.</p>
  <div class="dk-empty-state_actions" data-slot="actions">
    <button class="dk-btn dk-btn--primary dk-btn--sm">Reset Filters</button>
  </div>
</div>
```

### Skeleton `.dk-skeleton`

**Variants:** `--text` `--heading` `--avatar` `--card` `--image` `--button` `--circle`

```html
<div class="dk-skeleton dk-skeleton--heading"></div>
<div class="dk-skeleton dk-skeleton--text"></div>
<div class="dk-skeleton dk-skeleton--text"></div>
<div class="dk-skeleton dk-skeleton--avatar"></div>
```

### Code Block `.dk-code-block`

**Slots:** header, content, copy-btn

```html
<div class="dk-code-block">
  <div class="dk-code-block_header" data-slot="header">
    <span>index.js</span>
    <button class="dk-code-block_copy" data-slot="copy-btn">Copy</button>
  </div>
  <pre class="dk-code-block_content" data-slot="content"><code>console.log('hello');</code></pre>
</div>
```

### Timeline `.dk-timeline`

**Slots:** item, marker, content

```html
<div class="dk-timeline">
  <div class="dk-timeline_item" data-slot="item">
    <div class="dk-timeline_marker" data-slot="marker"></div>
    <div class="dk-timeline_content" data-slot="content">
      <strong>Order placed</strong>
      <p>Jan 15, 2026</p>
    </div>
  </div>
</div>
```

### Divider `.dk-divider`

**Variants:** `--subtle` `--strong` `--dashed` `--vertical`

```html
<hr class="dk-divider">
<hr class="dk-divider dk-divider--dashed">
```

### Search `.dk-search`

**Slots:** input, icon, shortcut

```html
<div class="dk-search" data-dk-search>
  <span class="dk-search_icon" data-slot="icon">🔍</span>
  <input class="dk-search_input" data-slot="input" type="text" placeholder="Search…">
  <kbd class="dk-search_shortcut" data-slot="shortcut">⌘K</kbd>
</div>
```

---

## Wireframe → Kit Mapping

| Wireframe Pattern (Tailwind) | Kit Implementation |
|---|---|
| `bg-white border border-neutral-300 rounded p-4` (card) | `.dk-card` |
| `bg-white border border-neutral-300 rounded p-4 hover:shadow` (interactive card) | `.dk-card .dk-card--hover` |
| `bg-neutral-900 text-white font-semibold px-6 py-3 rounded` (primary btn) | `.dk-btn .dk-btn--primary` |
| `bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded` (secondary btn) | `.dk-btn .dk-btn--secondary` |
| `bg-transparent text-neutral-600 px-4 py-2` (ghost btn) | `.dk-btn .dk-btn--ghost` |
| `border border-neutral-300 rounded px-3 py-2 text-sm` (text input) | `.dk-input` |
| `text-4xl font-bold` (display heading) | `<h1>` with `font-family: var(--dk-font-heading)` |
| `text-sm text-neutral-500` (helper text) | `.dk-help-text` |
| `text-xs font-semibold uppercase tracking-wide bg-neutral-100 px-2 py-1 rounded` (badge) | `.dk-badge` |
| `fixed inset-0 bg-black/50 flex items-center justify-center` (modal overlay) | `.dk-modal-backdrop.is-open` |
| `bg-white rounded shadow-lg p-6 max-w-md` (modal content) | `.dk-modal` |
| `border-b border-neutral-200 flex gap-4` (tab list) | `.dk-tabs_list` |
| `text-sm font-medium border-b-2 border-emerald-500` (active tab) | `.dk-tabs_tab.is-active` |
| `flex items-center justify-between p-4 border-b` (navbar) | `.dk-navbar` |
| `bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-4 rounded` (success alert) | `.dk-alert .dk-alert--success` |
| `bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded` (danger alert) | `.dk-alert .dk-alert--danger` |
| `w-full h-2 bg-neutral-800 rounded` (progress track) | `.dk-progress` |
| `animate-spin rounded-full border-2 border-neutral-600 border-t-emerald-400` (spinner) | `.dk-spinner` |
| `flex flex-col gap-1 text-sm` (breadcrumb) | `.dk-breadcrumb` |
| `grid grid-cols-3 gap-4` (card grid) | `.dk-grid` with columns |

---

## Composition Patterns

### 1. Card Grid with Filter Bar

```html
<div style="max-width:1200px;margin:0 auto;padding:24px">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
    <h2 style="font-size:var(--text-xl);font-weight:var(--font-weight-semibold);color:var(--text-heading)">Projects</h2>
    <div class="dk-tabs dk-tabs--pill">
      <div class="dk-tabs_list" data-slot="list">
        <button class="dk-tabs_tab is-active" data-slot="tab">All</button>
        <button class="dk-tabs_tab" data-slot="tab">Active</button>
        <button class="dk-tabs_tab" data-slot="tab">Archived</button>
      </div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    <div class="dk-card dk-card--hover">
      <div class="dk-card_header" data-slot="header"><h3 class="dk-card_title" data-slot="title">Alpha</h3></div>
      <div class="dk-card_body" data-slot="body"><p>Description here.</p></div>
      <div class="dk-card_footer" data-slot="footer"><span class="dk-badge dk-badge--success">Active</span></div>
    </div>
    <div class="dk-card dk-card--hover">
      <div class="dk-card_header" data-slot="header"><h3 class="dk-card_title" data-slot="title">Beta</h3></div>
      <div class="dk-card_body" data-slot="body"><p>Another description.</p></div>
      <div class="dk-card_footer" data-slot="footer"><span class="dk-badge dk-badge--warning">Pending</span></div>
    </div>
    <div class="dk-card dk-card--hover">
      <div class="dk-card_header" data-slot="header"><h3 class="dk-card_title" data-slot="title">Gamma</h3></div>
      <div class="dk-card_body" data-slot="body"><p>Yet another project.</p></div>
      <div class="dk-card_footer" data-slot="footer"><span class="dk-badge dk-badge--danger">Overdue</span></div>
    </div>
  </div>
</div>
```

### 2. Form with Validation and Stepper

```html
<div style="max-width:480px;margin:0 auto;padding:32px">
  <div class="dk-stepper" style="margin-bottom:32px">
    <div class="dk-stepper_step is-completed" data-slot="step"><span class="dk-stepper_indicator" data-slot="indicator">✓</span><span class="dk-stepper_label" data-slot="label">Account</span></div>
    <div class="dk-stepper_connector" data-slot="connector"></div>
    <div class="dk-stepper_step is-active" data-slot="step"><span class="dk-stepper_indicator" data-slot="indicator">2</span><span class="dk-stepper_label" data-slot="label">Profile</span></div>
    <div class="dk-stepper_connector" data-slot="connector"></div>
    <div class="dk-stepper_step" data-slot="step"><span class="dk-stepper_indicator" data-slot="indicator">3</span><span class="dk-stepper_label" data-slot="label">Review</span></div>
  </div>
  <form>
    <div class="dk-field" data-slot="field">
      <label class="dk-label" data-slot="label">Full Name</label>
      <input class="dk-input" data-slot="control" type="text" placeholder="Jane Doe">
    </div>
    <div class="dk-field" data-slot="field">
      <label class="dk-label" data-slot="label">Email</label>
      <input class="dk-input is-invalid" data-slot="control" type="email">
      <span class="dk-error-text" data-slot="error-text">Please enter a valid email.</span>
    </div>
    <div class="dk-field" data-slot="field">
      <label class="dk-label" data-slot="label">Bio</label>
      <textarea class="dk-textarea" data-slot="control" rows="4" placeholder="Tell us about yourself…"></textarea>
      <span class="dk-help-text" data-slot="helper-text">Max 300 characters.</span>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end">
      <button class="dk-btn dk-btn--ghost" type="button">Back</button>
      <button class="dk-btn dk-btn--primary" type="submit">Continue</button>
    </div>
  </form>
</div>
```

### 3. Dashboard Panel (Stat + Table)

```html
<div style="max-width:1200px;margin:0 auto;padding:24px">
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
    <div class="dk-stat-card">
      <span class="dk-stat-card_label" data-slot="label">Revenue</span>
      <span class="dk-stat-card_value" data-slot="value">$48,200</span>
      <span class="dk-stat-card_trend" data-slot="trend">↑ 12%</span>
    </div>
    <div class="dk-stat-card">
      <span class="dk-stat-card_label" data-slot="label">Users</span>
      <span class="dk-stat-card_value" data-slot="value">3,421</span>
      <span class="dk-stat-card_trend" data-slot="trend">↑ 8%</span>
    </div>
    <div class="dk-stat-card">
      <span class="dk-stat-card_label" data-slot="label">Orders</span>
      <span class="dk-stat-card_value" data-slot="value">892</span>
      <span class="dk-stat-card_trend" data-slot="trend">↓ 3%</span>
    </div>
    <div class="dk-stat-card">
      <span class="dk-stat-card_label" data-slot="label">Conversion</span>
      <span class="dk-stat-card_value" data-slot="value">4.2%</span>
      <span class="dk-stat-card_trend" data-slot="trend">↑ 1.1%</span>
    </div>
  </div>
  <div class="dk-table_wrapper" data-slot="wrapper">
    <table class="dk-table dk-table--striped dk-table--hover">
      <thead><tr><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
      <tbody>
        <tr><td>Jane Doe</td><td>$240.00</td><td><span class="dk-badge dk-badge--success">Paid</span></td><td>Mar 28</td></tr>
        <tr><td>John Smith</td><td>$125.00</td><td><span class="dk-badge dk-badge--warning">Pending</span></td><td>Mar 27</td></tr>
        <tr><td>Alice Brown</td><td>$89.50</td><td><span class="dk-badge dk-badge--danger">Failed</span></td><td>Mar 26</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

### 4. Pricing Table

```html
<div style="max-width:1000px;margin:0 auto;padding:48px 24px">
  <div style="text-align:center;margin-bottom:48px">
    <h2 style="font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--text-heading)">Pricing</h2>
    <p style="color:var(--text-secondary);margin-top:8px">Choose the plan that fits.</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;align-items:stretch">
    <div class="dk-card" style="display:flex;flex-direction:column">
      <div class="dk-card_header" data-slot="header">
        <h3 class="dk-card_title" data-slot="title">Starter</h3>
        <p style="font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--text-heading)">$0<span style="font-size:var(--text-sm);font-weight:normal;color:var(--text-secondary)">/mo</span></p>
      </div>
      <div class="dk-card_body" data-slot="body" style="flex:1">
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:var(--text-sm);color:var(--text-secondary)">
          <li>✓ 1 project</li><li>✓ 1GB storage</li><li>✓ Community support</li>
        </ul>
      </div>
      <div class="dk-card_footer" data-slot="footer">
        <button class="dk-btn dk-btn--outline dk-btn--full">Get Started</button>
      </div>
    </div>
    <div class="dk-card dk-card--bordered" style="display:flex;flex-direction:column;border-color:var(--accent)">
      <div class="dk-card_header" data-slot="header">
        <span class="dk-badge dk-badge--primary">Popular</span>
        <h3 class="dk-card_title" data-slot="title">Pro</h3>
        <p style="font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--text-heading)">$29<span style="font-size:var(--text-sm);font-weight:normal;color:var(--text-secondary)">/mo</span></p>
      </div>
      <div class="dk-card_body" data-slot="body" style="flex:1">
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:var(--text-sm);color:var(--text-secondary)">
          <li>✓ 10 projects</li><li>✓ 50GB storage</li><li>✓ Priority support</li><li>✓ Custom domain</li>
        </ul>
      </div>
      <div class="dk-card_footer" data-slot="footer">
        <button class="dk-btn dk-btn--primary dk-btn--full">Upgrade</button>
      </div>
    </div>
    <div class="dk-card" style="display:flex;flex-direction:column">
      <div class="dk-card_header" data-slot="header">
        <h3 class="dk-card_title" data-slot="title">Enterprise</h3>
        <p style="font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--text-heading)">Custom</p>
      </div>
      <div class="dk-card_body" data-slot="body" style="flex:1">
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:var(--text-sm);color:var(--text-secondary)">
          <li>✓ Unlimited projects</li><li>✓ Unlimited storage</li><li>✓ Dedicated support</li><li>✓ SLA</li>
        </ul>
      </div>
      <div class="dk-card_footer" data-slot="footer">
        <button class="dk-btn dk-btn--dark dk-btn--full">Contact Sales</button>
      </div>
    </div>
  </div>
</div>
```

### 5. Auth Form (Login)

```html
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-root)">
  <div class="dk-card" style="width:100%;max-width:400px">
    <div class="dk-card_header" data-slot="header" style="text-align:center">
      <h2 style="font-size:var(--text-xl);font-weight:var(--font-weight-bold);color:var(--text-heading)">Welcome back</h2>
      <p style="color:var(--text-secondary);font-size:var(--text-sm)">Sign in to your account</p>
    </div>
    <div class="dk-card_body" data-slot="body">
      <form>
        <div class="dk-field" data-slot="field">
          <label class="dk-label" data-slot="label">Email</label>
          <input class="dk-input" data-slot="control" type="email" placeholder="you@example.com">
        </div>
        <div class="dk-field" data-slot="field">
          <label class="dk-label" data-slot="label">Password</label>
          <input class="dk-input" data-slot="control" type="password" placeholder="••••••••">
        </div>
        <button class="dk-btn dk-btn--primary dk-btn--full" type="submit">Sign In</button>
      </form>
    </div>
    <div class="dk-card_footer" data-slot="footer" style="text-align:center">
      <p style="font-size:var(--text-sm);color:var(--text-secondary)">Don't have an account? <a class="dk-link">Sign up</a></p>
    </div>
  </div>
</div>
```

### 6. Hero Section with CTA

```html
<section class="dk-hero dk-hero--split">
  <div class="dk-hero_inner" data-slot="container">
    <div class="dk-hero_content" data-slot="content">
      <span class="dk-hero_eyebrow" data-slot="eyebrow">New in v2.0</span>
      <h1 class="dk-hero_title" data-slot="title">Ship Faster with Clean Components</h1>
      <p class="dk-hero_subtitle" data-slot="subtitle">A developer-focused design system built for dark mode.</p>
      <div class="dk-hero_actions" data-slot="actions">
        <button class="dk-btn dk-btn--primary dk-btn--lg">Start Building</button>
        <button class="dk-btn dk-btn--outline dk-btn--lg">View Docs</button>
      </div>
    </div>
    <div class="dk-hero_media" data-slot="media">
      <img src="hero-illustration.svg" alt="Hero illustration">
    </div>
  </div>
</section>
```

### 7. Feature Grid

```html
<div style="max-width:1000px;margin:0 auto;padding:48px 24px">
  <h2 style="text-align:center;font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--text-heading);margin-bottom:48px">Features</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    <div class="dk-card dk-card--ghost">
      <div class="dk-card_body" data-slot="body">
        <div style="font-size:var(--text-xl);margin-bottom:12px">⚡</div>
        <h3 style="font-weight:var(--font-weight-semibold);color:var(--text-heading);margin-bottom:8px">Lightning Fast</h3>
        <p style="color:var(--text-secondary);font-size:var(--text-sm)">Zero dependencies. Pure CSS + vanilla JS.</p>
      </div>
    </div>
    <div class="dk-card dk-card--ghost">
      <div class="dk-card_body" data-slot="body">
        <div style="font-size:var(--text-xl);margin-bottom:12px">🌙</div>
        <h3 style="font-weight:var(--font-weight-semibold);color:var(--text-heading);margin-bottom:8px">Dark First</h3>
        <p style="color:var(--text-secondary);font-size:var(--text-sm)">Dark theme by default with light mode support.</p>
      </div>
    </div>
    <div class="dk-card dk-card--ghost">
      <div class="dk-card_body" data-slot="body">
        <div style="font-size:var(--text-xl);margin-bottom:12px">♿</div>
        <h3 style="font-weight:var(--font-weight-semibold);color:var(--text-heading);margin-bottom:8px">Accessible</h3>
        <p style="color:var(--text-secondary);font-size:var(--text-sm)">Focus states, ARIA, keyboard navigation.</p>
      </div>
    </div>
  </div>
</div>
```

### 8. Testimonial Section

```html
<div style="max-width:1000px;margin:0 auto;padding:48px 24px">
  <h2 style="text-align:center;font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--text-heading);margin-bottom:48px">What People Say</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
    <div class="dk-card">
      <div class="dk-card_body" data-slot="body">
        <p style="font-style:italic;color:var(--text-secondary);margin-bottom:16px">"Clean, minimal, developer-friendly. Exactly what we needed."</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="dk-avatar dk-avatar--sm"><img class="dk-avatar_img" src="t1.jpg" alt=""></div>
          <div>
            <strong style="color:var(--text-heading)">Sarah Chen</strong>
            <p style="font-size:var(--text-xs);color:var(--text-muted)">Design Lead, Acme</p>
          </div>
        </div>
      </div>
    </div>
    <div class="dk-card">
      <div class="dk-card_body" data-slot="body">
        <p style="font-style:italic;color:var(--text-secondary);margin-bottom:16px">"Dark mode done right. Our dev team adopted it instantly."</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="dk-avatar dk-avatar--sm"><img class="dk-avatar_img" src="t2.jpg" alt=""></div>
          <div>
            <strong style="color:var(--text-heading)">Mike Torres</strong>
            <p style="font-size:var(--text-xs);color:var(--text-muted)">CTO, StartupCo</p>
          </div>
        </div>
      </div>
    </div>
    <div class="dk-card">
      <div class="dk-card_body" data-slot="body">
        <p style="font-style:italic;color:var(--text-secondary);margin-bottom:16px">"134 components and zero dependencies. Incredible value."</p>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="dk-avatar dk-avatar--sm"><img class="dk-avatar_img" src="t3.jpg" alt=""></div>
          <div>
            <strong style="color:var(--text-heading)">Priya Sharma</strong>
            <p style="font-size:var(--text-xs);color:var(--text-muted)">Freelance Developer</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 9. FAQ Accordion

```html
<div style="max-width:600px;margin:0 auto;padding:48px 24px">
  <h2 style="text-align:center;font-size:var(--text-2xl);font-weight:var(--font-weight-bold);color:var(--text-heading);margin-bottom:32px">FAQ</h2>
  <div class="dk-accordion" data-dk-accordion>
    <div class="dk-accordion_item is-open" data-slot="item">
      <button class="dk-accordion_trigger" data-slot="trigger">
        Is this free to use?
        <span class="dk-accordion_icon" data-slot="icon">▾</span>
      </button>
      <div class="dk-accordion_content" data-slot="content">
        <p>Yes, the kit is MIT licensed and free for commercial use.</p>
      </div>
    </div>
    <div class="dk-accordion_item" data-slot="item">
      <button class="dk-accordion_trigger" data-slot="trigger">
        Does it work with React?
        <span class="dk-accordion_icon" data-slot="icon">▾</span>
      </button>
      <div class="dk-accordion_content" data-slot="content">
        <p>It's plain HTML/CSS/JS. Works with any framework.</p>
      </div>
    </div>
    <div class="dk-accordion_item" data-slot="item">
      <button class="dk-accordion_trigger" data-slot="trigger">
        Is there a light theme?
        <span class="dk-accordion_icon" data-slot="icon">▾</span>
      </button>
      <div class="dk-accordion_content" data-slot="content">
        <p>Yes, set data-theme="light" on the html element.</p>
      </div>
    </div>
  </div>
</div>
```

### 10. Navigation with Dropdown

```html
<nav class="dk-navbar">
  <a class="dk-navbar_brand" data-slot="brand" href="/">
    <strong>AppName</strong>
  </a>
  <div class="dk-navbar_nav" data-slot="nav">
    <a class="dk-navbar_link is-active" data-slot="link" href="/">Dashboard</a>
    <div class="dk-dropdown" data-dk-dropdown>
      <button class="dk-navbar_link dk-dropdown_trigger" data-slot="trigger">
        Products ▾
      </button>
      <div class="dk-dropdown_menu" data-slot="menu">
        <a class="dk-dropdown_item" data-slot="item" href="/products/analytics">Analytics</a>
        <a class="dk-dropdown_item" data-slot="item" href="/products/automation">Automation</a>
        <div class="dk-dropdown_divider" data-slot="divider"></div>
        <a class="dk-dropdown_item" data-slot="item" href="/products/all">View All</a>
      </div>
    </div>
    <a class="dk-navbar_link" data-slot="link" href="/pricing">Pricing</a>
    <a class="dk-navbar_link" data-slot="link" href="/docs">Docs</a>
  </div>
  <div class="dk-navbar_actions" data-slot="actions">
    <button class="dk-btn dk-btn--ghost dk-btn--sm">Sign In</button>
    <button class="dk-btn dk-btn--primary dk-btn--sm">Get Started</button>
  </div>
  <button class="dk-navbar_mobile-toggle" data-slot="toggle">☰</button>
</nav>
```
