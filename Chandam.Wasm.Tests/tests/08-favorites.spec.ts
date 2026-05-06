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

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

// ---------------------------------------------------------------------------
// Helper – get first chandam rule compute page path
// ---------------------------------------------------------------------------

async function getFirstRuleComputePath(
  page: import('@playwright/test').Page,
): Promise<{ ruleId: string; computePath: string }> {
  await gotoAndWait(page, '/learn/chandam/');
  const firstLearnLink = page
    .locator('.rule-list-item .rule-links a[href*="/learn/chandam/"]')
    .first();
  await expect(firstLearnLink).toBeVisible();
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
    await expect(favBtn).toHaveAttribute('aria-label', 'Remove from favorites');
  });

  test('favorited rule appears in /rule-sets as Favorites card', async ({
    page,
  }) => {
    const { computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);

    // Favorite the rule
    const favBtn = page.locator('#btn-favorite');
    await favBtn.click();
    await page.waitForTimeout(500);

    // Navigate to rule-sets page
    await gotoAndWait(page, '/rule-sets');

    // A "Favorites" or "custom-fav" card should now be visible
    const favCard = page
      .locator('.rule-set-card.favorites-ruleset, .rule-set-card .meter-name')
      .filter({ hasText: /favorites|custom-fav/i })
      .first();
    await expect(favCard).toBeVisible({ timeout: 5_000 });
  });

  test('favorited rule appears in /learn/custom-fav/', async ({ page }) => {
    const { ruleId, computePath } = await getFirstRuleComputePath(page);
    await gotoAndWait(page, computePath);

    // Favorite the rule
    await page.locator('#btn-favorite').click();
    await page.waitForTimeout(500);

    // Navigate to the favorites collection learn page via SPA (preserve WASM state)
    // Use history.pushState + popstate to trigger the SPA router without full reload
    await page.evaluate(() => {
      history.pushState(null, '', '/learn/custom-fav/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    // Wait for learn index to render with custom-fav content
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
    await favBtn.click();
    await page.waitForTimeout(500);
    await expect(favBtn).toHaveAttribute('data-favorited', 'true');

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
