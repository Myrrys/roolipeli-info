# Spec: Article Pages

## 1. Blueprint (Design)

### Context

> **Goal:** Add a long-form article content type to roolipeli.info that serves as informational landers (e.g., "Mitä on roolipelaaminen?", "Roolipelaaminen Suomessa") — answering questions that newcomers to the hobby might search for.
> **Why:** The product catalog alone doesn't attract organic traffic from people who don't yet know what they're looking for. Articles provide AEO-optimized entry points that funnel visitors into the catalog.
> **Architectural Impact:** New DB table, new Kide page template CSS module, new DS documentation page, new Astro routes, new JSON-LD schema builder.

### Data Architecture

**New Table: `articles`**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Via trigger |
| `title` | `text` | NOT NULL, max 255 | Display title |
| `slug` | `text` | NOT NULL, UNIQUE, kebab-case | URL identifier |
| `summary` | `text` | NOT NULL, max 500 | Meta description / card excerpt |
| `content` | `text` | NOT NULL | Markdown body |
| `lang` | `product_lang` | NOT NULL, default `'fi'` | Reuse existing enum |
| `published` | `boolean` | NOT NULL, default `false` | Draft/live toggle |
| `published_at` | `timestamptz` | NULLABLE | Set on first publish |
| `author_name` | `text` | NULLABLE | Display byline (not FK — editorial content) |

**RLS Policies:**
- `SELECT`: Public access WHERE `published = true` (anon + authenticated)
- `INSERT/UPDATE/DELETE`: Admin only (`(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'`)
- Admin `SELECT`: All rows (including drafts)

**Zod Schema: `ArticleSchema`**

```typescript
export const ArticleSchema = z.object({
  id: z.string().uuid().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  summary: z.string().min(1).max(500),
  content: z.string().min(1),
  lang: ProductLangEnum.default('fi'),
  published: z.boolean().default(false),
  published_at: z.string().datetime().nullable().optional(),
  author_name: z.string().nullable().optional(),
});
```

**Query Functions:**
- `getPublishedArticles(supabase)` — list, ordered by `published_at DESC`
- `getArticleBySlug(supabase, slug)` — single, published only
- `getArticleBySlugAdmin(supabase, slug)` — single, including drafts

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
- `.article__content img`, `.article__content table` can use `.breakout` for wider visual elements (applied via markdown rendering or manual markup)

#### Routes

| Route | Type | Description |
|-------|------|-------------|
| `/artikkelit` | Listing | Published articles, newest first |
| `/artikkelit/[slug]` | Detail | Single article, full content |

#### Data Flow

```
/artikkelit/[slug].astro (SSR)
  ↓ frontmatter
getArticleBySlug(supabase, slug)
  ↓
Markdown → HTML (Astro's unified/remark pipeline)
  ↓
Render: Layout → Breadcrumbs → article template → JSON-LD
```

#### Markdown Rendering Strategy

Use Astro's built-in unified/remark/rehype pipeline (already in dependencies) to transform `article.content` (stored as markdown string in DB) to HTML at SSR time. No client-side rendering.

```typescript
// apps/main-site/src/lib/markdown.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

/** Renders a markdown string to sanitized HTML at SSR time. */
export async function renderMarkdown(content: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeStringify)
    .process(content);
  return String(result);
}
```

**Security:** `allowDangerousHtml: false` — raw HTML in markdown is stripped. Admin-authored content only, but defense-in-depth.

#### JSON-LD (AEO)

Schema.org type: `Article`

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Mitä on roolipelaaminen?",
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

