import type { ChandamMatch, MatchError } from '../types';
import { openAccordion } from './accordion';
import { makeUrl } from '../utils/url-helpers';
import { t } from '../i18n';
import { analyticsService } from '../services/analytics-service';
import { generateShortHash } from '../utils/hash-utils';

export async function renderResults(matches: ChandamMatch[], containerId: string, ruleSet?: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = matches.map(match => renderMatchCard(match, ruleSet)).join('');

  // Auto-open results section
  openAccordion('results-section');

  // Track each result
  for (const match of matches) {
    await trackAnalysisResult(match);
  }
}

// Render only the first (best) match
export async function renderFirstMatch(match: ChandamMatch, containerId: string, ruleSet?: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = renderMatchCard(match, ruleSet);

  // Show results section
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }

  // Track analysis result
  await trackAnalysisResult(match);
}

// Render a single match card with split-view layout
function renderMatchCard(match: ChandamMatch, ruleSet?: string): string {
  // Determine status styling
  const statusClass = match.isMatched ? 'match-success' : 'match-failure';
  const statusIcon = match.isMatched ? '✓' : '✗';

  // Only show score if < 100%
  const scoreHtml = match.matchPercentage < 100
    ? `<span class="match-score match-score-${getScoreLevel(match.matchPercentage)}">${match.matchPercentage}%</span>`
    : '';

  // Generate rule details link (opens in new tab)
  const ruleLink = ruleSet && match.rule.identifier
    ? `<a href="${makeUrl(`/learn/${ruleSet}/${match.rule.identifier}/`)}" class="rule-details-link" target="_blank" rel="noopener noreferrer">${t('results_view_details')}</a>`
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
            ${match.beautified}
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

  return `
    <div class="match-card ${statusClass}">
      <div class="match-header">
        <div class="match-title-group">
          <span class="match-icon">${statusIcon}</span>
          <h3 class="meter-name">${match.rule.name}</h3>
          ${scoreHtml}
        </div>
        ${ruleLink}
      </div>
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
      <td class="error-line">${err.line}</td>
      <td class="error-position">${err.position}</td>
      <td class="error-type">${err.mismatchType}</td>
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
              <th>${t('results_type')}</th>
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

// Hide results section
export function hideResults() {
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'none';
  }

  const container = document.getElementById('results-container');
  if (container) container.innerHTML = '';
}

export function clearResults() {
  const container = document.getElementById('results-container');
  if (container) container.innerHTML = '';
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
