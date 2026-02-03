# Spec: CSS Preflight (Modern Reset)

## 1. Context & Goal
Browser default styles cause inconsistencies across different browsers and make styling unpredictable. A "preflight" or "reset" CSS normalizes these defaults.

**Goal:** Provide a modern CSS reset that removes browser inconsistencies while preserving useful defaults.

## 2. Design Philosophy
*   **Modern**: Based on modern-normalize and Tailwind Preflight patterns
*   **Minimal**: Reset what causes problems, keep what's useful
*   **Box-sizing**: Use `border-box` universally
*   **Typography**: Inherit fonts, remove margins from headings
*   **Interactive**: Sensible defaults for buttons, inputs, links

## 3. Implementation

### 3.1. File Location
`packages/design-system/src/styles/preflight.css`

### 3.2. Reset Categories

| Category | What it resets |
|----------|----------------|
| Box model | `box-sizing: border-box` on all elements |
| Margins | Remove default margins from body, headings, p, figure |
| Typography | Inherit font on all elements, smooth antialiasing |
| Lists | Remove list-style on ul/ol with role="list" |
| Media | Block display for img, video, svg; max-width: 100% |
| Tables | Border-collapse, inherit text alignment |
| Forms | Inherit font on buttons/inputs, sensible button cursor |
| Links | Inherit color, remove underline by default |

### 3.3. Usage
```astro
---
import '@roolipeli/design-system/preflight.css';
import '@roolipeli/design-system/tokens.css';
---
```

> **Import Order:** Preflight should be imported FIRST, before tokens and component styles.

## 4. Package Export
Add to `package.json`:
```json
"./preflight.css": "./src/styles/preflight.css"
```
