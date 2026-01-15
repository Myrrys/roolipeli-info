# PBI-010: Implement Kide Design System

> **Spec Reference:** `specs/design-system/spec.md`  
> **Persona:** @Dev (with @Architect approval for PROTECTED package changes)

---

## 1. The Directive

Replace the minimal placeholder design tokens with the complete "Kide" (Ice Crystal) design system. Implement new color palette with `--kide-` prefixed tokens, typography system, and foundational UI components (Card, Tag) following the exact specifications in the Spec.

**In Scope:**
- Update design tokens in `packages/design-system/src/styles/tokens.css`
- Add Google Fonts links to both application layouts
- Create Card component CSS
- Create Tag component CSS
- Update design system documentation to showcase Jäinen Kirja
- Update main-site landing pages to use new design system
- Verify accessibility (WCAG AA contrast ratios)

**Out of Scope:**
- Dark mode implementation
- Responsive mobile breakpoints (handled in future PBI)
- Additional component variants
- Svelte component versions (CSS-only for now)

---

## 2. Context Pointers

- **Design Philosophy:** Follow "Kide" aesthetic from Spec Section 1
- **Token Structure:** Organize as Paper & Ink → Glacial Accents → Typography → Shape (Spec Section 3)
- **Component Patterns:** Use exact markup structure from Spec Section 4
- **Accessibility:** Verify all color contrasts meet WCAG AA (Spec Section 2.3)
- **Protection:** This modifies PROTECTED `packages/design-system/` - requires `ALLOW_DS_EDIT=true`

---

## 3. Verification Pointers

- **Success Criteria:** Pass all scenarios in Spec Section 2.3
- **Quality Gate:** 
  - `pnpm biome check --write packages/design-system`
  - `pnpm test` (E2E tests must still pass)
  - Manual verification: Main site and design docs visually match Kide aesthetic
  - Accessibility: Check contrast ratios with browser devtools

---

## 4. Task Checklist

### Phase 1: Update Design Tokens

- [ ] Open `packages/design-system/src/styles/tokens.css`
- [ ] Replace existing tokens with Kide palette (exact hex codes from Spec)
- [ ] Use `--kide-` prefix for all tokens (e.g., `--kide-paper`, `--kide-ink-primary`)
- [ ] Organize into sections: Paper & Ink, Glacial Accents, Typography, Shape & Depth
- [ ] Add comments for each section
- [ ] Verify CSS variables follow naming convention

### Phase 2: Add Google Fonts

- [ ] Add Google Fonts link to `apps/main-site/src/layouts/Layout.astro` in `<head>`
- [ ] Add Google Fonts link to `apps/design-system/src/layouts/DocsLayout.astro` in `<head>`
- [ ] Use exact URL from Spec Section 3

### Phase 3: Create Card Component CSS

- [ ] Create `packages/design-system/src/styles/components/` directory
- [ ] Create `packages/design-system/src/styles/components/card.css`
- [ ] Implement card styles:
  - Background: `var(--kide-surface)`
  - Border: `1px solid #e2e8f0`
  - Border radius: `var(--radius-md)`
  - Shadow: `var(--shadow-soft)`
  - Padding: Appropriate spacing
- [ ] Implement hover effect:
  - Transform: `translateY(-2px)`
  - Border color: `var(--kide-ice-mid)`
  - Smooth transition
- [ ] Add `.label` class for metadata text (muted color, small size)

### Phase 4: Create Tag Component CSS

- [ ] Create `packages/design-system/src/styles/components/tag.css`
- [ ] Implement tag styles:
  - Background: `var(--kide-ice-light)`
  - Text color: `var(--kide-ice-deep)`
  - Border radius: `var(--kide-radius-sm)` (pill shape)
  - Padding: Small, balanced
  - Font: Uppercase, bold, small size
- [ ] Implement hover effect:
  - Background: `var(--kide-ice-mid)`
  - Text color: `white`
  - Smooth transition

### Phase 5: Update Package Exports

- [ ] Update `packages/design-system/package.json` exports:
  - Add `"./components/card.css": "./src/styles/components/card.css"`
  - Add `"./components/tag.css": "./src/styles/components/tag.css"`

### Phase 6: Update Typography System

- [ ] Update both layouts to apply global typography rules:
  - Body: `font-family: var(--kide-font-sans)`
  - Headers (h1-h6): `font-family: var(--kide-font-serif)`
  - Headers: `letter-spacing: -0.02em`
  - H1: Add `border-bottom: 3px solid var(--kide-ice-light)`
- [ ] Update `apps/main-site/src/layouts/Layout.astro`
- [ ] Update `apps/design-system/src/layouts/DocsLayout.astro`

### Phase 7: Update Design System Documentation

