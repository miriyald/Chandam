import * as fs from 'fs';
import type { Page } from '@playwright/test';
import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

async function navigateToFirstLearnDetail(page: Page): Promise<string> {
  await gotoAndWait(page, '/learn/chandam/');
  const href = await page
    .locator('.rule-list-item .rule-item-actions a[href*="/learn/chandam/"]')
    .first()
    .getAttribute('href');
  const ruleId = href?.split('/').filter(Boolean).pop() ?? '';
  expect(ruleId.length).toBeGreaterThan(0);
  await gotoAndWait(page, href!);
  return ruleId;
}

test.describe('Export Book – single rule', () => {
  test('single rule export triggers download with correct filename', async ({
    page,
  }) => {
    const ruleId = await navigateToFirstLearnDetail(page);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-export-rule').click();
    const download = await downloadPromise;

    const filename = download.suggestedFilename();
    expect(filename).toMatch(new RegExp(`^${ruleId}-\\d{8}-\\d{6}\\.html$`));
  });

  test('downloaded file is valid HTML with rule content', async ({ page }) => {
    await navigateToFirstLearnDetail(page);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-export-rule').click();
    const download = await downloadPromise;

    const filePath = await download.path();
    const content = fs.readFileSync(filePath!, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<html lang="te">');
    expect(content).toContain('class="title-page"');
    expect(content).toContain('class="rule-section"');
  });

  test('no console errors during single rule export', async ({
    page,
    consoleErrors,
  }) => {
    await navigateToFirstLearnDetail(page);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#btn-export-rule').click();
    await downloadPromise;

    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Export Book – full book', () => {
  test('full book export completes with download', async ({ page }) => {
    await gotoAndWait(page, '/learn/chandam/');
    await page.locator('.rule-list-item').first().waitFor({ state: 'visible', timeout: 10_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.locator('[data-action="export-book"]').click();

    const download = await downloadPromise;
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^chandam-\d{8}-\d{6}\.html$/);

    // Overlay should be gone after export completes
    await expect(page.locator('#export-progress-overlay')).not.toBeVisible({ timeout: 5_000 });
  });

  test('full book download contains valid HTML with multiple rules', async ({ page }) => {
    await gotoAndWait(page, '/learn/chandam/');
    await page.locator('.rule-list-item').first().waitFor({ state: 'visible', timeout: 10_000 });

    const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
    await page.locator('[data-action="export-book"]').click();

    const download = await downloadPromise;
    const filePath = await download.path();
    const content = fs.readFileSync(filePath!, 'utf-8');

    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<html lang="te">');
    expect(content).toContain('class="title-page"');
    expect(content).toContain('class="toc"');
    // Should contain multiple rule sections (380 rules in chandam)
    const ruleCount = (content.match(/class="rule-section"/g) || []).length;
    expect(ruleCount).toBeGreaterThan(100);
  });
});
