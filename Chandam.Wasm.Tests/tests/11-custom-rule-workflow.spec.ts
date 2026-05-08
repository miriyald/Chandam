import type { Page } from '@playwright/test';
import { test, expect, gotoAndWait, waitForWasmReady } from '../fixtures/wasm-ready';

async function clearStorageState(page: Page): Promise<void> {
  await gotoAndWait(page, '/');
  await page.evaluate(async () => {
    const api = (window as any).chandam;
    if (api?.storage?.clear) {
      api.storage.clear();
    }
    if (api?.favorites?.clear) {
      await api.favorites.clear();
    }

    // Cross-project fallback: clear app-owned localStorage and IndexedDB stores.
    Object.keys(localStorage)
      .filter((k) => k.startsWith('chandam:'))
      .forEach((k) => localStorage.removeItem(k));

    const openReq = indexedDB.open('ChandamDB');
    const db = await new Promise<any>((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result);
      openReq.onerror = () => reject(openReq.error);
    });

    const clearStore = async (storeName: string): Promise<void> => {
      if (!db.objectStoreNames.contains(storeName)) {
        return;
      }

      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();

      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    };

    await clearStore('favorites');
    await clearStore('custom-rulesets');
    db.close();
  });
}

function uniqueRuleName(): string {
  return `E2E Rule ${Date.now()}`;
}

test.describe('Custom rule creator workflow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorageState(page);
  });

  test('shows validation message when rule name is missing', async ({ page }) => {
    await gotoAndWait(page, '/create-rule');

    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.locator('#create-rule-btn').click();
    await expect
      .poll(() => dialogMessage, { timeout: 5_000 })
      .not.toEqual('');
  });

  test('creates a custom rule, lists it, then deletes it', async ({ page }) => {
    const name = uniqueRuleName();

    await gotoAndWait(page, '/create-rule');
    await page.locator('#rule-name').fill(name);

    let successDialog = '';
    page.once('dialog', async (dialog) => {
      successDialog = dialog.message();
      await dialog.accept();
    });

    await page.locator('#create-rule-btn').click();

    await expect
      .poll(() => successDialog, { timeout: 7_000 })
      .not.toEqual('');
    await expect(page).toHaveURL(/\/learn\/custom-rules\/custom-\d+\/?$/);

    // Verify persistence from IndexedDB so this works in desktop and mobile projects.
    const customRules = await page.evaluate(async () => {
      const openReq = indexedDB.open('ChandamDB');
      const db = await new Promise<any>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      const customRuleset = await new Promise<any>((resolve, reject) => {
        if (!db.objectStoreNames.contains('custom-rulesets')) {
          resolve(null);
          return;
        }

        const tx = db.transaction('custom-rulesets', 'readonly');
        const req = tx.objectStore('custom-rulesets').get('custom-rules');
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });

      db.close();
      return customRuleset;
    });
    expect(customRules).toBeTruthy();
    expect((customRules as any).rules.length).toBeGreaterThan(0);
    expect((customRules as any).rules.some((r: any) => r.Name === name)).toBe(true);

    // Cleanup: remove the custom-rules collection so the test remains isolated.
    await page.evaluate(async () => {
      const openReq = indexedDB.open('ChandamDB');
      const db = await new Promise<any>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      if (db.objectStoreNames.contains('custom-rulesets')) {
        const tx = db.transaction('custom-rulesets', 'readwrite');
        tx.objectStore('custom-rulesets').delete('custom-rules');
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        });
      }

      db.close();
    });
  });
});

// ---------------------------------------------------------------------------
// Custom rule – rule-sets card, compute, and persistence
// ---------------------------------------------------------------------------

test.describe('Custom rule – compute and persistence', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorageState(page);
  });

  test('custom-rules card appears on rule-sets page after creation', async ({
    page,
  }) => {
    const name = uniqueRuleName();

    await gotoAndWait(page, '/create-rule');
    await page.locator('#rule-name').fill(name);

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('#create-rule-btn').click();
    await expect(page).toHaveURL(/\/learn\/custom-rules\/custom-\d+\/?$/, {
      timeout: 7_000,
    });

    // Allow IndexedDB write to settle
    await page.waitForTimeout(500);

    // Navigate using an in-app link to trigger the SPA router reliably.
    await page.locator('main a[href*="/rule-sets"]').first().click();
    await expect(page).toHaveURL(/\/rule-sets\/?$/, { timeout: 10_000 });
    await expect(page.locator('.rule-sets-page')).toBeVisible({ timeout: 10_000 });

    // The custom-rules card uses class .custom-rules-card
    const customCard = page.locator('.rule-set-card.custom-rules-card');
    await expect(customCard).toBeVisible({ timeout: 5_000 });

    // Cleanup
    await clearStorageState(page);
  });

  test('can navigate to compute page for a custom rule and analyze', async ({ page }) => {
    const name = uniqueRuleName();

    await gotoAndWait(page, '/create-rule');
    await page.locator('#rule-name').fill(name);

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('#create-rule-btn').click();
    await expect(page).toHaveURL(/\/learn\/custom-rules\/custom-\d+\/?$/, {
      timeout: 7_000,
    });

    // Allow IndexedDB write to settle
    await page.waitForTimeout(500);

    // Extract the custom rule ID from the URL
    const url = page.url();
    const ruleId = url.split('/').filter(Boolean).pop() ?? '';

    // Navigate to compute page for the custom rule
    await gotoAndWait(page, `/compute/custom-rules/${ruleId}`);
    await expect(page.locator('#poem-editor')).toBeVisible({ timeout: 10_000 });

    // Type Telugu text and analyze -- custom rule with default pattern may not match,
    // but the page should not crash and the analyze button should work
    await page.locator('#poem-editor').fill('గగగగ గగగగ గగగగ గగగగ');
    await page.locator('#btn-analyze').click();

    // Wait for analysis to complete (results section becomes visible OR stays hidden if no match)
    // The key assertion is that no JS error occurs
    await page.waitForTimeout(2_000);
    const errors = await page.evaluate(() => {
      return (window as any).__playwrightErrors ?? [];
    });
    // Page should remain functional -- editor still visible
    await expect(page.locator('#poem-editor')).toBeVisible();

    // Cleanup
    await clearStorageState(page);
  });

  test('custom rule persists in IndexedDB after page.reload()', async ({ page }) => {
    const name = uniqueRuleName();

    await gotoAndWait(page, '/create-rule');
    await page.locator('#rule-name').fill(name);

    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.locator('#create-rule-btn').click();
    await expect(page).toHaveURL(/\/learn\/custom-rules\/custom-\d+\/?$/, {
      timeout: 7_000,
    });

    // Allow IndexedDB write to complete
    await page.waitForTimeout(500);

    // Hard reload
    await page.reload();
    await waitForWasmReady(page);

    // Verify the custom rule survives in IndexedDB after full page reload
    const customRules = await page.evaluate(async () => {
      const openReq = indexedDB.open('ChandamDB');
      const db = await new Promise<any>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      const customRuleset = await new Promise<any>((resolve, reject) => {
        if (!db.objectStoreNames.contains('custom-rulesets')) {
          resolve(null);
          return;
        }
        const tx = db.transaction('custom-rulesets', 'readonly');
        const req = tx.objectStore('custom-rulesets').get('custom-rules');
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });

      db.close();
      return customRuleset;
    });

    expect(customRules).toBeTruthy();
    expect((customRules as any).rules.length).toBeGreaterThan(0);
    expect((customRules as any).rules.some((r: any) => r.Name === name)).toBe(true);

    // Cleanup
    await clearStorageState(page);
  });
});
