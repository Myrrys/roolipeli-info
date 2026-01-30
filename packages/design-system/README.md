# @roolipeli/design-system

The **Kide Design System** provides tokens, layouts, and components for roolipeli.info applications.

## Installation

```bash
pnpm add @roolipeli/design-system
```

## Usage

### Tokens

```css
@import '@roolipeli/design-system/tokens.css';
```

Provides CSS custom properties for colors, spacing, typography, and more.

### Layout

#### Content Grid

```css
@import '@roolipeli/design-system/grid.css';
```

```html
<div class="grid-layout">
  <p>Content width</p>
  <div class="breakout">Wider area</div>
  <div class="full-width">Edge to edge</div>
</div>
```

#### Collection Grid

```css
@import '@roolipeli/design-system/collection-grid.css';
```

```html
<div class="kide-collection">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
</div>
```

Override with CSS custom properties:
- `--kide-collection-min`: Minimum item width (default: 280px)
- `--kide-collection-gap`: Gap between items (default: `--kide-space-4`)

### Components

#### Card

```css
@import '@roolipeli/design-system/components/card.css';
```

```html
<!-- Static card -->
<div class="card">
  <span class="card__label">Category</span>
  <h3 class="card__title">Title</h3>
  <p class="card__body">Description</p>
</div>

<!-- Interactive card -->
<a href="#" class="card card--link">
  <span class="card__label">Category</span>
  <h3 class="card__title">Clickable</h3>
  <div class="card__meta">
    <span class="tag">Tag</span>
  </div>
</a>
```

#### Tag

```css
@import '@roolipeli/design-system/components/tag.css';
```

```html
<span class="tag">Label</span>
```

#### Button

```css
@import '@roolipeli/design-system/components/button.css';
```

```html
<button class="btn btn-filled">Primary</button>
<button class="btn btn-outlined">Secondary</button>
<button class="btn btn-text">Tertiary</button>
<button class="btn btn-danger">Destructive</button>
```

#### Input

```css
@import '@roolipeli/design-system/components/input.css';
```

```html
<input type="text" class="input" placeholder="Text input" />
<select class="select">...</select>
<textarea class="textarea">...</textarea>
```

## Documentation

See the live documentation at the [Kide Design System site](https://kide.roolipeli.info).
