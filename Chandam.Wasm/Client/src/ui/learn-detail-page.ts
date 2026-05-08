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
        <button id="btn-export-rule" class="btn-export-single">
          <svg class="export-icon" viewBox="0 0 24 24" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          ${t('export_book_single')}
        </button>
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
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
            ${ruleInfo.identifier.startsWith('custom-') ? t('action_submit_github') : t('results_submit_github')}
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
    const done = analyticsService.startTimedEvent('submit_github_click', {
      ruleId: ruleInfo.identifier,
      ruleSetId,
      type: isCustomRule ? 'custom-rule' : 'new-example',
      source: 'learn_page'
    });

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

    done();
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
