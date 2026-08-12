import { WasmBridge } from '../wasm-bridge';
import { getRuleSet, getRuleSetAsync } from '../config';
import { renderRulePicker, setSelectedRule, getSelectedRule } from './rule-picker';
import { clearEditor, enableEditorAutoSave } from './editor';
import { renderEditorCard, showRulePicker, hideRulePicker, readMatchFlags, attachAdvancedOptionsToggle } from './shared-components';
import { renderFirstMatch, renderScoreCards, hideResults } from './results';
import { getEditorText } from './editor';
import type { RuleSummaryDetailed } from '../types';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildRuleSetBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { renderRuleActions } from './rule-actions';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import { storageService } from '../services/storage/storage-service';
import { analyticsService } from '../services/analytics-service';
import { LoadingEvents, LoadingEventType } from '../utils/loading-events';
import { notify } from '../utils/notify';

// Yield to allow the browser to paint before blocking WASM calls
function nextFrame(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
}

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

  // Show page-level loading indicator immediately
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = `<div class="page-loading">
      <svg class="loader-svg" viewBox="0 0 128 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle class="loader-circle" cx="24" cy="24" r="7" fill="#1a3a5c"/>
        <circle class="loader-circle" cx="48" cy="24" r="10" fill="#b8860b"/>
        <circle class="loader-circle" cx="72" cy="24" r="7" fill="#1a3a5c"/>
        <circle class="loader-circle" cx="96" cy="24" r="10" fill="#b8860b"/>
      </svg>
    </div>`;
  }

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
    const loaded = await CustomRulesLoader.loadCustomRuleset(ruleSet);
    if (!loaded) {
      console.error(`Failed to load custom ruleset: ${ruleSet}`);
      return;
    }
  }

  // Step 3: Get all rules (exclude GenricVruttam from UI)
  const rules = (await WasmBridge.getAllRulesDetailed())
    .filter(r => r.padyamSubType !== 'GenricVruttam');

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

  const breadcrumbs = buildRuleSetBreadcrumbs(ruleSetId, 'compute', ruleSetName);

  content.innerHTML = `
    <div class="compute-rule-set-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="page-header-controls">
        <h1>${ruleSetName}</h1>
        <div id="rule-actions-container"></div>
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
        <div id="score-cards-container"></div>
      </div>
    </div>
  `;

  // Render rule actions (Create New Rule button, etc.)
  renderRuleActions('rule-actions-container', ruleSetId);
}

// Step 5: Attach event handlers
function attachEventHandlers(ruleSet: string) {
  attachAdvancedOptionsToggle();

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

    const trackComplete = analyticsService.startTimedEvent('analyze_click', {
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

    trackComplete();
  });

  // Random button - picks from any rule in the set
  document.getElementById('btn-random')?.addEventListener('click', async () => {
    const trackComplete = analyticsService.startTimedEvent('random_click', {
      ruleSet: currentRuleSet,
      ruleId: 'auto_detect'
    });

    LoadingEvents.emit(LoadingEventType.ActionStarted, {
      source: 'random',
      buttonId: 'btn-random'
    });
    await nextFrame();

    try {
      const poem = await WasmBridge.getRandomPoemFromRuleSet();
      if (poem) {
        const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
        if (editor) editor.value = poem;
      } else {
        notify(t('alert_no_examples'), 'warning');
      }
    } catch (err) {
      console.error('Random poem failed:', err);
    } finally {
      LoadingEvents.emit(LoadingEventType.ActionCompleted, {
        source: 'random',
        buttonId: 'btn-random'
      });
    }

    trackComplete();
  });

  // Clear button
  document.getElementById('btn-clear')?.addEventListener('click', () => {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    const hadContent = editor ? editor.value.length > 0 : false;

    const done = analyticsService.startTimedEvent('clear_click', {
      ruleSet: currentRuleSet,
      hadContent
    });
    clearEditor();
    hideResults();
    done();
  });

  // Score card "try" button — switch to manual mode, select rule, trigger analyze via UI event
  document.getElementById('score-cards-container')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.score-card-try') as HTMLElement;
    if (!btn) return;

    const ruleId = btn.getAttribute('data-rule-id');
    const ruleName = btn.getAttribute('data-rule-name');
    if (!ruleId || !ruleName) return;

    const done = analyticsService.startTimedEvent('score_card_try', {
      ruleSet: currentRuleSet,
      ruleId
    });
    done();

    // Switch to manual mode
    const autoDetect = document.getElementById('auto-detect') as HTMLInputElement;
    if (autoDetect && autoDetect.checked) {
      autoDetect.checked = false;
      showRulePicker();
    }

    // Select the rule
    setSelectedRule(ruleId, ruleName);

    // Trigger analyze button click — follows the natural UI flow (mode-aware)
    document.getElementById('btn-analyze')?.click();
  });
}

