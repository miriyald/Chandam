import { Router, loadStaticPage } from './router';
import { WasmBridge } from './wasm-bridge';
import { renderRulePicker } from './ui/rule-picker';
import { renderRuleSetSwitcher } from './ui/rule-set-switcher';
import { initAccordions } from './ui/accordion';
import { handleDetermine, handleMatch, handleRandom, handleClear } from './ui/actions';

const router = new Router();

// Route handlers
router.register('/', () => loadStaticPage('pages/home.html'));
router.register('/home', () => loadStaticPage('pages/home.html'));
router.register('/analyze', renderAnalyzePage);
router.register('/about', () => loadStaticPage('pages/about.html'));
router.register('/credits', () => loadStaticPage('pages/credits.html'));
router.register('/contact', () => loadStaticPage('pages/contact.html'));

async function renderAnalyzePage() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="analyze-page">
      <h2>Poem Analysis</h2>

      <div class="rule-set-section">
        <label for="rule-set-select">Rule Set:</label>
        <div id="rule-set-switcher-container"></div>
        <span id="loading-indicator" style="display: none;">⟳ Loading...</span>
      </div>

      <div class="editor-section">
        <label for="poem-editor">Enter Telugu poem:</label>
        <textarea id="poem-editor" rows="8" placeholder="పద్యం ఇక్కడ టైప్ చేయండి..."></textarea>
      </div>

      <div class="accordion" id="options-section">
        <div class="accordion-header">Options ▼</div>
        <div class="accordion-content">
          <label><input type="checkbox" id="match-yati" checked> Yati (యతి)</label>
          <label><input type="checkbox" id="match-prasa" checked> Prasa (ప్రాస)</label>
        </div>
      </div>

      <div class="accordion" id="rule-section">
        <div class="accordion-header">Rule Selection ▼</div>
        <div class="accordion-content">
          <div id="rule-picker-container"></div>
        </div>
      </div>

      <div class="actions">
        <button id="btn-determine">▶ Determine</button>
        <button id="btn-match">▶ Match</button>
        <button id="btn-random"># Random</button>
        <button id="btn-clear">✕ Clear</button>
      </div>

      <div class="accordion" id="results-section">
        <div class="accordion-header">Results ▼</div>
        <div class="accordion-content">
          <div id="results-container"></div>
        </div>
      </div>
    </div>
  `;

  // Initialize accordions
  initAccordions();

  // Render rule set switcher
  renderRuleSetSwitcher('rule-set-switcher-container');

  // Load rules and populate picker
  try {
    const rules = await WasmBridge.getAllRules();
    renderRulePicker(rules, 'rule-picker-container');
  } catch (err) {
    console.error('Failed to load rules:', err);
  }

  // Wire up buttons
  document.getElementById('btn-determine')?.addEventListener('click', handleDetermine);
  document.getElementById('btn-match')?.addEventListener('click', handleMatch);
  document.getElementById('btn-random')?.addEventListener('click', handleRandom);
  document.getElementById('btn-clear')?.addEventListener('click', handleClear);
}

// Nav toggle for mobile
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav-toggle')?.addEventListener('click', () => {
    document.getElementById('main-nav')?.classList.toggle('open');
  });
});

// Global function called by Blazor WASM when ready
(window as any).onWasmReady = () => {
  console.log('WASM ready, initializing router');
  router.init();
};
