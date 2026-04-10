# Component Reference

Master checklist of every component a design library could include.
Use as a planning guide when building any design kit.

**Legend:**
- `[x]` = Implemented in NB UI Kit
- `[ ]` = Not yet implemented
- `[CSS]` = CSS-only
- `[CSS+JS]` = CSS + JavaScript
- `[JS-heavy]` = Primarily JavaScript

---

## 1. Layout (16)

- [x] **Container** — Constrains content width to responsive breakpoints `[CSS]`
- [x] **Grid** — 12-column responsive grid system `[CSS]`
- [x] **Section** — Vertical spacing wrapper for page sections `[CSS]`
- [x] **Separator / Divider** — Visual line between content blocks `[CSS]`
- [ ] **Box** — Generic container with styling props (padding, margin, bg) `[CSS]`
- [ ] **Flex** — Flexbox container with direction, alignment, gap control `[CSS]`
- [ ] **Stack** — Vertical or horizontal stack with consistent spacing `[CSS]`
- [ ] **Columns** — Multi-column text or content layout `[CSS]`
- [ ] **Aspect Ratio** — Maintains fixed aspect ratio for responsive elements `[CSS]`
- [ ] **Spacer** — Creates fixed or proportional empty space `[CSS]`
- [ ] **Center** — Centers content horizontally and/or vertically `[CSS]`
- [ ] **Float** — Floats content alongside text or other elements `[CSS]`
- [ ] **Group** — Groups related elements with shared spacing and alignment `[CSS]`
- [ ] **Bleed** — Allows content to extend beyond parent container edges `[CSS]`
- [ ] **Scroll Area** — Custom scrollbar styling with native scroll behavior `[CSS+JS]`
- [ ] **Splitter / Resizable Panels** — Draggable divider between resizable panes `[JS-heavy]`

---

## 2. Typography (11)

- [x] **Heading** — Semantic heading elements (H1-H6) with consistent scale `[CSS]`
- [x] **Text / Paragraph** — Base text with size, weight, color controls `[CSS]`
- [x] **Code (inline)** — Inline monospace code snippet `[CSS]`
- [x] **Code Block** — Multi-line code display with copy button `[CSS+JS]`
- [x] **Link** — Anchor element with underline and hover variants `[CSS]`
- [x] **Blockquote** — Styled citation or quote block `[CSS]`
- [ ] **Kbd** — Keyboard key visual (e.g., `Ctrl` + `K`) `[CSS]`
- [ ] **Mark / Highlight** — Highlighted or emphasized text span `[CSS]`
- [ ] **Prose** — Rich text container with automatic typography defaults `[CSS]`
- [ ] **List** — Styled ordered and unordered lists `[CSS]`
- [ ] **Description List** — Key-value pairs (dt/dd) display `[CSS]`

---

## 3. Forms & Inputs (33)

- [x] **Input** — Single-line text input field `[CSS]`
- [x] **Textarea** — Multi-line text input `[CSS]`
- [x] **Password Input** — Masked input with show/hide toggle `[CSS+JS]`
- [x] **Search Input** — Input with search icon, clear button, Cmd+K shortcut `[CSS+JS]`
- [x] **Select (native)** — Browser-native dropdown select `[CSS]`
- [x] **Select (custom)** — Fully styled dropdown with search and keyboard nav `[CSS+JS]`
- [x] **Checkbox** — Boolean selection control `[CSS+JS]`
- [x] **Radio** — Single selection from a group `[CSS+JS]`
- [x] **Switch / Toggle** — Binary on/off toggle control `[CSS+JS]`
- [x] **Slider / Range** — Draggable range input with value display `[CSS+JS]`
- [x] **File Upload** — Drag-and-drop upload zone with file list `[CSS+JS]`
- [x] **Tags / Chip Input** — Multi-value input creating tag chips `[CSS+JS]`
- [x] **Label** — Form input label element `[CSS]`
- [x] **Field / Form Group** — Wrapper combining label, input, help text `[CSS]`
- [x] **Input Group** — Input with prefix/suffix elements (icons, text) `[CSS]`
- [x] **Help Text** — Contextual hint text below an input `[CSS]`
- [x] **Error Message** — Validation error text below an input `[CSS]`
- [ ] **Number Input** — Numeric input with increment/decrement buttons `[CSS+JS]`
- [ ] **Pin / OTP Input** — Segmented input for verification codes `[CSS+JS]`
- [ ] **Combobox / Autocomplete** — Searchable input with filtered suggestions `[CSS+JS]`
- [ ] **Multiselect** — Select multiple options from a dropdown list `[CSS+JS]`
- [ ] **Checkbox Card** — Card-styled checkbox for visual option selection `[CSS+JS]`
- [ ] **Radio Card** — Card-styled radio for visual option selection `[CSS+JS]`
- [ ] **Toggle Group** — Group of toggle buttons (single or multi select) `[CSS+JS]`
- [ ] **Segmented Control** — Button group acting as a selector `[CSS+JS]`
- [ ] **Date Picker** — Calendar-based date selection input `[CSS+JS]`
- [ ] **Time Picker** — Time selection input with hour/minute controls `[CSS+JS]`
- [ ] **Date Range Picker** — Selection of start and end dates `[CSS+JS]`
- [ ] **Color Picker** — Color selection with swatch and custom input `[CSS+JS]`
- [ ] **Rating** — Star or numeric rating input `[CSS+JS]`
- [ ] **Rich Text Editor** — WYSIWYG formatted text editor `[JS-heavy]`
- [ ] **Editable Text** — Inline text that becomes an input on click `[CSS+JS]`
- [ ] **Fieldset** — Groups related fields with legend `[CSS]`

