/**
 * Test 14 - Hard refresh persistence
 *
 * Covers workflows where users reload the browser and expect state to remain:
 * 1) Language choice should survive a hard refresh.
 * 2) Editor text (auto-saved) should survive a hard refresh.
 */

import { test, expect, gotoAndWait, waitForWasmReady } from '../fixtures/wasm-ready';

async function clearPersistenceState(page: import('@playwright/test').Page): Promise<void> {
  await gotoAndWait(page, '/');
  await page.evaluate(() => {
    localStorage.removeItem('chandam-ui-lang');
    localStorage.removeItem('chandam:editor:text');
    localStorage.removeItem('chandam:editor:selectedRule');
  });
}

test.describe('Hard refresh persistence', () => {
  test.beforeEach(async ({ page }) => {
    await clearPersistenceState(page);
  });

  test.skip('language remains selected after hard refresh', async ({ page }) => {
    await gotoAndWait(page, '/');

    const initialLang = await page.getAttribute('html', 'lang');
    await page.locator('#lang-toggle').click();
    await page.waitForTimeout(300);

    const toggledLang = await page.getAttribute('html', 'lang');
    expect(toggledLang).not.toBe(initialLang);

    await page.reload();
    await waitForWasmReady(page);

    await expect(page.locator('html')).toHaveAttribute('lang', toggledLang!);
  });

  test('editor text remains after hard refresh on compute page', async ({ page }) => {
    await gotoAndWait(page, '/compute/chandam/');

    const text = `తెలుగు ఆటోసేవ్ పరీక్ష ${Date.now()}`;
    const editor = page.locator('#poem-editor');
    await editor.fill(text);

    // Auto-save is debounced by 1 second in the app.
    await page.waitForTimeout(1200);

    await page.reload();
    await waitForWasmReady(page);

    await expect(page.locator('#poem-editor')).toHaveValue(text);
  });
});
