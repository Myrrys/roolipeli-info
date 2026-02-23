# Spec: Kide (Ice Crystal) Design System

## 1. Blueprint (Design)

### Context

> **Goal:** Implement a cohesive, light-mode visual identity for the Finnish RPG Database that embodies "a crisp, frozen library" aesthetic.  
> **Why:** The current minimal design system lacks thematic identity and Finnish cultural resonance. Kide (Ice Crystal) combines Nordic Functionalism with Classic Print Typography to create an authoritative, readable, and elegantly cold visual experience.  
> **Architectural Impact:** Replaces base design tokens in `packages/design-system/src/styles/tokens.css` and establishes component patterns for the entire application.

### Data Architecture

**No database changes.** This is a pure UI/CSS feature.

### UI Architecture

**Components:**
- **Design Tokens** (New): Replace existing minimal tokens with Kide palette
  - Paper & Ink colors (off-white backgrounds, charcoal text)
  - Paper dark for footer/section backgrounds (`--kide-paper-dark`: #f1f5f9)
  - Glacial accents (ice blue for interactive elements)
  - Typography scale (Playfair Display serif + Open Sans)
  - Shape tokens (border radius, shadows, overlay)

- **Typography System** (New):
  - Headers use serif (Playfair Display) with tight tracking
  - Body uses sans-serif (Open Sans)
  - H1 gets distinctive ice-light bottom border

- **Card Component** (New): `packages/design-system/src/styles/components/card.css`
  - White surface on paper background
  - Subtle border with frost hover effect
  - Elevation via soft shadow

- **Tag Component** (New): `packages/design-system/src/styles/components/tag.css`
  - Pill-shaped semantic labels
  - Ice-light background with ice-deep text
  - Hover state transitions to ice-mid

- **Footer Component** (New): `packages/design-system/src/styles/components/footer.css`
  - Grid-container: uses the same `grid-template-columns` as `.grid-layout` (from `grid.css`)
  - `.__inner` spans `breakout-start / breakout-end` for wider footer content
  - BEM structure: `.site-footer`, `__inner`, `__grid`, `__column`, `__heading`, `__list`, `__link`, `__text`, `__colophon`
  - 1-3 column responsive grid (stacks on mobile < 768px)
  - Background: `--kide-paper-dark`
  - Typography: Sans-serif, compact sizing

- **SiteHeader Component** (New): `packages/design-system/src/styles/components/site-header.css`
  - BEM structure: `.site-header`, `__title`, `__nav`, `__link`, `__link--active`, `__btn`, `__btn--primary`
  - Unified header combining branding, navigation, and utilities
  - Background: `--kide-paper` with `--kide-border-subtle` bottom border
  - Replaces the separate TopBar and Header components

- **Snackbar Component** (New, ROO-22): Transient feedback notifications modeled after [Material Design 3 Snackbar](https://m3.material.io/components/snackbar/overview).
  - **Reference:** [MD3 Snackbar spec](https://github.com/material-components/material-components-android/blob/master/docs/components/Snackbar.md)
  - **Anatomy (4 parts):**
    1. **Container** — inverse surface (`--kide-ink-primary` bg), extra-small radius (`--kide-radius-sm`), `--kide-shadow-sm` elevation
    2. **Supporting text** — `--kide-paper` color, body medium typography (`--kide-font-sans`)
    3. **Action button** (optional) — text button, `--kide-ice-light` color
    4. **Close icon** (optional) — X icon, `--kide-paper` tint
  - **Variant differentiation** — subtle left border accent using existing semantic tokens:
    | Type | Left border | Use case |
    |------|------------|----------|
    | `info` | `--kide-ice-mid` | Neutral feedback |
    | `success` | `--kide-success` | Mutation succeeded |
    | `warning` | `--kide-warning` | Non-blocking caution |
    | `error` | `--kide-danger` | Mutation failed |
  - **Behavior (per MD3):**
    - **One at a time** — showing a new snackbar dismisses the current one first
    - **Bottom placement** — anchored to bottom of viewport with `--kide-space-2` margin
    - **Duration presets:** `short` (4s), `long` (8s), `indefinite` (manual dismiss only)
    - **Action click** dismisses automatically
    - **Close icon click** dismisses immediately
    - **Enter/exit animation:** CSS `@keyframes` slide-up from bottom + fade; respects `prefers-reduced-motion`
  - **Svelte 5 architecture** (requires client-side interactivity):
    - `Snackbar.svelte` — individual snackbar message
    - `SnackbarHost.svelte` — portal container, manages queue and positioning
    - `snackbar-store.ts` — Svelte 5 runes store (`$state`) for imperative API
  - **CSS:** `packages/design-system/src/styles/components/snackbar.css`
  - **Tokens (new in `tokens.css`):**
    - `--kide-snackbar-max-width`: 32rem (512px)
    - `--kide-snackbar-z`: 200 (above header)
  - **Imperative API (client-side):**
    ```ts
    import { addSnack, dismissSnack } from '@roolipeli/design-system';
    addSnack({ type: 'success', message: 'Tallennettu!' });
    addSnack({ type: 'error', message: 'Virhe', duration: 'indefinite' });
    addSnack({ type: 'info', message: 'Linkki kopioitu', action: { label: 'Kumoa', onclick: undoFn } });
    ```
  - **Session Snack API (server-side, survives redirects):**
    For actions that redirect (e.g., form submit → redirect to listing), snack data is persisted
    in a short-lived cookie so `SnackbarHost` can display it after navigation.
    - **Cookie name:** `kide-snack`
    - **Cookie shape:** JSON `{ type, message, duration? }` — same shape as `addSnack()` minus `action` (no serializable callbacks across redirects)
    - **Cookie options:** `Path=/`, `Max-Age=30`, `SameSite=Lax`, `HttpOnly=false` (must be readable by client JS)
    - **Server-side helper** (`packages/database` or `apps/main-site/src/lib/`):
      ```ts
      // In Astro API route after mutation + before redirect:
      import { addSessionSnack } from '../lib/snackbar';
      addSessionSnack(Astro.cookies, { type: 'success', message: 'Peli luotu!' });
      return Astro.redirect('/admin/games');
      ```
    - **Client-side hydration** in `SnackbarHost.svelte`:
      1. On mount, read `kide-snack` cookie via `document.cookie`
      2. If present, parse JSON and call `addSnack()` with the data
      3. Immediately delete the cookie (set `Max-Age=0`)
    - **Security:** Cookie contains only UI display strings (type + message), no secrets or user data. Not `HttpOnly` by design since client JS must read it.
    - **Limitation:** `action` callbacks are not supported in session snacks (functions are not serializable). Session snacks are display-only.
  - **File manifest:**
    - `packages/design-system/src/components/Snackbar.svelte`
    - `packages/design-system/src/components/SnackbarHost.svelte`
    - `packages/design-system/src/components/snackbar-store.ts`
    - `packages/design-system/src/components/snackbar-store.test.ts`
    - `packages/design-system/src/styles/components/snackbar.css`
    - `apps/main-site/src/lib/snackbar.ts` — `addSessionSnack()` server-side helper
  - **Blocks:** ROO-16 (FlashMessage system) depends on this component

**Routes:** No new routes. Design system affects all existing pages.

**Data Flow:** 
- Layout files import design tokens via `@roolipeli/design-system/tokens.css`
- Component styles imported separately as needed
- Google Fonts loaded in HTML `<head>`

### Architectural Principles

**1. Native First (Boilerplate avoidance):**
-   **Do not** wrap native HTML elements (like `<button>`, `<input>`, `<a>`) in Svelte components unless strictly necessary for complex logic or mandatory UX patterns (e.g., combining Label + Input).
-   **CSS Support:** Always provide pure CSS classes (e.g., `.btn`, `.input`) that can be applied to native elements. This ensures the design system is usable even without the Svelte components.
-   **Prop Forwarding:** If a wrapper is necessary, it must forward all native attributes (e.g., `class`, `aria-*`, events) to the underlying native element, ensuring it "feels" like a native element to the consumer.

### Anti-Patterns

- **NEVER** use arbitrary color values outside the Kide palette
- **NEVER** use hardcoded font families (always use CSS variables)
- **NEVER** implement dark mode (explicitly out of scope)
- **NEVER** use `!important` to override design tokens
- **NEVER** add Tailwind or other CSS frameworks (vanilla CSS only)

---

## 2. Contract (Quality)

### Definition of Done

- [ ] Design tokens updated in `packages/design-system/src/styles/tokens.css` with `--kide-` prefix
- [ ] Google Fonts link added to both app layouts (main-site, design-system docs)
- [ ] Typography system uses serif for headers, sans for body
- [ ] Card component created with hover effect
- [ ] Tag component created with pill shape and hover state
- [ ] Design system documentation site updated to showcase Kide
- [ ] **Dogfooding:** Design-system docs site uses its own components/layouts
- [ ] Main site landing pages render with new design system
- [ ] No hardcoded colors, fonts, or borders outside design tokens
- [ ] All existing E2E tests pass (visual changes don't break functionality)
- [ ] **Verification:** New features have E2E tests in `apps/design-system/tests/e2e/`
- [ ] Design system package protected by `ALLOW_DS_EDIT=true` gate

**ROO-50: Footer CSS Module**
- [x] `--kide-paper-dark` token added to `tokens.css` (#f1f5f9)
- [x] `footer.css` created with BEM classes (`.site-footer`, `__inner`, `__grid`, `__column`, `__heading`, `__list`, `__link`, `__colophon`)
- [x] `footer.css` exported from `package.json`
- [x] Live demo added to `apps/design-system/src/pages/index.astro`
- [x] Responsive: 3 columns on desktop (Resources, Legal, Project), stacks on mobile (< 768px)
- Note: Original ROO-43 proposed 4 columns. UAT confirmed 3-column layout; spec amended to match.

**ROO-47: TopBar CSS Module** *(design-system demo only)*
- [x] `topbar.css` created with BEM classes (`.top-bar`, `__inner`, `__left`, `__right`, `__link`, `__button`)
- [x] `topbar.css` exported from `package.json`
- [x] Live demo added to `apps/design-system/src/pages/index.astro`
- [x] Uses only `--kide-*` design tokens
- Note: TopBar is not rendered on the main site. Login functionality is in `SiteHeader` via slot.

**ROO-48: Header CSS Module** *(design-system demo only)*
- [x] `header.css` created with BEM classes (`.site-header`, `__inner`, `__logo`, `__nav`, `__nav-list`, `__nav-link`)
- [x] `header.css` exported from `package.json`
- [x] Live demo added to `apps/design-system/src/pages/index.astro`
- [x] Uses only `--kide-*` design tokens
- Note: Standalone header pattern is showcase only. Main site uses `SiteHeader.astro` (`site-header.css`).

**ROO-22: Snackbar Component**
- [ ] `Snackbar.svelte` renders all 4 variants (info, success, warning, error) with inverse surface + left border accent
- [ ] `SnackbarHost.svelte` enforces one-at-a-time rule (new snackbar dismisses current)
- [ ] `snackbar-store.ts` exports `addSnack()` / `dismissSnack()` imperative API
- [ ] Duration presets work: `short` (4s), `long` (8s), `indefinite` (no auto-dismiss)
- [ ] Action button triggers callback and dismisses snackbar
- [ ] Close icon dismisses snackbar immediately
- [ ] Bottom-of-viewport placement with `--kide-space-2` margin
- [ ] `aria-live="polite"` for info/success, `aria-live="assertive"` for error/warning
- [ ] `prefers-reduced-motion` disables slide/fade animations
- [ ] New tokens added to `tokens.css`: `--kide-snackbar-max-width`, `--kide-snackbar-z`
- [ ] Unit tests for store logic (add, dismiss, queue, duration presets)
- [ ] E2E test in `apps/design-system/tests/e2e/`
- [ ] Live demo in design-system docs page
- [ ] `snackbar.css` exported from `package.json`
- [ ] No hardcoded values — tokens only
- [ ] `addSessionSnack()` helper sets `kide-snack` cookie with correct shape and options
- [ ] `SnackbarHost` reads and clears `kide-snack` cookie on mount
- [ ] Session snack displays after a server-side redirect (e.g., form submit → listing page)

### Regression Guardrails

**Invariants:**
- Existing component imports must not break
- i18n routing (/, /sv, /en) continues to work
- Design tokens remain accessible via `@roolipeli/design-system/tokens.css`
- No TypeScript compilation errors
- No accessibility regressions (contrast ratios must meet WCAG AA)

### Scenarios (Gherkin)

**Scenario: User views main landing page with Kide theme**
- **Given:** User navigates to `/` (Finnish landing page)
- **When:** Page loads
- **Then:** 
  - Background is off-white "paper" (#F9F8F6)
  - Heading uses Playfair Display serif font
  - Heading has ice-light bottom border
  - Body text uses Open Sans
  - Page feels "crisp and frozen"

**Scenario: User hovers over a card element**
- **Given:** Card component is rendered on page
- **When:** User hovers cursor over card
- **Then:** 
  - Card translates up 2px
  - Border color changes to ice-mid (#0ea5e9)
  - Transition is smooth (no jank)

**Scenario: User views design system documentation**
- **Given:** User navigates to design-system app
- **When:** Token documentation page loads
- **Then:** 
  - All Kide colors displayed with swatches
  - Paper, Surface, Ink, and Ice color families visible
  - Typography examples use correct font families
  - Card and Tag components have visual examples

**Scenario: Designer attempts unauthorized design system edit**
- **Given:** Designer modifies `packages/design-system/src/styles/tokens.css`
- **When:** Designer attempts `git commit`
- **Then:**
  - Lefthook guard blocks commit
  - Error message requires `ALLOW_DS_EDIT=true`
  - Change is not committed

**Scenario: Developer uses footer CSS module**
- **Given:** Developer imports `@roolipeli/design-system/components/footer.css`
- **When:** They apply `.site-footer` class to a `<footer>` element
- **Then:**
  - Footer has `--kide-paper-dark` background (#f1f5f9)
  - `.site-footer__grid` supports 1-3 column layout on desktop (≥768px)
  - Columns stack vertically on mobile (<768px)
  - Links use `--kide-ice-deep` with `--kide-ice-mid` hover state

**Scenario: TopBar demo renders in design-system docs**
- **Given:** User navigates to design-system docs index
- **When:** Page loads
- **Then:**
  - TopBar demo section is visible with `<nav aria-label="Utility">`
  - Background is `--kide-paper` with bottom border
  - Language indicator shows "FI" with globe icon on right
  - Login button displays "Kirjaudu" on right

**Scenario: SiteHeader renders on main site**
- **Given:** User navigates to any main-site page
- **When:** Page loads
- **Then:**
  - SiteHeader renders as `<nav class="site-header" role="banner">`
  - Title displays "Roolipeli.info" and links to `/`
  - Navigation shows Tuotteet, Kustantajat, Tekijät links
  - "Kirjaudu" login button is visible
  - Background is `--kide-paper` with `--kide-border-subtle` bottom border

**Scenario: Success snackbar auto-dismisses** *(ROO-22)*
- **Given:** SnackbarHost is mounted in the layout
- **When:** `addSnack({ type: 'success', message: 'Tallennettu!' })` is called
- **Then:**
  - Snackbar appears at bottom of viewport with inverse surface background
  - Left border accent uses `--kide-success`
  - Snackbar auto-dismisses after 4 seconds (short duration default)

**Scenario: Error snackbar persists until dismissed** *(ROO-22)*
- **Given:** SnackbarHost is mounted in the layout
- **When:** `addSnack({ type: 'error', message: 'Tallennus epäonnistui', duration: 'indefinite' })` is called
- **Then:**
  - Snackbar appears with `--kide-danger` left border accent
  - Snackbar remains visible until close icon is clicked
  - `aria-live="assertive"` is set on the container

**Scenario: New snackbar replaces current** *(ROO-22)*
- **Given:** A snackbar is currently visible
- **When:** A second `addSnack()` call is made
- **Then:**
  - Current snackbar exits (slide-down + fade)
  - New snackbar enters (slide-up + fade)
  - Only one snackbar is visible at a time

**Scenario: Snackbar action button triggers callback** *(ROO-22)*
- **Given:** SnackbarHost is mounted in the layout
- **When:** `addSnack({ type: 'info', message: 'Linkki kopioitu', action: { label: 'Kumoa', onclick: undoFn } })` is called
- **Then:**
  - Snackbar displays "Kumoa" action button in `--kide-ice-light` color
  - Clicking the action button invokes `undoFn` and dismisses the snackbar

**Scenario: Session snack displays after redirect** *(ROO-22)*
- **Given:** Admin submits a game creation form
- **When:** Server-side API route calls `addSessionSnack(cookies, { type: 'success', message: 'Peli luotu!' })` and redirects to `/admin/games`
- **Then:**
  - Listing page loads with `kide-snack` cookie present
  - `SnackbarHost` reads the cookie on mount and displays the snackbar
  - Cookie is immediately cleared (not shown again on refresh)
  - Snackbar auto-dismisses after 4 seconds (short duration default)

### Accessibility Requirements

**WCAG AA Compliance:**
- **Text contrast:** 
  - Ink primary (#1e293b) on paper (#F9F8F6): ✅ 13.78:1 (AAA)
  - Ink header (#0f172a) on paper (#F9F8F6): ✅ 16.82:1 (AAA)
  - Ink muted (#5a6577) on paper (#F9F8F6): ✅ 5.55:1 (AA)
  - Ice deep (#075985) on ice light (#dbeafe): ✅ 6.20:1 (AA)
  - White (#ffffff) on ice deep (#075985): ✅ 7.56:1 (AAA)
- **Interactive elements:** Must have visible focus states
- **Font sizes:** Minimum 16px for body text (Open Sans 400)

---

## 3. Implementation Notes

### External Dependencies

**Google Fonts:**
```html
<link 
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap" 
  rel="stylesheet"
>
```

Must be added to:
- `apps/main-site/src/layouts/Layout.astro`
- `apps/design-system/src/layouts/DocsLayout.astro`

### Token Structure

The tokens.css file should be organized in logical sections:
1. **Palette: Paper & Ink** (backgrounds and text)
   - `--kide-paper`: #f9f8f6 (main background)
   - `--kide-paper-dark`: #f1f5f9 (footer/section backgrounds)
   - `--kide-surface`: #ffffff (card backgrounds)
2. **Palette: Glacial Accents** (interactive elements)
3. **Typography** (font families)
4. **Spacing Grid** (0.5rem / 8px grid system)
5. **Shape & Depth** (radius, shadow, overlay)

### Spacing Grid System

**Base Unit:** 0.5rem (8px at default browser font size)

All spacing in layouts and components must use multiples of the base unit:
- `--kide-space-1`: 0.5rem (8px) - Minimal spacing
- `--kide-space-2`: 1rem (16px) - Small spacing
- `--kide-space-3`: 1.5rem (24px) - Medium spacing
- `--kide-space-4`: 2rem (32px) - Large spacing
- `--kide-space-5`: 2.5rem (40px) - XL spacing
- `--kide-space-6`: 3rem (48px) - XXL spacing
- `--kide-space-8`: 4rem (64px) - Section spacing
- `--kide-space-12`: 6rem (96px) - Major section spacing

**Rationale:** 
- Ensures visual rhythm and consistency
- Easier to calculate responsive layouts
- Prevents arbitrary spacing values
- Aligns with common design system practices (8pt grid)

### Content Grid Layout

A responsive page layout with named grid lines for content, breakout, and full-width areas.

**Tokens:**
- `--kide-content-max`: Maximum content width (44rem / ~700px)
- `--kide-gutter-min`: Minimum side gutter (16px)
- `--kide-gutter-max`: Maximum side gutter (112px)
- `--kide-border-subtle`: Subtle UI borders (#e2e8f0)

**CSS Classes:**
- `.grid-layout`: Container with named grid lines
- `.breakout`: Wider than content, respects gutters
- `.full-width`: Edge to edge

**Named Grid Lines:**
- `full-start` / `full-end`: Edge to edge
- `breakout-start` / `breakout-end`: Wider content area
- `content-start` / `content-end`: Main content column

**Import:** `@roolipeli/design-system/grid.css`

### Controls (Inputs & Buttons)

**Philosophy:** 
- Structure inspired by Material Design 3 (Filled, Outlined, Text).
- Styled with Kide identity (Ice palette, specific border radius).

**Tokens:**
- `--kide-control-height-sm/md/lg`: 32px / 40px / 48px
- `--kide-control-radius`: 4px (sm) - Crisp corners
- `--kide-control-border`: `--kide-border-subtle`
- `--kide-control-focus-ring`: 3px ring of `--kide-ice-light`

**Buttons (`@roolipeli/design-system/components/button.css`):**
- **Note:** No Svelte component wrapper. Use native `<button>` with classes.
- `.btn`: Base class
- Variants:
  - `.btn-filled`: Primary action (Ice Mid bg)
  - `.btn-outlined`: Secondary action (Ice Deep border)
  - `.btn-text`: Tertiary action (Ice Deep text)
  - `.btn-danger`: Destructive action
- Sizes: `.btn-sm`, `.btn-lg` (md is default)

**Inputs (`@roolipeli/design-system/components/input.css`):**
- Style: Outlined (for crispness on paper background)
- Classes: `.input`, `.textarea`, `.select`, `.label`, `.form-group`
- States: `:disabled`, `.error`

### Component CSS Organization

Create separate files for component styles:
- `packages/design-system/src/styles/components/card.css`
- `packages/design-system/src/styles/components/tag.css`
- `packages/design-system/src/styles/components/button.css`
- `packages/design-system/src/styles/components/input.css`
- `packages/design-system/src/styles/components/footer.css`

Export these via package.json:
```json
{
  "exports": {
    "./tokens.css": "./src/styles/tokens.css",
    "./components/card.css": "./src/styles/components/card.css",
    "./components/tag.css": "./src/styles/components/tag.css",
    "./components/button.css": "./src/styles/components/button.css",
    "./components/input.css": "./src/styles/components/input.css",
    "./components/footer.css": "./src/styles/components/footer.css",
    "./components/topbar.css": "./src/styles/components/topbar.css",
    "./components/header.css": "./src/styles/components/header.css",
    "./components/snackbar.css": "./src/styles/components/snackbar.css"
  }
}
```

### Markup Conventions

Cards use the following structure:
```html
<div class="card">
  <span class="label">Label Text</span>
  <strong>Primary Content</strong>
</div>
```

Tags use simple span elements:
```html
<span class="tag">Genre Name</span>
```

---

## 4. Future Considerations

**Out of Scope (Explicitly Deferred):**
- Dark mode (light mode only per requirements)
- Responsive breakpoints for mobile (future PBI)
- Animation/transition customization beyond hover effects
- Additional component variants (outlined cards, ghost buttons, etc.)
- Internationalized color preferences (e.g., cultural color meanings)

**Technical Debt:**
- Consider extracting component CSS into Svelte components later
- May need to create a color contrast checking tool for future palette expansions
- Typography scale may need refinement based on real content

---

## 5. References

- **Name:** "Kide" (Ice Crystal) - Finnish word for an ice crystal, emphasizing clarity and structure
- **Proposal:** Design request received 2026-01-15
- **Nordic Functionalism:** Simplicity, clarity, light, natural materials
- **Classic Print Typography:** Serif headings, clear hierarchy, generous whitespace
- **WCAG 2.1 AA:** https://www.w3.org/WAI/WCAG21/quickref/
- **Google Fonts:** Playfair Display, Open Sans
- **Material Design 3 Snackbar:** https://m3.material.io/components/snackbar/overview
- **MD3 Snackbar (Android reference):** https://github.com/material-components/material-components-android/blob/master/docs/components/Snackbar.md
