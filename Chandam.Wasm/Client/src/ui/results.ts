import type { ChandamMatch } from '../types';
import { openAccordion } from './accordion';

export function renderResults(matches: ChandamMatch[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = matches.map(match => `
    <div class="match-card ${match.isMatched ? 'match-success' : 'match-failure'}">
      <h3>${match.rule.name} (${match.matchPercentage}%)</h3>
      <p>${match.rule.description}</p>
      ${match.renderedHtml || ''}
      ${match.errors && match.errors.length > 0 ? `
        <div class="errors">
          <h4>Mismatches:</h4>
          <ul>
            ${match.errors.map(e => `<li>Line ${e.line}: ${e.mismatchDescription}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('');

  // Auto-open results section
  openAccordion('results-section');
}

// Render only the first (best) match
export function renderFirstMatch(match: ChandamMatch, containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="match-card ${match.isMatched ? 'match-success' : 'match-failure'}">
      <h3>${match.rule.name} (${match.matchPercentage}%)</h3>
      <p>${match.rule.description}</p>
      ${match.renderedHtml || ''}
      ${match.errors && match.errors.length > 0 ? `
        <div class="errors">
          <h4>Mismatches:</h4>
          <ul>
            ${match.errors.map(e => `<li>Line ${e.line}: ${e.mismatchDescription}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `;

  // Show results section
  const resultsSection = document.getElementById('results-section');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }
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
