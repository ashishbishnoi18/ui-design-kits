# Neobrutalism UI Kit — Agent Reference

## Setup

```html
<!-- Fonts -->
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

<!-- CSS -->
<link rel="stylesheet" href="css/nb-all.css">

<!-- JS (optional — adds interactivity) -->
<script src="js/nb-all.js" defer></script>
```

Theme initialization (optional):
```html
<html data-theme="light">  <!-- light (default) | dark | concrete -->
```

---

## Tokens

All canonical semantic tokens use the `--nb-` prefix. An agent can swap `--nb-` for `--dk-` and hit the same categories.

| Token | Default (Light) |
|-------|-----------------|
| `--nb-color-primary` | `#00FF00` (green-500) |
| `--nb-color-primary-hover` | `#4ADE80` (green-400) |
| `--nb-color-surface` | `#FFFFFF` |
| `--nb-color-surface-alt` | `#F9FAFB` (gray-50) |
| `--nb-color-border` | `#000000` |
| `--nb-color-border-strong` | `#000000` |
| `--nb-color-text-primary` | `#000000` |
| `--nb-color-text-secondary` | `#374151` (gray-700) |
| `--nb-color-text-muted` | `#6B7280` (gray-500) |
| `--nb-spacing-xs` | `4px` |
| `--nb-spacing-sm` | `8px` |
| `--nb-spacing-md` | `16px` |
| `--nb-spacing-lg` | `24px` |
| `--nb-spacing-xl` | `32px` |
| `--nb-spacing-2xl` | `48px` |
| `--nb-radius-sm` | `4px` |
| `--nb-radius-md` | `4px` |
| `--nb-radius-lg` | `8px` |
| `--nb-radius-full` | `9999px` |
| `--nb-shadow-sm` | `2px 2px 0 #000` |
| `--nb-shadow-md` | `4px 4px 0 #000` |
| `--nb-shadow-lg` | `6px 6px 0 #000` |
| `--nb-font-heading` | Space Grotesk |
| `--nb-font-body` | DM Sans |
| `--nb-font-mono` | JetBrains Mono |

---

## Components

### Button `.nb-btn`

**Variants:** `--primary` `--secondary` `--danger` `--ghost` `--outline` `--dark` `--sm` `--lg` `--xl` `--full` `--icon`
**States:** `:hover` `:active` `:focus-visible` `:disabled` `.is-disabled` `.is-loading`
**Slots:** icon-left, label, icon-right

```html
<button class="nb-btn nb-btn--primary">
  <svg data-slot="icon-left" width="16" height="16"><use href="#icon-plus"/></svg>
  <span data-slot="label">Create</span>
</button>
```

```html
<button class="nb-btn nb-btn--ghost nb-btn--sm">Cancel</button>
<button class="nb-btn nb-btn--danger" disabled>Delete</button>
<button class="nb-btn nb-btn--primary nb-btn--full is-loading">Saving…</button>
<button class="nb-btn nb-btn--outline nb-btn--icon"><svg width="16" height="16"><use href="#icon-settings"/></svg></button>
```

### Card `.nb-card`

**Variants:** `--hover` `--highlight` `--flat` `--sm` `--lg` `--primary` `--success` `--danger` `--warning` `--info`
**Slots:** header, body, footer, media, title, description

```html
<div class="nb-card nb-card--hover">
  <img class="nb-card__img" data-slot="media" src="image.jpg" alt="">
  <div class="nb-card__header" data-slot="header">
    <h3 data-slot="title">Card Title</h3>
    <p data-slot="description">Short description text.</p>
  </div>
  <div class="nb-card__body" data-slot="body">
    <p>Content goes here.</p>
  </div>
  <div class="nb-card__footer" data-slot="footer">
    <button class="nb-btn nb-btn--primary nb-btn--sm">Action</button>
  </div>
</div>
```

### Input / Field `.nb-field`

**States (input):** `:focus` `:focus-visible` `:disabled` `.is-invalid` `.is-valid`
**Slots:** field, label, control, helper-text, error-text, prefix, suffix

```html
<div class="nb-field" data-slot="field">
  <label class="nb-label" data-slot="label">Email</label>
  <input class="nb-input" data-slot="control" type="email" placeholder="you@example.com">
  <span class="nb-help-text" data-slot="helper-text">We'll never share your email.</span>
</div>
```

```html
<!-- With validation error -->
<div class="nb-field" data-slot="field">
  <label class="nb-label" data-slot="label">Password</label>
  <input class="nb-input is-invalid" data-slot="control" type="password">
  <span class="nb-help-text nb-help-text--error" data-slot="error-text">Password must be at least 8 characters.</span>
</div>
```

```html
<!-- Input group with prefix -->
<div class="nb-field" data-slot="field">
  <label class="nb-label" data-slot="label">Website</label>
  <div class="nb-input-group">
    <span class="nb-input-group__prefix" data-slot="prefix">https://</span>
    <input class="nb-input" data-slot="control" type="text" placeholder="example.com">
  </div>
</div>
```

### Select `.nb-select`

**States:** `.is-open` `.is-disabled`
**Slots:** trigger, menu, option

