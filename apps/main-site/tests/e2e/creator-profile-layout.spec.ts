import { expect, test } from '@playwright/test';
import { createServiceRoleClient } from './test-utils';

/**
 * E2E Tests for Creator Profile Page Layout (ROO-113)
 *
 * Verifies game-based grouping, data-list rendering, standalone
 * fallback section, and empty state.
 *
 * Spec: specs/creator-profile/spec.md § ROO-113 Gherkin scenarios
 */

test.describe('Creator Profile Layout (ROO-113)', () => {
  const testId = `layout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Test entities
  const creatorSlug = `test-creator-layout-${testId}`;
  const emptyCreatorSlug = `test-creator-empty-${testId}`;
  const gameASlug = `test-game-a-${testId}`;
  const gameBSlug = `test-game-b-${testId}`;

  let creatorId: string;
  let emptyCreatorId: string;
  let gameAId: string;
  let gameBId: string;
  let productIds: string[] = [];

  test.beforeAll(async () => {
    const supabase = createServiceRoleClient();

    // Create publisher (required FK for games)
    const { data: publisher, error: pubErr } = await supabase
      .from('publishers')
      .insert({ name: `[TEST] Publisher ${testId}`, slug: `test-pub-${testId}` })
      .select('id')
      .single();
    if (pubErr) throw new Error(`Publisher creation failed: ${pubErr.message}`);

    // Create two games (A sorts before B alphabetically)
    const { data: gameA, error: gaErr } = await supabase
      .from('games')
      .insert({
        name: `Astraterra Test ${testId}`,
        slug: gameASlug,
        publisher_id: publisher.id,
      })
      .select('id')
      .single();
    if (gaErr) throw new Error(`Game A creation failed: ${gaErr.message}`);
    gameAId = gameA.id;

    const { data: gameB, error: gbErr } = await supabase
      .from('games')
      .insert({
        name: `Myrskyn aika Test ${testId}`,
        slug: gameBSlug,
        publisher_id: publisher.id,
      })
      .select('id')
      .single();
    if (gbErr) throw new Error(`Game B creation failed: ${gbErr.message}`);
    gameBId = gameB.id;

    // Create creators
    const { data: creator, error: crErr } = await supabase
      .from('creators')
      .insert({ name: `[TEST] Creator ${testId}`, slug: creatorSlug })
      .select('id')
      .single();
    if (crErr) throw new Error(`Creator creation failed: ${crErr.message}`);
    creatorId = creator.id;

    const { data: emptyCreator, error: ecErr } = await supabase
      .from('creators')
      .insert({ name: `[TEST] Empty Creator ${testId}`, slug: emptyCreatorSlug })
      .select('id')
      .single();
    if (ecErr) throw new Error(`Empty creator creation failed: ${ecErr.message}`);
    emptyCreatorId = emptyCreator.id;

    // Create products: 2 for game A, 1 for game B, 1 standalone
    const products = [
      {
        title: `Product A1 ${testId}`,
        slug: `test-prod-a1-${testId}`,
        product_type: 'Core Rulebook',
        year: 2024,
        lang: 'fi',
        publisher_id: publisher.id,
        game_id: gameAId,
      },
      {
        title: `Product A2 ${testId}`,
        slug: `test-prod-a2-${testId}`,
        product_type: 'Adventure',
        year: 2025,
        lang: 'fi',
        publisher_id: publisher.id,
        game_id: gameAId,
      },
      {
        title: `Product B1 ${testId}`,
        slug: `test-prod-b1-${testId}`,
        product_type: 'Supplement',
        year: 2024,
        lang: 'fi',
        publisher_id: publisher.id,
        game_id: gameBId,
      },
      {
        title: `Standalone Product ${testId}`,
        slug: `test-prod-standalone-${testId}`,
        product_type: 'Zine',
        year: 2023,
        lang: 'fi',
        publisher_id: publisher.id,
        game_id: null,
      },
    ];

    const { data: insertedProducts, error: prodErr } = await supabase
      .from('products')
      .insert(products)
      .select('id');
    if (prodErr) throw new Error(`Products creation failed: ${prodErr.message}`);
    productIds = insertedProducts.map((p) => p.id);

    // Link all products to the creator
    const junctions = insertedProducts.map((p) => ({
      creator_id: creatorId,
      product_id: p.id,
      role: 'Author',
    }));
    const { error: juncErr } = await supabase.from('products_creators').insert(junctions);
    if (juncErr) throw new Error(`Junction creation failed: ${juncErr.message}`);
  });

  test.afterAll(async () => {
    const supabase = createServiceRoleClient();

    // Clean up in dependency order
    await supabase.from('products_creators').delete().eq('creator_id', creatorId);
    for (const pid of productIds) {
      await supabase.from('products').delete().eq('id', pid);
    }
    await supabase.from('creators').delete().eq('id', creatorId);
    await supabase.from('creators').delete().eq('id', emptyCreatorId);
    await supabase.from('games').delete().eq('id', gameAId);
    await supabase.from('games').delete().eq('id', gameBId);
    // Publisher cleanup (slug-based to avoid storing ID)
    await supabase.from('publishers').delete().eq('slug', `test-pub-${testId}`);
  });

  test('groups products by game with section headings', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    // Should have section headings for both games
    const headings = page.locator('.section-heading h2');
    await expect(headings).toHaveCount(3); // game A, game B, standalone
  });

  test('sorts game groups alphabetically with standalone last', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    const headings = page.locator('.section-heading h2');
    const texts = await headings.allTextContents();

    // First heading should be Astraterra (A before M)
    expect(texts[0]).toContain('Astraterra');
    // Second should be Myrskyn aika
    expect(texts[1]).toContain('Myrskyn aika');
    // Last should be the standalone fallback
    expect(texts[2]).toContain('Muut työt');
  });

  test('renders products in data-list rows', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    // Total 4 products across all groups
    const rows = page.locator('.data-list-row');
    await expect(rows).toHaveCount(4);
  });

  test('game headings link to game pages', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    const gameLink = page.locator('.section-heading h2 a').first();
    await expect(gameLink).toHaveAttribute('href', `/pelit/${gameASlug}`);
  });

  test('standalone group heading has no link', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    // The last section heading (standalone) should not contain a link
    const lastHeading = page.locator('.section-heading h2').last();
    const linkCount = await lastHeading.locator('a').count();
    expect(linkCount).toBe(0);
  });

  test('shows section heading counts', async ({ page }) => {
    await page.goto(`/tekijat/${creatorSlug}`);

    const counts = page.locator('.section-heading-count');
    const countTexts = await counts.allTextContents();

    // Game A: 2 products, Game B: 1, Standalone: 1
    expect(countTexts[0]).toBe('2');
    expect(countTexts[1]).toBe('1');
    expect(countTexts[2]).toBe('1');
  });

  test('displays empty state when creator has no products', async ({ page }) => {
    await page.goto(`/tekijat/${emptyCreatorSlug}`);

    await expect(page.locator('h1')).toContainText(`[TEST] Empty Creator ${testId}`);
    await expect(page.locator('.empty-state')).toBeVisible();

    // No data-list rows
    const rows = page.locator('.data-list-row');
    await expect(rows).toHaveCount(0);
  });

  test('JSON-LD schema remains valid after layout refactor', async ({ page }) => {
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

    expect(schema).not.toBeNull();
    expect(schema?.['@type']).toBe('Person');
    expect(schema?.name).toContain(`[TEST] Creator ${testId}`);
  });
});
