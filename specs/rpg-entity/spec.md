# Spec: RPG Entity ("Roolipeli" Data Type)

## 1. Blueprint (Design)

### Context
> **Goal:** Introduce a top-level "RPG" (roolipeli) entity that describes a role-playing game at the conceptual level — e.g., "Astraterra" or "Legendoja & lohikäärmeitä" — distinct from individual products (books) and rule systems.
> **Why:** Products (books, zines) are *parts* of a game, not the game itself. An actual-play episode references "Legendoja & lohikäärmeitä" (the game), not "Legendoja & lohikäärmeitä: Pelaajan kirja" (the book). A first-class game entity enables proper semantic relationships, richer JSON-LD, and discovery by game rather than by product.
> **Architectural Impact:** New `games` table in Supabase, new FK on `products`, new public routes (`/pelit`, `/pelit/[slug]`), admin CRUD, query layer extensions, and JSON-LD `Game` schema.

### Data Architecture

#### Schema Changes

**New Table: `games`**
| Column | Type | Constraints | Schema.org Mapping |
|--------|------|-------------|-------------------|
| `id` | UUID (PK) | Default `gen_random_uuid()` | — |
| `name` | text | NOT NULL | `name` |
| `slug` | text | NOT NULL, UNIQUE | URL identifier |
| `description` | text | nullable | `description` |
| `publisher_id` | UUID (FK → publishers) | nullable | `producer` (Organization) |
| `number_of_players` | text | nullable | `numberOfPlayers` |
| `in_language` | product_lang enum | nullable | `inLanguage` |
| `url` | text | nullable | `url` (official website) |
| `license` | text | nullable | `license` |
| `image_url` | text | nullable | `image` |
| `created_at` | timestamptz | DEFAULT now() | — |

**New Join Table: `games_creators`**
| Column | Type | Constraints |
|--------|------|-------------|
| `game_id` | UUID (FK → games) | ON DELETE CASCADE |
| `creator_id` | UUID (FK → creators) | ON DELETE CASCADE |
| `role` | text | NOT NULL (e.g., "designer", "author") |
| | | PK (`game_id`, `creator_id`, `role`) |

**New Join Table: `game_semantic_labels`**
| Column | Type | Constraints |
|--------|------|-------------|
| `game_id` | UUID (FK → games) | ON DELETE CASCADE |
| `label_id` | UUID (FK → semantic_labels) | ON DELETE CASCADE |
| `idx` | integer | nullable, for ordering |
| | | PK (`game_id`, `label_id`) |

**New Table: `game_based_on`**

Each row represents one "isBasedOn" relationship. A game can be based on zero, one, or multiple sources. Each source is either an internal game (UUID) or an external entity (URL). Exactly one of `based_on_game_id` or `based_on_url` must be non-null.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID (PK) | Default `gen_random_uuid()` | |
| `game_id` | UUID (FK → games) | NOT NULL, ON DELETE CASCADE | The game that is based on something |
| `based_on_game_id` | UUID (FK → games) | nullable, ON DELETE CASCADE | Internal reference (mutually exclusive with `based_on_url`) |
| `based_on_url` | text | nullable | External reference URL (mutually exclusive with `based_on_game_id`) |
| `label` | text | NOT NULL | Display text (e.g., "Mörk Borg", "Apocalypse World") |
| `created_at` | timestamptz | DEFAULT now() | |
| | | CHECK: exactly one of `based_on_game_id`, `based_on_url` is NOT NULL | |

**New Table: `game_references`**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID (PK) | Default `gen_random_uuid()` | |
| `game_id` | UUID (FK → games) | ON DELETE CASCADE | |
| `reference_type` | text | NOT NULL | Reuses `ReferenceTypeEnum` |
| `label` | text | NOT NULL | Display text |
| `url` | text | NOT NULL | Maps to `sameAs` in JSON-LD |
| `citation_details` | jsonb | nullable | Same structure as product_references |
| `created_at` | timestamptz | DEFAULT now() | |

**Modified Table: `products`**
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `game_id` | UUID (FK → games) | nullable, ON DELETE SET NULL | Links product to parent RPG |

#### Relationships
- `games` 1:N `products` (via `products.game_id`) — a game has many products
- `games` N:M `creators` (via `games_creators`) — designers, authors
- `games` N:M `semantic_labels` (via `game_semantic_labels`) — genres, themes
- `games` 1:N `game_references` — external links (Wikidata, Wikipedia, etc.)
- `games` 1:N `game_based_on` — "isBasedOn" sources; each entry is either an internal game UUID or an external URL (e.g., Spore Borg → Mörk Borg, or a URL to an external game not in our DB)
- `games` N:1 `publishers` (via `publisher_id`) — producer/publisher