```html
<div class="nb-select" data-nb-select>
  <button class="nb-select__trigger" data-slot="trigger">Choose option…</button>
  <div class="nb-select__dropdown" data-slot="menu">
    <div class="nb-select__option" data-slot="option" data-value="a">Option A</div>
    <div class="nb-select__option" data-slot="option" data-value="b">Option B</div>
  </div>
</div>
```

### Checkbox `.nb-checkbox`

**States:** `:checked` `:disabled` `:focus-visible`
**Slots:** input, indicator, label

```html
<label class="nb-checkbox">
  <input class="nb-checkbox__input" data-slot="input" type="checkbox">
  <span class="nb-checkbox__box" data-slot="indicator"></span>
  <span class="nb-checkbox__label" data-slot="label">Accept terms</span>
</label>
```

### Radio `.nb-radio`

**States:** `:checked` `:disabled` `:focus-visible`
**Slots:** input, indicator, label

```html
<label class="nb-radio">
  <input class="nb-radio__input" data-slot="input" type="radio" name="plan" value="free">
  <span class="nb-radio__box" data-slot="indicator"></span>
  <span class="nb-radio__label" data-slot="label">Free</span>
</label>
```

### Toggle `.nb-toggle`

**States:** `:checked` `:disabled` `.is-active`
**Slots:** input, track, thumb, label

```html
<label class="nb-toggle">
  <input class="nb-toggle__input" data-slot="input" type="checkbox">
  <span class="nb-toggle__track" data-slot="track">
    <span class="nb-toggle__thumb" data-slot="thumb"></span>
  </span>
  <span class="nb-toggle__label" data-slot="label">Notifications</span>
</label>
```

### Alert `.nb-alert`

**Variants:** `--info` `--success` `--warning` `--danger` `--banner`
**Slots:** icon, content, title, dismiss

```html
<div class="nb-alert nb-alert--success">
  <span class="nb-alert__icon" data-slot="icon">✓</span>
  <div class="nb-alert__content" data-slot="content">
    <strong class="nb-alert__title" data-slot="title">Success!</strong>
    Your changes have been saved.
  </div>
  <button class="nb-alert__dismiss" data-slot="dismiss">×</button>
</div>
```

### Modal `.nb-modal`

**Variants (size):** `--sm` `--lg` `--full`
**States:** `.is-open` (on backdrop)
**Slots:** backdrop, header, title, close, body, footer

```html
<div class="nb-modal-backdrop is-open" data-slot="backdrop">
  <div class="nb-modal nb-modal--sm">
    <div class="nb-modal__header" data-slot="header">
      <h2 class="nb-modal__title" data-slot="title">Confirm Action</h2>
      <button class="nb-modal__close" data-slot="close">×</button>
    </div>
    <div class="nb-modal__body" data-slot="body">
      <p>Are you sure you want to proceed?</p>
    </div>
    <div class="nb-modal__footer" data-slot="footer">
      <button class="nb-btn nb-btn--ghost">Cancel</button>
      <button class="nb-btn nb-btn--primary">Confirm</button>
    </div>
  </div>
</div>
```

### Drawer `.nb-drawer`

**Variants:** `--left` `--right` (default) `--wide` `--full`
**States:** `.is-open`
**Slots:** header, title, close, body, footer

```html
<div class="nb-drawer nb-drawer--right is-open">
  <div class="nb-drawer__header" data-slot="header">
    <h3 class="nb-drawer__title" data-slot="title">Settings</h3>
    <button class="nb-drawer__close" data-slot="close">×</button>
  </div>
  <div class="nb-drawer__body" data-slot="body">
    <!-- Content -->
  </div>
  <div class="nb-drawer__footer" data-slot="footer">
    <button class="nb-btn nb-btn--primary">Save</button>
  </div>
</div>
```

### Tabs `.nb-tabs`

**Variants:** `--pills` `--vertical`
**States:** `.is-active`
**Slots:** list, tab, panel

```html
<div class="nb-tabs">
  <div class="nb-tabs__list" data-slot="list">
    <button class="nb-tabs__tab is-active" data-slot="tab">Tab 1</button>
    <button class="nb-tabs__tab" data-slot="tab">Tab 2</button>
    <button class="nb-tabs__tab" data-slot="tab">Tab 3</button>
  </div>
  <div class="nb-tabs__panel is-active" data-slot="panel">Panel 1 content</div>
  <div class="nb-tabs__panel" data-slot="panel">Panel 2 content</div>
  <div class="nb-tabs__panel" data-slot="panel">Panel 3 content</div>
</div>
```

### Accordion `.nb-accordion`

**States:** `.is-open` (on item)
**Slots:** item, trigger, icon, content

```html
<div class="nb-accordion" data-nb-accordion>
  <div class="nb-accordion__item is-open" data-slot="item">
    <button class="nb-accordion__trigger" data-slot="trigger">
      Section Title
      <span class="nb-accordion__icon" data-slot="icon">▼</span>
    </button>
    <div class="nb-accordion__content" data-slot="content">
      <p>Accordion content here.</p>
    </div>
  </div>
</div>
```

### Dropdown `.nb-dropdown`

**Variants:** `--right` `--up`
**States:** `.is-open`
**Slots:** trigger, menu, item, divider, header

