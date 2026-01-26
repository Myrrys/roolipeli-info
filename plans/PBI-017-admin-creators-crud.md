# PBI-017: Creators CRUD

> **Spec Reference:** `specs/admin-ui/spec.md`
> **Persona:** @Dev
> **Version:** 0.4.0
> **Depends On:** PBI-015, PBI-016 (reuses components)

---

## 1. The Directive

Implement full CRUD operations for creators in the admin UI.

**In Scope:**
- Creator list page with table
- Create creator form
- Edit creator form
- Delete creator with confirmation
- Validation using Zod schemas
- Referential integrity protection (can't delete if linked to products)

**Out of Scope:**
- Product CRUD (see PBI-018)

---

## 2. Context Pointers

- **Data Schema:** `creators` table (id, name, slug)
- **Validation:** `CreatorSchema` from `@roolipeli/database`
- **Styling:** Reuse admin styles and components from PBI-015, PBI-016

---

## 3. Verification Pointers

- **Success Criteria:**
  - List shows all creators
  - Create adds new creator
  - Edit updates existing creator
  - Delete removes creator (only if not linked to products)
- **Quality Gate:** `pnpm tsc --noEmit && pnpm biome check .`

---

## 4. Task Checklist

### List Page
- [ ] Create `apps/main-site/src/pages/admin/creators/index.astro`
- [ ] Fetch all creators from database
- [ ] Display in DataTable with columns: Name, Slug, Actions
- [ ] "Add Creator" button linking to `/admin/creators/new`
- [ ] Each row has Edit and Delete actions

### Create Form
- [ ] Create `apps/main-site/src/pages/admin/creators/new.astro`
- [ ] Form fields:
  - Name (text, required)
  - Slug (text, auto-generated, editable)
- [ ] Slug auto-generation from name
- [ ] Form validation using `CreatorSchema`
- [ ] On success: redirect to list with success flash
- [ ] On error: re-render form with errors

### Edit Form
- [ ] Create `apps/main-site/src/pages/admin/creators/[id]/edit.astro`
- [ ] Load existing creator data
- [ ] Pre-fill form fields
- [ ] Form validation using `CreatorSchema`
- [ ] On success: redirect to list with success flash
- [ ] On error: re-render form with errors
- [ ] Handle 404 if creator not found

### Delete Action
- [ ] Create delete handler
- [ ] Check if creator is linked to any products (via products_creators)
  - If yes: show error, prevent deletion
  - If no: delete and redirect with success flash
- [ ] Reuse DeleteConfirm modal

### API/Actions
- [ ] Create POST handler for create
- [ ] Create POST handler for update
- [ ] Create POST handler for delete
- [ ] All handlers validate auth
- [ ] All handlers use Zod validation

### Translation Keys
- [ ] Add to `i18n/ui.ts`:
  - `admin.creators.title`
  - `admin.creators.add`
  - `admin.creators.edit`
  - `admin.creators.delete`
  - `admin.creators.confirmDelete`
  - `admin.creators.cannotDelete` (linked to products)

---

## 5. Refinement Rule

If reality diverges from the Spec:
- [ ] STOP and flag for @Architect review
- [ ] Document the divergence in this PBI
- [ ] Do NOT update Spec without explicit approval

---

## 6. Commit Template

```
feat(admin): add creator CRUD

- Created creator list page with data table
- Created creator create/edit forms
- Added delete with referential integrity check
- Validation using Zod CreatorSchema

Part of v0.4.0 Admin UI release
```
