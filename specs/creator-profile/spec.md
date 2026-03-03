# Spec: Creator Profile Page (`/tekijat/[slug]`)

## 1. Blueprint (Design)

### Context
> **Goal:** Build the public-facing creator profile page (`/tekijat/[slug]`) that showcases the creator's portfolio.
> **Why:** Visitors want to see a creator's work structured properly, grouped by the games (RPGs) they belong to, with a clear, minimalist, and readable presentation.
> **Architectural Impact:** This updates the data fetching logic in `packages/database` and the UI rendering in `apps/main-site`. It introduces new minimalist Design System components.

### Data Architecture

- **Schema:** Uses `creators`, `products_creators`, `products`, and `games` tables.
- **Query Update:** The existing `getCreatorBySlug` function must be updated to fetch the associated `game` for each product.

#### Query Contract: `getCreatorBySlug` (ROO-112)

The `game` relation is joined as a nested select on each product:

```
products_creators(
  role,
  product:products(id, title, slug, product_type, year, lang,
    game:games(id, name, slug)
  )
)
```

- `product.game` will be `{ id, name, slug }` when `game_id` is set
- `product.game` will be `null` when `game_id` is null (standalone product)
- No schema migration needed — uses existing `products.game_id` FK
- Follows the same join pattern as `getProductBySlug` (queries.ts)

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

**ROO-112: Database query update**
- [x] `getCreatorBySlug` updated to join `game:games(id, name, slug)` on products
- [x] Return type verified: `product.game` is `{ id, name, slug } | null`
- [x] No UI regression: change is additive only; `/tekijat/[slug]` does not access `product.game` yet (E2E deferred to UI refactor PBI)

**ROO-111: Design System components** *(completed)*
- [x] CSS components `data-list.css` and `section-heading.css` implemented and semantic

**Creator profile UI refactor** *(future PBI)*
- [ ] `/tekijat/[slug]` route refactored to group portfolio items by game and render using `.data-list`
- [ ] i18n keys added for fallback category (e.g., "Muut työt")
- [ ] E2E tests verify that the grouping and tabular layout render correctly

### Regression Guardrails
- **Invariants:** The JSON-LD SEO configuration for the creator must remain intact. References must continue to display correctly.
- **Additive change:** ROO-112 adds a new field to the return type. Existing consumers that don't use `product.game` must not break.

### Scenarios (Gherkin)

**Scenario: Creator query returns game relation for products**
- Given: Creator "Matti Myrsky" has a product "Myrskyn Sankari" linked to game "Myrskyn aika"
- When: `getCreatorBySlug(supabase, 'matti-myrsky')` is called
- Then: The product entry includes `game: { id, name: "Myrskyn aika", slug: "myrskyn-aika" }`

**Scenario: Creator query handles products without a game**
- Given: Creator "Matti Myrsky" has a product "Roolipelaamisen käsikirja" with no associated game
- When: `getCreatorBySlug(supabase, 'matti-myrsky')` is called
- Then: The product entry includes `game: null`

**Scenario: Existing creator page continues to render after query change**
- Given: The `/tekijat/[slug]` page calls `getCreatorBySlug`
- When: The query now returns the additional `game` field
- Then: The page renders without errors (new field is additive, not breaking)
- And: JSON-LD schema remains valid
- And: References list still displays
