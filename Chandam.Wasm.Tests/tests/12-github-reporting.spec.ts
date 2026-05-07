import type { Page } from '@playwright/test';
import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

const DETERMINISTIC_PERFECT_POEM = `స్తోకంబై తోకలును జూలునిప్పుల్
దాకొన్నన్  హేషలుగ దౌడులొప్పన్
జీకాకై మంటలకెచేరు గుఱ్ఱా
లేకోనల్ లేననల మేదుచోటుల్`;

async function getFirstRuleWithExamples(page: Page): Promise<string> {
  await gotoAndWait(page, '/learn/chandam/');

  const href = await page
    .locator('.rule-list-item .rule-links a[href*="/learn/chandam/"]')
    .first()
    .getAttribute('href');

  const ruleId = href?.split('/').filter(Boolean).pop() ?? '';
  expect(ruleId.length).toBeGreaterThan(0);
  return ruleId;
}

test.describe('GitHub reporting flow', () => {
  test('learn page submit creates download and opens GitHub issue URL', async ({
    page,
  }) => {
    const ruleId = await getFirstRuleWithExamples(page);
    await gotoAndWait(page, `/learn/chandam/${ruleId}`);

    await page.evaluate(() => {
      (window as any).__openedUrl = '';
      window.open = ((url: string | URL) => {
        (window as any).__openedUrl = String(url);
        return null;
      }) as any;
    });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-submit-github-learn').click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toContain('chandam-example-');
    expect(filename).toContain(ruleId);

    const openedUrl = await page.evaluate(() => (window as any).__openedUrl as string);
    expect(openedUrl).toContain('github.com/chandamu/chandam/issues/new');
    expect(openedUrl).toContain('template=new-examples.md');
    expect(openedUrl).toContain('labels=examples%2Ccommunity');
  });

  test('results submit button appears for perfect match and opens GitHub issue URL', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/chandam/');
    await page.locator('#poem-editor').fill(DETERMINISTIC_PERFECT_POEM);

    await page.locator('#btn-analyze').click();
    const submitBtn = page.locator('.btn-submit-github').first();
    await expect(submitBtn).toBeVisible({ timeout: 15_000 });

    await page.evaluate(() => {
      (window as any).__openedUrl = '';
      window.open = ((url: string | URL) => {
        (window as any).__openedUrl = String(url);
        return null;
      }) as any;
    });

    const downloadPromise = page.waitForEvent('download');
    await submitBtn.click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toContain('chandam-example-');

    const openedUrl = await page.evaluate(() => (window as any).__openedUrl as string);
    expect(openedUrl).toContain('github.com/chandamu/chandam/issues/new');
    expect(openedUrl).toContain('template=new-examples.md');
  });
});
