# Spec: Creator Profile Page (`/tekijat/[slug]`)

## 1. Blueprint (Design)

### Context
> **Goal:** Build the public-facing creator profile page (`/tekijat/[slug]`) that showcases the creator's portfolio.
> **Why:** Visitors want to see a creator's work structured properly, grouped by the games (RPGs) they belong to, with a clear, minimalist, and readable presentation.
> **Architectural Impact:** This updates the data fetching logic in `packages/database` and the UI rendering in `apps/main-site`. It introduces new minimalist Design System components.

### Data Architecture

- **Schema:** Uses `creators`, `products_creators`, `products`, and `games` tables.
- **Query Update:** The existing `getCreatorBySlug` function must be updated to fetch the associated `game` for each product.

### UI Architecture

#### Routes (SSR in Astro)

1. **`/tekijat/[slug]`** (Creator Detail)
   - Fetches `getCreatorBySlug()`
   - Displays creator name as `<h1>`.
   - **Grouping:** Products are grouped by their associated game name.
   - **Standalone Products:** Products without an associated game are grouped under a fallback heading (e.g., "Muut työt" / "Other Works").
   - **Minimalist Presentation:** Each grouped section utilizes a standard `.data-list` to show tabular data: `Product Title`, `Author Role`, and `Year`.
   - **References:** The existing reference list (`entity_references`) remains below the portfolio.

#### New Design System Components

The Design System requires components for this view:
- `data-list.css`: For tabular, minimal data presentation. Must include styles for `.data-list`, `.data-list-row`, and `.data-list-cell`.
- `section-heading.css`: A standardized heading for section groupings (e.g., game titles).

---

## 2. Contract (Quality)

### Definition of Done
- [ ] `getCreatorBySlug` updated to join `game:games(id, name, slug)` on products.
- [ ] CSS components `data-list.css` and `section-heading.css` implemented and semantic.
- [ ] `/tekijat/[slug]` route refactored to group portfolio items by game and render using `.data-list`.
- [ ] i18n keys added for fallback category (e.g., "Muut työt").
- [ ] E2E tests verify that the grouping and tabular layout render correctly.

### Regression Guardrails
- **Invariants:** The JSON-LD SEO configuration for the creator must remain intact. References must continue to display correctly.
