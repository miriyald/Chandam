/**
 * Test 08 – Favorites (heart button on rule pages)
 *
 * 1. Navigate to /compute/chandam/:ruleId.
 * 2. Click the heart (#btn-favorite) → button state becomes favorited.
 * 3. Navigate to /rule-sets → a "Favorites" card appears.
 * 4. Navigate to /learn/custom-fav/ → favorited rule is listed.
 * 5. Un-favorite the rule → the Favorites card disappears from /rule-sets.
 *
 * Note: Favorites are stored in IndexedDB. Each test clears favorites via the
 * window.chandam console API so tests start with a clean state.
 */

import { test, expect, gotoAndWait, waitForWasmReady } from '../fixtures/wasm-ready';

// ---------------------------------------------------------------------------
// Helper – get first chandam rule compute page path
// ---------------------------------------------------------------------------

async function getFirstRuleComputePath(
  page: import('@playwright/test').Page,
): Promise<{ ruleId: string; computePath: string }> {
  await gotoAndWait(page, '/learn/chandam/');
  const firstLearnLink = page
    .locator('.rule-list-item .rule-item-actions a[href*="/learn/chandam/"]')
    .first();
  await expect(firstLearnLink).toBeVisible({ timeout: 15_000 });
  const href = await firstLearnLink.getAttribute('href');
  const ruleId = href?.split('/').filter(Boolean).pop() ?? '';
  return { ruleId, computePath: `/compute/chandam/${ruleId}` };
}

// ---------------------------------------------------------------------------
// Helper – clear all favorites using the console API exposed by the app
// ---------------------------------------------------------------------------

async function clearAllFavorites(
  page: import('@playwright/test').Page,
): Promise<void> {
  // The app exposes window.chandam after WASM init
  await page.evaluate(async () => {
    const api = (window as any).chandam;
    if (api?.favorites?.clear) {
      await api.favorites.clear();
    }
  });
}

async function favoriteCurrentRule(
  page: import('@playwright/test').Page,
): Promise<void> {
  const favBtn = page.locator('#btn-favorite');
  await expect(favBtn).toBeVisible();
  await favBtn.click();
  await expect(favBtn).toHaveAttribute('data-favorited', 'true', {
    timeout: 10_000,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Favorites – heart button', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to any page that initialises WASM so console API is available
    await gotoAndWait(page, '/');
    await clearAllFavorites(page);
  });

  test('heart button starts un-favorited', async ({ page }) => {
    const { computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);

    const favBtn = page.locator('#btn-favorite');
    await expect(favBtn).toBeVisible();
    await expect(favBtn).toHaveAttribute('data-favorited', 'false');
  });

  test('clicking heart button toggles to favorited state', async ({
    page,
  }) => {
    const { computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);

    const favBtn = page.locator('#btn-favorite');
    await expect(favBtn).toHaveAttribute('data-favorited', 'false');

    await favBtn.click();
    await page.waitForTimeout(500); // Allow async IndexedDB write

    await expect(favBtn).toHaveAttribute('data-favorited', 'true');
  });

  test('favorited rule appears in /rule-sets as Favorites card', async ({
    page,
  }) => {
    const { computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);

    // Favorite the rule
    await favoriteCurrentRule(page);

    // Navigate to rule-sets page
    await gotoAndWait(page, '/rule-sets');

    // Favorites card should appear via its dedicated structural class.
    const favCard = page.locator('.rule-set-card.favorites-ruleset').first();
    await expect(favCard).toBeVisible({ timeout: 5_000 });
  });

  test('favorited rule appears in /learn/custom-fav/', async ({ page }) => {
    const { ruleId, computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);

    // Favorite the rule
    await favoriteCurrentRule(page);

    // Navigate to the favorites collection learn page
    await gotoAndWait(page, '/learn/custom-fav/');
    await expect(page.locator('.learn-index-page')).toBeVisible({ timeout: 10_000 });

    // The favorited rule should appear in the list
    const ruleItem = page.locator('.rule-list-item').filter({
      has: page.locator(`[href*="${ruleId}"]`),
    });
    await expect(ruleItem).toBeVisible({ timeout: 5_000 });
  });

  test('un-favoriting removes the rule and hides Favorites card', async ({
    page,
  }) => {
    const { computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);

    const favBtn = page.locator('#btn-favorite');

    // Favorite
    await favoriteCurrentRule(page);

    // Un-favorite
    await favBtn.click();
    await page.waitForTimeout(500);
    await expect(favBtn).toHaveAttribute('data-favorited', 'false');

    // Rule-sets should no longer show a Favorites card (it was the only favorite)
    await gotoAndWait(page, '/rule-sets');
    const favCard = page.locator('.rule-set-card.favorites-ruleset');
    await expect(favCard).not.toBeVisible({ timeout: 3_000 });
  });

  test('heart button on learn detail page also works', async ({ page }) => {
    const { ruleId } = await getFirstRuleComputePath(page);
    const learnPath = `/learn/chandam/${ruleId}`;
    await gotoAndWait(page, learnPath);

    const favBtn = page.locator('#btn-favorite');
    await expect(favBtn).toBeVisible();
    await expect(favBtn).toHaveAttribute('data-favorited', 'false');

    await favBtn.click();
    await page.waitForTimeout(500);
    await expect(favBtn).toHaveAttribute('data-favorited', 'true');

    // Clean up
    await favBtn.click();
    await page.waitForTimeout(500);
  });
});

