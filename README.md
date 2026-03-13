# NB UI Kit

A clean Neo Brutalism design system — 40+ components, bold borders, hard shadows, pure CSS + vanilla JS. Zero dependencies.

## Quick Start

### CDN (easiest)

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ashishbishnoi18/nb-ui-kit@main/dist/nb-ui-kit.min.css">
<script src="https://cdn.jsdelivr.net/gh/ashishbishnoi18/nb-ui-kit@main/dist/nb-ui-kit.min.js"></script>
```

### Download

Copy `dist/nb-ui-kit.min.css` (112 KB) and `dist/nb-ui-kit.min.js` (66 KB) into your project:

```html
<link rel="stylesheet" href="nb-ui-kit.min.css">
<script src="nb-ui-kit.min.js"></script>
```

### npm

```bash
npm install nb-ui-kit
```

```html
<link rel="stylesheet" href="node_modules/nb-ui-kit/dist/nb-ui-kit.min.css">
<script src="node_modules/nb-ui-kit/dist/nb-ui-kit.min.js"></script>
```

### Git Submodule

```bash
git submodule add git@github.com:ashishbishnoi18/nb-ui-kit.git lib/nb-ui-kit
```

## Fonts

NB UI Kit uses **Space Grotesk** for headings, **DM Sans** for body text, and **JetBrains Mono** for code. Add this to your `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
```

## Components

### Layout
- Grid (12-column responsive)
- Containers (sm/md/lg/xl)
- Auth Layout (split-screen)

### Forms
- Inputs & Textareas
- Select (custom dropdown)
- Checkbox & Radio
- Toggle Switch
- File Upload
- Tag Input (multi-value chips)
- Range Slider
- Search (with Cmd+K shortcut)

### Data Display
- Tables (sortable, striped, hover)
- Cards (accent colors, hover, flat)
- Stat Cards (KPI metrics)
- Badges (dot, pill, colors)
- Avatars (sizes, initials)
- Timeline (colored dots, hover)
- Calendar (interactive, keyboard nav)
- Date Display (relative, short, long)
- Link Preview (horizontal, compact, vertical)
- Media Gallery (grid, masonry, video, GIF)

### Navigation
- Navbar (sticky, mobile toggle)
- Sidebar (collapsible)
- Breadcrumbs
- Pagination
- Tabs
- Stepper/Wizard (horizontal, vertical)

### Feedback
- Alerts (info, success, warning, danger)
- Toasts (positioned, auto-dismiss)
- Modals (sm, lg, full)
- Drawer/Slide-over (left, right, wide)
- Skeleton Loaders (shimmer animation)
- Spinners (sizes, colors)
- Empty States (icon, message, action)
- Progress Bars (striped, animated)
- Tooltips

### Typography & Content
- Styled Links (underline, arrow, external, button)
- Dividers (solid, dashed, dotted, with text, vertical)
- Accordions (single, multiple, flush)
- Dropdowns
- Footer (grid, dark variant)

## Page Templates

12 ready-to-use pages in `pages/`:

| Page | Description |
|------|-------------|
| `landing.html` | Marketing landing page |
| `pricing.html` | Pricing with comparison table |
| `login.html` | Magic link + Google auth |
| `signup.html` | Registration with social auth |
| `forgot-password.html` | Password reset |
| `magic-link.html` | Email confirmation |
| `dashboard.html` | App dashboard layout |
| `settings.html` | Account settings with tabs |
| `blog.html` | Blog listing |
| `blog-post.html` | Blog post |
| `docs.html` | Documentation |
| `404.html` | Error page |

## Design Tokens

All design decisions are CSS custom properties. Override them to theme the entire system:

```css
:root {
  --nb-black: #000000;
  --nb-yellow-500: #FAFF00;
  --nb-green-500: #00FF00;
  --nb-font-sans: 'DM Sans', system-ui, sans-serif;
  --nb-font-heading: 'Space Grotesk', system-ui, sans-serif;
  --nb-border: 2px solid var(--nb-black);
  --nb-shadow-md: 4px 4px 0 var(--nb-black);
  /* ...and many more */
}
```

## Development

```bash
# Preview locally
npm run dev
# → opens http://localhost:8080

# Build dist bundles
npm run build
# → dist/nb-ui-kit.css + dist/nb-ui-kit.min.css
# → dist/nb-ui-kit.js  + dist/nb-ui-kit.min.js
```

## Browser Support

All modern browsers: Chrome, Firefox, Safari, Edge. Uses CSS layers, custom properties, and progressive enhancement.

## License

MIT