```html
<div class="nb-dropdown" data-nb-dropdown>
  <button class="nb-btn nb-btn--secondary nb-dropdown__trigger" data-slot="trigger">Options</button>
  <div class="nb-dropdown__menu" data-slot="menu">
    <div class="nb-dropdown__header" data-slot="header">Actions</div>
    <button class="nb-dropdown__item" data-slot="item">Edit</button>
    <button class="nb-dropdown__item" data-slot="item">Duplicate</button>
    <hr class="nb-dropdown__divider" data-slot="divider">
    <button class="nb-dropdown__item" data-slot="item">Delete</button>
  </div>
</div>
```

### Navbar `.nb-navbar`

**States:** `.is-open` (mobile)
**Slots:** brand, nav, link, actions, toggle

```html
<nav class="nb-navbar">
  <a class="nb-navbar__brand" data-slot="brand" href="/">AppName</a>
  <div class="nb-navbar__nav" data-slot="nav">
    <a class="nb-navbar__link is-active" data-slot="link" href="/">Home</a>
    <a class="nb-navbar__link" data-slot="link" href="/about">About</a>
    <a class="nb-navbar__link" data-slot="link" href="/pricing">Pricing</a>
  </div>
  <div class="nb-navbar__actions" data-slot="actions">
    <button class="nb-btn nb-btn--primary nb-btn--sm">Sign Up</button>
  </div>
  <button class="nb-navbar__toggle" data-slot="toggle">☰</button>
</nav>
```

### Hero `.nb-hero`

**Variants:** `--split` `--centered`
**Slots:** container, content, title, subtitle, actions, media

```html
<section class="nb-hero nb-hero--split">
  <div class="nb-hero__container" data-slot="container">
    <div class="nb-hero__content" data-slot="content">
      <h1 class="nb-hero__title" data-slot="title">Build Bold Interfaces</h1>
      <p class="nb-hero__subtitle" data-slot="subtitle">A neo-brutalist component kit.</p>
      <div class="nb-hero__actions" data-slot="actions">
        <button class="nb-btn nb-btn--primary nb-btn--lg">Get Started</button>
        <button class="nb-btn nb-btn--outline nb-btn--lg">Learn More</button>
      </div>
    </div>
    <div class="nb-hero__media" data-slot="media">
      <img src="hero.png" alt="">
    </div>
  </div>
</section>
```

### Table `.nb-table`

**Variants:** `--striped` `--hover` `--compact` `--bordered`
**Slots:** wrapper

```html
<div class="nb-table-wrapper" data-slot="wrapper">
  <table class="nb-table nb-table--striped nb-table--hover">
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

### Badge `.nb-badge`

**Variants:** `--primary` `--secondary` `--danger` `--success` `--warning` `--info` `--dark` `--pill` `--lg` `--dot`

```html
<span class="nb-badge nb-badge--success">Active</span>
<span class="nb-badge nb-badge--danger nb-badge--pill">3</span>
<span class="nb-badge nb-badge--dot">New</span>
```

### Avatar `.nb-avatar`

**Variants (size):** `--xs` `--sm` (default) `--lg` `--xl`
**Variants (shape):** `--square`
**Slots:** image, fallback

```html
<div class="nb-avatar nb-avatar--lg">
  <img src="avatar.jpg" alt="Jane Doe">
</div>

<div class="nb-avatar">
  <span class="nb-avatar__initials" data-slot="fallback">JD</span>
</div>

<!-- Avatar group -->
<div class="nb-avatar-group">
  <div class="nb-avatar"><img src="a1.jpg" alt=""></div>
  <div class="nb-avatar"><img src="a2.jpg" alt=""></div>
  <div class="nb-avatar"><img src="a3.jpg" alt=""></div>
</div>
```

### Tooltip `.nb-tooltip`

**Positions:** `data-nb-position="top|bottom|left|right"`
**Slots:** trigger, content

```html
<span class="nb-tooltip" data-nb-tooltip>
  Hover me
  <span class="nb-tooltip__content" data-slot="content" data-nb-position="top">Tooltip text</span>
</span>
```

### Toast `.nb-toast`

**Variants:** `--info` `--success` `--warning` `--danger`
**Position:** `--top-left` `--top-center` `--top-right` `--bottom-left` `--bottom-center` `--bottom-right`
**Slots:** icon, content, title, message, close

```html
<div class="nb-toast nb-toast--success nb-toast--bottom-right">
  <span class="nb-toast__icon" data-slot="icon">✓</span>
  <div class="nb-toast__content" data-slot="content">
    <strong class="nb-toast__title" data-slot="title">Saved</strong>
    <p class="nb-toast__message" data-slot="message">Your changes were saved.</p>
  </div>
  <button class="nb-toast__close" data-slot="close">×</button>
</div>
```

### Progress `.nb-progress`

**Variants (size):** `--sm` `--lg`
**Variants (color):** `--danger` `--warning` `--info`
**Variants (style):** `--striped` `--animated` `--indeterminate`
**Slots:** label, bar

```html
<div class="nb-progress">
  <div class="nb-progress__label" data-slot="label">
    <span>Uploading…</span><span>65%</span>
  </div>
  <div class="nb-progress__bar" data-slot="bar" style="width: 65%"></div>
