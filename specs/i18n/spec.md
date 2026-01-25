# Spec: Internationalization (i18n)

## 1. Blueprint (Design)

### Context
> **Goal:** Finnish-first i18n architecture with translation function
> **Why:** Enable future multilingual support (FI/SV/EN) while establishing Finnish as the source language
> **Architectural Impact:** All UI strings in `apps/main-site` routed through translation infrastructure

### Data Architecture
- **Schema Changes:** None (translation strings are code-side, not DB)
- **Validation Rules:** Zod schema for translation key type safety at compile-time
- **Relationships:** N/A

### File Structure
```
apps/main-site/src/i18n/
├── t.ts          # Translation function
├── fi.ts         # Finnish strings (source of truth)
└── index.ts      # Barrel exports
```

### Translation Function
```typescript
// t.ts
import { fi } from './fi';

/**
 * Returns the Finnish translation for a given key.
 * Throws at runtime if key is missing (fail-fast).
 */
export function t(key: keyof typeof fi): string {
  return fi[key];
}
```

### String Key Convention
Pattern: `{page}.{element}`

Examples:
- `home.title` - Page title for home
- `home.description` - Meta description
- `products.backLink` - "Back to products" link text
- `nav.home` - Navigation item
- `footer.copyright` - Footer text

### UI Architecture
- **Components:** No new components; strings passed as props
- **Routes:** All routes use `<html lang="fi">`
- **Data Flow:**
  1. Astro page imports `t()` function
  2. Calls `t('key')` in frontmatter or template
  3. Passes translated strings to Svelte islands as props

### Anti-Patterns
- **Client-side translation fetching:** All translations resolved at build/SSR time
- **Hardcoded strings in templates:** All user-facing text must use `t()` function
- **Dynamic key construction:** No `t(\`products.${type}\`)` - use explicit keys
- **English/Swedish in Finnish pages:** Source language is Finnish only in v0.3.x

---

## 2. Contract (Quality)

### Definition of Done
- [ ] All pages have `<html lang="fi">`
- [ ] All UI strings use `t()` function
- [ ] No hardcoded Finnish/English/Swedish text in `.astro` templates
- [ ] Translation keys are type-safe (TypeScript error on invalid key)
- [ ] `pnpm biome check .` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] All pages render correctly with `pnpm dev`

### Regression Guardrails
- **Invariant:** `<html lang="fi">` must be present on every page
- **Invariant:** No `t()` calls with string literals not in `fi.ts`
- **Invariant:** Placeholder pages (`/en/`, `/sv/`) removed

### Scenarios (Gherkin)

**Scenario: User views Finnish homepage**
- Given: User navigates to `/`
- When: Page loads
- Then: HTML lang attribute is "fi"
- And: All visible text is in Finnish
- And: View source shows no hardcoded strings in template

**Scenario: User views product detail page**
- Given: User navigates to `/products/[slug]`
- When: Page loads
- Then: HTML lang attribute is "fi"
- And: UI chrome (navigation, buttons) is in Finnish
- And: Product data (from DB) displays correctly

**Scenario: Developer adds new translation key**
- Given: Developer needs new UI string
- When: They add key to `fi.ts` and use `t('new.key')`
- Then: TypeScript autocompletes the key
- And: Build succeeds

**Scenario: Developer uses invalid translation key**
- Given: Developer calls `t('invalid.key')`
- When: TypeScript compiles
- Then: Compilation fails with type error
