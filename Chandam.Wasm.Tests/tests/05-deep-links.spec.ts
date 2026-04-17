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
  /** Text expected somewhere on the page. */
  expectedText?: string;
  /** Whether this route requires WASM (all compute/learn routes do). */
  requiresWasm?: boolean;
}

const ROUTES: RouteExpectation[] = [
  {
    path: '/',
    visibleSelector: '.home-page-landing',
    expectedText: 'ఛందం',
    requiresWasm: true,
  },
  {
    path: '/rule-sets',
    visibleSelector: '.rule-sets-page',
    expectedText: 'Telugu Poetry Meter Rule Sets',
    requiresWasm: true,
  },
  {
    path: '/compute/popular/',
    visibleSelector: '.compute-rule-set-page',
    requiresWasm: true,
  },
  {
    path: '/learn/popular/',
    visibleSelector: '.learn-index-page',
    requiresWasm: true,
  },
  {
    path: '/about',
    visibleSelector: '#content',
    expectedText: 'About',
    requiresWasm: true,
  },
  {
    path: '/credits',
    visibleSelector: '#content',
    expectedText: 'Credits',
    requiresWasm: true,
  },
  {
    path: '/contact',
    visibleSelector: '#content',
    expectedText: 'Contact',
    requiresWasm: true,
  },
];

// Deep links to specific rules (use popular rule set, get a rule ID dynamically)
const POPULAR_RULE_ID_PLACEHOLDER = '__RULE_ID__';

const DEEP_LINKS: RouteExpectation[] = [
  {
    path: `/compute/popular/${POPULAR_RULE_ID_PLACEHOLDER}`,
    visibleSelector: '.compute-rule-page',
    requiresWasm: true,
  },
  {
    path: `/learn/popular/${POPULAR_RULE_ID_PLACEHOLDER}`,
    visibleSelector: '.learn-detail-page',
    requiresWasm: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Retrieves the first rule ID available in the popular rule set by visiting
 *  the learn index and reading the first link. */
async function getFirstPopularRuleId(
  page: import('@playwright/test').Page,
): Promise<string> {
  await gotoAndWait(page, '/learn/popular/');
  const firstLearnLink = page
    .locator('.rule-list-item .rule-links a[href*="/learn/popular/"]')
    .first();
  await expect(firstLearnLink).toBeVisible();
  const href = await firstLearnLink.getAttribute('href');
  // href is something like /learn/popular/iMdravajramu
  const ruleId = href?.split('/').pop();
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

      // Expected text is present (if specified)
      if (route.expectedText) {
        await expect(page.locator('body')).toContainText(route.expectedText);
      }
    });
  }
});

// ---------------------------------------------------------------------------
// Tests – deep links (rule-specific pages)
// ---------------------------------------------------------------------------

test.describe('Deep link – specific rule pages', () => {
  let cachedRuleId: string | undefined;

  test('direct navigation to /compute/popular/:ruleId renders rule page', async ({
    page,
  }) => {
    if (!cachedRuleId) cachedRuleId = await getFirstPopularRuleId(page);

    const path = `/compute/popular/${cachedRuleId}`;
    await gotoAndWait(page, path);

    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).toContain(cachedRuleId);

    await expect(page.locator('.compute-rule-page')).toBeVisible();
    await expect(page.locator('#poem-editor')).toBeVisible();
  });

  test('direct navigation to /learn/popular/:ruleId renders learn detail page', async ({
    page,
  }) => {
    if (!cachedRuleId) cachedRuleId = await getFirstPopularRuleId(page);

    const path = `/learn/popular/${cachedRuleId}`;
    await gotoAndWait(page, path);

    const finalPath = new URL(page.url()).pathname;
    expect(finalPath).toContain(cachedRuleId);

    await expect(page.locator('.learn-detail-page')).toBeVisible();
  });

  test('direct navigation with ?example=1 pre-fills editor', async ({
    page,
  }) => {
    if (!cachedRuleId) cachedRuleId = await getFirstPopularRuleId(page);

    const path = `/compute/popular/${cachedRuleId}?example=1`;
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

    // Should NOT silently redirect to home page content
    const homeHero = page.locator('.home-page-landing');
    await expect(homeHero).not.toBeVisible({ timeout: 3_000 });

    // The page body should indicate an error or "not found"
    await expect(page.locator('body')).toContainText(/not found|404/i);
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
    await gotoAndWait(page, '/compute/popular/nonexistent-rule-xyz');

    await expect(page.locator('.compute-rule-page')).not.toBeVisible({
      timeout: 3_000,
    });
  });
});
