# UI Kit Parity Report

**Generated:** 2026-04-02
**Manifest version:** 1.0.0
**Kits compared:** Neobrutalism UI Kit (NB) vs DevKit (DK)

---

## 1. Executive Summary

| Metric | Count |
|---|---|
| **Total components** | 121 |
| Core tier | 44 |
| Extended tier | 57 |
| Infrastructure tier | 20 |
| **In both kits** | 42 |
| **NB-only** | 2 (decoration, button CSS) |
| **DK-only** | 77 |

- **NB** implements 44 of 121 total components.
- **DK** implements 119 of 121 total components (all except `decoration` and technically has no CSS for `button`, though the base class is declared).
- **Core parity:** Of 44 core components, 42 exist in both kits, 1 is NB-only (button -- DK has no CSS), and 1 is DK-only (tag-chip). **Core parity = 42/44 = 95.5%**.

---

## 2. Core Component Parity

| # | Component | Category | NB | DK |
|---|---|---|---|---|
| 1 | Accordion | data-display | Y | Y |
| 2 | Alert | feedback | Y | Y |
| 3 | Avatar | data-display | Y | Y |
| 4 | Badge | data-display | Y | Y |
| 5 | Breadcrumb | navigation | Y | Y |
| 6 | Button | forms | Y | X |
| 7 | Calendar | forms | Y | Y |
| 8 | Card | data-display | Y | Y |
| 9 | Checkbox | forms | Y | Y |
| 10 | Code Block | data-display | Y | Y |
| 11 | Date Display | data-display | Y | Y |
| 12 | Divider | layout | Y | Y |
| 13 | Drawer | feedback | Y | Y |
| 14 | Dropdown | navigation | Y | Y |
| 15 | Empty State | feedback | Y | Y |
| 16 | File Upload | forms | Y | Y |
| 17 | Footer | navigation | Y | Y |
| 18 | Hero | marketing | Y | Y |
| 19 | Input | forms | Y | Y |
| 20 | Link | navigation | Y | Y |
| 21 | Logo Cloud | marketing | Y | Y |
| 22 | Marquee | marketing | Y | Y |
| 23 | Modal | feedback | Y | Y |
| 24 | Navbar | navigation | Y | Y |
| 25 | Newsletter | marketing | Y | Y |
| 26 | Pagination | navigation | Y | Y |
| 27 | Pricing Card | marketing | Y | Y |
| 28 | Pricing Table | marketing | Y | Y |
| 29 | Progress | feedback | Y | Y |
| 30 | Radio | forms | Y | Y |
| 31 | Range | forms | Y | Y |
| 32 | Search | forms | Y | Y |
| 33 | Select | forms | Y | Y |
| 34 | Sidebar | navigation | Y | Y |
| 35 | Skeleton | feedback | Y | Y |
| 36 | Spinner | feedback | Y | Y |
| 37 | Stat Card | data-display | Y | Y |
| 38 | Stepper | navigation | Y | Y |
| 39 | Table | data-display | Y | Y |
| 40 | Tabs | navigation | Y | Y |
| 41 | Tag Chip | data-display | X | Y |
| 42 | Tag Input | forms | Y | Y |
| 43 | Timeline | data-display | Y | Y |
| 44 | Toast | feedback | Y | Y |
| 45 | Toggle | forms | Y | Y |
| 46 | Tooltip | feedback | Y | Y |
| 47 | Trust Bar | marketing | Y | Y |

---

## 3. Variant & State Mismatches

For each shared core component, the following differences were found by inspecting the actual CSS files.

### Accordion

| Aspect | NB | DK |
|---|---|---|
| Flush variant | `.nb-accordion--flush` | Not implemented |

NB has a flush variant (no outer border). DK does not.

### Alert

| Aspect | NB | DK |
|---|---|---|
| Info variant | Y | Y |
| Success variant | Y | Y |
| Warning variant | Y | Y |
| Danger variant | Y | Y |
| Banner variant | Y | Y |
| Dismiss slot | `.nb-alert__dismiss` | `.dk-alert_close` |

