/**
 * Test 19 – Keyboard toggle (IME)
 *
 * Tests the తె keyboard toggle button and real-time transliteration.
 *
 * Desktop:
 *   - Toggle button is visible in the nav bar
 *   - Clicking toggles active state and aria-pressed
 *   - Preference persists across page navigations
 *   - Typing with IME active produces Telugu text
 *   - Typing with IME inactive produces English text
 *
 * Mobile:
 *   - Toggle button is inside the collapsed nav dropdown
 *   - Opening nav reveals the toggle
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

test.describe('Keyboard toggle - Desktop', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Desktop-only tests');
    await gotoAndWait(page, '/compute/chandam/');
    // Clear any persisted preference
    await page.evaluate(() => localStorage.removeItem('chandam:kb-scheme'));
  });

  test('toggle button is visible and active by default', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveClass(/active/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('clicking toggle deactivates keyboard', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('double-click re-activates keyboard', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);
    await toggle.click();
    await expect(toggle).toHaveClass(/active/);
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('preference persists across navigation', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    // Deactivate
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);

    // Navigate away and back
    await gotoAndWait(page, '/about');
    await gotoAndWait(page, '/compute/chandam/');

    const toggleAfter = page.locator('#kb-toggle');
    await expect(toggleAfter).not.toHaveClass(/active/);
  });

  test('IME converts RTS keystrokes to Telugu in poem editor', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    // Ensure active
    const isActive = await toggle.evaluate(
      (el) => el.classList.contains('active'),
    );
    if (!isActive) await toggle.click();

    const editor = page.locator('#poem-editor');
    await expect(editor).toBeVisible();
    await editor.focus();

    // Type 'ka' which should produce 'క' via IME
    await page.keyboard.press('k');
    await page.keyboard.press('a');

    const value = await editor.inputValue();
    expect(value).toContain('క');
  });

  test('IME is inactive when toggle is off (English passthrough)', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);

    const editor = page.locator('#poem-editor');
    await expect(editor).toBeVisible();
    await editor.focus();
    await editor.fill('');

    // Type 'ka' — should pass through as English
    await page.keyboard.type('ka');

    const value = await editor.inputValue();
    expect(value).toBe('ka');
  });

  test('IME handles word with space boundary', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    const isActive = await toggle.evaluate(
      (el) => el.classList.contains('active'),
    );
    if (!isActive) await toggle.click();

    const editor = page.locator('#poem-editor');
    await expect(editor).toBeVisible();
    await editor.focus();

    // 'ka ga' should produce 'క గ'
    await page.keyboard.press('k');
    await page.keyboard.press('a');
    await page.keyboard.press(' ');
    await page.keyboard.press('g');
    await page.keyboard.press('a');

    const value = await editor.inputValue();
    expect(value).toContain('క');
    expect(value).toContain('గ');
  });

  test('SVG rect fill changes on toggle', async ({ page }) => {
    const toggle = page.locator('#kb-toggle');
    const rect = toggle.locator('rect');

    // Active state: dark blue
    const activeFill = await rect.getAttribute('fill');
    expect(activeFill).toBe('#1a3a5c');

    // Deactivate
    await toggle.click();
    const inactiveFill = await rect.getAttribute('fill');
    expect(inactiveFill).not.toBe('#1a3a5c');
  });
});

test.describe('Keyboard toggle - Mobile', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile-only tests');
  });

  test('toggle is hidden until nav is opened', async ({ page }) => {
    await gotoAndWait(page, '/compute/chandam/');

    const toggle = page.locator('#kb-toggle');
    // On mobile, nav is collapsed (overflow:hidden + max-height:0) so toggle is clipped
    const isClipped = await toggle.evaluate((el) => {
      const nav = el.closest('nav');
      if (!nav) return false;
      return nav.scrollHeight > nav.clientHeight || nav.clientHeight === 0;
    });
    expect(isClipped).toBe(true);

    // Open the mobile nav
    const navToggle = page.locator('#nav-toggle');
    await navToggle.click();

    // Now kb-toggle should be visible inside the expanded nav
    await expect(toggle).toBeVisible();
  });

  test('toggle works inside mobile nav', async ({ page }) => {
    await gotoAndWait(page, '/compute/chandam/');

    // Open nav
    const navToggle = page.locator('#nav-toggle');
    await navToggle.click();

    const toggle = page.locator('#kb-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveClass(/active/);

    // Click to deactivate
    await toggle.click();
    await expect(toggle).not.toHaveClass(/active/);
  });
});
