import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import { renderFirstMatch, hideResults } from './results';
import { clearEditor } from './editor';
import { renderEditorCard } from './shared-components';

// Main function: Render specific rule page
export async function renderRulePage(params: Record<string, string>) {
  const ruleSet = params.ruleSet;
  const ruleId = params.ruleId;

  // Step 1: Validate and load rule set
  const ruleSetConfig = getRuleSet(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);

  // Step 2: Get rule info
  const ruleInfo = await WasmBridge.getRuleInfo(ruleId);
  const rules = await WasmBridge.getAllRules();

  // Step 3: Get example text (from URL param or random)
  const exampleText = await getExampleText(params);

  // Step 4: Render page HTML
  renderRulePageHtml(
    ruleSetConfig.name,
    rules.length,
    ruleSet,
    ruleInfo.name,
    ruleId,
    exampleText
  );

  // Step 5: Attach event handlers
  attachEventHandlers(ruleSet, ruleId);
}

// Helper: Load rule set if needed
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
  const cleanUrl = `/compute/${ruleSet}/${ruleId}`;
  window.history.replaceState(null, '', cleanUrl);
}

// Step 4: Render page HTML
function renderRulePageHtml(
  ruleSetName: string,
  ruleCount: number,
  ruleSetId: string,
  ruleName: string,
  ruleId: string,
  exampleText: string
) {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="compute-rule-page">
      <div class="rule-set-info">
        <span class="label">Rule Set:</span>
        <span class="name">${ruleSetName}</span>
        <span class="count">[${ruleCount} Rules]</span>
      </div>

      <div class="current-rule-info">
        <span class="label">Rule:</span>
        <span class="name">${ruleName}</span>
      </div>

      <div class="page-links">
        <a href="/learn/${ruleSetId}/${ruleId}" class="learn-link">Learn More</a>
        <a href="/learn/${ruleSetId}/" class="browse-link">Browse All Rules</a>
      </div>

      ${renderEditorCard({
        contextText: `Matching with: ${ruleName}`,
        showRulePicker: false,
        showAutoDetect: false
      })}

      <div id="results-section" style="display: none;">
        <h3>Results</h3>
        <div id="results-container"></div>
      </div>
    </div>
  `;

  // Set example text if available
  if (exampleText) {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    if (editor) editor.value = exampleText;
  }
}

// Step 5: Attach event handlers
function attachEventHandlers(ruleSet: string, ruleId: string) {
  // Analyze button - always calls Match with fixed ruleId
  document.getElementById('btn-analyze')?.addEventListener('click', async () => {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    const poemText = editor?.value || '';

    if (!poemText.trim()) {
      alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
      return;
    }

    const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
    const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

    try {
      const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
      if (response.isMatch && response.match) {
        renderFirstMatch(response.match, 'results-container');

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
  });

  // Random button - picks from this rule's examples only
  document.getElementById('btn-random')?.addEventListener('click', async () => {
    try {
      const poem = await WasmBridge.getRandomPoem(ruleId);
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
    hideResults();
  });
}
