# Spec: Organization ("Järjestö") Data Type (ROO-41)

## 1. Blueprint (Design)

### Context
> **Goal:** Introduce a top-level "Organization" (järjestö) entity type for Finnish RPG associations, clubs, event organizers, and community groups — mapped to Schema.org `Organization`.
> **Why:** The Finnish RPG ecosystem includes many non-commercial organizations (e.g., Suomen Roolipeliseura ry, Ropecon ry, local gaming clubs) that are distinct from commercial publishers. A first-class organization entity enables proper semantic relationships, richer JSON-LD, and discovery of the ecosystem beyond products.
> **Architectural Impact:** New `organizations` table in Supabase, new public routes (`/jarjestot`, `/jarjestot/[slug]`), admin CRUD, query layer extensions, JSON-LD `Organization` schema, and integration with the `entity_references` polymorphic system (ROO-26).

### Relationship to Publishers

Organizations and publishers are **distinct entity types** in v1:

| Aspect | Publishers | Organizations |
|--------|-----------|---------------|
| Purpose | Commercial entities that release products | Associations, clubs, event organizers |
| Schema.org | `Organization` (as `producer` on products) | `Organization` (standalone entity) |
| Examples | Ironspine, Burger Games | Ropecon ry, Suomen Roolipeliseura |
| FK usage | `products.publisher_id`, `games.publisher_id` | No product FK (v1) |

> **Future consideration:** A later PBI could introduce a unifying abstraction (e.g., `organization_type` enum spanning publishers and associations), or an FK from publishers to organizations. This spec does NOT include that merger.

### Data Architecture

#### Schema Changes

**New Table: `organizations`**
| Column | Type | Constraints | Schema.org Mapping |
|--------|------|-------------|-------------------|
| `id` | UUID (PK) | Default `gen_random_uuid()` | — |
| `name` | text | NOT NULL | `name` |
| `slug` | text | NOT NULL, UNIQUE | URL identifier |
| `description` | text | nullable | `description` |
| `area_served` | text | NOT NULL | `areaServed` (e.g., "Suomi", "Helsinki", "Pohjanmaa") |
| `alternate_name` | text | nullable | `alternateName` (e.g., abbreviation "SRS") |
| `email` | text | nullable | `email` |
| `logo_url` | text | nullable | `logo` |
| `url` | text | nullable | `url` (official website) |
| `tax_id` | text | nullable | `taxID` (Y-tunnus, e.g., "1234567-8") |
| `keywords` | text | nullable | `keywords` (comma-separated or semicolon-separated) |
| `founded_date` | text | nullable | `foundingDate` (ISO-8601 date string, e.g., "1995") |
| `created_at` | timestamptz | DEFAULT now() | — |

**Design decisions:**
- `area_served` is **NOT NULL** per the Linear issue: "we want this to be required to have the sense of geography for our organizations"
- `tax_id` covers both Finnish Y-tunnus (`taxID`) and international VAT format (`vatID`) — the distinction is presentational, not structural
- `keywords` stored as text (not array) for simplicity; parsed at display/JSON-LD time
- `founded_date` is text (not date) to support partial dates like "1995" or "1995-03"
- Fields deferred to future PBIs: `address` (needs structured type), `location` (needs geo coordinates), `contactPoint` (needs structured type), `member`/`alumni`/`employee` (need join tables)

#### Relationships

- `organizations` 1:N `entity_references` (via polymorphic `entity_type = 'organization'`) — external links, social media, Wikidata
- No direct FK relationships to other entity tables in v1

#### Entity References Integration (ROO-26)

The `entity_references` polymorphic table (spec: `specs/entity-references/spec.md`) gains a new entity type:

1. Add `'organization'` to `chk_entity_type` CHECK constraint
2. Add `'organization'` to `EntityTypeEnum` Zod schema
3. Add cleanup trigger on `organizations` table
4. Add `'organization'` case to `validate_entity_reference()` function

This enables organizations to have references of all types: `official`, `source`, `review`, `social`.

#### RLS Policies

- **SELECT**: Public read access (anonymous users can browse organizations)
- **INSERT/UPDATE/DELETE**: Admin only (`(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`)

#### Zod Schemas (packages/database)

