# Spec: Testing Strategy

## 1. Blueprint (Design)

### Context
> **Goal:** Ensure the application is reliably testable across all layers with a focus on E2E stability and developer experience.
> **Why:** Current E2E tests for authentication bypass the UI, leaving critical user flows (loading, errors, redirects) untested.
> **Architectural Impact:** Defines standard patterns for mocking, local infrastructure (Supabase), and data seeding.

### E2E Testing Strategy

#### Layer 1: UI-Only Mocking (Playwright) — ROO-64

For testing **client-side** UI components (forms, loading states, error handling) in isolation without backend side-effects.

- **Tool:** Playwright `page.route`
- **Pattern:** Intercept outgoing requests to Supabase Auth (`**/auth/v1/**`) or internal API routes.
- **Use Case:** Verify error messages, loading spinners, and network timeout behavior in Svelte islands.

##### SSR Limitation (Critical)

Astro SSR executes data fetches and auth checks **server-side** in `.astro` frontmatter. Playwright's `page.route()` only intercepts requests made by the **browser** (client-side JavaScript). This means:

| Flow | Where it runs | Mockable via `page.route`? |
|------|---------------|---------------------------|
| Google OAuth button (`signInWithOAuth`) | Client (Svelte island) | **Yes** |
| Magic Link form submission | Server (Astro POST handler) | **No** |
| Middleware auth redirect (`/tili` → `/kirjaudu`) | Server (Astro middleware) | **No** |
| Account page profile fetch | Server (Astro frontmatter) | **No** |
| Client-side logout (`/logout` navigation) | Server (API route) | **No** |

**Consequence:** Layer 1 mocks are suitable for testing **Svelte island interactions only**. Server-side auth flows require Layer 2 (local Supabase) or Layer 3 (session injection).

##### Mock Helper API Contract

New helpers added to `apps/main-site/tests/e2e/test-utils.ts`:

```typescript
/**
 * Intercepts Supabase Auth API requests and returns mock responses.
 * Only effective for client-side requests (Svelte islands).
 */
export async function mockSupabaseAuth(
  page: Page,
  scenario: MockAuthScenario
): Promise<void>;

type MockAuthScenario =
  | { type: 'oauth-success' }
  | { type: 'oauth-error'; message?: string }
  | { type: 'otp-success' }
  | { type: 'otp-error'; code?: number; message?: string }
  | { type: 'rate-limit' }
  | { type: 'network-error' };
```

**Intercept patterns:**
- `**/authorize**` — OAuth navigation (Google). `signInWithOAuth` does NOT make a `fetch` — it builds a URL and calls `window.location.assign()`. Playwright's `page.route()` intercepts the resulting navigation.
- `**/auth/v1/otp**` — Magic link request (client-side only)
- `**/auth/v1/**` — Catch-all for rate-limit and network-error scenarios

**OAuth mocking strategy:** Since `signInWithOAuth` always returns `{ data: { provider, url }, error: null }` and redirects the browser, OAuth errors are simulated by intercepting the authorize navigation and meta-refreshing back to `/kirjaudu?error=auth_callback_failed` (using the referer header to derive the app origin). OAuth success is simulated by fulfilling the route with a static HTML page.

**Response shapes must match** Supabase's real API responses for fetch-based scenarios (OTP, rate-limit). Reference: `@supabase/supabase-js` error types.

#### Layer 2: Full Integration (Local Infrastructure) — ROO-65

For testing the complete flow, including backend side-effects like email sending and database triggers.

- **Infrastructure:** Local Supabase (via `supabase start`)
- **Email Testing:** Use **Inbucket** (bundled with local Supabase) to intercept magic link emails programmatically.
- **Benefit:** Fast, deterministic, and works offline without hitting production rate limits.

#### Layer 3: Programmatic Session Injection (Existing)

For tests that focus on features *after* authentication (e.g., "Can an admin delete a product?").

- **Tool:** `test-utils.ts` → `createAdminSession`, `createTestUser`, `loginAsTestUser`
- **Use Case:** Skip the login ceremony to save time in non-auth related tests.

