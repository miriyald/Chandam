import type { ChandamMatch, ChandamScore, MatchError } from '../types';
import { openAccordion } from './accordion';
import { makeUrl } from '../utils/url-helpers';
import { t } from '../i18n';
import { analyticsService } from '../services/analytics-service';
import { generateShortHash } from '../utils/hash-utils';
import { WasmBridge } from '../wasm-bridge';
import {
  submitToGitHub,
  buildCustomRulePayload,
  buildExamplePayload,
  stripHtmlToText
} from '../utils/github-submit';
import { collectionService } from '../services/storage/collection-service';
import { wrapPoemLines } from '../utils/poem-html';

// Module-level map to pass match data to click handlers
const renderedMatches = new Map<string, ChandamMatch>();

export async function renderResults(matches: ChandamMatch[], containerId: string, ruleSet?: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = matches.map(match => renderMatchCard(match, ruleSet)).join('');
  attachResultActionHandlers(container, ruleSet);

  // Auto-open results section
  openAccordion('results-section');

  // Track each result
  for (const match of matches) {
    await trackAnalysisResult(match);
  }
}

// Render only the first (best) match
export async function renderFirstMatch(match: ChandamMatch, containerId: string, ruleSet?: string, options?: { showRuleLink?: boolean }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const showLink = options?.showRuleLink ?? true;
  container.innerHTML = renderMatchCard(match, ruleSet, showLink);
  attachResultActionHandlers(container, ruleSet);

  // Show results section
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }

  // Track analysis result
  await trackAnalysisResult(match);
}

// Render a single match card with split-view layout
function renderMatchCard(match: ChandamMatch, ruleSet?: string, showRuleLink = true): string {
  // Store match for click handler access
  renderedMatches.set(match.rule.identifier, match);

  // Determine status styling
  const statusClass = match.isMatched ? 'match-success' : 'match-failure';
  const statusIcon = match.isMatched ? '✓' : '✗';

  // Only show score if < 100% — bar + percentage
  const scoreLevel = getScoreLevel(match.matchPercentage);
  const scoreHtml = match.matchPercentage < 100
    ? `<div class="match-score-group">
        <div class="match-score-bar"><div class="match-score-bar-fill score-bar-${scoreLevel}" style="width: ${match.matchPercentage}%"></div></div>
        <span class="match-score-value match-score-${scoreLevel}">${match.matchPercentage}%</span>
      </div>`
    : '';

  // Generate rule details link (opens in new tab) — hidden on rule compute pages
  const ruleLink = (showRuleLink && ruleSet && match.rule.identifier)
    ? `<a href="${makeUrl(`/learn/${ruleSet}/${match.rule.identifier}/`)}" class="action-btn rule-details-link" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg> <span>${t('results_view_details')}</span></a>`
    : '';

  // Action buttons for 95%+ matches
  const isCustomRule = match.rule.identifier.startsWith('custom-');
  const addExampleBtn = (match.matchPercentage >= 95 && isCustomRule)
    ? `<button class="action-btn btn-add-example" data-rule-id="${escapeAttr(match.rule.identifier)}" title="${t('results_add_to_examples')}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg> <span>${t('results_add_to_examples')}</span></button>`
    : '';
  const submitGithubBtn = (match.matchPercentage >= 95 && ruleSet)
    ? `<button class="action-btn btn-submit-github" data-rule-id="${escapeAttr(match.rule.identifier)}" data-rule-name="${escapeAttr(match.rule.name)}" data-rule-set="${escapeAttr(ruleSet)}" title="${t('results_submit_github')}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg> <span>${t('results_submit_github')}</span></button>`
    : '';
  const collectionRuleName = match.rule.shortName || match.rule.name;
  const addToCollectionBtn = (match.matchPercentage >= 95 && ruleSet)
    ? `<button class="action-btn btn-add-collection" data-rule-id="${escapeAttr(match.rule.identifier)}" data-rule-name="${escapeAttr(collectionRuleName)}" data-rule-set="${escapeAttr(ruleSet)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg> <span>${t('results_add_to_collection')}</span></button>`
    : '';

  // Enhanced error display (table format)
  const errorsHtml = (match.errors && match.errors.length > 0)
    ? renderErrorsTable(match.errors)
    : '';

  // CONDITIONAL RENDERING based on match percentage
  // Declared without initializer — both branches assign before use; initializing '' would trigger no-useless-assignment lint error
  let bodyHtml: string;

  if (match.matchPercentage === 100 && match.beautified) {
    // 100% match: Show beautified poem (left) + gana vibhajana table (right)
    bodyHtml = `
      <div class="match-body-split">
        <div class="padyam">
          <div class="poem">
            ${wrapPoemLines(match.beautified)}
          </div>
        </div>
        <div class="ganaVibhajana">
          ${match.html || ''}
        </div>
      </div>
    `;
  } else {
    // < 100% match: Show gana vibhajana table (left) + errors (right) — EXISTING BEHAVIOR
    const hasErrors = match.errors && match.errors.length > 0;
    bodyHtml = `
      <div class="match-body-split">
        <div class="match-table-container">
          ${match.html || ''}
        </div>
        ${hasErrors ? `<div class="match-errors-container">${errorsHtml}</div>` : ''}
      </div>
    `;
  }

  const sequenceHint = (match.matchPercentage < 100 && match.rule.sequence)
    ? `<div class="match-sequence-hint">${match.rule.sequence}</div>`
    : '';

  return `
    <div class="match-card ${statusClass}">
      <div class="match-header">
        <div class="match-title-group">
          <span class="match-icon">${statusIcon}</span>
          <h3 class="meter-name">${match.rule.name}</h3>
          ${scoreHtml}
        </div>
        <div class="match-actions">
          ${addToCollectionBtn}
          ${addExampleBtn}
          ${submitGithubBtn}
          ${ruleLink}
        </div>
      </div>
      ${sequenceHint}
      ${bodyHtml}
    </div>
  `;
}