- **NEVER** render markdown client-side (SSR only)
- **NEVER** allow raw HTML passthrough in markdown (security)
- **NEVER** hardcode typography values in article.css (tokens only)
- **NEVER** use `.article__content` for non-markdown content (it's a prose container specifically for rendered markdown output)
- **NEVER** couple article data to creators table via FK (articles are editorial content with freeform bylines, not catalog entities)

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

**Database:**
- [ ] Migration: `articles` table with all columns per schema
- [ ] RLS: public read (published), admin write
- [ ] `updated_at` trigger
- [ ] Zod schema in `packages/database/src/schemas/core.ts`
- [ ] Query functions in `packages/database/src/queries.ts`
- [ ] Supabase types regenerated

**Main Site:**
- [ ] Markdown utility at `apps/main-site/src/lib/markdown.ts`
- [ ] Listing page at `/artikkelit` using `.kide-collection` grid
- [ ] Detail page at `/artikkelit/[slug]` using `.article` template
- [ ] Breadcrumbs with JSON-LD on detail page
- [ ] Article JSON-LD (`Article` schema) on detail page
- [ ] 404 handling for missing/unpublished slugs
- [ ] i18n keys added for article UI strings

**Testing:**
- [ ] E2E: article listing renders published articles
- [ ] E2E: article detail renders title, summary, content
- [ ] E2E: unpublished articles return 404 for anonymous users
- [ ] E2E: breadcrumbs present on article detail
- [ ] DS E2E: article demo page renders all prose elements

### Regression Guardrails

**Invariants:**
- Article slugs are URL identifiers — immutable after publish
- Published articles must be publicly accessible without auth
- Existing grid-layout, typography, and card styles unaffected
- Markdown rendering must strip raw HTML (no XSS vectors)
- `product_lang` enum is NOT modified (reused as-is)

### Scenarios (Gherkin)

**Scenario: User browses article listing**
- Given: 3 published articles and 1 draft exist
- When: I visit `/artikkelit`
- Then: I see 3 article cards (draft is hidden)
- And: Each card shows title, summary excerpt, and date
- And: Cards are sorted newest-published first

**Scenario: User reads a full article**
- Given: A published article "Mitä on roolipelaaminen?" exists with markdown content including headings, a blockquote, and a list
- When: I visit `/artikkelit/mita-on-roolipelaaminen`
- Then: I see the title in an `<h1>`
- And: I see the author name and publication date in `.article__meta`
- And: I see the summary in `.article__summary` with distinct styling
- And: I see the rendered markdown with proper heading hierarchy
- And: Blockquote has left border accent
- And: The page has `<script type="application/ld+json">` with `@type: Article`

**Scenario: Unpublished article is not accessible**
- Given: An article with `published = false` exists at slug "draft-article"
- When: An anonymous user visits `/artikkelit/draft-article`
- Then: They receive a 404 response

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

### Markdown Dependencies

Already available in the monorepo (Astro built-ins):
- `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`
- `rehype-stringify`

No new dependencies needed.

### File Locations

```
packages/design-system/src/styles/components/
  └── article.css              ← NEW: Article page template

apps/design-system/src/pages/
  └── article.astro            ← NEW: DS documentation page

packages/database/src/schemas/
  └── core.ts                  ← UPDATE: Add ArticleSchema

packages/database/src/
  └── queries.ts               ← UPDATE: Add article queries

apps/main-site/src/
  ├── lib/
  │   └── markdown.ts          ← NEW: Markdown renderer
  ├── pages/
  │   └── artikkelit/
  │       ├── index.astro      ← NEW: Article listing
  │       └── [slug].astro     ← NEW: Article detail
  └── i18n/
      └── ui.ts                ← UPDATE: Article translation keys
```

### Admin CRUD

Out of scope for this spec. Article creation/editing will be a separate PBI. For initial content, seed data or direct SQL is acceptable.

---

## 4. Future Considerations

**Out of Scope:**
- Admin CRUD pages for articles (separate PBI)
- Article categories / tagging system
- Related articles component
- Article search
- Optional `author_id` FK to creators table
- Cover images / hero images
- Reading time estimate
- Table of contents generation

---

**Spec Status:** Approved
**Created:** 2026-02-09
**Linear Issue:** [ROO-62](https://linear.app/pelilauta/issue/ROO-62/feature-article-page)
**Owner:** @Architect
