# PBI-006: Config Package

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 1)  
> **Persona:** @Dev

---

## 1. The Directive

Create the `@roolipeli/config` package that provides shared TypeScript configurations for all packages and applications. This ensures consistent TypeScript strict mode and proper type support across the monorepo.

**In Scope:**
- Create `packages/config/` directory structure
- Create `tsconfig.base.json` with strict TypeScript configuration
- Create optional configs for Astro and Svelte projects
- Initialize `package.json` with exports
- Ensure other packages can extend from these configs

**Out of Scope:**
- Package-specific tsconfig files (those extend from this base)
- Runtime configuration (environment variables, etc.)
- Build tool configurations

---

## 2. Context Pointers

- **TypeScript Strict Mode:** All configs must enable strict mode
- **Astro Support:** Configs must support Astro and Svelte type checking
- **Node Version:** Target Node 20 (LTS)
- **Module System:** Use ES modules (`"type": "module"`)

---

## 3. Verification Pointers

- **Success Criteria:**
  - Package structure created successfully
  - `tsconfig.base.json` enforces strict mode
  - Other packages can extend: `"extends": "@roolipeli/config/tsconfig.base.json"`
  - Config includes proper lib and target settings for Node 20
  - Biome formatting passes

- **Quality Gate:** 
  - `pnpm biome check --write packages/config`
  - Verify JSON is valid

---

## 4. Task Checklist

- [ ] Create `packages/config/` directory
- [ ] Initialize `package.json` with:
  - Name: `@roolipeli/config`
  - Exports for various tsconfig files
- [ ] Create `tsconfig.base.json` with:
  - `strict: true`
  - `esModuleInterop: true`
  - `skipLibCheck: true`
  - `moduleResolution: "bundler"`
  - `target: "ES2022"`
  - `lib: ["ES2022"]`
- [ ] Create optional `tsconfig.astro.json` (extends base, adds Astro types)
- [ ] Run Biome formatting
- [ ] Test that the config can be extended (will verify in later PBIs)

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Verify TypeScript version compatibility with Astro 5
- [ ] Ensure config exports are correctly structured
- [ ] Check that strict mode doesn't conflict with dependencies

---

## 6. Implementation Example

**package.json:**
```json
{
  "name": "@roolipeli/config",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./tsconfig.base.json": "./tsconfig.base.json",
    "./tsconfig.astro.json": "./tsconfig.astro.json"
  }
}
```

**tsconfig.base.json:**
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "resolveJsonModule": true,
    "allowJs": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**tsconfig.astro.json:**
```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "astro"
  }
}
```

---

## 7. Commit Message

```
feat(config): initialize shared typescript configuration

- Create @roolipeli/config package with base TypeScript configs
- Enable strict mode across all configurations
- Add Astro-specific config extending base
- Configure for ES2022 and Node 20 compatibility

Ref: PBI-006
```
