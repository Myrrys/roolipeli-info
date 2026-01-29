# Spec: Internationalization (i18n)

## 1. Blueprint (Design)

### Context
> **Goal:** Finnish-first i18n architecture using Astro's built-in i18n
> **Why:** Enable future multilingual support (FI/SV/EN) while establishing Finnish as the source language
> **Architectural Impact:** All UI strings in `apps/main-site` routed through Astro i18n utilities

### Data Architecture
- **Schema Changes:** None (translation strings are code-side, not DB)
- **Validation Rules:** TypeScript types for translation key safety at compile-time
- **Relationships:** N/A

### Astro i18n Configuration
Already configured in `apps/main-site/astro.config.mjs`:
```typescript
i18n: {
  defaultLocale: 'fi',
  locales: ['fi', 'sv', 'en'],
  routing: {
    prefixDefaultLocale: false,  // /products (not /fi/products)
  },
}
```

### File Structure
```
apps/main-site/src/i18n/
├── ui.ts         # Translation strings by locale
└── utils.ts      # Helper functions using Astro.currentLocale
```

### Translation Architecture
```typescript
// ui.ts
export const ui = {
  fi: {
    'home.title': 'Roolipeli.info - Suomalaisten roolipelien tietokanta',
    'nav.products': 'Tuotteet',
    // ...
  },
  sv: {
    'home.title': 'Roolipeli.info - Databas för finska rollspel',
    'nav.products': 'Produkter',
    // ...
  },
  en: {
    'home.title': 'Roolipeli.info - Finnish RPG Database',
    'nav.products': 'Products',
    // ...
  },
} as const;

// utils.ts
import { ui } from './ui';

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof lang]) {
    return ui[lang][key] || ui.fi[key];
  }
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

### Data Enumerations
For enum-like database values, use the pattern: `{domain}.{type}.{value}`

**Reference Types:**
- `reference.type.official`: "Virallinen lähde"
- `reference.type.review`: "Arvostelu"
- `reference.type.source`: "Lähde"

### UI Architecture
- **Components:** No new components; strings passed as props
- **Routes:** All routes use `Astro.currentLocale` for lang attribute
- **Data Flow:**
  1. Astro page gets locale from `Astro.currentLocale`
  2. Calls `useTranslations(Astro.currentLocale)` to get `t()` function
  3. Uses `t('key')` for all UI strings
  4. Passes translated strings to Svelte islands as props

### Anti-Patterns
- **Client-side translation fetching:** All translations resolved at build/SSR time
- **Hardcoded strings in templates:** All user-facing text must use `t()` function
- **Dynamic key construction:** No `t(\`products.${type}\`)` - use explicit keys
- **English/Swedish in Finnish pages:** Source language is Finnish only in v0.3.x

---

## 2. Contract (Quality)

### Definition of Done
- [ ] Astro i18n configured in `astro.config.mjs` (already done)
- [ ] Translation files created: `src/i18n/ui.ts` and `src/i18n/utils.ts`
- [ ] All pages use `Astro.currentLocale` for lang attribute
- [ ] All UI strings use `t()` function from `useTranslations()`
- [ ] No hardcoded Finnish/English/Swedish text in `.astro` templates
- [ ] Translation keys are type-safe (TypeScript error on invalid key)
- [ ] Placeholder pages (`/en/`, `/sv/`) removed
- [ ] `pnpm biome check .` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] All pages render correctly with `pnpm dev`

### Regression Guardrails
- **Invariant:** All pages use `Astro.currentLocale` for lang attribute (defaults to 'fi')
- **Invariant:** No direct string literals in UI templates
- **Invariant:** All translation keys exist in `ui.fi`

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
- When: They add key to `ui.fi` object and use `t('new.key')`
- Then: TypeScript autocompletes the key
- And: Build succeeds

**Scenario: Developer uses invalid translation key**
- Given: Developer calls `t('invalid.key')`
- When: TypeScript compiles
- Then: Compilation fails with type error

**Scenario: Future multilingual expansion**
- Given: Developer wants to add Swedish translations
- When: They populate `ui.sv` object with translations
- Then: Swedish pages automatically use sv translations
- And: Missing sv keys fall back to Finnish (source of truth)
