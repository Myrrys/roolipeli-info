# Spec: Visual Entity Identity — Cover Images (ROO-37, ROO-72)

## 1. Blueprint (Design)

### Context
> **Goal:** Create a standardized `EntityCover` CSS component in Kide for displaying book/product cover images on detail pages, with graceful fallback when no image is available.
> **Why:** The site is a visual database of Finnish RPG products. Currently, product detail pages are text-only. A cover image is the primary visual anchor — critical for recognition, browsability, and a professional catalog experience. Reference: [Finna.fi record layout](https://www.finna.fi/Record/fikka.4205811).
> **Architectural Impact:** `packages/design-system` (CSS module + Astro component), `apps/main-site` (product detail page integration, admin upload), Supabase (Storage bucket + DB migration), `@roolipeli/database` (Zod schema update).

### Data Architecture

**ROO-37 (component):** No schema changes. The component is data-source agnostic — accepts any image via `<img>` or displays a placeholder.

**ROO-72 (storage + data model):**

**Migration: Add `cover_image_path` to `products`**

```sql
ALTER TABLE products ADD COLUMN cover_image_path TEXT;
```

**Supabase Storage Bucket: `covers`**
- Public read, admin write
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Path convention: `{product_id}/{filename}` (e.g., `abc-123/cover.webp`)

**Bucket Creation:**

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('covers', 'covers', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
```

**Storage RLS Policies:**

```sql
-- Anyone can view covers (public bucket)
CREATE POLICY "Public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');

-- Only admins can upload/modify/delete covers
CREATE POLICY "Admin insert access" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'covers'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin update access" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'covers'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin delete access" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'covers'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

**Zod Schema Update:**

```typescript
// Add to ProductSchema in packages/database/src/schemas/core.ts
cover_image_path: z.string().nullable().optional(),
```

**Public URL Construction:**

```typescript
const coverUrl = product.cover_image_path
  ? supabase.storage.from('covers').getPublicUrl(product.cover_image_path).data.publicUrl
  : undefined;
```

### UI Architecture

**New Component:** `packages/design-system/src/styles/components/entity-cover.css`

**BEM Structure:**
```
.entity-cover              — Container (constrains aspect ratio)
.entity-cover__image       — The <img> element
.entity-cover__placeholder — Fallback when no image (icon + text)
```

**Placement:** On the product detail page (`tuotteet/[slug].astro`), the cover appears at the top of the left column (above the existing metadata card), within the existing `product-layout` grid.

**Design Specifications:**

| Property | Value | Token |
|----------|-------|-------|
| Container width | 100% of grid column (300px on desktop) | Inherits from parent grid |
| Aspect ratio | 1 : 1.414 (ISO 216 / A-series paper) | Hardcoded ratio — standard for books |
| Border radius | `--kide-radius-md` | 8px |
| Border | 1px solid `--kide-border-subtle` | #e2e8f0 |
| Background (placeholder) | `--kide-paper-dark` | #f1f5f9 |
| Shadow | `--kide-shadow-soft` | Existing token |
| Image fit | `object-fit: cover` | — |
| Image position | `object-position: top center` | — |

**Placeholder Design:**
When no image is available, display a centered placeholder with:
- A book icon (CSS-only, using a simple bordered rectangle shape or the text "📖" as content)
- Text: "Ei kansikuvaa" (no cover image) in `--kide-ink-muted`
- Font: `--kide-font-sans`, `--kide-font-size-sm`
- The placeholder must fill the same aspect ratio container as a real image

**Responsive Behavior:**
- **Desktop (≥769px):** Cover in the left column, 300px wide, metadata below it
- **Mobile (<769px):** Cover spans full width, centered, with max-width of 300px

**Data Flow:**
```
Astro Frontmatter (SSR)
  ↓
product.cover_image_path (future) → Supabase Storage public URL
  ↓
<img> element with src, alt, loading="lazy"
  ↓
If no src → render .entity-cover__placeholder instead
```

### Image Optimization (ROO-72)

- Configure `image.domains` in `apps/main-site/astro.config.mjs` to allowlist Supabase Storage hostname
- Replace `<img>` with Astro `<Image>` in `EntityCover.astro` for automatic WebP/AVIF conversion and responsive `srcset`
- Sharp is already a transitive dependency (no new install needed)

### Admin Upload UI (ROO-72)

- Add file upload field to `ProductForm.astro` (below title/slug, before metadata fields)
- Upload to `covers/{product_id}/` on form save via Supabase Storage client
- Show image preview after file selection
- Handle replace: delete old file before uploading new one
- Validate client-side: file size (5MB max), MIME type (jpeg/png/webp)

### Anti-Patterns
- **NEVER** use JavaScript for aspect ratio enforcement (CSS `aspect-ratio` property only)
- **NEVER** hardcode image dimensions in pixels on the `<img>` tag (use CSS container)
- **NEVER** skip the `alt` attribute — must describe the product (e.g., "Myrskyn aika -kirjan kansi")
- **NEVER** use inline styles for the cover component
- **NEVER** fetch images client-side — URLs are resolved server-side in Astro frontmatter
- **NEVER** use `!important` to override cover styles

---

## 2. Contract (Quality)

### Definition of Done

- [ ] `entity-cover.css` created at `packages/design-system/src/styles/components/entity-cover.css`
- [ ] CSS uses only `--kide-*` design tokens (no hardcoded values)
- [ ] `entity-cover.css` exported from `packages/design-system/package.json`
- [ ] Aspect ratio uses CSS `aspect-ratio: 1 / 1.414`
- [ ] `object-fit: cover` on image element prevents distortion
- [ ] Placeholder renders when no image is present
- [ ] Placeholder fills identical container dimensions as a real image
- [ ] Component documented in `apps/design-system` docs with both image and placeholder states
- [ ] Responsive: image constrains to max-width on mobile
- [ ] Accessible: placeholder is not announced as a broken image by screen readers
- [ ] E2E test in `apps/design-system/tests/e2e/` verifies component renders

#### ROO-72: Storage + Image Optimization

**Infrastructure:**
- [ ] `covers` bucket created in Supabase Storage (public read, admin write)
- [ ] Storage RLS policies: SELECT for anon, INSERT/UPDATE/DELETE for admin
- [ ] File size limit (5MB) and MIME type restriction enforced

**Database:**
- [ ] `cover_image_path` column added to `products` table (nullable text)
- [ ] Supabase types regenerated (`supabase gen types`)
- [ ] Zod schema updated in `@roolipeli/database`

**Image Delivery:**
- [ ] `image.domains` configured in `astro.config.mjs` for Supabase Storage hostname
- [ ] EntityCover uses Astro `<Image>` for format conversion + srcset
- [ ] No CLS — container reserves space via existing aspect-ratio

**Integration:**
- [ ] `cover_image_path` wired into product detail query
- [ ] Public URL constructed via `supabase.storage.from('covers').getPublicUrl(path)`
- [ ] Products with covers render optimized images
- [ ] Products without covers show existing placeholder

**Admin:**
- [ ] File upload field in product admin form
- [ ] Upload to `covers` bucket on save
- [ ] Image preview after file selection
- [ ] Replace existing cover (delete old + upload new)

**Quality:**
- [ ] E2E test verifying cover renders on a product detail page
- [ ] `pnpm biome check .` passes
- [ ] `pnpm tsc --noEmit` passes

### Regression Guardrails

**Invariants:**
- Existing card, tag, and layout components must not be affected
- The product detail page grid (`product-layout`) must not break when cover is added
- No new design tokens are required (uses existing `--kide-*` tokens)
- The component must gracefully handle: missing image, broken URL, slow-loading image
- `aspect-ratio` must be preserved regardless of actual image dimensions

### Scenarios (Gherkin)

**Scenario: Product detail page shows cover image**
- **Given:** A product has a cover image URL
- **When:** User visits `/tuotteet/{slug}`
- **Then:**
  - Cover image renders in the left column above the metadata card
  - Image maintains 1:1.414 aspect ratio
  - Image has `alt` text describing the product
  - Image uses `loading="lazy"` for performance

**Scenario: Product detail page shows placeholder (no cover)**
- **Given:** A product has no cover image
- **When:** User visits `/tuotteet/{slug}`
- **Then:**
  - Placeholder container renders with identical dimensions to a real cover
  - Placeholder shows book icon and "Ei kansikuvaa" text
  - Placeholder has `--kide-paper-dark` background
  - No broken image icon is visible

**Scenario: Cover image loading on slow connection**
- **Given:** A product has a cover image and the connection is slow
- **When:** User visits the product detail page
- **Then:**
  - The placeholder/container area is visible immediately (no layout shift)
  - Image loads progressively and replaces the placeholder area
  - No Cumulative Layout Shift (CLS) occurs

**Scenario: Design system docs show EntityCover examples**
- **Given:** User navigates to design-system documentation
- **When:** The page loads
- **Then:**
  - Both states are demonstrated: with image and placeholder
  - The component section shows correct BEM class names
  - The aspect ratio is visually correct (book proportions)

**Scenario: Cover renders correctly on mobile**
- **Given:** User is on a mobile device (viewport < 769px)
- **When:** User visits a product detail page with a cover image
- **Then:**
  - Cover displays above the metadata (stacked layout)
  - Cover is centered with max-width: 300px
  - Aspect ratio is preserved

**Scenario: Screen reader encounters placeholder**
- **Given:** A product has no cover image
- **When:** Screen reader encounters the placeholder
- **Then:**
  - Placeholder container has `role="img"` and `aria-label` describing the absence
  - No `<img>` with broken `src` is rendered
  - The decorative book icon is hidden from assistive technology (`aria-hidden="true"`)

**Scenario: Admin uploads cover image for a product (ROO-72)**
- **Given:** Admin is editing a product at `/admin/products/[id]/edit`
- **When:** Admin selects a JPEG file in the cover upload field
- **And:** Admin saves the form
- **Then:** Image is uploaded to Supabase Storage `covers` bucket
- **And:** `product.cover_image_path` is set to the storage path
- **And:** Product detail page renders the optimized cover image

**Scenario: Admin replaces existing cover image (ROO-72)**
- **Given:** Product already has a cover image
- **When:** Admin selects a new file and saves
- **Then:** Old file is deleted from storage
- **And:** New file is uploaded
- **And:** `cover_image_path` is updated

**Scenario: Cover image served in optimized format (ROO-72)**
- **Given:** Product has a cover image in JPEG format
- **When:** User visits the product detail page
- **Then:** Image is served as WebP or AVIF via Astro Image
- **And:** Responsive `srcset` is generated
- **And:** No layout shift occurs during load

**Scenario: Admin upload rejects invalid file (ROO-72)**
- **Given:** Admin is on the product edit form
- **When:** Admin selects a 10MB PNG file
- **Then:** Upload is rejected with file size error
- **When:** Admin selects a `.gif` file
- **Then:** Upload is rejected with invalid format error

### Accessibility Requirements

**WCAG AA Compliance:**
- `alt` text required on all `<img>` elements
- Placeholder uses `role="img"` with descriptive `aria-label`
- Decorative elements hidden with `aria-hidden="true"`
- No information conveyed by image alone (title/metadata always present in text)
- Sufficient contrast: placeholder text (`--kide-ink-muted` #5a6577) on `--kide-paper-dark` (#f1f5f9) = 4.23:1 (AA for large text, borderline for small — use `--kide-font-size-sm` 14px which qualifies as normal text). **Decision:** Use `--kide-ink-primary` (#1e293b) for placeholder text to guarantee AA at any size (12.85:1 on `--kide-paper-dark`).

---

## 3. Implementation Notes

### Markup Pattern (for detail page)

```html
<!-- With image -->
<div class="entity-cover">
  <img
    class="entity-cover__image"
    src="{coverUrl}"
    alt="{product.title} -kirjan kansi"
    loading="lazy"
  />
</div>

<!-- Without image (placeholder) -->
<div class="entity-cover entity-cover--placeholder" role="img" aria-label="Ei kansikuvaa">
  <div class="entity-cover__placeholder" aria-hidden="true">
    <span class="entity-cover__placeholder-icon">📖</span>
    <span class="entity-cover__placeholder-text">Ei kansikuvaa</span>
  </div>
</div>
```

### CSS Module Structure

```css
/* entity-cover.css */
.entity-cover { /* Container with aspect-ratio */ }
.entity-cover__image { /* object-fit: cover */ }
.entity-cover--placeholder { /* Background color */ }
.entity-cover__placeholder { /* Centering flex layout */ }
.entity-cover__placeholder-icon { /* Icon sizing */ }
.entity-cover__placeholder-text { /* Label styling */ }
```

### Package.json Export

Add to `packages/design-system/package.json`:
```json
"./components/entity-cover.css": "./src/styles/components/entity-cover.css"
```

### Integration with Product Detail Page

The existing `product-layout` grid in `[slug].astro` already has a 300px left column. The cover will be inserted as a new element before the metadata `<section>`, wrapped in the same grid column. This may require a minor restructure of the grid to stack cover + metadata in the left column:

```
Left Column (300px)     | Right Column (1fr)
─────────────────────── | ──────────────────
.entity-cover           | .content (description, creators)
.metadata.card          | .references.card
```

**Note:** The actual integration into `[slug].astro` is a separate implementation step and should reference this spec for markup patterns.

---

## 4. Scope Boundaries

### In Scope
- **[ROO-37]** `entity-cover.css` CSS module + `EntityCover.astro` component in Kide (DONE)
- **[ROO-72]** Storage bucket, DB migration, Astro Image optimization, admin upload, product page integration

### Out of Scope (Future PBIs)
- **Card thumbnail** — Adding image slot to `card.css` for listing pages
- **"Look inside" overlay** — Detail view / lightbox on click
- **Zoom / pan interaction** — Beyond static display
- **Bulk image import** — Batch upload for multiple products

---

## 5. References

- **Linear Issue:** [ROO-37](https://linear.app/pelilauta/issue/ROO-37) (component)
- **Follow-up:** [ROO-72](https://linear.app/pelilauta/issue/ROO-72) (storage + image optimization)
- **Design Reference:** [Finna.fi Record](https://www.finna.fi/Record/fikka.4205811) — Cover image placement and hierarchy
- **Parent Spec:** `specs/design-system/spec.md` — Kide Design System
- **Related Spec:** `specs/roo-28-kide-features/spec.md` — Card and grid features
- **ISO 216:** A-series paper ratio (1:√2 ≈ 1:1.414) — standard for book covers

---

**Spec Status:** Live
**Last Updated:** 2026-02-12 (ROO-73: added bucket creation SQL)
**Owner:** @Architect