---

## 4. Data Display (25)

- [x] **Table** — Semantic table with header, rows, cells `[CSS]`
- [x] **Data Table** — Table with sorting, striping, hover states `[CSS+JS]`
- [x] **Card** — Container for grouped content with header/body/footer `[CSS]`
- [x] **Stat Card** — KPI metric display with label and value `[CSS]`
- [x] **Avatar** — User profile image with fallback initials `[CSS]`
- [x] **Avatar Group** — Overlapping stack of avatars `[CSS]`
- [x] **Badge** — Small label for status or counts `[CSS]`
- [x] **Timeline** — Chronological event list with vertical line `[CSS]`
- [x] **Calendar** — Interactive month calendar with date selection `[CSS+JS]`
- [x] **Date Display** — Formatted date with relative time support `[CSS+JS]`
- [x] **Marquee** — Auto-scrolling horizontal content strip `[CSS+JS]`
- [x] **Link Preview** — URL preview card with thumbnail and metadata `[CSS]`
- [x] **Media Gallery** — Responsive image/video grid `[CSS]`
- [x] **JSON Viewer** — Collapsible JSON tree with syntax coloring `[CSS+JS]`
- [x] **Accordion / Collapsible** — Expandable content sections `[CSS+JS]`
- [x] **Empty State** — Placeholder for no-data states with icon and CTA `[CSS]`
- [x] **Skeleton** — Shimmer loading placeholder `[CSS]`
- [ ] **Tag / Chip** — Removable keyword or category label `[CSS+JS]`
- [ ] **Image** — Optimized image with lazy loading and aspect ratio `[CSS]`
- [ ] **Icon** — SVG icon component with size and color control `[CSS]`
- [ ] **Clipboard / Copy** — Copy-to-clipboard button with feedback `[CSS+JS]`
- [ ] **QR Code** — Generated QR code image `[JS-heavy]`
- [ ] **Tree View** — Hierarchical expandable list `[CSS+JS]`
- [ ] **Description List** — Key-value pairs display `[CSS]`
- [ ] **Status Indicator** — Colored dot or badge for online/offline/busy states `[CSS]`

---

## 5. Navigation (15)

- [x] **Navbar / Header** — Top navigation bar with logo, links, actions `[CSS+JS]`
- [x] **Sidebar** — Collapsible side navigation panel `[CSS+JS]`
- [x] **Breadcrumb** — Navigation path showing page hierarchy `[CSS]`
- [x] **Pagination** — Page-by-page navigation controls `[CSS]`
- [x] **Tabs** — Horizontal tab navigation switching content panels `[CSS+JS]`
- [x] **Stepper / Wizard** — Multi-step progress indicator `[CSS+JS]`
- [x] **Dropdown Menu** — Click-triggered option list `[CSS+JS]`
- [x] **Footer** — Page footer with link columns and bottom bar `[CSS]`
- [ ] **Vertical Tabs** — Side-aligned tab navigation `[CSS+JS]`
- [ ] **Context Menu** — Right-click contextual option menu `[CSS+JS]`
- [ ] **Menubar** — Horizontal menu bar with nested submenus `[CSS+JS]`
- [ ] **Navigation Menu** — Structured navigation with mega-menu support `[CSS+JS]`
- [ ] **Command Palette** — Cmd+K searchable action launcher `[JS-heavy]`
- [ ] **Skip Nav** — Accessibility skip-to-content link `[CSS]`
- [ ] **Pill Nav** — Horizontal scrollable pill-shaped navigation `[CSS]`

---

## 6. Feedback & Overlays (15)

- [x] **Modal / Dialog** — Centered overlay with backdrop and focus trap `[CSS+JS]`
- [x] **Drawer / Sheet** — Slide-in panel from left or right `[CSS+JS]`
- [x] **Tooltip** — Text hint on hover/focus `[CSS+JS]`
- [x] **Toast / Notification** — Temporary auto-dismissing message `[CSS+JS]`
- [x] **Alert / Banner** — Contextual message bar (info, success, warning, danger) `[CSS+JS]`
- [x] **Spinner** — Rotating loading indicator `[CSS]`
- [x] **Progress Bar** — Linear progress indicator with label `[CSS]`
- [x] **Skeleton Loader** — Shimmer placeholder while content loads `[CSS]`
- [ ] **Alert Dialog** — Confirmation modal requiring user action `[CSS+JS]`
- [ ] **Popover** — Rich floating overlay triggered by click `[CSS+JS]`
- [ ] **Hover Card** — Contextual preview card on hover `[CSS+JS]`
- [ ] **Callout** — Highlighted message block with icon and text `[CSS]`
- [ ] **Progress Circle** — Circular progress indicator `[CSS]`
- [ ] **Loading Overlay** — Full-page or full-container loading state `[CSS]`
- [ ] **Error Boundary** — Fallback UI for caught errors `[CSS+JS]`

