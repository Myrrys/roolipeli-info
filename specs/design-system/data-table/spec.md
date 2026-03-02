# Spec: DataTable Design System Component

## 1. Blueprint (Design)

### Context
> **Goal:** Promote the admin DataTable CSS pattern to a reusable design system component
> providing styled, overflow-safe data tables with typed columns, optional actions column,
> empty state integration, and item count.
> **Why:** The DS has `grid.css` and `collection-grid.css` for layout grids but no tabular
> data component. The existing `admin-table.css` is domain-agnostic, uses DS tokens
> exclusively, and is consumed by 5 listing pages — making it a strong promotion candidate.
> **Architectural Impact:** New CSS file in `packages/design-system`. Consumers in
> `apps/main-site` migrate imports. Original `admin-table.css` is removed. The Astro
> component (`DataTable.astro`) stays in main-site as a consumer of the DS classes.

### Data Architecture
- **Schema Changes:** None. Pure UI component.
- **Validation Rules:** N/A.
- **Relationships:** N/A.

### UI Architecture

#### Promotion Strategy: CSS-Only (Phase 1)

The DS provides the **CSS classes** only. The Astro component stays in `main-site` because
it contains admin-specific logic (edit URLs, delete CustomEvent) that cannot be generalized
via Astro slots (slots lack per-row context in iteration). This matches the established DS
pattern for `.btn`, `.card`, `.empty-state` — CSS in DS, markup in consumer.

A future Phase 2 could promote the Astro component if a generic row-action slot pattern
emerges across multiple consumers.

#### Naming Convention

Follow the DS-established pattern (prefix-free BEM): **`.data-table`**, not `.kide-data-table`.
Only `.kide-icon` uses the `kide-` prefix (utility exception). All other DS components use
prefix-free names: `.card`, `.btn`, `.empty-state`, `.nav-rail`, `.app-shell`.

#### CSS Classes

| Current (admin-table.css) | DS class | Notes |
|---|---|---|
| `.admin-table-container` | `.data-table` | Root container — overflow, surface bg, border, shadow |
| `.admin-table` | `.data-table__table` | Full-width collapsed table |
| `.admin-table th` | `.data-table__table th` | Header cell — paper bg, muted text, uppercase |
| `.admin-table td` | `.data-table__table td` | Data cell — bottom border |
| `.actions-header` | `.data-table__actions-header` | Right-aligned actions column header |
| `.actions-cell` | `.data-table__actions-cell` | Right-aligned actions column cell, nowrap |
| `.admin-table__count` | `.data-table__count` | Item count below table |

**Classes NOT promoted** (page-layout concerns, stay in main-site):
- `.admin-page-header` — flex row with h1 + action button. Extracted to admin-specific CSS.

**Classes already removed** (handled by DS components via ROO-106):
- `.admin-table__empty` → replaced by `.empty-state` (DS component)
- `.admin-error-banner` → replaced by Snackbar (DS component)

#### CSS File
`packages/design-system/src/styles/components/data-table.css`

#### Tokens Used
All inherited from current `admin-table.css`:
- `--kide-surface` (container background)
- `--kide-radius-md` (container border-radius)
- `--kide-shadow-sm` (container elevation)
- `--kide-border-subtle` (container border, cell borders)
- `--kide-paper` (header background)
- `--kide-ink-muted` (header text, count text)
- `--kide-font-size-sm` (header font size, count font size)
- `--kide-space-1`, `--kide-space-2` (cell padding, count padding)

#### Package.json Export
```json
"./components/data-table.css": "./src/styles/components/data-table.css"
```

#### Consumer Migration

In `AdminLayout.astro`:
```diff
- import '../styles/admin-table.css';
+ import '@roolipeli/design-system/components/data-table.css';
+ import '../styles/admin-page.css';
```

In `DataTable.astro` (stays in main-site):
```diff
- <div class="admin-table-container">
-   <table class="admin-table">
+ <div class="data-table">
+   <table class="data-table__table">
     ...
-     <td class="actions-cell">
+     <td class="data-table__actions-cell">
     ...
-   <th class="actions-header">
+   <th class="data-table__actions-header">
```

Item count:
```diff
- <p class="admin-table__count">
+ <p class="data-table__count">
```

`.admin-page-header` extracted to `apps/main-site/src/styles/admin-page.css`:
```css
.admin-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--kide-space-6);
}

.admin-page-header h1 {
  font-family: var(--kide-font-serif);
  font-size: 2rem;
  color: var(--kide-ink-header);
  margin: 0;
}
```

#### Markup Example (DS docs demo)
```html
<div class="data-table">
  <table class="data-table__table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Type</th>
        <th>Year</th>
        <th class="data-table__actions-header">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Myrskyn Sankari</td>
        <td>Core Rulebook</td>
        <td>2024</td>
        <td class="data-table__actions-cell">
          <a href="#" class="btn btn-icon btn-text">
            <span class="kide-icon kide-icon--sm" aria-hidden="true">edit</span>
          </a>
        </td>
      </tr>
    </tbody>
  </table>
</div>
<p class="data-table__count">3 tuotetta</p>
```

