# Spec: Admin Item Listings

## 1. Blueprint (Design)

### Context
> **Goal:** Standardise the five admin listing pages (products, games, publishers, creators, labels) behind a single, typed `DataTable` component with Material Symbols icons, design-system buttons, and full i18n support.
> **Why:** The original implementation used emoji icons, fragile header-to-key mapping, hardcoded English strings, and duplicated ad-hoc button CSS across every page.
> **Architectural Impact:** Shared component (`DataTable.astro`), shared CSS (`admin-table.css`), i18n keys, and `DeleteConfirm.svelte` modal.

### Data Architecture
- **Schema Changes:** None. Listing pages are read-only views of existing tables.
- **Validation Rules:** N/A (no writes).
- **Relationships:** Products join `publishers(name)`. Games join `publishers(name)` and count `products(id)`.

### UI Architecture

#### Column Definition API
```ts
interface ColumnDef {
  key: string;      // maps to row[key]
  header: string;   // pre-translated display text
}
```
Each listing page defines its own `columns: ColumnDef[]` in Astro frontmatter and passes pre-translated headers via `t()`.

#### DataTable Props
```ts
interface Props {
  columns: ColumnDef[];
  data: DataRow[];
  editUrl: (id: string) => string;
  deleteAction?: boolean;     // default true
  actionsLabel: string;       // i18n column header
  editLabel: string;          // i18n aria-label
  deleteLabel: string;        // i18n aria-label
  emptyText: string;          // i18n empty state (rendered inside .empty-state DS component)
  itemCountText?: string;     // e.g. "5 tuotetta"
}
```

#### Layout Structure
```
.breakout                   (wider area wrapper)
  .admin-page-header        (flex row: h1 + "New X" button)
  .admin-table-container    (overflow wrapper with card styling)
    table.admin-table
      thead > tr > th        (column headers + actions)
      tbody > tr > td        (data cells + action buttons)
    .empty-state             (DS component: icon + text when no rows, ROO-106)
.admin-table__count          (item count below table)
```

#### Action Buttons
- **Edit:** `<a class="btn btn-icon btn-text edit">` with Material Symbols `edit` icon
- **Delete:** `<button class="btn btn-icon btn-text delete">` with Material Symbols `delete` icon
- **New Item:** `<a class="btn btn-filled">` with Material Symbols `add` icon

#### DeleteConfirm Modal (i18n props)
Accepts `confirmTitle`, `confirmMessage`, `cancelLabel`, `deleteLabel`, `deletingLabel` as props. Uses `.btn .btn-outlined` for cancel, `.btn .btn-danger` for delete.

#### Shared CSS
`apps/main-site/src/styles/admin-table.css` imported in `AdminLayout.astro` alongside `admin-forms.css`. Replaces per-page scoped styles for `.page-header`, `.btn-primary`, and table styling.

### Anti-Patterns
- **NEVER** use emoji for icons — use Material Symbols via `.kide-icon`.
- **NEVER** use `header.toLowerCase()` to map headers to data keys — use explicit `ColumnDef.key`.
- **NEVER** hardcode English strings in component templates — pass i18n strings as props.
- **NEVER** duplicate `.page-header` / `.btn-primary` styles per page — use shared `admin-table.css`.
- **NEVER** use `.admin-error-banner` for error feedback — use Snackbar (ROO-22) for transient error messages and EmptyState (ROO-106) for "no data" scenarios.

---

## 2. Contract (Quality)

### Definition of Done
- [ ] All 5 listing pages use `DataTable` with typed `ColumnDef[]`
- [ ] Material Symbols icons replace all emoji
- [ ] All user-visible strings come from `i18n/ui.ts`
- [ ] Design-system `.btn` classes used for all buttons
- [ ] `admin-table.css` imported in AdminLayout — no per-page scoped table styles
- [ ] E2E tests pass unchanged (`.edit`, `.delete`, `.modal`, `.btn-delete` preserved)
- [ ] `pnpm biome check` passes
- [ ] `pnpm tsc --noEmit` passes

**ROO-106: Error Banner → Snackbar + EmptyState Migration**
- [ ] `.admin-error-banner` removed from `admin-table.css`
- [ ] `.admin-table__empty` replaced by `.empty-state` from DS (`@roolipeli/design-system/components/empty-state.css`)
- [ ] Error feedback on listing pages uses Snackbar (`addSessionSnack` from ROO-22)
- [ ] All 5 listing pages updated (products, games, publishers, creators, labels)
- [ ] `empty-state.css` imported in `AdminLayout.astro`

### Regression Guardrails
- E2E selectors `.edit`, `.delete`, `.modal`, `.btn-delete`, and `table` must remain intact.
- `?deleted=true` redirect pattern must be preserved.
- `admin:confirm-delete` CustomEvent contract must not change.

### Scenarios (Gherkin)

**Scenario: Admin views product listing**
- Given: Authenticated admin navigates to `/admin/products`
- When: Page loads with existing products
- Then: Table displays columns (Title, Publisher, Type, Year) with item count and Material Symbols action icons

**Scenario: Admin views empty listing** *(updated ROO-106)*
- Given: Authenticated admin navigates to a listing page with no records
- When: Page loads
- Then: `.empty-state` DS component displays with `search_off` icon and translated "no records" text

**Scenario: Admin sees error feedback via Snackbar** *(ROO-106)*
- Given: Authenticated admin navigates to a listing page
- When: A data fetch error occurs
- Then: Snackbar appears with `error` type and translated error message
- And: No `.admin-error-banner` element is rendered

**Scenario: Admin deletes an item**
- Given: Authenticated admin is on a listing page
- When: Admin clicks delete icon and confirms in modal
- Then: Item is deleted, page redirects with `?deleted=true`

**Scenario: Admin navigates to create new item**
- Given: Authenticated admin is on a listing page
- When: Admin clicks "New X" button
- Then: Navigates to the create form for that entity
