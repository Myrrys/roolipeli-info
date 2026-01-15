# PBI-005: Design System Package

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 4.2)  
> **Persona:** @Dev (with @Architect oversight)

---

## 1. The Directive

Create the PROTECTED `@roolipeli/design-system` package with foundational design tokens. This package will be guarded by Lefthook to prevent unauthorized modifications.

**In Scope:**
- Create `packages/design-system/` directory structure
- Initialize `package.json` with CSS and component exports
- Install Svelte dependency
- Create `src/styles/tokens.css` with base design tokens (primitives and semantic)
- Verify Lefthook protection guard blocks unauthorized edits

**Out of Scope:**
- Svelte components (comes with feature work)
- Component documentation (that's PBI-008)
- Advanced design tokens beyond the base set

---

## 2. Context Pointers

- **Design Tokens:** Follow exact token structure from `docs/roolipeli-info-scaffolding.md` Section 4.2
- **Protection:** This package is PROTECTED by Lefthook (configured in PBI-002)
- **Token Strategy:** Primitive tokens (colors, spacing base) + Semantic tokens (usage-based)
- **CSS Variables:** All tokens use CSS custom properties (`--prefix-name`)

---

## 3. Verification Pointers

- **Success Criteria:**
  - Package structure created successfully
  - `tokens.css` includes all base tokens from scaffolding spec
  - Tokens follow naming convention: `--color-*`, `--spacing-*`, `--font-*`
  - Package can be imported: `import '@roolipeli/design-system/tokens.css'`
  - Attempting to commit changes requires `ALLOW_DS_EDIT=true` (guard works)
  - Biome formatting passes

- **Quality Gate:** 
  - `ALLOW_DS_EDIT=true pnpm biome check --write packages/design-system`
  - Protection test: Attempt commit without flag → Should fail

---

## 4. Task Checklist

- [ ] Create `packages/design-system/` directory
- [ ] Create `packages/design-system/src/` directory
- [ ] Create `packages/design-system/src/styles/` directory
- [ ] Create `packages/design-system/src/components/` directory (empty for now)
- [ ] Initialize `package.json` with:
  - Name: `@roolipeli/design-system`
  - Exports for `tokens.css` and components
  - Dependency: `svelte`
- [ ] Create `src/styles/tokens.css` with design tokens from scaffolding spec Section 4.2
- [ ] Run `pnpm install` to install Svelte
- [ ] Test protection: Create test file and attempt commit without `ALLOW_DS_EDIT=true`
- [ ] Verify protection works (should block)
- [ ] Run Biome with `ALLOW_DS_EDIT=true`

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Ensure tokens match scaffolding doc exactly
- [ ] Verify Lefthook guard from PBI-002 is active
- [ ] Check CSS variable naming follows convention

---

## 6. Implementation Example

**package.json:**
```json
{
  "name": "@roolipeli/design-system",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    "./tokens.css": "./src/styles/tokens.css",
    "./components/*": "./src/components/*"
  },
  "dependencies": {
    "svelte": "^5.0.0"
  }
}
```

**src/styles/tokens.css (from scaffolding doc Section 4.2):**
```css
:root {
  /* Primitive Tokens */
  --color-blue-500: #3b82f6;
  --color-gray-900: #111827;
  --color-white: #ffffff;
  --spacing-base: 0.25rem;
  --font-family-sans: system-ui, -apple-system, sans-serif;

  /* Semantic Tokens */
  --color-bg-primary: var(--color-white);
  --color-bg-secondary: #f9fafb;
  --color-text-body: var(--color-gray-900);
  --color-text-muted: #6b7280;
  --color-border: #e5e7eb;
  --color-accent: var(--color-blue-500);
  
  /* Spacing Scale */
  --spacing-xs: calc(var(--spacing-base) * 1);   /* 0.25rem */
  --spacing-sm: calc(var(--spacing-base) * 2);   /* 0.5rem */
  --spacing-md: calc(var(--spacing-base) * 4);   /* 1rem */
  --spacing-lg: calc(var(--spacing-base) * 6);   /* 1.5rem */
  --spacing-xl: calc(var(--spacing-base) * 8);   /* 2rem */
}
```

**Testing the protection:**
```bash
# Create a test file
echo "test" > packages/design-system/test.txt
git add packages/design-system/test.txt

# This should FAIL (guard blocks)
git commit -m "test: verify guard"

# This should SUCCEED
ALLOW_DS_EDIT=true git commit -m "test: verify guard"

# Clean up
rm packages/design-system/test.txt
```

---

## 7. Commit Message

**Note:** This commit REQUIRES `ALLOW_DS_EDIT=true`

```bash
ALLOW_DS_EDIT=true git commit -m "feat(design-system): initialize protected design system package

- Create @roolipeli/design-system package structure
- Add base design tokens (primitive and semantic)
- Configure exports for tokens.css and future components
- Verify Lefthook protection guard prevents unauthorized edits

Ref: PBI-005"
```