### Anti-Patterns
- **NEVER** hard-code domain-specific actions (edit/delete) in the DS table CSS
- **NEVER** use the `.admin-table-*` prefix in DS — use `.data-table`
- **NEVER** use `.kide-data-table` prefix — follow established convention (prefix-free BEM)
- **NEVER** include `.admin-page-header` in the DS — it's a page-layout concern
- **NEVER** include empty state or error banner CSS in data-table.css — these are
  handled by dedicated DS components (`.empty-state`, Snackbar)

---

## 2. Contract (Quality)

### Definition of Done
- [ ] `data-table.css` created with BEM classes (`.data-table`, `__table`, `__actions-header`, `__actions-cell`, `__count`)
- [ ] `data-table.css` exported from `packages/design-system/package.json`
- [ ] `AdminLayout.astro` imports `data-table.css` from DS instead of local `admin-table.css`
- [ ] `DataTable.astro` (main-site) uses DS class names (`data-table`, `data-table__table`, etc.)
- [ ] `.admin-page-header` extracted to `admin-page.css` in main-site
- [ ] Original `admin-table.css` removed from main-site
- [ ] Uses only `--kide-*` design tokens (already true — verify preserved)
- [ ] Live demo added to `apps/design-system` docs
- [ ] E2E test in `apps/design-system/tests/e2e/`
- [ ] All 5 admin listing page E2E tests pass unchanged
- [ ] `pnpm biome check` passes
- [ ] `pnpm tsc --noEmit` passes

### Regression Guardrails
- E2E selectors `.edit`, `.delete`, `.modal`, `.btn-delete`, and `table` must remain intact
- `.admin-page-header` styling must not break during extraction
- `admin:confirm-delete` CustomEvent contract must not change
- `?deleted=true` redirect pattern must be preserved
- EmptyState (`.empty-state`) rendering inside DataTable must not regress (ROO-106)
- Existing admin table visual appearance must be pixel-identical after class rename

### Scenarios (Gherkin)

**Scenario: DataTable renders in design-system docs**
- Given: User navigates to DataTable docs page
- When: Page loads
- Then: DataTable demo is visible with styled headers, data rows, and item count
- And: All styling uses `--kide-*` tokens
- And: Container has `.data-table` class with surface background and subtle border

**Scenario: DataTable shows empty state via DS EmptyState**
- Given: DataTable docs page has an empty-data demo
- When: Page loads
- Then: `.empty-state` component displays inside the `.data-table` container
- And: No `.admin-table__empty` class is present

**Scenario: Admin listing pages render with DS classes**
- Given: Authenticated admin navigates to `/admin/products`
- When: Page loads
- Then: Table container has class `data-table` (not `admin-table-container`)
- And: Table element has class `data-table__table`
- And: Existing edit/delete actions still function
- And: Item count displays below table

**Scenario: Admin page header unaffected by migration**
- Given: Authenticated admin navigates to any listing page
- When: Page loads
- Then: Page header with title and "New" button renders correctly
- And: `.admin-page-header` styling is preserved from extracted CSS

---

## 3. Implementation Notes

### File Manifest
- **Create:** `packages/design-system/src/styles/components/data-table.css`
- **Create:** `apps/main-site/src/styles/admin-page.css`
- **Create:** `apps/design-system/src/pages/data-table.astro` (docs page) or add section to `index.astro`
- **Create:** `apps/design-system/tests/e2e/data-table.spec.ts`
- **Modify:** `packages/design-system/package.json` (add export)
- **Modify:** `apps/main-site/src/layouts/AdminLayout.astro` (swap imports)
- **Modify:** `apps/main-site/src/components/admin/DataTable.astro` (rename classes)
- **Delete:** `apps/main-site/src/styles/admin-table.css`

### Migration Checklist (class renames in DataTable.astro)
1. `admin-table-container` → `data-table`
2. `admin-table` → `data-table__table`
3. `actions-header` → `data-table__actions-header`
4. `actions-cell` → `data-table__actions-cell`
5. `admin-table__count` → `data-table__count`

### E2E Test Selectors to Update
If any E2E tests select by `.admin-table-container` or `.admin-table`, update to
`.data-table` and `.data-table__table`. Most tests use semantic selectors (`.edit`,
`.delete`, `table`, `.btn-delete`) which are unaffected.

---

## 4. Future Considerations

**Phase 2 — Astro Component Promotion (deferred):**
If additional consumers beyond admin emerge, the DataTable Astro component could be
promoted to the DS. This requires solving Astro's slot-per-row limitation, likely via
a render callback prop or a Svelte island approach.

**Sorting/Filtering (deferred):**
The current DataTable is static (server-rendered). Client-side sorting and filtering
would require a Svelte component and is out of scope for this promotion.

---

## 5. References

- **Linear:** ROO-105
- **Parent spec:** `specs/design-system/spec.md` (Kide Design System)
- **Related spec:** `specs/admin-item-listings/spec.md` (consumer)
- **Depends on:** ROO-106 (EmptyState + Snackbar migration — already merged)

---

**Spec Status:** Draft
**Created:** 2026-02-24
**Owner:** @Architect
