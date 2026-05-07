/**
 * Demo Screenshot Generator for Chandam WASM App
 *
 * Standalone Playwright script (not a test) that navigates through 6 workflow
 * stories and captures presentation-quality screenshots at key moments.
 *
 * Usage:
 *   npm run demo-screenshots
 *
 * Prerequisites:
 *   - Dev server running at http://localhost:5080 (or set CHANDAM_URL)
 *   - Browsers installed: npx playwright install chromium
 */

import { chromium, devices, type Page, type Browser, type BrowserContext } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.CHANDAM_URL ?? 'http://localhost:5080';
const OUTPUT_DIR = path.resolve(__dirname, '../Chandam.Wasm/wwwroot/presentation/screenshots');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForWasmReady(page: Page, timeout = 45_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const content = document.getElementById('content');
      if (!content) return false;
      const loader = content.querySelector('#initial-loader') as HTMLElement | null;
      const loaderIsReady = !loader || loader.offsetParent === null;
      return loaderIsReady && content.children.length > 0;
    },
    undefined,
    { timeout },
  );
}

async function gotoAndWait(page: Page, urlPath: string): Promise<void> {
  await page.goto(`${BASE_URL}${urlPath}`);
  await waitForWasmReady(page);
}

async function capture(
  page: Page,
  storyDir: string,
  filename: string,
): Promise<void> {
  await page.waitForTimeout(500);
  const dir = path.join(OUTPUT_DIR, storyDir);
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({
    path: path.join(dir, filename),
    fullPage: false,
    mask: [page.locator('#version-info'), page.locator('#build-date-info')],
  });
  console.log(`  ✓ ${storyDir}/${filename}`);
}

async function clearFavorites(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const api = (window as any).chandam;
    if (api?.favorites?.clear) await api.favorites.clear();
  });
}

async function clearCustomRules(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const openReq = indexedDB.open('ChandamDB');
    const db = await new Promise<any>((resolve, reject) => {
      openReq.onsuccess = () => resolve(openReq.result);
      openReq.onerror = () => reject(openReq.error);
    });
    if (db.objectStoreNames.contains('custom-rulesets')) {
      const tx = db.transaction('custom-rulesets', 'readwrite');
      tx.objectStore('custom-rulesets').clear();
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    db.close();
  });
}

// ---------------------------------------------------------------------------
// Story 1: First-Time Discovery
// ---------------------------------------------------------------------------

async function story1(page: Page): Promise<void> {
  console.log('\n📖 Story 1: First-Time Discovery');

  // 1. Home page
  await gotoAndWait(page, '/');
  await capture(page, 'story-1-discovery', '01-home-page.png');

  // 2. About page
  await gotoAndWait(page, '/about');
  await capture(page, 'story-1-discovery', '02-about-page.png');

  // 3. Rule Sets page
  await gotoAndWait(page, '/rule-sets');
  await capture(page, 'story-1-discovery', '03-rule-sets.png');

  // 4. Learn chandam index
  await gotoAndWait(page, '/learn/chandam/');
  await capture(page, 'story-1-discovery', '04-learn-chandam.png');

  // 5. Filter active — type into search
  const searchInput = page.locator('.filter-search');
  if (await searchInput.isVisible()) {
    await searchInput.fill('ఉత్పల');
    await page.waitForTimeout(300);
    await capture(page, 'story-1-discovery', '05-filter-active.png');
    await searchInput.clear();
  }

  // 6. Learn detail — navigate to first rule
  const firstLearnLink = page
    .locator('.rule-list-item .rule-links a[href*="/learn/chandam/"]')
    .first();
  const learnHref = await firstLearnLink.getAttribute('href');
  await gotoAndWait(page, learnHref!);
  await capture(page, 'story-1-discovery', '06-learn-detail.png');

  // 7. Breadcrumbs
  const breadcrumbs = page.locator('.breadcrumbs');
  if (await breadcrumbs.isVisible()) {
    await breadcrumbs.screenshot({
      path: path.join(OUTPUT_DIR, 'story-1-discovery', '07-breadcrumbs.png'),
    });
    console.log('  ✓ story-1-discovery/07-breadcrumbs.png');
  }

  // 8. Compute with pre-filled example (use Try button)
  const tryBtn = page.locator('.try-example-btn').first();
  if (await tryBtn.isVisible()) {
    const tryHref = await tryBtn.getAttribute('href');
    await gotoAndWait(page, tryHref!);
    await capture(page, 'story-1-discovery', '08-compute-prefilled.png');

    // 9. Analyze for results
    await page.locator('#btn-analyze').click();
    await page.locator('#results-section').waitFor({ state: 'visible', timeout: 15_000 });
    await capture(page, 'story-1-discovery', '09-results-100-percent.png');

    // 10. GitHub submit button (visible on 100% match)
    const submitBtn = page.locator('#btn-submit-github, #btn-github-submit').first();
    if (await submitBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await capture(page, 'story-1-discovery', '10-github-submit-button.png');
    }
  }
}

