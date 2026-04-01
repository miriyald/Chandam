import { Router, loadStaticPage } from './router';
import { renderHomePage } from './ui/home-page';
import { renderRuleSetPage } from './ui/rule-set-page';
import { renderRulePage } from './ui/rule-page';
import { renderLearnIndexPage } from './ui/learn-index-page';
import { renderLearnDetailPage } from './ui/learn-detail-page';
import { validateRuleSet, validateRule, handleInvalidRuleSet, handleInvalidRule } from './utils/error-handlers';

const router = new Router();

// Home route - show all rule sets
router.register('/', () => {
  renderHomePage();
});

// Compute routes with validation
router.register('/compute/:ruleSet/', async (params) => {
  if (!validateRuleSet(params.ruleSet)) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }
  await renderRuleSetPage(params.ruleSet);
});

router.register('/compute/:ruleSet/:ruleId', async (params) => {
  if (!validateRuleSet(params.ruleSet)) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }

  const isValid = await validateRule(params.ruleId);
  if (!isValid) {
    handleInvalidRule(params.ruleSet, params.ruleId);
    return;
  }

  await renderRulePage(params);
});

// Learn routes
router.register('/learn/:ruleSet/', async (params) => {
  if (!validateRuleSet(params.ruleSet)) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }
  await renderLearnIndexPage(params.ruleSet);
});

router.register('/learn/:ruleSet/:ruleId', async (params) => {
  if (!validateRuleSet(params.ruleSet)) {
    handleInvalidRuleSet(params.ruleSet);
    return;
  }

  const isValid = await validateRule(params.ruleId);
  if (!isValid) {
    handleInvalidRule(params.ruleSet, params.ruleId);
    return;
  }

  await renderLearnDetailPage(params.ruleSet, params.ruleId);
});

// Static pages
router.register('/about', () => loadStaticPage('pages/about.html'));
router.register('/credits', () => loadStaticPage('pages/credits.html'));
router.register('/contact', () => loadStaticPage('pages/contact.html'));

// Nav toggle for mobile
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('main-nav')?.classList.toggle('open');
  });
});

// Global function called by Blazor WASM when ready
declare global {
  interface Window {
    onWasmReady?: () => void;
  }
}

window.onWasmReady = () => {
  console.log('WASM ready, initializing router');
  router.init();
};
