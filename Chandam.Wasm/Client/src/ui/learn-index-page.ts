import { WasmBridge } from '../wasm-bridge';
import { getRuleSet, getRuleSetAsync } from '../config';
import type { RuleSummaryDetailed } from '../types';
import { groupRulesByCategory, getSortedGroupKeys, getGroupDisplayName } from '../utils/rule-grouping';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildRuleSetBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import { storageService } from '../services/storage/storage-service';
import { customRulesService } from '../services/storage/custom-rules-service';
import { favoritesService } from '../services/storage/favorites-service';
import { analyticsService } from '../services/analytics-service';

// Main function: Render learn index page
export async function renderLearnIndexPage(ruleSet: string) {
  // Step 1: Validate and load rule set (supports both predefined and custom)
  const ruleSetConfig = await getRuleSetAsync(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  // Step 2: Load rules based on type
  if (ruleSetConfig.rulesFile) {
    // Predefined ruleset - load from files
    await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);
  } else {
    // Custom ruleset - load from IndexedDB
    await CustomRulesLoader.loadCustomRuleset(ruleSet);
  }

  // Step 3: Get all rules with detailed metadata
  const rules = await WasmBridge.getAllRulesDetailed();

  // Step 3b: Load favorite identifiers from browser storage
  await storageService.init();
  const allFavorites = await storageService.indexedDB.getAllFavorites();

  // Create Set of composite IDs for O(1) lookup
  // IMPORTANT: Filter to only favorites from THIS ruleset
  // Composite ID format: "ruleSetId:ruleId" (e.g., "frequent:iMdravajramu")
  const favoriteIds = new Set(
    allFavorites
      .filter(fav => fav.ruleSetId === ruleSet)  // Only this ruleset's favorites
      .map(fav => fav.id)
  );

  // Step 4: Group rules by category using shared utility
  const grouped = groupRulesByCategory(rules);

  // Step 5: Render page HTML with favorite status
  renderLearnIndexPageHtml(ruleSetConfig.name, rules.length, ruleSet, grouped, favoriteIds);
}

// Helper: Render page HTML
function renderLearnIndexPageHtml(
  ruleSetName: string,
  ruleCount: number,
  ruleSetId: string,
  grouped: Map<string, RuleSummaryDetailed[]>,
  favoriteIds: Set<string>
) {
  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildRuleSetBreadcrumbs(ruleSetId, 'learn');

  content.innerHTML = `
    <div class="learn-index-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <h1>${t('learn_title_prefix')} ${ruleSetName}</h1>
      <div class="rule-count">${ruleCount} ${t('label_rules_count')}</div>

      ${renderModeSwitcher({ ruleSetId, currentMode: 'learn' })}

      <div class="chandam-groups">
        ${renderChandamGroups(grouped, ruleSetId, favoriteIds)}
      </div>
    </div>
  `;
}

// Helper: Render all chandam groups
function renderChandamGroups(
  grouped: Map<string, RuleSummaryDetailed[]>,
  ruleSetId: string,
  favoriteIds: Set<string>
): string {
  const sortedKeys = getSortedGroupKeys(grouped);

  return sortedKeys.map(groupKey => {
    const rules = grouped.get(groupKey)!;
    return `
      <div class="chandam-group">
        <h2>${getGroupDisplayName(groupKey, grouped)}</h2>
        ${rules.map(rule => renderRuleListItem(rule, ruleSetId, favoriteIds)).join('')}
      </div>
    `;
  }).join('');
}


// Helper: Render a single rule list item
function renderRuleListItem(rule: RuleSummaryDetailed, ruleSetId: string, favoriteIds: Set<string>): string {
  const metadata = [];

  // Show char length range (if available and not -1)
  if (rule.min && rule.max && rule.min !== -1 && rule.max !== -1) {
    if (rule.min === rule.max) {
      metadata.push(`${rule.min} ${t('metric_chars')}`);
    } else {
      metadata.push(`${rule.min}-${rule.max} ${t('metric_chars')}`);
    }
  } else if (rule.charLength && rule.charLength !== -1) {
    metadata.push(`${rule.charLength} ${t('metric_chars')}`);
  }

  // Show matra length (if available and not -1)
  if (rule.matraLength && rule.matraLength !== -1) {
    metadata.push(`${rule.matraLength} matras`);
  }

  // Don't show frequency (removed per user request)

  // Check if this rule is favorited
  const compositeId = `${ruleSetId}:${rule.identifier}`;
  const isFavorited = favoriteIds.has(compositeId);
  const favoritedClass = isFavorited ? ' favorited' : '';

  // Show delete button for ANY custom rule (identified by "custom-" prefix)
  // This allows deletion from both /learn/custom-rules/ and /learn/custom-fav/ views
  const isCustomRule = rule.identifier.startsWith('custom-');
  const showDelete = isCustomRule;
  const deleteButton = showDelete
    ? `<button class="btn-delete-inline" data-rule-id="${rule.identifier}" onclick="handleDeleteFromList('${rule.identifier}', '${rule.name.replace(/'/g, "\\'")}')">Delete</button>`
    : '';

  return `
    <div class="rule-list-item${favoritedClass}">
      <div class="rule-name meter-name">${rule.name}</div>
      <div class="rule-meta">${metadata.join(' | ')}</div>
      <div class="rule-links">
        <a href="${makeUrl(`/learn/${ruleSetId}/${rule.identifier}`)}">Learn</a>
        <a href="${makeUrl(`/compute/${ruleSetId}/${rule.identifier}`)}">Try</a>
        ${deleteButton}
      </div>
    </div>
  `;
}

// Global delete handler for inline delete buttons
(window as any).handleDeleteFromList = async function(ruleId: string, ruleName: string) {
  const confirmed = confirm(
    `Are you sure you want to delete "${ruleName}"? This action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  try {
    // Delete the rule
    await customRulesService.deleteCustomRule(ruleId);

    // Also remove from favorites if it exists
    const isFavorited = await favoritesService.isFavorited('custom-rules', ruleId);
    if (isFavorited) {
      const ruleData = await WasmBridge.getRuleInfo(ruleId);
      await favoritesService.toggleFavorite('custom-rules', ruleId, ruleData);
    }

    // Track deletion
    analyticsService.trackEvent('custom_rule_deleted', {
      ruleId: ruleId,
      source: 'index_page'
    });

    // Reload the page to show updated list
    window.location.reload();

  } catch (error) {
    console.error('Failed to delete rule:', error);
    alert('Failed to delete rule. Please try again.');
  }
};
