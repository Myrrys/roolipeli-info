# Spec: Product Catalog (Public Routes)

## 1. Blueprint (Design)

### Context
> **Goal:** Build public-facing catalog pages for browsing Finnish RPG products, publishers, and creators.  
> **Why:** Users need to discover and explore the Finnish RPG ecosystem through a fast, semantic, search-engine-friendly interface.  
> **Architectural Impact:** This touches `apps/main-site` (SSR routes), `packages/database` (query layer), and establishes the canonical URL structure for SEO.

### Data Architecture
- **Schema:** Uses existing `products`, `publishers`, `creators`, and `products_creators` tables (see `specs/database/spec.md`)
- **Query Layer:** `packages/database/src/queries.ts` provides typed, pre-joined queries:
  - `getProducts()` - List all products with publisher data
  - `getProductBySlug(slug)` - Single product with publisher + creators
  - `getPublishers()` - List all publishers
  - `getCreators()` - List all creators
- **Validation:** Relies on Supabase RLS (public read, admin write) and database constraints
- **References:** `product_references` table joined for canonical links and reviews (implemented in ROO-33)

### UI Architecture

#### Routes (SSR in Astro)
All routes use Astro's SSR mode for fresh data and optimal SEO:

1. **`/products`** (Product Listing)
   - Fetches `getProducts()` in frontmatter
   - Renders grid of product cards
   - Sorted by `created_at DESC` (newest first)

2. **`/products/[slug]`** (Product Detail)
   - Uses `getStaticPaths()` + `getProductBySlug()` for SSG (Static Site Generation)
   - Shows full metadata (publisher, year, ISBN, language)
   - Lists creators with roles
   - Includes back navigation to `/products`

3. **`/publishers`** (Publisher Listing)
   - Fetches `getPublishers()` in frontmatter
   - Displays name + description in card layout
   - Alphabetically sorted

4. **`/creators`** (Creator Listing)
   - Fetches `getCreators()` in frontmatter
   - Displays name only (minimal for MVP)
   - Alphabetically sorted

#### Components
- **ProductCard.svelte** (Svelte 5, currently unused in production)
  - Props: `title`, `slug`, `publisher`, `productType`, `year`, `lang`
  - Renders clickable card with metadata badges
  - **Note:** Current implementation uses Astro-native cards in `/products/index.astro` - component exists but isn't integrated

#### Data Flow Pattern
```
Astro Frontmatter (SSR)
  ↓
Query from packages/database
  ↓
Supabase Client (read-only, anon key)
  ↓
Typed data props → HTML rendering
```

**No client-side fetching** - all data loaded server-side for optimal performance and SEO.

### Styling Strategy
**Current State (Debt):** Routes use inline `<style>` blocks with hardcoded values (violates design token constraint).

**Target State:** Migrate to `var(--token)` from `packages/design-system/src/styles/tokens.css` when design system is finalized.

**Anti-Pattern Alert:**
- ❌ Hardcoded colors (`#e0e0e0`, `#666`, etc.)
- ❌ Magic numbers (`1.5rem`, `0.75rem`)
- ⚠️ Acceptable for MVP, but must be refactored before v1.0

### Anti-Patterns
- **No Client-Side Data Fetching:** Never use `onMount()` or `fetch()` in Svelte islands for catalog data
- **No Arbitrary CSS:** Inline styles are technical debt - track for refactor
- **No Direct Supabase Calls in Routes:** Always use query functions from `@roolipeli/database`
- **No Missing Error States:** Every query must handle potential errors (currently missing - see DoD)

---

## 2. Contract (Quality)

### Definition of Done
- [x] Query layer implemented in `packages/database/src/queries.ts`
- [x] Four public routes created (`/products`, `/products/[slug]`, `/publishers`, `/creators`)
- [x] ProductCard component exists (Svelte 5)
- [ ] **Error handling:** All routes handle database errors gracefully (404 for missing slugs, 500 for DB failures)
- [ ] **TypeScript strict:** No `any` types, all Supabase responses properly typed
- [ ] **E2E tests:** Cover all routes (happy path + error states)
- [ ] **Unit tests:** Query layer mocked and tested
- [ ] **Accessibility:** WCAG AA compliance (semantic HTML, ARIA labels, keyboard navigation)
- [ ] **Responsive:** Mobile-first design tested at 375px, 768px, 1200px breakpoints
- [ ] **Design tokens:** Migrate from hardcoded values to CSS variables

### Regression Guardrails

#### Invariants (Must Never Break)
1. **Slug Stability:** Product/Publisher/Creator slugs are URL identifiers - changing them breaks SEO and external links
2. **SSR Enforcement:** All catalog routes MUST render server-side (no `client:load` on main content)
3. **Type Safety:** Query responses must match `Database` types from `supabase.ts`
4. **Public Access:** Catalog routes MUST work with anonymous (non-authenticated) access

#### Performance Budgets
- **FCP (First Contentful Paint):** < 1.5s on 3G
- **LCP (Largest Contentful Paint):** < 2.5s
- **SSR Response Time:** < 500ms for listing pages

### Scenarios (Gherkin)

#### Route: `/products`

**Scenario: Browse All Products**
- Given: The database contains 5 products with varying metadata
- When: I visit `/products`
- Then: I see a grid of 5 product cards
- And: Each card shows title, publisher name (if present), type, year, and language
- And: Cards are sorted newest-first by creation date

**Scenario: Empty Product List**
- Given: The database contains no products
- When: I visit `/products`
- Then: I see the heading "Tuotteet"
- And: I see an empty grid (no error, graceful degradation)

**Scenario: Navigate to Product Detail**
- Given: I am on `/products`
- When: I click on a product card for "Myrskyn aika"
- Then: I navigate to `/products/myrskyn-aika`