### Data Seeding Strategy — ROO-66

#### Problem Statement
Current E2E tests hardcode `vitkukissa@gmail.com` (a personal email) across 8+ test files. This couples tests to a specific developer account, makes onboarding harder, and prevents deterministic test runs.

#### Standard Test Users
Define two canonical test users used by all E2E tests:

| Role | Email | Password | `app_metadata.role` |
|------|-------|----------|---------------------|
| Admin | `admin@roolipeli.info` | `$TEST_USER_PASSWORD` | `admin` |
| Regular | `user@roolipeli.info` | `$TEST_USER_PASSWORD` | (none) |

Password is read from `TEST_USER_PASSWORD` env var (never hardcoded in code).

#### Environment Variables
Add to `.env.example`:
```
TEST_ADMIN_EMAIL=admin@roolipeli.info
TEST_USER_EMAIL=user@roolipeli.info
TEST_USER_PASSWORD=your_test_password_here
```

Test utilities read these with fallback defaults:
```typescript
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@roolipeli.info';
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'user@roolipeli.info';
```

#### Seed File: `supabase/seed.sql`
A seed SQL file that creates the standard test users via Supabase's `auth.users` table. This file:
- Runs on `supabase db reset` (local development, ROO-65)
- Serves as documentation of expected test state for cloud dev environments
- Uses `ON CONFLICT DO NOTHING` to be idempotent

```sql
-- Standard test users for E2E tests
-- Passwords are set programmatically by test-utils.ts via service role
INSERT INTO auth.users (id, email, email_confirmed_at, raw_app_meta_data)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@roolipeli.info', now(), '{"role": "admin"}'),
  ('00000000-0000-0000-0000-000000000002', 'user@roolipeli.info', now(), '{}')
ON CONFLICT (id) DO NOTHING;
```

> **Note:** For cloud dev Supabase (current setup), `createAdminSession` already handles user creation/update via service role. The seed file is forward-compatible with local Supabase (ROO-65).

#### Test File Migration
All E2E test files must be refactored to use the standardized constants:

