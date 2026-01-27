# Spec: Admin UI (Data Management)

## 1. Blueprint (Design)

### Context
> **Goal:** Provide a web-based interface for non-technical admins to manage catalog data (products, publishers, creators).
> **Why:** The current JSON + CLI workflow is developer-only. The @Librarian persona needs a proper UI to maintain the canonical database.
> **Architectural Impact:** Adds protected `/admin/*` routes to `apps/main-site`, introduces Supabase Auth, and requires authenticated API endpoints.

### Authentication Strategy

**Provider:** Supabase Auth with Magic Link (passwordless email)

**Why Magic Link:**
- No passwords to manage or forget
- No password reset flow needed
- More secure (no credentials to leak)
- Simple UX: enter email → click link → logged in

**User Roles:**
| Role | Permissions | Implementation |
|------|-------------|----------------|
| `admin` | Full CRUD on all entities | Supabase RLS + custom claims |
| `editor` | CRUD on products only (future) | Deferred to v0.5+ |
| `anonymous` | Read-only public catalog | Existing behavior |

**Auth Flow:**
1. User navigates to `/admin`
2. If not authenticated → redirect to `/admin/login`
3. User enters email → Supabase sends magic link
4. User clicks link in email → redirected to `/admin/auth/callback`
5. Callback validates `next` parameter (relative path only)
6. Callback exchanges token for session
7. Session stored in HTTP-only cookie
8. User redirected to `/admin` dashboard

### Data Architecture

**No schema changes.** Uses existing tables:
- `publishers` (id, name, slug, description)
- `creators` (id, name, slug)
- `products` (id, title, slug, publisher_id, product_type, year, isbn, description, lang)
- `products_creators` (product_id, creator_id, role)

**RLS Policies (New):**
```sql
-- Admins can INSERT/UPDATE/DELETE
CREATE POLICY "Admins can manage publishers"
  ON publishers FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Similar for creators, products, products_creators
```

### UI Architecture

#### Routes

```
/admin                     → Dashboard (entity counts, quick actions)
/admin/login               → Magic link request form (email input)
/admin/auth/callback       → Token exchange after clicking magic link
/admin/logout              → Logout action

/admin/products            → Product list (table with edit/delete)
/admin/products/new        → Create product form
/admin/products/[id]/edit  → Edit product form

/admin/publishers          → Publisher list
/admin/publishers/new      → Create publisher form
/admin/publishers/[id]/edit → Edit publisher form

/admin/creators            → Creator list
/admin/creators/new        → Create creator form
/admin/creators/[id]/edit  → Edit creator form
```

#### Components

**Shared Admin Components:**
- `AdminLayout.astro` - Admin shell with navigation sidebar
- `AdminNav.astro` - Sidebar navigation (Products, Publishers, Creators)
- `DataTable.astro` - Sortable table with actions column
- `FormField.astro` - Labeled input with error display
- `DeleteConfirm.svelte` - Confirmation modal (client-side)

**Form Components:**
- `ProductForm.astro` - Title, slug, type, year, publisher (select), creators (multi-select), etc.
- `PublisherForm.astro` - Name, slug, description
- `CreatorForm.astro` - Name, slug

#### Data Flow

```
Admin Form (SSR)
  ↓
POST to Astro API route (/api/admin/products)
  ↓
Validate with Zod (from @roolipeli/database)
  ↓
Supabase mutation (with service role or user JWT)
  ↓
Redirect to list with success/error message
```

### File Structure

```
apps/main-site/src/
├── pages/
│   └── admin/
│       ├── index.astro           # Dashboard
│       ├── login.astro           # Login form
│       ├── logout.ts             # Logout endpoint
│       ├── products/
│       │   ├── index.astro       # Product list
│       │   ├── new.astro         # Create form
│       │   └── [id]/
│       │       └── edit.astro    # Edit form
│       ├── publishers/
│       │   ├── index.astro
│       │   ├── new.astro
│       │   └── [id]/edit.astro
│       └── creators/
│           ├── index.astro
│           ├── new.astro
│           └── [id]/edit.astro
├── layouts/
│   └── AdminLayout.astro
├── components/
│   └── admin/
│       ├── AdminNav.astro
│       ├── DataTable.astro
│       ├── FormField.astro
│       ├── DeleteConfirm.svelte
│       ├── ProductForm.astro
│       ├── PublisherForm.astro
│       └── CreatorForm.astro
├── middleware.ts                 # Auth check for /admin/*
└── lib/
    └── auth.ts                   # Supabase auth helpers
```

### Form Behavior

**Create Flow:**
1. User fills form
2. Slug auto-generated from title/name (editable)
3. Submit → validate → insert → redirect to list
4. On error → re-render form with error messages

**Edit Flow:**
1. Load existing entity data into form
2. User modifies fields
3. Submit → validate → update → redirect to list
4. On error → re-render form with error messages

**Delete Flow:**
1. User clicks delete on list row
2. Confirmation modal appears
3. Confirm → delete → redirect to list with success message
4. Cancel → close modal

### Slug Generation

Auto-generate from title/name:
```typescript
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with hyphen
    .replace(/^-|-$/g, '');          // Trim leading/trailing hyphens
}
```

Finnish characters: `ä→a`, `ö→o`, `å→a`

### Anti-Patterns

- **No client-side data fetching:** Forms are SSR, mutations via API routes
- **No inline styles:** Use admin-specific CSS with design tokens
- **No unvalidated input:** All mutations go through Zod schemas
- **No raw SQL:** Use Supabase client for all operations
- **No hardcoded admin emails:** Use Supabase user metadata for roles

