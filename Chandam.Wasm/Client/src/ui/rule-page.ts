import { WasmBridge } from '../wasm-bridge';
import { getRuleSetAsync } from '../config';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import { renderFirstMatch, hideResults } from './results';
import { clearEditor, enableEditorAutoSave } from './editor';
import { renderEditorCard } from './shared-components';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildRuleBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { renderRuleActions } from './rule-actions';
import { loadRuleSet } from '../utils/rule-loader';
import { storageService } from '../services/storage/storage-service';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { analyticsService } from '../services/analytics-service';

// Main function: Render specific rule page
export async function renderRulePage(params: Record<string, string>) {
  const ruleSet = params.ruleSet;
  const ruleId = params.ruleId;

  // Step 1: Validate and load rule set (supports both predefined and custom)
  const ruleSetConfig = await getRuleSetAsync(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

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

  // Step 3: Get rule info
  const ruleInfo = await WasmBridge.getRuleInfo(ruleId);

  setPageTitle('Compute ' + ruleInfo.name, ruleSetConfig.name);

  // Step 3: Get example text (from URL param or random)
  const exampleText = await getExampleText(params);

  // Step 4: Render page HTML
  await renderRulePageHtml(
    ruleSet,
    ruleInfo.name,
    ruleId,
    exampleText,
    ruleSetConfig.name
  );

  // Step 5: Attach event handlers
  attachEventHandlers(ruleSet, ruleId);
}

// Helper: Get example text based on URL params or random
async function getExampleText(params: Record<string, string>): Promise<string> {
  const ruleSet = params.ruleSet;
  const ruleId = params.ruleId;
  const exampleNumber = getExampleNumber(params);

  if (exampleNumber !== null) {
    // Try to get specific example
    const specificExample = await getExampleByNumber(ruleId, exampleNumber);

    if (specificExample !== null) {
      return specificExample;
    } else {
      // Invalid example number - clean URL and show empty editor
      cleanExampleFromUrl(ruleSet, ruleId);
      return '';
    }
  } else {
    // No example specified - get random
    return await WasmBridge.getRandomPoem(ruleId);
  }
}

// Helper: Get example number from URL (1-based, natural numbers)
function getExampleNumber(params: Record<string, string>): number | null {
  if (!params.example) return null;

  const num = parseInt(params.example, 10);
  if (isNaN(num) || num < 1) return null; // Must be positive natural number

  return num;
}

// Helper: Get specific example by 1-based number
async function getExampleByNumber(ruleId: string, exampleNumber: number): Promise<string | null> {
  const ruleInfo = await WasmBridge.getRuleInfo(ruleId);

  if (!ruleInfo.examples || ruleInfo.examples.length === 0) {
    return null;
  }

  const index = exampleNumber - 1; // Convert to 0-based index

  if (index < 0 || index >= ruleInfo.examples.length) {
    return null; // Out of bounds
  }

  return ruleInfo.examples[index].text;
}

// Helper: Clean invalid example parameter from URL
function cleanExampleFromUrl(ruleSet: string, ruleId: string) {
  const cleanUrl = makeUrl(`/compute/${ruleSet}/${ruleId}`);
  window.history.replaceState(null, '', cleanUrl);
}

// Step 4: Render page HTML
async function renderRulePageHtml(
  ruleSetId: string,
  ruleName: string,
  ruleId: string,
  exampleText: string,
  ruleSetName: string
) {
  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildRuleBreadcrumbs(ruleSetId, ruleId, ruleName, 'compute', ruleSetName);

  content.innerHTML = `
    <div class="compute-rule-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="page-header-controls">
        <h1 class="meter-name">${ruleName}</h1>
        <div id="rule-actions-container"></div>
        ${renderModeSwitcher({ ruleSetId, ruleId, currentMode: 'compute' })}
      </div>

      ${renderEditorCard({
    contextText: `${t('editor_matching_with')} ${ruleName}`,
    showRulePicker: false,
    showAutoDetect: false
  })}

      <div id="results-section" style="display: none;">
        <h3>${t('results_title')}</h3>
        <div id="results-container"></div>
      </div>
    </div>
  `;

  // Render action toolbar (favorite, create-rule, etc.) for this rule.
  await renderRuleActions('rule-actions-container', ruleSetId, ruleId);

  // Set editor text: example text takes priority, then saved state
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  if (editor) {
    if (exampleText) {
      // Example text from URL param (highest priority)
      editor.value = exampleText;
    } else {
      // Fallback to saved editor state
      const editorState = storageService.loadEditorState();
      if (editorState.text) {
        editor.value = editorState.text;
        console.log('Restored editor text from previous session');
      }
    }
  }

  // Enable auto-save for editor
  enableEditorAutoSave();
}

// Step 5: Attach event handlers
function attachEventHandlers(ruleSet: string, ruleId: string) {
  // Analyze button - always calls Match with fixed ruleId
  document.getElementById('btn-analyze')?.addEventListener('click', async () => {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    const poemText = editor?.value || '';

    if (!poemText.trim()) {
      alert(t('alert_enter_poem'));
      return;
    }

    const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
    const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

    const trackComplete = analyticsService.startTimedEvent('analyze_click', {
      mode: 'specific_rule',
      ruleSet: ruleSet,
      ruleId: ruleId,
      autoDetect: false
    });

    try {
      const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
      if (response.isMatch && response.match) {
        renderFirstMatch(response.match, 'results-container', ruleSet, { showRuleLink: false });

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

    trackComplete();
  });

  // Random button - picks from this rule's examples only
  document.getElementById('btn-random')?.addEventListener('click', async () => {
    const trackComplete = analyticsService.startTimedEvent('random_click', {
      ruleSet: ruleSet,
      ruleId: ruleId
    });

    try {
      const poem = await WasmBridge.getRandomPoem(ruleId);
      if (poem) {
        const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
        if (editor) editor.value = poem;
      } else {
        alert(t('alert_no_examples'));
      }
    } catch (err) {
      console.error('Random poem failed:', err);
    }

    trackComplete();
  });

  // Clear button
  document.getElementById('btn-clear')?.addEventListener('click', () => {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    const hadContent = editor ? editor.value.length > 0 : false;

    const done = analyticsService.startTimedEvent('clear_click', {
      ruleSet: ruleSet,
      hadContent
    });
    clearEditor();
    hideResults();
    done();
  });
}
