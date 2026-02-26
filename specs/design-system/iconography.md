# Spec: Iconography (Material Symbols)

## 1. Blueprint (Design)

### Context
> **Goal:** Add Material Symbols Outlined as the canonical icon system for Kide.
> **Why:** The design system lacks a consistent icon approach. Components use ad-hoc inline SVGs
> with no shared vocabulary, sizing scale, or accessibility convention.
> **Architectural Impact:** Adds a Google Fonts `<link>` to both app layouts, a new component CSS
> file, and new design tokens. Does not affect database or server logic.

### Data Architecture

**No database changes.** Pure UI/CSS feature.

### UI Architecture

**Font:** Material Symbols Outlined (variable font via Google Fonts CDN)

**CSS:** `packages/design-system/src/styles/components/icon.css`

**Classes:**
| Class | Purpose |
|-------|---------|
| `.kide-icon` | Base — sets font-family, variation settings, vertical alignment |
| `.kide-icon--sm` | 20px (`--kide-icon-size-sm`) |
| `.kide-icon--md` | 24px (`--kide-icon-size-md`) — default |
| `.kide-icon--lg` | 32px (`--kide-icon-size-lg`) |

**Tokens (new in `tokens.css`):**
| Token | Value | Purpose |
|-------|-------|---------|
| `--kide-icon-size-sm` | 20px | Small icons (inline metadata) |
| `--kide-icon-size-md` | 24px | Default size (Material baseline) |
| `--kide-icon-size-lg` | 32px | Large icons (hero, empty states) |
| `--kide-icon-optical-size` | 24 | Material Symbols `opsz` axis |

**Google Fonts link (replaces existing):**
```html
<link
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Playfair+Display:wght@400;700&family=Open+Sans:wght@400;600&display=swap"
  rel="stylesheet"
/>
```

Updated in:
- `apps/main-site/src/layouts/Layout.astro`
- `apps/design-system/src/layouts/DocsLayout.astro`

**Accessibility convention:**
- Decorative icons: `aria-hidden="true"` — always paired with visible text
- Functional icon-only buttons: `aria-label` on the parent `<button>`

**Usage patterns:**
```html
<!-- Decorative icon (next to visible text) -->
<button class="btn btn-filled">
  <span class="kide-icon" aria-hidden="true">save</span>
  Tallenna
</button>

<!-- Functional icon-only button (needs accessible name) -->
<button class="btn btn-text" aria-label="Muokkaa">
  <span class="kide-icon" aria-hidden="true">edit</span>
</button>
```

**Docs page:** `apps/design-system/src/pages/icons.astro`
- Common icon showcase (close, edit, delete, add, search, home, settings, arrow_back)
- Usage pattern documentation
- A11y guidance (decorative vs functional)
- Size modifier examples

**Nav item:** "Icons" added to `DocsLayout.astro` pages array.

**Package export:**
```json
"./components/icon.css": "./src/styles/components/icon.css"
```

### Anti-Patterns

- **NEVER** wrap icons in a Svelte component — use CSS class on native `<span>` (Native First)
- **NEVER** use icons without `aria-hidden="true"` or a parent `aria-label`
- **NEVER** self-host or subset the font — use CDN `<link>` (revisit if perf requires it)
- **NEVER** hardcode icon sizes — use `--kide-icon-size-*` tokens

---

## 2. Contract (Quality)

### Definition of Done

- [ ] Material Symbols Outlined font added via Google Fonts `<link>` to both layouts
- [ ] `icon.css` created with `.kide-icon` base class and size modifiers
- [ ] Icon tokens added to `tokens.css`
- [ ] `./components/icon.css` exported from `packages/design-system/package.json`
- [ ] Docs page at `apps/design-system/src/pages/icons.astro`
- [ ] "Icons" nav item added to `DocsLayout.astro`
- [ ] E2E test at `apps/design-system/tests/e2e/icons.spec.ts`
- [ ] No hardcoded values — tokens only
- [ ] Dogfooding: docs page uses `.kide-icon` classes

### Regression Guardrails

- Existing Google Fonts (Playfair Display, Open Sans) must continue loading
- No layout shift from font loading (Material Symbols uses `font-display: block` by default)
- Existing components and E2E tests unaffected

### Scenarios (Gherkin)

**Scenario: Developer renders a decorative icon**
- **Given:** `icon.css` is imported and Material Symbols font is loaded
- **When:** Developer adds `<span class="kide-icon" aria-hidden="true">edit</span>` next to a text label
- **Then:**
  - The icon renders at 24px (default `--kide-icon-size-md`)
  - The icon is vertically aligned with adjacent text
  - Screen readers skip the icon

**Scenario: Icon size modifiers apply correct sizes**
- **Given:** An icon element with class `.kide-icon`
- **When:** `.kide-icon--sm` modifier is added
- **Then:** Icon renders at 20px
- **When:** `.kide-icon--lg` modifier is added
- **Then:** Icon renders at 32px

**Scenario: Icon docs page renders in design-system**
- **Given:** User navigates to `/icons` in the design-system app
- **When:** Page loads
- **Then:**
  - Page heading is visible
  - Common icons render with `.kide-icon` class
  - Size modifier examples are visible
  - "Icons" nav rail item is present and active

**Scenario: Icon-only button is accessible**
- **Given:** A button with only an icon and no visible text
- **When:** Button has `aria-label` and icon has `aria-hidden="true"`
- **Then:** Screen reader announces the button's `aria-label`, not the icon ligature text

---

## 3. Out of Scope

- Migration of existing inline SVGs (Snackbar close button, etc.) — separate future PBI
- Svelte `<Icon>` wrapper component
- Self-hosted font / subsetting
- Filled icon variant (Outlined only for now)

---

## 4. References

- **Linear:** ROO-104
- **Parent Spec:** `specs/design-system/spec.md`
- [Material Symbols — Google Fonts](https://fonts.google.com/icons)
- [Material Symbols Developer Guide](https://developers.google.com/fonts/docs/material_symbols)
