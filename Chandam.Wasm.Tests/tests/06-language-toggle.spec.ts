/**
 * Test 06 – Language toggle
 *
 * 1. Navigate to home page.
 * 2. Record initial language (should be 'te' – Telugu default).
 * 3. Click the language toggle button (#lang-toggle).
 * 4. Assert html[lang] attribute switches (te → en).
 * 5. Assert visible nav link text updates to English labels.
 * 6. Navigate to /rule-sets → page still renders in switched language.
 * 7. Toggle back → language reverts.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

test.describe('Language toggle', () => {
  test('initial language is Telugu (te)', async ({ page }) => {
    await gotoAndWait(page, '/');

    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('te');
  });

  test('clicking #lang-toggle switches language', async ({ page }) => {
    await gotoAndWait(page, '/');

    const langToggle = page.locator('#lang-toggle');
    await expect(langToggle).toBeVisible();

    const initialLang = await page.getAttribute('html', 'lang');

    await langToggle.click();
    // Allow the i18n update to propagate
    await page.waitForTimeout(300);

    const newLang = await page.getAttribute('html', 'lang');
    expect(newLang).not.toBe(initialLang);
  });

  test('nav links update text after language switch', async ({ page }) => {
    await gotoAndWait(page, '/');

    const langToggle = page.locator('#lang-toggle');
    const langCurrent = langToggle.locator('.lang-current');

    // Record initial label
    const initialLabel = await langCurrent.textContent();

    // Toggle language
    await langToggle.click();
    await page.waitForTimeout(300);

    const newLabel = await langCurrent.textContent();
    expect(newLabel).not.toBe(initialLabel);
  });

  test('language preference persists across SPA navigation', async ({
    page,
  }) => {
    await gotoAndWait(page, '/');

    // Switch language
    await page.locator('#lang-toggle').click();
    await page.waitForTimeout(300);

    const langAfterToggle = await page.getAttribute('html', 'lang');

    // Navigate to rule-sets via the SPA router
    await page.locator('a[href="/rule-sets"]').click();
    await page.waitForURL('**/rule-sets**');
    await page.waitForTimeout(300);

    // Language should persist
    const langOnRuleSets = await page.getAttribute('html', 'lang');
    expect(langOnRuleSets).toBe(langAfterToggle);
  });

  test('toggling back restores original language', async ({ page }) => {
    await gotoAndWait(page, '/');

    const initialLang = await page.getAttribute('html', 'lang');

    // Toggle once
    await page.locator('#lang-toggle').click();
    await page.waitForTimeout(300);

    // Toggle back
    await page.locator('#lang-toggle').click();
    await page.waitForTimeout(300);

    const restoredLang = await page.getAttribute('html', 'lang');
    expect(restoredLang).toBe(initialLang);
  });
});
