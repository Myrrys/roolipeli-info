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

## 5. Open Questions
*   **Mobile Menu:** Hamburger menu implementation TBD.
