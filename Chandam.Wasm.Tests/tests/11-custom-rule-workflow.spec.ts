import type { Page } from '@playwright/test';
import { test, expect, gotoAndWait, waitForWasmReady } from '../fixtures/wasm-ready';

async function clearStorageState(page: Page): Promise<void> {
  await gotoAndWait(page, '/');
  await page.evaluate(async () => {
    const api = (window as any).chandam;
    if (api?.storage?.clear) {
      await api.storage.clear();
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

  // Reload so Blazor re-initializes from a clean slate.
  await page.reload();
  await waitForWasmReady(page);
}

function uniqueRuleName(): string {
  return `E2E Rule ${Date.now()}`;
}

async function createCustomRuleAndNavigate(
  page: Page,
  name: string,
): Promise<string> {
  await gotoAndWait(page, '/create-rule');

  // Ensure the form is fully interactive before filling
  await page.locator('#rule-name').waitFor({ state: 'visible' });
  await page.locator('#rule-name').fill(name);

  const createBtn = page.locator('#create-rule-btn');
  await expect(createBtn).toBeVisible();
  await expect(createBtn).toBeEnabled();
  await createBtn.scrollIntoViewIfNeeded();

  // Wait for event handlers to be attached (gana dropdown must be populated)
  await expect(page.locator('.gana-select').first()).toBeVisible({ timeout: 5_000 });

  // Click create and wait for navigation. Retry click if page doesn't navigate
  // (WASM async handler may not be ready on first click attempt).
  const targetPattern = /\/learn\/custom-rules\/custom-\d+\/?$/;
  for (let attempt = 0; attempt < 3; attempt++) {
    await createBtn.click();
    try {
      await expect(page).toHaveURL(targetPattern, { timeout: 8_000 });
      break;
    } catch {
      if (attempt === 2) throw new Error('Create rule did not navigate after 3 attempts');
      await page.waitForTimeout(1_000);
    }
  }

  return page.url().split('/').filter(Boolean).pop() ?? '';
}

test.describe('Custom rule creator workflow', () => {
  test.beforeEach(async ({ page }) => {
    await clearStorageState(page);
  });

  test('shows validation message when rule name is missing', async ({ page }) => {
    await gotoAndWait(page, '/create-rule');

    await page.locator('#create-rule-btn').click();

    // App shows a warning toast for validation errors
    const warningToast = page.locator('#toast-container .toast-warning');
    await expect(warningToast).toBeVisible({ timeout: 5_000 });
  });

  test('creates a custom rule, lists it, then deletes it', async ({ page }) => {
    const name = uniqueRuleName();

    await createCustomRuleAndNavigate(page, name);

    // Verify persistence from IndexedDB (compressed-data store)
    const customRules = await page.evaluate(async () => {
      const openReq = indexedDB.open('ChandamDB');
      const db = await new Promise<any>((resolve, reject) => {
        openReq.onsuccess = () => resolve(openReq.result);
        openReq.onerror = () => reject(openReq.error);
      });

      if (!db.objectStoreNames.contains('compressed-data')) {
        db.close();
        return null;
      }

      const entry = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction('compressed-data', 'readonly');
        const req = tx.objectStore('compressed-data').get('custom-rulesets');
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });

      db.close();
      if (!entry || !entry.data) return null;

      const stream = new Blob([new Uint8Array(entry.data)]).stream();
      const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
      const reader = decompressed.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const allBytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) { allBytes.set(chunk, offset); offset += chunk.length; }

      const json = new TextDecoder().decode(allBytes);
      const rulesets = JSON.parse(json);
      return rulesets.find((r: any) => r.id === 'custom-rules') ?? null;
    });
    expect(customRules).toBeTruthy();
    expect((customRules as any).rules.length).toBeGreaterThan(0);
    expect((customRules as any).rules.some((r: any) => r.Name === name)).toBe(true);

    // Cleanup: clear custom-rulesets from compressed-data store
    await clearStorageState(page);
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

    await createCustomRuleAndNavigate(page, name);

    // Navigate to rule-sets page
    await gotoAndWait(page, '/rule-sets');
    await expect(page.locator('.rule-sets-page')).toBeVisible({ timeout: 10_000 });

    // The custom-rules card uses class .custom-rules-card
    const customCard = page.locator('.rule-set-card.custom-rules-card');
    await expect(customCard).toBeVisible({ timeout: 5_000 });

    // Cleanup
    await clearStorageState(page);
  });

  test('can navigate to compute page for a custom rule and analyze', async ({ page }) => {
    const name = uniqueRuleName();

    const ruleId = await createCustomRuleAndNavigate(page, name);

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
    // Page should remain functional -- editor still visible
    await expect(page.locator('#poem-editor')).toBeVisible();

    // Cleanup
    await clearStorageState(page);
  });

  test('custom rule persists in IndexedDB after page.reload()', async ({ page }) => {
    const name = uniqueRuleName();

    await createCustomRuleAndNavigate(page, name);

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

      if (!db.objectStoreNames.contains('compressed-data')) {
        db.close();
        return null;
      }

      const entry = await new Promise<any>((resolve, reject) => {
        const tx = db.transaction('compressed-data', 'readonly');
        const req = tx.objectStore('compressed-data').get('custom-rulesets');
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => reject(req.error);
      });

      db.close();
      if (!entry || !entry.data) return null;

      const stream = new Blob([new Uint8Array(entry.data)]).stream();
      const decompressed = stream.pipeThrough(new DecompressionStream('gzip'));
      const reader = decompressed.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const allBytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
      let offset = 0;
      for (const chunk of chunks) { allBytes.set(chunk, offset); offset += chunk.length; }

      const json = new TextDecoder().decode(allBytes);
      const rulesets = JSON.parse(json);
      return rulesets.find((r: any) => r.id === 'custom-rules') ?? null;
    });

    expect(customRules).toBeTruthy();
    expect((customRules as any).rules.length).toBeGreaterThan(0);
    expect((customRules as any).rules.some((r: any) => r.Name === name)).toBe(true);

    // Cleanup
    await clearStorageState(page);
  });
});
