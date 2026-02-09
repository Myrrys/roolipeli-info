# Spec: Kide Layout & Navigation

## 1. Blueprint (Design)

### Context

> **Goal:** Establish a canonical, information-dense, yet accessible application shell (Header, Navigation, Footer) for Roolipeli-info.
> **Reference:** Finna.fi (Record View) – prioritizing clarity, search-centricity, and authoritative "library" aesthetics.
> **Theme:** "Nordic Functionalism" (Kide) – clean lines, high legibility, separation of concerns.

### Architectural Impact

*   **New Components:**
    *   `TopBar` (Meta-navigation, authentication, locale)
    *   `SiteHeader` (Identity, Search, Main Nav)
    *   `Breadcrumbs` (Contextual hierarchy)
    *   `SiteFooter` (Structural navigation, legal)
*   **Layouts:** Updates `apps/main-site/src/layouts/Layout.astro`.

---

## 2. Layout Structure

The application shell defines the "frame" for all content. It consists of three vertical zones:

1.  **Header Zone** (Sticky/Fixed or Static - TBD, likely static for now)
    *   *Top Bar* (Utility)
    *   *Main Header* (Identity & Search)
    *   *Breadcrumb Bar* (Context)
2.  **Main Content Zone**
    *   `main#content` (The `<slot />`)
3.  **Footer Zone**
    *   *Sitemap / Fat Footer*
    *   *Colophon / Legal*

### 2.1. Top Bar (`<nav aria-label="Utility">`)

A slim, high-density bar at the very top of the viewport.
**Background:** `--kide-ink-primary` (Dark, distinctive) or `--kide-paper-dark` (Subtle). Reference uses white/neutral, but we want clear separation? *Decision: White/Paper with border-bottom.*

**Content (Left to Right):**
1.  **Meta Links:** (Optional) "About", "Help" – similar to Finna's "Tietoa Finnasta".
2.  **Spacer:** Pushes content to edges.
3.  **Language Selector:** Globe icon + Current Language (Dropdown).
4.  **User Menu:**
    *   *Guest:* "Kirjaudu" (Login) button (Text/Ghost variant).
    *   *Auth:* User Avatar/Name + Dropdown.

### 2.2. Main Header (`<header role="banner">`)

The primary brand and navigation area.
**Background:** `--kide-paper` (White).
**Border:** Distinctive bottom border (e.g., `--kide-border-subtle`).

**Layout (Reference: Finna):**
*   **Logo:** Left-aligned. Text-based or Icon+Text. Large, serif (`--kide-font-serif`).
*   **Search:** Becomes central on listing/home pages. On record pages, it might be smaller or remain central.
    *   *Input:* Large, high contrast.
    *   *Scope:* "All fields" dropdown (Future).
    *   *Action:* "Search" button (Primary color).
*   **Main Navigation:** (If not in Top Bar). "Products", "Publishers", "Creators".

### 2.3. Breadcrumbs

See `specs/design-system/breadcrumbs.md` for the full component spec, contract, and scenarios.

### 2.4. Site Footer (`<footer role="contentinfo">`)

