# Spec: Unified Entity References (ROO-26)

## 1. Blueprint (Design)

### Context
> **Goal:** Replace per-entity reference tables (`product_references`, `game_references`) with a single polymorphic `entity_references` table that serves ALL entity types (products, games, publishers, creators, and future types).
> **Why:** External references (official sites, Wikidata, social media, reviews) are a cross-cutting concern central to every entity. Currently, each new entity type requires a new `*_references` table with duplicated schema, RLS policies, Zod validators, query functions, API routes, and UI components. ROO-26 consolidates this into a single system.
> **Architectural Impact:** Big-bang migration replacing two existing tables, new reference support for publishers and creators, shared UI components, and simplified query/API patterns.

### Problem Statement

Today we have:
- `product_references` — 7 columns, FK to `products.id`
- `game_references` — 7 columns, FK to `games.id`
- Publishers — **no references** (missing: homepage, YTJ, social media)
- Creators — **no references** (missing: homepage, portfolio, social media)

Each table duplicates the same structure. Each required its own:
- SQL migration + RLS policies
- Zod schema (`ProductReferenceSchema`, `GameReferenceSchema`)
- Form schema variants (`ProductFormCreateSchema.references`, `GameFormCreateSchema.references`)
- Query joins (`product_references(*)`, `game_references(*)`)
- API route logic (insert/update/delete)
- UI components (reference list, reference form rows)

### Architecture Decision

**Chosen: Polymorphic Table (Option A)** — decided by @Architect (Petri) on 2026-02-24.

Rationale: Single table, single schema, zero DDL for new entity types. Referential integrity enforced via cleanup triggers (documented below).

### Data Architecture

#### Table: `entity_references`

| Column | Type | Default | Constraints | Description |
|--------|------|---------|-------------|-------------|
| `id` | UUID | `gen_random_uuid()` | PK | |
| `entity_type` | TEXT | — | NOT NULL | `'product'` \| `'game'` \| `'publisher'` \| `'creator'` |
| `entity_id` | UUID | — | NOT NULL | References the owning entity |
| `reference_type` | TEXT | — | NOT NULL | Reuses `ReferenceTypeEnum`: `'official'` \| `'source'` \| `'review'` \| `'social'` |
| `label` | TEXT | — | NOT NULL | Display text (e.g., "Wikidata", "Kotisivut") |
| `url` | TEXT | — | NOT NULL | The external link |
| `citation_details` | JSONB | `NULL` | nullable | Structured bibliographic data (for reviews) |
| `created_at` | TIMESTAMPTZ | `now()` | | |

#### Indexes

```sql
-- Primary lookup: all references for a specific entity
CREATE INDEX idx_entity_references_lookup
  ON entity_references (entity_type, entity_id);
```

#### Referential Integrity: Cleanup Triggers

Since `entity_id` cannot have a polymorphic FK constraint, referential integrity is enforced via triggers. **Each entity table gets a DELETE trigger** that cascades to `entity_references`.

```sql
-- Generic cleanup function (shared by all entity tables)
CREATE OR REPLACE FUNCTION cleanup_entity_references()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM entity_references
  WHERE entity_type = TG_ARGV[0]
    AND entity_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- One trigger per entity table
CREATE TRIGGER trg_products_cleanup_references
  AFTER DELETE ON products
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('product');

CREATE TRIGGER trg_games_cleanup_references
  AFTER DELETE ON games
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('game');

CREATE TRIGGER trg_publishers_cleanup_references
  AFTER DELETE ON publishers
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('publisher');

CREATE TRIGGER trg_creators_cleanup_references
  AFTER DELETE ON creators
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('creator');
```

#### Insert Validation Trigger

Prevent inserting references that point to non-existent entities:

```sql
CREATE OR REPLACE FUNCTION validate_entity_reference()
RETURNS TRIGGER AS $$
DECLARE
  entity_exists BOOLEAN;
BEGIN
  EXECUTE format(
    'SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)',
    CASE NEW.entity_type
      WHEN 'product' THEN 'products'
      WHEN 'game' THEN 'games'
      WHEN 'publisher' THEN 'publishers'
      WHEN 'creator' THEN 'creators'
      ELSE NULL
    END
  ) INTO entity_exists USING NEW.entity_id;

  IF NOT entity_exists THEN
    RAISE EXCEPTION 'Entity % with id % does not exist',
      NEW.entity_type, NEW.entity_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_entity_reference
  BEFORE INSERT OR UPDATE ON entity_references
  FOR EACH ROW
  EXECUTE FUNCTION validate_entity_reference();
```

#### Entity Type Constraint

