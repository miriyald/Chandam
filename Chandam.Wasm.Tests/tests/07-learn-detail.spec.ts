/**
 * Test 07 – Learn detail page
 *
 * 1. Navigate to /learn/popular/ to pick the first available rule ID.
 * 2. Navigate directly to /learn/popular/:ruleId.
 * 3. Assert rule name renders in .meter-name.
 * 4. Assert description section has content.
 * 5. Assert examples section shows at least one example card.
 * 6. Click the "Try" button on the first example → navigates to
 *    /compute/popular/:ruleId?example=1.
 * 7. Assert the editor textarea is pre-filled with that example's text.
 * 8. Verify "Learn" ↔ "Compute" mode switcher links work.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

// ---------------------------------------------------------------------------
// Helper – get first rule ID with examples from popular set
// ---------------------------------------------------------------------------

async function getFirstRuleWithExamples(
  page: import('@playwright/test').Page,
): Promise<{ ruleId: string; learnPath: string; computePath: string }> {
  await gotoAndWait(page, '/learn/popular/');

  // Find the first rule that has a "Try" link on the index (all rules have learn/try links)
  const firstLearnLink = page
    .locator('.rule-list-item .rule-links a[href*="/learn/popular/"]')
    .first();
  await expect(firstLearnLink).toBeVisible();
  const learnHref = await firstLearnLink.getAttribute('href');
  const ruleId = learnHref?.split('/').filter(Boolean).pop() ?? '';
  expect(ruleId.length).toBeGreaterThan(0);

  return {
    ruleId,
    learnPath: `/learn/popular/${ruleId}`,
    computePath: `/compute/popular/${ruleId}`,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Learn detail page', () => {
  test('rule name renders in .meter-name', async ({ page }) => {
    const { learnPath } = await getFirstRuleWithExamples(page);
    await gotoAndWait(page, learnPath);

    const meterName = page.locator('.learn-detail-page .meter-name').first();
    await expect(meterName).toBeVisible();
    const text = await meterName.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test('description section renders', async ({ page }) => {
    const { learnPath } = await getFirstRuleWithExamples(page);
    await gotoAndWait(page, learnPath);

    const descSection = page.locator('.learn-detail-page .description-content');
    await expect(descSection).toBeVisible();
  });

  test('examples section has at least one example card', async ({ page }) => {
    const { learnPath } = await getFirstRuleWithExamples(page);
    await gotoAndWait(page, learnPath);

    const examplesSection = page.locator('.learn-detail-page .examples');
    await expect(examplesSection).toBeVisible();

    const exampleCards = examplesSection.locator('.example-card');
    const count = await exampleCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking "Try" on example 1 navigates to compute page with example text', async ({
    page,
  }) => {
    const { learnPath } = await getFirstRuleWithExamples(page);
    await gotoAndWait(page, learnPath);

    const firstExampleCard = page.locator('.example-card').first();
    await expect(firstExampleCard).toBeVisible();

    // Get the example text displayed in the card for later comparison
    const poemText = await firstExampleCard.locator('.poem-text').textContent();
    expect(poemText?.trim().length).toBeGreaterThan(0);

    // Click "Try" button (opens in a new tab – handle both cases)
    const tryBtn = firstExampleCard.locator('.try-example-btn');
    await expect(tryBtn).toBeVisible();

    const href = await tryBtn.getAttribute('href');
    expect(href).toMatch(/\/compute\/popular\/.+\?example=1/);

    // Navigate directly rather than clicking (avoids new-tab handling)
    await gotoAndWait(page, href!);

    // Editor should be pre-filled with the example text
    const editorValue = await page.locator('#poem-editor').inputValue();
    expect(editorValue.trim().length).toBeGreaterThan(0);
    // Compare trimmed versions (normalise newlines)
    expect(editorValue.trim()).toBe(poemText?.trim());
  });

  test('mode switcher switches between Learn and Compute', async ({ page }) => {
    const { learnPath, computePath } = await getFirstRuleWithExamples(page);
    await gotoAndWait(page, learnPath);

    // "Compute" tab should be a link on the learn page
    const computeTab = page.locator('.mode-tab-compute');
    await expect(computeTab).toBeVisible();

    // Click Compute mode
    await computeTab.click();
    await page.waitForURL(`**${computePath}**`);
    await page.waitForTimeout(500);

    // Now on the compute page, "Learn" tab should be a link
    const learnTab = page.locator('.mode-tab-learn');
    await expect(learnTab).toBeVisible();

    // Click back to Learn
    await learnTab.click();
    await page.waitForURL(`**${learnPath}**`);
    await expect(page.locator('.learn-detail-page')).toBeVisible();
  });

  test('breadcrumbs show correct structure on learn detail page', async ({
    page,
  }) => {
    const { learnPath } = await getFirstRuleWithExamples(page);
    await gotoAndWait(page, learnPath);

    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    // Should contain: Rule Sets › <ruleSet name> › <rule name>
    await expect(breadcrumbs).toContainText('Rule Sets');
    // The rule set name is in Telugu; just assert there are 2 separators (›)
    const separators = breadcrumbs.locator('.breadcrumb-separator');
    await expect(separators).toHaveCount(2);
  });
});
