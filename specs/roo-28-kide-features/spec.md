# Spec: Kide Features for Pages (ROO-28)

## 1. Blueprint (Design)

### Context
> **Goal:** Standardize the layout and component styling for public listing pages (`/products`, `/publishers`, `/creators`) by incorporating missing features into the Kide Design System.
> **Why:** Current pages use ad-hoc "breakout" grids and inconsistent card implementations. `grid.css` is designed for content constraints (reading width), not for collection grids.
> **Architectural Impact:** Updates `packages/design-system` (new CSS modules) and prepares for refactoring `apps/main-site`.

### Missing Features Analysis

#### 1. Collection Grid Layout
**Current State:**
Pages manually define grids using inline styles or local scope:
```css
/* apps/main-site/src/pages/tuotteet/index.astro */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--kide-space-4);
}
```
**Problem:** This logic is duplicated and not governed by the system. The existing `grid.css` uses named lines (`content-start`, `breakout-start`) which conflicts with this simple auto-fill approach.

**Requirement:**
New utility or component CSS in Kide: `layout-grid.css` (or similar).
- **Pattern:** RAM (Repeat, Auto, Minmax).
- ** responsive:** Should adapt columns based on container width.
- **Tokens:** Use `--kide-space-*` for gaps.

#### 2. Standardized Card Component
**Current State:**
`ProductCard.svelte` exists but is unused. `tuotteet/index.astro` implements a "card" locally using flexbox and direct token access.
```css
/* Local "Card" */
.product-link {
  border: 1px solid var(--kide-border-subtle);
  /* ...hover effects... */
}
```

**Requirement:**
Enhance `card.css` in Kide to support interactive "Listing Cards".
- **States:** Default, Hover (elevation + border color), Focus.
- **Content:** Image (optional), Title, Metadata tags (Type, Year, Lang).
- **Badges:** Standardize "Type" and "Language" tags (currently `tag.css` exists but usage varies).

### Anti-Patterns
- **No JavaScript Grids:** Layouts must be CSS-only (Subgrid or Flex/Grid).
- **No Hardcoded Values:** All spacing and colors must come from `tokens.css`.

---

## 2. Contract (Quality)

### Definition of Done for Consumer (Main Site)
*Note: This spec requests features FROM the Design System. The "Done" state here is the availability of these features.*

- [ ] **Grid Utility Available:** `@roolipeli/design-system/styles/layout-grid.css` (or equivalent) exports a class `.kide-grid` or `.kide-collection`.
- [ ] **Card Styles Updated:** `@roolipeli/design-system/components/card.css` supports clickable cards with hover interactions.
- [ ] **Documentation:** `packages/design-system/README.md` includes examples of the Collection Grid.

### Visual Regression Guardrails
- **Grid Stability:** The grid must not collapse to single column unexpectedly on tablets (iPad Portrait).
- **Card Height:** Cards in the same row must stretch to equal height (default Grid behavior).

### Scenarios (Gherkin)

#### Component: Collection Grid
**Scenario: Responsive Resizing**
- Given: A container width of 1200px
- When: The Collection Grid class is applied
- Then: Items display in 3 or 4 columns (depending on min-width 300px vs 250px decision)

**Scenario: Mobile View**
- Given: A container width of 375px
- When: The Collection Grid class is applied
- Then: Items stack in a single column
