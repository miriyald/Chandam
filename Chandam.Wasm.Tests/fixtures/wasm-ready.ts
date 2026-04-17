import { test as base, expect, type Page } from '@playwright/test';

export { expect };

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/**
 * Waits for the Blazor WASM runtime to initialise and the router to load the
 * first page. The `#initial-loader` element is injected by index.html and is
 * replaced with real page content once `window.onWasmReady()` has fired and
 * the SPA router has rendered the route.
 */
export async function waitForWasmReady(
  page: Page,
  timeout = 45_000,
): Promise<void> {
  await page.waitForSelector('#initial-loader', {
    state: 'detached',
    timeout,
  });
}

/**
 * Navigates to `path` (relative to baseURL) then waits for the WASM runtime
 * to finish initialising.
 */
export async function gotoAndWait(
  page: Page,
  path: string,
  timeout = 45_000,
): Promise<void> {
  await page.goto(path);
  await waitForWasmReady(page, timeout);
}

// ---------------------------------------------------------------------------
// Custom test fixture
// ---------------------------------------------------------------------------

type WasmFixtures = {
  /** Console error messages collected during the test. */
  consoleErrors: string[];
};

/**
 * Extended Playwright `test` object that:
 *  - Collects browser console errors and page-level JS exceptions.
 *  - Exposes `consoleErrors` for assertions.
 */
export const test = base.extend<WasmFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await use(errors);
  },
});