</div>
```

### Spinner `.nb-spinner`

**Variants (size):** `--sm` `--lg` `--xl`
**Variants (color):** `--primary` `--success` `--danger` `--white`

```html
<div class="nb-spinner nb-spinner--lg"></div>
```

### Breadcrumb `.nb-breadcrumb`

**Slots:** item, link, separator

```html
<nav>
  <ol class="nb-breadcrumb">
    <li class="nb-breadcrumb__item" data-slot="item">
      <a class="nb-breadcrumb__link" data-slot="link" href="/">Home</a>
      <span class="nb-breadcrumb__separator" data-slot="separator">/</span>
    </li>
    <li class="nb-breadcrumb__item" data-slot="item">
      <a class="nb-breadcrumb__link" data-slot="link" href="/docs">Docs</a>
      <span class="nb-breadcrumb__separator" data-slot="separator">/</span>
    </li>
    <li class="nb-breadcrumb__item" data-slot="item">
      <span class="nb-breadcrumb__link" data-slot="link">Current Page</span>
    </li>
  </ol>
</nav>
```

### Pagination `.nb-pagination`

**Variants:** `--sm`
**States:** `.is-active` `.is-disabled`
**Slots:** item, ellipsis

```html
<nav class="nb-pagination">
  <button class="nb-pagination__item" data-slot="item">← Prev</button>
  <button class="nb-pagination__item" data-slot="item">1</button>
  <button class="nb-pagination__item is-active" data-slot="item">2</button>
  <button class="nb-pagination__item" data-slot="item">3</button>
  <span class="nb-pagination__ellipsis" data-slot="ellipsis">…</span>
  <button class="nb-pagination__item" data-slot="item">10</button>
  <button class="nb-pagination__item" data-slot="item">Next →</button>
</nav>
```

### Sidebar `.nb-sidebar`

**States:** `.is-open`
**Slots:** header, nav, footer

```html
<aside class="nb-sidebar is-open">
  <div class="nb-sidebar__header" data-slot="header">
    <span>Dashboard</span>
    <button class="nb-sidebar__toggle">◀</button>
  </div>
  <nav class="nb-sidebar__nav" data-slot="nav">
    <a class="nb-sidebar__link is-active" href="/">Overview</a>
    <a class="nb-sidebar__link" href="/analytics">Analytics</a>
    <a class="nb-sidebar__link" href="/settings">Settings</a>
  </nav>
  <div class="nb-sidebar__footer" data-slot="footer">
    <span>v1.0.0</span>
  </div>
</aside>
```

### Stepper `.nb-stepper`

**States:** `.is-active` `.is-completed`
**Slots:** step

```html
<div class="nb-stepper">
  <div class="nb-stepper__step is-completed" data-slot="step">1. Account</div>
  <div class="nb-stepper__step is-active" data-slot="step">2. Profile</div>
  <div class="nb-stepper__step" data-slot="step">3. Review</div>
</div>
```

### Stat Card `.nb-stat-card`

**Slots:** label, value, trend

```html
<div class="nb-stat-card">
  <span class="nb-stat-card__label" data-slot="label">Revenue</span>
  <span class="nb-stat-card__value" data-slot="value">$12,450</span>
  <span class="nb-stat-card__change" data-slot="trend">↑ 12%</span>
</div>
```

### Empty State `.nb-empty-state`

**Slots:** icon, title, description

```html
<div class="nb-empty-state">
  <div class="nb-empty-state__icon" data-slot="icon">📭</div>
  <h3 class="nb-empty-state__title" data-slot="title">No results found</h3>
  <p class="nb-empty-state__description" data-slot="description">Try adjusting your search.</p>
</div>
```

### Skeleton `.nb-skeleton`

**Variants:** `--text` `--heading` `--avatar` `--card` `--image` `--button` `--circle`

```html
<div class="nb-skeleton nb-skeleton--heading"></div>
<div class="nb-skeleton nb-skeleton--text"></div>
<div class="nb-skeleton nb-skeleton--text"></div>
<div class="nb-skeleton nb-skeleton--avatar"></div>
```

### Divider `.nb-divider`

**Variants:** `--thin` `--thick` `--dashed` `--dotted` `--vertical` `--with-text` `--spaced-sm` `--spaced-lg`

```html
<hr class="nb-divider">
<hr class="nb-divider nb-divider--dashed nb-divider--spaced-lg">
<div class="nb-divider nb-divider--with-text">OR</div>
```

### Code Block `.nb-code-block`

**Slots:** header, content, copy-btn

```html
<div class="nb-code-block">
  <div class="nb-code-block__header" data-slot="header">
    <span>index.js</span>
    <button class="nb-code-block__copy-btn" data-slot="copy-btn">Copy</button>
  </div>
  <pre class="nb-code-block__content" data-slot="content"><code>console.log('hello');</code></pre>
</div>
```

### Timeline `.nb-timeline`

**Slots:** item, marker, content

```html
<div class="nb-timeline">
  <div class="nb-timeline__item" data-slot="item">
    <div class="nb-timeline__marker" data-slot="marker"></div>
    <div class="nb-timeline__content" data-slot="content">
      <strong>Order placed</strong>
      <p>Jan 15, 2026</p>
    </div>
  </div>
