# Contributing to NB UI Kit

Thank you for your interest in contributing! This guide covers the basics.

## Development Setup

1. Clone the repository
2. Run `npm install` to get dev dependencies
3. Run `npm run dev` to start a local server at http://localhost:8080
4. Run `npm run build` to rebuild the dist bundles

## Component Structure

Each component follows this pattern:

```
css/components/my-component.css    # Styles
js/components/my-component.js      # Behavior (optional)
```

## Naming Conventions

- **CSS classes**: `.nb-component__element--modifier` (BEM)
- **CSS tokens**: `--nb-category-variant` (e.g., `--nb-yellow-500`)
- **JS data attributes**: `data-nb-component`

## Design Principles

1. **Token-first**: Use `--nb-*` custom properties, never hardcode values
2. **Layer wrapping**: All component CSS goes inside `@layer components {}`
3. **Zero dependencies**: Pure CSS + vanilla JS only
4. **Accessibility**: Include `:focus-visible`, `prefers-reduced-motion`, ARIA where needed
5. **Responsive**: Mobile-first with breakpoint tokens

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run build` to verify the build
4. Submit a PR with a clear description

## Reporting Issues

Please use GitHub Issues with:
- Expected vs actual behavior
- Browser/device info
- Minimal reproduction steps