- [ ] Update `apps/design-system/src/pages/index.astro`:
  - Replace existing color tokens with Kide palette
  - Add Paper & Ink section
  - Add Glacial Accents section
  - Update typography examples to show serif headers
  - Add Card component example
  - Add Tag component example
- [ ] Import card.css and tag.css in the docs page to demonstrate

### Phase 8: Update Main Site Landing Pages

- [ ] Update `apps/main-site/src/pages/index.astro` (Finnish):
  - Verify heading uses new typography
  - Add sample card or tag if appropriate
- [ ] Update `apps/main-site/src/pages/sv/index.astro` (Swedish)
- [ ] Update `apps/main-site/src/pages/en/index.astro` (English)
- [ ] Verify background color is `var(--kide-paper)`

### Phase 9: Verification

- [ ] Run `pnpm --filter main-site dev` and visually verify Kide aesthetic
- [ ] Run `pnpm --filter design-system dev` and verify documentation
- [ ] Check all three locales (/, /sv, /en) render correctly
- [ ] Verify hover effects work on cards and tags
- [ ] Use browser devtools to check contrast ratios:
  - Ink primary on paper: Should be ≥ 4.5:1 (body text)
  - Ink header on paper: Should be ≥ 4.5:1 (headings)
  - Ice deep on ice light: Should be ≥ 4.5:1 (tags)
- [ ] Run E2E tests: `pnpm test:e2e` (should still pass)
- [ ] Format code: `pnpm biome check --write packages/design-system apps/`

---

## 5. Refinement Rule

If contrast ratios fail WCAG AA:
- [ ] STOP and flag for @Architect review
- [ ] Document which color combinations fail
- [ ] Propose adjusted hex values that maintain Kide aesthetic
- [ ] Do NOT proceed without accessibility approval

If hover effects feel sluggish or janky:
- [ ] Adjust transition duration (try 150ms-200ms)
- [ ] Use `transition: all 0.2s ease` or specific properties
- [ ] Test across browsers if possible

---

## 6. Implementation Examples

### Design Tokens (tokens.css)

```css
:root {
  /* --- PALETTE: PAPER & INK --- */
  --kide-paper: #f9f8f6; /* Off-white background */
  --kide-surface: #ffffff; /* Pure white for cards */

  --kide-ink-primary: #1e293b; /* Body text */
  --kide-ink-header: #0f172a; /* Headers */
  --kide-ink-muted: #64748b; /* Metadata */

  /* --- PALETTE: GLACIAL ACCENTS --- */
  --kide-ice-light: #e0f2fe; /* Tag backgrounds */
  --kide-ice-mid: #7dd3fc; /* Borders / Hovers */
  --kide-ice-deep: #0284c7; /* Links / Buttons */

  /* --- TYPOGRAPHY --- */
  --kide-font-serif: 'Playfair Display', Georgia, serif;
  --kide-font-sans: 'Open Sans', system-ui, sans-serif;

  /* --- SHAPE & DEPTH --- */
  --kide-radius-sm: 4px;
  --kide-radius-md: 8px;
  --kide-shadow-soft:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -1px rgba(0, 0, 0, 0.03);
}
```

### Card Component (card.css)

```css
.card {
  background: var(--kide-surface);
  border: 1px solid #e2e8f0;
  border-radius: var(--kide-radius-md);
  padding: 1.5rem;
  box-shadow: var(--kide-shadow-soft);
  transition: all 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: var(--kide-ice-mid);
}

.card .label {
  display: block;
  font-size: 0.875rem;
  color: var(--kide-ink-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}
```

### Tag Component (tag.css)

```css
.tag {
  display: inline-block;
  background: var(--kide-ice-light);
  color: var(--kide-ice-deep);
  padding: 0.25rem 0.75rem;
  border-radius: var(--kide-radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
}

.tag:hover {
  background: var(--kide-ice-mid);
  color: white;
  cursor: pointer;
}
```

### Typography in Layout

```astro
<style is:global>
  body {
    font-family: var(--kide-font-sans);
    background-color: var(--kide-paper);
    color: var(--kide-ink-primary);
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-family: var(--kide-font-serif);
    color: var(--kide-ink-header);
    letter-spacing: -0.02em;
  }

  h1 {
    border-bottom: 3px solid var(--kide-ice-light);
    padding-bottom: 0.5rem;
  }
</style>
```

---

## 7. Commit Message

**Note:** Requires `ALLOW_DS_EDIT=true` flag

```bash
ALLOW_DS_EDIT=true git commit -m "feat(design-system): implement Kide design theme

- Replace minimal tokens with Kide palette using --kide- prefix (Paper, Ink, Ice)
- Add Google Fonts (Playfair Display + Open Sans)
- Create Card component with hover frost effect
- Create Tag component with pill shape
- Update typography system (serif headers, sans body)
- Update design system documentation with theme showcase
- Verify WCAG AA contrast ratios pass

Ref: PBI-010, specs/design-system/spec.md"
```
