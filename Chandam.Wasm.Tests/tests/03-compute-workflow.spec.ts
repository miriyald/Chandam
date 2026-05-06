/**
 * Test 03 – Compute page workflow
 *
 * Part A – Auto-detect mode (default):
 *   1. Navigate to /compute/chandam/.
 *   2. Uncheck auto-detect → rule picker becomes visible.
 *   3. Open picker and select a rule.
 *   4. Click Random (fetches an example for that specific rule).
 *   5. Click Analyze with Yati & Prasa both checked → match result appears.
 *   6. Uncheck Yati → re-analyze → no crash; results section still renders.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';
import { dailyRandom, pickRandomIndex } from '../helpers/random';

test.describe('Compute page – auto-detect mode', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/compute/chandam/');
  });

  test('auto-detect is ON by default and rule picker is hidden', async ({
    page,
  }) => {
    await expect(page.locator('#auto-detect')).toBeChecked();
    await expect(page.locator('#rule-picker-inline')).toBeHidden();
  });

  test('Random button fills editor with Telugu text', async ({ page }) => {
    await page.locator('#btn-random').click();
    const value = await page.locator('#poem-editor').inputValue();
    expect(value.trim().length).toBeGreaterThan(0);
    // Telugu text should contain characters in Unicode range U+0C00–U+0C7F
    expect(/[\u0C00-\u0C7F]/.test(value)).toBe(true);
  });

  test('Clear button empties editor and hides results', async ({ page }) => {
    // First fill the editor
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');

    // Click Analyze so results are visible
    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });

    // Now clear
    await page.locator('#btn-clear').click();
    await expect(page.locator('#poem-editor')).toHaveValue('');
    await expect(page.locator('#results-section')).toBeHidden();
  });

  test('full auto-detect workflow: Random → Clear → Random → Analyze', async ({
    page,
  }) => {
    // Fill
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');

    // Clear
    await page.locator('#btn-clear').click();
    await expect(page.locator('#poem-editor')).toHaveValue('');

    // Fill again
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');

    // Analyze
    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });

    // At least one match card
    const matchCards = page.locator('.match-card');
    await expect(matchCards.first()).toBeVisible();

    // Match card should display a Telugu rule name
    const meterName = matchCards.first().locator('.meter-name');
    await expect(meterName).not.toBeEmpty();
    const nameText = await meterName.textContent();
    expect(nameText?.trim().length).toBeGreaterThan(0);
  });
});

test.describe('Compute page – specific rule mode', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWait(page, '/compute/chandam/');
  });

  test('unchecking auto-detect reveals rule picker', async ({ page }) => {
    await page.locator('#auto-detect').evaluate((el: HTMLInputElement) => {
      if (el.checked) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await expect(page.locator('#rule-picker-inline')).toBeVisible({
      timeout: 5_000,
    });
    await expect(page.locator('#auto-detect')).not.toBeChecked();
  });

  test('select rule, load random poem, analyze with Yati+Prasa', async ({
    page,
  }) => {
    const rng = dailyRandom();

    // Switch to specific-rule mode
    await page.locator('#auto-detect').evaluate((el: HTMLInputElement) => {
      if (el.checked) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await expect(page.locator('#rule-picker-inline')).toBeVisible();

    // Open picker and select a rule
    await page.locator('#rule-picker-inline').click();
    const ruleItems = page.locator('#rule-picker-container .rule-item');
    const count = await ruleItems.count();
    await ruleItems.nth(pickRandomIndex(count, rng)).click();

    // Ensure Yati and Prasa are checked
    await expect(page.locator('#match-yati')).toBeChecked();
    await expect(page.locator('#match-prasa')).toBeChecked();

    // Load a rule-specific example
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');

    // Analyze
    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('.match-card').first()).toBeVisible();
  });

  test('uncheck Yati then re-analyze does not crash', async ({ page }) => {
    const rng = dailyRandom();

    // Switch to specific-rule mode
    await page.locator('#auto-detect').evaluate((el: HTMLInputElement) => {
      if (el.checked) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await page.locator('#rule-picker-inline').click();
    const ruleItems = page.locator('#rule-picker-container .rule-item');
    const count = await ruleItems.count();
    await ruleItems.nth(pickRandomIndex(count, rng)).click();

    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');

    // First analysis with Yati checked
    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });

    // Uncheck Yati
    await page.locator('#match-yati').evaluate((el: HTMLInputElement) => {
      if (el.checked) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await expect(page.locator('#match-yati')).not.toBeChecked();

    // Re-analyze — must not throw
    await page.locator('#btn-analyze').click();

    // Results section should still be visible (not crashed)
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });
  });
});

test.describe('Compute – specific rule page (/compute/:ruleSet/:ruleId)', () => {
  test('rule page loads, Random fills editor, Analyze returns result', async ({
    page,
  }) => {
    // Navigate to learn/chandam to get a real rule ID dynamically
    await gotoAndWait(page, '/learn/chandam/');
    const firstRuleLink = page
      .locator('.rule-list-item .rule-links a[href*="/compute/chandam/"]')
      .first();
    await expect(firstRuleLink).toBeVisible();
    const href = await firstRuleLink.getAttribute('href');
    expect(href).toMatch(/\/compute\/chandam\/.+/);

    // Go to the specific rule compute page
    await page.goto(href!);
    await gotoAndWait(page, href!);

    await expect(page.locator('#poem-editor')).toBeVisible();

    // Load example and analyze
    await page.locator('#btn-random').click();
    const editorValue = await page.locator('#poem-editor').inputValue();
    expect(editorValue.trim().length).toBeGreaterThan(0);

    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('.match-card').first()).toBeVisible();

    // Clear button hides results
    await page.locator('#btn-clear').click();
    await expect(page.locator('#poem-editor')).toHaveValue('');
    await expect(page.locator('#results-section')).toBeHidden();
  });
});
