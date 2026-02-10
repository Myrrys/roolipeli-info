# Spec: Article Pages

## 1. Blueprint (Design)

### Context

> **Goal:** Add a long-form article content type to roolipeli.info that serves as informational landers (e.g., "Mitä on roolipelaaminen?", "Roolipelaaminen Suomessa") — answering questions that newcomers to the hobby might search for.
> **Why:** The product catalog alone doesn't attract organic traffic from people who don't yet know what they're looking for. Articles provide AEO-optimized entry points that funnel visitors into the catalog.
> **Architectural Impact:** New Astro Content Collection, new Kide page template CSS module, new DS documentation page, prerendered Astro routes, new JSON-LD schema builder.

### Data Architecture

**Approach: Astro Content Collections (file-based)**

Articles are static SEO pillar content — they change infrequently and don't need admin CRUD. Using Astro's Content Layer API with the `glob` loader gives us type-safe frontmatter, built-in markdown rendering, and SSG prerendering for optimal Core Web Vitals. Content lives in git, making changes PR-reviewable and version-controlled.

**Future migration path:** If articles later need to be editable via admin UI, the frontmatter schema maps 1:1 to a database table. The content files become seed data. Routes stay identical.

**Content Collection Config:**

```typescript
// apps/main-site/src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(1).max(255),
    summary: z.string().min(1).max(500),
    lang: z.enum(['fi', 'sv', 'en']).default('fi'),
    draft: z.boolean().default(false),
    publishedAt: z.coerce.date(),
    authorName: z.string().optional(),
  }),
});

export const collections = { articles };
```

**Content files:**

```
apps/main-site/src/content/articles/
  ├── mita-on-roolipelaaminen.md       ← id derived from filename
  ├── roolipelaaminen-suomessa.md
  └── tulossa-pian.md                  ← draft article (filtered out at build)
```

**Frontmatter example:**

```yaml
---
title: "Mitä roolipelit ovat"
summary: "Oletko koskaan halunnut astua tarinan sankarin saappaisiin ja päättää itse seikkailun kulusta? Roolipelaaminen on hauska harrastus, joka tekee sen mahdolliseksi."
lang: fi
draft: false
publishedAt: 2026-02-10
authorName: "Ville Takanen"
---

## Roolipeli on yhdessä kerrottava tarina
...
```

**Key decisions:**
- **`id` as slug:** The `glob` loader derives `id` from the filename in URL-friendly format. `mita-on-roolipelaaminen.md` → `id: "mita-on-roolipelaaminen"`. This is the URL slug.
- **`draft` field:** Draft articles are filtered out at build time via `getCollection()` filter. They simply aren't built — no runtime 404 logic needed.
- **`lang` field:** Reuses the same language codes as the i18n system. Enables future filtering by language.
- **No `author_id` FK:** Articles are editorial content with freeform bylines, not catalog entities.

**Querying:**

```typescript
// List published articles (non-draft), newest first
import { getCollection } from 'astro:content';

const articles = (await getCollection('articles', ({ data }) => !data.draft))
  .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

// Single article by id (slug)
import { getEntry, render } from 'astro:content';

const article = await getEntry('articles', slug);
const { Content } = await render(article);
```

### UI Architecture

#### Kide Design System: Article Page Template

**New CSS module:** `packages/design-system/src/styles/components/article.css`

The article template defines a long-form reading experience optimized for the `grid-layout` system. It does NOT replace the existing typography or grid — it layers article-specific patterns on top.

**BEM Structure:**

```
.article                    — <article> wrapper (no layout role, semantic only)
  .article__header          — Title + meta block
    h1                      — Title (inherits existing h1 styling)
    .article__meta          — Byline, date, language badge
      .article__author      — Author name
      .article__date        — Publication date
      .article__lang        — Language tag
  .article__summary         — Lead paragraph / lede (visually distinct)
  .article__content         — Markdown-rendered body (prose typography)
  .article__footer          — Tags, back-navigation
```

**Key Styling Decisions:**

1. **`.article__summary`** — Larger font (`--kide-font-size-lg`), serif, muted color. Visually separates the lede from body content. Acts as the "hook" paragraph.

