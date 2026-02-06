# Spec: Testing Strategy

## 1. Blueprint (Design)

### Context
> **Goal:** Ensure the application is reliably testable across all layers with a focus on E2E stability and developer experience.
> **Why:** Current E2E tests for authentication bypass the UI, leaving critical user flows (loading, errors, redirects) untested.
> **Architectural Impact:** Defines standard patterns for mocking, local infrastructure (Supabase), and data seeding.

### E2E Testing Strategy

#### Layer 1: UI-Only Mocking (Playwright)
For testing UI components (forms, loading states, error handling) in isolation without backend side-effects.

- **Tool:** Playwright `page.route`
- **Pattern:** Intercept outgoing requests to Supabase Auth (`**/auth/v1/**`) or internal API routes.
- **Use Case:** Verify "Invalid password" message, loading spinners, and network timeout behavior.

#### Layer 2: Full Integration (Local Infrastructure)
For testing the complete flow, including backend side-effects like email sending and database triggers.

- **Infrastructure:** Local Supabase (via `supabase start`)
- **Email Testing:** Use **Inbucket** (bundled with local Supabase) to intercept magic link emails programmatically.
- **Benefit:** Fast, deterministic, and works offline without hitting production rate limits.

#### Layer 3: Programmatic Session Injection (Existing)
For tests that focus on features *after* authentication (e.g., "Can an admin delete a product?").

- **Tool:** `test-utils.ts` -> `createAdminSession`
- **Use Case:** Skip the login ceremony to save time in non-auth related tests.

### Data Seeding Strategy

#### Consistent Test Users
Maintain a set of "standard" test users in the local Supabase seed files:
- `admin@roolipeli.info` (password: `testpassword`)
- `user@roolipeli.info` (password: `testpassword`)

#### State Isolation
Every E2E test suite that modifies data should:
1. Use a unique prefix for created entities (e.g., `[TEST] My Product`).
2. Ideally, clean up created entities in `afterAll` or use a fresh database branch.

---

## 2. Contract (Quality)

### Definition of Done
- [ ] E2E utilities for Supabase mocking implemented in `tests/e2e/test-utils.ts`.
- [ ] Local Supabase setup documented in `README.md`.
- [ ] Inbucket integration helper for magic link retrieval created.
- [ ] Seed data scripts updated to include standard test users.

---

## 3. Related Specs
- `specs/auth/spec.md`
- `specs/admin-ui/spec.md`

---
**Spec Status:** Live
**Created:** 2026-02-06
**Owner:** @Architect
