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
import { exportFullBook } from '../utils/export-book';

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
let allRulesCache: RuleSummaryDetailed[] = [];
let currentRuleSetName = '';
let currentRuleSetId = '';

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
    const loaded = await CustomRulesLoader.loadCustomRuleset(ruleSet);
    if (!loaded) {
      const content = document.getElementById('content');
      if (content) {
        content.innerHTML = `
          <div class="empty-state">
            <p>${t('filter_no_results')}</p>
          </div>
        `;
      }
      return;
    }
  }

  // Step 3: Get all rules with detailed metadata
  const rules = await WasmBridge.getAllRulesDetailed('te');
  allRulesCount = rules.length;
  allRulesCache = rules;
  currentRuleSetName = ruleSetConfig.name;
  currentRuleSetId = ruleSet;

  // Step 3b: Get available filter values (no counts - faster!)
  currentFilters = await WasmBridge.getAvailableFilters('te');

  // Step 3c: Load favorite identifiers from browser storage
  await storageService.init();
  const allFavorites = await storageService.indexedDB.getAllFavorites();

  // Create Set of composite IDs for O(1) lookup
  // For custom-fav (virtual collection), all displayed rules are favorites
  // For regular rulesets, filter to only favorites from THIS ruleset
  const favoriteIds = new Set(
    ruleSet === 'custom-fav'
      ? allFavorites.map(fav => `custom-fav:${fav.ruleId}`)
      : allFavorites
          .filter(fav => fav.ruleSetId === ruleSet)
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
        <button class="btn-export-book" data-action="export-book">
          <svg class="export-icon" viewBox="0 0 24 24" width="16" height="16"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
          ${t('export_book')}
        </button>
        ${renderModeSwitcher({ ruleSetId, currentMode: 'learn' })}
      </div>
      <div class="filter-bar">
        <div class="filter-bar-row">
          <div class="filter-inputs">
            <input
              type="text"
              class="filter-search"
              placeholder="${t('filter_search_placeholder')}"
              value="${currentFilterState.searchText}"
              data-filter="search"
              aria-label="${t('filter_search_placeholder')}"
            />
            ${renderCategoryDropdown()}
          </div>
          <div class="filter-actions">
            ${ruleCount !== allRulesCount ? `<span class="rule-count">${t('filter_results')} (${ruleCount}/${allRulesCount})</span>` : ''}
            <button class="btn-clear-filters" data-action="clear-filters">${t('editor_btn_clear')}</button>
          </div>
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
  const displayName = rule.shortName && rule.shortName !== rule.name ? rule.shortName : rule.name;
  const aliasHtml = rule.alias ? `<div class="rule-alias">${rule.alias}</div>` : '';

  const subTypeBadge = rule.padyamSubType
    ? `<span class="badge badge-type badge-sm">${getTeluguCategoryName(rule.padyamSubType)}</span>`
    : '';

  const badges: string[] = [];

  if (rule.min && rule.max && rule.min !== -1 && rule.max !== -1) {
    const charText = rule.min === rule.max
      ? `${rule.min} ${t('metric_chars')}`
      : `${rule.min}-${rule.max} ${t('metric_chars')}`;
    badges.push(`<span class="badge badge-chars badge-sm">${charText}</span>`);
  } else if (rule.charLength && rule.charLength !== -1) {
    badges.push(`<span class="badge badge-chars badge-sm">${rule.charLength} ${t('metric_chars')}</span>`);
  }

  if (rule.matraLength && rule.matraLength !== -1) {
    badges.push(`<span class="badge badge-matras badge-sm">${rule.matraLength} ${t('metric_matras')}</span>`);
  }

  if (rule.lines && rule.lines > 0) {
    const padaLabel = rule.lines === 1 ? t('pada_singular') : t('pada_plural');
    badges.push(`<span class="badge badge-lines badge-sm">${rule.lines} ${padaLabel}</span>`);
  }

  if (rule.chandamName) {
    badges.push(`<span class="badge badge-chandam badge-sm">${rule.chandamName}</span>`);
  }

  const badgesHtml = badges.length > 0
    ? `<div class="rule-item-badges">${badges.join('')}</div>`
    : '';

  const sequenceHtml = rule.sequence
    ? `<div class="rule-sequence"><span class="sequence-label">గణములు:</span> <code>${rule.sequence}</code></div>`
    : '';

  const compositeId = `${ruleSetId}:${rule.identifier}`;
  const isFavorited = favoriteIds.has(compositeId);
  const favoritedClass = isFavorited ? ' favorited' : '';

  const isCustomRule = rule.identifier.startsWith('custom-');
  const deleteButton = isCustomRule
    ? `<a class="rule-action-icon btn-delete-inline" data-action="delete-rule" data-rule-id="${rule.identifier}" data-rule-name="${rule.name.replace(/"/g, '&quot;')}" title="${t('learn_btn_delete')}">
        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
      </a>`
    : '';

  return `
    <div class="rule-list-item${favoritedClass}">
      <div class="rule-item-header">
        <span class="rule-name meter-name">${displayName}</span>
        ${subTypeBadge}
        <div class="rule-item-actions">
          <a href="${makeUrl(`/learn/${ruleSetId}/${rule.identifier}`)}" class="rule-action-icon" title="${t('link_learn')}">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zM21 18.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/></svg>
          </a>
          <a href="${makeUrl(`/compute/${ruleSetId}/${rule.identifier}`)}" class="rule-action-icon" title="${t('link_try')}">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
          </a>
          ${deleteButton}
        </div>
      </div>
      ${aliasHtml}
      ${badgesHtml}
      ${sequenceHtml}
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
    `<div class="rule-item" role="option" data-value="${cat}" aria-selected="${cat === currentFilterState.selectedCategory}">${getTeluguCategoryName(cat)}</div>`
  ).join('');

  return `
    <details class="rule-picker-inline" id="category-picker">
      <summary id="selected-category-name" aria-haspopup="listbox">${selectedLabel} ▼</summary>
      <div class="picker-dropdown" role="listbox" aria-label="${t('filter_all_categories')}">
        <div class="rule-list">
          <div class="rule-item" role="option" data-value="" aria-selected="${!currentFilterState.selectedCategory}">${allLabel}</div>
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

  const exportButton = document.querySelector('[data-action="export-book"]');
  if (exportButton) {
    exportButton.addEventListener('click', async () => {
      await exportFullBook(currentRuleSetName, currentRuleSetId, allRulesCache);
    });
  }

  const rulesContent = document.querySelector('.rules-content');
  if (rulesContent) {
    rulesContent.addEventListener('click', async (e) => {
      const target = (e.target as HTMLElement).closest('[data-action="delete-rule"]') as HTMLElement;
      if (!target) return;
      const ruleId = target.dataset.ruleId || '';
      const ruleName = target.dataset.ruleName || '';
      await handleDeleteFromList(ruleId, ruleName);
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

async function handleDeleteFromList(ruleId: string, ruleName: string) {
  const confirmed = confirm(
    t('alert_delete_confirm')
  );

  if (!confirmed) {
    return;
  }

  try {
    await customRulesService.deleteCustomRule(ruleId);

    const isFavorited = await favoritesService.isFavorited('custom-rules', ruleId);
    if (isFavorited) {
      const ruleData = await WasmBridge.getRuleInfo(ruleId);
      await favoritesService.toggleFavorite('custom-rules', ruleId, ruleData);
    }

    analyticsService.trackEvent('custom_rule_deleted', {
      ruleId: ruleId,
      source: 'index_page'
    });

    window.location.reload();

  } catch (error) {
    console.error('Failed to delete rule:', error);
    alert(t('alert_delete_failed'));
  }
}