function getScoreLevel(percentage: number): string {
  if (percentage >= 95) return 'high';
  if (percentage >= 85) return 'medium';
  return 'low';
}

// Render errors as a table
function renderErrorsTable(errors: MatchError[]): string {
  const errorCount = errors.length;
  const errorLabel = errorCount === 1 ? t('results_mismatch_singular') : t('results_mismatch_plural');

  const errorRows = errors.map(err => `
    <tr>
      <td class="error-line">${err.line === 0 ? '' : err.line}</td>
      <td class="error-position">${err.line === 0 || err.position === -1 ? '' : err.position}</td>
      <td class="error-expected">${err.expected}</td>
      <td class="error-actual">${err.actual}</td>
      <td class="error-description">${err.mismatchDescription}${err.remarks ? `<br><em>${err.remarks}</em>` : ''}</td>
    </tr>
  `).join('');

  return `
    <div class="errors-section">
      <h4 class="errors-header">⚠ ${errorLabel} (${errorCount})</h4>
      <div class="errors-table-wrapper">
        <table class="errors-table">
          <thead>
            <tr>
              <th>${t('results_line')}</th>
              <th>${t('results_position')}</th>
              <th>${t('results_expected')}</th>
              <th>${t('results_actual')}</th>
              <th>${t('results_description')}</th>
            </tr>
          </thead>
          <tbody>
            ${errorRows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

let resultActionController: AbortController | null = null;

function attachResultActionHandlers(container: HTMLElement, ruleSet?: string): void {
  if (resultActionController) {
    resultActionController.abort();
  }
  resultActionController = new AbortController();

  container.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const addExampleBtn = target.closest('.btn-add-example') as HTMLElement | null;
    const submitGithubBtn = target.closest('.btn-submit-github') as HTMLElement | null;
    const addCollectionBtn = target.closest('.btn-add-collection') as HTMLElement | null;

    if (addExampleBtn) {
      await handleAddToExamples(addExampleBtn);
    } else if (submitGithubBtn) {
      await handleSubmitToGitHub(submitGithubBtn, ruleSet);
    } else if (addCollectionBtn) {
      await handleAddToCollection(addCollectionBtn, ruleSet);
    }
  }, { signal: resultActionController.signal });
}

async function handleAddToExamples(button: HTMLElement): Promise<void> {
  const ruleId = button.getAttribute('data-rule-id');
  if (!ruleId) return;

  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  const poemText = editor?.value?.trim();
  if (!poemText) return;

  const done = analyticsService.startTimedEvent('example_added', { ruleId, source: 'results' });
  const { customRulesService } = await import('../services/storage/custom-rules-service');
  const added = await customRulesService.addExampleToRule(ruleId, poemText);

  if (added) {
    const exampleCount = (await customRulesService.getCustomRule(ruleId))?.Examples.length ?? 0;
    button.textContent = t('results_example_added');
    button.classList.add('btn-success');
    button.setAttribute('disabled', 'true');
    done({ exampleCount });
  } else {
    button.textContent = t('results_example_duplicate');
    button.classList.add('btn-warning');
    button.setAttribute('disabled', 'true');
    const dupDone = analyticsService.startTimedEvent('example_duplicate', { ruleId });
    dupDone();
  }
}

async function handleSubmitToGitHub(button: HTMLElement, ruleSet?: string): Promise<void> {
  const ruleId = button.getAttribute('data-rule-id') || '';
  const ruleName = button.getAttribute('data-rule-name') || '';
  const ruleSetId = button.getAttribute('data-rule-set') || ruleSet || '';

  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  const poemText = editor?.value?.trim() || '';

  if (ruleId.startsWith('custom-')) {
    const { customRulesService } = await import('../services/storage/custom-rules-service');
    const ruleDto = await customRulesService.getCustomRule(ruleId);
    if (!ruleDto) return;

    const ruleInfo = await WasmBridge.getRuleInfo(ruleId);
    const description = ruleInfo?.description ? stripHtmlToText(ruleInfo.description) : '';
    const examples = [...ruleDto.Examples];
    if (poemText && !examples.includes(poemText)) {
      examples.push(poemText);
    }

    const payload = buildCustomRulePayload(
      ruleName, ruleId, ruleDto.Language, description, ruleDto, examples
    );
    submitToGitHub(payload, 'results');
  } else {
    const examples = poemText ? [poemText] : [];
    const payload = buildExamplePayload(ruleName, ruleSetId, ruleId, examples);
    submitToGitHub(payload, 'results');
  }
}

async function handleAddToCollection(button: HTMLElement, ruleSet?: string): Promise<void> {
  const ruleId = button.getAttribute('data-rule-id') || '';
  const ruleName = button.getAttribute('data-rule-name') || '';
  const ruleSetId = button.getAttribute('data-rule-set') || ruleSet || '';

  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  const poemText = editor?.value?.trim();
  if (!poemText) return;

  // Get beautified from the stored match data
  const match = renderedMatches.get(ruleId);
  const beautified = match?.beautified || '';

  const result = await collectionService.addPoem(ruleSetId, ruleId, ruleName, poemText, beautified);

  if (result === 'added') {
    button.textContent = t('results_added_to_collection');
    button.classList.add('btn-success');
    button.setAttribute('disabled', 'true');
    analyticsService.trackEvent('poem_collected', { ruleId, ruleSet: ruleSetId });
  } else if (result === 'duplicate') {
    button.textContent = t('results_already_in_collection');
    button.classList.add('btn-warning');
    button.setAttribute('disabled', 'true');
  } else {
    button.textContent = t('results_collection_full');
    button.classList.add('btn-warning');
    button.setAttribute('disabled', 'true');
  }
}

// Render lightweight score cards for alternative matches
export function renderScoreCards(scores: ChandamScore[], containerId: string, ruleSet?: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const cardsHtml = scores.map(score => {
    const level = getScoreLevel(score.matchPercentage);
    const learnLink = ruleSet
      ? `<a href="${makeUrl(`/learn/${ruleSet}/${score.identifier}/`)}" class="score-card-link">${score.name}</a>`
      : `<span class="score-card-name">${score.name}</span>`;
    const computeBtn = ruleSet
      ? `<button class="score-card-try" data-rule-id="${score.identifier}" data-rule-name="${score.name}" title="${t('link_try')}">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
        </button>`
      : '';

    return `
      <div class="score-card">
        <div class="score-card-info">
          ${learnLink}
        </div>
        <div class="score-card-bar-group">
          <div class="score-card-bar">
            <div class="score-card-bar-fill score-bar-${level}" style="width: ${score.matchPercentage}%"></div>
          </div>
          <span class="score-card-percent match-score-${level}">${score.matchPercentage}%</span>
          ${computeBtn}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="score-cards-section">
      <h4 class="score-cards-heading">${t('results_alternatives')}</h4>
      ${cardsHtml}
    </div>
  `;
}

// Hide results section
export function hideResults() {
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }

  const container = document.getElementById('results-container');
  if (container) container.innerHTML = '';

  const scoreCards = document.getElementById('score-cards-container');
  if (scoreCards) scoreCards.innerHTML = '';
}

export function clearResults() {
  const container = document.getElementById('results-container');
  if (container) container.innerHTML = '';
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Track analysis result in Google Analytics
 * Tracks both regular results and perfect matches (100%) with content hash
 */
async function trackAnalysisResult(match: ChandamMatch) {
  // Track analysis result with basic metrics
  analyticsService.trackEvent('analysis_result', {
    ruleId: match.rule.identifier,
    matchPercentage: match.matchPercentage,
    score: match.score,
    total: match.total
  });

  // Track perfect match with content hash
  if (match.matchPercentage === 100) {
    try {
      // Get poem text from editor
      const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
      const poemText = editor?.value || '';

      if (poemText) {
        // Generate short hash (first 64 bits)
        const contentHash = await generateShortHash(match.rule.identifier, poemText);

        analyticsService.trackEvent('perfect_match', {
          ruleId: match.rule.identifier,
          contentHash
        });
      }
    } catch (err) {
      console.error('Failed to track perfect match:', err);
    }
  }
}
