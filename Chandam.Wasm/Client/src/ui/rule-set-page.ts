import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import { renderRulePicker } from './rule-picker';
import { handleDetermine, handleMatch, handleClear } from './actions';
import type { RuleSummaryDetailed } from '../types';

// Main function: Render rule set page
export async function renderRuleSetPage(ruleSet: string) {
  // Step 1: Validate and load rule set
  const ruleSetConfig = getRuleSet(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);

  // Step 2: Get all rules
  const rules = await WasmBridge.getAllRulesDetailed();

  // Step 3: Render page HTML
  renderRuleSetPageHtml(ruleSetConfig.name, rules.length, ruleSet);

  // Step 4: Populate rule picker
  renderRulePicker(rules, 'rule-picker-container');

  // Step 5: Attach event handlers
  attachEventHandlers(ruleSet);
}

// Step 1: Load rule set if needed
async function loadRuleSet(rulesFile: string, examplesFile: string) {
  try {
    const result = await WasmBridge.reloadRules(rulesFile, examplesFile);
    if (!result.success) {
      console.error('Failed to load rules:', result.errorMessage);
    }
  } catch (err) {
    console.error('Failed to load rule set:', err);
  }
}

// Step 3: Render page HTML
function renderRuleSetPageHtml(ruleSetName: string, ruleCount: number, ruleSetId: string) {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="compute-rule-set-page">
      <div class="rule-set-info">
        <span class="label">Rule Set:</span>
        <span class="name">${ruleSetName}</span>
        <span class="count">[${ruleCount} Rules]</span>
      </div>

      <div class="page-links">
        <a href="/learn/${ruleSetId}/" class="learn-link">Browse Rules</a>
      </div>

      <div class="quick-actions">
        <button id="btn-random" title="Random example">🎲</button>
        <button id="btn-clear" title="Clear">🧹</button>
      </div>

      <div class="editor-section">
        <label for="poem-editor">Enter Telugu poem:</label>
        <textarea id="poem-editor" rows="8" placeholder="పద్యం ఇక్కడ టైప్ చేయండి..."></textarea>
      </div>

      <div class="match-options">
        <label><input type="checkbox" id="match-yati" checked> Yati (యతి)</label>
        <label><input type="checkbox" id="match-prasa" checked> Prasa (ప్రాస)</label>
      </div>

      <!-- Tabbed interface -->
      <div class="mode-tabs">
        <button id="tab-determine" class="mode-tab active">Determine</button>
        <button id="tab-match" class="mode-tab">Match</button>
      </div>

      <!-- Determine mode content -->
      <div id="determine-mode" class="mode-content active">
        <div class="main-actions">
          <button id="btn-determine">Determine</button>
        </div>
      </div>

      <!-- Match mode content -->
      <div id="match-mode" class="mode-content">
        <div class="match-section">
          <div class="rule-selection">
            <label for="rule-select">Select Rule:</label>
            <div id="rule-picker-container"></div>
          </div>
          <div class="main-actions">
            <button id="btn-match">Match</button>
          </div>
        </div>
      </div>

      <div id="results-section" style="display: none;">
        <h3>Results</h3>
        <div id="results-container"></div>
      </div>
    </div>
  `;
}

// Step 5: Attach event handlers
function attachEventHandlers(ruleSet: string) {
  // Tab switching
  document.getElementById('tab-determine')?.addEventListener('click', () => {
    switchToTab('determine');
  });

  document.getElementById('tab-match')?.addEventListener('click', () => {
    switchToTab('match');
  });

  // Action handlers
  document.getElementById('btn-determine')?.addEventListener('click', handleDetermine);
  document.getElementById('btn-match')?.addEventListener('click', handleMatch);
  document.getElementById('btn-clear')?.addEventListener('click', handleClear);

  // Random button - picks from any rule in the set
  document.getElementById('btn-random')?.addEventListener('click', async () => {
    try {
      const poem = await WasmBridge.getRandomPoemFromRuleSet();
      if (poem) {
        const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
        if (editor) editor.value = poem;
      } else {
        alert('ఉదాహరణలు అందుబాటులో లేవు (No examples available)');
      }
    } catch (err) {
      console.error('Random poem failed:', err);
    }
  });
}

// Helper: Switch between tabs
function switchToTab(mode: 'determine' | 'match') {
  // Update tab buttons
  const determineTab = document.getElementById('tab-determine');
  const matchTab = document.getElementById('tab-match');

  if (mode === 'determine') {
    determineTab?.classList.add('active');
    matchTab?.classList.remove('active');
  } else {
    determineTab?.classList.remove('active');
    matchTab?.classList.add('active');
  }

  // Update content visibility
  const determineMode = document.getElementById('determine-mode');
  const matchMode = document.getElementById('match-mode');

  if (mode === 'determine') {
    determineMode?.classList.add('active');
    matchMode?.classList.remove('active');
  } else {
    determineMode?.classList.remove('active');
    matchMode?.classList.add('active');
  }
}