```sql
ALTER TABLE entity_references
  ADD CONSTRAINT chk_entity_type
  CHECK (entity_type IN ('product', 'game', 'publisher', 'creator'));
```

> **Future entity types:** Add the new value to `chk_entity_type`, create a cleanup trigger on the new entity table, and update the `validate_entity_reference` CASE statement. No new tables needed.

#### RLS Policies

```sql
-- Public read
CREATE POLICY "Public read access"
  ON entity_references FOR SELECT
  USING (true);

-- Admin-only write (INSERT, UPDATE, DELETE)
CREATE POLICY "Admin write access"
  ON entity_references FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
```

#### JSONB: `citation_details`

Retained as nullable. Only relevant for `review`-type references (primarily on products). Costs nothing when NULL.

```typescript
interface CitationDetails {
  author?: string;         // e.g., "Mäkinen, Ville"
  published_date?: string; // ISO-8601: "2023-01-01"
  publication_name?: string; // e.g., "Nörttitytöt"
  language?: 'fi' | 'en' | 'sv';
}
```

#### Zod Schemas (`packages/database`)

```typescript
/** Valid entity types for the polymorphic reference table */
export const EntityTypeEnum = z.enum(['product', 'game', 'publisher', 'creator']);
export type EntityType = z.infer<typeof EntityTypeEnum>;

/** Unified reference schema — replaces ProductReferenceSchema and GameReferenceSchema */
export const EntityReferenceSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  entity_type: EntityTypeEnum,
  entity_id: z.string().uuid(),
  reference_type: ReferenceTypeEnum,
  label: z.string().min(1).max(255),
  url: z.string().url(),
  citation_details: CitationDetailsSchema.nullable().optional(),
});
```

Form create/update schemas for all entity types share a single `references` array shape:

```typescript
/** Reusable references sub-schema for form payloads */
export const ReferencesFormField = z
  .array(
    z.object({
      reference_type: ReferenceTypeEnum,
      label: z.string().min(1),
      url: z.string().url(),
    }),
  )
  .optional();
```

This replaces the duplicated `references` fields in `ProductFormCreateSchema`, `ProductFormUpdateSchema`, `GameFormCreateSchema`, and `GameFormUpdateSchema`.

### Reference Types

The existing `ReferenceTypeEnum` (`official`, `source`, `review`, `social`) applies universally:

| Entity | Typical References |
|--------|-------------------|
| Product | Official page, Wikidata, RPGGeek, reviews, webshop links |
| Game | Official site, Wikidata, Wikipedia, RPGGeek |
| Publisher | Homepage, YTJ (Finnish Trade Register), social media, webshops |
| Creator | Homepage, portfolio, social media, ORCID, LinkedIn |

### Migration Strategy

**Big-bang migration** — decided by @Architect (Petri) on 2026-02-24. The project is pre-beta; no incremental transition needed.

The migration SQL will:

1. Create `entity_references` table with indexes, CHECK constraint, and RLS
2. Create the cleanup trigger function and per-table triggers
3. Create the insert validation trigger
4. Migrate existing data:
   ```sql
   INSERT INTO entity_references (id, entity_type, entity_id, reference_type, label, url, citation_details, created_at)
   SELECT id, 'product', product_id, reference_type, label, url, citation_details, created_at
   FROM product_references;

   INSERT INTO entity_references (id, entity_type, entity_id, reference_type, label, url, citation_details, created_at)
   SELECT id, 'game', game_id, reference_type, label, url, citation_details, created_at
   FROM game_references;
   ```
5. Drop old tables: `DROP TABLE product_references; DROP TABLE game_references;`

### UI Architecture

#### Shared Components
- **`ReferenceFormRows.svelte`**: Reusable dynamic reference rows for any entity form. Accepts `entityType` prop for API routing.
- **`ReferenceList.svelte`**: Reusable display of references on any entity detail page.
- **`Citation.svelte`**: APA-style citation rendering (already specified in product-references spec).

#### Admin Routes Affected
- `/admin/products/new` and `/admin/products/[id]/edit` — Update to use `entity_references` (entity_type = `product`)
- `/admin/games/new` and `/admin/games/[id]/edit` — Update to use `entity_references` (entity_type = `game`)
- `/admin/publishers/[id]/edit` — **Add** reference management section
- `/admin/creators/[id]/edit` — **Add** reference management section (page exists, currently has name + slug fields only)

#### API Routes Affected
- `/api/admin/products/index.ts` and `/api/admin/products/[id].ts` — Update reference insert/update to use `entity_references`
- `/api/admin/games/index.ts` and `/api/admin/games/[id].ts` — Same
- `/api/admin/publishers/[id].ts` — **Add** reference handling
- `/api/admin/creators/[id].ts` — **Add** reference handling