---

## 2. Contract (Quality)

### Definition of Done

**Authentication:**
- [ ] Supabase Auth configured with email/password
- [ ] `/admin/*` routes protected by middleware
- [ ] Login/logout flows working
- [ ] Session persisted across page loads

**CRUD - Publishers:**
- [ ] List all publishers with edit/delete actions
- [ ] Create new publisher with validation
- [ ] Edit existing publisher
- [ ] Delete publisher (with confirmation)
- [ ] Prevent delete if publisher has products (referential integrity)

**CRUD - Creators:**
- [ ] List all creators with edit/delete actions
- [ ] Create new creator with validation
- [ ] Edit existing creator
- [ ] Delete creator (with confirmation)
- [ ] Prevent delete if creator linked to products

**CRUD - Products:**
- [ ] List all products with edit/delete actions
- [ ] Create new product with:
  - [ ] Publisher selection (dropdown)
  - [ ] Creator assignment (multi-select with role)
  - [ ] All metadata fields (type, year, ISBN, lang, description)
- [ ] Edit existing product (including creator links)
- [ ] Delete product (cascades creator links)

**UX:**
- [ ] Success/error flash messages after mutations
- [ ] Form validation errors displayed inline
- [ ] Slug auto-generation with manual override
- [ ] Responsive admin layout (tablet-friendly minimum)

**Quality:**
- [ ] `pnpm biome check .` passes
- [ ] `pnpm tsc --noEmit` passes
- [ ] No `any` types in admin code
- [ ] All forms use Zod validation

### Regression Guardrails

- **Invariant:** Anonymous users cannot access `/admin/*`
- **Invariant:** Mutations require valid authentication
- **Invariant:** Slug uniqueness enforced (form shows error on conflict)
- **Invariant:** Referential integrity preserved (no orphaned relations)

### Scenarios (Gherkin)

**Scenario: Admin logs in via magic link**
- Given: User has admin email registered
- When: User navigates to `/admin`
- Then: Redirected to `/admin/login`
- When: User enters email and submits
- Then: "Check your email" message shown
- When: User clicks magic link in email
- Then: Redirected to `/admin/auth/callback`
- And: Session cookie is set
- And: Redirected to `/admin` dashboard

**Scenario: Admin creates a product**
- Given: Logged in admin on `/admin/products/new`
- When: Admin fills in title "Myrskyn Sankari"
- Then: Slug field auto-populates with "myrskyn-sankari"
- When: Admin selects publisher "Burger Games" from dropdown
- And: Admin adds creator "Eero Tuovinen" with role "Author"
- And: Admin submits form
- Then: Product is created in database
- And: Admin redirected to `/admin/products` with success message

**Scenario: Admin edits a publisher**
- Given: Publisher "Burgr Games" exists (typo)
- When: Admin navigates to `/admin/publishers/[id]/edit`
- And: Admin changes name to "Burger Games"
- And: Admin submits form
- Then: Publisher is updated in database
- And: Admin redirected to `/admin/publishers` with success message

**Scenario: Admin deletes a creator**
- Given: Creator "Test Person" exists with no linked products
- When: Admin clicks delete on `/admin/creators`
- Then: Confirmation modal appears
- When: Admin confirms deletion
- Then: Creator is removed from database
- And: Success message shown

**Scenario: Admin tries to delete publisher with products**
- Given: Publisher "Burger Games" has 5 linked products
- When: Admin clicks delete on `/admin/publishers`
- And: Admin confirms deletion
- Then: Error message: "Cannot delete publisher with linked products"
- And: Publisher remains in database

**Scenario: Unauthenticated user tries to access admin**
- Given: User is not logged in
- When: User navigates to `/admin/products`
- Then: Redirected to `/admin/login`

---

## 3. Implementation Notes

### Supabase Auth Setup

1. Enable Email provider in Supabase Dashboard
2. Create admin user manually via Supabase Dashboard
3. Set app metadata: `{ "role": "admin" }` (via `scripts/set-admin.ts` or SQL)

### Middleware Pattern

```typescript
// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { createServerClient } from '@supabase/ssr';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname.startsWith('/admin')) {
    // Skip login page
    if (context.url.pathname === '/admin/login') {
      return next();
    }

    const supabase = createServerClient(/* ... */);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'admin') {
      return context.redirect('/admin/login');
    }
  }

  return next();
});
```

### Environment Variables

Add to `.env`:
```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...           # For public reads
SUPABASE_SERVICE_ROLE_KEY=...   # For admin mutations (if needed)
```

---

## 4. Dependencies & Constraints

### New Dependencies
- `@supabase/ssr` - Server-side Supabase client with cookie handling

### Constraints
- **SSR Required:** Admin routes must be server-rendered (auth check)
- **No Static Generation:** Admin pages cannot be prerendered
- **Cookie-based Auth:** JWT stored in HTTP-only cookie (not localStorage)

---

## 5. Future Considerations

**Out of Scope for v0.4.0:**
- Editor role (restricted permissions)
- Audit logging (who changed what)
- Bulk import/export
- Image uploads for products
- Draft/publish workflow
- Two-factor authentication

**Technical Debt:**
- Consider moving to dedicated `apps/admin` if complexity grows
- May need pagination for large datasets
- Search/filter on list pages (future)

---

**Spec Status:** Draft
**Created:** 2026-01-25
**Owner:** @Architect
