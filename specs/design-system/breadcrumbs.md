# Spec: Breadcrumbs Component (ROO-44)

## 1. Blueprint (Design)

### Context
> **Goal:** A reusable, accessible breadcrumb trail component in Kide, with
> co-located JSON-LD structured data for AEO.
> **Why:** Detail pages need structural context for orientation and SEO. The
> current `.back-nav` link is a one-way affordance; breadcrumbs expose the full
> hierarchy. `BreadcrumbList` structured data boosts Answer Engine discoverability.
> **Architectural Impact:** New Astro component + CSS module in
> `packages/design-system`. New doc page in `apps/design-system`. Consuming
> detail pages in `apps/main-site` adopt the component and retire `.back-nav`.

### Data Architecture

**No database changes.** The component is purely presentational. Item data is
constructed in each consuming page's Astro frontmatter and passed as props.

### UI Architecture

**Files:**
- Component: `packages/design-system/src/components/Breadcrumbs.astro`
- CSS: `packages/design-system/src/styles/components/breadcrumbs.css`
- Doc page: `apps/design-system/src/pages/breadcrumbs.astro`
- Export: via existing `"./components/*"` wildcard (component) +
  explicit `"./components/breadcrumbs.css"` entry in `package.json` (CSS)

**Props:**
```typescript
interface Props {
  /** Ordered trail. Last item must omit `href` (current page). */
  items: { label: string; href?: string }[];
}
```

- Minimum two items to render. A single-item array is a no-op: nothing renders,
  no JSON-LD emitted.
- The caller builds the full trail; the component does not inject "Home"
  automatically (keeps it locale-agnostic).

**Rendered structure (BEM):**
```html
<nav aria-label="Breadcrumb">
  <ol class="breadcrumbs">
    <li class="breadcrumbs__item">
      <a href="/" class="breadcrumbs__link">Kotisivu</a>
    </li>
    <li class="breadcrumbs__item">
      <a href="/tuotteet" class="breadcrumbs__link">Tuotteet</a>
    </li>
    <li class="breadcrumbs__item breadcrumbs__item--current" aria-current="page">
      Myrskyn aika
    </li>
  </ol>
</nav>
<script type="application/ld+json">{ BreadcrumbList }</script>
```

**Chevron separator:** CSS-only via `::after` pseudo-element on
`.breadcrumbs__item` (excluded on `--current`). No extra DOM node.

**JSON-LD:** The component emits a `BreadcrumbList` block derived from the same
`items` prop. Consuming pages must not duplicate this; the structured data lives
here.

**Mobile:** Items wrap naturally. No collapse-to-"Back" behaviour (deferred).

### Anti-Patterns
- **NEVER** hardcode labels inside the component. Callers source all labels from
  `ui.ts`.
- **NEVER** auto-inject a "Home" item. The caller owns the full trail.
- **NEVER** emit a second `BreadcrumbList` JSON-LD block from the consuming page.
  The component is the single source.

---

## 2. Contract (Quality)

### Definition of Done

**Design System delivery:**
- [ ] `Breadcrumbs.astro` created at `packages/design-system/src/components/Breadcrumbs.astro`
- [ ] `breadcrumbs.css` created at `packages/design-system/src/styles/components/breadcrumbs.css`
- [ ] `breadcrumbs.css` exported in `packages/design-system/package.json`
- [ ] `<nav aria-label="Breadcrumb">` wraps an `<ol>` with BEM classes
- [ ] Current-page item: no link, carries `aria-current="page"` and
  `breadcrumbs__item--current`
- [ ] Chevron separator via CSS only (`::after`), absent on current item
- [ ] `BreadcrumbList` JSON-LD emitted from the component
- [ ] Single-item guard: component renders nothing when `items.length < 2`
- [ ] Doc page at `apps/design-system/src/pages/breadcrumbs.astro` — live demo,
  props table, usage example, CSS class reference (dogfoods own component)
- [ ] E2E test in `apps/design-system` verifies: nav present, correct item count,
  current-page item has no link

**Main-site integration:**
- [ ] `breadcrumb.home` translation key added to `ui.ts` (fi / sv / en)
- [ ] Breadcrumbs integrated on `/tuotteet/[slug]`, `/kustantajat/[slug]`,
  `/tekijat/[slug]`
- [ ] `.back-nav` removed from those pages in the same commit
- [ ] E2E test on main-site verifies: breadcrumbs present on a detail page,
  absent on `/`

### Regression Guardrails
- Existing `Product` / `Book` JSON-LD on detail pages is untouched;
  `BreadcrumbList` is additive
- i18n routing (/, /sv, /en) continues to work; breadcrumb labels reflect locale
- No layout shift: breadcrumbs render in the content column, before `<h1>`

### Scenarios (Gherkin)

**Scenario: Breadcrumbs render on product detail page**
- Given: User navigates to `/tuotteet/[slug]` for a valid product
- When: Page loads
- Then: `<nav aria-label="Breadcrumb">` is visible above `<h1>`
- And: Trail reads: [Home] > Tuotteet > [Product Title]
- And: Home and Tuotteet are links; Product Title has no link,
  carries `aria-current="page"`

**Scenario: Breadcrumbs render on publisher and creator detail pages**
- Given: User navigates to `/kustantajat/[slug]` or `/tekijat/[slug]`
- When: Page loads
- Then: Trail structure and link behaviour match the product detail pattern,
  with the correct section label and entity name

**Scenario: Breadcrumbs are absent on home and listing pages**
- Given: User navigates to `/` or `/tuotteet`
- When: Page loads
- Then: No `<nav aria-label="Breadcrumb">` is present in the DOM

**Scenario: BreadcrumbList JSON-LD is present on detail page**
- Given: User navigates to `/tuotteet/[slug]`
- When: Page source is inspected
- Then: A `<script type="application/ld+json">` block contains a valid
  `BreadcrumbList` with `ListItem` entries matching the visible trail

**Scenario: Single-item array is a no-op**
- Given: `Breadcrumbs` is rendered with an `items` array of length 1
- When: Component evaluates
- Then: No `<nav>` is rendered and no JSON-LD is emitted

---

## 3. Implementation Notes

### Consuming-page pattern

```astro
---
import Breadcrumbs from '@roolipeli/design-system/components/Breadcrumbs.astro';
import { useTranslations } from '../../i18n/utils';

const t = useTranslations(lang);

const breadcrumbs = [
  { label: t('breadcrumb.home'), href: '/' },
  { label: t('nav.products.label'), href: '/tuotteet' },
  { label: product.title },   // ← no href = current page
];
---

<Layout title={title} lang={lang}>
  <Breadcrumbs items={breadcrumbs} />
  <h1>{product.title}</h1>
  ...
</Layout>
```

### Translation keys to add

| Key | fi | sv | en |
|-----|----|----|-----|
| `breadcrumb.home` | Kotisivu | Startsida | Home |

Section labels reuse existing `nav.products.label`, `nav.publishers.label`,
`nav.creators.label`.

### Relationship to layout-and-navigation spec

`specs/design-system/layout-and-navigation.md` §2.3, §3, and PBI-002 originally
contained the breadcrumb sketch. Those sections have been trimmed to pointers
to this file.

### Constitution

Commits touching `packages/design-system` require `ALLOW_DS_EDIT=true`.
