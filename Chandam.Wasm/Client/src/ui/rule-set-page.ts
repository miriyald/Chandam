import { WasmBridge } from '../wasm-bridge';
import { getRuleSet, getRuleSetAsync } from '../config';
import { renderRulePicker, setSelectedRule, getSelectedRule } from './rule-picker';
import { clearEditor, enableEditorAutoSave } from './editor';
import { renderEditorCard, showRulePicker, hideRulePicker } from './shared-components';
import { renderFirstMatch } from './results';
import { getEditorText } from './editor';
import type { RuleSummaryDetailed } from '../types';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildRuleSetBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import { storageService } from '../services/storage/storage-service';
import { analyticsService } from '../services/analytics-service';

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

  // Step 1: Validate and load rule set (supports both predefined and custom)
  const ruleSetConfig = await getRuleSetAsync(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  setPageTitle('Compute ' + ruleSetConfig.name);

  // Step 2: Load rules based on type
  if (ruleSetConfig.rulesFile) {
    // Predefined ruleset - load from files
    await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);
  } else {
    // Custom ruleset - load from IndexedDB
    await CustomRulesLoader.loadCustomRuleset(ruleSet);
  }

  // Step 3: Get all rules
  const rules = await WasmBridge.getAllRulesDetailed();

  // Store rules for lookup
  allRules = rules;

  // Step 3: Render page HTML
  renderRuleSetPageHtml(ruleSetConfig.name, rules.length, ruleSet);

  // Step 4: Restore editor state (if saved)
  const editorState = storageService.loadEditorState();
  if (editorState.text) {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    if (editor) {
      editor.value = editorState.text;
      console.log('Restored editor text from previous session');
    }
  }

  // Step 4b: Enable auto-save for editor
  enableEditorAutoSave();

  // Step 5: Populate rule picker
  renderRulePicker(rules, 'rule-picker-container');

  // Step 6: Attach event handlers
  attachEventHandlers(ruleSet);
}

// Step 3: Render page HTML
function renderRuleSetPageHtml(ruleSetName: string, ruleCount: number, ruleSetId: string) {
  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildRuleSetBreadcrumbs(ruleSetId, 'compute');

  content.innerHTML = `
    <div class="compute-rule-set-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="page-header-controls">
        <h1>${ruleSetName}</h1>
        ${renderModeSwitcher({ ruleSetId, currentMode: 'compute' })}
      </div>
      <div class="page-subtitle">${ruleCount} ${t('label_rules_count')}</div>

      ${renderEditorCard({
        contextText: t('editor_auto_detect_context'),
        showRulePicker: true,
        showAutoDetect: true
      })}

      <div id="results-section" style="display: none;">
        <h3>${t('results_title')}</h3>
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

    // Track analyze button click
    analyticsService.trackEvent('analyze_click', {
      mode: isAutoDetect ? 'auto_detect' : 'specific_rule',
      ruleSet: currentRuleSet,
      ruleId: isAutoDetect ? null : getSelectedRule(),
      autoDetect: isAutoDetect
    });

    if (isAutoDetect) {
      await handleDetermineWithTracking();
    } else {
      await handleMatchWithTracking();
    }
  });

  // Random button - picks from any rule in the set
  document.getElementById('btn-random')?.addEventListener('click', async () => {
    // Track random button click
    analyticsService.trackEvent('random_click', {
      ruleSet: currentRuleSet,
      ruleId: 'auto_detect'  // Random from entire set
    });

    try {
      const poem = await WasmBridge.getRandomPoemFromRuleSet();
      if (poem) {
        const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
        if (editor) editor.value = poem;
      } else {
        alert(t('alert_no_examples'));
      }
    } catch (err) {
      console.error('Random poem failed:', err);
    }
  });

  // Clear button
  document.getElementById('btn-clear')?.addEventListener('click', () => {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    const hadContent = editor ? editor.value.length > 0 : false;

    // Track clear button click
    analyticsService.trackEvent('clear_click', {
      ruleSet: currentRuleSet,
      hadContent
    });

    clearEditor();
  });
}

// Custom determine handler that tracks last analyzed rule
async function handleDetermineWithTracking() {
  const poemText = getEditorText();
  if (!poemText.trim()) {
    alert(t('alert_enter_poem'));
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
      alert(response.errorMessage || t('alert_no_matches'));
    }
  } catch (err) {
    console.error('Determine failed:', err);
    alert(t('alert_error'));
  }
}

// Custom match handler that tracks last analyzed rule
async function handleMatchWithTracking() {
  const poemText = getEditorText();
  const ruleId = getSelectedRule();

  if (!poemText.trim()) {
    alert(t('alert_enter_poem'));
    return;
  }

  if (!ruleId) {
    alert(t('alert_select_rule'));
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
      alert(response.errorMessage || t('alert_no_match'));
    }
  } catch (err) {
    console.error('Match failed:', err);
    alert(t('alert_error'));
  }
}
