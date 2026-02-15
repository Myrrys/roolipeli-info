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
Every E2E test suite that modifies data should:
1. Use a unique prefix for created entities (e.g., `[TEST] My Product`).
2. Clean up created entities in `afterAll` or use a fresh database branch.

### Anti-Patterns

- **NEVER** use `page.route()` to mock requests that happen in Astro SSR frontmatter or middleware — the mock will silently not apply, giving false-passing tests.
- **NEVER** hardcode bearer tokens or JWTs in mocks — use realistic response shapes from Supabase's API so that client-side SDK parsing works correctly.
- **NEVER** mix Layer 1 (mocked backend) and Layer 2 (real local backend) assertions in the same test — this causes flaky tests where mocks shadow real responses unpredictably.
- **NEVER** rely on mock tests as proof that SSR auth flows work — those flows must be covered by Layer 2 or Layer 3 tests.

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

### Regression Guardrails

- **Invariant:** Existing E2E tests (`admin-auth`, `tili`, `kirjaudu`, `admin-crud`) must continue passing after mock utilities are added.
- **Invariant:** `test-utils.ts` helpers must remain concurrency-safe (no shared mutable state between tests).
- **Invariant:** Mock responses must not leak into non-mocked tests (each test must set up its own routes).

### Scenarios (Gherkin)

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

---

## 3. Related Specs
- `specs/auth/spec.md`
- `specs/admin-ui/spec.md`

---
**Spec Status:** Live
**Created:** 2026-02-06
**Updated:** 2026-02-15 (ROO-66: added seed data architecture, test file migration plan, env var contract, Gherkin scenarios)
**Owner:** @Architect