Parity is good. Both kits implement the same color variants and banner variant.

### Badge

| Variant | NB | DK |
|---|---|---|
| primary | Y | X (uses success) |
| secondary | Y | X |
| danger | Y | Y |
| success | X | Y |
| warning | X | Y |
| info | X | Y |
| dark | Y | X |
| pill | Y | X |
| lg | Y | Y |
| sm | X | Y |
| dot | X | Y |
| outline | X | Y |

Significant divergence in color naming. NB uses `primary`/`secondary`/`dark`; DK uses `success`/`warning`/`info`. DK adds `dot`, `outline`, and `sm` variants that NB lacks. NB has `pill` which DK lacks.

### Card

| Variant | NB | DK |
|---|---|---|
| hover | Y | Y |
| highlight | Y | X |
| flat | Y | X |
| sm / lg sizes | Y | X |
| Color accents (primary, success, danger, warning, info) | Y | X |
| bordered | X | Y |
| ghost | X | Y |

Major divergence. NB has extensive color accent variants and size variants. DK uses a simpler `bordered`/`ghost` approach.

### Divider

| Variant | NB | DK |
|---|---|---|
| thin | Y | X |
| thick | Y | X |
| dashed | Y | Y (different naming: `dk-divider-dashed` not `--dashed`) |
| dotted | Y | Y (different naming) |
| vertical | Y | Y (different naming) |
| with-text | Y | Y (different naming) |

NB uses BEM modifier syntax (`--dashed`). DK uses flat class names (`dk-divider-dashed`). NB has `thin` and `thick` weight variants that DK lacks.

### Drawer

Both kits implement left, right, bottom, wide, and full variants. NB includes `:active` on close button; DK does not. Otherwise at parity.

### Dropdown

| Aspect | NB | DK |
|---|---|---|
| right variant | Y | Y |
| up variant | Y | Y |
| `.is-active` on items | Y | X |
| `.is-focused` on items | X | Y |
| `:active` on items | Y | X |
| Shortcut hints | X | Y (`.dk-dropdown_shortcut`) |
| Icon slot | X | Y (`.dk-dropdown_icon`) |

DK adds shortcut hint and icon slot in dropdown items. NB supports `:active` pseudo-class on items, while DK uses `.is-focused` class instead.

### Hero

| Variant | NB | DK |
|---|---|---|
| split | Y | Y |
| centered | Y | Y |
| dark | Y | X |
| yellow | Y | X |
| lg (padding) | X | Y |

NB has color-theme variants (`--dark`, `--yellow`). DK has a large padding variant instead.

### Input

| Aspect | NB | DK |
|---|---|---|
| Size: sm | X | Y |
| Size: lg | Y | Y |
| `:focus` (non-visible) | Y | X |
| `:focus-visible` | Y | Y |
| `:disabled` | Y | Y |
| `.is-disabled` | Y | X |
| `.is-invalid` | Y | Y |
| `.is-valid` | Y | Y |
| `.is-invalid :focus-visible` | Y (via `:focus`) | Y |
| Fieldset/Legend | X | Y |
| `--required` label | X | Y |

DK adds `sm` size, `fieldset`/`legend`, and `--required` label. NB supports both `:disabled` and `.is-disabled` classes; DK only uses `:disabled`.

### Pagination

NB implements `:active` on items; DK does not. DK implements `:disabled` on prev/next controls; NB uses `.is-disabled` class instead.

### Progress

| Variant | NB | DK |
|---|---|---|
| sm / lg | Y | Y |
| danger / warning / info colors | Y | Y |
| striped | Y | Y |
| animated | Y | Y |
| indeterminate | Y | X |

NB has an `indeterminate` variant that DK lacks.

### Select

| Aspect | NB | DK |
|---|---|---|
| `.is-disabled` on option | Y | X |
| `.is-focused` on option | X | Y |
| `.is-active` on option | X | Y |
| `.is-hidden` on option | X | Y |
| Search input inside menu | X | Y |
| Empty state message | X | Y |

DK has a more complete custom select with search, empty state, and keyboard-focused option styling. NB has disabled option support.