```typescript
export const OrganizationSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().nullable().optional(),
  area_served: z.string().min(1).max(255),
  alternate_name: z.string().max(255).nullable().optional(),
  email: z.string().email().nullable().optional(),
  logo_url: z.string().url().nullable().optional(),
  url: z.string().url().nullable().optional(),
  tax_id: z.string().max(20).nullable().optional(),
  keywords: z.string().max(500).nullable().optional(),
  founded_date: z.string().max(10).nullable().optional(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

/** Form schema for creating an organization (with nested references) */
export const OrganizationFormCreateSchema = OrganizationSchema
  .omit({ id: true, created_at: true })
  .extend({
    references: z
      .array(
        z.object({
          reference_type: ReferenceTypeEnum,
          label: z.string().min(1),
          url: z.string().url(),
        }),
      )
      .optional(),
  });

/** Form schema for updating an organization */
export const OrganizationFormUpdateSchema = OrganizationFormCreateSchema.partial()
  .required({ name: true, slug: true, area_served: true });
```

### UI Architecture

#### Public Routes (SSR in Astro)

1. **`/jarjestot`** (Organization Listing)
   - Fetches all organizations sorted alphabetically by name
   - Grid of organization cards (name, area_served, description excerpt)
   - Empty state when no organizations exist

2. **`/jarjestot/[slug]`** (Organization Detail)
   - Full organization metadata (name, description, area, founded date, etc.)
   - External references (sameAs links, social media)
   - JSON-LD `@type: "Organization"` in `<head>`

#### Admin Routes

3. **`/admin/organizations`** (Organization List)
   - DataTable with columns: Name, Area Served, Slug
   - Edit/Delete actions

4. **`/admin/organizations/new`** (Create Organization)
   - Form fields matching `OrganizationSchema`
   - Dynamic references rows (reusing `ReferenceFormRows` pattern)

5. **`/admin/organizations/[id]/edit`** (Edit Organization)
   - Same form, pre-populated
   - References editable

#### API Routes

6. **`/api/admin/organizations/index.ts`** — POST (create)
7. **`/api/admin/organizations/[id].ts`** — PUT (update), DELETE

#### Data Flow

```
Astro Page (SSR) → getOrganizations() / getOrganizationBySlug() from @roolipeli/database
  → Supabase query with entity_references join
  → Typed props to Astro rendering
```

#### Navigation

- Add "Järjestöt" to `SiteHeader` nav items
- Add "Järjestöt" to `AdminNav` items
- Add i18n keys for FI/SV/EN

#### i18n Keys

| Key | FI | SV | EN |
|-----|----|----|-----|
| `nav.organizations` | Järjestöt | Organisationer | Organizations |
| `organizations.title` | Järjestöt \| Roolipeli.info | Organisationer \| Roolipeli.info | Organizations \| Roolipeli.info |
| `organizations.heading` | Järjestöt | Organisationer | Organizations |
| `organizations.backLink` | Takaisin järjestöihin | Tillbaka till organisationer | Back to organizations |
| `organizations.empty` | Ei vielä järjestöjä tietokannassa. | Inga organisationer i databasen ännu. | No organizations in the database yet. |
| `organization.metadata.label` | Tiedot | Information | Details |
| `organization.metadata.area` | Toimialue | Verksamhetsområde | Area served |
| `organization.metadata.email` | Sähköposti | E-post | Email |
| `organization.metadata.url` | Verkkosivut | Webbplats | Website |
| `organization.metadata.taxId` | Y-tunnus | FO-nummer | Tax ID |
| `organization.metadata.founded` | Perustettu | Grundat | Founded |
| `organization.metadata.keywords` | Avainsanat | Nyckelord | Keywords |
| `organization.description.label` | Kuvaus | Beskrivning | Description |
| `organization.references.label` | Lähteet | Källor | References |
| `admin.organizations` | Järjestöt | Organisationer | Organizations |
| `admin.organizations.new` | Uusi järjestö | Ny organisation | New organization |
| `admin.organizations.edit` | Muokkaa järjestöä | Redigera organisation | Edit organization |
| `admin.organizations.col.name` | Nimi | Namn | Name |
| `admin.organizations.col.area` | Toimialue | Verksamhetsområde | Area served |
| `admin.organizations.col.slug` | Slug | Slug | Slug |

