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
          <span class="material-symbols-outlined" style="font-size:16px" aria-hidden="true">download</span>
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

      ${renderReferences(ruleInfo.references)}
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
          <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">play_arrow</span>
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
        <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">refresh</span>
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

function renderReferences(references: RuleInfo['references']): string {
  if (!references || references.length === 0) return '';
  return `
    <section class="references">
      <h2>${t('section_references')}</h2>
      <ul class="references-list">
        ${references.map(ref => `<li>${escapeHtml(ref)}</li>`).join('')}
      </ul>
    </section>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
