import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import { handleMatch, handleClear } from './actions';
import { renderFirstMatch, hideResults } from './results';

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

      <div class="quick-actions">
        <button id="btn-random" title="Random example">🎲</button>
        <button id="btn-clear" title="Clear">🧹</button>
      </div>

      <div class="editor-section">
        <label for="poem-editor">Telugu poem:</label>
        <textarea id="poem-editor" rows="8">${exampleText}</textarea>
      </div>

      <div class="match-options">
        <label><input type="checkbox" id="match-yati" checked> Yati (యతి)</label>
        <label><input type="checkbox" id="match-prasa" checked> Prasa (ప్రాస)</label>
      </div>

      <div class="main-actions">
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
function attachEventHandlers(ruleSet: string, ruleId: string) {
  // Match button - uses current rule
  document.getElementById('btn-match')?.addEventListener('click', async () => {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    const poemText = editor?.value || '';

    if (!poemText.trim()) {
      alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
      return;
    }

    // Read checkbox state instead of hardcoding true
    const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
    const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

    try {
      const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
      if (response.isMatch && response.match) {
        renderFirstMatch(response.match, 'results-container');
      } else {
        alert(response.errorMessage || 'సరిపోలలేదు (No match)');
      }
    } catch (err) {
      console.error('Match failed:', err);
      alert('లోపం సంభవించింది (Error occurred)');
    }
  });

  // Clear button
  document.getElementById('btn-clear')?.addEventListener('click', () => {
    const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
    if (editor) editor.value = '';
    hideResults();
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
}
