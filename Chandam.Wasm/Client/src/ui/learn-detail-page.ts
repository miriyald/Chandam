import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import type { RuleInfo } from '../types';

// Main function: Render learn detail page
export async function renderLearnDetailPage(ruleSet: string, ruleId: string) {
  // Step 1: Validate and load rule set
  const ruleSetConfig = getRuleSet(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);

  // Step 2: Get rule info with examples
  const ruleInfo = await WasmBridge.getRuleInfo(ruleId);

  // Step 3: Render page HTML
  renderLearnDetailPageHtml(ruleSetConfig.name, ruleSet, ruleInfo);
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

// Helper: Render page HTML
function renderLearnDetailPageHtml(
  ruleSetName: string,
  ruleSetId: string,
  ruleInfo: RuleInfo
) {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="learn-detail-page">
      <div class="page-links">
        <a href="/compute/${ruleSetId}/${ruleInfo.identifier}" class="compute-link">Try in Compute</a>
        <a href="/learn/${ruleSetId}/" class="browse-link">← Back to Browse</a>
      </div>

      <h1 class="meter-name">${ruleInfo.name}</h1>
      <div class="rule-metadata">
        <span>Rule Set: ${ruleSetName}</span> |
        <span>Type: ${ruleInfo.padyamType}</span> |
        <span>Frequency: ${ruleInfo.frequency}</span>
      </div>

      <section class="description">
        <h2>Description</h2>
        <p>${ruleInfo.description || 'No description available'}</p>
      </section>

      <section class="technical-details">
        <h2>Technical Details</h2>
        <dl>
          ${ruleInfo.sequence ? `<dt>Pattern (Sequence):</dt><dd><code>${ruleInfo.sequence}</code></dd>` : ''}
          ${ruleInfo.matraSeries ? `<dt>Matra Series:</dt><dd><code>${ruleInfo.matraSeries}</code></dd>` : ''}
          ${ruleInfo.yatiMode ? `<dt>Yati (Caesura):</dt><dd>${ruleInfo.yatiMode}</dd>` : ''}
          ${ruleInfo.prasa !== undefined ? `<dt>Prasa (Rhyme):</dt><dd>${ruleInfo.prasa ? 'Yes' : 'No'}</dd>` : ''}
        </dl>
      </section>

      <section class="examples">
        <h2>Examples (${ruleInfo.examples?.length || 0})</h2>
        ${renderExamples(ruleInfo.examples, ruleSetId, ruleInfo.identifier)}
      </section>
    </div>
  `;
}

// Helper: Render examples section
function renderExamples(
  examples: RuleInfo['examples'],
  ruleSetId: string,
  ruleId: string
): string {
  if (!examples || examples.length === 0) {
    return '<p>No examples available</p>';
  }

  return examples.map((example, idx) => {
    const exampleNumber = idx + 1; // 1-based numbering
    return `
      <div class="example-card">
        <h3>Example ${exampleNumber}</h3>
        <pre class="poem-text">${escapeHtml(example.text)}</pre>
        ${example.author ? `<p class="metadata"><strong>Author:</strong> ${escapeHtml(example.author)}</p>` : ''}
        ${example.date ? `<p class="metadata"><strong>Date:</strong> ${escapeHtml(example.date)}</p>` : ''}
        <a href="/compute/${ruleSetId}/${ruleId}?example=${exampleNumber}" class="try-example-btn">
          Try This Example
        </a>
      </div>
    `;
  }).join('');
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
