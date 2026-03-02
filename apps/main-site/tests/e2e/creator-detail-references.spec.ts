import { expect, test } from '@playwright/test';
import { createServiceRoleClient } from './test-utils';

/**
 * E2E Tests for Creator Detail Page Reference Display + JSON-LD (ROO-26)
 *
 * Verifies that creator references render on the public page and
 * that JSON-LD sameAs includes official/source URLs.
 *
 * Spec: specs/entity-references/spec.md § Gherkin: Creator with portfolio reference
 */

test.describe('Creator Detail References (ROO-26)', () => {
  const testId = `cr-ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const creatorSlug = `test-creator-detail-${testId}`;
  const officialUrl = `https://example.com/creator-official-${testId}`;
  const sourceUrl = `https://example.com/creator-source-${testId}`;
  const socialUrl = `https://example.com/creator-social-${testId}`;

  let creatorId: string;

  test.beforeAll(async () => {
    const supabase = createServiceRoleClient();

    // Create creator
    const { data: creator, error: crErr } = await supabase
      .from('creators')
      .insert({ name: `[TEST] Detail Creator ${testId}`, slug: creatorSlug })
      .select('id')
      .single();
    if (crErr) throw new Error(`Creator creation failed: ${crErr.message}`);
    creatorId = creator.id;

    // Insert references
    const { error: refErr } = await supabase.from('entity_references').insert([
      {
        entity_type: 'creator',
        entity_id: creatorId,
        reference_type: 'official',
        label: 'Personal Site',
        url: officialUrl,
      },
      {
        entity_type: 'creator',
        entity_id: creatorId,
        reference_type: 'source',
        label: 'ArtStation',
        url: sourceUrl,
      },
      {
        entity_type: 'creator',
        entity_id: creatorId,
        reference_type: 'social',
        label: 'Twitter',
        url: socialUrl,
      },
    ]);
    if (refErr) throw new Error(`Reference insertion failed: ${refErr.message}`);
  });

  test.afterAll(async () => {
    const supabase = createServiceRoleClient();
    // Cleanup trigger handles entity_references
    await supabase.from('creators').delete().eq('id', creatorId);
  });

  test('Public page displays references', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    const refList = page.locator('.reference-list');
    await expect(refList).toBeVisible();

    const links = page.locator('.reference-link');
    await expect(links).toHaveCount(3);

    await expect(refList).toContainText('Personal Site');
    await expect(refList).toContainText('ArtStation');
    await expect(refList).toContainText('Twitter');
  });

  test('JSON-LD sameAs includes official and source URLs only', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    let schema: Record<string, unknown> | null = null;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).innerHTML();
      const json = JSON.parse(text);
      if (json['@type'] === 'Person') {
        schema = json as Record<string, unknown>;
        break;
      }
    }

    if (!schema) throw new Error('No Person JSON-LD found on page');
    expect(schema['@type']).toBe('Person');

    const sameAs = schema.sameAs as string[];
    expect(sameAs).toContain(officialUrl);
    expect(sameAs).toContain(sourceUrl);
    expect(sameAs).not.toContain(socialUrl);
  });
});
