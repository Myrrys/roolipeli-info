# Supabase Environments

## Architecture

The project uses two Supabase Cloud instances:

| Environment | Purpose | Default target |
|-------------|---------|---------------|
| **Dev** (`bgoyrhohrldoedgqdcvm`) | Validate migrations, test with realistic data | Yes (unqualified commands) |
| **Prod** | Live application data | Explicit `:prod` suffix required |

Local development via `supabase start` remains unchanged.

## Environment Variables

Add these to your `.env` (see `.env.example` for the template):

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Prod API URL (existing, app runtime) |
| `SUPABASE_ANON_KEY` | Prod anon key (existing, app runtime) |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod service role (existing, admin scripts) |
| `PROD_SUPABASE_DB_URL` | Prod direct Postgres (data export for sync script) |
| `DEV_SUPABASE_URL` | Dev API URL |
| `DEV_SUPABASE_ANON_KEY` | Dev anon key |
| `DEV_SUPABASE_SERVICE_ROLE_KEY` | Dev service role |
| `DEV_SUPABASE_DB_URL` | Dev direct Postgres (data import for sync script) |

The direct Postgres URLs (`*_DB_URL`) are only needed for the `db:sync` data sync script. Migration push uses Supabase CLI project linking instead.

Direct Postgres URLs use the format:
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Find these in your Supabase dashboard under **Project Settings > Database > Connection string > URI**.

## Migration Workflow

All migrations live in `supabase/migrations/`. The Supabase CLI is linked to the dev project by default.

### Dev-first promotion

1. **Write migration** — create a new file in `supabase/migrations/`
2. **Test locally** — `supabase db reset` applies all migrations to local
3. **Push to dev** — `pnpm db:push` applies pending migrations to dev cloud
4. **Validate** — verify dev instance works correctly
5. **Push to prod** — `pnpm db:push:prod` promotes to production

### Commands

| Command | Target | Purpose |
|---------|--------|---------|
| `supabase db reset` | Local | Reset local DB with all migrations |
| `pnpm db:push` | Dev | Push pending migrations to dev |
| `pnpm db:push:prod` | Prod | Push pending migrations to prod |

## Data Sync

Reset the dev database with current production data:

```sh
# Interactive (prompts for confirmation)
pnpm db:sync

# Non-interactive (for scripts)
pnpm db:sync --yes
```

### What gets synced

All public schema content tables: `publishers`, `creators`, `semantic_labels`, `products`, `products_creators`, `product_references`, `product_semantic_labels`, `product_isbns`, `profiles`.

### What does NOT get synced

- `auth.users` — each environment maintains its own auth state
- Storage buckets
- Edge functions

### Safety

- The script refuses to run if `DEV_SUPABASE_DB_URL` matches `PROD_SUPABASE_DB_URL`
- Without `--yes`, interactive confirmation is required before truncating
- Dev truncate + insert runs in a single transaction (atomic — no partial state)
