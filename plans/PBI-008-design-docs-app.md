# PBI-008: Design System Documentation App

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 1, App Reference)  
> **Persona:** @Dev

---

## 1. The Directive

Initialize the design system documentation site that showcases design tokens and will eventually document all UI components. This is an internal-facing tool for developers and designers.

**In Scope:**
- Initialize Astro project in `apps/design-system/`
- Add Svelte integration (static site, no SSR needed)
- Create landing page documenting design tokens from `@roolipeli/design-system`
- Display all color tokens with visual swatches
- Display spacing scale with visual examples
- Import and demonstrate the tokens in action

**Out of Scope:**
- Component documentation (no components exist yet)
- SSR mode (static site is sufficient for docs)
- Interactive component playground (future enhancement)
- Deployment configuration

---

## 2. Context Pointers

- **Purpose:** Internal documentation site for the design system
- **Astro Mode:** Static (`output: 'static'`) is sufficient
- **Design Tokens:** Import from `@roolipeli/design-system/tokens.css`
- **Content:** Focus on tokens (colors, spacing, typography)

---

## 3. Verification Pointers

- **Success Criteria:**
  - Astro project initialized successfully in `apps/design-system/`
  - Run `pnpm --filter design-system dev` → Server starts
  - Landing page displays all design tokens with visual examples
  - Color tokens shown with color swatches
  - Spacing tokens shown with visual scale
  - TypeScript compilation succeeds
  - Biome formatting passes

- **Quality Gate:** 
  - `pnpm --filter design-system build` → Builds successfully
  - `pnpm biome check --write apps/design-system`
  - `pnpm --filter design-system tsc --noEmit`

---

## 4. Task Checklist

- [ ] Navigate to `apps/` directory
- [ ] Run `pnpm create astro@latest design-system` with options:
  - Template: minimal
  - TypeScript: strict
  - Install dependencies: yes
  - Git: no (already in monorepo)
- [ ] Add Svelte integration: `pnpm astro add svelte`
- [ ] Configure `astro.config.mjs` (static output, Svelte integration)
- [ ] Update `tsconfig.json` to extend `@roolipeli/config/tsconfig.astro.json`
- [ ] Create `src/layouts/DocsLayout.astro` that imports design tokens
- [ ] Create `src/pages/index.astro` documenting:
  - Color tokens (primitives and semantic)
  - Spacing scale
  - Font family
- [ ] Add visual examples for each token category
- [ ] Test dev server: `pnpm --filter design-system dev`
- [ ] Run build to verify: `pnpm --filter design-system build`
- [ ] Run Biome formatting

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Ensure design token import path is correct
- [ ] Verify all tokens from `tokens.css` are documented
- [ ] Check that visual examples accurately represent the tokens

---

## 6. Implementation Example

**astro.config.mjs:**
```javascript
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [svelte()],
});
```

**src/layouts/DocsLayout.astro:**
```astro
---
import '@roolipeli/design-system/tokens.css';

interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <header>
      <h1>Roolipeli.info Design System</h1>
    </header>
    <main>
      <slot />
    </main>
  </body>
</html>

<style>
  body {
    font-family: var(--font-family-sans);
    background-color: var(--color-bg-secondary);
    color: var(--color-text-body);
    margin: 0;
    padding: var(--spacing-lg);
  }

  header {
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border);
  }

  header h1 {
    color: var(--color-accent);
    margin: 0;
  }
</style>
```

**src/pages/index.astro:**
```astro
---
import DocsLayout from '../layouts/DocsLayout.astro';
---

<DocsLayout title="Design Tokens - Roolipeli.info Design System">
  <section>
    <h2>Color Tokens</h2>
    
    <h3>Primitive Colors</h3>
    <div class="token-grid">
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-blue-500);"></div>
        <code>--color-blue-500</code>
      </div>
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-gray-900);"></div>
        <code>--color-gray-900</code>
      </div>
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-white); border: 1px solid var(--color-border);"></div>
        <code>--color-white</code>
      </div>
    </div>

    <h3>Semantic Colors</h3>
    <div class="token-grid">
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-bg-primary);"></div>
        <code>--color-bg-primary</code>
      </div>
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-bg-secondary);"></div>
        <code>--color-bg-secondary</code>
      </div>
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-accent);"></div>
        <code>--color-accent</code>
      </div>
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-text-body);"></div>
        <code>--color-text-body</code>
      </div>
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-text-muted);"></div>
        <code>--color-text-muted</code>
      </div>
      <div class="token-card">
        <div class="swatch" style="background-color: var(--color-border);"></div>
        <code>--color-border</code>
      </div>
    </div>
  </section>

  <section>
    <h2>Spacing Scale</h2>
    <div class="spacing-examples">
      <div class="spacing-item">
        <div class="spacing-box" style="width: var(--spacing-xs);"></div>
        <code>--spacing-xs (0.25rem)</code>
      </div>
      <div class="spacing-item">
        <div class="spacing-box" style="width: var(--spacing-sm);"></div>
        <code>--spacing-sm (0.5rem)</code>
      </div>
      <div class="spacing-item">
        <div class="spacing-box" style="width: var(--spacing-md);"></div>
        <code>--spacing-md (1rem)</code>
      </div>
      <div class="spacing-item">
        <div class="spacing-box" style="width: var(--spacing-lg);"></div>
        <code>--spacing-lg (1.5rem)</code>
      </div>
      <div class="spacing-item">
        <div class="spacing-box" style="width: var(--spacing-xl);"></div>
        <code>--spacing-xl (2rem)</code>
      </div>
    </div>
  </section>

  <section>
    <h2>Typography</h2>
    <div class="typography-example">
      <p style="font-family: var(--font-family-sans);">
        The quick brown fox jumps over the lazy dog
      </p>
      <code>--font-family-sans: system-ui, -apple-system, sans-serif</code>
    </div>
  </section>
</DocsLayout>

<style>
  section {
    margin-bottom: var(--spacing-xl);
  }

  h2 {
    color: var(--color-text-body);
    margin-bottom: var(--spacing-md);
  }

  h3 {
    color: var(--color-text-muted);
    margin-top: var(--spacing-lg);
    margin-bottom: var(--spacing-sm);
    font-size: 1rem;
  }

  .token-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
  }

  .token-card {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .swatch {
    width: 100%;
    height: 60px;
    border-radius: 4px;
    border: 1px solid var(--color-border);
  }

  .spacing-examples {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .spacing-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
  }

  .spacing-box {
    height: 24px;
    background-color: var(--color-accent);
    border-radius: 2px;
  }

  .typography-example {
    padding: var(--spacing-md);
    background-color: var(--color-bg-primary);
    border-radius: 4px;
    border: 1px solid var(--color-border);
  }

  .typography-example p {
    margin: 0 0 var(--spacing-sm) 0;
    font-size: 1.125rem;
  }

  code {
    font-family: monospace;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }
</style>
```

---

## 7. Commit Message

```
feat(design-docs): initialize design system documentation site

- Initialize Astro static site for design system documentation
- Add Svelte integration for future interactive examples
- Create comprehensive token documentation page
- Display color swatches for all color tokens
- Show visual spacing scale examples
- Demonstrate typography tokens

Ref: PBI-008
```
