import { RULE_SETS } from '../config';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildStaticPageBreadcrumbs } from './breadcrumbs';
import { storageService } from '../services/storage/storage-service';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';

// Main function: Render rule sets page
export async function renderRuleSetsPage() {
  setPageTitle(t('rulesets_page_title'));

  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildStaticPageBreadcrumbs(t('rulesets_page_title'));

  // Load custom rulesets from IndexedDB
  const { customRulesService } = await import('../services/storage/custom-rules-service');
  const customRulesets = await customRulesService.getAllCustomRulesets();

  // Filter: only show favorites if it has rules, and separate custom-rules
  const customRulesetsWithData = customRulesets.filter(rs =>
    (rs.type === 'favorites' && rs.rules.length > 0) ||
    (rs.type === 'custom' && rs.id !== 'custom-rules')
  );

  // Get the main custom-rules collection separately
  const customRulesCollection = customRulesets.find(rs => rs.id === 'custom-rules');

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

      <h1>${t('rulesets_heading')}</h1>
      <p class="subtitle">${t('rulesets_subtitle')}</p>

      <div class="rule-set-cards">
        ${allRuleSets.map(rs => renderRuleSetCard(rs)).join('')}
        ${customRulesCollection && customRulesCollection.rules.length > 0 ? renderCustomRulesCard(customRulesCollection) : ''}
        <a href="${makeUrl('/create-rule')}" class="rule-set-card create-rule-card">
          <div class="create-rule-icon">
            <svg viewBox="0 0 24 24" width="32" height="32"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          </div>
          <h2>${t('custom_rules_btn_create')}</h2>
        </a>
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
      <div class="rule-count">${ruleSet.ruleCount} ${t('rulesets_rules_suffix')}</div>
      <p class="description">${ruleSet.description}</p>
      <div class="card-actions">
        <a href="${makeUrl(`/compute/${ruleSet.id}/`)}" class="btn-analyze">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
          ${t('rulesets_btn_analyze')}
        </a>
        <a href="${makeUrl(`/learn/${ruleSet.id}/`)}" class="btn-learn">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
          ${t('rulesets_btn_learn')}
        </a>
      </div>
    </div>
  `;
}

// Helper: Render custom rules collection card with distinct styling
function renderCustomRulesCard(collection: { id: string; name: string; description: string; rules: any[] }) {
  return `
    <div class="rule-set-card custom-rules-card">
      <h2 class="meter-name">${t('custom_rules_title')}</h2>
      <div class="rule-count">${collection.rules.length} ${t('label_rules_count')}</div>
      <p class="description">${collection.description}</p>
      <div class="card-actions">
        <a href="${makeUrl(`/compute/${collection.id}/`)}" class="btn-analyze">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
          ${t('mode_compute')}
        </a>
        <a href="${makeUrl(`/learn/${collection.id}/`)}" class="btn-learn">
          <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
          ${t('mode_learn')}
        </a>
      </div>
    </div>
  `;
}
