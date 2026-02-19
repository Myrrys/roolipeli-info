# Spec: Kide Navigation Rail Component (ROO-19)

## 1. Blueprint (Design)

### Context

> **Goal:** Add a reusable vertical navigation component to Kide for persistent side navigation patterns (admin UI, documentation sites, future dashboard layouts).
> **Why:** The admin UI has a custom sidebar (`AdminNav.astro`) with ~90 lines of scoped CSS. The DS docs site uses a header nav that will not scale as the component library grows. Both should use a governed design-system component.
> **Reference:** [M3 Navigation Rail (Expanded variant)](https://m3.material.io/components/navigation-rail/overview) — replaces the deprecated Navigation Drawer in Material Design 3.
> **Architectural Impact:** New CSS module + Astro wrapper in `packages/design-system`. Refactor of `AdminNav.astro` and `DocsLayout.astro` to consume the new component.

### Data Architecture

**No database changes.** Pure UI/CSS component.

### UI Architecture

#### New Files

| File | Type | Purpose |
|------|------|---------|
| `packages/design-system/src/styles/components/nav-rail.css` | CSS Module | BEM classes for the navigation rail |
| `packages/design-system/src/components/NavRail.astro` | Astro Component | Semantic wrapper with slots and CSS import |
| `apps/design-system/src/pages/nav-rail.astro` | Demo Page | Standalone showcase of the component |

#### Astro Wrapper: `NavRail.astro`

Provides semantic HTML structure, CSS import, and named slots. Follows the `SiteHeader.astro` precedent — justified because this is a composite layout pattern, not a simple native element.

```astro
---
import '../styles/components/nav-rail.css';
interface Props { 'aria-label'?: string; }
const { 'aria-label': ariaLabel = 'Navigation' } = Astro.props;
---
<nav class="nav-rail" aria-label={ariaLabel}>
  <div class="nav-rail__header"><slot name="header" /></div>
  <ul class="nav-rail__items"><slot /></ul>
  <div class="nav-rail__footer"><slot name="footer" /></div>
</nav>
```

**Slot Contract:**

| Slot | Element | Purpose |
|------|---------|---------|
| `header` | `<div>` | Branding, title, badges |
| default | `<ul>` | Navigation items (`<li>` with links) |
| `footer` | `<div>` | Secondary actions (logout, back link) |

#### BEM Structure: `nav-rail.css`

```
.nav-rail                        /* Container: vertical flex, full height, sticky */
.nav-rail__header                /* Branding/header area */
.nav-rail__items                 /* Navigation items list (flex-grow) */
.nav-rail__item                  /* Individual nav item link */
.nav-rail__item--active          /* Active/selected indicator */
.nav-rail__icon                  /* Optional icon within item */
.nav-rail__label                 /* Item label text */
.nav-rail__divider               /* Horizontal section divider */
.nav-rail__footer                /* Footer area */
.nav-rail__footer-link           /* Footer link base */
.nav-rail__footer-link--danger   /* Destructive action (logout) */
```

#### Design Token Mapping (M3 → Kide)

| M3 Role | Kide Token | Usage |
|---------|-----------|-------|
| `colorSurface` | `--kide-surface` | Container background |
| `colorSecondaryContainer` | `--kide-ice-light` | Active indicator fill |
| `colorOnSecondaryContainer` | `--kide-ice-deep` | Active item text/icon |
| `colorOnSurfaceVariant` | `--kide-ink-muted` | Inactive item text/icon |
| `colorOnSurface` | `--kide-ink-primary` | Hover state text |
| Border | `--kide-border-subtle` | Trailing edge border, footer divider |
| Danger | `--kide-danger` | Destructive footer link |

#### Layout Specifications

| Property | Value | Token |
|----------|-------|-------|
| Width | 240px (min-width) | — |
| Padding | 2rem | `--kide-space-4` |
| Position | sticky, top: 0 | — |
| Height | 100vh | — |
| Item padding | 1rem 1.5rem | `--kide-space-2` / `--kide-space-3` |
| Item border-radius | pill | `--kide-radius-md` |
| Item spacing | 0.5rem | `--kide-space-1` |
| Header margin-bottom | 4rem | `--kide-space-8` |
| Footer border-top | 1px solid | `--kide-border-subtle` |
| Footer padding-top | 2rem | `--kide-space-4` |
| Footer link gap | 1rem | `--kide-space-2` |
| Footer link font-size | 0.875rem | — |

#### States

| State | Background | Text Color | Transition |
|-------|-----------|-----------|-----------|
| Inactive | transparent | `--kide-ink-muted` | — |
| Hover | `--kide-paper` | `--kide-ink-primary` | 0.2s ease |
| Active | `--kide-ice-light` | `--kide-ice-deep` | — |
| Focus-visible | focus ring | inherit | `--kide-control-focus-ring` |

#### Responsive Behavior

For v1, the nav rail is **desktop-only** (always visible when used in a layout).

**Out of scope for ROO-19:**
- Collapse to icon-only mode at medium breakpoints
- Transform to bottom navigation on mobile
- Hamburger toggle / modal overlay

These can be addressed in future PBIs as the component matures.

### Consumers (Day One)

Two real consumers validate the API design:

**1. Design System Docs (`DocsLayout.astro`)**
- Replace the growing header link list with a sidebar nav rail
- Update layout from single-column to sidebar + content
- Nav items: Tokens, Breadcrumbs, Entity Cover, Site Header, Forms, Nav Rail

**2. Admin UI (`AdminNav.astro`)**
- Import `NavRail.astro` wrapper instead of custom markup
- Remove ~90 lines of scoped CSS
- Map existing nav items to `.nav-rail__item` classes
- Preserve active-link logic (pathname-based, stays in `AdminNav.astro`)

### Anti-Patterns

- **NEVER** add JavaScript behavior to `nav-rail.css` (CSS-only module)
- **NEVER** hardcode colors — use `--kide-*` tokens exclusively
- **NEVER** use `position: fixed` (use `sticky` for viewport-pinned behavior)
- **NEVER** add icon dependencies — icons are optional, not required
- **NEVER** couple the CSS module to admin-specific or docs-specific concerns
- **NEVER** duplicate active-link logic in the component — consumers handle this via `--active` class

---

## 2. Contract (Quality)

### Definition of Done

**CSS Module (`nav-rail.css`):**
- [ ] Created at `packages/design-system/src/styles/components/nav-rail.css`
- [ ] BEM classes cover: container, header, items, item, item--active, icon, label, divider, footer, footer-link, footer-link--danger
- [ ] All colors/spacing use `--kide-*` tokens (zero hardcoded values)
- [ ] Active indicator uses pill shape (M3 expanded rail pattern)
- [ ] Hover and focus-visible states implemented
- [ ] Exported from `packages/design-system/package.json` as `./components/nav-rail.css`

**Astro Wrapper (`NavRail.astro`):**
- [ ] Created at `packages/design-system/src/components/NavRail.astro`
- [ ] Imports `nav-rail.css` automatically
- [ ] Renders semantic `<nav>` with configurable `aria-label`
- [ ] Provides named slots: `header`, default (items), `footer`
- [ ] Exported via `./components/*` glob in `package.json` (already configured)

**Design System Docs:**
- [ ] Demo page at `apps/design-system/src/pages/nav-rail.astro` showcases anatomy and states
- [ ] `DocsLayout.astro` updated to use `NavRail.astro` as primary sidebar navigation
- [ ] Layout changed from header-only to sidebar + content
- [ ] Nav-rail link added to docs navigation
- [ ] E2E test in `apps/design-system/tests/e2e/` verifies nav-rail demo renders

**Admin UI Refactor:**
- [ ] `AdminNav.astro` refactored to use `NavRail.astro` wrapper
- [ ] Scoped `<style>` block removed (or reduced to admin-specific overrides only)
- [ ] `AdminLayout.astro` updated if CSS imports change
- [ ] Visual output equivalent to current implementation (no regression)

**Quality:**
- [ ] `pnpm biome check .` passes
- [ ] Existing E2E tests in `admin-layout.spec.ts` pass (update selectors if BEM migration changes them)
- [ ] WCAG AA: sufficient contrast, focus-visible states, semantic `<nav>` with `aria-label`
- [ ] No `any` types, no `!important`, no hardcoded values

### Regression Guardrails

- **Invariant:** Admin sidebar must remain visible and functional after refactor
- **Invariant:** Active link highlighting must continue to work (pathname-based)
- **Invariant:** All 5 admin nav items render with correct i18n labels
- **Invariant:** Logout and "back to site" footer links remain functional
- **Invariant:** DS docs pages remain navigable after layout change
- **Invariant:** If BEM migration changes E2E selectors (`.admin-nav` → `.nav-rail`), tests must be updated in the same commit

### Scenarios (Gherkin)

**Scenario: Nav rail renders in design-system demo page**
- Given: User navigates to `/nav-rail` in design-system docs
- When: Page loads
- Then: A vertical navigation component is visible
- And: Container has `--kide-surface` background with right border
- And: Items display with `--kide-ink-muted` text color
- And: One item shows active state with `--kide-ice-light` pill background

**Scenario: Nav rail item hover**
- Given: Nav rail is rendered with multiple items
- When: User hovers over an inactive item
- Then: Item background transitions to `--kide-paper`
- And: Text color transitions to `--kide-ink-primary`
- And: Transition is smooth (0.2s ease)

**Scenario: Nav rail focus accessibility**
- Given: User navigates via keyboard
- When: Tab focuses a nav-rail item
- Then: A visible focus ring appears (`:focus-visible`)
- And: Focus ring uses `--kide-control-focus-ring` style

**Scenario: DS docs site uses nav-rail for navigation**
- Given: User navigates to any design-system docs page
- When: Page loads
- Then: A sidebar nav rail is visible on the left
- And: Nav rail contains links to all component pages
- And: Current page link has active state

**Scenario: Admin sidebar uses Kide nav-rail after refactor**
- Given: Admin user is logged in and on `/admin`
- When: Page loads
- Then: Sidebar uses `NavRail.astro` wrapper with `.nav-rail` classes
- And: Branding ("Roolipeli.info" + Admin badge) renders in header slot
- And: 5 nav items render in items slot
- And: Dashboard item has active state
- And: Footer contains logout and back-to-site links

**Scenario: Admin navigation still works after refactor**
- Given: Admin user is on `/admin`
- When: User clicks "Tuotteet" in the sidebar
- Then: URL changes to `/admin/products`
- And: "Tuotteet" item shows `.nav-rail__item--active` state
- And: Previous active item loses active state

**Scenario: Nav rail footer with action links**
- Given: Nav rail has a footer section
- When: Footer renders
- Then: Footer is separated from items by a border-top
- And: Danger-styled link uses `--kide-danger` color
- And: Secondary link uses `--kide-ink-muted` color with underline on hover

---

## 3. Implementation Notes

### Package Exports

Add to `packages/design-system/package.json`:
```json
"./components/nav-rail.css": "./src/styles/components/nav-rail.css"
```

The Astro component is already covered by the existing `"./components/*"` glob export.

### Consumer Pattern: Admin UI

```astro
---
import NavRail from '@roolipeli/design-system/components/NavRail.astro';
// ... active-link logic stays here ...
---
<NavRail aria-label="Admin navigation">
  <Fragment slot="header">
    <h2>Roolipeli.info</h2>
    <span class="admin-badge">Admin</span>
  </Fragment>

  {navItems.map((item) => (
    <li>
      <a href={item.href}
         class:list={['nav-rail__item', { 'nav-rail__item--active': isActive(item.href) }]}>
        <span class="nav-rail__label">{item.label}</span>
      </a>
    </li>
  ))}

  <Fragment slot="footer">
    <a href="/admin/logout" class="nav-rail__footer-link nav-rail__footer-link--danger">
      {t("admin.logout")}
    </a>
    <a href="/" class="nav-rail__footer-link">{t("admin.backToSite")}</a>
  </Fragment>
</NavRail>
```

### Consumer Pattern: DS Docs

```astro
---
import NavRail from '../components/NavRail.astro'; // or from package
const { pathname } = Astro.url;
const pages = [
  { label: 'Tokens', href: '/' },
  { label: 'Breadcrumbs', href: '/breadcrumbs' },
  { label: 'Entity Cover', href: '/entity-cover' },
  { label: 'Site Header', href: '/site-header' },
  { label: 'Forms', href: '/forms' },
  { label: 'Nav Rail', href: '/nav-rail' },
];
---
<div class="docs-layout">
  <NavRail aria-label="Documentation">
    <Fragment slot="header">
      <h2>Kide</h2>
      <span>Design System</span>
    </Fragment>

    {pages.map((page) => (
      <li>
        <a href={page.href}
           class:list={['nav-rail__item', { 'nav-rail__item--active': pathname === page.href }]}>
          <span class="nav-rail__label">{page.label}</span>
        </a>
      </li>
    ))}
  </NavRail>

  <main class="docs-main">
    <slot />
  </main>
</div>
```

### E2E Selector Migration

If admin E2E tests use `.admin-nav` selectors, they must be updated to `.nav-rail` in the same commit. Mapping:

| Old Selector | New Selector |
|-------------|-------------|
| `.admin-nav` | `.nav-rail` |
| `.nav-links a` | `.nav-rail__item` |
| `a.active` | `.nav-rail__item--active` |

### Constitution Notes

- **ASK tier triggered:** This modifies `packages/design-system` — commits require `ALLOW_DS_EDIT=true`
- **Same-Commit Rule:** If E2E selectors change, tests update in the same commit
- **No new dependencies:** Pure CSS + Astro (already in stack)

---

## 4. Future Considerations

**Out of Scope (Deferred):**
- Collapsible/icon-only mode for medium breakpoints
- Mobile bottom navigation transformation
- Hamburger toggle / modal overlay variant
- Animated expand/collapse transitions
- Badge/notification indicators on items
- Nested submenus / accordion sections
- Icon set or icon component integration

**When to Revisit:**
- When the admin UI needs mobile support
- When the DS docs site grows beyond ~10 pages (may need sections/dividers)
- When a public-facing page needs sidebar navigation

---

## 5. References

- **Linear:** [ROO-19 — Kide: Navigation Rail / Tray component](https://linear.app/pelilauta/issue/ROO-19/kide-navigation-rail-tray-component)
- **M3 Navigation Rail:** https://m3.material.io/components/navigation-rail/overview
- **M3 Navigation Drawer (deprecated):** https://m3.material.io/components/navigation-drawer/overview
- **Existing Admin Sidebar:** `apps/main-site/src/components/admin/AdminNav.astro`
- **DS Docs Layout:** `apps/design-system/src/layouts/DocsLayout.astro`
- **Parent Spec:** `specs/design-system/spec.md` (Kide Design System)

---

**Spec Status:** Draft
**Created:** 2026-02-19
**Owner:** @Architect
