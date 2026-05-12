import { WasmBridge } from '../wasm-bridge';
import { getRuleSetAsync } from '../config';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import type { RuleInfo } from '../types';
import { makeUrlWithParams } from '../utils/url-helpers';
import { renderBreadcrumbs, buildRuleBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { renderRuleActions } from './rule-actions';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { exportSingleRule } from '../utils/export-book';

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

  setPageTitle('Learn ' + ruleInfo.name, ruleSetConfig.name);

  // Step 3: Render page HTML
  renderLearnDetailPageHtml(ruleSet, ruleInfo);
}

// Helper: Render page HTML
function renderLearnDetailPageHtml(
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
        <h1 class="meter-name">${ruleInfo.name}</h1>
        <div id="rule-actions-container"></div>
        <button id="btn-export-rule" class="action-btn btn-export-single">
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          <span>${t('export_book_single')}</span>
        </button>
        ${renderModeSwitcher({ ruleSetId, ruleId: ruleInfo.identifier, currentMode: 'learn' })}
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

  // Render action toolbar (favorite, github submit, create, delete)
  renderRuleActions('rule-actions-container', ruleSetId, ruleInfo.identifier);

  document.getElementById('btn-export-rule')?.addEventListener('click', () => {
    exportSingleRule(ruleSetId, ruleInfo);
  });
}


// Helper: Render examples section
function renderExamples(
  examples: RuleInfo['examples'],
  ruleSetId: string,
  ruleId: string
): string {
  if (!examples || examples.length === 0) {
    return `
      <div class="empty-examples-upsell">
        <p>${t('examples_none_available')}</p>
        <p>${t('examples_contribute_cta')}</p>
      </div>
    `;
  }

  return examples.map((example, idx) => {
    const exampleNumber = idx + 1;
    const poemHtml = example.beautified
      ? `<div class="poem">${example.beautified}</div>`
      : `<pre class="poem-text">${escapeHtml(example.text)}</pre>`;

    const authorAttribution = example.author
      ? `<div class="poem-attribution">— ${escapeHtml(example.author)}</div>`
      : '';

    const referenceHtml = example.reference
      ? `<div class="example-reference">${escapeHtml(example.reference)}</div>`
      : '';

    return `
      <div class="example-card">
        <a href="${makeUrlWithParams(`/compute/${ruleSetId}/${ruleId}`, { example: exampleNumber })}" class="try-example-btn" title="${t('btn_try_example')}">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
          ${t('btn_try_example')}
        </a>
        <div class="example-poem-area">
          ${poemHtml}
          ${authorAttribution}
        </div>
        ${referenceHtml ? `<div class="example-footer">${referenceHtml}</div>` : ''}
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