#### Public Routes Affected
- `/kustantajat/[slug]` — Display publisher references
- `/tekijat/[slug]` — Display creator references

#### Query Layer Changes
- All `*_references(*)` joins replaced with `entity_references` filtered by `entity_type`
- Example: `getProductBySlug` changes from `product_references(*)` to `entity_references!inner(entity_type.eq.product)`
- New: `getPublisherBySlug` and `getCreatorBySlug` (or equivalents) include `entity_references` join

#### JSON-LD Impact
- Publisher pages: `sameAs` populated from `official`-type references
- Creator pages: `sameAs` populated from `official`-type references
- Enriches AEO spec (currently Publisher/Creator JSON-LD have no `sameAs`)

#### i18n Keys

Reference-related i18n keys should be entity-agnostic where possible:

| Key | FI | SV | EN |
|-----|----|----|-----|
| `references.label` | Lähteet | Källor | References |
| `references.official` | Viralliset lähteet | Officiella källor | Official sources |
| `references.social` | Sosiaalinen media | Sociala medier | Social media |
| `references.reviews` | Arvostelut | Recensioner | Reviews |
| `references.empty` | Ei lähdeviitteitä. | Inga referenser. | No references. |

### Anti-Patterns
- **NEVER** create a new `*_references` table for a new entity type — use `entity_references` with the new `entity_type` value.
- **NEVER** use `entity_type` strings in application code without the `EntityTypeEnum` Zod validator or TypeScript `EntityType` union.
- **NEVER** skip RLS on `entity_references` — all write operations must check admin role via `app_metadata`.
- **NEVER** use `user_metadata` for admin checks in RLS policies.
- **NEVER** forget to add a cleanup trigger when creating a new entity table.

---

## 2. Contract (Quality)

### Definition of Done

#### Database & Types
- [x] Migration creates `entity_references` table with indexes and CHECK constraint
- [x] Cleanup trigger function + per-entity-table triggers created
- [x] Insert validation trigger created
- [x] Data migrated from `product_references` and `game_references`
- [x] Old tables dropped (`product_references`, `game_references`)
- [x] RLS policies: public SELECT, admin-only INSERT/UPDATE/DELETE
- [x] `EntityReferenceSchema` and `EntityTypeEnum` added to `@roolipeli/database`
- [x] `ProductReferenceSchema` and `GameReferenceSchema` removed
- [x] `ReferencesFormField` replaces duplicated form schema fields
- [x] Types regenerated via `supabase gen types`

#### Query Layer
- [x] Product queries use `entity_references` filtered by `entity_type = 'product'`
- [x] Game queries use `entity_references` filtered by `entity_type = 'game'`
- [x] Publisher queries include references
- [x] Creator queries include references

#### Admin UI
- [x] Product forms use shared reference component (no behavior change)
- [x] Game forms use shared reference component (no behavior change)
- [x] Publisher edit form has reference management
- [x] Creator edit form has reference management
- [ ] Shared `ReferenceFormRows.svelte` component used by all forms

#### Public UI
- [x] Product detail pages display references (no behavior change)
- [x] Game detail pages display references (no behavior change)
- [x] Publisher detail page displays references
- [x] Creator detail page displays references
- [x] JSON-LD `sameAs` populated from references on publisher/creator pages

#### Testing
- [x] E2E: Product reference CRUD still works after migration
- [x] E2E: Game reference CRUD still works after migration
- [x] E2E: Publisher references CRUD
- [x] E2E: Creator references CRUD
- [ ] E2E: Publisher page displays references
- [ ] E2E: Creator page displays references
- [x] Unit: `EntityReferenceSchema` validation
- [x] Unit: Cleanup trigger removes orphans on entity delete

### Regression Guardrails

**Invariants:**
- Existing product reference functionality must not break (data migrated, UI unchanged)
- Existing game reference functionality must not break (data migrated, UI unchanged)
- All existing E2E tests pass (with updated selectors if needed)
- JSON-LD on product/game pages unchanged
- `ReferenceTypeEnum` values unchanged (`official`, `source`, `review`, `social`)
- Deleting an entity cascades to its references via trigger (no orphans)
- Inserting a reference for a non-existent entity is rejected by validation trigger

### Scenarios (Gherkin)

**Scenario: Publisher with homepage and social references**
- Given: Publisher "Ironspine" exists
- When: Admin adds references: official homepage, YTJ link, Instagram social
- Then: `/kustantajat/ironspine` displays all three references
- And: JSON-LD `sameAs` includes the official homepage URL

**Scenario: Creator with portfolio reference**
- Given: Creator "Miska Fredman" exists
- When: Admin adds references: personal site (official), ArtStation portfolio (official)
- Then: `/tekijat/miska-fredman` displays both references
- And: JSON-LD `sameAs` includes both URLs