// Custom determine handler that tracks last analyzed rule
async function handleDetermineWithTracking() {
  // Clear existing score cards immediately so stale alternatives are never shown
  // while a new analysis is running.
  const scoreCardsContainer = document.getElementById('score-cards-container');
  if (scoreCardsContainer) {
    scoreCardsContainer.innerHTML = '';
  }

  const poemText = getEditorText();
  if (!poemText.trim()) {
    notify(t('alert_enter_poem'), 'warning');
    return;
  }

  const flags = readMatchFlags();

  LoadingEvents.emit(LoadingEventType.ActionStarted, {
    source: 'analyze',
    buttonId: 'btn-analyze',
    resultContainerId: 'results-section'
  });
  await nextFrame();

  try {
    const [response, scoresResponse] = await Promise.all([
      WasmBridge.determine(poemText, flags),
      WasmBridge.getScores(poemText, flags, 50).catch(() => null)
    ]);

    if (response.success && response.matches.length > 0) {
      const bestMatch = response.matches[0];

      lastAnalyzedRule = {
        id: bestMatch.rule.identifier,
        name: bestMatch.rule.shortName || bestMatch.rule.name
      };

      await renderFirstMatch(bestMatch, 'results-container', currentRuleSet);

      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.style.display = 'block';

      if (scoresResponse?.scores && scoresResponse.scores.length > 1 && scoreCardsContainer) {
        const alternatives = scoresResponse.scores
          .filter(s => s.identifier !== bestMatch.rule.identifier)
          .slice(0, 5);
        if (alternatives.length > 0) {
          renderScoreCards(alternatives, 'score-cards-container', currentRuleSet);
        } else {
          scoreCardsContainer.innerHTML = '';
        }
      } else if (scoreCardsContainer) {
        scoreCardsContainer.innerHTML = '';
      }

      // Keep the loading state until both best-match and score-card regions
      // have been updated and the browser can paint the final UI together.
      await nextFrame();
    } else {
      notify(response.errorMessage || t('alert_no_matches'), 'error');
    }
  } catch (err) {
    console.error('Determine failed:', err);
    notify(t('alert_error'), 'error');
  } finally {
    LoadingEvents.emit(LoadingEventType.ActionCompleted, {
      source: 'analyze',
      buttonId: 'btn-analyze',
      resultContainerId: 'results-section'
    });
  }
}

// Custom match handler that tracks last analyzed rule
async function handleMatchWithTracking() {
  // Clear score cards (only relevant in auto-detect mode)
  const scoreCards = document.getElementById('score-cards-container');
  if (scoreCards) scoreCards.innerHTML = '';

  const poemText = getEditorText();
  const ruleId = getSelectedRule();

  if (!poemText.trim()) {
    notify(t('alert_enter_poem'), 'warning');
    return;
  }

  if (!ruleId) {
    notify(t('alert_select_rule'), 'warning');
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

  LoadingEvents.emit(LoadingEventType.ActionStarted, {
    source: 'match',
    buttonId: 'btn-analyze',
    resultContainerId: 'results-section'
  });
  await nextFrame();

  try {
    const response = await WasmBridge.tryMatch(poemText, ruleId, readMatchFlags());
    if (response.isMatch && response.match) {
      await renderFirstMatch(response.match, 'results-container', currentRuleSet);

      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.style.display = 'block';

      // Keep loading until rendered content is paint-ready.
      await nextFrame();
    } else {
      notify(response.errorMessage || t('alert_no_match'), 'error');
    }
  } catch (err) {
    console.error('Match failed:', err);
    notify(t('alert_error'), 'error');
  } finally {
    LoadingEvents.emit(LoadingEventType.ActionCompleted, {
      source: 'match',
      buttonId: 'btn-analyze',
      resultContainerId: 'results-section'
    });
  }
}
