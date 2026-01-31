# Spec: Answer Engine Optimization (AEO)

## 1. Blueprint (Design)

### Context
> **Goal:** Make roolipeli.info machine-readable for AI systems, search engines, and Answer Engines (ChatGPT, Perplexity, Google AI Overviews).
> **Why:** The project mission is to be the *canonical, AI-first* knowledge base. Structured data enables AI systems to accurately cite and reference our content.
> **Architectural Impact:** Adds JSON-LD scripts and meta tags to all public pages in `apps/main-site`.

### Data Architecture
- **Schema Changes:** None (uses existing entity data)
- **Validation Rules:** JSON-LD must validate against Schema.org specifications
- **Relationships:** Maps existing DB entities to Schema.org types

### Schema.org Type Mapping

| DB Entity | Schema.org Type | Notes |
|-----------|-----------------|-------|
| `products` (Core Rulebook) | `Game` + `Book` | Dual typing for RPGs |
| `products` (Supplement) | `Book` | Publications |
| `publishers` | `Organization` | Publishing companies |
| `creators` | `Person` | Authors, illustrators |
| Site | `WebSite` + `Organization` | Site-level schema |

### JSON-LD Structure

#### Product Detail Pages (`/products/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": ["Game", "Book"],
  "name": "Myrskyn aika",
  "description": "...",
  "inLanguage": "fi",
  "datePublished": "2023",
  "isbn": ["978-...", "978-..."],
  "publisher": {
    "@type": "Organization",
    "name": "Burger Games",
    "url": "https://roolipeli.info/publishers/burger-games"
  },
  "author": [
    {
      "@type": "Person",
      "name": "Eero Tuovinen",
      "url": "https://roolipeli.info/creators/eero-tuovinen"
    }
  ],
  "url": "https://roolipeli.info/products/myrskyn-aika"
}
```

#### Publisher Pages (`/publishers/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Burger Games",
  "description": "...",
  "url": "https://roolipeli.info/publishers/burger-games"
}
```

#### Creator Pages (`/creators/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Eero Tuovinen",
  "url": "https://roolipeli.info/creators/eero-tuovinen"
}
```

### Open Graph & Twitter Cards

All pages must include:
```html
<!-- Open Graph -->
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:type" content="website|article" />
<meta property="og:url" content="{canonical_url}" />
<meta property="og:site_name" content="Roolipeli.info" />
<meta property="og:locale" content="fi_FI" />

<!-- Twitter Cards -->
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
```

### UI Architecture

#### Components (New)
- **JsonLd.astro**: Renders `<script type="application/ld+json">` with typed props
- **SeoMeta.astro**: Renders Open Graph + Twitter Card meta tags

#### File Structure
```
apps/main-site/src/components/seo/
├── JsonLd.astro      # JSON-LD script renderer
├── SeoMeta.astro     # OG/Twitter meta renderer
└── schemas/          # TypeScript schema builders
    ├── product.ts
    ├── publisher.ts
    ├── creator.ts
    └── website.ts
```

#### Data Flow
```
Astro Page (SSR)
  ↓
Entity data from Supabase
  ↓
Schema builder (TypeScript)
  ↓
JsonLd.astro component
  ↓
