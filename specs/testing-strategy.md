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

#### Consistent Test Users
Maintain a set of "standard" test users in the local Supabase seed files:
- `admin@roolipeli.info` (password: `testpassword`)
- `user@roolipeli.info` (password: `testpassword`)

#### State Isolation
Every E2E test suite that modifies data should:
1. Use a unique prefix for created entities (e.g., `[TEST] My Product`).
2. Ideally, clean up created entities in `afterAll` or use a fresh database branch.

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
- [ ] Seed data scripts updated to include standard test users
- [ ] `createAdminSession` and `createTestUser` work against seeded users

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

---

## 3. Related Specs
- `specs/auth/spec.md`
- `specs/admin-ui/spec.md`

---
**Spec Status:** Live
**Created:** 2026-02-06
**Updated:** 2026-02-07 (ROO-64 implementation: updated intercept patterns to reflect actual OAuth navigation mocking strategy)
**Owner:** @Architect
