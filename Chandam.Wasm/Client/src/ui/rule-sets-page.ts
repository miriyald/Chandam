import { RULE_SETS } from '../config';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildStaticPageBreadcrumbs } from './breadcrumbs';
import { storageService } from '../services/storage/storage-service';

// Main function: Render rule sets page
export async function renderRuleSetsPage() {
  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildStaticPageBreadcrumbs('Rule Sets');

  // Load custom rulesets from IndexedDB
  await storageService.init();
  const customRulesets = await storageService.indexedDB.getAllCustomRulesets();

  // Filter: only show favorites if it has rules
  const customRulesetsWithData = customRulesets.filter(rs =>
    rs.type !== 'favorites' || rs.rules.length > 0
  );

  // Convert custom rulesets to display format
  const customAsRuleSet = customRulesetsWithData.map(crs => ({
    id: crs.id,
    name: crs.name,
    description: crs.description,
    ruleCount: crs.rules.length,
    isCustom: true,
    isFavorites: crs.type === 'favorites'
  }));

  // Merge predefined and custom rulesets
  const allRuleSets = [...RULE_SETS, ...customAsRuleSet];

  content.innerHTML = `
    <div class="rule-sets-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <h1>Telugu Poetry Meter Rule Sets</h1>
      <p class="subtitle">Choose a rule set to analyze poetry or learn about meters</p>

      <div class="rule-set-cards">
        ${allRuleSets.map(rs => renderRuleSetCard(rs)).join('')}
      </div>
    </div>
  `;
}

// Helper: Render a single rule set card
function renderRuleSetCard(ruleSet: { id: string; name: string; description: string; ruleCount: number; isCustom?: boolean; isFavorites?: boolean }) {
  const customClass = ruleSet.isCustom ? ' custom-ruleset' : '';
  const favoritesClass = ruleSet.isFavorites ? ' favorites-ruleset' : '';

  return `
    <div class="rule-set-card${customClass}${favoritesClass}">
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
