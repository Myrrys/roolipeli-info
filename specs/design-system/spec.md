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
  - Shape tokens (border radius, shadows)

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
  - BEM structure: `.site-footer`, `__inner`, `__grid`, `__column`, `__heading`, `__list`, `__link`, `__colophon`
  - 1-3 column responsive grid (stacks on mobile < 768px)
  - Background: `--kide-paper-dark`
  - Typography: Sans-serif, compact sizing

- **SiteHeader Component** (New): `packages/design-system/src/styles/components/site-header.css`
  - BEM structure: `.site-header`, `__title`, `__nav`, `__link`, `__link--active`, `__btn`, `__btn--primary`
  - Unified header combining branding, navigation, and utilities
  - Background: `--kide-paper` with `--kide-border-subtle` bottom border
  - Replaces the separate TopBar and Header components

**Routes:** No new routes. Design system affects all existing pages.

**Data Flow:** 
- Layout files import design tokens via `@roolipeli/design-system/tokens.css`
- Component styles imported separately as needed
- Google Fonts loaded in HTML `<head>`

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
- [ ] `--kide-paper-dark` token added to `tokens.css` (#f1f5f9)
- [ ] `footer.css` created with BEM classes (`.site-footer`, `__inner`, `__grid`, `__column`, `__heading`, `__list`, `__link`, `__colophon`)
- [ ] `footer.css` exported from `package.json`
- [ ] Live demo added to `apps/design-system/src/pages/index.astro`
- [ ] Responsive: 1-3 columns on desktop, stacks on mobile (< 768px)

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
  - Links use `--kide-ink-primary` with hover state

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
5. **Shape & Depth** (radius, shadow)

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
    "./components/header.css": "./src/styles/components/header.css"
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
