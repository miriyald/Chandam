# Fix: Playwright tests timeout on static page routes (/about, /credits, /contact)

## Problem

Tests for `/about`, `/credits`, `/contact` always timeout at 30s. All other routes pass fine.

## Root Cause

The test fixture `waitForWasmReady()` in `Chandam.Wasm.Tests/fixtures/wasm-ready.ts:15-23` waits for `#initial-loader` to detach from the DOM:

```ts
await page.waitForSelector('#initial-loader', { state: 'detached', timeout });
```

This works for WASM-rendered routes (home, rule-sets, compute, learn) because:
1. `index.html` renders `<main id="content"><div id="initial-loader">...</div></main>`
2. WASM loads, `onWasmReady` fires, router renders the page, `#initial-loader` is removed

For static page routes (`/about`, `/credits`, `/contact`), the flow is different:
1. `index.html` renders with `#initial-loader` inside `#content`
2. WASM loads, `onWasmReady` fires, router calls `loadStaticPage('pages/about.html')`
3. `loadStaticPage` does `content.innerHTML = await response.text()` — this **replaces** `#content`'s children, destroying `#initial-loader`

BUT: the Playwright default test timeout is 30s. WASM cold-start takes 8-15s per fresh browser context. By the time the test runner reaches the static page tests (13th-21st in sequence), something causes WASM init to exceed 30s on these routes, and `#initial-loader` never detaches.

Evidence from the failure screenshot (`test-results/01-links-and-baselines--about-page-loads-without-errors-desktop/test-failed-1.png`): the loader spinner is still visible at timeout — WASM never finished initializing.

## Key Files

- **Fixture:** `Chandam.Wasm.Tests/fixtures/wasm-ready.ts` — `waitForWasmReady()` and `gotoAndWait()`
- **Config:** `Chandam.Wasm.Tests/playwright.config.ts` — no global `timeout` set (defaults to 30s)
- **Failing test:** `Chandam.Wasm.Tests/tests/01-links-and-baselines.spec.ts` — routes array at line 20
- **Static page loader:** `Chandam.Wasm/Client/src/router.ts:147` — `loadStaticPage()`
- **Route registration:** `Chandam.Wasm/Client/src/main.ts:102-104`
- **Index HTML:** `Chandam.Wasm.Tests/.publish/wwwroot/index.html:58-59` — `#content` > `#initial-loader`
- **Static pages:** `Chandam.Wasm.Tests/.publish/wwwroot/pages/{about,credits,contact}.html` — no `#initial-loader`

## Test Results (test 01, desktop only)

| Tests 1-12 | Routes: /, /rule-sets, /compute/popular/, /learn/popular/ | 12 passed |
|------------|----------------------------------------------------------|-----------|
| Tests 13-21 | Routes: /about, /credits, /contact | 9 failed (30s timeout) |

## Possible Fixes

1. **Increase test timeout** — Add `timeout: 60_000` in `playwright.config.ts` under `use:` to give WASM more time
2. **Smarter fixture** — Modify `waitForWasmReady()` to handle the case where `#initial-loader` may not exist (already removed or never present). For example, wait for EITHER `#initial-loader` detached OR page content to be non-empty
3. **Both** — increase timeout AND make the fixture more resilient

## How to Validate

```bash
cd Chandam.Wasm.Tests
npx playwright test tests/01-links-and-baselines.spec.ts --project=desktop --update-snapshots
```

All 21 tests should pass. Baselines for about, credits, contact should appear in `baselines/desktop/01-links-and-baselines.spec.ts/`.
