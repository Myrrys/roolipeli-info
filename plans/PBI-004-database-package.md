# PBI-004: Database Package Foundation

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 4.1)  
> **Persona:** @Dev

---

## 1. The Directive

Create the `@roolipeli/database` package that will serve as the Single Source of Truth for data types and validation. Initialize the package structure with placeholder types and schemas.

**In Scope:**
- Create `packages/database/` directory structure
- Initialize `package.json` with proper exports configuration
- Install dependencies: Zod, TypeScript, Vitest, Supabase CLI
- Create placeholder TypeScript type files
- Create placeholder Zod schema files
- Create main `index.ts` export file
- Ensure package is importable by other workspaces

**Out of Scope:**
- Actual database schema definitions (comes with feature work)
- Connecting to a real Supabase project
- Writing actual Zod schemas (placeholder only)
- Writing tests (testing infrastructure comes in PBI-009)

---

## 2. Context Pointers

- **Package Structure:** Follow `docs/roolipeli-info-scaffolding.md` Section 4.1
- **TypeScript Config:** Will extend from `@roolipeli/config` (created in PBI-006)
- **Exports:** Package must export both types and schemas via named exports

---

## 3. Verification Pointers

- **Success Criteria:**
  - Package structure matches scaffolding spec
  - Run `pnpm install` from root → Installs database package dependencies
  - Package can be imported: `import { Database } from '@roolipeli/database'` (even if placeholder)
  - TypeScript compilation succeeds
  - Biome formatting passes

- **Quality Gate:** 
  - `pnpm biome check --write packages/database`
  - `pnpm --filter @roolipeli/database tsc --noEmit`

---

## 4. Task Checklist

- [ ] Create `packages/database/` directory
- [ ] Create `packages/database/src/` directory
- [ ] Create `packages/database/src/types/` directory
- [ ] Create `packages/database/src/schemas/` directory
- [ ] Initialize `package.json` with:
  - Name: `@roolipeli/database`
  - Main exports pointing to `src/index.ts`
  - Dependencies: `zod`
  - DevDependencies: `typescript`, `supabase`, `vitest`
- [ ] Create `tsconfig.json` (basic config, will update after PBI-006)
- [ ] Create placeholder `src/types/supabase.ts` with empty Database type
- [ ] Create placeholder `src/schemas/index.ts`
- [ ] Create `src/index.ts` exporting types and schemas
- [ ] Run `pnpm install` to install dependencies
- [ ] Verify TypeScript compilation
- [ ] Run Biome formatting

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Ensure package name follows workspace convention
- [ ] Verify exports configuration allows importing from other packages
- [ ] Check that placeholder types are valid TypeScript

---

## 6. Implementation Example

**package.json structure:**
```json
{
  "name": "@roolipeli/database",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "supabase": "^1.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

**src/types/supabase.ts (placeholder):**
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

**src/schemas/index.ts (placeholder):**
```typescript
// Placeholder for Zod schemas
// Actual schemas will be added in feature PBIs
export {};
```

**src/index.ts:**
```typescript
export type { Database, Json } from './types/supabase';
export * from './schemas';
```

---

## 7. Commit Message

```
feat(database): initialize database package foundation

- Create @roolipeli/database package structure
- Add Zod, TypeScript, Vitest, and Supabase CLI dependencies
- Create placeholder types and schema exports
- Configure package.json exports for workspace consumption

Ref: PBI-004
```
