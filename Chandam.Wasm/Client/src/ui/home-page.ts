import { RULE_SETS } from '../config';

// Main function: Render homepage with rule set cards
export function renderHomePage() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="home-page">
      <h1>ఛందం - Telugu Poetry Meter Analysis</h1>
      <p class="subtitle">Select a rule set to begin analyzing or learning about Telugu poetry meters</p>

      <div class="rule-set-cards">
        ${RULE_SETS.map(ruleSet => renderRuleSetCard(ruleSet)).join('')}
      </div>
    </div>
  `;
}

// Helper: Render a single rule set card
function renderRuleSetCard(ruleSet: { id: string; name: string; description: string; sizeKB: number }) {
  const ruleCount = getRuleCount(ruleSet.id);

  return `
    <div class="rule-set-card">
      <h2 class="meter-name">${ruleSet.name}</h2>
      <div class="rule-count">${ruleCount} Rules</div>
      <p class="description">${ruleSet.description}</p>
      <div class="card-actions">
        <a href="/compute/${ruleSet.id}/" class="btn-analyze">✏️ Analyze</a>
        <a href="/learn/${ruleSet.id}/" class="btn-learn">📖 Learn</a>
      </div>
    </div>
  `;
}

// Helper: Get rule count for a rule set
function getRuleCount(ruleSetId: string): number {
  // Hardcoded counts - could be fetched dynamically if needed
  const counts: Record<string, number> = {
    'frequent': 14,
    'complete': 379
  };
  return counts[ruleSetId] || 0;
}