#### Calculated Fields (Query-Time)
- **`hasPart`**: All products where `products.game_id = games.id` — rendered in JSON-LD
- **Product count**: For listing page display

#### RLS Policies
- **SELECT**: Public read access (anonymous users can browse games)
- **INSERT/UPDATE/DELETE**: Admin only (`(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`)
- Same policy pattern for `games_creators`, `game_semantic_labels`, `game_references`, `game_based_on`

#### Zod Schemas (packages/database)

```typescript
export const GameSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  publisher_id: z.string().uuid().nullable().optional(),
  number_of_players: z.string().max(50).nullable().optional(),
  in_language: ProductLangEnum.nullable().optional(),
  url: z.string().url().nullable().optional(),
  license: z.string().max(255).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
});

export const GameCreatorSchema = z.object({
  game_id: z.string().uuid(),
  creator_id: z.string().uuid(),
  role: z.string().min(1).max(100),
});

export const GameSemanticLabelSchema = z.object({
  game_id: z.string().uuid(),
  label_id: z.string().uuid(),
  idx: z.number().int().default(0),
});

export const GameBasedOnSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  game_id: z.string().uuid(),
  based_on_game_id: z.string().uuid().nullable().optional(),
  based_on_url: z.string().url().nullable().optional(),
  label: z.string().min(1).max(255),
}).refine(
  (d) => (d.based_on_game_id != null) !== (d.based_on_url != null),
  { message: "Exactly one of based_on_game_id or based_on_url must be set" }
);

export const GameReferenceSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  game_id: z.string().uuid(),
  reference_type: ReferenceTypeEnum,
  label: z.string().min(1).max(255),
  url: z.string().url(),
  citation_details: CitationDetailsSchema.nullable().optional(),
});
```

### UI Architecture

#### Public Routes (SSR in Astro)

1. **`/pelit`** (Game Listing)
   - Fetches all games with publisher name and product count
   - Grid of game cards (name, publisher, description excerpt, product count)
   - Sorted alphabetically by name

2. **`/pelit/[slug]`** (Game Detail)
   - Full game metadata (name, description, publisher, players, language)
   - Creators with roles
   - Genre labels as Kide tags
   - External references (sameAs links)
   - **Products list**: All products belonging to this game (hasPart)
   - "Based on" list: zero or more entries from `game_based_on` — internal games link to `/pelit/[slug]`, external URLs link out. Query joins `based_on_game:games!game_based_on_based_on_game_id_fkey(slug, name)` to resolve internal game slugs.
   - JSON-LD `@type: "Game"` in `<head>`

#### Admin Routes

3. **`/admin/games`** (Game List)
   - DataTable with columns: Name, Publisher, Products count
   - Edit/Delete actions

4. **`/admin/games/new`** (Create Game)
   - Form fields matching `GameSchema`
   - Publisher dropdown (like products)
   - Dynamic creator rows with role (like products)
   - Dynamic semantic label assignment (like products)
   - Dynamic references (like products)

5. **`/admin/games/[id]/edit`** (Edit Game)
   - Same form, pre-populated
   - Dynamic "Based on" rows: each row has a type toggle (internal game / external URL), a game dropdown or URL text field, and a label field
   - Game assignment dropdown added to product edit form

#### API Routes

6. **`/api/admin/games/index.ts`** — POST (create)
7. **`/api/admin/games/[id].ts`** — PUT (update), DELETE

#### Product Form Modification

8. Add `game_id` dropdown to **ProductForm.svelte** — optional select listing all games, fetched via `getGames()` in Astro SSR frontmatter of product create/edit pages

#### Data Flow
```
Astro Page (SSR) → getGames() / getGameBySlug() from @roolipeli/database
  → Supabase query with joins (publisher, creators, labels, references, products)
  → Typed props to Astro/Svelte rendering
```

#### Navigation
- Add "Pelit" to `SiteHeader` nav items (between site title and existing nav)
- Add "Pelit" to `AdminNav` items
- Add i18n keys for FI/SV/EN

#### Modified Zod Schema: `ProductSchema` (ROO-59c)

Add `game_id` to the existing `ProductSchema` so it flows through `ProductFormCreateSchema` and `ProductFormUpdateSchema`:

