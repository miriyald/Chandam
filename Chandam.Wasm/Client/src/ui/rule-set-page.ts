import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import { renderRulePicker, setSelectedRule, getSelectedRule } from './rule-picker';
import { clearEditor } from './editor';
import { renderEditorCard, showRulePicker, hideRulePicker } from './shared-components';
import { renderFirstMatch } from './results';
import { getEditorText } from './editor';
import type { RuleSummaryDetailed } from '../types';

// Track last analyzed rule (from either Determine or Match) for smart auto-select
let lastAnalyzedRule: { id: string; name: string } | null = null;

// Store rules for lookup by ID
let allRules: RuleSummaryDetailed[] = [];

// Store current rule set for generating learn page links
let currentRuleSet: string = '';

// Main function: Render rule set page
export async function renderRuleSetPage(ruleSet: string) {
  // Reset last analyzed rule on page load
  lastAnalyzedRule = null;

  // Store current rule set for learn page links
  currentRuleSet = ruleSet;

  // Step 1: Validate and load rule set
  const ruleSetConfig = getRuleSet(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);

  // Step 2: Get all rules
  const rules = await WasmBridge.getAllRulesDetailed();

  // Store rules for lookup
  allRules = rules;

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

      ${renderEditorCard({
        contextText: 'Auto-detecting best match...',
        showRulePicker: true,
        showAutoDetect: true
      })}

      <div id="results-section" style="display: none;">
        <h3>Results</h3>
        <div id="results-container"></div>
      </div>
    </div>
  `;
}

// Step 5: Attach event handlers
function attachEventHandlers(ruleSet: string) {
  // Auto-detect toggle handler
  document.getElementById('auto-detect')?.addEventListener('change', (e) => {
    const isAutoDetect = (e.target as HTMLInputElement).checked;

    if (isAutoDetect) {
      hideRulePicker();  // Use shared utility
    } else {
      showRulePicker();  // Use shared utility

      // Smart auto-select: Use last analyzed rule (from Determine OR Match) or first rule
      if (lastAnalyzedRule) {
        setSelectedRule(lastAnalyzedRule.id, lastAnalyzedRule.name);
      }
      // If no lastAnalyzedRule, first rule is already selected by renderRulePicker
    }
  });

  // Smart analyze button (context-aware)
  document.getElementById('btn-analyze')?.addEventListener('click', async () => {
    const isAutoDetect = (document.getElementById('auto-detect') as HTMLInputElement)?.checked;

    if (isAutoDetect) {
      await handleDetermineWithTracking();
    } else {
      await handleMatchWithTracking();
    }
  });

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

  // Clear button
  document.getElementById('btn-clear')?.addEventListener('click', () => {
    clearEditor();
  });
}

// Custom determine handler that tracks last analyzed rule
async function handleDetermineWithTracking() {
  const poemText = getEditorText();
  if (!poemText.trim()) {
    alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
    return;
  }

  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

  try {
    const response = await WasmBridge.determine(poemText, yati, prasa);
    if (response.success && response.matches.length > 0) {
      const bestMatch = response.matches[0];

      // Track the analyzed rule (detected by Determine) for smart auto-select
      lastAnalyzedRule = {
        id: bestMatch.rule.identifier,
        name: bestMatch.rule.shortName || bestMatch.rule.name
      };

      // Show only the first (best) match
      renderFirstMatch(bestMatch, 'results-container', currentRuleSet);

      // Show results section
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.style.display = 'block';
    } else {
      alert(response.errorMessage || 'సరిపోలికలు దొరకలేదు (No matches found)');
    }
  } catch (err) {
    console.error('Determine failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
}

// Custom match handler that tracks last analyzed rule
async function handleMatchWithTracking() {
  const poemText = getEditorText();
  const ruleId = getSelectedRule();

  if (!poemText.trim()) {
    alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
    return;
  }

  if (!ruleId) {
    alert('దయచేసి ఛందం ఎంచుకోండి (Please select a rule)');
    // Add visual feedback to rule picker
    const rulePicker = document.getElementById('rule-picker-inline');
    if (rulePicker) {
      rulePicker.classList.add('error');
      setTimeout(() => rulePicker.classList.remove('error'), 2000);
    }
    return;
  }

  // Track the analyzed rule (manually selected for Match) for smart auto-select
  const selectedRule = allRules.find(r => r.identifier === ruleId);
  if (selectedRule) {
    lastAnalyzedRule = {
      id: selectedRule.identifier,
      name: selectedRule.shortName || selectedRule.name
    };
  }

  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

  try {
    const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
    if (response.isMatch && response.match) {
      renderFirstMatch(response.match, 'results-container', currentRuleSet);

      // Show results section
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.style.display = 'block';
    } else {
      alert(response.errorMessage || 'సరిపోలలేదు (No match)');
    }
  } catch (err) {
    console.error('Match failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
}
