/**
 * Test 09 – Mobile navigation (hamburger menu)
 *
 * At a mobile viewport (enforced by the 'mobile' Playwright project):
 * 1. Navigate to home page.
 * 2. Assert the hamburger button (#nav-toggle) is visible.
 * 3. Assert the nav links are NOT visible before the menu is opened.
 * 4. Click the hamburger → #main-nav receives the "open" class.
 * 5. Assert nav links become visible.
 * 6. Click a nav link → assert navigation occurs and menu closes (class removed).
 *
 * Also tests that on desktop the hamburger is not present / nav is always open.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

test.describe('Mobile navigation menu', () => {
  test('hamburger button is visible on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await gotoAndWait(page, '/');

    const navToggle = page.locator('#nav-toggle');
    await expect(navToggle).toBeVisible();
  });

  test('nav links are hidden before hamburger click on mobile', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await gotoAndWait(page, '/');

    const mainNav = page.locator('#main-nav');
    // The nav is present in DOM but should not have "open" class initially
    await expect(mainNav).not.toHaveClass(/open/);
  });

  test('hamburger click opens the nav and shows links', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await gotoAndWait(page, '/');

    const navToggle = page.locator('#nav-toggle');
    const mainNav = page.locator('#main-nav');

    await navToggle.click();
    await expect(mainNav).toHaveClass(/open/);

    // At least one nav link should now be visible
    const firstNavLink = mainNav.locator('a').first();
    await expect(firstNavLink).toBeVisible();
  });

  test('clicking a nav link navigates and closes the menu', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile-only test');

    await gotoAndWait(page, '/');

    // Open the menu
    await page.locator('#nav-toggle').click();
    const mainNav = page.locator('#main-nav');
    await expect(mainNav).toHaveClass(/open/);

    // Click "Rule Sets" link (shell nav links are base-relative)
    const ruleSetsLink = mainNav.locator('a[href="rule-sets"]');
    await expect(ruleSetsLink).toBeVisible();
    await ruleSetsLink.click();

    // Wait for navigation
    await page.waitForURL('**/rule-sets**');
    await page.waitForTimeout(300);

    // Nav should close after link click (the click handler uses classList.toggle)
    await expect(mainNav).not.toHaveClass(/open/);
  });

  test('desktop: nav links are visible without hamburger click', async ({
    page,
    isMobile,
  }) => {
    test.skip(!!isMobile, 'Desktop-only test');

    await gotoAndWait(page, '/');

    // On desktop, nav links should always be visible
    const mainNav = page.locator('#main-nav');
    const ruleSetsLink = mainNav.locator('a[href="rule-sets"]');
    await expect(ruleSetsLink).toBeVisible();
  });

  test('mobile nav screenshot', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');
    test.skip(!!process.env.CI, 'Visual baselines skipped in CI — run via workflow_dispatch with update_snapshots');

    await gotoAndWait(page, '/');

    // Open menu for screenshot
    await page.locator('#nav-toggle').click();
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('mobile-nav-open.png', {
      timeout: 15_000,
      maxDiffPixelRatio: 0.08,
      mask: [page.locator('#version-info'), page.locator('#kb-toggle')],
    });
  });
});
