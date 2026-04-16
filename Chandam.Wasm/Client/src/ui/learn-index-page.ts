import { WasmBridge } from '../wasm-bridge';
import { getRuleSet, getRuleSetAsync } from '../config';
import type { RuleSummaryDetailed, FacetCounts } from '../types';
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

// Filter state
interface FilterState {
  searchText: string;
  selectedTypes: Set<string>;           // Now maps to Categories (PadyamSubType)
  selectedChandamNames: Set<string>;    // New: ChandamName filter for Vruttam
  matraLengthMin: number | null;
  matraLengthMax: number | null;
  hasExamples: boolean | null;
}

let currentFilterState: FilterState = {
  searchText: '',
  selectedTypes: new Set(),
  selectedChandamNames: new Set(),
  matraLengthMin: null,
  matraLengthMax: null,
  hasExamples: null
};

let currentFacets: FacetCounts | null = null;
let allRulesCount = 0;

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

  // Step 3: Get all rules with detailed metadata and facets (OPTIMIZED - single call)
  const { rules, facets } = await WasmBridge.getRulesWithFacets('te');
  allRulesCount = rules.length;
  currentFacets = facets;

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

  // Step 4: Apply filters and group results
  const filteredRules = await applyFilters(rules);
  const grouped = groupRulesByCategory(filteredRules);

  // Step 5: Render page HTML with filters and favorite status
  renderLearnIndexPageHtml(ruleSetConfig.name, filteredRules.length, ruleSet, grouped, favoriteIds);
}

