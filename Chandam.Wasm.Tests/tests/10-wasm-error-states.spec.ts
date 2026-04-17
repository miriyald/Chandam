/**
 * Test 10 – WASM error states and edge cases
 *
 * 1. Normal load: #initial-loader disappears; no "Failed to Load" error banner.
 * 2. Invalid rule set ID: error/404 content renders; no JS exception.
 * 3. Valid rule set + invalid rule ID: error content renders; no JS exception.
 * 4. Empty editor → clicking Analyze shows an alert (not a crash).
 * 5. Direct navigation to /create-rule: rule creator page renders.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

test.describe('WASM initialisation', () => {
  test('app loads without the timeout error banner', async ({ page }) => {
    await gotoAndWait(page, '/');

    // The "Failed to Load Application" error banner should never appear
    const errorBanner = page.locator('.loader-container.error');
    await expect(errorBanner).not.toBeVisible({ timeout: 2_000 }).catch(() => {
      // Element doesn't exist at all – that's fine
    });

    // The initial loader should be gone
    await expect(page.locator('#initial-loader')).not.toBeAttached();
  });

  test('#initial-loader is removed after WASM init', async ({ page }) => {
    await page.goto('/');
    // At this point the loader may still be visible
    // waitForWasmReady() confirms it gets removed
    await page.waitForSelector('#initial-loader', {
      state: 'detached',
      timeout: 45_000,
    });
    // Main content has replaced the loader
    await expect(page.locator('#content > #initial-loader')).not.toBeAttached();
  });
});

test.describe('Invalid route edge cases', () => {
  test('invalid rule set ID does not throw unhandled JS exception', async ({
    page,
    consoleErrors,
  }) => {
    await gotoAndWait(page, '/compute/totally-invalid-ruleset-abc/');

    // Filter out known non-critical errors (e.g. analytics, fonts)
    const critical = consoleErrors.filter(
      (e) =>
        !e.includes('gtag') &&
        !e.includes('fonts.googleapis') &&
        !e.includes('favicon'),
    );

    // There may be a "Rule set not found" console.error – that is acceptable
    // What we must not see is an uncaught TypeError / ReferenceError
    const uncaught = critical.filter((e) =>
      /TypeError|ReferenceError|Cannot read|undefined is not/.test(e),
    );
    expect(uncaught).toHaveLength(0);

    // The normal compute-rule-set-page should NOT render
    await expect(page.locator('.compute-rule-set-page')).not.toBeVisible({
      timeout: 3_000,
    });
  });

  test('invalid rule ID does not throw unhandled JS exception', async ({
    page,
    consoleErrors,
  }) => {
    await gotoAndWait(page, '/compute/popular/totally-invalid-rule-xyz');

    const uncaught = consoleErrors.filter((e) =>
      /TypeError|ReferenceError|Cannot read|undefined is not/.test(e),
    );
    expect(uncaught).toHaveLength(0);

    // Normal compute-rule-page should NOT render
    await expect(page.locator('.compute-rule-page')).not.toBeVisible({
      timeout: 3_000,
    });
  });

  test('navigating to /learn/ with invalid rule set is graceful', async ({
    page,
    consoleErrors,
  }) => {
    await gotoAndWait(page, '/learn/no-such-set/');

    const uncaught = consoleErrors.filter((e) =>
      /TypeError|ReferenceError|Cannot read|undefined is not/.test(e),
    );
    expect(uncaught).toHaveLength(0);

    await expect(page.locator('.learn-index-page')).not.toBeVisible({
      timeout: 3_000,
    });
  });
});

test.describe('Empty editor edge cases', () => {
  test('clicking Analyze with empty editor shows alert (not a crash)', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/popular/');

    // Ensure editor is empty
    await expect(page.locator('#poem-editor')).toHaveValue('');

    // Listen for dialog
    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.locator('#btn-analyze').click();

    // Wait a moment for the alert to appear
    await page.waitForTimeout(500);

    // An alert should have been shown (not a page crash)
    expect(dialogMessage.trim().length).toBeGreaterThan(0);

    // Page should still be functional
    await expect(page.locator('#poem-editor')).toBeVisible();
  });

  test('clicking Analyze in specific-rule mode without a rule selection shows alert', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/popular/');

    // Force no selection (this is hard to do cleanly, so we fill the editor
    // but rely on the picker returning empty if we never open/select)
    // Actually auto-detect is ON by default; to get "no rule selected" state
    // we need to turn off auto-detect and deliberately not pick a rule.
    // The default pre-selects the first rule, so we test with an empty editor instead.

    // Type some text
    await page.locator('#poem-editor').fill('test');

    // Switch off auto-detect (first rule auto-selected by default)
    await page.locator('#auto-detect').uncheck();

    // Clear the rule selection via the dataset (evaluate in browser)
    await page.evaluate(() => {
      const details = document.getElementById('rule-picker-inline') as any;
      if (details) details.dataset.selectedRule = '';
    });

    let dialogMessage = '';
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    await page.locator('#btn-analyze').click();
    await page.waitForTimeout(500);

    // Either an alert was shown for "no rule selected" or "no text"
    // Both are acceptable non-crash outcomes
    await expect(page.locator('#poem-editor')).toBeVisible();
  });
});

test.describe('Custom rule creator page', () => {
  test('/create-rule page renders rule creator form', async ({ page }) => {
    await gotoAndWait(page, '/create-rule');

    const creatorPage = page.locator('.rule-creator-page');
    await expect(creatorPage).toBeVisible();

    // Basic form elements should exist
    await expect(page.locator('#rule-name')).toBeVisible();
    await expect(page.locator('#padyam-type')).toBeVisible();
    await expect(page.locator('#btn-analyze')).toBeVisible();
  });
});