</div>
```

### File Upload `.nb-file-upload`

**States:** `.is-dragover` `.is-disabled`
**Slots:** icon, text, hint, input, list

```html
<div class="nb-file-upload" data-nb-file-upload>
  <div class="nb-file-upload__icon" data-slot="icon">📁</div>
  <span class="nb-file-upload__text" data-slot="text">Drop files here or click to upload</span>
  <span class="nb-file-upload__hint" data-slot="hint">PNG, JPG up to 10MB</span>
  <input class="nb-file-upload__input" data-slot="input" type="file" multiple>
</div>
```

### Search `.nb-search`

**Slots:** input, icon, shortcut

```html
<div class="nb-search" data-nb-search>
  <div class="nb-search__input-wrapper">
    <span class="nb-search__icon" data-slot="icon">🔍</span>
    <input class="nb-search__input" data-slot="input" type="text" placeholder="Search…">
    <kbd class="nb-search__shortcut" data-slot="shortcut">⌘K</kbd>
  </div>
</div>
```

### Tag Input `.nb-tag-input`

**States:** `.is-disabled`
**Slots:** tag, remove, input

```html
<div class="nb-tag-input" data-nb-tag-input>
  <span class="nb-tag-input__tag" data-slot="tag">
    React
    <button class="nb-tag-input__tag-remove" data-slot="remove">×</button>
  </span>
  <span class="nb-tag-input__tag" data-slot="tag">
    Vue
    <button class="nb-tag-input__tag-remove" data-slot="remove">×</button>
  </span>
  <input class="nb-tag-input__input" data-slot="input" type="text" placeholder="Add tag…">
</div>
```

---

## Wireframe → Kit Mapping

| Wireframe Pattern (Tailwind) | Kit Implementation |
|---|---|
| `bg-white border border-neutral-300 rounded p-4` (card) | `.nb-card` |
| `bg-white border border-neutral-300 rounded p-4 hover:shadow` (interactive card) | `.nb-card .nb-card--hover` |
| `bg-neutral-900 text-white font-semibold px-6 py-3 rounded` (primary btn) | `.nb-btn .nb-btn--primary` |
| `bg-white border border-neutral-300 text-neutral-700 px-4 py-2 rounded` (secondary btn) | `.nb-btn .nb-btn--secondary` |
| `bg-transparent text-neutral-600 px-4 py-2` (ghost btn) | `.nb-btn .nb-btn--ghost` |
| `border border-neutral-300 rounded px-3 py-2 text-sm` (text input) | `.nb-input` |
| `text-4xl font-bold` (display heading) | `<h1>` with `font-family: var(--nb-font-heading)` |
| `text-sm text-neutral-500` (helper text) | `.nb-help-text` |
| `text-xs font-semibold uppercase tracking-wide bg-neutral-100 px-2 py-1 rounded` (badge) | `.nb-badge` |
| `fixed inset-0 bg-black/50 flex items-center justify-center` (modal overlay) | `.nb-modal-backdrop.is-open` |
| `bg-white rounded shadow-lg p-6 max-w-md` (modal content) | `.nb-modal` |
| `border-b border-neutral-200 flex gap-4` (tab list) | `.nb-tabs__list` |
| `text-sm font-medium text-neutral-900 border-b-2 border-neutral-900 pb-2` (active tab) | `.nb-tabs__tab.is-active` |
| `flex items-center justify-between p-4 border-b` (navbar) | `.nb-navbar` |
| `bg-green-500 text-white rounded p-4` (success alert) | `.nb-alert .nb-alert--success` |
| `bg-red-50 border border-red-200 text-red-800 p-4 rounded` (danger alert) | `.nb-alert .nb-alert--danger` |
| `w-full h-2 bg-neutral-200 rounded` (progress track) | `.nb-progress` |
| `animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900` (spinner) | `.nb-spinner` |
| `flex flex-col gap-1 text-sm` (breadcrumb) | `.nb-breadcrumb` |
| `grid grid-cols-3 gap-4` (card grid) | `.nb-row .nb-row--gap-4` + `.nb-col-4` per card |

---

## Composition Patterns

### 1. Card Grid with Filter Bar

```html
<div class="nb-section">
  <div class="nb-container">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h2 style="font-family:var(--nb-font-heading);font-size:var(--nb-text-2xl);font-weight:var(--nb-font-bold)">Projects</h2>
      <div class="nb-tabs nb-tabs--pills">
        <div class="nb-tabs__list" data-slot="list">
          <button class="nb-tabs__tab is-active" data-slot="tab">All</button>
          <button class="nb-tabs__tab" data-slot="tab">Active</button>
          <button class="nb-tabs__tab" data-slot="tab">Archived</button>
        </div>
      </div>
    </div>
    <div class="nb-row nb-row--gap-6">
      <div class="nb-col-4">
        <div class="nb-card nb-card--hover">
          <div class="nb-card__header" data-slot="header"><h3>Project Alpha</h3></div>
          <div class="nb-card__body" data-slot="body"><p>Description of the project.</p></div>
          <div class="nb-card__footer" data-slot="footer">
            <span class="nb-badge nb-badge--success">Active</span>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card nb-card--hover">
          <div class="nb-card__header" data-slot="header"><h3>Project Beta</h3></div>
          <div class="nb-card__body" data-slot="body"><p>Another project description.</p></div>
          <div class="nb-card__footer" data-slot="footer">
            <span class="nb-badge nb-badge--warning">Pending</span>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card nb-card--hover">
          <div class="nb-card__header" data-slot="header"><h3>Project Gamma</h3></div>
          <div class="nb-card__body" data-slot="body"><p>Yet another project.</p></div>
          <div class="nb-card__footer" data-slot="footer">
            <span class="nb-badge nb-badge--danger">Overdue</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 2. Form with Validation and Stepper

