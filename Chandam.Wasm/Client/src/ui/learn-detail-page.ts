import { WasmBridge } from '../wasm-bridge';
import { getRuleSet } from '../config';
import type { RuleInfo } from '../types';
import { makeUrl, makeUrlWithParams } from '../utils/url-helpers';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';

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
        <a href="${makeUrl(`/compute/${ruleSetId}/${ruleInfo.identifier}`)}" class="compute-link">${t('link_try_in_compute')}</a>
        <a href="${makeUrl(`/learn/${ruleSetId}/`)}" class="browse-link">${t('link_back_to_browse')}</a>
      </div>

      <h1 class="meter-name">${ruleInfo.name}</h1>
      <div class="rule-metadata">
        <span>${t('label_rule_set')} ${ruleSetName}</span> |
        <span>${t('label_type')} ${ruleInfo.padyamType}</span> |
        <span>${t('label_frequency')} ${ruleInfo.frequency}</span>
      </div>

      <section class="description">
        <h2>${t('section_description')}</h2>
        <p>${ruleInfo.description || t('no_description')}</p>
      </section>

      <section class="technical-details">
        <h2>${t('section_technical')}</h2>
        <dl>
          ${ruleInfo.sequence ? `<dt>${t('label_pattern_sequence')}</dt><dd><code>${ruleInfo.sequence}</code></dd>` : ''}
          ${ruleInfo.matraSeries ? `<dt>${t('label_matra_series')}</dt><dd><code>${ruleInfo.matraSeries}</code></dd>` : ''}
          ${ruleInfo.yatiMode ? `<dt>${t('label_yati_caesura')}</dt><dd>${ruleInfo.yatiMode}</dd>` : ''}
          ${ruleInfo.prasa !== undefined ? `<dt>${t('label_prasa_rhyme')}</dt><dd>${ruleInfo.prasa ? t('label_yes') : t('label_no')}</dd>` : ''}
        </dl>
      </section>

      <section class="examples">
        <h2>${t('section_examples')} (${ruleInfo.examples?.length || 0})</h2>
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
    return `<p>${t('no_examples')}</p>`;
  }

  return examples.map((example, idx) => {
    const exampleNumber = idx + 1; // 1-based numbering
    return `
      <div class="example-card">
        <h3>${t('label_example_n')} ${exampleNumber}</h3>
        <pre class="poem-text">${escapeHtml(example.text)}</pre>
        ${example.author ? `<p class="metadata"><strong>${t('label_author')}</strong> ${escapeHtml(example.author)}</p>` : ''}
        ${example.date ? `<p class="metadata"><strong>${t('label_date')}</strong> ${escapeHtml(example.date)}</p>` : ''}
        <a href="${makeUrlWithParams(`/compute/${ruleSetId}/${ruleId}`, { example: exampleNumber })}" class="try-example-btn">
          ${t('btn_try_example')}
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
