# Spec: DataList & SectionHeading Design System Components

## 1. Blueprint (Design)

### Context
> **Goal:** Add two CSS-only components to the Kide Design System: a minimal
> tabular list (DataList) and a standardized section grouping heading
> (SectionHeading) for structured content views like creator portfolios.
> **Why:** The DS has `data-table.css` for full admin tables but no lightweight
> pattern for read-only, minimal tabular lists on public pages. The creator
> profile groups products by game and needs a consistent, reusable presentation
> layer.
> **Architectural Impact:** Two new CSS files in `packages/design-system`.
> No Svelte components (follows Native First principle). First consumer is
> `apps/main-site` creator profile page (`/tekijat/[slug]`).

### Data Architecture
- **Schema Changes:** None. Pure UI components.
- **Validation Rules:** N/A.
- **Relationships:** N/A.

### UI Architecture

#### Design Rationale: DataList vs DataTable

| Concern         | DataTable                     | DataList                         |
|-----------------|-------------------------------|----------------------------------|
| **Semantics**   | `<table>` element             | `<div>` CSS Grid                 |
| **Use case**    | Admin CRUD listings           | Read-only minimal lists          |
| **Chrome**      | Surface bg, shadow, border    | Transparent, borderless          |
| **Columns**     | Variable, with actions column | Fixed 2–3 columns, no actions    |
| **Header row**  | Yes (uppercase, sticky)       | No header row                    |
| **Target**      | Admin pages                   | Public content pages             |

#### Naming Convention

Flat class names composed with child/descendant selectors (modern CSS).
No BEM double-underscore convention. No `kide-` prefix (matches `.card`,
`.btn`, `.data-table`, `.empty-state`).

#### Component 1: DataList (`data-list.css`)

A lightweight, borderless CSS Grid for displaying structured metadata rows
(e.g., product title + role + year on a creator profile).

**CSS Classes:**

| Class               | Element        | Purpose                                       |
|---------------------|----------------|-----------------------------------------------|
| `.data-list`        | Container      | CSS Grid container with row gap                |
| `.data-list-row`    | Row            | Grid row with defined columns                  |
| `.data-list-cell`   | Cell           | Individual data cell                           |
| `.data-list-muted`  | Cell modifier  | Muted text for secondary data (role, year)     |

**Layout:**
- CSS Grid with `grid-template-columns: 1fr auto auto` (3 columns).
- Row gap: `--kide-space-1`.
- Collapses to stacked layout on narrow viewports (< 480px).
- No background, no border, no shadow — flat and minimal.

**Tokens Used:**
- `--kide-space-1` (row gap, cell padding)
- `--kide-ink-primary` (default text)
- `--kide-ink-muted` (secondary cells via `.data-list-muted`)
- `--kide-ice-deep` (link color)
- `--kide-ice-mid` (link hover color)
- `--kide-border-subtle` (optional row bottom border)
- `--kide-font-size-sm` (muted cell font size)

**CSS File:** `packages/design-system/src/styles/components/data-list.css`

**Markup Example:**
```html
<div class="data-list">
  <div class="data-list-row">
    <span class="data-list-cell">
      <a href="/tuotteet/myrskyn-sankari">Myrskyn Sankari</a>
    </span>
    <span class="data-list-cell data-list-muted">Kirjoittaja</span>
    <span class="data-list-cell data-list-muted">2024</span>
  </div>
  <div class="data-list-row">
    <span class="data-list-cell">
      <a href="/tuotteet/tarun-varjot">Tarun Varjot</a>
    </span>
    <span class="data-list-cell data-list-muted">Kuvittaja</span>
    <span class="data-list-cell data-list-muted">2023</span>
  </div>
</div>
```

#### Component 2: SectionHeading (`section-heading.css`)

A standardized heading for content section groupings (e.g., game names
grouping products on a creator profile).

**CSS Classes:**

| Class                  | Element   | Purpose                              |
|------------------------|-----------|--------------------------------------|
| `.section-heading`     | Container | Block element with bottom accent     |
| `.section-heading-count` | Badge   | Optional item count                  |

The title is a direct child element (`h2`, `h3`, or `a` — no wrapper class needed).

**Tokens Used:**
- `--kide-font-serif` (heading font family)
- `--kide-font-size-lg` (heading size)
- `--kide-ink-header` (heading color)
- `--kide-ink-muted` (count color)
- `--kide-font-size-sm` (count size)
- `--kide-space-1` (bottom padding, gap between title and count)
- `--kide-space-2` (bottom margin below the border)
- `--kide-border-subtle` (bottom border)

