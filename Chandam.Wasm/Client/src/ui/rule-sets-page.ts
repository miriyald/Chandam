import { RULE_SETS } from '../config';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildStaticPageBreadcrumbs } from './breadcrumbs';
import { storageService } from '../services/storage/storage-service';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { MAX_FAVORITES, MAX_CUSTOM_RULES } from '../constants';

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
    maxCount: crs.type === 'favorites' ? MAX_FAVORITES : MAX_CUSTOM_RULES,
    exampleCount: crs.rules.reduce((sum, r) => sum + (r.Examples?.length ?? 0), 0),
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
        ${customRulesCollection && customRulesCollection.rules.length > 0 ? renderCustomRulesCard({ ...customRulesCollection, maxCount: MAX_CUSTOM_RULES }) : ''}
        <a href="${makeUrl('/create-rule')}" class="rule-set-card create-rule-card">
          <div class="create-rule-icon">
            <span class="material-symbols-outlined" style="font-size:32px" aria-hidden="true">add</span>
          </div>
          <h2>${t('custom_rules_btn_create')}</h2>
        </a>
      </div>
    </div>
  `;
}

// Helper: Render a single rule set card
export function renderRuleSetCard(ruleSet: { id: string; name: string; description: string; ruleCount: number; maxCount?: number; exampleCount?: number; isCustom?: boolean; isFavorites?: boolean }) {
  const customClass = ruleSet.isCustom ? ' custom-ruleset' : '';
  const favoritesClass = ruleSet.isFavorites ? ' favorites-ruleset' : '';
  const examplesHtml = ruleSet.exampleCount
    ? ` · ${ruleSet.exampleCount} ${t('rulesets_examples_suffix')}`
    : '';
  const countDisplay = ruleSet.maxCount
    ? `${ruleSet.ruleCount}/${ruleSet.maxCount}`
    : `${ruleSet.ruleCount}`;

  return `
    <div class="rule-set-card${customClass}${favoritesClass}">
      <h2 class="meter-name">${ruleSet.name}</h2>
      <div class="rule-count">${countDisplay} ${t('rulesets_rules_suffix')}${examplesHtml}</div>
      <p class="description">${ruleSet.description}</p>
      <div class="card-actions">
        <a href="${makeUrl(`/compute/${ruleSet.id}/`)}" class="btn-analyze">
          <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">play_arrow</span>
          ${t('rulesets_btn_analyze')}
        </a>
        <a href="${makeUrl(`/learn/${ruleSet.id}/`)}" class="btn-learn">
          <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">menu_book</span>
          ${t('rulesets_btn_learn')}
        </a>
      </div>
    </div>
  `;
}

// Helper: Render custom rules collection card with distinct styling
export function renderCustomRulesCard(collection: { id: string; name: string; description: string; rules: any[]; maxCount?: number }) {
  const countDisplay = collection.maxCount
    ? `${collection.rules.length}/${collection.maxCount}`
    : `${collection.rules.length}`;
  return `
    <div class="rule-set-card custom-rules-card">
      <h2 class="meter-name">${t('custom_rules_title')}</h2>
      <div class="rule-count">${countDisplay} ${t('label_rules_count')}</div>
      <p class="description">${collection.description}</p>
      <div class="card-actions">
        <a href="${makeUrl(`/compute/${collection.id}/`)}" class="btn-analyze">
          <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">play_arrow</span>
          ${t('mode_compute')}
        </a>
        <a href="${makeUrl(`/learn/${collection.id}/`)}" class="btn-learn">
          <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">menu_book</span>
          ${t('mode_learn')}
        </a>
      </div>
    </div>
  `;
}