---

#### Route: `/products/[slug]`

**Scenario: View Product Details with Full Metadata**
- Given: A product "Myrskyn aika" exists with publisher "Burger Games", 2 creators, ISBN, and description
- When: I visit `/products/myrskyn-aika`
- Then: I see the title "Myrskyn aika" in an `<h1>`
- And: I see publisher "Burger Games" in the metadata
- And: I see the ISBN in the metadata
- And: I see the description in a dedicated section
- And: I see 2 creators listed with their roles (or 1 creator with multiple roles displayed clearly)
- And: I see "Viralliset lähteet" list in sidebar
- And: I see "Arvostelut" section with citations

**Scenario: View Product with References**
- Given: A product has a Wikidata link and one Review
- When: I visit the product detail page
- Then: I see "Wikidata" link in the Official Sources list
- And: I see the Review listed under "References & Reviews"

**Scenario: View Product with Minimal Data**
- Given: A product "Indie Zine" exists with only title, type, and language (no publisher, no creators)
- When: I visit `/products/indie-zine`
- Then: I see the title "Indie Zine"
- And: I see type and language in metadata
- And: Publisher and creators sections are not rendered (conditional rendering)

**Scenario: Product Not Found**
- Given: No product with slug "non-existent" exists
- When: I visit `/products/non-existent`
- Then: I receive a 404 error (or see error message)
- **Current Status:** ❌ Not implemented - throws unhandled error

**Scenario: Navigate Back to Listing**
- Given: I am viewing `/products/myrskyn-aika`
- When: I click "← Takaisin tuotteisiin"
- Then: I navigate to `/products`

---

#### Route: `/publishers`

**Scenario: Browse All Publishers**
- Given: 3 publishers exist (Burger Games, Tuonela, Ironspine)
- When: I visit `/publishers`
- Then: I see 3 publisher cards
- And: They are sorted alphabetically by name
- And: Each card shows the publisher name
- And: Descriptions are shown if present

**Scenario: Publisher without Description**
- Given: Publisher "Ironspine" has no description
- When: I visit `/publishers`
- Then: I see "Ironspine" listed
- And: No description paragraph is rendered for that entry

---

#### Route: `/creators`

**Scenario: Browse All Creators**
- Given: 4 creators exist in the database
- When: I visit `/creators`
- Then: I see 4 creator cards
- And: They are sorted alphabetically by name
- And: Each card shows only the creator's name (minimal MVP design)

---

### Accessibility Scenarios

**Scenario: Keyboard Navigation on Product Grid**
- Given: I am on `/products` with 10 products
- When: I press Tab repeatedly
- Then: Focus moves sequentially through all product card links
- And: Each focused card has a visible focus indicator

**Scenario: Screen Reader on Product Detail**
- Given: I am using a screen reader on `/products/myrskyn-aika`
- When: The page loads
- Then: The `<h1>` announces the product title
- And: Metadata is structured in a `<dl>` (definition list) for semantic clarity
- And: Creator list is in a proper `<ul>` with list semantics

---

### Performance Scenarios

**Scenario: SSR Performance on Product Listing**
- Given: The database contains 50 products
- When: I request `/products`
- Then: The server responds with fully-rendered HTML in < 500ms
- And: No JavaScript is required for initial render

**Scenario: Static Generation for Product Details**
- Given: Static paths are pre-generated for all products
- When: I request `/products/myrskyn-aika`
- Then: The response is served from the static build (instant)
- And: No database query is executed at request time

---

## 3. Technical Debt & Future Work

### Known Debt (Accepted for MVP)
1. **Hardcoded Styles:** All routes use inline CSS with magic values
   - **Impact:** Low (visual consistency)
   - **Remediation:** Migrate to design tokens in PBI-016
2. **Missing Error Handling:** No 404/500 error pages
   - **Impact:** Medium (poor UX on errors)
   - **Remediation:** Add error boundaries in PBI-017
3. **ProductCard Component Unused:** Built but not integrated
   - **Impact:** Low (code duplication in Astro template)
   - **Remediation:** Refactor `/products` to use component
4. **No Pagination:** All listings load full datasets
   - **Impact:** Low (datasets < 100 items for MVP)
   - **Remediation:** Add pagination when products > 50

### Future Enhancements (Out of Scope for v0.3)
- Publisher/Creator detail pages (`/publishers/[slug]`, `/creators/[slug]`)
- Search and filtering
- Multilingual support (FI/SV/EN locale switching)
- Breadcrumb navigation
- Social meta tags (Open Graph, Twitter Cards)

---

## 4. Dependencies & Constraints

### External Dependencies
- `@supabase/supabase-js` - Database client
- `@roolipeli/database` - Query layer and types
- Supabase RLS policies (public `SELECT` access required)

### Constraints
- **SSR-Only:** Routes cannot be client-rendered (Astro config enforcement)
- **Monorepo Paths:** All imports must use workspace aliases (`@roolipeli/database`)
- **TypeScript Strict Mode:** `noImplicitAny`, `strictNullChecks` enabled
- **No Authentication:** Catalog is fully public (no auth checks)

---

## 5. Verification Checklist

Before closing this spec:
- [ ] All Gherkin scenarios have corresponding E2E tests
- [ ] Query layer has unit test coverage (mocked Supabase)
- [ ] Routes handle errors gracefully (try/catch or error boundaries)
- [ ] TypeScript compiles with no errors (`pnpm tsc --noEmit`)
- [ ] Lighthouse score: Performance > 90, Accessibility > 95
- [ ] Design token migration tracked as technical debt

---

**Spec Status:** ✅ Retroactively Documented (covers PBI-014 & PBI-015)  
**Last Updated:** 2026-01-22  
**Owner:** @Architect + @Dev
