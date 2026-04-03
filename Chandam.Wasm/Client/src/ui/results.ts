import type { ChandamMatch, MatchError } from '../types';
import { openAccordion } from './accordion';

export function renderResults(matches: ChandamMatch[], containerId: string, ruleSet?: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = matches.map(match => renderMatchCard(match, ruleSet)).join('');

  // Auto-open results section
  openAccordion('results-section');
}

// Render only the first (best) match
export function renderFirstMatch(match: ChandamMatch, containerId: string, ruleSet?: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = renderMatchCard(match, ruleSet);

  // Show results section
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }
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
    ? `<a href="/learn/${ruleSet}/${match.rule.identifier}/" class="rule-details-link" target="_blank" rel="noopener noreferrer">View Rule Details ↗</a>`
    : '';

  // Enhanced error display (table format)
  const errorsHtml = (match.errors && match.errors.length > 0)
    ? renderErrorsTable(match.errors)
    : '';

  // Split view: table on left, errors on right (desktop), stacked (mobile)
  const hasErrors = match.errors && match.errors.length > 0;
  const layoutClass = hasErrors ? 'match-body-split' : 'match-body-full';

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

      <div class="${layoutClass}">
        <div class="match-table-container">
          ${match.renderedHtml || ''}
        </div>

        ${hasErrors ? `<div class="match-errors-container">${errorsHtml}</div>` : ''}
      </div>
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
  const errorLabel = errorCount === 1 ? 'Mismatch' : 'Mismatches';

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
              <th>Line</th>
              <th>Pos</th>
              <th>Type</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Description</th>
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
