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
import { wrapPoemLines } from '../utils/poem-html';
import { setPageTitle } from '../utils/page-title';
import { exportSingleRule } from '../utils/export-book';

export async function renderLearnDetailPage(ruleSet: string, ruleId: string) {
  const ruleSetConfig = await getRuleSetAsync(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  if (ruleSetConfig.rulesFile) {
    await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);
  } else {
    await CustomRulesLoader.loadCustomRuleset(ruleSet);
  }

  const ruleInfo = await WasmBridge.getRuleInfo(ruleId);

  setPageTitle('Learn ' + ruleInfo.name, ruleSetConfig.name);

  renderLearnDetailPageHtml(ruleSet, ruleInfo, ruleSetConfig.name);
}

function renderLearnDetailPageHtml(
  ruleSetId: string,
  ruleInfo: RuleInfo,
  ruleSetName: string
) {
  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildRuleBreadcrumbs(ruleSetId, ruleInfo.identifier, ruleInfo.name, 'learn', ruleSetName);
  const hasExamples = ruleInfo.examples && ruleInfo.examples.length > 0;
  const showGenerated = !hasExamples && ruleInfo.padyamType === 'Vruttam';
  const exampleCount = hasExamples ? ruleInfo.examples!.length : (showGenerated ? 1 : 0);

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
        <h2>${t('section_examples')} (${exampleCount})</h2>
        ${renderExamples(ruleInfo.examples, ruleSetId, ruleInfo.identifier, showGenerated)}
      </section>
    </div>
  `;

  renderRuleActions('rule-actions-container', ruleSetId, ruleInfo.identifier);

  document.getElementById('btn-export-rule')?.addEventListener('click', () => {
    exportSingleRule(ruleSetId, ruleInfo);
  });

  if (showGenerated) {
    loadGeneratedPoem(ruleInfo.identifier);
    document.getElementById('btn-regenerate')?.addEventListener('click', () => {
      loadGeneratedPoem(ruleInfo.identifier);
    });
  }
}

async function loadGeneratedPoem(ruleId: string) {
  const el = document.getElementById('generated-poem-text');
  if (!el) return;
  el.textContent = '...';
  const result = await WasmBridge.getRandomPoem(ruleId);
  el.textContent = result.text || '—';
}

function renderExamples(
  examples: RuleInfo['examples'],
  ruleSetId: string,
  ruleId: string,
  showGenerated: boolean
): string {
  if (!examples || examples.length === 0) {
    if (showGenerated) {
      return renderGeneratedCard(ruleSetId, ruleId);
    }
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
      ? `<div class="poem">${wrapPoemLines(example.beautified)}</div>`
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

function renderGeneratedCard(ruleSetId: string, ruleId: string): string {
  const author = t('generated_example_badge');
  const reference = t('generated_disclaimer');

  return `
    <div class="example-card">
      <button id="btn-regenerate" class="try-example-btn" title="${t('btn_regenerate')}">
        <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
        ${t('btn_regenerate')}
      </button>
      <div class="example-poem-area">
        <pre class="poem-text" id="generated-poem-text">...</pre>
        <div class="poem-attribution">— ${escapeHtml(author)}</div>
      </div>
      <div class="example-footer">
        <div class="example-reference">${escapeHtml(reference)}</div>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
