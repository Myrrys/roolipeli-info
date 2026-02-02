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

### 2.3. Breadcrumbs (`<nav aria-label="Breadcrumb">`)

Unlike Finna (which relies on "Back to Search"), we implement explicit breadcrumbs for structural clarity (SEO + User Context).

**Placement:** Immediately below Main Header, before `<h1>`.
**Format:** `Home > [Category] > [Current Page]`
**Style:** Small text (`0.875rem`), muted color (`--kide-ink-muted`). Last item is current page (bold/active text, no link).

### 2.4. Site Footer (`<footer role="contentinfo">`)

A "Fat Footer" design with columns.
**Background:** `--kide-paper-dark` (#f1f5f9 or similar) to visually separate from content.
**Typography:** Sans-serif, smaller scale.

**Columns:**
1.  **Information:** "About the project", "Open Data", "API".
2.  **Content:** "All Products", "Publishers", "Creators", "Statistics".
3.  **Community:** "Feedback", "Github", "Discord".
4.  **Legal:** "Privacy", "Terms", "Accessibility".

---

## 3. Component Specifications

### Breadcrumbs Component

```astro
<!-- Props -->
interface Props {
  items: { label: string; href?: string }[];
}
```

*   **Separator:** Chevron right (`>`) or Slash (`/`). *Decision: Chevron (SVG).*
*   **Behavior:** Collapse to "Back" on mobile? (Future consideration). For now, wrap.

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

### PBI-002: Breadcrumb Integration
*   Create `Breadcrumbs.astro`.
*   Add to `Layout.astro` (with logic to hide on Home?) or manually add to pages. *Recommendation: passed via Layout props or slot.*

### PBI-003: Navigation Logic
*   Implement "Active Link" state for Main Navigation.
*   Implement Language Switcher (using `astro-i18n` logic).

---

## 5. Contract (Quality)

### Definition of Done

**ROO-43: Site Shell (Header & Footer)**
- [ ] `TopBar.astro` created in `apps/main-site/src/components/`
  - [ ] Language selector placeholder (Globe icon + "FI")
  - [ ] Login button placeholder ("Kirjaudu")
- [ ] `Header.astro` created with:
  - [ ] Logo (text-based, links to `/`)
  - [ ] Main navigation placeholders (Tuotteet, Kustantajat, Tekijät)
- [ ] `Footer.astro` created with 4-column layout:
  - [ ] "Tietoa" (Information)
  - [ ] "Sisältö" (Content)
  - [ ] "Yhteisö" (Community)
  - [ ] "Laki" (Legal)
- [ ] `Layout.astro` updated to compose TopBar → Header → slot → Footer
- [ ] Uses only `--kide-*` design tokens (no hardcoded colors/spacing)
- [ ] Footer background uses `--kide-paper-dark`
- [ ] Responsive: Footer columns stack on mobile (< 768px)
- [ ] All existing E2E tests pass
- [ ] No TypeScript compilation errors

### Regression Guardrails

- Existing page layouts must not break
- i18n routing (/, /sv, /en) continues to work
- Grid layout system remains functional
- No accessibility regressions (semantic HTML, ARIA labels)

### Scenarios (Gherkin)

**Scenario: User views complete site shell**
- Given: User navigates to `/tuotteet`
- When: Page loads
- Then: TopBar is visible at top of viewport
- And: TopBar contains language indicator and login placeholder
- And: Header is visible below TopBar with logo
- And: Footer is visible at bottom with dark background
- And: Footer contains 4 column groups

**Scenario: User views footer on mobile**
- Given: Viewport width is 375px (mobile)
- When: User scrolls to footer
- Then: Footer columns stack vertically
- And: Each column group has full width

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
│   ├── TopBar.astro
│   ├── Header.astro
│   └── Footer.astro
└── layouts/
    └── Layout.astro (updated)
```

### Constitution Note
This feature modifies layout components. Commits require `ALLOW_DS_EDIT=true` if touching `packages/design-system/`.
