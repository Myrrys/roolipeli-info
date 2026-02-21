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

### ISBN Sanitization (ROO-93)

ISBNs in the database may contain parenthetical format descriptions (e.g., `978-952-65247-5-7 (PDF)`).
JSON-LD must output only the clean ISBN value.

- Strip parenthetical suffixes: remove everything matching `\s*\(.*?\)\s*` from the isbn string
- Retain hyphens and `X` check digits (e.g., `978-952-65247-5-7`)
- Applied at JSON-LD build time only — DB and HTML display retain raw values

### Creator Role Mapping (ROO-93)

Map Finnish creator roles from `products_creators.role` to Schema.org properties:

| Finnish Role | Schema.org Property | Schema.org Type |
|-------------|---------------------|-----------------|
| Pääsuunnittelija | `author` | `Person` |
| Kirjoittaja | `author` | `Person` |
| Kirjailija | `author` | `Person` |
| Kuvittaja | `illustrator` | `Person` |
| Kartantekijä | `contributor` | `Person` |
| Kääntäjä | `translator` | `Person` |
| *(unmapped roles)* | `author` | `Person` |

- A creator may appear in multiple Schema.org properties if they hold multiple roles
- Each `Person` object includes `name` and `url` (canonical creator page URL)
- Unmapped roles default to `author`

### Description Normalization (ROO-93)

Product descriptions may contain redundant whitespace (tabs, multiple newlines, non-breaking spaces).

- Collapse all whitespace sequences (including `\t`, `\n`, `\r`, `\u00a0`) to a single space
- Trim leading/trailing whitespace
- Applied at JSON-LD build time only — HTML rendering continues to use `white-space: pre-wrap` on the raw value

### Genre Assignment (ROO-93)

- Map the first semantic label's display name to the `genre` property as a plain string (e.g., `"Seikkailu"`)
- `keywords` retains the full `DefinedTerm[]` array with Wikidata links (unchanged)
- If no semantic labels exist, omit `genre`

### JSON-LD Structure

#### Product Detail Pages (`/tuotteet/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": ["Game", "Book"],
  "name": "Myrskyn aika",
  "description": "Normalized description text...",
  "inLanguage": "fi",
  "datePublished": "2023",
  "isbn": ["978-952-65247-5-7"],
  "genre": "Seikkailu",
  "publisher": {
    "@type": "Organization",
    "name": "Burger Games",
    "url": "https://roolipeli.info/kustantajat/burger-games"
  },
  "author": [
    {
      "@type": "Person",
      "name": "Eero Tuovinen",
      "url": "https://roolipeli.info/tekijat/eero-tuovinen"
    }
  ],
  "illustrator": [
    {
      "@type": "Person",
      "name": "Janna Juvonen",
      "url": "https://roolipeli.info/tekijat/janna-juvonen"
    }
  ],
  "keywords": [
    {
      "@type": "DefinedTerm",
      "name": "Seikkailu",
      "sameAs": "https://www.wikidata.org/wiki/Q4686479"
    }
  ],
  "url": "https://roolipeli.info/tuotteet/myrskyn-aika"
}
```

#### Publisher Pages (`/kustantajat/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Burger Games",
  "description": "...",
  "url": "https://roolipeli.info/kustantajat/burger-games"
}
```

#### Creator Pages (`/tekijat/[slug]`)
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Eero Tuovinen",
  "url": "https://roolipeli.info/tekijat/eero-tuovinen"
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
<link rel="canonical" href="https://roolipeli.info/tuotteet/myrskyn-aika" />
```

**URL Rules:**
- Finnish is default locale (no `/fi/` prefix)
- Future: `/sv/` and `/en/` prefixes for translations
- Trailing slashes: NO (consistent with Astro defaults)

