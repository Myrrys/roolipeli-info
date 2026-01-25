# PBI-018: Products CRUD

> **Spec Reference:** `specs/admin-ui/spec.md`
> **Persona:** @Dev
> **Version:** 0.4.0
> **Depends On:** PBI-016, PBI-017 (reuses components, needs publishers/creators to exist)

---

## 1. The Directive

Implement full CRUD operations for products in the admin UI, including publisher and creator relations.

**In Scope:**
- Product list page with table
- Create product form with:
  - Publisher selection (dropdown)
  - Creator assignment (multi-select with roles)
  - All metadata fields
- Edit product form (including relation editing)
- Delete product with confirmation
- Validation using Zod schemas
- Cascade delete of creator links

**Out of Scope:**
- Product images (no image storage yet)
- Draft/publish workflow
- Version history

---

## 2. Context Pointers

- **Data Schema:**
  - `products` table (id, title, slug, publisher_id, product_type, year, isbn, description, lang)
  - `products_creators` join table (product_id, creator_id, role)
- **Validation:** `ProductSchema` from `@roolipeli/database`
- **Styling:** Reuse admin styles and components

---

## 3. Verification Pointers

- **Success Criteria:**
  - List shows all products with publisher name
  - Create adds new product with relations
  - Edit updates product and its creator links
  - Delete removes product and its creator links
- **Quality Gate:** `pnpm tsc --noEmit && pnpm biome check .`

---

## 4. Task Checklist

### Form Components
- [ ] Create `apps/main-site/src/components/admin/PublisherSelect.astro`
  - Dropdown with all publishers
  - "No publisher" option
  - Pre-select for edit mode
- [ ] Create `apps/main-site/src/components/admin/CreatorMultiSelect.svelte`
  - Add multiple creators with roles
  - Each entry: Creator dropdown + Role input + Remove button
  - "Add another creator" button
  - Uses `client:load` for interactivity
- [ ] Create `apps/main-site/src/components/admin/ProductTypeSelect.astro`
  - Dropdown with product types: Core Rulebook, Adventure, Supplement, Zine, Quickstart, Other
- [ ] Create `apps/main-site/src/components/admin/LangSelect.astro`
  - Dropdown with languages: fi, sv, en

### List Page
- [ ] Create `apps/main-site/src/pages/admin/products/index.astro`
- [ ] Fetch all products with publisher data
- [ ] Display in DataTable with columns: Title, Publisher, Type, Year, Actions
- [ ] "Add Product" button linking to `/admin/products/new`
- [ ] Each row has Edit and Delete actions

### Create Form
- [ ] Create `apps/main-site/src/pages/admin/products/new.astro`
- [ ] Form fields:
  - Title (text, required)
  - Slug (text, auto-generated, editable)
  - Publisher (select, optional)
  - Product Type (select, required)
  - Year (number, optional)
  - ISBN (text, optional)
  - Language (select, required, default: fi)
  - Description (textarea, optional)
  - Creators (multi-select with roles)
- [ ] Slug auto-generation from title
- [ ] Form validation using `ProductSchema`
- [ ] On success:
  1. Insert product
  2. Insert creator links to `products_creators`
  3. Redirect to list with success flash
- [ ] On error: re-render form with errors

### Edit Form
- [ ] Create `apps/main-site/src/pages/admin/products/[id]/edit.astro`
- [ ] Load existing product with publisher and creators
- [ ] Pre-fill all form fields including creator list
- [ ] Form validation using `ProductSchema`
- [ ] On success:
  1. Update product
  2. Delete existing creator links
  3. Insert new creator links
  4. Redirect to list with success flash
- [ ] On error: re-render form with errors
- [ ] Handle 404 if product not found

### Delete Action
- [ ] Create delete handler
- [ ] Delete creator links first (cascade)
- [ ] Delete product
- [ ] Redirect with success flash
- [ ] Reuse DeleteConfirm modal

### API/Actions
- [ ] Create POST handler for create (product + creator links)
- [ ] Create POST handler for update (product + creator links)
- [ ] Create POST handler for delete (cascade)
- [ ] All handlers validate auth
- [ ] All handlers use Zod validation

### Translation Keys
- [ ] Add to `i18n/ui.ts`:
  - `admin.products.title`
  - `admin.products.add`
  - `admin.products.edit`
  - `admin.products.delete`
  - `admin.products.confirmDelete`
  - `admin.form.productTitle`
  - `admin.form.publisher`
  - `admin.form.noPublisher`
  - `admin.form.productType`
  - `admin.form.year`
  - `admin.form.isbn`
  - `admin.form.language`
  - `admin.form.creators`
  - `admin.form.addCreator`
  - `admin.form.creatorRole`

---

## 5. Refinement Rule

If reality diverges from the Spec:
- [ ] STOP and flag for @Architect review
- [ ] Document the divergence in this PBI
- [ ] Do NOT update Spec without explicit approval

---

## 6. Commit Template

```
feat(admin): add product CRUD with relations

- Created product list page with publisher data
- Created product create/edit forms with:
  - Publisher selection dropdown
  - Multi-select creator assignment with roles
  - All metadata fields (type, year, ISBN, lang, description)
- Added delete with cascade to creator links
- Validation using Zod ProductSchema

Part of v0.4.0 Admin UI release
```