```html
<div class="nb-container-sm">
  <div class="nb-stepper" style="margin-bottom:32px">
    <div class="nb-stepper__step is-completed" data-slot="step">1. Account</div>
    <div class="nb-stepper__step is-active" data-slot="step">2. Profile</div>
    <div class="nb-stepper__step" data-slot="step">3. Review</div>
  </div>

  <form>
    <div class="nb-field" data-slot="field">
      <label class="nb-label" data-slot="label">Full Name</label>
      <input class="nb-input" data-slot="control" type="text" placeholder="Jane Doe">
    </div>
    <div class="nb-field" data-slot="field">
      <label class="nb-label" data-slot="label">Email</label>
      <input class="nb-input is-invalid" data-slot="control" type="email">
      <span class="nb-help-text nb-help-text--error" data-slot="error-text">Please enter a valid email.</span>
    </div>
    <div class="nb-field" data-slot="field">
      <label class="nb-label" data-slot="label">Bio</label>
      <textarea class="nb-textarea" data-slot="control" rows="4" placeholder="Tell us about yourself…"></textarea>
      <span class="nb-help-text" data-slot="helper-text">Max 300 characters.</span>
    </div>
    <div style="display:flex;gap:12px;justify-content:flex-end">
      <button class="nb-btn nb-btn--ghost" type="button">Back</button>
      <button class="nb-btn nb-btn--primary" type="submit">Continue</button>
    </div>
  </form>
</div>
```

### 3. Dashboard Panel (Stat + Table)

```html
<div class="nb-container">
  <div class="nb-row nb-row--gap-6" style="margin-bottom:32px">
    <div class="nb-col-3">
      <div class="nb-stat-card">
        <span class="nb-stat-card__label" data-slot="label">Revenue</span>
        <span class="nb-stat-card__value" data-slot="value">$48,200</span>
        <span class="nb-stat-card__change" data-slot="trend">↑ 12%</span>
      </div>
    </div>
    <div class="nb-col-3">
      <div class="nb-stat-card">
        <span class="nb-stat-card__label" data-slot="label">Users</span>
        <span class="nb-stat-card__value" data-slot="value">3,421</span>
        <span class="nb-stat-card__change" data-slot="trend">↑ 8%</span>
      </div>
    </div>
    <div class="nb-col-3">
      <div class="nb-stat-card">
        <span class="nb-stat-card__label" data-slot="label">Orders</span>
        <span class="nb-stat-card__value" data-slot="value">892</span>
        <span class="nb-stat-card__change" data-slot="trend">↓ 3%</span>
      </div>
    </div>
    <div class="nb-col-3">
      <div class="nb-stat-card">
        <span class="nb-stat-card__label" data-slot="label">Conversion</span>
        <span class="nb-stat-card__value" data-slot="value">4.2%</span>
        <span class="nb-stat-card__change" data-slot="trend">↑ 1.1%</span>
      </div>
    </div>
  </div>

  <div class="nb-table-wrapper" data-slot="wrapper">
    <table class="nb-table nb-table--striped nb-table--hover">
      <thead>
        <tr>
          <th>Customer</th><th>Amount</th><th>Status</th><th>Date</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Jane Doe</td><td>$240.00</td><td><span class="nb-badge nb-badge--success">Paid</span></td><td>Mar 28</td></tr>
        <tr><td>John Smith</td><td>$125.00</td><td><span class="nb-badge nb-badge--warning">Pending</span></td><td>Mar 27</td></tr>
        <tr><td>Alice Brown</td><td>$89.50</td><td><span class="nb-badge nb-badge--danger">Failed</span></td><td>Mar 26</td></tr>
      </tbody>
    </table>
  </div>
</div>
```

### 4. Pricing Table