```typescript
// Add to ProductSchema in packages/database/src/schemas/core.ts
game_id: z.preprocess(
  (val) => (val === '' ? null : val),
  z.string().uuid().nullable().optional(),
),
```

#### i18n Keys (Product Form Game Dropdown — ROO-59c)

| Key | FI | SV | EN |
|-----|----|----|-----|
| `product.metadata.game` | Roolipeli | Rollspel | Game |

#### i18n Keys (Public Game Pages — ROO-59d)

Keys added by ROO-59d to `apps/main-site/src/i18n/ui.ts`:

| Key | FI | SV | EN |
|-----|----|----|-----|
| `games.title` | Pelit \| Roolipeli.info | Spel \| Roolipeli.info | Games \| Roolipeli.info |
| `games.heading` | Pelit | Spel | Games |
| `games.backLink` | Takaisin peleihin | Tillbaka till spel | Back to games |
| `games.empty` | Ei vielä pelejä tietokannassa. | Inga spel i databasen ännu. | No games in the database yet. |
| `game.metadata.label` | Tiedot | Information | Details |
| `game.metadata.publisher` | Kustantaja | Förlag | Publisher |
| `game.metadata.players` | Pelaajamäärä | Antal spelare | Number of players |
| `game.metadata.language` | Kieli | Språk | Language |
| `game.metadata.license` | Lisenssi | Licens | License |
| `game.metadata.url` | Virallinen sivusto | Officiell webbplats | Official website |
| `game.description.label` | Kuvaus | Beskrivning | Description |
| `game.creators.label` | Tekijät | Upphovsmän | Creators |
| `game.basedOn.label` | Perustuu | Baserat på | Based on |
| `game.products.label` | Roolipelin osat | Spelets delar | Game products |
| `game.products.empty` | Ei vielä linkitettyjä tuotteita. | Inga länkade produkter ännu. | No linked products yet. |
| `game.labels.label` | Tunnisteet | Etiketter | Labels |
| `game.references.label` | Lähteet | Källor | References |

#### JSON-LD Structure
```json
{
  "@context": "https://schema.org",
  "@type": "Game",
  "name": "Astraterra",
  "description": "...",
  "inLanguage": "fi",
  "numberOfPlayers": "2-6",
  "url": "https://astraterra.fi",
  "license": "...",
  "producer": {
    "@type": "Organization",
    "name": "Ironspine",
    "url": "https://roolipeli.info/kustantajat/ironspine"
  },
  "author": [
    { "@type": "Person", "name": "Miska Fredman" }
  ],
  "genre": [
    { "@type": "DefinedTerm", "name": "Fantasy", "sameAs": "http://www.wikidata.org/entity/Q132311" }
  ],
  "isBasedOn": [
    {
      "@type": "Game",
      "name": "Mörk Borg",
      "url": "https://roolipeli.info/pelit/mork-borg"
    },
    {
      "@type": "Game",
      "name": "Knave",
      "url": "https://www.drivethrurpg.com/product/250888/Knave"
    }
  ],
  "hasPart": [
    { "@type": "Book", "name": "Astraterra: Pelaajan kirja", "url": "https://roolipeli.info/tuotteet/..." },
    { "@type": "Book", "name": "Astraterra: Pelinjohtajan kirja", "url": "https://roolipeli.info/tuotteet/..." }
  ],
  "sameAs": [
    "http://www.wikidata.org/entity/Q...",
    "https://fi.wikipedia.org/wiki/Astraterra"
  ]
}
```

### Anti-Patterns
- **NEVER** confuse "game" with "rule system" — they are distinct entity types. Multiple games can share a rule system. The rule system entity is out of scope (future PBI).
- **NEVER** client-side fetch game data — all data loaded via Astro SSR frontmatter.
- **NEVER** hardcode game-product relationships — always use the `game_id` FK on products.
- **NEVER** duplicate creator/label/reference logic — reuse existing patterns from products.
- **NEVER** make `game_id` required on products — many products don't belong to a specific game (e.g., generic supplements).

---

## 2. Contract (Quality)

### Definition of Done

#### Database & Types
- [ ] Migration creates `games`, `games_creators`, `game_semantic_labels`, `game_references`, `game_based_on` tables
- [ ] Migration adds `game_id` FK to `products` table
- [ ] RLS policies: public SELECT, admin-only INSERT/UPDATE/DELETE on all new tables
- [ ] Zod schemas added to `@roolipeli/database` (`GameSchema`, `GameCreatorSchema`, `GameSemanticLabelSchema`, `GameReferenceSchema`, `GameBasedOnSchema`)
- [ ] Types regenerated via `supabase gen types`
- [ ] Unit tests for all new Zod schemas