<script type="application/ld+json"> in <head>
```

### Canonical URLs

All pages must declare canonical URLs:
```html
<link rel="canonical" href="https://roolipeli.info/products/myrskyn-aika" />
```

**URL Rules:**
- Finnish is default locale (no `/fi/` prefix)
- Future: `/sv/` and `/en/` prefixes for translations
- Trailing slashes: NO (consistent with Astro defaults)

### Anti-Patterns
- **No inline JSON-LD strings:** Always use typed schema builders
- **No missing canonical URLs:** Every page must have one
- **No duplicate schemas:** One JSON-LD block per page (can contain multiple types via `@graph`)
- **No hardcoded site URLs:** Use environment variable `SITE_URL`

---

## 2. Contract (Quality)

### Definition of Done
- [ ] `JsonLd.astro` component created with TypeScript props
- [ ] `SeoMeta.astro` component created with TypeScript props
- [ ] Schema builders created for Product, Publisher, Creator, Website
- [ ] All product detail pages include JSON-LD Game+Book schema
- [ ] All publisher pages include JSON-LD Organization schema
- [ ] All creator pages include JSON-LD Person schema
- [ ] Homepage includes JSON-LD WebSite + Organization schema
- [ ] All pages include Open Graph meta tags
- [ ] All pages include Twitter Card meta tags
- [ ] All pages include canonical URL link
- [ ] JSON-LD validates at https://validator.schema.org/
- [ ] Open Graph validates at https://developers.facebook.com/tools/debug/
- [ ] `pnpm biome check .` passes
- [ ] `pnpm tsc --noEmit` passes

### Regression Guardrails
- **Invariant:** All pages must have exactly one JSON-LD block
- **Invariant:** JSON-LD must parse as valid JSON
- **Invariant:** Schema.org `@type` must match entity type
- **Invariant:** Canonical URLs must match actual page URLs
- **Invariant:** No duplicate meta tags

### Scenarios (Gherkin)

**Scenario: AI crawler reads product page**
- Given: Perplexity AI crawls `/products/myrskyn-aika`
- When: It parses the HTML
- Then: It finds `<script type="application/ld+json">`
- And: The JSON-LD contains `@type: ["Game", "Book"]`
- And: The `name`, `publisher`, and `author` fields are populated
- And: AI can accurately cite "Myrskyn aika by Burger Games"

**Scenario: Social share preview**
- Given: User shares `/products/myrskyn-aika` on LinkedIn
- When: LinkedIn fetches the page
- Then: Preview shows title "Myrskyn aika | Roolipeli.info"
- And: Preview shows description from product data
- And: Site name shows "Roolipeli.info"

**Scenario: Google Search structured data**
- Given: Google indexes `/products/myrskyn-aika`
- When: User searches "Myrskyn aika RPG"
- Then: Google may show rich result with Game schema
- And: Publisher and author information visible

**Scenario: Canonical URL prevents duplicate content**
- Given: Page accessible at both `/products/myrskyn-aika` and `/products/myrskyn-aika/`
- When: Search engine indexes the site
- Then: Canonical tag points to `/products/myrskyn-aika` (no trailing slash)
- And: Duplicate content penalty avoided

---

## 3. Implementation Notes

### Environment Configuration
Add to `.env`:
```
SITE_URL=https://roolipeli.info
```

For local development:
```
SITE_URL=http://localhost:4321
```

### Schema Builder Pattern
```typescript
// apps/main-site/src/components/seo/schemas/product.ts
import type { Product as DBProduct } from '@roolipeli/database';

interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': ['Game', 'Book'];
  name: string;
  // ...
}

export function buildProductSchema(
  product: DBProduct,
  siteUrl: string
): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': ['Game', 'Book'],
    name: product.title,
    // ...
  };
}
```

### Testing Structured Data
- **Schema.org Validator:** https://validator.schema.org/
- **Google Rich Results Test:** https://search.google.com/test/rich-results
- **Facebook Sharing Debugger:** https://developers.facebook.com/tools/debug/
- **Twitter Card Validator:** https://cards-dev.twitter.com/validator

---

## 4. Dependencies & Constraints

### External Dependencies
- Schema.org vocabulary (https://schema.org)
- No runtime dependencies (pure HTML output)

### Constraints
- **SSR-Only:** All meta tags rendered server-side
- **No JavaScript Required:** Structured data in static HTML
- **Locale Aware:** `og:locale` must match page language
- **URL Stability:** Canonical URLs must not change

---

## 5. Future Considerations

**Out of Scope for v0.4.0:**
- BreadcrumbList schema (requires navigation component)
- Product images in schema (no image data yet)
- Review/Rating schema (no user reviews)
- FAQ schema (no FAQ content)
- robots.txt and sitemap.xml (separate PBI)
- AI-specific hints (llms.txt, ai.txt)

**Technical Debt:**
- May need to add og:image when product covers available
- Consider JSON-LD for listing pages (ItemList)

---

**Spec Status:** Draft
**Created:** 2026-01-25
**Owner:** @Architect
