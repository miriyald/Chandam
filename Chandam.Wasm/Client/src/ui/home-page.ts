import { RULE_SETS } from '../config';
import { makeUrl } from '../utils/url-helpers';
import { t } from '../i18n';

// Main function: Render homepage with rule set cards
export function renderHomePage() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="home-page">
      <h1>${t('home_title')}</h1>
      <p class="subtitle">${t('home_subtitle')}</p>

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
      <div class="rule-count">${ruleCount} ${t('label_rules_count')}</div>
      <p class="description">${ruleSet.description}</p>
      <div class="card-actions">
        <a href="${makeUrl(`/compute/${ruleSet.id}/`)}" class="btn-analyze">${t('home_btn_analyze')}</a>
        <a href="${makeUrl(`/learn/${ruleSet.id}/`)}" class="btn-learn">${t('home_btn_learn')}</a>
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
