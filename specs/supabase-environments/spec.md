# Spec: Supabase Environments & Migration Workflow

## 1. Blueprint (Design)

### Context
> **Goal:** Establish a dual-environment Supabase setup (dev + prod) with a safe migration
> promotion workflow and tooling to reset dev with production data.
> **Why:** Currently there is only one Supabase Cloud project (production) and local dev via
> `supabase start`. There is no shared staging environment to validate migrations before they
> hit prod, and no way to test against realistic data without touching production directly.
> **Architectural Impact:** Monorepo root scripts, environment variable conventions, migration
> file layout, and CI/CD workflows.

### Current State (Problem)

1. **Split migrations:** 8 files in `supabase/migrations/` and 3 files in
   `packages/database/supabase/migrations/`. The Supabase CLI `db push` only reads from
   `supabase/migrations/`, so the secondary location is invisible to the promotion workflow.
2. **Single environment:** Only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` exist. No concept of dev vs prod targeting.
3. **No data sync:** Testing against realistic data requires using production directly.

### Architecture

#### Migration Consolidation

All SQL migrations MUST live in `supabase/migrations/` (the Supabase CLI default). The
secondary location `packages/database/supabase/` will be removed entirely.

**Files to move** (preserving timestamps for ordering):
- `packages/database/supabase/migrations/20260127160000_add_admin_crud_policies.sql`
- `packages/database/supabase/migrations/20260128000000_add_admin_products_policies.sql`
- `packages/database/supabase/migrations/20260204120000_add_user_profiles.sql`

After consolidation, the full ordered set in `supabase/migrations/` will be:
1. `20260119124600_init_core.sql`
2. `20260122150000_seed_velhon_torni.sql`
3. `20260127160000_add_admin_crud_policies.sql` *(moved)*
4. `20260128000000_add_admin_products_policies.sql` *(moved)*
5. `20260129141000_product_references.sql`
6. `20260130132000_semantic_labels.sql`
7. `20260130142000_semantic_labels_admin_policies.sql`
8. `20260130150000_unique_wikidata_id.sql`
9. `20260130213000_fix_product_references_rls.sql`
10. `20260131171500_multiple_isbns.sql`
11. `20260204120000_add_user_profiles.sql` *(moved)*

#### Environment Variable Convention

Production variables keep their existing names (no rename — avoids breaking deployed config).
Dev variables are prefixed with `DEV_`. New direct DB URLs are added for both.

| Variable | Purpose | Used By |
|----------|---------|---------|
| `SUPABASE_URL` | Prod API URL | App runtime (existing) |
| `SUPABASE_ANON_KEY` | Prod anon key | App runtime (existing) |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod service role | Admin scripts (existing) |
| `PROD_SUPABASE_DB_URL` | Prod direct Postgres | Migration push, data export |
| `DEV_SUPABASE_URL` | Dev API URL | Dev app runtime |
| `DEV_SUPABASE_ANON_KEY` | Dev anon key | Dev app runtime |
| `DEV_SUPABASE_SERVICE_ROLE_KEY` | Dev service role | Dev admin scripts |
| `DEV_SUPABASE_DB_URL` | Dev direct Postgres | Migration push, data import |

#### npm Scripts

Added to root `package.json`. **Dev is the default target** — unqualified commands hit dev,
prod requires explicit `:prod` suffix.

| Script | Command | Purpose |
|--------|---------|---------|
| `db:push` | `supabase db push --linked` | Push migrations to dev (linked project) |
| `db:push:prod` | Link to prod, push, re-link to dev | Push migrations to prod (explicit) |
| `db:sync` | `tsx scripts/sync-dev-data.ts` | Reset dev with prod data |

#### Supabase CLI Linking

The local Supabase CLI project MUST be linked to the **dev** project
(`supabase link --project-ref bgoyrhohrldoedgqdcvm`). This ensures all unqualified CLI
commands (e.g. `supabase db push`, `supabase inspect`) target dev by default. The
`db:push:prod` script temporarily re-links to prod, pushes, then re-links back to dev.

#### Data Sync Script (`scripts/sync-dev-data.ts`)

**Purpose:** Export public schema data from prod and import into dev, replacing existing data.

**Tables synced** (public schema content tables only):
- `publishers`
- `creators`
- `products`
- `products_creators`
- `product_references`
- `semantic_labels`
- `product_semantic_labels`
- `product_isbns`
- `profiles`

**Approach:**
1. Connect to prod via `PROD_SUPABASE_DB_URL` (read-only queries)
2. Connect to dev via `DEV_SUPABASE_DB_URL`
3. For each table, in dependency order:
   a. `SELECT *` from prod
   b. `TRUNCATE ... CASCADE` on dev
   c. `INSERT` rows into dev
4. Auth users (`auth.users`) are NOT synced — each environment maintains its own auth state

**Safety:**
- Script MUST refuse to run if `DEV_SUPABASE_DB_URL` matches `PROD_SUPABASE_DB_URL`
  (prevent accidental prod truncation)
- Script MUST prompt for confirmation before truncating dev tables (or accept `--yes` flag)
- Use a single transaction for the dev truncate+insert to ensure atomicity

### Anti-Patterns

- **NEVER** store direct Postgres connection strings in client-accessible code or bundles.
  These are server-side script variables only.
- **NEVER** sync `auth.users` between environments. Auth state must stay isolated.
- **NEVER** run `db:push:prod` without first validating on dev. The dev-first workflow is the
  entire point of this setup.
- **NEVER** hardcode project refs or connection strings in scripts. Always read from env vars.
- **NEVER** put seed data migrations (like `seed_velhon_torni`) in the promotion path if they
  contain environment-specific data. (Current seed migration is fine as it seeds reference data.)

---

## 2. Contract (Quality)

### Definition of Done

- [x] All 11 migrations consolidated in `supabase/migrations/` in correct timestamp order
- [x] `packages/database/supabase/` directory removed entirely
- [x] `.env.example` updated with all 8 variables and descriptive comments
- [x] `pnpm db:push` successfully pushes migrations to dev Supabase (default target)
- [x] `pnpm db:push:prod` successfully pushes migrations to prod Supabase
- [x] `pnpm db:sync` resets dev public schema data from prod
- [x] Sync script includes safety check preventing prod self-truncation
- [x] Dev Supabase Cloud project created and linked via CLI
- [x] `docs/supabase-environments.md` written covering setup, workflow, and sync
- [ ] Local `supabase start` still works with consolidated migrations
- [ ] Existing E2E tests still pass (no regression from env var changes)

### Regression Guardrails

- **Local dev must not break:** `supabase start` + `supabase db reset` must work identically
  after migration consolidation.
- **Prod app must not break:** Existing `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` keep their names. No rename required for deployed config.
- **Migration ordering:** Timestamp-based ordering must be preserved. Moved files must not
  create ordering conflicts with existing files.
- **Data integrity:** Sync script must use transactions so dev is never left in a
  partially-truncated state.

### Scenarios (Gherkin)

**Scenario: Migration consolidation is complete**
- Given: All migrations have been moved to `supabase/migrations/`
- When: I run `supabase db reset` locally
- Then: All 11 migrations apply successfully in timestamp order
- And: The local database matches the expected schema

**Scenario: Push migrations to dev (default)**
- Given: `DEV_SUPABASE_DB_URL` is configured
- When: I run `pnpm db:push`
- Then: Pending migrations are applied to the dev Supabase instance
- And: No errors are reported

**Scenario: Push migrations to prod**
- Given: `PROD_SUPABASE_DB_URL` is configured
- When: I run `pnpm db:push:prod`
- Then: Pending migrations are applied to the prod Supabase instance

**Scenario: Sync prod data to dev**
- Given: Both `PROD_SUPABASE_DB_URL` and `DEV_SUPABASE_DB_URL` are configured
- When: I run `pnpm db:sync --yes`
- Then: All public schema content tables are truncated in dev
- And: Current prod data is inserted into dev
- And: Auth users in dev are untouched

**Scenario: Sync script safety — same URL rejection**
- Given: `DEV_SUPABASE_DB_URL` equals `PROD_SUPABASE_DB_URL`
- When: I run `pnpm db:sync`
- Then: The script exits with an error message
- And: No data is modified

**Scenario: Sync script safety — interactive confirmation**
- Given: Both URLs are configured and different
- When: I run `pnpm db:sync` without `--yes`
- Then: The script prompts for confirmation before proceeding
- And: Answering "no" aborts without changes