#### Query Layer
- [ ] `getGames()` — list all games with publisher name and product count
- [ ] `getGameBySlug(slug)` — single game with all relations (publisher, creators, labels, references, products)
- [ ] `getGameById(id)` — for admin edit page

#### Admin UI
- [ ] `/admin/games` listing page with DataTable
- [ ] `/admin/games/new` create form with all relationships
- [ ] `/admin/games/[id]/edit` edit form with pre-populated data
- [ ] API routes for CRUD (`/api/admin/games/`)
- [ ] "Pelit" added to AdminNav
- [ ] `game_id` dropdown added to product create/edit form
- [ ] Delete handles FK constraints gracefully

#### Public UI
- [ ] `/pelit` listing page with game cards
- [ ] `/pelit/[slug]` detail page with full metadata and product list
- [ ] "Pelit" added to SiteHeader navigation
- [ ] All strings use i18n (FI/SV/EN)
- [ ] Design tokens only (no hardcoded values)
- [ ] Responsive layout (mobile, tablet, desktop)

#### JSON-LD & AEO
- [ ] Game detail page includes `@type: "Game"` JSON-LD
- [ ] `hasPart` lists all linked products
- [ ] `sameAs` populated from game_references
- [ ] `genre` populated from game_semantic_labels with Wikidata URIs
- [ ] Validates at https://validator.schema.org/

#### Testing
- [ ] E2E: Game listing renders
- [ ] E2E: Game detail renders with all sections
- [ ] E2E: Admin can create a game with all relationships
- [ ] E2E: Admin can edit a game
- [ ] E2E: Admin can assign a game to a product
- [ ] E2E: Game detail shows linked products
- [ ] E2E: JSON-LD present and valid on game detail page

### Regression Guardrails

**Invariants:**
- Existing product pages must continue to work (adding `game_id` is backward-compatible)
- Existing admin forms must not break
- Product slugs and URLs must not change
- i18n routing (/, /sv, /en) continues to work
- All existing E2E tests pass

### Scenarios (Gherkin)

**Scenario: Browse all games** *(ROO-59d)*
- Given: The database contains 3 games (Astraterra, Legendoja & lohikäärmeitä, Praedor)
- When: I visit `/pelit`
- Then: I see 3 game cards sorted alphabetically
- And: Each card shows the game name, publisher, and product count

**Scenario: View game detail with products** *(ROO-59d)*
- Given: Game "Astraterra" exists with publisher "Ironspine", 2 creators, and 3 products
- When: I visit `/pelit/astraterra`
- Then: I see the game name "Astraterra" in an `<h1>`
- And: I see publisher "Ironspine" linked to its publisher page
- And: I see 2 creators with their roles
- And: I see 3 products listed under the game
- And: Each product links to its detail page (`/tuotteet/[slug]`)

**Scenario: View game based on one internal game** *(ROO-59d)*
- Given: Game "Spore Borg" exists with a `game_based_on` entry pointing to internal game "Mörk Borg"
- When: I visit `/pelit/spore-borg`
- Then: I see "Based on" section containing "Mörk Borg" with a link to `/pelit/mork-borg`

**Scenario: View game based on multiple sources (internal + external)** *(ROO-59d)*
- Given: Game "Pirate Borg" exists with two `game_based_on` entries: internal game "Mörk Borg" and external URL "https://www.drivethrurpg.com/product/250888/Knave" labelled "Knave"
- When: I visit `/pelit/pirate-borg`
- Then: I see "Based on" section containing "Mörk Borg" linking to `/pelit/mork-borg`
- And: I see "Knave" linking to the external URL

**Scenario: View game with semantic labels** *(ROO-59d)*
- Given: Game "Praedor" has labels "Fantasy" (Q132311) and "Seikkailu" (Q4686479)
- When: I visit `/pelit/praedor`
- Then: I see genre tags rendered as Kide `.tag` elements
- And: JSON-LD `genre` contains Wikidata URIs

**Scenario: Game not found** *(ROO-59d)*
- Given: No game with slug "ei-olemassa" exists
- When: I visit `/pelit/ei-olemassa`
- Then: I see a 404 error page

**Scenario: Admin creates a new game** *(ROO-59b)*
- Given: I am logged in as admin
- When: I navigate to `/admin/games/new`
- And: I fill in name "Myrskyn aika", select publisher "Burger Games"
- And: I add creator "Eero Tuovinen" with role "designer"
- And: I submit the form
- Then: The game is created in the database
- And: I am redirected to `/admin/games`

