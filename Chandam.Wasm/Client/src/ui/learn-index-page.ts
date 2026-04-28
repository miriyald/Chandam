import { WasmBridge } from '../wasm-bridge';
import { getRuleSet, getRuleSetAsync } from '../config';
import type { RuleSummaryDetailed, AvailableFilters } from '../types';
import { groupRulesByCategory, getSortedGroupKeys, getGroupDisplayName } from '../utils/rule-grouping';
import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildRuleSetBreadcrumbs } from './breadcrumbs';
import { renderModeSwitcher } from './mode-switcher';
import { loadRuleSet } from '../utils/rule-loader';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { CustomRulesLoader } from '../services/custom-rules-loader';
import { storageService } from '../services/storage/storage-service';
import { customRulesService } from '../services/storage/custom-rules-service';
import { favoritesService } from '../services/storage/favorites-service';
import { analyticsService } from '../services/analytics-service';

interface FilterState {
  searchText: string;
  selectedCategory: string;
}

let currentFilterState: FilterState = {
  searchText: '',
  selectedCategory: '',
};

let currentFilters: AvailableFilters | null = null;
let allRulesCount = 0;

// Main function: Render learn index page
export async function renderLearnIndexPage(ruleSet: string) {
  // Step 1: Validate and load rule set (supports both predefined and custom)
  const ruleSetConfig = await getRuleSetAsync(ruleSet);
  if (!ruleSetConfig) {
    console.error(`Rule set not found: ${ruleSet}`);
    return;
  }

  setPageTitle('Learn ' + ruleSetConfig.name);

  // Step 2: Load rules based on type
  if (ruleSetConfig.rulesFile) {
    // Predefined ruleset - load from files
    await loadRuleSet(ruleSetConfig.rulesFile, ruleSetConfig.examplesFile);
  } else {
    // Custom ruleset - load from IndexedDB
    await CustomRulesLoader.loadCustomRuleset(ruleSet);
  }

  // Step 3: Get all rules with detailed metadata
  const rules = await WasmBridge.getAllRulesDetailed('te');
  allRulesCount = rules.length;

  // Step 3b: Get available filter values (no counts - faster!)
  currentFilters = await WasmBridge.getAvailableFilters('te');

  // Step 3c: Load favorite identifiers from browser storage
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

  // Step 4: Apply filters and group results
  const filteredRules = await applyFilters(rules);
  const grouped = groupRulesByCategory(filteredRules);

  // Step 5: Render page HTML with filters and favorite status
  renderLearnIndexPageHtml(ruleSetConfig.name, filteredRules.length, ruleSet, grouped, favoriteIds);
}

async function applyFilters(allRules: RuleSummaryDetailed[]): Promise<RuleSummaryDetailed[]> {
  if (currentFilterState.searchText === '' && currentFilterState.selectedCategory === '') {
    return allRules;
  }

  return await WasmBridge.searchRules({
    query: currentFilterState.searchText || undefined,
    categories: currentFilterState.selectedCategory ? [currentFilterState.selectedCategory] : undefined,
    maxResults: 0
  }, 'te');
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

  const hasResults = ruleCount > 0;
  const resultsSection = hasResults
    ? `<div class="chandam-groups">${renderChandamGroups(grouped, ruleSetId, favoriteIds)}</div>`
    : `<div class="empty-state">
         <p>${t('filter_no_results')}</p>
         <p>${t('filter_try_removing')}</p>
       </div>`;

  content.innerHTML = `
    <div class="learn-index-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="page-header-controls">
        <h1>${ruleSetName}</h1>
        ${renderModeSwitcher({ ruleSetId, currentMode: 'learn' })}
      </div>
      <div class="filter-bar">
        <div class="filter-bar-row">
          <input
            type="text"
            class="filter-search"
            placeholder="${t('filter_search_placeholder')}"
            value="${currentFilterState.searchText}"
            data-filter="search"
          />
          ${renderCategoryDropdown()}
          <span class="rule-count">${ruleCount} ${t('filter_of')} ${allRulesCount}</span>
          <button class="btn-clear-filters" data-action="clear-filters">${t('editor_btn_clear')}</button>
        </div>
      </div>

      <div class="rules-content">
        ${resultsSection}
      </div>
    </div>
  `;

  // Attach event listeners after rendering
  attachFilterEventListeners(ruleSetId);
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

// Map English category names to Telugu (all 12 PadyamSubType values)
function getTeluguCategoryName(englishCategory: string): string {
  const categoryMap: Record<string, string> = {
    'Akkara': 'అక్కరలు',
    'Divpada': 'ద్విపదలు',
    'Jati': 'జాతి',
    'Ragada': 'రగడలు',
    'Ragada2': 'రగడలు (2)',
    'Shatpada': 'షట్పదలు',
    'UpaJati': 'ఉపజాతి',
    'Sisamu': 'సీసములు',
    'Vruttam': 'వృత్తం',
    'DaMDakamu': 'దండకము',
    'ArdhaVruttam': 'అర్ధ సమవృత్తం',
    'VishamaVruttam': 'విషమవృత్తం'
  };
  return categoryMap[englishCategory] || englishCategory;
}

function renderCategoryDropdown(): string {
  if (!currentFilters) return '';

  const allLabel = t('filter_all_categories');
  const selectedLabel = currentFilterState.selectedCategory
    ? getTeluguCategoryName(currentFilterState.selectedCategory)
    : allLabel;

  const items = currentFilters.categories.map(cat =>
    `<div class="rule-item" data-value="${cat}">${getTeluguCategoryName(cat)}</div>`
  ).join('');

  return `
    <details class="rule-picker-inline" id="category-picker">
      <summary id="selected-category-name">${selectedLabel} ▼</summary>
      <div class="picker-dropdown">
        <div class="rule-list">
          <div class="rule-item" data-value="">${allLabel}</div>
          ${items}
        </div>
      </div>
    </details>
  `;
}

function attachFilterEventListeners(ruleSetId: string) {
  const searchInput = document.querySelector('.filter-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e: Event) => {
      currentFilterState.searchText = (e.target as HTMLInputElement).value;
      await refreshResults(ruleSetId);
    }, 300));
  }

  const categoryPicker = document.getElementById('category-picker') as HTMLDetailsElement;
  if (categoryPicker) {
    categoryPicker.querySelectorAll('.rule-item').forEach(item => {
      item.addEventListener('click', async () => {
        const value = (item as HTMLElement).dataset.value || '';
        currentFilterState.selectedCategory = value;
        const summary = document.getElementById('selected-category-name');
        if (summary) {
          summary.textContent = (value ? getTeluguCategoryName(value) : t('filter_all_categories')) + ' ▼';
        }
        categoryPicker.open = false;
        await refreshResults(ruleSetId);
      });
    });

    document.addEventListener('click', (e) => {
      if (categoryPicker.open && !categoryPicker.contains(e.target as Node)) {
        categoryPicker.open = false;
      }
    });
  }

  const clearButton = document.querySelector('[data-action="clear-filters"]');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      currentFilterState = { searchText: '', selectedCategory: '' };
      await refreshResults(ruleSetId);
    });
  }
}

// Refresh results after filter change
async function refreshResults(ruleSetId: string) {
  await renderLearnIndexPage(ruleSetId);
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
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
