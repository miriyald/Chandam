import { WasmBridge } from '../wasm-bridge';
import { getRuleSet, getRuleSetAsync } from '../config';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import type { RuleInfo } from '../types';
import { makeUrl, makeUrlWithParams } from '../utils/url-helpers';
import { renderBreadcrumbs, buildRuleBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { renderRuleActions } from './rule-actions';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';

// Main function: Render learn detail page
export async function renderLearnDetailPage(ruleSet: string, ruleId: string) {
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
    await CustomRulesLoader.loadCustomRuleset(ruleSet);
  }

  // Step 3: Get rule info with examples
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

  const breadcrumbs = buildRuleBreadcrumbs(ruleSetId, ruleInfo.identifier, ruleInfo.name, 'learn');

  content.innerHTML = `
    <div class="learn-detail-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="page-header-controls">
        ${renderModeSwitcher({ ruleSetId, ruleId: ruleInfo.identifier, currentMode: 'learn' })}
        <a href="${makeUrl(`/learn/${ruleSetId}/`)}" class="browse-link">${t('link_back_to_browse')}</a>
      </div>

      <div class="page-header">
        <h1 class="meter-name">${ruleInfo.name}</h1>
        <div id="rule-actions-container"></div>
      </div>

      <div class="description-content">
        ${ruleInfo.description || '<p>No description available</p>'}
      </div>

      <section class="examples">
        <h2>${t('section_examples')} (${ruleInfo.examples?.length || 0})</h2>
        ${renderExamples(ruleInfo.examples, ruleSetId, ruleInfo.identifier)}
      </section>
    </div>
  `;

  // Render action toolbar (currently just favorite button, future: share, print, etc.)
  renderRuleActions('rule-actions-container', ruleSetId, ruleInfo.identifier);
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