### Anti-Patterns
- **No inline JSON-LD strings:** Always use typed schema builders
- **No missing canonical URLs:** Every page must have one
- **No duplicate schemas:** One JSON-LD block per page (can contain multiple types via `@graph`)
- **No hardcoded site URLs:** Use `Astro.url.origin` in SSR pages

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

#### ROO-93: Product Page JSON-LD Enhancements
- [ ] `buildProductSchema()` function created in `apps/main-site/src/components/seo/schemas/product.ts`
- [ ] ISBN values sanitized (parenthetical descriptions stripped)
- [ ] Creator roles mapped to `author` / `illustrator` / `contributor` / `translator` per role mapping table
- [ ] Unmapped roles default to `author`
- [ ] `publisher` rendered as `Organization` with canonical `/kustantajat/[slug]` URL
- [ ] `datePublished` populated from `product.year`
- [ ] `inLanguage` populated from `product.lang`
- [ ] `description` whitespace-normalized (tabs, multiple newlines, NBSP collapsed)
- [ ] `genre` populated from first semantic label display name
- [ ] Inline JSON-LD in `[slug].astro` replaced with `buildProductSchema()` + `JsonLd.astro`
- [ ] Unit tests cover `buildProductSchema()` (ISBN sanitization, role mapping, description normalization)
- [ ] E2E tests verify JSON-LD output for each new property

### Regression Guardrails
- **Invariant:** All pages must have exactly one JSON-LD block
- **Invariant:** JSON-LD must parse as valid JSON
- **Invariant:** Schema.org `@type` must match entity type
- **Invariant:** Canonical URLs must match actual page URLs
- **Invariant:** No duplicate meta tags
- **Invariant:** ISBN values in JSON-LD must never contain parenthetical descriptions (ROO-93)
- **Invariant:** All creators with roles must appear in the JSON-LD as `author`, `illustrator`, `contributor`, or `translator` (ROO-93)

### Scenarios (Gherkin)

**Scenario: AI crawler reads product page**
- Given: Perplexity AI crawls `/tuotteet/myrskyn-aika`
- When: It parses the HTML
- Then: It finds `<script type="application/ld+json">`
- And: The JSON-LD contains `@type: ["Game", "Book"]`
- And: The `name`, `publisher`, and `author` fields are populated
- And: AI can accurately cite "Myrskyn aika by Burger Games"

**Scenario: Social share preview**
- Given: User shares `/tuotteet/myrskyn-aika` on LinkedIn
- When: LinkedIn fetches the page
- Then: Preview shows title "Myrskyn aika | Roolipeli.info"
- And: Preview shows description from product data
- And: Site name shows "Roolipeli.info"

**Scenario: Google Search structured data**
- Given: Google indexes `/tuotteet/myrskyn-aika`
- When: User searches "Myrskyn aika RPG"
- Then: Google may show rich result with Game schema
- And: Publisher and author information visible

**Scenario: Canonical URL prevents duplicate content**
- Given: Page accessible at both `/tuotteet/myrskyn-aika` and `/tuotteet/myrskyn-aika/`
- When: Search engine indexes the site
- Then: Canonical tag points to `/tuotteet/myrskyn-aika` (no trailing slash)
- And: Duplicate content penalty avoided

#### ROO-93: Product JSON-LD Enhancement Scenarios

**Scenario: ISBN sanitization in JSON-LD**
- Given: A product has ISBN "978-952-65247-5-7 (PDF)" in the database
- When: I view the product page source
- Then: The JSON-LD `isbn` value is `"978-952-65247-5-7"`
- And: The parenthetical "(PDF)" is not present in the JSON-LD
- And: The HTML display still shows the raw ISBN with label

**Scenario: Author mapping from Finnish roles**
- Given: A product has creator "Ville Vuorela" with role "Kirjoittaja"
- And: A creator "Janna Juvonen" with role "Kuvittaja"
- When: I view the product page source
- Then: The JSON-LD `author` array contains a Person with name "Ville Vuorela"
- And: The JSON-LD `illustrator` array contains a Person with name "Janna Juvonen"
- And: Each Person has a `url` pointing to their `/tekijat/[slug]` page

