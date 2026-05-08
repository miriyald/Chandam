import type { Page } from '@playwright/test';
import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

const DETERMINISTIC_PERFECT_POEM = `స్తోకంబై తోకలును జూలునిప్పుల్
దాకొన్నన్  హేషలుగ దౌడులొప్పన్
జీకాకై మంటలకెచేరు గుఱ్ఱా
లేకోనల్ లేననల మేదుచోటుల్`;

test.describe('Results pane behavior: perfect vs mismatch', () => {
  test('100% path shows perfect-match actions and hides score badge', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/chandam/');
    await page.locator('#poem-editor').fill(DETERMINISTIC_PERFECT_POEM);

    await page.locator('#btn-analyze').click();

    const matchCard = page.locator('.match-card').first();
    await expect(matchCard).toBeVisible({ timeout: 15_000 });

    await expect(matchCard.locator('.match-body-split')).toBeVisible();
    await expect(matchCard.locator('.padyam')).toBeVisible();
    await expect(matchCard.locator('.ganaVibhajana')).toBeVisible();

    // 100% cards do not show score badge.
    await expect(matchCard.locator('.match-score-group')).toHaveCount(0);
    await expect(matchCard.locator('.btn-submit-github')).toBeVisible();
  });

  test('non-100 path shows score badge and mismatch details, without GitHub submit button', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/chandam/');

    await page.locator('#btn-random').click();
    const baseText = await page.locator('#poem-editor').inputValue();
    expect(baseText.trim().length).toBeGreaterThan(0);

    const variants = [
      baseText.length > 4 ? baseText.slice(2) : `${baseText}\nక`,
      `${baseText}\nక`,
    ];

    let foundNonPerfect = false;
    const dismissDialog = async (dialog: any) => {
      await dialog.dismiss();
    };
    page.on('dialog', dismissDialog);

    try {
      for (const variant of variants) {
        await page.locator('#poem-editor').fill(variant);
        await page.locator('#btn-analyze').click();

        const matchCard = page.locator('.match-card').first();
        if ((await matchCard.count()) === 0) {
          continue;
        }

        await expect(matchCard).toBeVisible({ timeout: 15_000 });
        const scoreCount = await matchCard.locator('.match-score-group').count();
        const submitCount = await matchCard.locator('.btn-submit-github').count();

        if (scoreCount > 0 && submitCount === 0) {
          foundNonPerfect = true;
          break;
        }
      }
    } finally {
      page.off('dialog', dismissDialog);
    }

    expect(foundNonPerfect).toBe(true);

    const matchCard = page.locator('.match-card').first();
    await expect(matchCard.locator('.btn-submit-github')).toHaveCount(0);

    // Mismatch path renders error table when engine reports errors.
    const errors = matchCard.locator('.errors-table');
    const hasErrors = (await errors.count()) > 0;
    if (hasErrors) {
      await expect(errors.first()).toBeVisible();
    }
  });
});