2. **`.article__content`** — A "prose" container that styles rendered markdown:
   - Headings (h2-h4): proper spacing, serif, anchor-ready
   - Paragraphs: `line-height: 1.7` (slightly more generous for long-form)
   - Block quotes: left border in `--kide-ice-mid`, italic, padded
   - Code blocks: `--kide-surface` background, monospace, rounded
   - Images: `max-width: 100%`, centered, optional caption via `<figure>`
   - Tables: bordered with `--kide-border-subtle`, header row highlighted
   - Horizontal rules: `--kide-border-subtle`, section dividers

3. **`.article__meta`** — Flex row, `--kide-ink-muted` text, small font size, uses `.tag` component for language badge.

4. **`.article__footer`** — Separator line, back-navigation link.

**Grid Integration:**
- `.article` sits inside `.grid-layout` at content width (default)
- `.article__content img`, `.article__content table` can use `.breakout` for wider visual elements

#### Routes

| Route | Type | Description |
|-------|------|-------------|
| `/artikkelit` | Listing (SSG) | Published articles, newest first |
| `/artikkelit/[...slug]` | Detail (SSG) | Single article, full content |

Both routes use `export const prerender = true` to generate static HTML at build time, even though the site runs in `output: 'server'` mode.

#### Data Flow

```
/artikkelit/[...slug].astro (prerendered at build)
  ↓ getStaticPaths()
getCollection('articles', non-draft filter)
  ↓ render()
Built-in Astro markdown → HTML (unified/remark/rehype)
  ↓
Render: Layout → Breadcrumbs → <Content /> → JSON-LD
```

#### JSON-LD (AEO)

Schema.org type: `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Mitä roolipelit ovat",
  "description": "...",
  "inLanguage": "fi",
  "datePublished": "2026-02-10",
  "author": { "@type": "Person", "name": "..." },
  "publisher": {
    "@type": "Organization",
    "name": "Roolipeli.info",
    "url": "https://roolipeli.info"
  },
  "url": "https://roolipeli.info/artikkelit/mita-on-roolipelaaminen"
}
```

#### Design System Documentation Page

**New page:** `apps/design-system/src/pages/article.astro`

Showcases the article page template with:
- Example article with all markdown elements (headings, lists, quotes, code, images, tables)
- BEM class reference table
- Token usage reference
- Responsive behavior notes

### Anti-Patterns

