# Spec: Site Header

## 1. Context & Goal
A unified, narrow top-bar component for application shells.

**Goal:** A simple, slot-based `SiteHeader` where the title has `flex-grow: 1` and all other content is passed via slots.

## 2. Design Philosophy
*   **Simplicity:** One narrow bar (48px).
*   **Flexibility:** Slot-based content allows any combination of nav, buttons, icons.
*   **Pattern:** `<nav class="flex"><title class="grow"/><slot content/>`

## 3. Blueprint

### 3.1. Layout
A single horizontal `<nav role="banner">` container.

*   **Height:** `48px` (`--kide-header-height`)
*   **Background:** `--kide-paper`
*   **Border:** Bottom `--kide-border-subtle`
*   **Structure:** Flexbox with gap

### 3.2. Content Zones
1.  **Title** (`.site-header__title`): Site name, `flex-grow: 1` to push content right
2.  **Slot**: All other content (nav links, buttons) passed via default slot

## 4. Component Specification

### `SiteHeader.astro`
Location: `packages/design-system/src/components/SiteHeader.astro`

### Props Interface

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `siteName` | `string` | Yes | — | Site name displayed as title |
| `homeHref` | `string` | No | `/` | Link target for the title |

### CSS Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.site-header` | Container | Flex container, 48px height |
| `.site-header__title` | Title link | `flex-grow: 1`, pushes content right |
| `.site-header__nav` | Nav list | Flex container for links |
| `.site-header__link` | Nav link | Individual navigation link |
| `.site-header__link--active` | Nav link | Active state modifier |
| `.site-header__btn` | Button | Default button style |
| `.site-header__btn--primary` | Button | Primary button modifier |

### Usage Examples

**Main site (Roolipeli.info):**
```astro
<SiteHeader siteName="Roolipeli.info">
  <ul class="site-header__nav">
    <li><a href="/tuotteet" class="site-header__link">Tuotteet</a></li>
    <li><a href="/kustantajat" class="site-header__link">Kustantajat</a></li>
  </ul>
  <button class="site-header__btn site-header__btn--primary">Kirjaudu</button>
</SiteHeader>
```

**Design System docs:**
```astro
<SiteHeader siteName="Kide Design System">
  <ul class="site-header__nav">
    <li><a href="/" class="site-header__link">Home</a></li>
    <li><a href="/site-header" class="site-header__link site-header__link--active">Components</a></li>
  </ul>
</SiteHeader>
```

### 3.3. Style Isolation
The SiteHeader operates in a **flex row context** where vertical margins on children
cause visual misalignment. All `<li>` elements inside `.site-header__nav` must have
`margin-bottom: 0` to override global typography rules.

**Invariant:** SiteHeader nav items must never inherit vertical spacing from
global typography styles.

### 3.4. Mobile Menu (ROO-61)

**Breakpoint:** `768px` (consistent with `footer.css`)

**Behavior:**
- **Desktop (≥768px):** Nav links and auth buttons render inline in the flex row (current behavior). Toggle button hidden.
- **Mobile (<768px):** Nav links and auth buttons hidden. A hamburger toggle button (`.site-header__toggle`) appears. Clicking it opens a vertical overlay panel (`.site-header__mobile-panel`).

#### Toggle Button (`.site-header__toggle`)
- Visible only below breakpoint
- Uses Unicode `☰` (open) / `✕` (close) — no SVG dependency
- Positioned after the title in the flex row
- Requires `aria-expanded` + `aria-controls` attributes
- Styled as minimal borderless button, `--kide-ink-primary` color

#### Mobile Panel (`.site-header__mobile-panel`)
- Full-width overlay panel positioned below the header bar
- `position: absolute` — overlays page content, does not push it down
- Vertical stack of nav links and auth buttons
- Background: `--kide-paper`
- Border-bottom: `1px solid --kide-border-subtle`
- Box shadow: `--kide-shadow-soft` for depth separation from content
- Links use `--kide-space-2` vertical padding for touch targets (minimum 44px)
- Hidden by default; shown when `.site-header__mobile-panel--open` modifier applied
- No animation (instant show/hide)

#### Interaction (vanilla JS)
- Toggle click: adds/removes `--open` modifier on panel, updates `aria-expanded`
- Escape key: closes panel, returns focus to toggle
- Link click: closes panel (navigation occurs)
- No Svelte island needed — pure HTML/CSS/JS via `<script>` in Astro component

#### New CSS Classes

| Class | Element | Description |
|-------|---------|-------------|
| `.site-header__toggle` | Button | Hamburger toggle, hidden on desktop |
| `.site-header__mobile-panel` | Container | Vertical nav overlay, hidden on desktop |
| `.site-header__mobile-panel--open` | Modifier | Panel visible state |

#### Anti-Patterns
- **NEVER** use a Svelte island for the mobile menu (layout shell must be SSR-only)
- **NEVER** use `display: none` alone to hide nav — pair with `aria-hidden` for screen readers
- **NEVER** add animation/transition at this stage (revisit in future PBI)

---

## 5. Contract (ROO-61)

### Definition of Done
- [ ] Hamburger toggle visible on viewports < 768px
- [ ] Nav links and auth buttons hidden on mobile, visible in panel on toggle
- [ ] Panel overlays content (position: absolute)
- [ ] `aria-expanded` and `aria-controls` on toggle button
- [ ] Escape key closes panel and returns focus to toggle
- [ ] Link click in panel closes panel
- [ ] Desktop layout unchanged (no visual regression)
- [ ] All CSS uses `--kide-*` design tokens only
- [ ] E2E tests for all scenarios below
- [ ] `pnpm biome check .` passes

### Regression Guardrails
- **Invariant:** Desktop header layout must not change at ≥768px
- **Invariant:** All existing nav links and auth buttons remain functional
- **Invariant:** Accessibility: `role="banner"`, `aria-label` on nav preserved

### Scenarios (Gherkin)

**Scenario: Mobile user sees hamburger menu**
- Given: Viewport width is 375px
- When: Page loads
- Then: Nav links and auth buttons are hidden
- And: Hamburger toggle button is visible
- And: Toggle has `aria-expanded="false"`

**Scenario: Mobile user opens menu**
- Given: Viewport is 375px and menu is closed
- When: User taps hamburger toggle
- Then: Mobile panel appears below header as overlay
- And: Toggle shows close icon (✕)
- And: Toggle has `aria-expanded="true"`
- And: Nav links and auth buttons are visible in vertical stack

**Scenario: Mobile user navigates via menu**
- Given: Mobile menu is open
- When: User taps a nav link
- Then: Page navigates to the link target
- And: Menu closes

**Scenario: Mobile user closes menu with Escape**
- Given: Mobile menu is open
- When: User presses Escape key
- Then: Menu closes
- And: Focus returns to toggle button

**Scenario: Desktop user sees no hamburger**
- Given: Viewport width is 1024px
- When: Page loads
- Then: Hamburger toggle is not visible
- And: Nav links render inline in the header

## 6. Open Questions
- **Backdrop:** Should clicking outside the panel also close it? (Deferred — implement if UX testing shows need.)
