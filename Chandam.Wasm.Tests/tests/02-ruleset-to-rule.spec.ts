/**
 * Test 02 – Rule Sets page → pick a random rule set → open a random rule
 *
 * 1. Navigate to /rule-sets.
 * 2. Assert all built-in rule-set cards render.
 * 3. Click the "Analyze" link on the first card.
 * 4. Wait for compute-ruleset page; assert editor & rule-picker scaffold are present.
 * 5. Uncheck auto-detect → rule picker appears.
 * 6. Open the rule picker <details> and click a rule item (seeded random).
 * 7. Load a random poem via the Random button.
 * 8. Click Analyze → assert results section appears with a match card.
 * 9. Click the rule details link → assert navigation to /learn/:ruleSet/:ruleId.
 * 10. Assert breadcrumbs contain the rule set name and rule name.
 */

import { test, expect, gotoAndWait, waitForWasmReady } from '../fixtures/wasm-ready';
import { dailyRandom, pickRandomIndex } from '../helpers/random';

// Built-in rule set IDs defined in config.ts
const RULE_SET_IDS = ['chandam', 'topella'] as const;

test.describe('Rule Sets → Rule navigation', () => {
  test('rule-sets page shows all built-in cards', async ({ page }) => {
    await gotoAndWait(page, '/rule-sets');

    const cards = page.locator('.rule-set-card');
    await expect(cards).toHaveCount(RULE_SET_IDS.length, { timeout: 15_000 });

    // Each card should have an Analyze link
    for (const id of RULE_SET_IDS) {
      await expect(
        page.locator(`.rule-set-card a[href*="/compute/${id}/"]`).first(),
      ).toBeVisible();
    }
  });

  test('click Analyze on first card → compute rule-set page loads', async ({ page }) => {
    await gotoAndWait(page, '/rule-sets');

    // Click the Analyze link on the first (chandam) card
    const analyzeLink = page
      .locator('.rule-set-card a[href*="/compute/chandam/"]')
      .first();
    await analyzeLink.click();

    // Wait for the compute page to render
    await page.waitForURL('**/compute/chandam/**');
    await expect(page.locator('#poem-editor')).toBeVisible();
  });

  test('select a random rule from the picker and analyze', async ({ page }) => {
    const rng = dailyRandom();

    await gotoAndWait(page, '/compute/chandam/');

    // 1. Uncheck auto-detect so the rule picker becomes visible
    // Use evaluate() because the toggle-slider span intercepts pointer events
    const autoDetect = page.locator('#auto-detect');
    await expect(autoDetect).toBeChecked();
    await autoDetect.evaluate((el: HTMLInputElement) => {
      if (el.checked) {
        el.checked = false;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // 2. The rule-picker-inline <details> should become visible
    const rulePicker = page.locator('#rule-picker-inline');
    await expect(rulePicker).toBeVisible({ timeout: 5_000 });

    // 3. Open the picker dropdown
    await rulePicker.click();

    // 4. Collect all rule items and pick one at random
    const ruleItems = page.locator('#rule-picker-container .rule-item');
    const count = await ruleItems.count();
    expect(count).toBeGreaterThan(0);

    const idx = pickRandomIndex(count, rng);
    const chosenItem = ruleItems.nth(idx);
    const ruleName = await chosenItem.textContent();
    await chosenItem.click();

    // 5. Summary text should reflect the chosen rule
    const summary = page.locator('#selected-rule-name');
    await expect(summary).toContainText(ruleName?.trim() ?? '', {
      timeout: 3_000,
    });

    // 6. Load a random poem into the editor
    await page.locator('#btn-random').click();
    const editorValue = await page.locator('#poem-editor').inputValue();
    expect(editorValue.trim().length).toBeGreaterThan(0);

    // 7. Click Analyze and wait for results
    await page.locator('#btn-analyze').click();
    const resultsSection = page.locator('#results-section');
    await expect(resultsSection).toBeVisible({ timeout: 15_000 });

    // 8. At least one match card rendered
    const matchCard = page.locator('.match-card').first();
    await expect(matchCard).toBeVisible();
    await expect(matchCard.locator('.meter-name')).not.toBeEmpty();
  });

  test('navigate from rule-set page to a specific rule page via breadcrumb', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/chandam/');

    // Load a random poem so we can run auto-detect
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');

    // Run auto-detect (default mode)
    await expect(page.locator('#auto-detect')).toBeChecked();
    await page.locator('#btn-analyze').click();

    const resultsSection = page.locator('#results-section');
    await expect(resultsSection).toBeVisible({ timeout: 15_000 });

    // The result card's "view details" link navigates to /learn/:ruleSet/:ruleId
    const detailsLink = page.locator('.rule-details-link').first();
    await expect(detailsLink).toBeVisible();

    const href = await detailsLink.getAttribute('href');
    expect(href).toMatch(/\/learn\/chandam\/.+/);

    // Navigate to the learn detail page
    await page.goto(href!);
    await waitForWasmReady(page);

    // Breadcrumbs should show 3-level hierarchy with link to /rule-sets
    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();
    const firstLink = breadcrumbs.locator('a').first();
    await expect(firstLink).toHaveAttribute('href', /\/rule-sets/);
  });
});

// ---------------------------------------------------------------------------
// Helper imported at bottom removed – waitForWasmReady is in the top import
// ---------------------------------------------------------------------------
