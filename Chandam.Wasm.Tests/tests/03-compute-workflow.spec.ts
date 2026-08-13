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
 *
 * Advanced options (Santi Prasa / Soundex Sandhi) sit above the Analyze button,
 * are collapsed and off by default, are hidden + reset when Yati is unchecked,
 * and are remembered in localStorage — reopening expanded with a badge when active.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';
import { dailyRandom, pickRandomIndex } from '../helpers/random';

async function selectRuleWithExample(
  page: import('@playwright/test').Page,
  rng: () => number,
): Promise<{ ruleId: string; poem: string }> {
  const ruleItems = page.locator('#rule-picker-container .rule-item');
  const count = await ruleItems.count();
  const tried = new Set<number>();

  while (tried.size < count) {
    let idx = pickRandomIndex(count, rng);
    while (tried.has(idx) && tried.size < count) {
      idx = (idx + 1) % count;
    }
    tried.add(idx);

    const chosenItem = ruleItems.nth(idx);
    const ruleId = await chosenItem.getAttribute('data-rule-id');
    if (!ruleId) {
      continue;
    }

    const poem = await page.evaluate(async (id: string) => {
      const { DotNet } = window as any;
      return await DotNet.invokeMethodAsync('Chandam.Wasm', 'GetRandomPoem', id);
    }, ruleId);

    if (poem?.trim()) {
      await chosenItem.click();
      return { ruleId, poem };
    }
  }

  throw new Error('Could not find a specific rule with an example poem');
}

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

  test('advanced options are collapsed and unchecked by default', async ({
    page,
  }) => {
    const advanced = page.locator('#advanced-options');
    await expect(advanced).toBeVisible();
    await expect(advanced).not.toHaveAttribute('open', '');
    await expect(page.locator('#match-santi-prasa')).not.toBeChecked();
    await expect(page.locator('#match-soundex-sandhi')).not.toBeChecked();
    await expect(page.locator('#advanced-badge')).toBeHidden();
  });

  test('advanced options row sits above the Analyze button', async ({ page }) => {
    const advanced = await page.locator('#advanced-options').boundingBox();
    const analyze = await page.locator('#btn-analyze').boundingBox();

    expect(advanced!.y + advanced!.height).toBeLessThanOrEqual(analyze!.y);
  });

  test('advanced options are remembered and reopen expanded when active', async ({
    page,
  }) => {
    await page.locator('#match-soundex-sandhi').evaluate((el: HTMLInputElement) => {
      el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#advanced-badge')).toHaveText('1');

    // Reload: the row comes back expanded so the active flag is not silently in force
    await gotoAndWait(page, '/compute/chandam/');

    await expect(page.locator('#match-soundex-sandhi')).toBeChecked();
    await expect(page.locator('#advanced-options')).toHaveAttribute('open', '');
    await expect(page.locator('#advanced-badge')).toHaveText('1');
  });

  test('Yati and Prasa toggles are remembered', async ({ page }) => {
    await page.locator('#match-prasa').evaluate((el: HTMLInputElement) => {
      el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await gotoAndWait(page, '/compute/chandam/');

    await expect(page.locator('#match-prasa')).not.toBeChecked();
    await expect(page.locator('#match-yati')).toBeChecked();
  });

  test('advanced options hide and reset when Yati is unchecked', async ({
    page,
  }) => {
    // Expand and switch both advanced toggles on. Native <summary> and the
    // slider-covered <input> are set directly, as elsewhere in this file.
    await page.locator('#advanced-options').evaluate((el: HTMLDetailsElement) => {
      el.open = true;
    });
    await expect(page.locator('#advanced-options')).toHaveAttribute('open', '');
    for (const id of ['#match-santi-prasa', '#match-soundex-sandhi']) {
      await page.locator(id).evaluate((el: HTMLInputElement) => {
        el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await expect(page.locator(id)).toBeChecked();
    }

    // Turning Yati off hides the row and clears both toggles
    await page.locator('#match-yati').evaluate((el: HTMLInputElement) => {
      if (el.checked) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await expect(page.locator('#advanced-options')).toBeHidden();
    await expect(page.locator('#match-santi-prasa')).not.toBeChecked();
    await expect(page.locator('#match-soundex-sandhi')).not.toBeChecked();

    // Turning Yati back on restores the row, still collapsed
    await page.locator('#match-yati').evaluate((el: HTMLInputElement) => {
      el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await expect(page.locator('#advanced-options')).toBeVisible();
    await expect(page.locator('#advanced-options')).not.toHaveAttribute('open', '');
  });

  test('advanced options expanded visual baseline', async ({ page }) => {
    test.skip(!!process.env.CI, 'Visual baselines skipped in CI — run via workflow_dispatch with update_snapshots');

    const advanced = page.locator('#advanced-options');
    await advanced.evaluate((el: HTMLDetailsElement) => { el.open = true; });
    await expect(page.locator('#match-soundex-sandhi')).toBeVisible();

    // The Telugu labels are long enough to be the layout constraint, so glyph
    // metrics must be settled before capture.
    await page.evaluate(() => document.fonts.ready);

    // Element-scoped: excludes the footer's daily "Published:" date, so unlike the
    // full-page baselines this stays deterministic at a tight tolerance.
    await expect(advanced).toHaveScreenshot('advanced-options-expanded.png', {
      timeout: 15_000,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('Random button fills editor with Telugu text', async ({ page }) => {
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('', { timeout: 10_000 });
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
    await selectRuleWithExample(page, rng);

    // Wait for picker to collapse after selection (details element closes)
    await expect(page.locator('#rule-picker-inline')).not.toHaveAttribute(
      'open',
      '',
    );

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
    await expect(page.locator('.match-card').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('uncheck Yati then re-analyze does not crash', async ({ page }) => {
    const rng = dailyRandom();

    // Switch to specific-rule mode
    await page.locator('#auto-detect').evaluate((el: HTMLInputElement) => {
      if (el.checked) { el.checked = false; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await page.locator('#rule-picker-inline').click();
    const { poem } = await selectRuleWithExample(page, rng);

    // Load a rule-specific example poem
    await page.locator('#poem-editor').fill(poem || '');
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

test.describe('Compute – cross-ruleset and result navigation', () => {
  test('switches from chandam to topella compute mid-session', async ({
    page,
  }) => {
    // Compute on chandam
    await gotoAndWait(page, '/compute/chandam/');
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');
    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });

    // Switch to topella
    await gotoAndWait(page, '/compute/topella/');
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');
    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('.match-card').first()).toBeVisible();
  });

  test('clicking rule link in results navigates to learn detail', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/chandam/');
    await page.locator('#btn-random').click();
    await expect(page.locator('#poem-editor')).not.toHaveValue('');
    await page.locator('#btn-analyze').click();
    await expect(page.locator('#results-section')).toBeVisible({
      timeout: 15_000,
    });

    // The results card has a .rule-details-link pointing to /learn/chandam/:ruleId
    const ruleLink = page.locator('.match-card .rule-details-link').first();
    await expect(ruleLink).toBeVisible();
    const href = await ruleLink.getAttribute('href');
    expect(href).toMatch(/\/learn\/chandam\/.+/);

    // Navigate (link opens new tab, so we grab the href and go directly)
    await page.goto(href!);
    await expect(page.locator('.meter-name')).toBeVisible({ timeout: 15_000 });
    expect(page.url()).toContain('/learn/chandam/');
  });
});

test.describe('Compute – specific rule page (/compute/:ruleSet/:ruleId)', () => {
  test('rule page loads, Random fills editor, Analyze returns result', async ({
    page,
  }) => {
    // Navigate to learn/chandam to get a real rule ID dynamically
    await gotoAndWait(page, '/learn/chandam/');
    const firstRuleLink = page
      .locator('.rule-list-item .rule-item-actions a[href*="/compute/chandam/"]')
      .first();
    await expect(firstRuleLink).toBeVisible({ timeout: 15_000 });
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