| File | Current email | New pattern |
|------|---------------|-------------|
| `admin-auth.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |
| `admin-crud.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |
| `admin-cover-upload.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |
| `admin-layout.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |
| `admin-nav-link.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |
| `multiple-isbns.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |
| `product-references.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |
| `semantic-labels.spec.ts` | `vitkukissa@gmail.com` | `ADMIN_EMAIL` constant from test-utils |

#### test-utils.ts Changes
- Export `ADMIN_EMAIL` and `USER_EMAIL` constants
- `createAdminSession()` signature changes to use default: `createAdminSession(email = ADMIN_EMAIL)`
- `createTestUser()` uses `USER_EMAIL` by default

#### State Isolation
Every E2E test suite that modifies data MUST satisfy all three resilience patterns:
1. **Guaranteed Cleanup** (Pattern 1): `afterAll`/`afterEach` with service-role client.
2. **Explicit Waits** (Pattern 2): `waitFor` before all dynamic UI interactions.
3. **Unique Identifiers** (Pattern 3): Test-scoped IDs with `[TEST]` prefix.

### E2E Resilience Patterns — ROO-89

#### Problem Statement
E2E tests pass in isolation but fail intermittently under parallel execution due to:
orphaned test data from mid-test failures, missing waits on UI transitions, and
shared-entity contention between workers.

#### Pattern 1: Guaranteed Cleanup via Lifecycle Hooks

All E2E test suites that create, modify, or delete database records MUST use
`afterAll` (or `afterEach`) hooks for cleanup — never inline cleanup at the
end of the test function body.

**Why:** If a test assertion fails mid-test, inline cleanup code never executes,
leaving orphaned records that cause `unique constraint` violations on subsequent runs.

**Reference Implementation:** `admin-cover-upload.spec.ts` (lines 224-235) — uses
`test.afterAll` with service-role client to clean up Storage files and DB records
regardless of test outcome.

**Required Pattern:**
```typescript
test.describe('Feature CRUD', () => {
  const cleanupIds: string[] = [];

  test.afterAll(async () => {
    const supabase = createServiceRoleClient();
    for (const id of cleanupIds) {
      await supabase.from('entity').delete().eq('id', id);
    }
  });

  test('creates entity', async ({ page }) => {
    // ... create entity, capture ID
    cleanupIds.push(createdId);
    // ... assertions (safe to fail — afterAll still runs)
  });
});
```

**Anti-Pattern:**
```typescript
// ❌ Inline cleanup — skipped if test fails before this line
test('creates entity', async ({ page }) => {
  // ... create entity
  // ... assertions (if this fails, cleanup below never runs)
  await supabase.from('entity').delete().eq('id', id); // UNREACHABLE on failure
});
```

#### Pattern 2: Explicit Waits on UI Transitions

All interactions with dynamically-revealed UI elements (modals, dropdowns, toast
notifications) MUST include an explicit `waitFor` or visibility assertion BEFORE
the interaction.

**Why:** Delete confirmation modals, combobox dropdowns, and form transitions
have CSS animations or async rendering. Clicking before visibility causes
"element not found" flakes.

**Required Pattern:**
```typescript
// ✅ Wait for modal before clicking confirmation
await page.locator('.btn-delete').click();
await page.locator('.modal').waitFor({ state: 'visible' });
await page.locator('.modal .btn-confirm').click();
```

**Anti-Pattern:**
```typescript
// ❌ No wait — modal may not be visible yet
await page.locator('.btn-delete').click();
await page.locator('.modal .btn-confirm').click(); // FLAKY
```

#### Pattern 3: Test-Scoped Unique Identifiers

All test-created entities MUST use a unique, test-scoped identifier to prevent
slug/name collisions between parallel workers and across retries.

**Why:** Two workers running the same test create entities with the same name,
causing `duplicate key` violations on unique columns (e.g., `products.slug`).

**Required Pattern:**
```typescript
const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const productName = `[TEST] Product ${testId}`;
const productSlug = `test-product-${testId}`;
```

**Rationale for `[TEST]` prefix:** Makes test data visually distinguishable in
the admin UI, and enables bulk cleanup queries:
`DELETE FROM products WHERE name LIKE '[TEST]%'`.

**Anti-Pattern:**
```typescript
// ❌ Deterministic name — collides across parallel workers
const productName = 'Test Product';
```

### Unit Testing Strategy — ROO-92

#### Layer 0: Unit Tests (Vitest)

For testing **isolated logic** — pure functions, Zod schema validation, utility
helpers — without any browser or network dependencies.

- **Tool:** Vitest (`pnpm test:unit` → `vitest run`)
- **Pattern:** Co-located test files (`*.test.ts` or `__tests__/*.test.ts` alongside source)
- **Scope:** Packages with pure logic (`packages/database`, `packages/logger`), shared utilities, and SEO schema builders

#### Vitest Configuration

Root `vitest.config.ts` applies workspace-wide:
- `globals: true` — `describe`, `it`, `expect` available without imports
- `environment: 'node'` — no browser globals
- E2E tests excluded via `exclude: ['**/tests/e2e/**']`

Individual packages (`packages/database`, `packages/logger`) have their own `vitest.config.ts` that inherit root settings.

#### File Placement Standard

| Location | Pattern | When |
|----------|---------|------|
| `packages/*/tests/*.test.ts` | Adjacent `tests/` folder | Packages with multiple test files |
| `packages/*/__tests__/*.test.ts` | `__tests__/` folder | Logger-style packages |
| `apps/main-site/src/**/*.test.ts` | Co-located with source | App-level utilities and SEO schemas |

#### Coverage Targets

| Package / File | What to Test | Priority |
|----------------|-------------|----------|
| `packages/database/src/schemas/core.ts` | Zod schema validation (valid, invalid, edge cases per schema) | High |
| `packages/database/src/queries.ts` | Query function signatures (mock Supabase chain, verify table/columns/filters/ordering) | High |
| `packages/logger/src/logger.ts` | Environment-aware suppression (`DEV=true` vs `DEV=false`) | High |
| `apps/main-site/src/lib/slug.client.ts` | `generateSlug` with Unicode, diacritics, Finnish chars (ä→a, ö→o, å→a), consecutive special chars, empty string | High |
| `apps/main-site/src/i18n/utils.ts` | `useTranslations` fallback behavior, `getLangFromUrl` with various URL patterns and all three locales | Medium |
| `apps/main-site/src/components/seo/schemas/product.ts` | `buildProductSchema`, `sanitizeIsbn`, `normalizeDescription` with complete and partial/missing relations | Medium |

#### Mock Patterns

**Supabase client mock** (for query tests):
```typescript
const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({ select: mockSelect }));
const mockClient = { from: mockFrom } as unknown as DatabaseClient;
// Verify: expect(mockFrom).toHaveBeenCalledWith('publishers')
```

**Environment mock** (for logger tests):
```typescript
// Use vi.resetModules() + dynamic import to re-evaluate module with new env
vi.resetModules();
import.meta.env.DEV = false;
const { logInfo } = await import('../src/logger');
```

### Anti-Patterns (Unit)

- **NEVER** use `import.meta.env` mutations without `vi.resetModules()` — modules cache env values at import time
- **NEVER** write unit tests that make real network calls — mock all Supabase clients with `vi.fn()`
- **NEVER** test implementation details of generated types (`supabase.ts`) — only test hand-written schemas and utilities
- **NEVER** duplicate E2E scenarios as unit tests — unit tests cover edge cases and invalid inputs; E2E covers user flows

### Anti-Patterns (E2E)

- **NEVER** use `page.route()` to mock requests that happen in Astro SSR frontmatter or middleware — the mock will silently not apply, giving false-passing tests.
- **NEVER** hardcode bearer tokens or JWTs in mocks — use realistic response shapes from Supabase's API so that client-side SDK parsing works correctly.
- **NEVER** mix Layer 1 (mocked backend) and Layer 2 (real local backend) assertions in the same test — this causes flaky tests where mocks shadow real responses unpredictably.
- **NEVER** rely on mock tests as proof that SSR auth flows work — those flows must be covered by Layer 2 or Layer 3 tests.
- **NEVER** place cleanup code inline at the end of a test body — use `afterAll`/`afterEach` hooks instead (ROO-89: orphaned data from mid-test failures).
- **NEVER** click dynamically-revealed elements (modals, dropdowns) without an explicit `waitFor({ state: 'visible' })` — implicit waits are not sufficient under CI load (ROO-89: timing flakes).
- **NEVER** use deterministic entity names/slugs without a unique suffix — parallel workers will collide on unique constraints (ROO-89: slug contention).

---

## 2. Contract (Quality)

### Definition of Done

**Layer 1 — UI-Only Mocking (ROO-64):**
- [ ] `mockSupabaseAuth` helper in `tests/e2e/test-utils.ts` with typed scenario variants
- [ ] Intercepts `**/auth/v1/**` patterns for client-side requests
- [ ] Response shapes match real Supabase API responses
- [ ] Example test: Google OAuth button shows error when `signInWithOAuth` fails (mocked)
- [ ] Example test: Google OAuth button enters loading state on click (mocked)
- [ ] JSDoc documentation on all new helpers

**Layer 2 — Local Infrastructure (ROO-65):**
- [ ] Local Supabase setup documented in `README.md`
- [ ] Inbucket integration helper for magic link retrieval created
- [ ] Example test: Full magic link flow (email → Inbucket → callback → session)

**Layer 3 — Seed Data (ROO-66):**
- [ ] `supabase/seed.sql` created with standard test users (idempotent)
- [ ] `TEST_ADMIN_EMAIL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD` documented in `.env.example`
- [ ] `test-utils.ts` exports `ADMIN_EMAIL` and `USER_EMAIL` constants with env var fallbacks
- [ ] `createAdminSession()` defaults to `ADMIN_EMAIL` (no required argument)
- [ ] `createTestUser()` defaults to `USER_EMAIL`
- [ ] All 8 test files refactored from `vitkukissa@gmail.com` to use `ADMIN_EMAIL` from test-utils
- [ ] All existing E2E tests pass with the standardized emails

**Unit Testing — ROO-92:**
- [ ] Vitest config present in root, `packages/database`, and `packages/logger`
- [ ] `packages/database`: Zod schema tests cover happy path + at least 3 invalid/edge cases per schema
- [ ] `packages/database`: Query tests mock the Supabase client and verify table name, select fields, and ordering
- [ ] `packages/logger`: Tests verify `logInfo`/`logDebug` are suppressed when `DEV=false`
- [ ] `apps/main-site`: `generateSlug` tested with Finnish characters (ä, ö, å), diacritics, consecutive special chars, and empty string
- [ ] `apps/main-site`: `useTranslations` tested for missing-key fallback and all three locales (fi/sv/en)
- [ ] `apps/main-site`: `buildProductSchema` tested with complete and partial (missing creators, ISBNs) product data
- [ ] `pnpm test:unit` reports >0 test files found and all pass
- [ ] Unit test suite completes in <30s (no network calls)

**E2E Resilience — ROO-89:**
- [ ] `product-references.spec.ts` uses `afterAll` cleanup hook (not inline)
- [ ] `admin-crud.spec.ts` uses `afterAll` cleanup hooks for all 3 CRUD tests
- [ ] `admin-crud.spec.ts` delete confirmation waits for `.modal` visibility before clicking confirm
- [ ] All affected tests use `Date.now()` + random suffix for entity uniqueness
- [ ] `admin-cover-upload.spec.ts` timing-sensitive interactions have explicit waits
- [ ] Full suite passes 3 consecutive runs without flakes (`npx playwright test --repeat-each=3`)

### Regression Guardrails

- **Invariant:** `pnpm test:unit` must always find test files — "No test files found" is a CI failure.
- **Invariant:** Unit tests must complete without network access — any test requiring real Supabase is an E2E test, not a unit test.
- **Invariant:** `generateSlug('ääkköset')` → `'aakkoset'` (Finnish diacritics regression guard).
- **Invariant:** Existing E2E tests (`admin-auth`, `tili`, `kirjaudu`, `admin-crud`) must continue passing after mock utilities are added.
- **Invariant:** `test-utils.ts` helpers must remain concurrency-safe (no shared mutable state between tests).
- **Invariant:** Mock responses must not leak into non-mocked tests (each test must set up its own routes).
- **Invariant:** All test suites that create DB records must use `afterAll`/`afterEach` cleanup hooks — inline cleanup is prohibited (ROO-89).
- **Invariant:** No E2E test may click a dynamically-revealed element without a preceding `waitFor({ state: 'visible' })` (ROO-89).

### Scenarios (Gherkin)

**Scenario: Zod schema rejects invalid product type (ROO-92)**
- Given: `ProductSchema` is imported from `@roolipeli/database`
- When: Validated with `{ product_type: 'invalid-type', ...otherRequiredFields }`
- Then: `safeParse` returns `{ success: false }`
- And: The error path includes `product_type`

**Scenario: generateSlug handles Finnish characters (ROO-92)**
- Given: The `generateSlug` utility from `apps/main-site/src/lib/slug.client.ts`
- When: Called with `"Pelikirja ääkköset åhå"`
- Then: Returns `"pelikirja-aakkoset-aha"`

**Scenario: logInfo suppressed in production (ROO-92)**
- Given: `import.meta.env.DEV` is `false`
- When: `logInfo('message')` is called
- Then: `console.info` is NOT called

**Scenario: useTranslations falls back for missing locale key (ROO-92)**
- Given: A translation key exists in Finnish (`fi`) but not in Swedish (`sv`)
- When: `useTranslations('sv')` is called and returns a function `t`
- Then: `t('missing.key')` returns the Finnish string (not `undefined`)

**Scenario: Mock — Google OAuth button shows error on failure (ROO-64)**
- Given: Developer writes an E2E test using `mockSupabaseAuth(page, { type: 'oauth-error' })`
- When: Test clicks the Google login button on `/kirjaudu`
- Then: The Google button's error alert is visible with the localized error message
- And: The button is re-enabled for retry

**Scenario: Mock — Google OAuth button enters loading state (ROO-64)**
- Given: Developer writes an E2E test using `mockSupabaseAuth(page, { type: 'oauth-success' })`
- When: Test clicks the Google login button on `/kirjaudu`
- Then: The button is disabled during the request

**Scenario: Mock — Magic Link form shows rate limit error (ROO-64)**
- Given: Developer writes an E2E test that intercepts the OTP endpoint with `{ type: 'rate-limit' }`
- When: Test submits the email form on `/kirjaudu`
- Then: **This mock does NOT apply** because form submission is SSR
- And: Test must use Layer 2 or a different approach for this scenario

**Scenario: Mock utilities do not interfere with unrelated tests (ROO-64)**
- Given: A test file uses `mockSupabaseAuth` in one test
- And: The next test in the same file does NOT call `mockSupabaseAuth`
- When: The next test runs
- Then: No route interceptions are active (Playwright isolates per-test by default)

**Scenario: Admin session uses standardized email by default (ROO-66)**
- Given: `TEST_ADMIN_EMAIL` is set to `admin@roolipeli.info` in `.env`
- When: A test calls `createAdminSession()` without arguments
- Then: Session is created for `admin@roolipeli.info`
- And: The session has `app_metadata.role = 'admin'`

**Scenario: Regular user session uses standardized email by default (ROO-66)**
- Given: `TEST_USER_EMAIL` is set to `user@roolipeli.info` in `.env`
- When: A test calls `createTestUser()` without arguments
- Then: Session is created for `user@roolipeli.info`
- And: The session does NOT have `app_metadata.role = 'admin'`

**Scenario: No personal emails in test files (ROO-66)**
- Given: All test files have been refactored
- When: Searching codebase for `vitkukissa@gmail.com` in `tests/e2e/`
- Then: Zero matches found
- And: All tests use `ADMIN_EMAIL` or `USER_EMAIL` from test-utils

**Scenario: Tests work with custom email override (ROO-66)**
- Given: A developer sets `TEST_ADMIN_EMAIL=custom@example.com` in `.env`
- When: Tests run
- Then: `createAdminSession()` uses `custom@example.com` instead of the default

**Scenario: Cleanup runs even when test assertions fail (ROO-89)**
- Given: A test creates a product with slug `test-product-{timestamp}`
- And: The test assertion fails mid-test
- When: The test suite completes
- Then: The `afterAll` hook deletes the product from the database
- And: Re-running the suite does not hit a `unique constraint` violation

**Scenario: Delete modal is waited for before confirmation (ROO-89)**
- Given: An admin is on a product edit page
- When: The delete button is clicked
- Then: The test waits for `.modal` to have `state: 'visible'`
- And: Only then clicks the confirmation button
- And: The deletion completes without "element not found" errors

**Scenario: Parallel workers don't collide on entity names (ROO-89)**
- Given: Two Playwright workers run CRUD tests simultaneously
- When: Both create products with `[TEST] Product {unique-id}` names
- Then: No `duplicate key` violations occur
- And: Each worker's `afterAll` cleans up only its own entities

---

## 3. Related Specs
- `specs/auth/spec.md`
- `specs/admin-ui/spec.md`

---
**Spec Status:** Live
**Created:** 2026-02-06
**Updated:** 2026-02-21 (ROO-92: added Unit Testing Strategy — Layer 0 Vitest, coverage targets, mock patterns, anti-patterns, DoD, guardrails, scenarios)
**Previous:** 2026-02-18 (ROO-89: added E2E resilience patterns — cleanup hooks, explicit waits, unique identifiers)
**Owner:** @Architect
