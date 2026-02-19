# Spec: Shared Logging Utility

## 1. Blueprint (Design)

### Context
> **Goal:** Provide a monorepo-wide logging utility that gates output by environment,
> enforcing CLAUDE.md §6.3 (no production console output of PII or raw objects).
> **Why:** Raw `console.*` calls in production violate information hygiene rules and
> leak debugging noise into production environments. A shared utility creates a
> consistent, enforceable pattern.
> **Architectural Impact:** New `packages/logger` package; all shared packages and
> app code should use it instead of raw `console.*`.

### Data Architecture
- **No schema changes.** This is a pure runtime utility.
- **No Zod validators needed.** No user input involved.

### Package Architecture

**Package:** `@roolipeli/logger`
**Location:** `packages/logger/`

#### Exports

| Function | Production | Development | Use Case |
|----------|-----------|-------------|----------|
| `logError(msg, ...args)` | Always | Always | Real errors that need visibility |
| `logWarn(msg, ...args)` | Always | Always | Potential problems |
| `logInfo(msg, ...args)` | Suppressed | Active | Informational output |
| `logDebug(msg, ...args)` | Suppressed | Active | Verbose debugging |

#### Environment Detection Strategy

Build-time gating using the existing Vite/Astro pattern with Node fallback:

```typescript
const isDev = import.meta.env?.DEV ?? (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production');
```

This is tree-shakeable in Vite builds: dead code for `logInfo`/`logDebug` is eliminated
in production bundles. The `process.env.NODE_ENV` fallback covers Node contexts (scripts, tests).

#### Package Structure
```
packages/logger/
├── package.json          # @roolipeli/logger, zero dependencies
├── src/
│   ├── index.ts          # Re-export
│   └── logger.ts         # Implementation
├── tsconfig.json
└── __tests__/
    └── logger.test.ts    # Vitest unit tests
```

### Migration Scope

#### In-scope (ROO-84) — Complete
- All `console.*` calls in `packages/` (verified: zero at time of implementation)
- The `@roolipeli/logger` package itself
- Biome `noConsole` guardrail blocking new violations at commit time

#### In-scope (ROO-91) — Complete
- All 37 `console.*` calls in `apps/main-site/src/` migrated (pages, components, API routes)
- `@roolipeli/logger` added as workspace dependency to `apps/main-site`
- 3 `<script define:vars>` blocks converted to module `<script>` + `data-entity-id` attributes

**Audit breakdown (37 calls migrated):**
- 23 DEV-wrapped diagnostic calls → `logDebug` (suppressed in production)
- 1 DEV-wrapped real error (account deletion) → `logError` (production-visible)
- 6 unwrapped admin page errors → `logError` (production-visible)
- 6 client-side form handler errors → `logError` (production-visible)
- 1 Svelte component error (DeleteConfirm) → `logError` (production-visible)
- All raw error objects sanitized to `.message` extraction

**Migration mapping (reference):**

| Current Pattern | Replacement | Rationale |
|-----------------|-------------|-----------|
| `console.error(msg, ...)` (unwrapped) | `logError(msg, ...)` | Real errors — keep prod visibility |
| `if (import.meta.env.DEV) console.error(...)` for real errors | `logError(msg, ...)` — remove `if` gate | logError always outputs |
| `if (import.meta.env.DEV) console.error(...)` for diagnostics | `logDebug(msg, ...)` — remove `if` gate | Suppress in prod |
| `console.warn(...)` | `logWarn(...)` | Direct mapping |
| `console.log(...)` / `console.info(...)` | `logInfo(...)` or `logDebug(...)` | Suppress in prod |

**Decision rule for DEV-wrapped `console.error`:** When migrating a call wrapped in
`if (import.meta.env.DEV)`, assess intent: if it indicates broken server state (failed
DB query, failed auth flow), use `logError`. If it's diagnostic noise (form validation
details, query-param debugging), use `logDebug`.

#### Out-of-scope
- `scripts/` — CLI tools use raw `console.*` per convention
- Test files (`*.spec.ts`, `*.test.ts`) — exempted by Biome override

### Anti-Patterns

- **NEVER** log PII (email, user IDs, tokens) via any log level — this is a §6.3 hard constraint
- **NEVER** import `@roolipeli/logger` in `scripts/` — CLI scripts use raw console
- **NEVER** add external dependencies to this package — pure wrapper only
- **NEVER** use `any` for the variadic args — type as `unknown[]`
- **NEVER** blindly replace all DEV-wrapped `console.error` with `logError` — assess whether it's a real error (needs prod visibility) or a debug diagnostic (should be suppressed via `logDebug`)
- **NEVER** pass raw Supabase/auth error objects to logger — extract `.message` only to avoid leaking internal details
- **DO NOT** create a singleton with mutable state — keep functions pure/stateless

