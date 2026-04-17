# Chandam.Wasm.Tests

Playwright end-to-end automation tests for the [Chandam](https://chandamu.github.io/) Blazor WASM app.

## Prerequisites

- **Node.js ≥ 20** and **npm ≥ 10**
- The Chandam WASM app must be **built and served** before running tests.
  (See [Setup](#setup) below.)

## Setup

### 1 – Install dependencies

```bash
cd Chandam.Wasm.Tests
npm install
npm run install-browsers   # downloads Chromium + WebKit
```

### 2 – Build and serve the WASM app

Publish the WASM project and serve it locally:

```bash
# From repo root
dotnet publish Chandam.Wasm/Chandam.Wasm.csproj \
  -c Release -o Chandam.Wasm.Tests/.publish \
  -p:ExcludeYaml=false

# Serve on port 5080 in SPA mode (all 404 → index.html)
cd Chandam.Wasm.Tests
npx serve .publish/wwwroot -l 5080 --single
```

Keep that process running while you execute the tests.

> **Tip:** Set `CHANDAM_URL=http://localhost:5080` to point the tests at any
> already-running instance (local dev server, staging, etc.) and skip the
> embedded web-server stanza entirely.

## Running tests

```bash
# All tests, all projects (desktop + mobile)
npm test

# Desktop only
npm run test:desktop

# Mobile only (iPhone 12 viewport)
npm run test:mobile

# Interactive UI mode (great for debugging)
npm run test:ui

# With browser visible
npm run test:headed
```

## Visual baseline images

Visual regression tests compare screenshots against baselines stored in
`baselines/desktop/` and `baselines/mobile/`.

```bash
# Create / update baselines (first run, or after deliberate UI changes)
npm run snapshots
```

Baseline images are committed to source control so CI comparisons are
reproducible without a prior run.

## Test structure

| File | What it tests |
|------|--------------|
| `01-links-and-baselines.spec.ts` | All routes load without errors; same-origin links resolve; visual snapshots |
| `02-ruleset-to-rule.spec.ts` | Rule Sets page → Analyze → picker → rule detail navigation |
| `03-compute-workflow.spec.ts` | Random poem → Clear → Analyze workflow (auto-detect & specific-rule modes) |
| `04-search-filters.spec.ts` | Learn page filter sidebar (search, category, examples, matra range, clear all) |
| `05-deep-links.spec.ts` | Hard-refresh on every route; invalid routes render 404 gracefully |
| `06-language-toggle.spec.ts` | Language toggle button switches UI between Telugu and English |
| `07-learn-detail.spec.ts` | Learn detail page (rule name, description, examples, "Try" button, mode switcher) |
| `08-favorites.spec.ts` | Heart button favorites/unfavorites rules; Favorites card appears/disappears |
| `09-mobile-nav.spec.ts` | Hamburger menu opens/closes on mobile viewport |
| `10-wasm-error-states.spec.ts` | WASM init, empty editor alerts, invalid route graceful handling, rule creator |

## Configuration

`playwright.config.ts` exposes the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `CHANDAM_URL` | `http://localhost:5080` | Override the base URL |
| `CI` | unset | Set to any value to enable strict mode (no retries, require fresh server) |

## CI integration

A typical CI pipeline step:

```yaml
- name: Publish WASM app
  run: |
    dotnet publish Chandam.Wasm/Chandam.Wasm.csproj \
      -c Release -o Chandam.Wasm.Tests/.publish \
      -p:ExcludeYaml=false

- name: Run Playwright tests
  working-directory: Chandam.Wasm.Tests
  env:
    CI: true
  run: |
    npm ci
    npm run install-browsers
    npx serve .publish/wwwroot -l 5080 --single &
    sleep 5
    npm test
```