#### JSON-LD Structure

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ropecon ry",
  "alternateName": "Ropecon",
  "description": "Suomen suurin roolipelitapahtuma...",
  "areaServed": "Suomi",
  "email": "info@ropecon.fi",
  "url": "https://ropecon.fi",
  "logo": "https://example.com/ropecon-logo.png",
  "taxID": "1234567-8",
  "foundingDate": "1994",
  "keywords": ["roolipelit", "lautapelit", "larp"],
  "sameAs": [
    "http://www.wikidata.org/entity/Q...",
    "https://fi.wikipedia.org/wiki/Ropecon",
    "https://www.instagram.com/ropecon/"
  ]
}
```

### Anti-Patterns

- **NEVER** confuse organizations with publishers — they are distinct entity types in v1. Publishers release products; organizations are associations and clubs.
- **NEVER** create a separate `organization_references` table — use the polymorphic `entity_references` system (ROO-26).
- **NEVER** client-side fetch organization data — all data loaded via Astro SSR frontmatter.
- **NEVER** hardcode `area_served` values as an enum — it's free text to support diverse geographic descriptions (country, region, city, "international").
- **NEVER** use `user_metadata` for admin checks — use `app_metadata` per security protocols.

---

## 2. Contract (Quality)

### Definition of Done

#### Database & Types
- [ ] Migration creates `organizations` table
- [ ] Migration extends `entity_references` CHECK constraint and triggers for `'organization'` type
- [ ] RLS policies: public SELECT, admin-only INSERT/UPDATE/DELETE
- [ ] Zod schemas added to `@roolipeli/database` (`OrganizationSchema`, `OrganizationFormCreateSchema`, `OrganizationFormUpdateSchema`)
- [ ] `EntityTypeEnum` updated to include `'organization'`
- [ ] Types regenerated via `supabase gen types`
- [ ] Unit tests for `OrganizationSchema` validation

#### Query Layer
- [ ] `getOrganizations()` — list all organizations sorted by name
- [ ] `getOrganizationBySlug(slug)` — single organization with references
- [ ] `getOrganizationById(id)` — for admin edit page (with references)

#### Admin UI
- [ ] `/admin/organizations` listing page with DataTable
- [ ] `/admin/organizations/new` create form with all fields + references
- [ ] `/admin/organizations/[id]/edit` edit form with pre-populated data + references
- [ ] API routes for CRUD (`/api/admin/organizations/`)
- [ ] "Järjestöt" added to AdminNav
- [ ] Delete handles constraints gracefully

#### Public UI
- [ ] `/jarjestot` listing page with organization cards
- [ ] `/jarjestot/[slug]` detail page with full metadata and references
- [ ] "Järjestöt" added to SiteHeader navigation
- [ ] All strings use i18n (FI/SV/EN)
- [ ] Design tokens only (no hardcoded values)
- [ ] Responsive layout (mobile, tablet, desktop)

#### JSON-LD & AEO
- [ ] Organization detail page includes `@type: "Organization"` JSON-LD
- [ ] `sameAs` populated from entity_references (official + source types)
- [ ] Validates at https://validator.schema.org/

#### Testing
- [ ] E2E: Organization listing renders
- [ ] E2E: Organization detail renders with all sections
- [ ] E2E: Admin can create an organization with references
- [ ] E2E: Admin can edit an organization
- [ ] E2E: Admin can delete an organization
- [ ] E2E: Organization detail shows references
- [ ] E2E: JSON-LD present and valid on organization detail page
- [ ] E2E: Organization not found returns 404

### Regression Guardrails

**Invariants:**
- Existing entity pages (products, games, publishers, creators) must continue to work
- Existing admin forms must not break
- `entity_references` system continues to work for existing entity types
- i18n routing (/, /sv, /en) continues to work
- All existing E2E tests pass

### Scenarios (Gherkin)

**Scenario: Browse all organizations**
- Given: The database contains 3 organizations (Ropecon ry, Suomen Roolipeliseura, Turun Pelikerho)
- When: I visit `/jarjestot`
- Then: I see 3 organization cards sorted alphabetically
- And: Each card shows the organization name and area served

**Scenario: View organization detail**
- Given: Organization "Ropecon ry" exists with area "Suomi", email, and 2 references
- When: I visit `/jarjestot/ropecon-ry`
- Then: I see the organization name "Ropecon ry" in an `<h1>`
- And: I see area served "Suomi"
- And: I see email address
- And: I see 2 external references

**Scenario: View organization with minimal data**
- Given: Organization "Pelikerho X" exists with only name and area_served
- When: I visit `/jarjestot/pelikerho-x`
- Then: I see the name and area
- And: Optional sections (email, references, etc.) are not rendered

**Scenario: Organization not found**
- Given: No organization with slug "ei-olemassa" exists
- When: I visit `/jarjestot/ei-olemassa`
- Then: I see a 404 error page

**Scenario: Organization listing empty state**
- Given: The database contains 0 organizations
- When: I visit `/jarjestot`
- Then: I see the heading "Järjestöt"
- And: I see a message "Ei vielä järjestöjä tietokannassa."

**Scenario: Admin creates a new organization**
- Given: I am logged in as admin
- When: I navigate to `/admin/organizations/new`
- And: I fill in name "Ropecon ry", area served "Suomi", slug "ropecon-ry"
- And: I add a reference with type "official", label "Kotisivut", url "https://ropecon.fi"
- And: I submit the form
- Then: The organization is created in the database
- And: The reference is stored in `entity_references` with `entity_type = 'organization'`
- And: I am redirected to `/admin/organizations`

**Scenario: Admin edits an organization**
- Given: Organization "Ropecon ry" exists
- When: I navigate to `/admin/organizations/[id]/edit`
- And: I change the description to "Suomen suurin roolipelitapahtuma"
- And: I submit the form
- Then: The organization is updated in the database
- And: I am redirected to `/admin/organizations`

**Scenario: Admin deletes an organization**
- Given: Organization "Test Org" exists with 1 reference
- When: I click delete on `/admin/organizations`
- And: I confirm the deletion
- Then: The organization is removed from the database
- And: Related entity_references are cleaned up by trigger
- And: I am redirected to `/admin/organizations` with success message

**Scenario: JSON-LD validates for organization**
- Given: Organization "Ropecon ry" exists with full metadata and 2 references
- When: A crawler reads `/jarjestot/ropecon-ry`
- Then: It finds `<script type="application/ld+json">`
- And: The JSON-LD contains `@type: "Organization"`
- And: `areaServed` is present
- And: `sameAs` contains reference URLs

**Scenario: Unauthenticated user cannot access admin**
- Given: User is not logged in
- When: User navigates to `/admin/organizations`
- Then: Redirected to `/kirjaudu?next=/admin`

---

## 3. Implementation Notes

### Decomposition Suggestion

This feature can be implemented in sequential PBIs:

1. **ROO-41a: Database migration + schemas** — Create `organizations` table, extend `entity_references` for organization type, Zod schemas, query layer
2. **ROO-41b: Admin CRUD** — Admin pages, API routes, forms with reference management
3. **ROO-41c: Public routes + JSON-LD** — `/jarjestot` listing, `/jarjestot/[slug]` detail, JSON-LD, navigation, i18n

### Naming Conventions

| Context | Finnish | English | Notes |
|---------|---------|---------|-------|
| URL | `/jarjestot` | — | Finnish-first routing |
| Table | `organizations` | — | English DB convention |
| i18n key | `nav.organizations` | — | Neutral key |
| UI label (FI) | "Järjestöt" | — | |
| UI label (SV) | "Organisationer" | — | |
| UI label (EN) | "Organizations" | — | |

### Deferred Fields (Future PBIs)

The Linear issue mentions several Schema.org fields that require complex data structures:

| Field | Why Deferred | Future Approach |
|-------|-------------|-----------------|
| `member` | Needs join table to persons/creators | `organization_members` join table |
| `alumni` | Needs join table to persons/creators | Same as member with role/status |
| `employee` | Needs join table to persons/creators | Same as member with role |
| `address` | Needs structured address type | JSONB or separate `addresses` table |
| `location` | Needs geo coordinates | PostGIS or JSONB |
| `contactPoint` | Needs structured type | JSONB field |
| `knowsAbout` | Semantic concept linking | Link to `semantic_labels` via join table |

### Entity References for sameAs

The `sameAs` field from the Linear issue is NOT a direct column — it's derived from `entity_references` with types `official` and `source`. This follows the same pattern as products and games.

### Migration for Entity References

If ROO-26 (entity_references) migration has already been applied:
```sql
-- Add 'organization' to the entity type constraint
ALTER TABLE entity_references
  DROP CONSTRAINT chk_entity_type,
  ADD CONSTRAINT chk_entity_type
  CHECK (entity_type IN ('product', 'game', 'publisher', 'creator', 'organization'));

-- Add cleanup trigger
CREATE TRIGGER trg_organizations_cleanup_references
  AFTER DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_entity_references('organization');

-- Update validation function to include 'organization' → 'organizations' mapping
```

If ROO-26 has NOT been applied yet, the initial `entity_references` migration should include `'organization'` from the start.

---

## 4. Dependencies & Constraints

### Dependencies
- **ROO-26 (Entity References)**: Organization references depend on the polymorphic `entity_references` table. If ROO-26 is not yet implemented, organizations can launch without references and add them when ROO-26 lands.
- **No new npm dependencies required**
- Schema.org `Organization` type (https://schema.org/Organization)

### Constraints
- **SSR-Only**: All organization routes render server-side
- **Monorepo Paths**: Types and schemas from `@roolipeli/database`
- **TypeScript Strict**: No `any` types
- **Public Access**: Organization catalog is fully public (no auth for read)
- **Design Tokens**: All UI uses `var(--kide-*)` tokens
- **RLS**: Admin-only writes via `app_metadata.role`

---

**Spec Status:** Draft
**Linear Issue:** [ROO-41](https://linear.app/pelilauta/issue/ROO-41/feature-jarjesto-tietotyyppi)
**Created:** 2026-02-26
**Owner:** @Architect
