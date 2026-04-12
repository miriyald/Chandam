import { RULE_SETS } from '../config';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildStaticPageBreadcrumbs } from './breadcrumbs';

// Main function: Render rule sets page
export function renderRuleSetsPage() {
  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildStaticPageBreadcrumbs('Rule Sets');

  content.innerHTML = `
    <div class="rule-sets-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <h1>Telugu Poetry Meter Rule Sets</h1>
      <p class="subtitle">Choose a rule set to analyze poetry or learn about meters</p>

      <div class="rule-set-cards">
        ${RULE_SETS.map(rs => renderRuleSetCard(rs)).join('')}
      </div>
    </div>
  `;
}

// Helper: Render a single rule set card
function renderRuleSetCard(ruleSet: { id: string; name: string; description: string; ruleCount: number }) {
  return `
    <div class="rule-set-card">
      <h2 class="meter-name">${ruleSet.name}</h2>
      <div class="rule-count">${ruleSet.ruleCount} Rules</div>
      <p class="description">${ruleSet.description}</p>
      <div class="card-actions">
        <a href="${makeUrl(`/compute/${ruleSet.id}/`)}" class="btn-analyze">✏️ Analyze</a>
        <a href="${makeUrl(`/learn/${ruleSet.id}/`)}" class="btn-learn">📖 Learn</a>
      </div>
    </div>
  `;
}