---

## 7. Marketing & Landing (19)

- [x] **Hero Section** — Large banner with headline, subheadline, and CTA `[CSS]`
- [x] **Pricing Card** — Single plan/tier pricing display `[CSS]`
- [x] **Pricing Table** — Multi-tier pricing comparison layout `[CSS+JS]`
- [x] **Newsletter Signup** — Email capture form/card `[CSS]`
- [x] **Trust Bar** — Social proof strip (ratings, counts, badges) `[CSS]`
- [x] **Logo Cloud** — Partner or client logos grid `[CSS]`
- [ ] **Feature Grid** — Grid of feature cards with icons and descriptions `[CSS]`
- [ ] **Feature Highlight** — Large visual with feature description (alternating layout) `[CSS]`
- [ ] **CTA Section** — Full-width call-to-action area `[CSS]`
- [ ] **Testimonial** — Single customer quote/review card `[CSS]`
- [ ] **Testimonial Slider** — Carousel of rotating testimonials `[CSS+JS]`
- [ ] **Review Card** — User review with rating stars and text `[CSS]`
- [ ] **Feature Comparison** — Side-by-side feature matrix table `[CSS]`
- [ ] **Team Grid** — Team member profile cards layout `[CSS]`
- [ ] **FAQ Section** — Frequently asked questions accordion `[CSS+JS]`
- [ ] **Blog Post Card** — Article preview card with image and metadata `[CSS]`
- [ ] **Promo / Offer Banner** — Time-limited promotion display `[CSS]`
- [ ] **Announcement Bar** — Top-of-page dismissable announcement strip `[CSS+JS]`
- [ ] **Countdown Timer** — Countdown to a target date/time `[CSS+JS]`

---

## 8. Application-Specific (14)

- [x] **API Playground** — Interactive API endpoint testing interface `[CSS+JS]`
- [ ] **Dashboard Widget** — Customizable dashboard element container `[CSS]`
- [ ] **Activity Feed** — Chronological activity/event stream `[CSS]`
- [ ] **Notification Center** — Notification list with read/unread states `[CSS+JS]`
- [ ] **Settings Panel** — Configuration interface with grouped options `[CSS+JS]`
- [ ] **User Profile Card** — User info display with avatar and details `[CSS]`
- [ ] **Comment Thread** — Nested discussion/comment display `[CSS+JS]`
- [ ] **Chat Message** — Individual message bubble in conversation `[CSS]`
- [ ] **Chat Interface** — Full chat UI with message list and input `[CSS+JS]`
- [ ] **Product Card** — E-commerce product with image, price, rating `[CSS]`
- [ ] **Cart Summary** — Shopping cart overview with totals `[CSS]`
- [ ] **Checkout Stepper** — Multi-step checkout progress flow `[CSS+JS]`
- [ ] **Kanban Board** — Draggable column-based task board `[JS-heavy]`
- [ ] **File Browser** — File/folder tree with actions `[CSS+JS]`

---

## 9. Utility (8)

- [ ] **Visually Hidden** — Content hidden visually but accessible to screen readers `[CSS]`
- [ ] **Portal** — Renders content into a different DOM location `[JS-heavy]`
- [ ] **Presence / Transition** — Animate element entrance and exit `[CSS+JS]`
- [ ] **Responsive Hidden** — Show/hide content at specific breakpoints `[CSS]`
- [ ] **Focus Trap** — Constrains keyboard focus within a container `[JS-heavy]`
- [ ] **Keyboard Shortcut** — Displays and handles keyboard shortcuts `[CSS+JS]`
- [ ] **Theme Provider** — Manages light/dark/custom theme switching `[CSS+JS]`
- [ ] **RTL / Direction Provider** — Right-to-left layout support `[CSS]`

---

## Coverage Summary

| Category | Total | Implemented | Remaining |
|----------|-------|-------------|-----------|
| Layout | 16 | 4 | 12 |
| Typography | 11 | 6 | 5 |
| Forms & Inputs | 33 | 17 | 16 |
| Data Display | 25 | 17 | 8 |
| Navigation | 15 | 8 | 7 |
| Feedback & Overlays | 15 | 8 | 7 |
| Marketing & Landing | 19 | 6 | 13 |
| Application-Specific | 14 | 1 | 13 |
| Utility | 8 | 0 | 8 |
| **Total** | **156** | **67** | **89** |