### Skeleton

| Variant | NB | DK |
|---|---|---|
| text | Y | Y |
| heading | Y | X |
| avatar / avatar-sm / avatar-lg | Y | X |
| card | Y | Y |
| image | Y | X |
| button | Y | X |
| circle | Y | Y |
| no-animate | Y | X |

NB has significantly more skeleton shape variants (7 vs 3 in DK).

### Spinner

| Variant | NB | DK |
|---|---|---|
| sm | Y | Y |
| lg | Y | Y |
| xl | Y | X |
| primary | Y | X |
| success | Y | X |
| danger | Y | Y |
| white | Y | Y |

NB has `xl`, `primary`, and `success` color variants that DK lacks.

### Tabs

| Variant | NB | DK |
|---|---|---|
| pills | Y | Y (named `--pill`) |
| vertical | Y | X |
| bordered | X | Y |
| `:active` on tab | Y | X |
| `:focus-visible` on tab | Y | X |

NB has vertical tabs and `:active`/`:focus-visible` on tab items. DK has a bordered variant instead.

### Toggle

Both kits implement checked, focus-visible, and disabled states. NB additionally supports `.is-active` class alongside `:checked` and includes `:hover` on track/thumb. DK relies solely on `:checked` input state.

---

## 4. State Coverage Matrix

States were verified by reading actual CSS selectors (`:hover`, `:active`, `:focus-visible`, `:disabled`, `[disabled]`, `.is-disabled`, `.is-loading`, `.is-invalid`).

| Component | Kit | hover | active | focus-visible | disabled | loading | invalid |
|---|---|---|---|---|---|---|---|
| **Button** | NB | Y | Y | Y | Y | Y | -- |
| **Button** | DK | -- | -- | -- | -- | -- | -- |
| **Input** | NB | -- | -- | Y | Y | -- | Y |
| **Input** | DK | -- | -- | Y | Y | -- | Y |
| **Checkbox** | NB | Y | -- | Y | Y | -- | -- |
| **Checkbox** | DK | -- | -- | Y | Y | -- | -- |
| **Radio** | NB | Y | -- | Y | Y | -- | -- |
| **Radio** | DK | -- | -- | Y | Y | -- | -- |
| **Toggle** | NB | Y | -- | Y | Y | -- | -- |
| **Toggle** | DK | -- | -- | Y | Y | -- | -- |
| **Select** | NB | Y | -- | Y | Y | -- | Y |
| **Select** | DK | -- | -- | Y | -- | -- | -- |
| **Search** | NB | Y | -- | Y | Y | -- | -- |
| **Search** | DK | -- | -- | Y | -- | -- | -- |
| **Range** | NB | Y | Y | Y | Y | -- | -- |
| **Range** | DK | Y | -- | Y | Y | -- | -- |
| **Dropdown** | NB | Y | Y | Y | Y* | -- | -- |
| **Dropdown** | DK | Y | -- | -- | Y | -- | -- |
| **Tabs** | NB | Y | Y | Y | -- | -- | -- |
| **Tabs** | DK | Y | -- | -- | -- | -- | -- |
| **Pagination** | NB | Y | Y | Y | Y* | -- | -- |
| **Pagination** | DK | Y | -- | Y | Y | -- | -- |
| **Accordion** | NB | Y | -- | Y | -- | -- | -- |
| **Accordion** | DK | Y | -- | Y | -- | -- | -- |
| **File Upload** | NB | Y | -- | Y* | Y* | -- | -- |
| **File Upload** | DK | Y | -- | -- | Y | -- | -- |
| **Drawer** | NB | Y | Y | Y | -- | -- | -- |
| **Drawer** | DK | Y | -- | Y | -- | -- | -- |
| **Modal** | NB | Y | Y | Y | -- | -- | -- |
| **Modal** | DK | Y | -- | Y | -- | -- | -- |
| **Navbar** | NB | Y | -- | Y | -- | -- | -- |
| **Navbar** | DK | Y | -- | -- | -- | -- | -- |
| **Sidebar** | NB | Y | -- | -- | -- | -- | -- |
| **Sidebar** | DK | Y | -- | Y | -- | -- | -- |
| **Toast** | NB | Y | -- | -- | -- | -- | -- |
| **Toast** | DK | Y | -- | -- | -- | -- | -- |

