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
import { analyticsService } from '../services/analytics-service';
import { exportSingleRule } from '../utils/export-book';
import {
  submitToGitHub,
  buildCustomRulePayload,
  buildExamplePayload,
  stripHtmlToText
} from '../utils/github-submit';

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
        <button id="btn-export-rule" class="btn-export-single">${t('export_book_single')}</button>
        ${renderModeSwitcher({ ruleSetId, ruleId: ruleInfo.identifier, currentMode: 'learn' })}
      </div>

      <div class="description-content">
        ${ruleInfo.description || '<p>No description available</p>'}
      </div>

      <section class="examples">
        <h2>${t('section_examples')} (${ruleInfo.examples?.length || 0})</h2>
        ${renderExamples(ruleInfo.examples, ruleSetId, ruleInfo.identifier)}
        <div class="examples-footer">
          <button id="btn-submit-github-learn" class="btn-submit-github"
                  data-rule-id="${escapeHtml(ruleInfo.identifier)}"
                  data-rule-name="${escapeHtml(ruleInfo.name)}"
                  data-rule-set="${escapeHtml(ruleSetId)}">
            ${t('results_submit_github')}
          </button>
        </div>
      </section>
    </div>
  `;

  // Render action toolbar (currently just favorite button, future: share, print, etc.)
  renderRuleActions('rule-actions-container', ruleSetId, ruleInfo.identifier);
  attachLearnSubmitHandler(ruleSetId, ruleInfo);

  document.getElementById('btn-export-rule')?.addEventListener('click', () => {
    exportSingleRule(ruleSetId, ruleInfo);
  });
}

function attachLearnSubmitHandler(ruleSetId: string, ruleInfo: RuleInfo): void {
  const btn = document.getElementById('btn-submit-github-learn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const isCustomRule = ruleInfo.identifier.startsWith('custom-');

    if (isCustomRule) {
      const { customRulesService } = await import('../services/storage/custom-rules-service');
      const ruleDto = await customRulesService.getCustomRule(ruleInfo.identifier);
      if (!ruleDto) return;

      const description = ruleInfo.description ? stripHtmlToText(ruleInfo.description) : '';
      const payload = buildCustomRulePayload(
        ruleInfo.name, ruleInfo.identifier, ruleDto.Language, description, ruleDto, ruleDto.Examples
      );
      submitToGitHub(payload, 'learn_page');
    } else {
      const payload = buildExamplePayload(ruleInfo.name, ruleSetId, ruleInfo.identifier, []);
      submitToGitHub(payload, 'learn_page');
    }

    analyticsService.trackEvent('submit_github_click', {
      ruleId: ruleInfo.identifier,
      ruleSetId,
      type: isCustomRule ? 'custom-rule' : 'new-example',
      source: 'learn_page'
    });
  });
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
        <div class="example-poem-area">
          ${poemHtml}
          ${authorAttribution}
        </div>
        <div class="example-footer">
          ${referenceHtml}
          <a href="${makeUrlWithParams(`/compute/${ruleSetId}/${ruleId}`, { example: exampleNumber })}" class="try-example-btn">
            ${t('btn_try_example')}
          </a>
        </div>
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