**CSS File:** `packages/design-system/src/styles/components/section-heading.css`

**Markup Example:**
```html
<div class="section-heading">
  <h2><a href="/pelit/myrskyn-aika">Myrskyn aika</a></h2>
  <span class="section-heading-count">3 tuotetta</span>
</div>
```

#### Package.json Exports
```json
"./components/data-list.css": "./src/styles/components/data-list.css",
"./components/section-heading.css": "./src/styles/components/section-heading.css"
```

### Anti-Patterns
- **NEVER** use `<table>` semantics for DataList — that's DataTable's domain
- **NEVER** include action columns (edit/delete) in DataList — it's read-only
- **NEVER** hardcode font sizes or colors — use `--kide-*` tokens exclusively
- **NEVER** add hover elevation/shadow to DataList rows — keep it flat and minimal
- **NEVER** use BEM double-underscore naming — use flat classes (`.data-list-row`)

---

## 2. Contract (Quality)

### Definition of Done
- [ ] `data-list.css` created with classes `.data-list`, `.data-list-row`, `.data-list-cell`, `.data-list-muted`
- [ ] `section-heading.css` created with classes `.section-heading`, `.section-heading-count`
- [ ] Both CSS files exported from `packages/design-system/package.json`
- [ ] Live demos added to `apps/design-system` docs
- [ ] E2E test in `apps/design-system/tests/e2e/`
- [ ] Uses only `--kide-*` design tokens (no hardcoded values)
- [ ] Responsive: DataList collapses gracefully on narrow viewports (< 480px)
- [ ] Accessible: muted text contrast meets WCAG AA (`--kide-ink-muted` on `--kide-paper` = 5.55:1)
- [ ] Links have visible `:focus-visible` state
- [ ] `pnpm biome check` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] Parent design-system spec updated with component DoD entries

### Regression Guardrails
- Existing DS component imports must not break
- DataTable (`.data-table`) must remain unaffected — no class collisions
- No new design tokens introduced

### Scenarios (Gherkin)

**Scenario: DataList renders in design-system docs**
- Given: User navigates to design-system docs
- When: Page loads
- Then: DataList demo is visible with rows showing title, role, and year
- And: All styling uses `--kide-*` tokens
- And: No background, border, or shadow on the container

**Scenario: DataList muted cells display secondary information**
- Given: A DataList row has `.data-list-muted` cells
- When: Page renders
- Then: Muted cells use `--kide-ink-muted` color
- And: Muted cells use `--kide-font-size-sm` size

**Scenario: DataList link cells are navigable**
- Given: A DataList cell contains an `<a>` element
- When: User hovers over the link
- Then: Link color transitions from `--kide-ice-deep` to `--kide-ice-mid`
- And: Link has visible `:focus-visible` state

**Scenario: SectionHeading renders with bottom accent**
- Given: A `.section-heading` element is on the page
- When: Page renders
- Then: Heading uses serif font (`--kide-font-serif`)
- And: A `--kide-border-subtle` bottom border separates the heading from content below
- And: Optional `.section-heading-count` displays in muted style beside or below the title

**Scenario: DataList collapses on narrow viewport**
- Given: Viewport width is below 480px
- When: DataList renders
- Then: Grid collapses from 3-column row to stacked layout
- And: All content remains readable

**Scenario: Combined usage — section heading with data list**
- Given: A creator profile page groups products by game
- When: Page renders a game section
- Then: `.section-heading` displays the game name as a linked heading
- And: `.data-list` renders the game's products below with title, role, and year columns
- And: A fallback section heading displays for products without a game

---

## 3. Implementation Notes

### File Manifest
- **Create:** `packages/design-system/src/styles/components/data-list.css`
- **Create:** `packages/design-system/src/styles/components/section-heading.css`
- **Create:** `apps/design-system/tests/e2e/data-list.spec.ts`
- **Modify:** `packages/design-system/package.json` (add 2 exports)
- **Modify:** `apps/design-system/src/pages/index.astro` (add live demos)
- **Modify:** `specs/design-system/spec.md` (add DoD entries for ROO-111)

### Design System Demo Page

The demo is added as a new `<section>` in `apps/design-system/src/pages/index.astro`,
following the established pattern: title, description, live demo, class reference.

**Section 1: SectionHeading + DataList (combined showcase)**

Shows the components working together as they will on the creator profile —
a game name heading followed by a product list. Uses Finnish RPG domain data.

