# Project Scaffolding: Roolipeli.info (v2)

> **Mission:** Create the canonical, AI-first, multilingual (FI/SV/EN) knowledge base for Finnish RPG products.

**Architecture:** Monorepo (pnpm workspaces) following ASDLC.io factory principles.  
**Stack:** Astro (SSR), Svelte 5, Supabase, TypeScript, Biome, Lefthook, Vanilla CSS (Design Tokens), Zod, Vitest, Playwright.

**Sites:**
- Main: `roolipeli.info`
- Design System: `design-system.roolipeli.info`

---

## 1. Monorepo Structure (The Factory)

The project uses a strict workspace structure to separate concerns between the "Product" (apps) and the "Parts" (packages).

```
roolipeli-info/
├── apps/
│   ├── main-site/              # roolipeli.info (Astro SSR + Svelte)
│   └── design-system/          # design-system.roolipeli.info (Documentation Site)
├── packages/
│   ├── database/               # Supabase types, Zod Schemas & shared client logic
│   ├── design-system/          # PROTECTED: CSS Tokens & Shared Svelte components
│   └── config/                 # Shared TSConfigs
├── specs/                      # THE SPEC: Permanent Feature Definitions (State)
│   └── TEMPLATE.md             # Spec template for new features
├── plans/                      # THE PBI: Transient Execution Prompts (Delta)
│   └── TEMPLATE.md             # PBI template for tasks
├── .github/                    # CI Workflows
├── .lefthook/                  # Git hooks configuration
├── AGENTS.md                   # AI Agent Persona & SOPs (ASDLC)
├── ARCHITECTURE.md             # Cross-cutting system rules
├── biome.json                  # Linter/Formatter Configuration (No ESLint)
├── lefthook.yml                # Quality Gates & Drift Protection
├── pnpm-workspace.yaml         # Workspace definition
└── package.json                # Root scripts
```

---

## 2. Initialization Script (Agent Executable)

Execute this block to initialize the directory structure and core dependencies.

```bash
# 1. Initialize Root
mkdir roolipeli-info && cd roolipeli-info
pnpm init
git init

# 2. Create Workspace Structure
mkdir -p apps/main-site apps/design-system
mkdir -p packages/database packages/design-system packages/config
mkdir -p specs plans

# 3. Define Workspace
cat <<EOF > pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
EOF

# 4. Create AGENTS.md (populated below in Section 9)
touch AGENTS.md

# 5. Create symlink for Claude Code compatibility
ln -s AGENTS.md CLAUDE.md

# 6. Install Governance & Testing Tooling
pnpm add -D -w @biomejs/biome lefthook @commitlint/cli @commitlint/config-conventional typescript vitest

# 7. Initialize Apps (Astro)
cd apps/main-site
pnpm create astro@latest . --template minimal --install --no-git --typescript strict
pnpm astro add svelte node
pnpm add -D @playwright/test
cd ../..

cd apps/design-system
pnpm create astro@latest . --template minimal --install --no-git --typescript strict
pnpm astro add svelte
pnpm add -D @playwright/test
cd ../..

# 8. Initialize Database Package
cd packages/database
pnpm init
pnpm add zod
pnpm add -D typescript supabase vitest
cd ../..

# 9. Initialize Design System Package
cd packages/design-system
pnpm init
pnpm add svelte
cd ../..

# 10. Create template files
touch specs/TEMPLATE.md
touch plans/TEMPLATE.md
touch ARCHITECTURE.md
```

---

## 3. Governance & Quality Control

We enforce quality before the code enters the repository.

### 3.1 Biome Configuration (biome.json)