**Scenario: Admin assigns a game to a product** *(ROO-59c)*
- Given: Game "Astraterra" and product "Astraterra: Pelaajan kirja" exist
- When: I edit the product and select "Astraterra" from the game dropdown
- And: I save the product
- Then: The product's `game_id` is set to Astraterra's ID
- And: Visiting `/pelit/astraterra` shows the product in the "hasPart" list

**Scenario: Admin clears game assignment from product** *(ROO-59c)*
- Given: Product "Astraterra: Pelaajan kirja" has `game_id` set to "Astraterra"
- When: I edit the product and clear the game dropdown (select empty option)
- And: I save the product
- Then: The product's `game_id` is NULL
- And: The product no longer appears on `/pelit/astraterra`

**Scenario: Game listing empty state** *(ROO-59d)*
- Given: The database contains 0 games
- When: I visit `/pelit`
- Then: I see the heading "Pelit"
- And: I see a message "Ei vielä pelejä tietokannassa."

**Scenario: Product page shows parent game** *(Out of ROO-59d scope — separate PBI for product page modification)*
- Given: Product "Astraterra: Pelaajan kirja" has `game_id` set to "Astraterra"
- When: I visit `/tuotteet/astraterra-pelaajan-kirja`
- Then: I see "Roolipeli: Astraterra" with a link to `/pelit/astraterra`

**Scenario: JSON-LD validates for game**
- Given: Game "Astraterra" exists with full metadata
- When: A crawler reads `/pelit/astraterra`
- Then: It finds `<script type="application/ld+json">`
- And: The JSON-LD contains `@type: "Game"`
- And: `hasPart` lists linked products as `@type: "Book"`
- And: `isBasedOn` is an array of `@type: "Game"` entries (internal URL for DB games, external URL otherwise)
- And: `sameAs` contains external reference URLs

---

## 3. Implementation Notes

### Decomposition Suggestion

This feature is large enough to warrant multiple PBIs:

1. **ROO-59a: Database migration + schemas** — Create tables, RLS, Zod schemas, query layer
2. **ROO-59b: Admin CRUD** — Admin pages and API routes for games
3. **ROO-59c: Product form game_id** — Add game dropdown to product create/edit
4. **ROO-59d: Public routes** — `/pelit` listing and `/pelit/[slug]` detail pages
5. **ROO-59e: JSON-LD + AEO** — Structured data for game pages
6. **ROO-59f: Navigation + i18n** — Add "Pelit" to nav, all translation keys

### Naming Conventions

| Context | Finnish | English | Notes |
|---------|---------|---------|-------|
| URL | `/pelit` | — | Finnish-first routing |
| Table | `games` | — | English DB convention |
| i18n key | `nav.games` | — | Neutral key |
| UI label (FI) | "Pelit" | — | |
| UI label (SV) | "Spel" | — | |
| UI label (EN) | "Games" | — | |

### Rule System (Out of Scope)

The issue explicitly distinguishes games from rule systems ("sääntöjärjestelmä"). For example:
- "Blade Runner" (game) and "Mutant Year Zero" (game) both use "Year Zero Engine" (rule system)

A future `rule_systems` table could link to games via a `rule_system_id` FK. This spec does NOT include it, but the schema is designed to accommodate it later.

### Migration to products.game_id

The `game_id` column on products is nullable and has `ON DELETE SET NULL`. This means:
- Existing products are unaffected (game_id = NULL)
- If a game is deleted, linked products revert to game_id = NULL (not cascaded)
- Admin can gradually assign games to existing products

---

## 4. Dependencies & Constraints

### External Dependencies
- Schema.org `Game` type (https://schema.org/Game)
- No new npm dependencies required

### Constraints
- **SSR-Only**: All game routes render server-side
- **Monorepo Paths**: Types and schemas from `@roolipeli/database`
- **TypeScript Strict**: No `any` types
- **Public Access**: Game catalog is fully public (no auth for read)
- **Design Tokens**: All UI uses `var(--kide-*)` tokens

---

**Spec Status:** Accepted
**Linear Issue:** [ROO-59](https://linear.app/pelilauta/issue/ROO-59/feature-roolipeli-tietotyyppi)
**Created:** 2026-02-10
**Updated:** 2026-02-23 (ROO-99: added ProductSchema game_id Zod delta, product.metadata.game i18n key, ROO-59c annotations, clear-game-assignment scenario, fixed ProductForm.astro→.svelte)
**Owner:** @Architect
