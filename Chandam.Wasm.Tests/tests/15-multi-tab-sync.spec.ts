/**
 * Test 15 - Multi-tab synchronization
 *
 * Validates shared-storage workflows across two tabs:
 * 1) Favoriting a rule in tab A is visible in tab B after reload.
 * 2) Un-favoriting in tab B is visible back in tab A after reload.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

async function getFirstRuleLearnPath(
  page: import('@playwright/test').Page,
): Promise<string> {
  const ruleId = 'iMdravajramu';
  return `/learn/chandam/${ruleId}`;
}

async function clearAllFavorites(page: import('@playwright/test').Page): Promise<void> {
  await gotoAndWait(page, '/');
  await page.evaluate(async () => {
    const api = (window as any).chandam;
    if (api?.favorites?.clear) {
      await api.favorites.clear();
      return;
    }

    const openReq = indexedDB.open('ChandamDB');
    const db = await new Promise<any>((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result);
      openReq.onerror = () => reject(openReq.error);
    });

    if (db.objectStoreNames.contains('compressed-data')) {
      const tx = db.transaction('compressed-data', 'readwrite');
      tx.objectStore('compressed-data').clear();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    }

    db.close();
  });
}

test.describe('Favorites synchronization across tabs', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllFavorites(page);
  });

  test('favorite state syncs between two tabs after reload', async ({ page, context }) => {
    const learnPath = await getFirstRuleLearnPath(page);

    await gotoAndWait(page, learnPath);
    const favBtnTabA = page.locator('#btn-favorite');
    await expect(favBtnTabA).toHaveAttribute('data-favorited', 'false');

    const pageB = await context.newPage();
    try {
      await gotoAndWait(pageB, learnPath);
      const favBtnTabB = pageB.locator('#btn-favorite');
      await expect(favBtnTabB).toHaveAttribute('data-favorited', 'false');

      // Favorite in tab A.
      await favBtnTabA.click();
      await page.waitForTimeout(500);
      await expect(favBtnTabA).toHaveAttribute('data-favorited', 'true');

      // Reload tab B and verify it observes tab A's write.
      await gotoAndWait(pageB, learnPath);
      await expect(favBtnTabB).toHaveAttribute('data-favorited', 'true');

      // Un-favorite in tab B.
      await favBtnTabB.click();
      await pageB.waitForTimeout(500);
      await expect(favBtnTabB).toHaveAttribute('data-favorited', 'false');

      // Reload tab A and verify it observes tab B's write.
      await gotoAndWait(page, learnPath);
      await expect(favBtnTabA).toHaveAttribute('data-favorited', 'false');
    } finally {
      await pageB.close();
    }
  });
});