**Scenario: Unmapped role defaults to author**
- Given: A product has creator "Testi Tekijä" with role "Toimittaja"
- When: I view the product page source
- Then: The JSON-LD `author` array contains a Person with name "Testi Tekijä"

**Scenario: Publisher with canonical URL in JSON-LD**
- Given: A product is published by "Burger Games" (slug: `burger-games`)
- When: I view the product page source
- Then: The JSON-LD `publisher` is an Organization
- And: The publisher `name` is "Burger Games"
- And: The publisher `url` is `"{SITE_URL}/kustantajat/burger-games"`

**Scenario: Date and language in JSON-LD**
- Given: A product has year "2023" and lang "fi"
- When: I view the product page source
- Then: The JSON-LD `datePublished` is `"2023"`
- And: The JSON-LD `inLanguage` is `"fi"`

**Scenario: Description whitespace normalization in JSON-LD**
- Given: A product description contains `"Line one.\n\n\tLine two.\u00a0Extra."`
- When: I view the product page source
- Then: The JSON-LD `description` is `"Line one. Line two. Extra."`
- And: The HTML description retains the original formatting

**Scenario: Genre from semantic label**
- Given: A product has semantic label "Seikkailu" (with Wikidata ID)
- When: I view the product page source
- Then: The JSON-LD `genre` is `"Seikkailu"`
- And: The JSON-LD `keywords` still contains the full DefinedTerm with Wikidata sameAs link

**Scenario: Product with no optional data**
- Given: A product has no creators, no publisher, no ISBNs, no labels, and no year
- When: I view the product page source
- Then: The JSON-LD contains `name` and `@type`
- And: Optional properties (`author`, `publisher`, `isbn`, `genre`, `datePublished`) are omitted (not null)

---

## 3. Implementation Notes

### Site URL Resolution

In SSR mode, use `Astro.url.origin` to derive the site URL at request time.
This automatically adapts to the current environment (local dev, preview, production)
without requiring a separate environment variable.

```typescript
const siteUrl = Astro.url.origin;
const jsonLd = buildProductSchema(product, siteUrl);
```

### Schema Builder Pattern
```typescript
// apps/main-site/src/components/seo/schemas/product.ts
import type { Product as DBProduct } from '@roolipeli/database';

/** Roles that map to Schema.org `author` */
const AUTHOR_ROLES = ['Pääsuunnittelija', 'Kirjoittaja', 'Kirjailija'];
/** Roles with dedicated Schema.org properties */
const ROLE_MAP: Record<string, string> = {
  Kuvittaja: 'illustrator',
  Kartantekijä: 'contributor',
  Kääntäjä: 'translator',
};

/** Strip parenthetical format descriptions from ISBN strings */
function sanitizeIsbn(raw: string): string {
  return raw.replace(/\s*\(.*?\)\s*/g, '').trim();
}

/** Collapse all whitespace to single spaces */
function normalizeDescription(raw: string): string {
  return raw.replace(/[\s\u00a0]+/g, ' ').trim();
}

export function buildProductSchema(
  product: DBProduct,       // Full product with joins
  siteUrl: string
): Record<string, unknown> {
  // ... ISBN sanitization, creator role mapping,
  // description normalization, genre from first label,
  // publisher as Organization, inLanguage, datePublished
}
```

> **Note:** The builder encapsulates all ROO-93 transformation logic (sanitization, mapping, normalization). The Astro page calls the builder and passes the result to `JsonLd.astro`. Unit tests target the builder function directly.

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

**Spec Status:** Active
**Created:** 2026-01-25
**Updated:** 2026-02-19 (ROO-93: ISBN sanitization, creator role mapping, description normalization, genre assignment, builder function)
**Owner:** @Architect