Unified formatter and linter. Replaces ESLint and Prettier entirely.

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { 
    "ignoreUnknown": true, 
    "ignore": ["dist", ".astro", "node_modules"] 
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single" } }
}
```

### 3.2 Lefthook Configuration (lefthook.yml)

Git hooks for linting, commit validation, and Design System Protection.

**Drift Protection:** The `guard-design-system` rule prevents accidental edits to the design package. Agents (and humans) must explicitly acknowledge they are editing core design files by setting `ALLOW_DS_EDIT=true`.

```yaml
pre-commit:
  parallel: true
  commands:
    biome-check:
      glob: "*.{js,ts,cjs,mjs,d.cts,d.mts,jsx,tsx,json,jsonc,svelte,astro}"
      run: pnpm biome check --write --no-errors-on-unmatched {staged_files} && git add {staged_files}
    
    guard-design-system:
      glob: "packages/design-system/**/*"
      run: |
        if [ "$ALLOW_DS_EDIT" != "true" ]; then
          echo "❌ DESIGN SYSTEM LOCKED: You are attempting to modify 'packages/design-system'."
          echo "To authorize this change, run: ALLOW_DS_EDIT=true git commit ..."
          exit 1
        fi
    
    type-check:
      glob: "*.{ts,tsx,svelte,astro}"
      run: pnpm tsc --noEmit
    
    test-unit:
      glob: "*.{ts,svelte}"
      run: pnpm vitest run

commit-msg:
  commands:
    commitlint:
      run: pnpm commitlint --edit {1}
```

### 3.3 Commitlint Config (commitlint.config.js)

```javascript
module.exports = { extends: ['@commitlint/config-conventional'] };
```

---

## 4. Packages (The Parts)

### 4.1 Database Package (packages/database)

Single Source of Truth for Data Types & Validation.

**Dependencies:** `pnpm add -D typescript supabase vitest && pnpm add zod`

**Purpose:** Exports generated TypeScript definitions from Supabase and Zod Schemas for runtime validation.

```typescript
// packages/database/src/index.ts
export type { Database } from './types/supabase';
export * from './schemas';

// packages/database/src/schemas/game.ts
import { z } from 'zod';

export const GameSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  title_fi: z.string().min(1),
  title_sv: z.string().optional(),
  title_en: z.string().optional(),
  description: z.string().optional(),
  published_date: z.string().date().optional(),
});