// Apply current filters using server-side search
async function applyFilters(allRules: RuleSummaryDetailed[]): Promise<RuleSummaryDetailed[]> {
  // If no filters active, return all rules
  if (currentFilterState.searchText === '' &&
      currentFilterState.selectedTypes.size === 0 &&
      currentFilterState.selectedChandamNames.size === 0 &&
      currentFilterState.matraLengthMin === null &&
      currentFilterState.matraLengthMax === null &&
      currentFilterState.hasExamples === null) {
    return allRules;
  }

  // Use server-side search
  return await WasmBridge.searchRules({
    query: currentFilterState.searchText || undefined,
    categories: currentFilterState.selectedTypes.size > 0 ? Array.from(currentFilterState.selectedTypes) : undefined,
    chandamNames: currentFilterState.selectedChandamNames.size > 0 ? Array.from(currentFilterState.selectedChandamNames) : undefined,
    matraLengthMin: currentFilterState.matraLengthMin ?? undefined,
    matraLengthMax: currentFilterState.matraLengthMax ?? undefined,
    hasExamples: currentFilterState.hasExamples ?? undefined,
    maxResults: 0  // No limit
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

      <h1>${t('learn_title_prefix')} ${ruleSetName}</h1>

      ${renderModeSwitcher({ ruleSetId, currentMode: 'learn' })}

      <div class="learn-content-wrapper">
        <aside class="filter-sidebar">
          ${renderFilterSidebar()}
        </aside>

        <main class="rules-content">
          <div class="results-header">
            <div class="rule-count">${t('filter_showing')} ${ruleCount} ${t('filter_of')} ${allRulesCount} ${t('label_rules_count')}</div>
          </div>
          ${resultsSection}
        </main>
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

// Map English type names to Telugu
function getTeluguTypeName(englishType: string): string {
  const typeMap: Record<string, string> = {
    'Vruttam': t('padyam_type_vruttam'),
    'Jati': t('padyam_type_jati'),
    'UpaJati': t('padyam_type_upajati')
  };
  return typeMap[englishType] || englishType;
}

// Render filter sidebar
function renderFilterSidebar(): string {
  if (!currentFacets) return '';

  return `
    <div class="filter-header">
      <h3>${t('filter_title')}</h3>
      <button class="btn-clear-filters" data-action="clear-filters">${t('filter_clear_all')}</button>
    </div>

    <div class="filter-section">
      <input
        type="text"
        class="filter-search"
        placeholder="${t('filter_search_placeholder')}"
        value="${currentFilterState.searchText}"
        data-filter="search"
      />
    </div>

    <div class="filter-section">
      <h4>వర్గం (Category)</h4>
      ${renderCheckboxFacetWithTelugu('category', currentFacets.categories, currentFilterState.selectedTypes)}
    </div>

    <div class="filter-section">
      <h4>ఛందస్సు (Chandam)</h4>
      ${renderCheckboxFacet('chandam', currentFacets.chandamNames, currentFilterState.selectedChandamNames || new Set())}
    </div>

    <div class="filter-section">
      <h4>${t('filter_has_examples')}</h4>
      <label>
        <input type="radio" name="examples" value="all" ${currentFilterState.hasExamples === null ? 'checked' : ''} data-filter="examples" />
        ${t('filter_all')} (${currentFacets.withExamples + currentFacets.withoutExamples})
      </label>
      <label>
        <input type="radio" name="examples" value="true" ${currentFilterState.hasExamples === true ? 'checked' : ''} data-filter="examples" />
        ${t('filter_with_examples')} (${currentFacets.withExamples})
      </label>
      <label>
        <input type="radio" name="examples" value="false" ${currentFilterState.hasExamples === false ? 'checked' : ''} data-filter="examples" />
        ${t('filter_without_examples')} (${currentFacets.withoutExamples})
      </label>
    </div>

    <div class="filter-section">
      <h4>${t('filter_matra_length')}</h4>
      ${renderRangeFilter('matra', currentFacets.matraLengthRange.min, currentFacets.matraLengthRange.max, currentFilterState.matraLengthMin, currentFilterState.matraLengthMax)}
    </div>
  `;
}

// Render checkbox facet group with Telugu translation for types
function renderCheckboxFacetWithTelugu(filterType: string, facetCounts: Record<string, number>, selectedValues: Set<string>): string {
  return Object.entries(facetCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => `
      <label>
        <input
          type="checkbox"
          value="${value}"
          ${selectedValues.has(value) ? 'checked' : ''}
          data-filter="${filterType}"
        />
        ${getTeluguTypeName(value)} (${count})
      </label>
    `).join('');
}

// Render checkbox facet group (for subtypes - no translation)
function renderCheckboxFacet(filterType: string, facetCounts: Record<string, number>, selectedValues: Set<string>): string {
  return Object.entries(facetCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([value, count]) => `
      <label>
        <input
          type="checkbox"
          value="${value}"
          ${selectedValues.has(value) ? 'checked' : ''}
          data-filter="${filterType}"
        />
        ${value} (${count})
      </label>
    `).join('');
}

// Render range filter (min/max inputs)
function renderRangeFilter(filterType: string, rangeMin: number, rangeMax: number, currentMin: number | null, currentMax: number | null): string {
  return `
    <div class="range-filter">
      <input
        type="number"
        placeholder="Min (${rangeMin})"
        value="${currentMin ?? ''}"
        min="${rangeMin}"
        max="${rangeMax}"
        data-filter="${filterType}-min"
      />
      <span>–</span>
      <input
        type="number"
        placeholder="Max (${rangeMax})"
        value="${currentMax ?? ''}"
        min="${rangeMin}"
        max="${rangeMax}"
        data-filter="${filterType}-max"
      />
    </div>
  `;
}

// Attach event listeners to filter controls
function attachFilterEventListeners(ruleSetId: string) {
  // Search input
  const searchInput = document.querySelector('.filter-search') as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e: Event) => {
      currentFilterState.searchText = (e.target as HTMLInputElement).value;
      await refreshResults(ruleSetId);
    }, 300));
  }

  // Category checkboxes (PadyamSubType)
  document.querySelectorAll('[data-filter="category"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      if (input.checked) {
        currentFilterState.selectedTypes.add(input.value);
      } else {
        currentFilterState.selectedTypes.delete(input.value);
      }
      await refreshResults(ruleSetId);
    });
  });

  // ChandamName checkboxes (for Vruttam)
  document.querySelectorAll('[data-filter="chandam"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      if (input.checked) {
        currentFilterState.selectedChandamNames.add(input.value);
      } else {
        currentFilterState.selectedChandamNames.delete(input.value);
      }
      await refreshResults(ruleSetId);
    });
  });


  // Examples radio buttons
  document.querySelectorAll('[data-filter="examples"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      if (input.value === 'all') {
        currentFilterState.hasExamples = null;
      } else {
        currentFilterState.hasExamples = input.value === 'true';
      }
      await refreshResults(ruleSetId);
    });
  });

  // Matra length range
  const matraMinInput = document.querySelector('[data-filter="matra-min"]') as HTMLInputElement;
  const matraMaxInput = document.querySelector('[data-filter="matra-max"]') as HTMLInputElement;
  if (matraMinInput && matraMaxInput) {
    matraMinInput.addEventListener('change', debounce(async (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      currentFilterState.matraLengthMin = value ? parseInt(value) : null;
      await refreshResults(ruleSetId);
    }, 300));

    matraMaxInput.addEventListener('change', debounce(async (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      currentFilterState.matraLengthMax = value ? parseInt(value) : null;
      await refreshResults(ruleSetId);
    }, 300));
  }

  // Clear all button
  const clearButton = document.querySelector('[data-action="clear-filters"]');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      currentFilterState = {
        searchText: '',
        selectedTypes: new Set(),
        selectedChandamNames: new Set(),
        matraLengthMin: null,
        matraLengthMax: null,
        hasExamples: null
      };
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