**Scenario: Reference types consistent across entities**
- Given: The reference_type enum is `official | source | review | social`
- When: Admin adds a reference to any entity type
- Then: The same type dropdown is available regardless of entity type

**Scenario: Backward compatibility (product references)**
- Given: Product "Myrskyn aika" had references in the old `product_references` table
- When: Migration completes and I view `/tuotteet/myrskyn-aika`
- Then: All references render exactly as before

**Scenario: Backward compatibility (game references)**
- Given: Game "Astraterra" had references in the old `game_references` table
- When: Migration completes and I view `/pelit/astraterra`
- Then: All references render exactly as before

**Scenario: Orphan cleanup on entity delete**
- Given: Publisher "Test Publisher" has 2 references in `entity_references`
- When: Admin deletes the publisher
- Then: Both references are automatically deleted by the cleanup trigger
- And: No orphan rows remain in `entity_references`

**Scenario: Reject reference for non-existent entity**
- Given: No publisher with id `00000000-0000-0000-0000-000000000000` exists
- When: An INSERT into `entity_references` targets that id with `entity_type = 'publisher'`
- Then: The insert is rejected with an error

**Scenario: Admin adds reference to creator edit form**
- Given: I am logged in as admin and editing creator "Eero Tuovinen"
- When: I add a reference with type `official`, label "Kotisivut", and a URL
- And: I save the form
- Then: The reference is stored in `entity_references` with `entity_type = 'creator'`
- And: `/tekijat/eero-tuovinen` displays the reference

---

## 3. Implementation Notes

### Decomposition into PBIs

1. **ROO-26a: Database migration + schemas** — Create `entity_references`, triggers, migrate data, drop old tables, update Zod schemas
2. **ROO-26b: Update product reference code paths** — Queries, API routes, forms to use `entity_references`
3. **ROO-26c: Update game reference code paths** — Same as above for games
4. **ROO-26d: Shared UI components** — Extract `ReferenceFormRows.svelte` and `ReferenceList.svelte`
5. **ROO-26e: Publisher references** — Admin edit form + public display + JSON-LD `sameAs`
6. **ROO-26f: Creator references** — Admin edit form + public display + JSON-LD `sameAs`

### Supabase Query Pattern

Since PostgREST doesn't support polymorphic FK joins natively, references must be fetched with an explicit filter:

```typescript
// In query functions
const { data } = await supabase
  .from('entity_references')
  .select('*')
  .eq('entity_type', 'product')
  .eq('entity_id', productId);
```

Alternatively, use a Postgres VIEW per entity type for cleaner PostgREST integration:

```sql
CREATE VIEW product_references_view AS
  SELECT * FROM entity_references WHERE entity_type = 'product';
```

> **Decision needed during implementation:** Evaluate whether views are necessary for PostgREST ergonomics or if direct filtered queries suffice.

### Relationship to Existing Specs

| Spec | Relationship |
|------|-------------|
| `specs/product-references/spec.md` | **Superseded** — product-specific reference system replaced by this unified spec |
| `specs/rpg-entity/spec.md` | Section on `game_references` table replaced by `entity_references` with `entity_type = 'game'` |
| `specs/aeo/spec.md` | Publisher/Creator JSON-LD gains `sameAs` from references |
| `specs/database/spec.md` | Core schema gains polymorphic reference system |

---

## 4. Dependencies & Constraints

### External Dependencies
- No new npm dependencies required
- Schema.org `sameAs` property (already in use for products)

### Constraints
- **SSR-Only**: All reference data fetched server-side
- **Monorepo Paths**: Types and schemas from `@roolipeli/database`
- **TypeScript Strict**: No `any` types; use `EntityType` union for entity_type values
- **Design Tokens**: All UI uses `var(--kide-*)` tokens
- **RLS**: Admin-only writes via `app_metadata.role`

### Prerequisites
- Creator admin edit page exists at `/admin/creators/[id]/edit` (confirmed — currently has name + slug fields)
- Publisher admin edit page exists at `/admin/publishers/[id]/edit`

---

**Spec Status:** Accepted
**Linear Issue:** [ROO-26](https://linear.app/pelilauta/issue/ROO-26/feature-yleinen-lahdeviitekaytanto)
**Parent Issue:** [ROO-9](https://linear.app/pelilauta/issue/ROO-9/feature-kanoniset-totuuden-lahteet) (Duplicate — superseded by ROO-26)
**Created:** 2026-02-24
**Updated:** 2026-02-25 (Finalized: Option A polymorphic table, big-bang migration, decisions resolved)
**Owner:** @Architect
