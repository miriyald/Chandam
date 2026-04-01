import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import { renderRulePicker } from './rule-picker';
import { handleDetermine, handleMatch, handleClear } from './actions';
import type { RuleSummary } from '../types';

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
  const rules = await WasmBridge.getAllRules();

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
        <a href="/learn/${ruleSetId}/" class="learn-link">📖 Browse Rules</a>
      </div>

      <div class="quick-actions">
        <button id="btn-random" title="Random example">🎲</button>
        <button id="btn-clear" title="Clear">✕</button>
      </div>

      <div class="editor-section">
        <label for="poem-editor">Enter Telugu poem:</label>
        <textarea id="poem-editor" rows="8" placeholder="పద్యం ఇక్కడ టైప్ చేయండి..."></textarea>
      </div>

      <div class="rule-selection">
        <label for="rule-select">Select Rule (optional for Match):</label>
        <div id="rule-picker-container"></div>
      </div>

      <div class="main-actions">
        <button id="btn-determine">Determine</button>
        <button id="btn-match">Match</button>
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
