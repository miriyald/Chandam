import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Chandam WASM automation tests.
 *
 * SETUP:
 *   Before running tests, ensure the Chandam WASM app is published and served:
 *     dotnet publish ../Chandam.Wasm/Chandam.Wasm.csproj -c Release -o .publish -p:ExcludeYaml=false
 *     npx serve .publish/wwwroot -l 5080 -s
 *
 *   Or set CHANDAM_URL env var to point at an already-running instance:
 *     CHANDAM_URL=http://localhost:5000 npx playwright test
 *
 *   To create/update visual baselines:
 *     npx playwright test --update-snapshots
 */

const BASE_URL = process.env.CHANDAM_URL ?? 'http://localhost:5080';

export default defineConfig({
  testDir: './tests',

  // Snapshot (visual baseline) storage
  snapshotDir: './baselines',
  snapshotPathTemplate: '{snapshotDir}/{projectName}/{testFilePath}/{arg}{ext}',

  // WASM apps are stateful; run tests serially to avoid interference
  fullyParallel: false,
  workers: 1,

  // Fail fast in CI if tests are accidentally left in `.only` mode
  forbidOnly: !!process.env.CI,

  // Retry once in CI to reduce flakiness from slow WASM init
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,

    // Generous timeouts for WASM initialisation (can take 3-10 s)
    actionTimeout: 20_000,
    navigationTimeout: 45_000,

    // Capture trace on first retry for debugging
    trace: 'on-first-retry',

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Videos help debug WASM timing issues
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
      },
    },
  ],

  /**
   * Optional local development server.
   *
   * When CHANDAM_URL is set, the server is assumed to be already running.
   * When running in CI, set CI=true and start the server separately.
   *
   * For a quick local run without the webServer stanza, either:
   *   - Set CHANDAM_URL=http://localhost:<your-port>
   *   - Or publish+serve the app first and let reuseExistingServer pick it up.
   */
  webServer: process.env.CHANDAM_URL
    ? undefined
    : {
        // Serves the published WASM output in SPA mode (all 404s → index.html)
        command: 'npx --yes serve@14 .publish/wwwroot -l 5080 --single',
        port: 5080,
        // Reuse an existing server when running locally; require a fresh one in CI
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        stdout: 'pipe',
        stderr: 'pipe',
      },
});