- **NEVER** render markdown client-side (Astro's `render()` + `<Content />` runs at build time)
- **NEVER** hardcode typography values in article.css (tokens only)
- **NEVER** use `.article__content` for non-markdown content (it's a prose container specifically for rendered markdown output)
- **NEVER** fetch article data client-side in Svelte components (articles are prerendered via Content Collections)
- **NEVER** use `getEntry()` without checking for `undefined` (article may not exist)
- **NEVER** commit draft articles with `draft: false` accidentally — review frontmatter in PRs

---

## 2. Contract (Quality)

### Definition of Done

**Design System (Kide):**
- [ ] `article.css` created in `packages/design-system/src/styles/components/`
- [ ] `article.css` exported from `packages/design-system/package.json`
- [ ] BEM classes: `.article`, `.article__header`, `.article__meta`, `.article__author`, `.article__date`, `.article__lang`, `.article__summary`, `.article__content`, `.article__footer`
- [ ] `.article__content` handles: h2-h4, p, ul/ol, blockquote, pre/code, img, table, hr
- [ ] Live demo in `apps/design-system/src/pages/article.astro`
- [ ] DS demo uses its own components (dogfooding)
- [ ] All values use `--kide-*` tokens (no hardcoded colors/spacing)
- [ ] Responsive: readable at 375px, 768px, 1200px

**Content Collection:**
- [ ] Content config at `apps/main-site/src/content.config.ts`
- [ ] Frontmatter schema validates: title, summary, lang, draft, publishedAt, authorName
- [ ] At least 1 seed article `.md` file in `src/content/articles/`
- [ ] Draft filtering works (draft articles excluded from build)

**Main Site:**
- [ ] Prerendered listing page at `/artikkelit` using `.kide-collection` grid
- [ ] Prerendered detail page at `/artikkelit/[...slug]` using `.article` template
- [ ] Both routes export `prerender = true`
- [ ] `getStaticPaths()` generates routes from non-draft articles
- [ ] Breadcrumbs with JSON-LD on detail page
- [ ] Article JSON-LD (`Article` schema) on detail page
- [ ] i18n keys added for article UI strings

**Testing:**
- [ ] E2E: article listing renders published articles
- [ ] E2E: article detail renders title, summary, content
- [ ] E2E: breadcrumbs present on article detail
- [ ] DS E2E: article demo page renders all prose elements

### Regression Guardrails

**Invariants:**
- Article slugs (filenames) are URL identifiers — renaming a file changes the URL (breaking change)
- Published articles (non-draft) must be publicly accessible without auth
- Existing grid-layout, typography, and card styles unaffected
- Astro's built-in markdown renderer handles sanitization
- `prerender = true` must be set — articles must never be SSR'd on every request

### Scenarios (Gherkin)

**Scenario: User browses article listing**
- Given: 2 published articles and 1 draft article exist as `.md` files
- When: I visit `/artikkelit`
- Then: I see 2 article cards (draft is not built)
- And: Each card shows title, summary excerpt, and date
- And: Cards are sorted newest-published first

**Scenario: User reads a full article**
- Given: A published article "Mitä roolipelit ovat" exists with markdown content including headings, a blockquote, and a list
- When: I visit `/artikkelit/mita-on-roolipelaaminen`
- Then: I see the title in an `<h1>`
- And: I see the author name and publication date in `.article__meta`
- And: I see the summary in `.article__summary` with distinct styling
- And: I see the rendered markdown with proper heading hierarchy
- And: Blockquote has left border accent
- And: The page has `<script type="application/ld+json">` with `@type: Article`

**Scenario: Article page has breadcrumbs**
- Given: A published article exists
- When: I visit the article detail page
- Then: Breadcrumbs show: Etusivu > Artikkelit > [Article Title]
- And: JSON-LD BreadcrumbList is present

**Scenario: Article renders responsively on mobile**
- Given: Viewport is 375px wide
- When: I view an article detail page
- Then: Content is readable without horizontal scroll
- And: Images scale to container width
- And: Code blocks scroll horizontally if needed

**Scenario: Design system documents article template**
- Given: I navigate to the design-system article page
- When: The page loads
- Then: I see a complete article demo with all prose elements
- And: BEM class names are documented
- And: Token usage is visible

---

## 3. Implementation Notes

### No New Dependencies

Astro Content Collections (Content Layer API) is built into Astro 5. The `glob` loader, `defineCollection`, Zod schema validation, and `render()` function are all framework-native. Zero new packages needed.

### Prerendering in Server Mode

The site uses `output: 'server'` with Netlify adapter. Article pages opt into static generation via `export const prerender = true`. This is Astro's supported hybrid rendering model — most pages are SSR, articles are SSG.

### File Locations

```
apps/main-site/src/
  ├── content.config.ts                ← NEW: Content collection definition
  ├── content/articles/
  │   ├── mita-on-roolipelaaminen.md   ← NEW: Seed article
  │   ├── roolipelaaminen-suomessa.md  ← NEW: Second seed article
  │   └── tulossa-pian.md             ← NEW: Draft article (for test coverage)
  ├── pages/
  │   └── artikkelit/
  │       ├── index.astro              ← NEW: Article listing (prerendered)
  │       └── [...slug].astro          ← NEW: Article detail (prerendered)
  └── i18n/
      └── ui.ts                        ← UPDATE: Article translation keys

packages/design-system/src/styles/components/
  └── article.css                      ← NEW: Article page template

apps/design-system/src/pages/
  └── article.astro                    ← NEW: DS documentation page
```

### Admin CRUD

Out of scope for this spec. Articles are authored as `.md` files and committed via git. If admin editing is needed later, migrate to a database-backed approach — the frontmatter schema maps directly to a table schema.

---

## 4. Future Considerations

**Out of Scope:**
- Admin CRUD pages for articles (separate PBI, would require DB migration)
- Article categories / tagging system
- Related articles component
- Article search
- Cover images / hero images
- Reading time estimate
- Table of contents generation
- Multi-language variants of the same article (linked translations)

---

**Spec Status:** Approved
**Created:** 2026-02-09
**Updated:** 2026-02-10 — Pivoted from database-backed to Astro Content Collections (file-based SSG)
**Linear Issue:** [ROO-62](https://linear.app/pelilauta/issue/ROO-62/feature-article-page)
**Owner:** @Architect
