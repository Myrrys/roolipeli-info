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

1. **`/tekijat/[slug]`** (Creator Detail) — ROO-113
   - Fetches `getCreatorBySlug()`
   - Displays creator name as `<h1>`.
   - **Grouping algorithm (frontmatter):**
     1. Partition `products_creators` into a `Map<string, Product[]>` keyed by `product.game?.name ?? '__standalone__'`.
     2. Render named-game groups first, sorted alphabetically by game name.
     3. Render the `__standalone__` group last under fallback heading.
   - **Section markup:**
     ```html
     <section>
       <div class="section-heading">
         <h2><a href="/pelit/{game.slug}">{game.name}</a></h2>
         <span class="section-heading-count">{count}</span>
       </div>
       <div class="data-list">
         <div class="data-list-row">
           <span class="data-list-cell"><a href="/tuotteet/{slug}">{title}</a></span>
           <span class="data-list-cell data-list-muted">{role}</span>
           <span class="data-list-cell data-list-muted">{year}</span>
         </div>
       </div>
     </section>
     ```
     For the standalone group, `<h2>` is plain text (no link): `{t('creator.projects.standalone')}`
   - **References:** The existing reference list (`entity_references`) remains below the portfolio.

#### i18n Keys (ROO-113)

| Key | fi | sv | en |
|-----|----|----|-----|
| `creator.projects.standalone` | `Muut työt` | `Övriga verk` | `Other works` |

#### Design System Components *(completed, ROO-111)*

- `data-list.css`: For tabular, minimal data presentation. Styles for `.data-list`, `.data-list-row`, `.data-list-cell`, `.data-list-muted`.
- `section-heading.css`: A standardized heading for section groupings. Styles for `.section-heading`, `.section-heading-count`.

### Anti-Patterns
- **NEVER** render products as cards/grid — use `.data-list` rows for minimalist density
- **NEVER** hardcode colors/spacing — all values from DS tokens
- **NEVER** client-fetch data — SSR only (Astro frontmatter)
- **NEVER** drop the JSON-LD `<script>` or references section during refactor

---

## 2. Contract (Quality)

### Definition of Done

**ROO-112: Database query update** *(completed)*
- [x] `getCreatorBySlug` updated to join `game:games(id, name, slug)` on products
- [x] Return type verified: `product.game` is `{ id, name, slug } | null`
- [x] No UI regression: change is additive only; `/tekijat/[slug]` does not access `product.game` yet (E2E deferred to UI refactor PBI)

**ROO-111: Design System components** *(completed)*
- [x] CSS components `data-list.css` and `section-heading.css` implemented and semantic

**ROO-113: Creator profile UI refactor**
- [ ] Products grouped by `game.name`; named games sorted alphabetically; standalone last
- [ ] Each group rendered with `.section-heading` (game name as link) + `.data-list`
- [ ] Standalone group uses `t('creator.projects.standalone')` as plain heading
- [ ] i18n key `creator.projects.standalone` added for fi/sv/en
- [ ] JSON-LD schema unchanged (regression guardrail)
- [ ] References section still renders below portfolio
- [ ] E2E test verifies grouped layout renders correctly
- [ ] Page uses only DS tokens (no hardcoded values)
- [ ] Empty state preserved when creator has no products

### Regression Guardrails
- **Invariants:** The JSON-LD SEO configuration for the creator must remain intact. References must continue to display correctly.
- **Additive change:** ROO-112 adds a new field to the return type. Existing consumers that don't use `product.game` must not break.

### Scenarios (Gherkin)

**Scenario: Creator query returns game relation for products** *(ROO-112)*
- Given: Creator "Matti Myrsky" has a product "Myrskyn Sankari" linked to game "Myrskyn aika"
- When: `getCreatorBySlug(supabase, 'matti-myrsky')` is called
- Then: The product entry includes `game: { id, name: "Myrskyn aika", slug: "myrskyn-aika" }`

**Scenario: Creator query handles products without a game** *(ROO-112)*
- Given: Creator "Matti Myrsky" has a product "Roolipelaamisen käsikirja" with no associated game
- When: `getCreatorBySlug(supabase, 'matti-myrsky')` is called
- Then: The product entry includes `game: null`

**Scenario: Products grouped by game name** *(ROO-113)*
- Given: Creator has products linked to games "Astraterra" and "Myrskyn aika"
- When: Visiting `/tekijat/{slug}`
- Then: Two sections appear with `.section-heading` containing game names
- And: Sections are sorted alphabetically ("Astraterra" before "Myrskyn aika")
- And: Each section contains a `.data-list` with product rows

**Scenario: Standalone products appear last** *(ROO-113)*
- Given: Creator has products with games AND products without a game
- When: Visiting `/tekijat/{slug}`
- Then: Game-linked sections appear first
- And: A final section with heading "Muut työt" contains the unlinked products

**Scenario: Game heading links to game page** *(ROO-113)*
- Given: Creator has a product linked to game "Astraterra" (slug: "astraterra")
- When: Visiting `/tekijat/{slug}`
- Then: The section heading contains a link to `/pelit/astraterra`

**Scenario: Creator with only standalone products** *(ROO-113)*
- Given: Creator has products but none linked to a game
- When: Visiting `/tekijat/{slug}`
- Then: A single section with heading "Muut työt" displays all products

**Scenario: Empty creator portfolio** *(ROO-113)*
- Given: Creator exists but has no products
- When: Visiting `/tekijat/{slug}`
- Then: Empty state message is displayed
