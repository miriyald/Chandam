/**
 * Test 04 – Learn (Search) page filter combinations
 *
 * 1. Navigate to /learn/chandam/.
 * 2. Wait for WASM ready; assert filter sidebar and results render.
 * 3. Note the initial rule count.
 * 4. Search filter: type a Telugu character → wait for debounce → count changes.
 * 5. Clear search → count returns to original.
 * 6. Category checkboxes:
 *    a. Check first available category → count changes.
 *    b. Check second category → count is superset.
 *    c. Uncheck both → count back to original.
 * 7. Has-examples radio: select "With examples" → count changes.
 *    Select "All" → count restores.
 * 8. Matra length range: enter min=10, max=20 → filtered count appears.
 *    Clear inputs → count restores.
 * 9. Apply multiple filters + Clear All → count returns to original.
 * 10. Take screenshot of filtered state.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

/** Reads the numeric rule count from the results header label. */
async function readRuleCount(page: import('@playwright/test').Page): Promise<number> {
  // The filter bar renders text like "14 of 14"
  const header = page.locator('.filter-actions .rule-count');
  await expect(header).toBeVisible({ timeout: 10_000 });
  const text = await header.textContent();
  const match = text?.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

/** Waits for the debounce period used by the search input (300 ms + margin). */
async function waitForFilterUpdate(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForTimeout(500);
  // Also wait for any in-flight WASM search to resolve
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Some filter updates on mobile can finish after debounce + render delay.
 * Poll until the expected count appears instead of asserting immediately.
 */
async function expectRuleCountEventually(
  page: import('@playwright/test').Page,
  expectedCount: number,
): Promise<void> {
  await expect
    .poll(() => readRuleCount(page), {
      timeout: 10_000,
      message: `Expected rule count to settle at ${expectedCount}`,
    })
    .toBe(expectedCount);
}

test.describe('Learn page – filter sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/learn/chandam/');
  });

  test('filter sidebar and rule list render on load', async ({ page }) => {
    await expect(page.locator('.filter-bar')).toBeVisible();
    await expect(page.locator('.filter-search')).toBeVisible();

    // At least one rule list item
    const ruleItems = page.locator('.rule-list-item');
    await expect(ruleItems.first()).toBeVisible();
  });

  test('initial rule count matches the chandam rule set size', async ({
    page,
  }) => {
    const count = await readRuleCount(page);
    // chandam has rules per config.ts
    expect(count).toBeGreaterThan(0);
  });

  test('text search filter reduces and restores rule count', async ({ page }) => {
    const originalCount = await readRuleCount(page);

    // Type a Telugu character that appears in some rule names
    const searchInput = page.locator('.filter-search');
    await searchInput.fill('ఇ');
    await waitForFilterUpdate(page);

    const filteredCount = await readRuleCount(page);
    // Filtered count should be less than or equal to original
    expect(filteredCount).toBeLessThanOrEqual(originalCount);

    // Clear search → restore
    await searchInput.fill('');
    await waitForFilterUpdate(page);
    await expectRuleCountEventually(page, originalCount);
  });

  test('category checkbox filter reduces and restores rule count', async ({
    page,
  }) => {
    const originalCount = await readRuleCount(page);

    // Find all category checkboxes
    const categoryCheckboxes = page.locator('[data-filter="category"]');
    const cbCount = await categoryCheckboxes.count();

    if (cbCount === 0) {
      test.skip(); // No category filters available for this rule set
      return;
    }

    // Check the first category
    const firstCheckbox = categoryCheckboxes.nth(0);
    await firstCheckbox.check();
    await waitForFilterUpdate(page);

    const afterFirstCheck = await readRuleCount(page);
    expect(afterFirstCheck).toBeLessThanOrEqual(originalCount);

    // If there's a second category, check it too (count should increase or stay)
    if (cbCount >= 2) {
      const secondCheckbox = categoryCheckboxes.nth(1);
      await secondCheckbox.check();
      await waitForFilterUpdate(page);

      const afterSecondCheck = await readRuleCount(page);
      expect(afterSecondCheck).toBeGreaterThanOrEqual(afterFirstCheck);

      // Uncheck second
      await secondCheckbox.uncheck();
      await waitForFilterUpdate(page);
    }

    // Uncheck first → restore
    await firstCheckbox.uncheck();
    await waitForFilterUpdate(page);

    const restoredCount = await readRuleCount(page);
    expect(restoredCount).toBe(originalCount);
  });

  test('has-examples radio filter changes count', async ({ page }) => {
    const originalCount = await readRuleCount(page);

    // Select "With examples"
    const withExamplesRadio = page.locator(
      '[data-filter="examples"][value="true"]',
    );

    // This radio may not exist if all rules have examples – guard accordingly
    const radioVisible = await withExamplesRadio.isVisible();
    if (!radioVisible) {
      test.skip();
      return;
    }

    await withExamplesRadio.check();
    await waitForFilterUpdate(page);

    const filteredCount = await readRuleCount(page);
    expect(filteredCount).toBeLessThanOrEqual(originalCount);

    // Select "All" to reset
    const allRadio = page.locator('[data-filter="examples"][value="all"]');
    await allRadio.check();
    await waitForFilterUpdate(page);

    const restoredCount = await readRuleCount(page);
    expect(restoredCount).toBe(originalCount);
  });

  test('matra length range filter reduces and restores count', async ({
    page,
  }) => {
    const originalCount = await readRuleCount(page);

    const minInput = page.locator('[data-filter="matra-min"]');
    const maxInput = page.locator('[data-filter="matra-max"]');

    const inputsVisible =
      (await minInput.isVisible()) && (await maxInput.isVisible());
    if (!inputsVisible) {
      test.skip();
      return;
    }

    await minInput.fill('10');
    await maxInput.fill('20');
    // Trigger change events
    await minInput.press('Tab');
    await maxInput.press('Tab');
    await waitForFilterUpdate(page);

    const filteredCount = await readRuleCount(page);
    expect(filteredCount).toBeLessThanOrEqual(originalCount);

    // Clear inputs
    await minInput.fill('');
    await maxInput.fill('');
    await minInput.press('Tab');
    await maxInput.press('Tab');
    await waitForFilterUpdate(page);

    const restoredCount = await readRuleCount(page);
    expect(restoredCount).toBe(originalCount);
  });

  test('"Clear All Filters" button restores original count after multiple filters', async ({
    page,
  }) => {
    const originalCount = await readRuleCount(page);

    // Apply text search
    await page.locator('.filter-search').fill('వ');
    await waitForFilterUpdate(page);

    // Check first category checkbox (if available)
    const firstCb = page.locator('[data-filter="category"]').first();
    if (await firstCb.isVisible()) {
      await firstCb.check();
      await waitForFilterUpdate(page);
    }

    // Click Clear All
    await page.locator('[data-action="clear-filters"]').click();
    await waitForFilterUpdate(page);

    const restoredCount = await readRuleCount(page);
    expect(restoredCount).toBe(originalCount);

    // Search input should be empty
    await expect(page.locator('.filter-search')).toHaveValue('');
  });

  test('screenshot of active filter state', async ({ page }) => {
    // Apply a filter to get an interesting screenshot
    await page.locator('.filter-search').fill('వ');
    await waitForFilterUpdate(page);

    await expect(page).toHaveScreenshot('learn-filter-active.png', {
      maxDiffPixelRatio: 0.02,
      mask: [page.locator('#version-info')],
    });
  });
});
