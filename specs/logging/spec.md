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

#### In-scope (ROO-84)
- All `console.*` calls in `packages/` (currently none — verify at implementation time)
- The `@roolipeli/logger` package itself

#### Out-of-scope (future work)
- `apps/main-site/` migration — larger effort, separate PBI
- `scripts/` — CLI tools should continue using raw `console.*`
- Biome lint rule to ban raw `console.*` in `packages/` and `apps/` — separate PBI

### Anti-Patterns

- **NEVER** log PII (email, user IDs, tokens) via any log level — this is a §6.3 hard constraint
- **NEVER** import `@roolipeli/logger` in `scripts/` — CLI scripts use raw console
- **NEVER** add external dependencies to this package — pure wrapper only
- **NEVER** use `any` for the variadic args — type as `unknown[]`
- **DO NOT** create a singleton with mutable state — keep functions pure/stateless

---

## 2. Contract (Quality)

### Definition of Done
- [ ] `packages/logger/` exists with `@roolipeli/logger` as package name
- [ ] Registered in pnpm workspace (already covered by `packages/*` glob)
- [ ] Exports `logError`, `logWarn`, `logInfo`, `logDebug`
- [ ] `logError`/`logWarn` always output regardless of environment
- [ ] `logInfo`/`logDebug` are suppressed when `import.meta.env.DEV` is falsy
- [ ] Zero external dependencies
- [ ] Unit tests verify gating behavior (Vitest)
- [ ] Existing `console.*` in `packages/` migrated (verify — currently zero)
- [ ] Package compiles with `tsc --noEmit` (no `any`)
- [ ] Passes `pnpm biome check`

### Regression Guardrails
- `logError` and `logWarn` must NEVER be silenced — production visibility is critical
- No `console.*` calls should exist directly in `packages/` after migration
- The package must remain zero-dependency

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