```html
<section>
  <h2>Section Heading + Data List</h2>
  <p class="section-description">
    A section grouping heading paired with a lightweight tabular list.
    Designed for read-only content pages like creator portfolios, where
    items are grouped by category.
  </p>

  <!-- Combined demo: game section with product list -->
  <div id="section-heading-demo" class="section-heading">
    <h3>Myrskyn aika</h3>
    <span class="section-heading-count">3 tuotetta</span>
  </div>
  <div id="data-list-demo" class="data-list">
    <div class="data-list-row">
      <span class="data-list-cell">
        <a href="#">Myrskyn Sankari</a>
      </span>
      <span class="data-list-cell data-list-muted">Kirjoittaja</span>
      <span class="data-list-cell data-list-muted">2024</span>
    </div>
    <div class="data-list-row">
      <span class="data-list-cell">
        <a href="#">Tarun Varjot</a>
      </span>
      <span class="data-list-cell data-list-muted">Kuvittaja</span>
      <span class="data-list-cell data-list-muted">2023</span>
    </div>
    <div class="data-list-row">
      <span class="data-list-cell">
        <a href="#">Myrskyn pelikirja</a>
      </span>
      <span class="data-list-cell data-list-muted">Kirjoittaja</span>
      <span class="data-list-cell data-list-muted">2022</span>
    </div>
  </div>

  <!-- Second group: standalone heading -->
  <div class="section-heading" style="margin-top: var(--kide-space-4);">
    <h3>Muut työt</h3>
    <span class="section-heading-count">1 tuote</span>
  </div>
  <div class="data-list">
    <div class="data-list-row">
      <span class="data-list-cell">
        <a href="#">Roolipelaamisen käsikirja</a>
      </span>
      <span class="data-list-cell data-list-muted">Toimittaja</span>
      <span class="data-list-cell data-list-muted">2021</span>
    </div>
  </div>

  <div class="bem-reference">
    <h4>SectionHeading Classes:</h4>
    <ul>
      <li><code>.section-heading</code> — Flex container with bottom border accent</li>
      <li><code>.section-heading > h2/h3</code> — Serif heading (no wrapper class needed)</li>
      <li><code>.section-heading-count</code> — Optional muted item count badge</li>
    </ul>

    <h4>DataList Classes:</h4>
    <ul>
      <li><code>.data-list</code> — Grid container with row gap</li>
      <li><code>.data-list-row</code> — 3-column grid row (1fr auto auto)</li>
      <li><code>.data-list-cell</code> — Individual data cell</li>
      <li><code>.data-list-muted</code> — Muted modifier for secondary data (role, year)</li>
    </ul>
  </div>
</section>
```

**E2E Test Selectors:**
- `#section-heading-demo` — SectionHeading demo root
- `#data-list-demo` — DataList demo root
- `.data-list-row` — individual rows
- `.data-list-muted` — muted cells
- `.section-heading-count` — count badge

### CSS Structure Sketch

```css
/* data-list.css */
.data-list {
  display: grid;
  row-gap: var(--kide-space-1);
}

.data-list > .data-list-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: var(--kide-space-1);
  align-items: baseline;
  padding-block: var(--kide-space-1);
  border-bottom: 1px solid var(--kide-border-subtle);
}

.data-list-cell a {
  color: var(--kide-ice-deep);
  text-decoration: none;
}

.data-list-cell a:hover {
  color: var(--kide-ice-mid);
}

.data-list-muted {
  color: var(--kide-ink-muted);
  font-size: var(--kide-font-size-sm);
}

@media (max-width: 480px) {
  .data-list > .data-list-row {
    grid-template-columns: 1fr;
  }
}
```

```css
/* section-heading.css */
.section-heading {
  display: flex;
  align-items: baseline;
  gap: var(--kide-space-1);
  padding-bottom: var(--kide-space-1);
  margin-bottom: var(--kide-space-2);
  border-bottom: 1px solid var(--kide-border-subtle);
}

.section-heading > h2,
.section-heading > h3 {
  margin: 0;
  font-family: var(--kide-font-serif);
  font-size: var(--kide-font-size-lg);
  color: var(--kide-ink-header);
}

.section-heading-count {
  color: var(--kide-ink-muted);
  font-size: var(--kide-font-size-sm);
}
```

---

## 4. Future Considerations

**Out of Scope (Deferred):**
- Sortable DataList (client-side interaction — use DataTable for that)
- Collapsible sections (accordion pattern)
- DataList pagination

---

## 5. References

- **Linear:** ROO-111
- **Parent spec:** `specs/design-system/spec.md` (Kide Design System)
- **Consumer spec:** `specs/creator-profile/spec.md`
- **Related:** `specs/design-system/data-table/spec.md` (sibling tabular component)

---

**Spec Status:** Draft
**Created:** 2026-03-03
**Owner:** @Architect