A minimal footer with essential links.
**Background:** `--kide-paper-dark` (#f1f5f9) to visually separate from content.
**Typography:** Sans-serif, smaller scale.

**Grid:** 1-3 columns on desktop, 1 column on mobile.

**Content (per ROO-35/36):**
- GitHub repository link
- MIT license notice
- Version number (from repo root)

---

## 3. Component Specifications

### Breadcrumbs Component

See `specs/design-system/breadcrumbs.md`.

### Site Header Component

Must support "Search Context".
*   *Home:* Hero search.
*   *Inner Pages:* Sticky/Top search bar.

---

## 4. Implementation Plan (PBIs)

### PBI-001: Site Shell Scaffold
*   Create `TopBar.astro`, `Header.astro`, `Footer.astro`.
*   Update `Layout.astro` to include these.
*   **Constraint:** Must be responsive (mobile stack).

### PBI-002: Breadcrumb Integration (ROO-44)
*   See `specs/design-system/breadcrumbs.md` for scope, integration pattern, and DoD.

### PBI-003: Navigation Logic
*   Implement "Active Link" state for Main Navigation.
*   Implement Language Switcher (using `astro-i18n` logic).

---

## 5. Contract (Quality)

### Definition of Done

**ROO-43: Site Shell (Header & Footer)** *(Parent issue - decomposed into subtasks)*

**ROO-47: TopBar CSS Module** *(design-system demo only)*
- [x] `packages/design-system/src/styles/components/topbar.css` created with BEM classes
- [x] `topbar.css` exported from `packages/design-system/package.json`
- [x] Live demo added to `apps/design-system/src/pages/index.astro`
- [x] Uses only `--kide-*` design tokens
- Note: TopBar is not rendered as a standalone component on the main site. The login button ("Kirjaudu") is integrated directly into `SiteHeader.astro` via its slot.

**ROO-48: Header CSS Module** *(design-system demo only)*
- [x] `packages/design-system/src/styles/components/header.css` created with BEM classes
- [x] `header.css` exported from `packages/design-system/package.json`
- [x] Live demo added to `apps/design-system/src/pages/index.astro`
- [x] Uses only `--kide-*` design tokens
- Note: The standalone header pattern (`header.css`) is a design-system showcase only. Main site integration uses the shared `SiteHeader.astro` component (`site-header.css`).

**ROO-49: Layout Integration via SiteHeader**
- [x] `Layout.astro` updated: `SiteHeader` → `<main>` → `Footer`
- [x] `SiteHeader` renders title ("Roolipeli.info"), nav links, and "Kirjaudu" button via slot
- [x] `Footer.astro` created in `apps/main-site/src/components/`
- [x] E2E tests added: `header.spec.ts`, `layout.spec.ts`, `footer.spec.ts`

### Regression Guardrails

- Existing page layouts must not break
- i18n routing (/, /sv, /en) continues to work
- Grid layout system remains functional
- No accessibility regressions (semantic HTML, ARIA labels)

### Scenarios (Gherkin)

**Scenario: User views complete site shell**
- Given: User navigates to `/tuotteet`
- When: Page loads
- Then: SiteHeader is visible at top of viewport with title "Roolipeli.info"
- And: SiteHeader contains navigation links and "Kirjaudu" login button
- And: Footer is visible at bottom with `--kide-paper-dark` background
- And: Footer contains GitHub link, MIT license, and version

**Scenario: TopBar demo renders in design-system docs (ROO-47)**
- Given: User navigates to design-system docs index
- When: Page loads
- Then: TopBar demo section uses `<nav aria-label="Utility">` element
- And: TopBar has `--kide-paper` background with `--kide-border-subtle` bottom border
- And: Right section contains globe icon with "FI" text and "Kirjaudu" button

**Scenario: SiteHeader renders on main site (ROO-49)**
- Given: User navigates to any main-site page
- When: Page loads
- Then: `<nav class="site-header" role="banner">` is visible
- And: Title displays "Roolipeli.info" and links to `/`
- And: Navigation contains "Tuotteet", "Kustantajat", "Tekijät" links
- And: Header has `--kide-paper` background with bottom border
- **Deferred:** "Kirjaudu" login button is commented out in `Layout.astro` pending auth integration. Re-enable and update `header.spec.ts` assertion for `.site-header__btn--primary` when the auth PBI ships.

**Scenario: User views footer on mobile**
- Given: Viewport width is 375px (mobile)
- When: User scrolls to footer
- Then: Footer content stacks vertically
- And: All footer elements remain visible

**Scenario: Logo links to home**
- Given: User is on `/tuotteet` page
- When: User clicks the logo in Header
- Then: User is navigated to `/`

**Scenario: Navigation shows current section**
- Given: User is on `/tuotteet` page
- When: Page renders
- Then: "Tuotteet" link in navigation has active state

### Anti-Patterns

- See `specs/design-system/spec.md` for general design system anti-patterns
- **NEVER** hardcode navigation URLs (prepare for i18n prefixes)
- **NEVER** use inline styles for layout (use grid/flex with tokens)
- **NEVER** omit semantic HTML (`<nav>`, `<header>`, `<footer>`, `aria-label`)
- **NEVER** hardcode the application version in `Footer.astro`. Version must be read from `package.json` at Astro build time. (See bug tracked in Linear.)

---

## 6. Visual Reference Summary (Finna)

*   **Density:** High. Uses horizontal space efficiently.
*   **Hierarchy:** Logo > Search > Actions.
*   **Clarity:** Clear distinction between "Service actions" (Login/Lang) and "Content actions" (Search/Browse).

---

## 7. Implementation Notes

### Header Behavior
- **Static** for v1 (not sticky)
- Search bar deferred to future PBI

### File Locations
```
apps/main-site/src/
├── components/
│   └── Footer.astro
└── layouts/
    └── Layout.astro (uses SiteHeader from packages/design-system)

packages/design-system/src/
├── components/
│   └── SiteHeader.astro
└── styles/components/
    ├── site-header.css  (SiteHeader component styles)
    ├── header.css       (standalone header demo)
    └── topbar.css       (standalone topbar demo)
```

### Constitution Note
This feature modifies layout components. Commits require `ALLOW_DS_EDIT=true` if touching `packages/design-system/`.