// ---------------------------------------------------------------------------
// Story 2: Power User Analysis
// ---------------------------------------------------------------------------

async function story2(page: Page): Promise<void> {
  console.log('\n⚡ Story 2: Power User Analysis');

  // 1. Compute page — auto-detect ON
  await gotoAndWait(page, '/compute/chandam/');
  await capture(page, 'story-2-power-user', '01-auto-detect-mode.png');

  // 2. Load random poem
  await page.locator('#btn-random').click();
  await page.waitForTimeout(500);
  await capture(page, 'story-2-power-user', '02-random-loaded.png');

  // 3. Analyze and show results
  await page.locator('#btn-analyze').click();
  await page.locator('#results-section').waitFor({ state: 'visible', timeout: 15_000 });
  await capture(page, 'story-2-power-user', '03-results-cards.png');

  // 4. Open rule picker — first uncheck auto-detect
  await page.locator('#btn-clear').click();
  const autoDetect = page.locator('#auto-detect');
  await autoDetect.evaluate((el: HTMLInputElement) => {
    if (el.checked) {
      el.checked = false;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await page.waitForTimeout(300);
  const rulePicker = page.locator('#rule-picker-inline');
  if (await rulePicker.isVisible()) {
    await rulePicker.click();
    await page.waitForTimeout(300);
    await capture(page, 'story-2-power-user', '04-rule-picker-open.png');

    // 5. Pick a rule manually and analyze
    const ruleItem = page.locator('#rule-picker-container .rule-item').first();
    if (await ruleItem.isVisible()) {
      await ruleItem.click();
      await page.locator('#btn-random').click();
      await page.waitForTimeout(500);
      await page.locator('#btn-analyze').click();
      await page.locator('#results-section').waitFor({ state: 'visible', timeout: 15_000 });
      await capture(page, 'story-2-power-user', '05-manual-mode-results.png');
    }
  }

  // 6. Partial match with errors — use random text that likely won't be 100%
  await page.locator('#poem-editor').fill('తెలుగు కవిత్వం అందమైనది\nభాష సంపద మనకు గర్వం');
  await page.locator('#btn-analyze').click();
  await page.locator('#results-section').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(500);
  await capture(page, 'story-2-power-user', '06-partial-match-errors.png');

  // 7. Yati/Prasa options visible
  const yatiCheckbox = page.locator('#match-yati');
  const prasaCheckbox = page.locator('#match-prasa');
  if (await yatiCheckbox.isVisible() && await prasaCheckbox.isVisible()) {
    const controlsBar = page.locator('.controls-bar').first();
    if (await controlsBar.isVisible()) {
      await controlsBar.screenshot({
        path: path.join(OUTPUT_DIR, 'story-2-power-user', '07-yati-prasa-options.png'),
      });
      console.log('  ✓ story-2-power-user/07-yati-prasa-options.png');
    }
  }
}

// ---------------------------------------------------------------------------
// Story 3: Curating Favorites
// ---------------------------------------------------------------------------

async function story3(page: Page): Promise<void> {
  console.log('\n❤️ Story 3: Curating Favorites');

  await clearFavorites(page);

  // Navigate to a learn detail page to find the heart button
  await gotoAndWait(page, '/learn/chandam/');
  const firstLearnLink = page
    .locator('.rule-list-item .rule-links a[href*="/learn/chandam/"]')
    .first();
  const learnHref = await firstLearnLink.getAttribute('href');
  await gotoAndWait(page, learnHref!);

  // 1. Heart unfavorited
  const favBtn = page.locator('#btn-favorite');
  await favBtn.waitFor({ state: 'visible' });
  await capture(page, 'story-3-favorites', '01-heart-unfavorited.png');

  // 2. Heart favorited
  await favBtn.click();
  await page.waitForTimeout(500);
  await capture(page, 'story-3-favorites', '02-heart-favorited.png');

  // 3. Favorites card on rule-sets page
  await page.evaluate(() => {
    history.pushState(null, '', '/rule-sets');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.locator('.rule-sets-page').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(500);
  await capture(page, 'story-3-favorites', '03-favorites-card.png');

  // 4. Custom-fav list
  await page.evaluate(() => {
    history.pushState(null, '', '/learn/custom-fav/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.locator('.learn-index-page').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(500);
  await capture(page, 'story-3-favorites', '04-custom-fav-list.png');

  // 5. Unfavorite → card disappears
  await gotoAndWait(page, learnHref!);
  await favBtn.click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    history.pushState(null, '', '/rule-sets');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.locator('.rule-sets-page').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(500);
  await capture(page, 'story-3-favorites', '05-favorites-removed.png');

  await clearFavorites(page);
}

// ---------------------------------------------------------------------------
// Story 4: Custom Rule Authoring
// ---------------------------------------------------------------------------

async function story4(page: Page): Promise<void> {
  console.log('\n🛠️ Story 4: Custom Rule Authoring');

  await clearCustomRules(page);

  // 1. Create rule form (empty)
  await gotoAndWait(page, '/create-rule');
  await capture(page, 'story-4-custom-rules', '01-create-rule-form.png');

  // 2. Fill in rule details
  await page.locator('#rule-name').fill('E2E Demo Rule');
  await page.waitForTimeout(300);
  await capture(page, 'story-4-custom-rules', '02-rule-filled.png');

  // 3. Create — handle success dialog
  let dialogDismissed = false;
  page.once('dialog', async (dialog) => {
    dialogDismissed = true;
    // Capture will happen after dialog is dismissed
    await dialog.accept();
  });

  await page.locator('#create-rule-btn').click();
  // Wait for dialog to appear and be dismissed
  await page.waitForFunction(() => true, undefined, { timeout: 7_000 });
  await page.waitForTimeout(1_000);

  if (dialogDismissed) {
    await capture(page, 'story-4-custom-rules', '03-after-creation.png');
  }

  // 4. Custom-rules card on rule-sets page
  await page.evaluate(() => {
    history.pushState(null, '', '/rule-sets');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  await page.locator('.rule-sets-page').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForTimeout(500);
  await capture(page, 'story-4-custom-rules', '04-custom-rules-card.png');

  // 5. Navigate to compute page for custom rule
  const customCard = page.locator('.rule-set-card.custom-rules-card a').first();
  if (await customCard.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const href = await customCard.getAttribute('href');
    if (href) {
      await page.evaluate((p: string) => {
        history.pushState(null, '', p);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, href);
      await page.locator('#poem-editor').waitFor({ state: 'visible', timeout: 10_000 });
      await page.locator('#poem-editor').fill('గగగగ గగగగ గగగగ గగగగ');
      await capture(page, 'story-4-custom-rules', '05-compute-custom-rule.png');
    }
  }

  await clearCustomRules(page);
}

// ---------------------------------------------------------------------------
// Story 5: Community Contribution (GitHub)
// ---------------------------------------------------------------------------

async function story5(page: Page): Promise<void> {
  console.log('\n🌐 Story 5: Community Contribution');

  // Navigate to a known rule and use its example for a 100% match
  await gotoAndWait(page, '/learn/chandam/');
  const firstLearnLink = page
    .locator('.rule-list-item .rule-links a[href*="/learn/chandam/"]')
    .first();
  const learnHref = await firstLearnLink.getAttribute('href');
  await gotoAndWait(page, learnHref!);

  // Try the first example on the compute page
  const tryBtn = page.locator('.try-example-btn').first();
  if (await tryBtn.isVisible()) {
    const tryHref = await tryBtn.getAttribute('href');
    await gotoAndWait(page, tryHref!);
    await page.locator('#btn-analyze').click();
    await page.locator('#results-section').waitFor({ state: 'visible', timeout: 15_000 });
    await page.waitForTimeout(500);

    // 1. Perfect match with submit visible
    await capture(page, 'story-5-github', '01-perfect-match-submit.png');
  }

  // 2. Show contrast — partial match (no submit button expected)
  await gotoAndWait(page, '/compute/chandam/');
  await page.locator('#poem-editor').fill('ఇది ఒక పరీక్ష వాక్యం\nఛందస్సు లేని వాక్యం');
  await page.locator('#btn-analyze').click();
  await page.locator('#results-section').waitFor({ state: 'visible', timeout: 15_000 });
  await page.waitForTimeout(500);
  await capture(page, 'story-5-github', '02-no-submit-partial.png');
}

// ---------------------------------------------------------------------------
// Story 6: Mobile Experience
// ---------------------------------------------------------------------------

async function story6Mobile(browser: Browser): Promise<void> {
  console.log('\n📱 Story 6: Mobile Experience');

  const iPhone = devices['iPhone 14 Pro'];
  const context = await browser.newContext({
    ...iPhone,
    baseURL: BASE_URL,
  });
  const page = await context.newPage();

  try {
    // 1. Mobile home
    await gotoAndWait(page, '/');
    await capture(page, 'story-6-mobile', '01-mobile-home.png');

    // 2. Hamburger open
    const navToggle = page.locator('#nav-toggle');
    if (await navToggle.isVisible()) {
      await navToggle.click();
      await page.waitForTimeout(300);
      await capture(page, 'story-6-mobile', '02-hamburger-open.png');
      // Close the menu
      await navToggle.click();
      await page.waitForTimeout(200);
    }

    // 3. Mobile compute
    await gotoAndWait(page, '/compute/chandam/');
    await page.locator('#btn-random').click();
    await page.waitForTimeout(500);
    await capture(page, 'story-6-mobile', '03-mobile-compute.png');

    // 4. Mobile results
    await page.locator('#btn-analyze').click();
    await page.locator('#results-section').waitFor({ state: 'visible', timeout: 15_000 });
    await capture(page, 'story-6-mobile', '04-mobile-results.png');

    // 5. Mobile favorites — navigate to learn detail and show heart
    await gotoAndWait(page, '/learn/chandam/');
    const firstLink = page
      .locator('.rule-list-item .rule-links a[href*="/learn/chandam/"]')
      .first();
    const href = await firstLink.getAttribute('href');
    await gotoAndWait(page, href!);
    await capture(page, 'story-6-mobile', '05-mobile-favorites.png');
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('🎬 Chandam Demo Screenshot Generator');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Output: ${OUTPUT_DIR}`);

  // Clean output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Desktop context — 1920x1080 for presentation quality
  const desktopContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  const page = await desktopContext.newPage();

  try {
    // Verify server is reachable
    console.log('\n🔌 Checking server connectivity...');
    const response = await page.goto(BASE_URL, { timeout: 10_000 });
    if (!response || !response.ok()) {
      throw new Error(`Server not reachable at ${BASE_URL}`);
    }
    await waitForWasmReady(page);
    console.log('   Server ready, WASM initialized.');

    // Run desktop stories
    await story1(page);
    await story2(page);
    await story3(page);
    await story4(page);
    await story5(page);

    // Close desktop context
    await desktopContext.close();

    // Run mobile story
    await story6Mobile(browser);

    // Generate README
    generateReadme();

    console.log('\n✅ All screenshots generated successfully!');
    console.log(`   Output: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error('\n❌ Screenshot generation failed:', err);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

function generateReadme(): void {
  const stories = [
    'story-1-discovery',
    'story-2-power-user',
    'story-3-favorites',
    'story-4-custom-rules',
    'story-5-github',
    'story-6-mobile',
  ];

  let md = '# Chandam Demo Screenshots\n\n';
  md += 'Auto-generated presentation screenshots for the Chandam WASM app.\n\n';
  md += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;
  md += '## Stories\n\n';

  for (const story of stories) {
    const dir = path.join(OUTPUT_DIR, story);
    if (!fs.existsSync(dir)) continue;

    const title = story
      .replace('story-', '')
      .replace(/-/g, ' ')
      .replace(/^\d+\s*/, (m) => `${m.trim()}. `)
      .replace(/\b\w/g, (c) => c.toUpperCase());

    md += `### ${title}\n\n`;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
    for (const file of files) {
      const label = file
        .replace('.png', '')
        .replace(/^\d+-/, '')
        .replace(/-/g, ' ');
      md += `- ![${label}](${story}/${file})\n`;
    }
    md += '\n';
  }

  md += '---\n\n';
  md += 'Regenerate with: `cd Chandam.Wasm.Tests && npm run demo-screenshots`\n';

  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), md);
  console.log('\n  ✓ README.md generated');
}

main();
