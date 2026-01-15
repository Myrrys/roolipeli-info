# Spec: Jäinen Kirja (Icy Book) Design System

## 1. Blueprint (Design)

### Context

> **Goal:** Implement a cohesive, light-mode visual identity for the Finnish RPG Database that embodies "a crisp, frozen library" aesthetic.  
> **Why:** The current minimal design system lacks thematic identity and Finnish cultural resonance. Jäinen Kirja combines Nordic Functionalism with Classic Print Typography to create an authoritative, readable, and elegantly cold visual experience.  
> **Architectural Impact:** Replaces base design tokens in `packages/design-system/src/styles/tokens.css` and establishes component patterns for the entire application.

### Data Architecture

**No database changes.** This is a pure UI/CSS feature.

### UI Architecture

**Components:**
- **Design Tokens** (New): Replace existing minimal tokens with Jäinen Kirja palette
  - Paper & Ink colors (off-white backgrounds, charcoal text)
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

**Routes:** No new routes. Design system affects all existing pages.

**Data Flow:** 
- Layout files import design tokens via `@roolipeli/design-system/tokens.css`
- Component styles imported separately as needed
- Google Fonts loaded in HTML `<head>`

### Anti-Patterns

- **NEVER** use arbitrary color values outside the Jäinen Kirja palette
- **NEVER** use hardcoded font families (always use CSS variables)
- **NEVER** implement dark mode (explicitly out of scope)
- **NEVER** use `!important` to override design tokens
- **NEVER** add Tailwind or other CSS frameworks (vanilla CSS only)

---

## 2. Contract (Quality)

### Definition of Done

- [ ] Design tokens updated in `packages/design-system/src/styles/tokens.css`
- [ ] Google Fonts link added to both app layouts (main-site, design-system docs)
- [ ] Typography system uses serif for headers, sans for body
- [ ] Card component created with hover effect
- [ ] Tag component created with pill shape and hover state
- [ ] Design system documentation site updated to showcase Jäinen Kirja
- [ ] Main site landing pages render with new design system
- [ ] No hardcoded colors or fonts outside design tokens
- [ ] All existing E2E tests pass (visual changes don't break functionality)
- [ ] Design system package protected by `ALLOW_DS_EDIT=true` gate

### Regression Guardrails

**Invariants:**
- Existing component imports must not break
- i18n routing (/, /sv, /en) continues to work
- Design tokens remain accessible via `@roolipeli/design-system/tokens.css`
- No TypeScript compilation errors
- No accessibility regressions (contrast ratios must meet WCAG AA)

### Scenarios (Gherkin)

**Scenario: User views main landing page with Jäinen Kirja theme**
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
  - Border color changes to ice-mid (#7dd3fc)
  - Transition is smooth (no jank)

**Scenario: User views design system documentation**
- **Given:** User navigates to design-system app
- **When:** Token documentation page loads
- **Then:** 
  - All Jäinen Kirja colors displayed with swatches
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

### Accessibility Requirements

**WCAG AA Compliance:**
- **Text contrast:** 
  - Ink primary (#1e293b) on paper (#F9F8F6): ✅ 11.5:1 (passes)
  - Ink header (#0f172a) on paper: ✅ 14:1 (passes)
  - Ice deep (#0284c7) on ice light (#e0f2fe): ⚠️ Verify contrast ratio ≥ 4.5:1
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
2. **Palette: Glacial Accents** (interactive elements)
3. **Typography** (font families)
4. **Shape & Depth** (radius, shadow)

### Component CSS Organization

Create separate files for component styles:
- `packages/design-system/src/styles/components/card.css`
- `packages/design-system/src/styles/components/tag.css`

Export these via package.json:
```json
{
  "exports": {
    "./tokens.css": "./src/styles/tokens.css",
    "./components/card.css": "./src/styles/components/card.css",
    "./components/tag.css": "./src/styles/components/tag.css"
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

- **Proposal:** Design request received 2026-01-15
- **Nordic Functionalism:** Simplicity, clarity, light, natural materials
- **Classic Print Typography:** Serif headings, clear hierarchy, generous whitespace
- **WCAG 2.1 AA:** https://www.w3.org/WAI/WCAG21/quickref/
- **Google Fonts:** Playfair Display, Open Sans