---

## 2. Contract (Quality)

### Definition of Done

**Package — ROO-84 (Complete):**
- [x] `packages/logger/` exists with `@roolipeli/logger` as package name
- [x] Registered in pnpm workspace (already covered by `packages/*` glob)
- [x] Exports `logError`, `logWarn`, `logInfo`, `logDebug`
- [x] `logError`/`logWarn` always output regardless of environment
- [x] `logInfo`/`logDebug` are suppressed when `import.meta.env.DEV` is falsy
- [x] Zero external dependencies
- [x] Unit tests verify gating behavior (Vitest)
- [x] Existing `console.*` in `packages/` migrated (verified: zero)
- [x] Package compiles with `tsc --noEmit` (no `any`)
- [x] Passes `pnpm biome check`

**apps/main-site Migration — ROO-91 (Complete):**
- [x] `@roolipeli/logger` added as dependency in `apps/main-site/package.json`
- [x] Zero raw `console.*` calls remain in `apps/main-site/src/`
- [x] `pnpm biome check apps/main-site/` passes with no `noConsole` violations
- [x] `pnpm build` succeeds
- [x] Manual `if (import.meta.env.DEV)` wrappers removed where logger handles gating
- [x] Auth-related calls extract `.message` only (no raw error objects)
- [x] Spec updated: migration scope section reflects completion

### Regression Guardrails
- `logError` and `logWarn` must NEVER be silenced — production visibility is critical
- No `console.*` calls should exist directly in `packages/` after migration
- No `console.*` calls should exist directly in `apps/main-site/src/` after ROO-91 migration
- The package must remain zero-dependency
- Unwrapped `console.error` calls in admin pages must use `logError` (always visible in prod)
- DEV-wrapped diagnostic errors must use `logDebug` (suppressed in prod), not `logError`

### Scenarios (Gherkin)

**Scenario: Error logging always outputs**
- Given: The application runs in production mode (`import.meta.env.DEV` is `false`)
- When: Code calls `logError('Something failed', errorObj)`
- Then: The message is written to `console.error`

**Scenario: Warning logging always outputs**
- Given: The application runs in production mode
- When: Code calls `logWarn('Deprecation notice')`
- Then: The message is written to `console.warn`

**Scenario: Info logging suppressed in production**
- Given: The application runs in production mode
- When: Code calls `logInfo('Processing started')`
- Then: Nothing is written to the console

**Scenario: Debug logging suppressed in production**
- Given: The application runs in production mode
- When: Code calls `logDebug('Variable state:', data)`
- Then: Nothing is written to the console

**Scenario: All levels active in development**
- Given: The application runs in development mode (`import.meta.env.DEV` is `true`)
- When: Code calls `logInfo(...)` or `logDebug(...)`
- Then: The messages are written to their respective console methods

**Scenario: Package has zero dependencies**
- Given: The `packages/logger/package.json` is inspected
- When: Checking the `dependencies` field
- Then: It is empty or absent (devDependencies for testing are allowed)

**Scenario: DEV-wrapped diagnostic becomes logDebug (ROO-91)**
- Given: `pages/kirjaudu.astro` has `if (import.meta.env.DEV) console.error(err)`
- When: Migrated to `@roolipeli/logger`
- Then: The call becomes `logDebug('OTP error:', err.message)` with no manual gate
- And: Nothing is output in production

**Scenario: Unwrapped admin error becomes logError (ROO-91)**
- Given: `pages/admin/products/index.astro` has `console.error('Error:', err)`
- When: Migrated to `@roolipeli/logger`
- Then: The call becomes `logError('Error fetching products:', err.message)`
- And: The error is still visible in production

**Scenario: Biome guardrail catches regressions (ROO-91)**
- Given: The ROO-91 migration is complete
- When: A developer adds a raw `console.log()` in `apps/main-site/src/`
- Then: `pnpm biome check` fails with a `noConsole` violation
- And: The pre-commit hook blocks the commit

---

## 3. Related Specs
- `CLAUDE.md` §6.3 — Information Hygiene
- `specs/testing-strategy.md` — Test files exempted from noConsole

---
**Spec Status:** Live
**Created:** 2026-02-18 (ROO-84: package creation)
**Updated:** 2026-02-19 (ROO-91: apps/main-site migration complete, 37 calls migrated)
**Owner:** @Architect