```html
<div class="nb-section">
  <div class="nb-container">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:var(--nb-font-heading);font-size:var(--nb-text-4xl);font-weight:var(--nb-font-bold)">Pricing</h2>
      <p style="color:var(--nb-gray-600);font-size:var(--nb-text-lg)">Choose the plan that fits.</p>
    </div>
    <div class="nb-row nb-row--gap-6 nb-row--items-stretch">
      <div class="nb-col-4">
        <div class="nb-card" style="height:100%;display:flex;flex-direction:column">
          <div class="nb-card__header" data-slot="header">
            <h3>Starter</h3>
            <p style="font-size:var(--nb-text-3xl);font-weight:var(--nb-font-bold)">$0<span style="font-size:var(--nb-text-sm);font-weight:normal">/mo</span></p>
          </div>
          <div class="nb-card__body" data-slot="body" style="flex:1">
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:var(--nb-text-sm)">
              <li>✓ 1 project</li><li>✓ 1GB storage</li><li>✓ Community support</li>
            </ul>
          </div>
          <div class="nb-card__footer" data-slot="footer">
            <button class="nb-btn nb-btn--outline nb-btn--full">Get Started</button>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card nb-card--highlight" style="height:100%;display:flex;flex-direction:column">
          <div class="nb-card__header" data-slot="header">
            <span class="nb-badge nb-badge--primary">Popular</span>
            <h3>Pro</h3>
            <p style="font-size:var(--nb-text-3xl);font-weight:var(--nb-font-bold)">$29<span style="font-size:var(--nb-text-sm);font-weight:normal">/mo</span></p>
          </div>
          <div class="nb-card__body" data-slot="body" style="flex:1">
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:var(--nb-text-sm)">
              <li>✓ 10 projects</li><li>✓ 50GB storage</li><li>✓ Priority support</li><li>✓ Custom domain</li>
            </ul>
          </div>
          <div class="nb-card__footer" data-slot="footer">
            <button class="nb-btn nb-btn--primary nb-btn--full">Upgrade</button>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card" style="height:100%;display:flex;flex-direction:column">
          <div class="nb-card__header" data-slot="header">
            <h3>Enterprise</h3>
            <p style="font-size:var(--nb-text-3xl);font-weight:var(--nb-font-bold)">Custom</p>
          </div>
          <div class="nb-card__body" data-slot="body" style="flex:1">
            <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:var(--nb-text-sm)">
              <li>✓ Unlimited projects</li><li>✓ Unlimited storage</li><li>✓ Dedicated support</li><li>✓ SLA</li>
            </ul>
          </div>
          <div class="nb-card__footer" data-slot="footer">
            <button class="nb-btn nb-btn--dark nb-btn--full">Contact Sales</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 5. Auth Form (Login)

```html
<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--nb-gray-50)">
  <div class="nb-card" style="width:100%;max-width:400px">
    <div class="nb-card__header" data-slot="header" style="text-align:center">
      <h2 style="font-family:var(--nb-font-heading);font-size:var(--nb-text-2xl);font-weight:var(--nb-font-bold)">Welcome back</h2>
      <p style="color:var(--nb-gray-500);font-size:var(--nb-text-sm)">Sign in to your account</p>
    </div>
    <div class="nb-card__body" data-slot="body">
      <form>
        <div class="nb-field" data-slot="field">
          <label class="nb-label" data-slot="label">Email</label>
          <input class="nb-input" data-slot="control" type="email" placeholder="you@example.com">
        </div>
        <div class="nb-field" data-slot="field">
          <label class="nb-label" data-slot="label">Password</label>
          <div class="nb-password-wrapper">
            <input class="nb-input" data-slot="control" type="password" placeholder="••••••••">
            <button class="nb-password-wrapper__toggle" type="button">👁</button>
          </div>
        </div>
        <button class="nb-btn nb-btn--primary nb-btn--full" type="submit">Sign In</button>
      </form>
    </div>
    <div class="nb-card__footer" data-slot="footer" style="text-align:center">
      <p style="font-size:var(--nb-text-sm);color:var(--nb-gray-500)">Don't have an account? <a class="nb-link">Sign up</a></p>
    </div>
  </div>
</div>
```

### 6. Hero Section with CTA

```html
<section class="nb-hero nb-hero--split">
  <div class="nb-hero__container" data-slot="container">
    <div class="nb-hero__content" data-slot="content">
      <span class="nb-badge nb-badge--primary nb-badge--pill" data-slot="eyebrow">New in v2.0</span>
      <h1 class="nb-hero__title" data-slot="title">Ship Faster with Bold Components</h1>
      <p class="nb-hero__subtitle" data-slot="subtitle">A neo-brutalist design system that makes interfaces impossible to ignore.</p>
      <div class="nb-hero__actions" data-slot="actions">
        <button class="nb-btn nb-btn--primary nb-btn--lg">Start Building</button>
        <button class="nb-btn nb-btn--outline nb-btn--lg">View Docs</button>
      </div>
    </div>
    <div class="nb-hero__media" data-slot="media">
      <img src="hero-illustration.svg" alt="Hero illustration">
    </div>
  </div>
</section>
```

### 7. Feature Grid

```html
<div class="nb-section">
  <div class="nb-container">
    <div style="text-align:center;margin-bottom:48px">
      <h2 style="font-family:var(--nb-font-heading);font-size:var(--nb-text-3xl);font-weight:var(--nb-font-bold)">Features</h2>
    </div>
    <div class="nb-row nb-row--gap-6">
      <div class="nb-col-4">
        <div class="nb-card nb-card--flat">
          <div class="nb-card__body" data-slot="body">
            <div style="font-size:var(--nb-text-2xl);margin-bottom:12px">⚡</div>
            <h3 style="font-weight:var(--nb-font-bold);margin-bottom:8px">Lightning Fast</h3>
            <p style="color:var(--nb-gray-600);font-size:var(--nb-text-sm)">Zero dependencies. Pure CSS + vanilla JS.</p>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card nb-card--flat">
          <div class="nb-card__body" data-slot="body">
            <div style="font-size:var(--nb-text-2xl);margin-bottom:12px">🎨</div>
            <h3 style="font-weight:var(--nb-font-bold);margin-bottom:8px">Themeable</h3>
            <p style="color:var(--nb-gray-600);font-size:var(--nb-text-sm)">Light, dark, and concrete themes built in.</p>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card nb-card--flat">
          <div class="nb-card__body" data-slot="body">
            <div style="font-size:var(--nb-text-2xl);margin-bottom:12px">♿</div>
            <h3 style="font-weight:var(--nb-font-bold);margin-bottom:8px">Accessible</h3>
            <p style="color:var(--nb-gray-600);font-size:var(--nb-text-sm)">Focus states, ARIA, keyboard navigation.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 8. Testimonial Section

