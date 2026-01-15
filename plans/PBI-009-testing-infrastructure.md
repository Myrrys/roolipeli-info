# PBI-009: Testing Infrastructure

> **Spec Reference:** `docs/roolipeli-info-scaffolding.md` (Section 5.2)  
> **Persona:** @Dev

---

## 1. The Directive

Set up testing infrastructure across the monorepo with Vitest for unit tests and Playwright for E2E tests. Create initial smoke tests to verify the infrastructure works.

**In Scope:**
- Install Vitest in root workspace and `packages/database`
- Install Playwright in both apps (`main-site` and `design-system`)
- Create `vitest.config.ts` configurations
- Create `playwright.config.ts` configurations following scaffolding spec
- Write one smoke test for each app (verifies page loads)
- Add test scripts to root `package.json`
- Verify all tests pass

**Out of Scope:**
- Comprehensive unit tests for packages (comes with feature work)
- Comprehensive E2E test suites (comes with feature work)
- Visual regression testing
- Accessibility testing (future enhancement)
- CI/CD pipeline configuration

---

## 2. Context Pointers

- **Vitest:** For unit and integration testing of packages and utilities
- **Playwright:** For E2E browser testing of applications
- **Playwright Config:** Follow `docs/roolipeli-info-scaffolding.md` Section 5.2
- **Test Philosophy:** Smoke tests now, comprehensive tests with features

---

## 3. Verification Pointers

- **Success Criteria:**
  - Run `pnpm vitest run` from root → Executes successfully (even if no tests)
  - Run `pnpm exec playwright test` → Runs smoke tests in both apps
  - Smoke test for main-site verifies landing page loads
  - Smoke test for design-system verifies docs page loads
  - All tests pass
  - Test commands added to root `package.json`

- **Quality Gate:** 
  - `pnpm test:unit` → Vitest passes
  - `pnpm test:e2e` → Playwright tests pass
  - `pnpm biome check --write .`

---

## 4. Task Checklist

- [ ] Install Vitest in root: `pnpm add -D -w vitest`
- [ ] Install Vitest in database package: `pnpm --filter @roolipeli/database add -D vitest`
- [ ] Install Playwright in main-site: `pnpm --filter main-site add -D @playwright/test`
- [ ] Install Playwright in design-system: `pnpm --filter design-system add -D @playwright/test`
- [ ] Install Playwright browsers: `pnpm exec playwright install`
- [ ] Create `vitest.config.ts` in root
- [ ] Create `vitest.config.ts` in `packages/database`
- [ ] Create `playwright.config.ts` in `apps/main-site`
- [ ] Create `playwright.config.ts` in `apps/design-system`
- [ ] Create `apps/main-site/tests/e2e/smoke.spec.ts`
- [ ] Create `apps/design-system/tests/e2e/smoke.spec.ts`
- [ ] Update root `package.json` scripts:
  - `test:unit`: `vitest run`
  - `test:e2e`: `playwright test`
  - `test`: `pnpm test:unit && pnpm test:e2e`
- [ ] Run tests to verify: `pnpm test:unit`
- [ ] Run E2E tests: `pnpm test:e2e`
- [ ] Run Biome formatting

---

## 5. Refinement Rule

This PBI has no parent Spec (it's infrastructure). If issues arise:
- [ ] Ensure Playwright browsers are installed correctly
- [ ] Verify dev servers start before E2E tests run
- [ ] Check that test commands work from root

---

## 6. Implementation Example

**vitest.config.ts (root):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**packages/database/vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

**apps/main-site/playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'pnpm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'tests/e2e',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**apps/design-system/playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'pnpm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'tests/e2e',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**apps/main-site/tests/e2e/smoke.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test('main site loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Tervetuloa');
});

test('swedish locale works', async ({ page }) => {
  await page.goto('/sv');
  await expect(page.locator('h1')).toContainText('Välkommen');
});

test('english locale works', async ({ page }) => {
  await page.goto('/en');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```

**apps/design-system/tests/e2e/smoke.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test('design system docs load', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Design System');
});

test('color tokens are displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h2')).toContainText('Color Tokens');
});

test('spacing tokens are displayed', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h2')).toContainText('Spacing Scale');
});
```

**Update root package.json scripts:**
```json
{
  "scripts": {
    "dev": "echo 'Use pnpm --filter <app> dev'",
    "build": "pnpm -r build",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test": "pnpm test:unit && pnpm test:e2e"
  }
}
```

---

## 7. Commit Message

```
feat(testing): add vitest and playwright infrastructure

- Install Vitest for unit testing (root and database package)
- Install Playwright for E2E testing (both apps)
- Configure test runners with proper dev server integration
- Add smoke tests for main-site (all locales)
- Add smoke tests for design-system docs
- Add test scripts to root package.json

Ref: PBI-009
```