export type Game = z.infer<typeof GameSchema>;
```

**Package.json exports:**

```json
{
  "name": "@roolipeli/database",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

### 4.2 Design System Package (packages/design-system)

**PROTECTED:** Shared Design System components and CSS Tokens.

**Dependencies:** `pnpm add svelte`

**Purpose:** Hosts "dumb" components (Buttons, Cards) and the Design Tokens.

**Protection:** Guarded by Lefthook to prevent agent drift.

**Strategy:**
- Tokens: Defined in `src/styles/tokens.css` as CSS variables.
- Usage: Apps import `tokens.css` globally. Components use vanilla CSS (e.g., `var(--color-primary)`).

**Example:** `packages/design-system/src/styles/tokens.css`

```css
:root {
  /* Primitive Tokens */
  --color-blue-500: #3b82f6;
  --color-gray-900: #111827;
  --color-white: #ffffff;
  --spacing-base: 0.25rem;
  --font-family-sans: system-ui, -apple-system, sans-serif;

  /* Semantic Tokens */
  --color-bg-primary: var(--color-white);
  --color-bg-secondary: #f9fafb;
  --color-text-body: var(--color-gray-900);
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-accent: var(--color-blue-500);
  
  /* Spacing Scale */
  --spacing-xs: calc(var(--spacing-base) * 1);   /* 0.25rem */
  --spacing-sm: calc(var(--spacing-base) * 2);   /* 0.5rem */
  --spacing-md: calc(var(--spacing-base) * 4);   /* 1rem */
  --spacing-lg: calc(var(--spacing-base) * 6);   /* 1.5rem */
  --spacing-xl: calc(var(--spacing-base) * 8);   /* 2rem */
}
```

**Package.json exports:**

```json
{
  "name": "@roolipeli/design-system",
  "exports": {
    "./tokens.css": "./src/styles/tokens.css",
    "./components/*": "./src/components/*"
  }
}
```

---

## 5. Application: Main Site (apps/main-site)

**Role:** The public-facing Knowledge Base.  
**Tech:** Astro (SSR mode), Svelte (Interactivity), Vanilla CSS.

### 5.1 Astro Configuration (astro.config.mjs)

Configured for Node/Netlify Adapter, SSR, and i18n.

```javascript
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node'; // Change to @astrojs/netlify for prod

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [svelte()],
  i18n: {
    defaultLocale: 'fi',
    locales: ['fi', 'sv', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  },
  vite: {
    ssr: {
      noExternal: ['@supabase/ssr']
    }
  }
});
```

### 5.2 Testing Strategy (Vitest & Playwright)

**Unit Testing (Vitest):** Configured in root or individual packages. Used for logic in `packages/database` and components in `packages/design-system`.

**E2E Testing (Playwright):** Configured in both `apps/main-site` and `apps/design-system`.

**File:** `apps/main-site/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'pnpm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'tests/e2e',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

---

## 6. Deployment (Netlify)

**Strategy:** Netlify Monorepo support.

**File:** `netlify.toml` (Root)

```toml
[build]
  base = "apps/main-site"
  publish = "dist"
  command = "pnpm run build"

[context.production.environment]
  NODE_VERSION = "20"

[[plugins]]
  package = "@netlify/plugin-lighthouse"
```

---

## 7. Spec Template (specs/TEMPLATE.md)

Copy this template when creating new feature specs. Rename to `specs/{feature-domain}/spec.md`.

```markdown
# Spec: [Feature Name]

## 1. Blueprint (Design)

### Context
> **Goal:** [What are we building?]  
> **Why:** [Business/user problem being solved]  
> **Architectural Impact:** [What systems does this touch?]

### Data Architecture
- **Schema Changes:** [New tables/columns in Supabase]
- **Validation Rules:** [Zod constraints that must match DB]
- **Relationships:** [Foreign keys, cascades]

### UI Architecture
- **Components:** [New vs. existing from design-system]
- **Routes:** [URL structure, e.g., `/games/[slug]`]
- **Data Flow:** [SSR in Astro → Props to Svelte islands]

### Anti-Patterns
- [What agents must NOT do, with rationale]

---

## 2. Contract (Quality)

### Definition of Done
- [ ] Schema migration applied and typed via `supabase gen types`
- [ ] Zod validators match DB constraints 1:1
- [ ] UI uses only Design Tokens (no hardcoded values)
- [ ] Responsive across breakpoints
- [ ] Accessible (WCAG AA)
- [ ] Unit tests cover validation logic
- [ ] E2E test covers happy path

### Regression Guardrails
- [Invariants that must never break]

### Scenarios (Gherkin)

**Scenario: [Happy Path Name]**
- Given: [User state/precondition]
- When: [Action taken]
- Then: [Expected outcome]

**Scenario: [Error Path Name]**
- Given: [User state/precondition]
- When: [Invalid action]
- Then: [Error handling behavior]
```

---

## 8. PBI Template (plans/TEMPLATE.md)

Copy this template when creating new tasks. Rename to `plans/PBI-XXX-task-name.md`.

```markdown
# PBI: [Task Name]

> **Spec Reference:** `specs/{feature-domain}/spec.md`  
> **Persona:** @Dev (or @Architect, @Librarian)

---

## 1. The Directive

[Strict instruction on what to build RIGHT NOW. Include explicit scope boundaries.]

**In Scope:**
- [What this PBI delivers]

**Out of Scope:**
- [What this PBI does NOT touch]

---

## 2. Context Pointers

- **Data Constraints:** Follow `Data Architecture` section in Spec
- **UI Constraints:** Follow `UI Architecture` section in Spec
- **Styling:** Use only `@roolipeli/design-system` tokens

---

## 3. Verification Pointers

- **Success Criteria:** Pass Scenario "[Name]" in Spec
- **Quality Gate:** `pnpm vitest run && pnpm tsc --noEmit`

---

## 4. Task Checklist

- [ ] Task A
- [ ] Task B
- [ ] Update Spec if contracts changed (same commit)

---

## 5. Refinement Rule

If reality diverges from the Spec:
- [ ] STOP and flag for @Architect review
- [ ] Document the divergence in this PBI
- [ ] Do NOT update Spec without explicit approval
```

---

## 9. AGENTS.md (Full Content)

Create this file at project root.

```markdown
# AGENTS.md - Context & Rules for Roolipeli.info

> **Project Mission:** Build the canonical, AI-first, multilingual (FI/SV/EN) knowledge base 
> for Finnish RPG products.  
> **Core Constraints:** Semantic purity (JSON-LD), Monorepo strictness, and drift-proof Design Systems.

---

## 1. Identity & Personas

> **Default:** If no persona is specified in the prompt, assume `@Dev` role and guidelines.

### 1.1. The Architect (@Architect)

**Identity:** Senior Systems Architect specializing in Astro SSR, PostgreSQL schema design, 
Supabase Row-Level Security, and semantic web standards (JSON-LD/Schema.org). You favor 
composition over inheritance, type safety, and Answer Engine Optimization patterns.

**Trigger:** New features, complex refactors, or creating `specs/` files.

**Goal:** Define the State (The Spec) before the Delta (The PBI).

**Guidelines:**
- **Spec-First:** Never authorize code without a defined Spec in `specs/`.
- **Schema Purity:** Database constraints (Postgres) and runtime validation (Zod) must match 1:1.
- **AEO Focus:** Structure data for Answer Engine Optimization (LLM consumability).

### 1.2. The Developer (@Dev)

**Identity:** Senior Full-Stack Engineer specializing in Astro 5, Svelte 5 (Runes), TypeScript 
strict mode, and vanilla CSS with design tokens. You write test-first, prefer explicit over 
implicit, and never use `any`.

**Trigger:** Implementation, testing, and bug fixing.

**Goal:** Execute PBIs (Plans) with strict adherence to the Spec.

**Guidelines:**
- **Bounded Agency:** You have freedom on *how* (syntax, structure), but zero freedom on *what* (Spec Blueprint).
- **Test-Driven:** Write the verification (Vitest/Playwright) before the logic.
- **Vanilla Only:** Use `var(--token)` from the Design System. No arbitrary values.

### 1.3. The Librarian (@Librarian)

**Identity:** Data Engineer and Domain Expert in Finnish tabletop RPG publishing history. 
You understand ISBN standards, publication metadata, and multilingual content modeling. 
You treat data accuracy as paramount.

**Trigger:** Content entry, data migration, or schema mapping.

**Goal:** Ensure data accuracy and semantic richness.

**Guidelines:**
- **Canonical Source:** If data conflicts, the physical book/product is the source of truth.
- **Multilingual:** All entities must support FI/SV/EN fields where applicable.
- **Provenance:** Track data sources and modification history.

---

## 2. Tech Stack (Ground Truth)

| Layer | Technology | Constraint |
|-------|------------|------------|
| **Runtime** | Node.js v20 (LTS) | Exclusive |
| **Framework** | Astro (SSR Mode) + Svelte 5 | No React/Vue |
| **Database** | Supabase (PostgreSQL) + supabase-js | No other ORMs |
| **Validation** | Zod (Runtime) + TypeScript (Compile) | No io-ts/yup |
| **Styling** | Vanilla CSS + Design Tokens | No Tailwind/SCSS |
| **Testing** | Vitest (Unit) + Playwright (E2E) | No Jest |
| **Repo** | pnpm Workspaces + Lefthook + Biome | No npm/yarn |

---

## 3. Operational Boundaries (The Constitution)

### Tier 1: Constitutive (ALWAYS)

- **ALWAYS** use full relative paths (e.g., `apps/main-site/src/...`) to prevent monorepo drift.
- **ALWAYS** import shared types from `@roolipeli/database` (never redefine locally).
- **ALWAYS** use CSS variables for colors, spacing, and typography.
- **ALWAYS** handle errors explicitly (no empty catch blocks).
- **ALWAYS** add JSDoc to exported functions.

### Tier 2: Procedural (ASK)

- **ASK** before modifying `packages/design-system`.
  - *Gate:* Protected by Lefthook. Requires `ALLOW_DS_EDIT=true` to commit.
- **ASK** before installing new dependencies.
  - *Rationale:* Prefer standard library or existing deps to reduce bundle size.
- **ASK** if a PBI contradicts the Spec.
  - *Escalation:* Flag for @Architect review before proceeding.

### Tier 3: Hard Constraints (NEVER)

- **NEVER** commit secrets, `.env`, or API keys.
- **NEVER** use `any` in TypeScript.
- **NEVER** use `!important` in CSS.
- **NEVER** execute code without an accompanying Spec or PBI reference.
- **NEVER** fetch data client-side in Svelte components (use Astro SSR).

---

## 4. Command Registry

| Intent | Command | Scope | Notes |
|--------|---------|-------|-------|
| **Dev** | `pnpm dev` | Root | Starts all apps |
| **Build** | `pnpm build` | Root | Builds all apps |
| **Lint** | `pnpm biome check --write .` | Root | Fixes formatting/linting |
| **Type Check** | `pnpm tsc --noEmit` | Root | Verifies no `any` leakage |
| **Type Gen** | `npx supabase gen types typescript --project-id <id> --schema public > packages/database/src/types/supabase.ts` | Database | Updates DB types |
| **Unit Test** | `pnpm vitest run` | Root | Runs logic tests |
| **E2E Test** | `pnpm exec playwright test` | Apps | Runs browser tests |
| **A11y Test** | `pnpm exec playwright test --grep @a11y` | Apps | WCAG compliance |

---

## 5. Development Map

```yaml
directory_map:
  apps:
    main-site: "Public KB (Astro SSR). Renders data from Supabase."
    design-system: "Documentation site for the UI library."
  
  packages:
    database: "Single Source of Truth. Exports `Database` types and `Zod` schemas."
    design-system: "PROTECTED. CSS Tokens (`tokens.css`) and Svelte components."
    config: "Shared TSConfig and build settings."
  
  specs:
    "{feature}/spec.md": "Living Specs. The 'State' (Blueprint & Contract) for features."
  
  plans:
    "PBI-XXX-name.md": "Transient Plans. The 'Delta' (Task Instructions) referencing Specs."
```

---

## 6. Coding Standards

```xml
<rule_set name="Data Access">
  <instruction>
    Fetch data in Astro Server frontmatter (SSR). 
    Pass strictly typed data props to Svelte islands.
  </instruction>
  <anti_pattern>
    // ❌ Client-side fetch in Svelte
    onMount(async () => { const data = await fetch('/api/games'); });
  </anti_pattern>
  <preferred_pattern>
    // ✅ SSR in Astro frontmatter
    ---
    import type { Game } from '@roolipeli/database';
    const games: Game[] = await supabase.from('games').select('*');
    ---
    <GameList games={games} client:load />
  </preferred_pattern>
</rule_set>

<rule_set name="Styling">
  <instruction>
    Use `packages/design-system/src/styles/tokens.css` variables.
    Scope styles using CSS Nesting or Svelte scoped styles.
  </instruction>
  <anti_pattern>
    /* ❌ Hardcoded values */
    .card { background: #ffffff; padding: 16px; }
  </anti_pattern>
  <preferred_pattern>
    /* ✅ Design tokens */
    .card { background: var(--color-bg-primary); padding: var(--spacing-md); }
  </preferred_pattern>
</rule_set>

<rule_set name="Type Safety">
  <instruction>
    Use Zod schemas for runtime validation. Infer types from schemas.
    Never use `any` or type assertions without explicit justification.
  </instruction>
  <anti_pattern>
    // ❌ Loose typing
    const data: any = await response.json();
  </anti_pattern>
  <preferred_pattern>
    // ✅ Schema validation
    import { GameSchema } from '@roolipeli/database';
    const result = GameSchema.safeParse(await response.json());
    if (!result.success) throw new ValidationError(result.error);
  </preferred_pattern>
</rule_set>
```

---

## 7. Context References

| Resource | Location | Purpose |
|----------|----------|---------|
| **Database Schema** | `packages/database/src/types/supabase.ts` | Generated Supabase types |
| **Zod Validators** | `packages/database/src/schemas/` | Runtime validation |
| **Design Tokens** | `packages/design-system/src/styles/tokens.css` | CSS variables |
| **Svelte Components** | `packages/design-system/src/components/` | Shared UI |
| **API Routes** | `apps/main-site/src/pages/api/` | Server endpoints |
| **Spec Template** | `specs/TEMPLATE.md` | New feature template |
| **PBI Template** | `plans/TEMPLATE.md` | New task template |

---

## 8. Spec-Driven Development Protocol

We distinguish between **The Spec** (Permanent State) and **The PBI** (Transient Delta).

### Step 1: Create the Spec (The State)

**Location:** `specs/{feature-domain}/spec.md`  
**Responsibility:** @Architect  
**Template:** See `specs/TEMPLATE.md`

The Spec defines:
- **Blueprint:** Architecture, data models, anti-patterns
- **Contract:** Definition of Done, regression guardrails, Gherkin scenarios

### Step 2: Create the PBI (The Delta)

**Location:** `plans/PBI-XXX-task-name.md`  
**Responsibility:** @Architect or @Dev  
**Template:** See `plans/TEMPLATE.md`

The PBI defines:
- **Directive:** Scoped instruction for immediate work
- **Context Pointers:** References to Spec sections
- **Verification Pointers:** Success criteria from Spec
- **Refinement Rule:** What to do when reality diverges

### The Golden Rules

1. **Spec before Code:** No implementation without a defined Spec.
2. **Same-Commit Rule:** If code changes behavior, update the Spec in the same commit.
3. **PBI References Spec:** Every PBI points to its parent Spec for context.
4. **Spec Outlives PBI:** PBIs are closed after merge; Specs persist with the codebase.
```

---

## 10. ARCHITECTURE.md (Cross-Cutting Concerns)

Create this file at project root for system-wide rules.

```markdown
# ARCHITECTURE.md - Roolipeli.info System Rules

> This document defines cross-cutting architectural decisions that apply across all features.
> Feature-specific rules belong in `specs/{feature}/spec.md`.

---

## 1. Data Architecture

### Multilingual Content Model

All user-facing text fields follow the pattern:
- `title` (required, Finnish default)
- `title_fi` (Finnish, may alias `title`)
- `title_sv` (Swedish, optional)
- `title_en` (English, optional)

### Row-Level Security (RLS)

All Supabase tables MUST have RLS enabled. Public read access is granted via policies, 
not by disabling RLS.

### Schema-Validation Parity

Every Supabase table constraint MUST have a matching Zod validator in `@roolipeli/database`. 
If they diverge, the database is the source of truth and Zod must be updated.

---

## 2. Rendering Architecture

### SSR-First Strategy

- **Astro:** All data fetching happens in server frontmatter
- **Svelte Islands:** Receive pre-fetched data as props, hydrate for interactivity
- **No Client Fetching:** Svelte components never call `fetch()` directly

### Hydration Rules

| Directive | Use Case |
|-----------|----------|
| `client:load` | Interactive components needed immediately |
| `client:idle` | Below-fold interactivity |
| `client:visible` | Lazy-loaded content |
| (none) | Static content, no JS shipped |

---

## 3. i18n Architecture

### URL Strategy

| Locale | URL Pattern | Notes |
|--------|-------------|-------|
| Finnish (default) | `/games/...` | No prefix |
| Swedish | `/sv/games/...` | Prefix |
| English | `/en/games/...` | Prefix |

### Content Fallback

If translated content is missing, fall back to Finnish, never show empty.

---

## 4. Semantic Web (JSON-LD)

### Required Schema.org Types

- `Game` → `schema:Game` or `schema:Product`
- `Creator` → `schema:Person` or `schema:Organization`
- `Publisher` → `schema:Organization`

### Implementation

Every public page MUST include a `<script type="application/ld+json">` block 
with appropriate structured data for Answer Engine Optimization.

---

## 5. Security Boundaries

### Environment Variables

| Variable | Location | Exposure |
|----------|----------|----------|
| `SUPABASE_URL` | `.env` | Server only |
| `SUPABASE_ANON_KEY` | `.env` | Server only (SSR) |
| `PUBLIC_*` | `.env` | Client safe |

### API Routes

All `/api/*` routes validate input with Zod before processing.
All mutations require authentication (future).
```

---

## 11. Immediate Next Steps for Agents

1. **Run Initialization:** Execute the script in Section 2.
2. **Populate AGENTS.md:** Copy content from Section 9.
3. **Populate Templates:** Copy Sections 7-8 to `specs/TEMPLATE.md` and `plans/TEMPLATE.md`.
4. **Populate ARCHITECTURE.md:** Copy content from Section 10.
5. **Supabase Link:** Run `npx supabase login` and generate types into `packages/database`.
6. **Database Design:** Create the SQL migration for `games`, `creators`, and `publishers` tables.
7. **First Spec:** Create `specs/game-catalog/spec.md` using the template.
8. **UI Core:** Create `packages/design-system/src/styles/tokens.css` with base tokens.