```html
<div class="nb-section" style="background:var(--nb-gray-50)">
  <div class="nb-container">
    <h2 style="font-family:var(--nb-font-heading);font-size:var(--nb-text-3xl);font-weight:var(--nb-font-bold);text-align:center;margin-bottom:48px">What People Say</h2>
    <div class="nb-row nb-row--gap-6">
      <div class="nb-col-4">
        <div class="nb-card">
          <div class="nb-card__body" data-slot="body">
            <p style="font-style:italic;margin-bottom:16px">"Bold, unapologetic design. Exactly what we needed."</p>
            <div style="display:flex;align-items:center;gap:12px">
              <div class="nb-avatar nb-avatar--sm"><img src="t1.jpg" alt=""></div>
              <div>
                <strong>Sarah Chen</strong>
                <p style="font-size:var(--nb-text-xs);color:var(--nb-gray-500)">Design Lead, Acme</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card">
          <div class="nb-card__body" data-slot="body">
            <p style="font-style:italic;margin-bottom:16px">"Switched from Tailwind UI. Never looked back."</p>
            <div style="display:flex;align-items:center;gap:12px">
              <div class="nb-avatar nb-avatar--sm"><img src="t2.jpg" alt=""></div>
              <div>
                <strong>Mike Torres</strong>
                <p style="font-size:var(--nb-text-xs);color:var(--nb-gray-500)">CTO, StartupCo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="nb-col-4">
        <div class="nb-card">
          <div class="nb-card__body" data-slot="body">
            <p style="font-style:italic;margin-bottom:16px">"My clients love the brutalist aesthetic. Instant standout."</p>
            <div style="display:flex;align-items:center;gap:12px">
              <div class="nb-avatar nb-avatar--sm"><img src="t3.jpg" alt=""></div>
              <div>
                <strong>Priya Sharma</strong>
                <p style="font-size:var(--nb-text-xs);color:var(--nb-gray-500)">Freelance Designer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 9. FAQ Accordion

```html
<div class="nb-section">
  <div class="nb-container-sm">
    <h2 style="font-family:var(--nb-font-heading);font-size:var(--nb-text-3xl);font-weight:var(--nb-font-bold);text-align:center;margin-bottom:32px">FAQ</h2>
    <div class="nb-accordion" data-nb-accordion>
      <div class="nb-accordion__item is-open" data-slot="item">
        <button class="nb-accordion__trigger" data-slot="trigger">
          Is this free to use?
          <span class="nb-accordion__icon" data-slot="icon">▼</span>
        </button>
        <div class="nb-accordion__content" data-slot="content">
          <p>Yes, the kit is MIT licensed and free for commercial use.</p>
        </div>
      </div>
      <div class="nb-accordion__item" data-slot="item">
        <button class="nb-accordion__trigger" data-slot="trigger">
          Does it work with React?
          <span class="nb-accordion__icon" data-slot="icon">▼</span>
        </button>
        <div class="nb-accordion__content" data-slot="content">
          <p>It's plain HTML/CSS/JS. Works with any framework.</p>
        </div>
      </div>
      <div class="nb-accordion__item" data-slot="item">
        <button class="nb-accordion__trigger" data-slot="trigger">
          How do I customize the theme?
          <span class="nb-accordion__icon" data-slot="icon">▼</span>
        </button>
        <div class="nb-accordion__content" data-slot="content">
          <p>Override the CSS custom properties in tokens.css or use data-theme attributes.</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 10. Navigation with Dropdown

```html
<nav class="nb-navbar">
  <a class="nb-navbar__brand" data-slot="brand" href="/">
    <strong>AppName</strong>
  </a>
  <div class="nb-navbar__nav" data-slot="nav">
    <a class="nb-navbar__link is-active" data-slot="link" href="/">Dashboard</a>
    <div class="nb-dropdown" data-nb-dropdown>
      <button class="nb-navbar__link nb-dropdown__trigger" data-slot="trigger">
        Products ▾
      </button>
      <div class="nb-dropdown__menu" data-slot="menu">
        <a class="nb-dropdown__item" data-slot="item" href="/products/analytics">Analytics</a>
        <a class="nb-dropdown__item" data-slot="item" href="/products/automation">Automation</a>
        <hr class="nb-dropdown__divider" data-slot="divider">
        <a class="nb-dropdown__item" data-slot="item" href="/products/all">View All</a>
      </div>
    </div>
    <a class="nb-navbar__link" data-slot="link" href="/pricing">Pricing</a>
    <a class="nb-navbar__link" data-slot="link" href="/docs">Docs</a>
  </div>
  <div class="nb-navbar__actions" data-slot="actions">
    <button class="nb-btn nb-btn--ghost nb-btn--sm">Sign In</button>
    <button class="nb-btn nb-btn--primary nb-btn--sm">Get Started</button>
  </div>
  <button class="nb-navbar__toggle" data-slot="toggle">☰</button>
</nav>
```
