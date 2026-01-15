# PBI-007: Main Site Astro App

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 5)  
> **Persona:** @Dev

---

## 1. The Directive

Initialize the main Astro application that will serve as the public-facing knowledge base. Configure SSR mode, Svelte integration, i18n routing, and import design tokens from the design system package.

**In Scope:**
- Initialize Astro project in `apps/main-site/`
- Configure SSR mode with Node adapter (dev) / Netlify adapter (production note)
- Add Svelte 5 integration
- Configure i18n routing (fi/sv/en) with Finnish as default
- Install necessary dependencies
- Create basic landing page that imports and uses design tokens
- Verify dev server starts and i18n routing works

**Out of Scope:**
- Database connection (comes with feature work)
- Actual content pages beyond landing page
- Playwright E2E tests (that's PBI-009)
- Production deployment configuration

---

## 2. Context Pointers

- **Astro Configuration:** Follow `docs/roolipeli-info-scaffolding.md` Section 5.1
- **SSR Mode:** Use Node adapter for development (output: 'server')
- **i18n Setup:** Default locale 'fi', additional locales 'sv' and 'en'
- **Design Tokens:** Import `@roolipeli/design-system/tokens.css` globally
- **Svelte Version:** Use Svelte 5 with Runes

---

## 3. Verification Pointers

- **Success Criteria:**
  - Astro project initialized successfully in `apps/main-site/`
  - Run `pnpm --filter main-site dev` → Server starts on port 4321
  - Visit `http://localhost:4321` → Landing page loads
  - Visit `http://localhost:4321/sv` → Swedish route works
  - Visit `http://localhost:4321/en` → English route works
  - Landing page uses design tokens (inspect CSS shows `var(--color-*)`)
  - TypeScript compilation succeeds
  - Biome formatting passes

- **Quality Gate:** 
  - `pnpm --filter main-site build` → Builds successfully
  - `pnpm biome check --write apps/main-site`
  - `pnpm --filter main-site tsc --noEmit`

---

## 4. Task Checklist

- [ ] Navigate to `apps/` directory
- [ ] Run `pnpm create astro@latest main-site` with options:
  - Template: minimal
  - TypeScript: strict
  - Install dependencies: yes
  - Git: no (already in monorepo)
- [ ] Add Astro integrations: `pnpm astro add svelte node`
- [ ] Configure `astro.config.mjs` following scaffolding doc Section 5.1:
  - SSR output mode
  - Node adapter
  - Svelte integration
  - i18n configuration (fi/sv/en)
- [ ] Update `tsconfig.json` to extend `@roolipeli/config/tsconfig.astro.json`
- [ ] Create `src/layouts/Layout.astro` that imports design tokens
- [ ] Create `src/pages/index.astro` (Finnish landing page)
- [ ] Create `src/pages/sv/index.astro` (Swedish landing page)
- [ ] Create `src/pages/en/index.astro` (English landing page)
- [ ] Import `@roolipeli/design-system/tokens.css` in layout
- [ ] Test dev server: `pnpm --filter main-site dev`
- [ ] Test all three routes (/, /sv, /en)
- [ ] Run build to verify: `pnpm --filter main-site build`
- [ ] Run Biome formatting

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Verify Astro version is 5.x or later
- [ ] Ensure Svelte integration supports Svelte 5
- [ ] Check that design token import path is correct
- [ ] Verify i18n routing configuration matches docs

---

## 6. Implementation Example

**astro.config.mjs:**
```javascript
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [svelte()],
  i18n: {
    defaultLocale: 'fi',
    locales: ['fi', 'sv', 'en'],
    routing: {
      prefixDefaultLocale: false
    }
  }
});
```

**src/layouts/Layout.astro:**
```astro
---
import '@roolipeli/design-system/tokens.css';

interface Props {
  title: string;
  lang?: string;
}

const { title, lang = 'fi' } = Astro.props;
---

<!DOCTYPE html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>

<style>
  body {
    font-family: var(--font-family-sans);
    background-color: var(--color-bg-primary);
    color: var(--color-text-body);
    margin: 0;
    padding: var(--spacing-md);
  }
</style>
```

**src/pages/index.astro (Finnish):**
```astro
---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Roolipeli.info - Suomalaisten roolipelien tietokanta" lang="fi">
  <main>
    <h1 style="color: var(--color-accent)">Tervetuloa!</h1>
    <p>Kanoninen tietolähde suomalaisista roolipeleistä.</p>
  </main>
</Layout>
```

**src/pages/sv/index.astro (Swedish):**
```astro
---
import Layout from '../../layouts/Layout.astro';
---

<Layout title="Roolipeli.info - Finländska rollspel" lang="sv">
  <main>
    <h1 style="color: var(--color-accent)">Välkommen!</h1>
    <p>Den kanoniska källan för finländska rollspel.</p>
  </main>
</Layout>
```

**src/pages/en/index.astro (English):**
```astro
---
import Layout from '../../layouts/Layout.astro';
---

<Layout title="Roolipeli.info - Finnish RPGs" lang="en">
  <main>
    <h1 style="color: var(--color-accent)">Welcome!</h1>
    <p>The canonical source for Finnish tabletop RPGs.</p>
  </main>
</Layout>
```

---

## 7. Commit Message

```
feat(main-site): initialize astro ssr app with i18n

- Initialize Astro 5 project with minimal template
- Configure SSR mode with Node adapter
- Add Svelte 5 integration for interactive islands
- Configure i18n routing (fi/sv/en, Finnish default)
- Import and use design tokens from @roolipeli/design-system
- Create basic landing pages for all three locales

Ref: PBI-007
```
