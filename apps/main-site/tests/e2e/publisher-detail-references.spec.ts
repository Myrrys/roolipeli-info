import { expect, test } from '@playwright/test';
import { createServiceRoleClient } from './test-utils';

/**
 * E2E Tests for Publisher Detail Page Reference Display + JSON-LD (ROO-26)
 *
 * Verifies that publisher references render on the public page and
 * that JSON-LD sameAs includes official/source URLs.
 *
 * Spec: specs/entity-references/spec.md § Gherkin: Publisher with homepage and social references
 */

test.describe('Publisher Detail References (ROO-26)', () => {
  const testId = `pub-ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const publisherSlug = `test-pub-detail-${testId}`;
  const officialUrl = `https://example.com/official-${testId}`;
  const sourceUrl = `https://example.com/source-${testId}`;
  const socialUrl = `https://example.com/social-${testId}`;

  let publisherId: string;

  test.beforeAll(async () => {
    const supabase = createServiceRoleClient();

    // Create publisher
    const { data: pub, error: pubErr } = await supabase
      .from('publishers')
      .insert({ name: `[TEST] Detail Pub ${testId}`, slug: publisherSlug })
      .select('id')
      .single();
    if (pubErr) throw new Error(`Publisher creation failed: ${pubErr.message}`);
    publisherId = pub.id;

    // Insert references
    const { error: refErr } = await supabase.from('entity_references').insert([
      {
        entity_type: 'publisher',
        entity_id: publisherId,
        reference_type: 'official',
        label: 'Official Site',
        url: officialUrl,
      },
      {
        entity_type: 'publisher',
        entity_id: publisherId,
        reference_type: 'source',
        label: 'Wikipedia',
        url: sourceUrl,
      },
      {
        entity_type: 'publisher',
        entity_id: publisherId,
        reference_type: 'social',
        label: 'Instagram',
        url: socialUrl,
      },
    ]);
    if (refErr) throw new Error(`Reference insertion failed: ${refErr.message}`);
  });

  test.afterAll(async () => {
    const supabase = createServiceRoleClient();
    // Cleanup trigger handles entity_references
    await supabase.from('publishers').delete().eq('id', publisherId);
  });

  test('Public page displays references', async ({ page }) => {
    await page.goto(`/kustantajat/${publisherSlug}`);

    const refList = page.locator('.reference-list');
    await expect(refList).toBeVisible();

    const links = page.locator('.reference-link');
    await expect(links).toHaveCount(3);

    await expect(refList).toContainText('Official Site');
    await expect(refList).toContainText('Wikipedia');
    await expect(refList).toContainText('Instagram');
  });

  test('JSON-LD sameAs includes official and source URLs only', async ({ page }) => {
    await page.goto(`/kustantajat/${publisherSlug}`);

    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();

    let schema: Record<string, unknown> | null = null;
    for (let i = 0; i < count; i++) {
      const text = await jsonLdScripts.nth(i).innerHTML();
      const json = JSON.parse(text);
      if (json['@type'] === 'Organization') {
        schema = json as Record<string, unknown>;
        break;
      }
    }

    if (!schema) throw new Error('No Organization JSON-LD found on page');
    expect(schema['@type']).toBe('Organization');

    const sameAs = schema.sameAs as string[];
    expect(sameAs).toContain(officialUrl);
    expect(sameAs).toContain(sourceUrl);
    expect(sameAs).not.toContain(socialUrl);
  });
});
