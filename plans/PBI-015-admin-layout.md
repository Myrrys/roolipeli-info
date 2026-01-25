# PBI-015: Admin Layout & Navigation

> **Spec Reference:** `specs/admin-ui/spec.md`
> **Persona:** @Dev
> **Version:** 0.4.0
> **Depends On:** PBI-014

---

## 1. The Directive

Create the admin layout shell with sidebar navigation and dashboard page.

**In Scope:**
- `AdminLayout.astro` with sidebar navigation
- Admin navigation component
- Dashboard page with entity counts
- Shared admin styles (using Kide tokens)
- Flash message system for success/error feedback

**Out of Scope:**
- CRUD pages (see PBI-016, 017, 018)
- Entity forms

---

## 2. Context Pointers

- **Styling:** Use Kide design tokens (`var(--kide-*)`)
- **Layout:** Sidebar + main content area
- **Responsive:** Tablet-friendly minimum (768px+)

---

## 3. Verification Pointers

- **Success Criteria:**
  - Admin layout renders with navigation
  - Dashboard shows entity counts
  - Navigation links work
  - Flash messages display and auto-dismiss
- **Quality Gate:** `pnpm tsc --noEmit && pnpm biome check .`

---

## 4. Task Checklist

### Admin Layout
- [ ] Create `apps/main-site/src/layouts/AdminLayout.astro`
- [ ] Structure: sidebar (fixed) + main content (scrollable)
- [ ] Include AdminNav component
- [ ] Include flash message area
- [ ] Pass `title` prop for page titles
- [ ] Include logout button in header/sidebar

### Admin Navigation
- [ ] Create `apps/main-site/src/components/admin/AdminNav.astro`
- [ ] Links:
  - Dashboard (`/admin`)
  - Products (`/admin/products`)
  - Publishers (`/admin/publishers`)
  - Creators (`/admin/creators`)
- [ ] Highlight current route
- [ ] Use semantic `<nav>` element

### Dashboard Page
- [ ] Update `apps/main-site/src/pages/admin/index.astro` to use AdminLayout
- [ ] Fetch entity counts:
  - Total products
  - Total publishers
  - Total creators
- [ ] Display counts in card layout
- [ ] Quick action links (Add Product, Add Publisher, Add Creator)

### Flash Messages
- [ ] Create flash message utility (cookie or query param based)
- [ ] Create `apps/main-site/src/components/admin/FlashMessage.astro`
- [ ] Types: success (green), error (red), info (blue)
- [ ] Auto-dismiss after 5 seconds (optional JS enhancement)
- [ ] Accessible: role="alert"

### Admin Styles
- [ ] Create `apps/main-site/src/styles/admin.css`
- [ ] Sidebar styles (width, background, padding)
- [ ] Navigation link styles (active state)
- [ ] Card styles for dashboard
- [ ] Form styles (prepare for CRUD pages)
- [ ] Table styles (prepare for list pages)
- [ ] Use only Kide design tokens

### Translation Keys
- [ ] Add admin UI strings to `i18n/ui.ts`:
  - `admin.nav.dashboard`
  - `admin.nav.products`
  - `admin.nav.publishers`
  - `admin.nav.creators`
  - `admin.nav.logout`
  - `admin.dashboard.title`
  - `admin.dashboard.products`
  - `admin.dashboard.publishers`
  - `admin.dashboard.creators`

---

## 5. Refinement Rule

If reality diverges from the Spec:
- [ ] STOP and flag for @Architect review
- [ ] Document the divergence in this PBI
- [ ] Do NOT update Spec without explicit approval

---

## 6. Commit Template

```
feat(admin): add layout and navigation

- Created AdminLayout with sidebar navigation
- Created AdminNav component with route highlighting
- Created dashboard page with entity counts
- Added flash message system for feedback
- Added admin-specific styles using Kide tokens

Part of v0.4.0 Admin UI release
```