*Y\* = uses `.is-disabled` / `:focus-within` rather than native pseudo-class*

**Key observations:**
- NB consistently implements `:active` states; DK almost never does.
- NB has broader `:focus-visible` coverage across navigation components (navbar, tabs, dropdown items).
- Both kits consistently implement `:disabled` on form controls.
- Only NB button has `.is-loading` -- no other component in either kit implements a loading state.
- DK sidebar has `:focus-visible` on search input; NB sidebar does not.

---

## 5. Backport Priority List

### Core components missing from NB kit

| Priority | Component | Rationale |
|---|---|---|
| 1 | **Tag Chip** | Standalone tag/chip element; NB already has tag-input but lacks the standalone chip. Required for consistent tag display outside of input context. |

### CSS missing from DK

| Priority | Component | Issue |
|---|---|---|
| 1 | **Button** | `dk-btn` base class is declared in the manifest but no CSS file exists. This is the highest-priority gap in the entire system -- buttons are foundational. |

---

## 6. Extended Components Gap List

The following 53 extended-tier components exist only in DK. NB does not implement any of these.

| # | Component | Category |
|---|---|---|
| 1 | Activity Feed | data-display |
| 2 | Alert Dialog | feedback |
| 3 | Announcement Bar | marketing |
| 4 | Blog Card | marketing |
| 5 | Callout | feedback |
| 6 | Cart Summary | application |
| 7 | Chat Interface | application |
| 8 | Chat Message | application |
| 9 | Checkbox Card | forms |
| 10 | Checkout Stepper | application |
| 11 | Clipboard | application |
| 12 | Color Picker | forms |
| 13 | Combobox | forms |
| 14 | Command Palette | application |
| 15 | Comment Thread | application |
| 16 | Context Menu | navigation |
| 17 | Countdown | data-display |
| 18 | CTA Section | marketing |
| 19 | Dashboard Widget | application |
| 20 | Data Table | data-display |
| 21 | Date Picker | forms |
| 22 | Date Range Picker | forms |
| 23 | Description List | data-display |
| 24 | Editable Text | forms |
| 25 | Error Boundary | feedback |
| 26 | FAQ | marketing |
| 27 | Feature Comparison | marketing |
| 28 | Feature Grid | marketing |
| 29 | Feature Highlight | marketing |
| 30 | File Browser | application |
| 31 | Hover Card | data-display |
| 32 | Kanban Board | application |
| 33 | Loading Overlay | feedback |
| 34 | Menubar | navigation |
| 35 | Multiselect | forms |
| 36 | Navigation Menu | navigation |
| 37 | Notification Center | application |
| 38 | Number Input | forms |
| 39 | Password Input | forms |
| 40 | Pill Nav | navigation |
| 41 | PIN Input | forms |
| 42 | Popover | feedback |
| 43 | Product Card | marketing |
| 44 | Profile Card | data-display |
| 45 | Progress Circle | feedback |
| 46 | Promo Banner | marketing |
| 47 | QR Code | data-display |
| 48 | Radio Card | forms |
| 49 | Rating | forms |
| 50 | Review Card | marketing |
| 51 | Rich Text Editor | application |
| 52 | Scroll Area | layout |
| 53 | Segmented Control | forms |
| 54 | Settings Panel | application |
| 55 | Splitter | layout |
| 56 | Status Indicator | data-display |
| 57 | Team Grid | marketing |
| 58 | Testimonial | marketing |
| 59 | Testimonial Slider | marketing |
| 60 | Time Picker | forms |
| 61 | Toggle Group | forms |
| 62 | Tree View | data-display |
| 63 | Vertical Tabs | navigation |

The following extended-tier components exist in both kits:

- API Playground
- JSON Viewer
- Link Preview
- Media Gallery

The following extended-tier component exists only in NB:

- **Decoration** (floating animated decorative elements)
