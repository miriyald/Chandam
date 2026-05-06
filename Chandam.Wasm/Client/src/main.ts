import { Router, loadStaticPage } from './router';
import { setPageTitle } from './utils/page-title';
import { renderHomePage } from './ui/home-page';
import { renderRuleSetsPage } from './ui/rule-sets-page';
import { renderRuleSetPage } from './ui/rule-set-page';
import { renderRulePage } from './ui/rule-page';
import { renderLearnIndexPage } from './ui/learn-index-page';
import { renderLearnDetailPage } from './ui/learn-detail-page';
import { renderRuleCreatorPage } from './ui/rule-creator-page';
import { renderExplorePage } from './ui/explore-page';
import { validateRuleSet, validateRuleSetAsync, validateRule, handleInvalidRuleSet, handleInvalidRule } from './utils/error-handlers';
import { createInitialLoader, preloadLoaderImage } from './utils/loader';
import { LoadingEvents, LoadingEventType } from './utils/loading-events';
import './utils/decompression'; // Register decompressGzip globally for C# interop
import { storageService } from './services/storage/storage-service';
import { initConsoleAPI, getUserId } from './services/console-api';
import { initLanguage, toggleLanguage, getLanguage, t } from './i18n';
import type { Translations } from './i18n';
import { analyticsService } from './services/analytics-service';
import { WasmBridge } from './wasm-bridge';

const router = new Router();

// Pre-load loader SVG to browser cache
preloadLoaderImage('/branding/chandam-circles.svg');

// Initialize loader system (sets up event listeners)
const initialLoader = createInitialLoader();

// Note: Initial loader is already visible in HTML,
// We just need to emit completion event when WASM is ready

// Home route - landing page
router.register('/', () => {
  setPageTitle(t('nav_home'));
  loadStaticPage(`pages/${getLanguage()}/home.html`);
});

// Rule sets route - browse rule sets
router.register('/rule-sets', () => {
  renderRuleSetsPage();
});

// Custom rule creator route
router.register('/create-rule', async () => {
  await renderRuleCreatorPage();
});

// Compute routes with validation
router.register('/compute/:ruleSet/', async (params) => {
  // Use async validation to support custom rulesets
  const isValid = await validateRuleSetAsync(params.ruleSet);
  if (!isValid) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }
  await renderRuleSetPage(params.ruleSet);
});

router.register('/compute/:ruleSet/:ruleId', async (params) => {
  // Use async validation to support custom rulesets
  const isValid = await validateRuleSetAsync(params.ruleSet);
  if (!isValid) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }

  const isRuleValid = await validateRule(params.ruleId);
  if (!isRuleValid) {
    handleInvalidRule(params.ruleSet, params.ruleId);
    return;
  }

  await renderRulePage(params);
});

// Explore routes (graph visualization)
router.register('/explore/:ruleSet/', async (params) => {
  const isValid = await validateRuleSetAsync(params.ruleSet);
  if (!isValid) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }
  await renderExplorePage(params.ruleSet);
});

// Learn routes
router.register('/learn/:ruleSet/', async (params) => {
  // Use async validation to support custom rulesets
  const isValid = await validateRuleSetAsync(params.ruleSet);
  if (!isValid) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }
  await renderLearnIndexPage(params.ruleSet);
});

router.register('/learn/:ruleSet/:ruleId', async (params) => {
  // Use async validation to support custom rulesets
  const isValid = await validateRuleSetAsync(params.ruleSet);
  if (!isValid) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }

  const isRuleValid = await validateRule(params.ruleId);
  if (!isRuleValid) {
    handleInvalidRule(params.ruleSet, params.ruleId);
    return;
  }

  await renderLearnDetailPage(params.ruleSet, params.ruleId);
});

// Static pages
router.register('/about', () => { setPageTitle(t('nav_about')); loadStaticPage(`pages/${getLanguage()}/about.html`); });
router.register('/credits', () => { setPageTitle(t('nav_credits')); loadStaticPage(`pages/${getLanguage()}/credits.html`); });
router.register('/contact', () => { setPageTitle(t('nav_contact')); loadStaticPage(`pages/${getLanguage()}/contact.html`); });

// Apply current language to static nav elements and lang toggle button
function applyLanguageToPage(): void {
  document.documentElement.lang = getLanguage();

  // Update elements with data-i18n attribute (static nav links, loading text)
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n') as keyof Translations;
    el.textContent = t(key);
  });

  // Update language toggle button label
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.title = t('lang_toggle_title');
    const span = langToggle.querySelector('.lang-current');
    if (span) span.textContent = t('lang_name');
  }
}

// Re-render current page when the user switches languages
window.addEventListener('languagechange', () => {
  applyLanguageToPage();
  router.route();
});

// Nav toggle for mobile and language toggle initialization
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  applyLanguageToPage();

  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('main-nav')?.classList.toggle('open');
  });

  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    toggleLanguage();
  });
});

// Global function called by Blazor WASM when ready
declare global {
  interface Window {
    onWasmReady?: () => void;
  }
}

window.onWasmReady = async () => {
  console.log('WASM ready, initializing storage and console API...');

  // Initialize storage service
  await storageService.init();
  console.log('Storage initialized');

  // Initialize console API for testing
  initConsoleAPI();

  // Initialize Google Analytics (auto-detects measurement ID from index.html)
  analyticsService.init();
  const userId = getUserId();
  analyticsService.setUserId(userId);
  console.log('Analytics initialized with user ID');

  // Update version and build date display from assembly metadata
  try {
    const version = await WasmBridge.getVersion();
    const buildDate = await WasmBridge.getBuildDate();
    const versionEl = document.getElementById('version-info');
    const buildDateEl = document.getElementById('build-date-info');
    if (versionEl) versionEl.textContent = `v${version}`;
    if (buildDateEl) buildDateEl.textContent = `Published: ${buildDate}`;
  } catch { /* non-critical */ }

  // Restore editor state (if any)
  const editorState = storageService.loadEditorState();
  if (editorState.text) {
    console.log('Restored editor state from previous session');
  }

  // Emit event - loader listens and hides itself (asynchronously)
  LoadingEvents.emit(LoadingEventType.LoadingCompleted, {
    source: 'wasm-init',
    message: 'WASM initialization complete'
  });

  // Initialize router immediately - loader will fade out independently
  console.log('Initializing router');
  router.init();
};

// Safety net: detect if WASM fails to load within timeout
const INIT_TIMEOUT_MS = 10000; // 10 seconds
let initComplete = false;

const initTimeout = setTimeout(() => {
  if (!initComplete) {
    console.error('[Chandam] WASM initialization timeout - check browser console');
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.innerHTML = `
        <div class="loader-container error" style="text-align: center; padding: 2rem;">
          <h2 style="color: #d32f2f;">Failed to Load Application</h2>
          <p>The application failed to initialize. Please try:</p>
          <button onclick="location.reload()"
                  style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer; font-size: 1rem;">
            Reload Page
          </button>
        </div>
      `;
    }
    // Track failure in analytics if available
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'exception', {
        description: 'wasm_init_timeout',
        fatal: true
      });
    }
  }
}, INIT_TIMEOUT_MS);

// Wrap existing onWasmReady to mark completion and clear timeout
const originalHandler = window.onWasmReady;
window.onWasmReady = async () => {
  initComplete = true;
  clearTimeout(initTimeout);
  if (originalHandler) {
    await originalHandler();
  }
};