// ---------------------------------------------------------------------------
// Helper – get first topella rule path
// ---------------------------------------------------------------------------

async function getFirstTopellaRulePath(
  page: import('@playwright/test').Page,
): Promise<{ ruleId: string; learnPath: string }> {
  await gotoAndWait(page, '/learn/topella/');
  const firstLearnLink = page
    .locator('.rule-list-item .rule-item-actions a[href*="/learn/topella/"]')
    .first();
  await expect(firstLearnLink).toBeVisible({ timeout: 15_000 });
  const href = await firstLearnLink.getAttribute('href');
  const ruleId = href?.split('/').filter(Boolean).pop() ?? '';
  return { ruleId, learnPath: `/learn/topella/${ruleId}` };
}

// ---------------------------------------------------------------------------
// Multi-ruleset favorites & persistence
// ---------------------------------------------------------------------------

test.describe('Favorites – multi-ruleset and persistence', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/');
    await clearAllFavorites(page);
  });

  test('favorites from chandam and topella both appear in custom-fav', async ({
    page,
  }) => {
    // Favorite a chandam rule
    const { ruleId: chandamRuleId } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, `/learn/chandam/${chandamRuleId}`);
    await favoriteCurrentRule(page);

    // Favorite a topella rule
    const { ruleId: topellaRuleId } = await getFirstTopellaRulePath(page);
    await gotoAndWait(page, `/learn/topella/${topellaRuleId}`);
    await favoriteCurrentRule(page);

    // Navigate to favorites collection
    await gotoAndWait(page, '/learn/custom-fav/');
    await expect(page.locator('.learn-index-page')).toBeVisible({ timeout: 10_000 });

    // Both rules should appear
    const ruleItems = page.locator('.rule-list-item');
    const count = await ruleItems.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Clean up
    await gotoAndWait(page, '/');
    await clearAllFavorites(page);
  });

  test('filtering within favorites collection works', async ({ page }) => {
    // Setup: favorite two chandam rules
    await gotoAndWait(page, '/learn/chandam/');
    const ruleLinks = page.locator('.rule-list-item .rule-item-actions a[href*="/learn/chandam/"]');
    const firstHref = await ruleLinks.nth(0).getAttribute('href');
    const secondHref = await ruleLinks.nth(1).getAttribute('href');

    // Favorite first rule
    await gotoAndWait(page, firstHref!);
    await favoriteCurrentRule(page);

    // Favorite second rule
    await gotoAndWait(page, secondHref!);
    await favoriteCurrentRule(page);

    // Navigate to favorites collection
    await gotoAndWait(page, '/learn/custom-fav/');
    await expect(page.locator('.learn-index-page')).toBeVisible({ timeout: 10_000 });

    // Get initial count
    const initialCount = await page.locator('.rule-list-item').count();
    expect(initialCount).toBeGreaterThanOrEqual(2);

    // Use search filter with a specific rule name
    const firstName = await page.locator('.rule-list-item .meter-name').first().textContent();
    const searchInput = page.locator('.filter-search');
    if (await searchInput.isVisible()) {
      await searchInput.fill(firstName?.trim() ?? '');
      await page.waitForTimeout(300);
      const filteredCount = await page.locator('.rule-list-item').count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
      expect(filteredCount).toBeGreaterThanOrEqual(1);
    }

    // Clean up
    await gotoAndWait(page, '/');
    await clearAllFavorites(page);
  });

  test('favorites survive page.reload()', async ({ page }) => {
    // Favorite a rule
    const { ruleId, computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);
    await favoriteCurrentRule(page);

    // Hard reload
    await page.reload();
    await waitForWasmReady(page);

    // Heart should still be filled (IndexedDB hydration on page load)
    await expect(page.locator('#btn-favorite')).toHaveAttribute('data-favorited', 'true');

    // Clean up
    await page.locator('#btn-favorite').click();
    await page.waitForTimeout(500);
  });
});
