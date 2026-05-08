/**
 * Test 17 - Mobile breadcrumb overflow regression
 *
 * Ensures breadcrumb trails on mobile remain a single row and are horizontally
 * scrollable instead of wrapping into multiple lines.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

async function getFirstLearnRulePath(
  page: import('@playwright/test').Page,
): Promise<string> {
  await gotoAndWait(page, '/learn/chandam/');

  const firstLearnLink = page
    .locator('.rule-list-item .rule-item-actions a[href*="/learn/chandam/"]')
    .first();

  await expect(firstLearnLink).toBeVisible();

  const href = await firstLearnLink.getAttribute('href');
  expect(href).toBeTruthy();

  return href!;
}

test.describe('Mobile breadcrumb overflow behavior', () => {
  test('breadcrumbs keep single-row scroll behavior on mobile', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile-only test');

    const learnPath = await getFirstLearnRulePath(page);
    await gotoAndWait(page, learnPath);

    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    const breadcrumbState = await breadcrumbs.evaluate((el) => {
      const style = window.getComputedStyle(el);

      return {
        flexWrap: style.flexWrap,
        whiteSpace: style.whiteSpace,
      };
    });

    expect(breadcrumbState.flexWrap).toBe('nowrap');
    expect(breadcrumbState.whiteSpace).toBe('nowrap');
  });

  test('mobile breadcrumb visual baseline', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    const learnPath = await getFirstLearnRulePath(page);
    await gotoAndWait(page, learnPath);

    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    await expect(breadcrumbs).toHaveScreenshot('mobile-breadcrumb-overflow.png', {
      maxDiffPixelRatio: 0.02,
    });
  });
});
