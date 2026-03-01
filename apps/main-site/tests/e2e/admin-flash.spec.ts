import { type BrowserContext, expect, type Page, test } from '@playwright/test';
import { ADMIN_EMAIL, createAdminSession, createServiceRoleClient } from './test-utils';

test.describe('Admin Flash Messages (ROO-16)', () => {
  let context: BrowserContext;
  let page: Page;
  const cleanupPublisherSlugs: string[] = [];

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    const cookies = await createAdminSession(ADMIN_EMAIL);
    await context.addCookies(cookies);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.afterAll(async () => {
    const supabase = createServiceRoleClient();
    for (const slug of cleanupPublisherSlugs) {
      await supabase.from('publishers').delete().eq('slug', slug);
    }
  });

  test('Success snackbar appears after creating a publisher', async () => {
    const testId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const testName = `[TEST] Flash ${testId}`;
    const testSlug = `test-flash-${testId}`;
    cleanupPublisherSlugs.push(testSlug);

    await page.goto('/admin/publishers/new');
    await page.locator('#publisher-form[data-initialized="true"]').waitFor({ timeout: 10000 });
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="slug"]', testSlug);
    await page.click('button[type="submit"]');

    // Should redirect to listing with ?success=created
    await expect(page).toHaveURL(/\/admin\/publishers\?success=created/);

    // Snackbar should appear with success message
    const snackbar = page.locator('.snackbar--success');
    await expect(snackbar).toBeVisible({ timeout: 5000 });
    await expect(snackbar.locator('.snackbar__message')).toContainText('onnistuneesti');

    // Cleanup: delete the publisher via UI
    const row = page.locator('tr', { hasText: testName }).first();
    await row.locator('.delete').click();
    await expect(page.locator('.modal')).toBeVisible();
    await page.locator('.btn-delete').click();

    // Should see a success snackbar after delete too
    await expect(page).toHaveURL(/\/admin\/publishers\?deleted=true/);
    const deleteSnackbar = page.locator('.snackbar--success');
    await expect(deleteSnackbar).toBeVisible({ timeout: 5000 });

    const index = cleanupPublisherSlugs.indexOf(testSlug);
    if (index > -1) cleanupPublisherSlugs.splice(index, 1);
  });

  test('Error snackbar appears when error query param is present', async () => {
    // Navigate directly with ?error= param to test the error flash path.
    // Note: publishers FK uses ON DELETE SET NULL, so referential integrity
    // errors don't occur for publishers. We test the error snackbar plumbing
    // by simulating the redirect URL that DeleteConfirm would produce on a
    // non-2xx API response.
    await page.goto('/admin/publishers?error=Something%20went%20wrong');

    const errorSnackbar = page.locator('.snackbar--error');
    await expect(errorSnackbar).toBeVisible({ timeout: 5000 });
    await expect(errorSnackbar.locator('.snackbar__message')).toContainText('Something went wrong');
  });
});
