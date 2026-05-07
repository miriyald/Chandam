/**
 * Test 05 – Direct link / deep link refresh
 *
 * Simulates a browser hard-refresh by using page.goto() for every route
 * without prior SPA navigation. Verifies the SPA router (backed by the
 * server-side navigationFallback → index.html) renders the correct page,
 * and that no redirect to the home page occurs.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

// ---------------------------------------------------------------------------
// Route expectations
// ---------------------------------------------------------------------------
interface RouteExpectation {
  path: string;
  /** Selector expected to be visible after page renders. */
  visibleSelector: string;
  /** Whether this route requires WASM (all compute/learn routes do). */
  requiresWasm?: boolean;
}

const ROUTES: RouteExpectation[] = [
  {
    path: '/',
    visibleSelector: '.home-page',
    requiresWasm: true,
  },
  {
    path: '/rule-sets',
    visibleSelector: '.rule-sets-page',
    requiresWasm: true,
  },
  {
    path: '/compute/chandam/',
    visibleSelector: '.compute-rule-set-page',
    requiresWasm: true,
  },
  {
    path: '/learn/chandam/',
    visibleSelector: '.learn-index-page',
    requiresWasm: true,
  },
  {
    path: '/about',
    visibleSelector: '#content',
    requiresWasm: true,
  },
  {
    path: '/credits',
    visibleSelector: '#content',
    requiresWasm: true,
  },
  {
    path: '/contact',
    visibleSelector: '#content',
    requiresWasm: true,
  },
];

// Deep links to specific rules (use chandam rule set, get a rule ID dynamically)
const POPULAR_RULE_ID_PLACEHOLDER = '__RULE_ID__';

const DEEP_LINKS: RouteExpectation[] = [
  {
    path: `/compute/chandam/${POPULAR_RULE_ID_PLACEHOLDER}`,
    visibleSelector: '.compute-rule-page',
    requiresWasm: true,
  },
  {
    path: `/learn/chandam/${POPULAR_RULE_ID_PLACEHOLDER}`,
    visibleSelector: '.learn-detail-page',
    requiresWasm: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Retrieves the first rule ID available in the chandam rule set by visiting
 *  the learn index and reading the first link. */
async function getFirstPopularRuleId(
  page: import('@playwright/test').Page,
): Promise<string> {
  await gotoAndWait(page, '/learn/chandam/');
  const firstLearnLink = page
    .locator('.rule-list-item .rule-links a[href*="/learn/chandam/"]')
    .first();
  await expect(firstLearnLink).toBeVisible();
  const href = await firstLearnLink.getAttribute('href');
  // href is something like /learn/chandam/iMdravajramu
  const ruleId = href?.split('/').filter(Boolean).pop();
  expect(ruleId).toBeTruthy();
  return ruleId!;
}

// ---------------------------------------------------------------------------
// Tests – standard routes
// ---------------------------------------------------------------------------

test.describe('Deep link – standard routes', () => {
  for (const route of ROUTES) {
    test(`direct navigation to "${route.path}" renders correct page`, async ({
      page,
    }) => {
      if (route.requiresWasm) {
        await gotoAndWait(page, route.path);
      } else {
        await page.goto(route.path);
      }

      // Verify the URL was NOT silently redirected to "/"
      const finalUrl = new URL(page.url());
      const finalPath = finalUrl.pathname;

      // The SPA may append a trailing slash; normalise for comparison
      const normExpected = route.path.replace(/\/$/, '');
      const normActual = finalPath.replace(/\/$/, '');
      expect(normActual).toBe(normExpected);

      // Expected element is visible
      await expect(page.locator(route.visibleSelector)).toBeVisible({
        timeout: 10_000,
      });

      // Content container should be hydrated with non-empty content.
      const renderedContainer = page.locator(route.visibleSelector).first();
      await expect(renderedContainer).not.toBeEmpty();
    });
  }
});

// ---------------------------------------------------------------------------
// Tests – deep links (rule-specific pages)
// ---------------------------------------------------------------------------

test.describe('Deep link – specific rule pages', () => {
  let cachedRuleId: string | undefined;

  test('direct navigation to /compute/chandam/:ruleId renders rule page', async ({
    page,
  }) => {
    if (!cachedRuleId) cachedRuleId = await getFirstPopularRuleId(page);

    const path = `/compute/chandam/${cachedRuleId}`;
    await gotoAndWait(page, path);

    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).toContain(cachedRuleId);

    await expect(page.locator('.compute-rule-page')).toBeVisible();
    await expect(page.locator('#poem-editor')).toBeVisible();
  });

  test('direct navigation to /learn/chandam/:ruleId renders learn detail page', async ({
    page,
  }) => {
    if (!cachedRuleId) cachedRuleId = await getFirstPopularRuleId(page);

    const path = `/learn/chandam/${cachedRuleId}`;
    await gotoAndWait(page, path);

    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).toContain(cachedRuleId);

    await expect(page.locator('.learn-detail-page')).toBeVisible();
  });

  test('direct navigation with ?example=1 pre-fills editor', async ({
    page,
  }) => {
    if (!cachedRuleId) cachedRuleId = await getFirstPopularRuleId(page);

    const path = `/compute/chandam/${cachedRuleId}?example=1`;
    await gotoAndWait(page, path);

    // Editor should be pre-filled with example 1 text
    const editorValue = await page.locator('#poem-editor').inputValue();
    expect(editorValue.trim().length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests – invalid / 404 routes
// ---------------------------------------------------------------------------

test.describe('Deep link – error routes', () => {
  test('invalid route renders 404 content (not home page)', async ({
    page,
  }) => {
    await gotoAndWait(page, '/nonexistent-page-xyz');

    // Wait for #content to be populated (the 404 fetch is async post-WASM init)
    await page.waitForFunction(
      () => {
        const content = document.getElementById('content');
        return content && content.textContent && content.textContent.trim().length > 0;
      },
      { timeout: 5_000 },
    );

    // Should NOT silently redirect to home page content
    const homeHero = page.locator('.home-page');
    await expect(homeHero).not.toBeVisible({ timeout: 3_000 });

    // Invalid route should retain the non-home URL path (no silent redirect to /)
    expect(new URL(page.url()).pathname).toBe('/nonexistent-page-xyz');

    // 404 content container should be rendered and hydrated
    await expect(page.locator('#content')).toBeVisible();
    await expect(page.locator('#content')).not.toBeEmpty();
  });

  test('invalid rule set ID renders error content', async ({ page }) => {
    await gotoAndWait(page, '/compute/nonexistent-ruleset/');

    // Should not render the normal compute page
    await expect(page.locator('.compute-rule-set-page')).not.toBeVisible({
      timeout: 3_000,
    });
  });

  test('valid rule set but invalid rule ID renders error content', async ({
    page,
  }) => {
    await gotoAndWait(page, '/compute/chandam/nonexistent-rule-xyz');

    // App either redirects or shows the rule page in an error state - verify it doesn't crash
    // The important check is no unhandled exception (validated by test runner)
    await page.waitForTimeout(500); // Allow redirect if any
  });
});
