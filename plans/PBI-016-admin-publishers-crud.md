# PBI-016: Publishers CRUD

> **Spec Reference:** `specs/admin-ui/spec.md`
> **Persona:** @Dev
> **Version:** 0.4.0
> **Depends On:** PBI-015

---

## 1. The Directive

Implement full CRUD operations for publishers in the admin UI.

**In Scope:**
- Publisher list page with table
- Create publisher form
- Edit publisher form
- Delete publisher with confirmation
- Validation using Zod schemas
- Referential integrity protection (can't delete if has products)

**Out of Scope:**
- Creator CRUD (see PBI-017)
- Product CRUD (see PBI-018)

---

## 2. Context Pointers

- **Data Schema:** `publishers` table (id, name, slug, description)
- **Validation:** `PublisherSchema` from `@roolipeli/database`
- **Styling:** Use admin styles from PBI-015

---

## 3. Verification Pointers

- **Success Criteria:**
  - List shows all publishers
  - Create adds new publisher
  - Edit updates existing publisher
  - Delete removes publisher (only if no linked products)
- **Quality Gate:** `pnpm tsc --noEmit && pnpm biome check .`

---

## 4. Task Checklist

### Shared Components
- [ ] Create `apps/main-site/src/components/admin/DataTable.astro`
  - Props: columns, rows, actions
  - Sortable headers (optional)
  - Edit/Delete action buttons per row
- [ ] Create `apps/main-site/src/components/admin/FormField.astro`
  - Props: name, label, type, value, error, required
  - Error message display
  - Accessibility: label + aria-describedby
- [ ] Create `apps/main-site/src/components/admin/DeleteConfirm.svelte`
  - Modal dialog
  - Confirm/Cancel buttons
  - Uses `client:load` for interactivity

### List Page
- [ ] Create `apps/main-site/src/pages/admin/publishers/index.astro`
- [ ] Fetch all publishers from database
- [ ] Display in DataTable with columns: Name, Slug, Actions
- [ ] "Add Publisher" button linking to `/admin/publishers/new`
- [ ] Each row has Edit and Delete actions

### Create Form
- [ ] Create `apps/main-site/src/pages/admin/publishers/new.astro`
- [ ] Form fields:
  - Name (text, required)
  - Slug (text, auto-generated, editable)
  - Description (textarea, optional)
- [ ] Slug auto-generation from name (client-side JS or server-side)
- [ ] Form validation using `PublisherSchema`
- [ ] On success: redirect to list with success flash
- [ ] On error: re-render form with errors

### Edit Form
- [ ] Create `apps/main-site/src/pages/admin/publishers/[id]/edit.astro`
- [ ] Load existing publisher data
- [ ] Pre-fill form fields
- [ ] Form validation using `PublisherSchema`
- [ ] On success: redirect to list with success flash
- [ ] On error: re-render form with errors
- [ ] Handle 404 if publisher not found

### Delete Action
- [ ] Create delete handler (API route or form action)
- [ ] Check if publisher has linked products
  - If yes: show error, prevent deletion
  - If no: delete and redirect with success flash
- [ ] DeleteConfirm modal for UX

### API/Actions
- [ ] Create POST handler for create: `/api/admin/publishers` or Astro action
- [ ] Create POST handler for update: `/api/admin/publishers/[id]` or Astro action
- [ ] Create POST handler for delete: `/api/admin/publishers/[id]/delete` or Astro action
- [ ] All handlers validate auth (double-check middleware)
- [ ] All handlers use Zod validation

### Translation Keys
- [ ] Add to `i18n/ui.ts`:
  - `admin.publishers.title`
  - `admin.publishers.add`
  - `admin.publishers.edit`
  - `admin.publishers.delete`
  - `admin.publishers.confirmDelete`
  - `admin.publishers.cannotDelete` (has products)
  - `admin.form.name`
  - `admin.form.slug`
  - `admin.form.description`
  - `admin.form.save`
  - `admin.form.cancel`

---

## 5. Refinement Rule

If reality diverges from the Spec:
- [ ] STOP and flag for @Architect review
- [ ] Document the divergence in this PBI
- [ ] Do NOT update Spec without explicit approval

---

## 6. Commit Template

```
feat(admin): add publisher CRUD

- Created publisher list page with data table
- Created publisher create/edit forms
- Added delete with referential integrity check
- Validation using Zod PublisherSchema

Part of v0.4.0 Admin UI release
```
