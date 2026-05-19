import { WasmBridge } from '../wasm-bridge';
import { getRuleSet, getRuleSetAsync } from '../config';
import type { RuleSummaryDetailed, AvailableFilters } from '../types';
import { groupRulesByCategory, getSortedGroupKeys, getGroupDisplayName, getSubTypeDisplayName } from '../utils/rule-grouping';
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
import { notify } from '../utils/notify';
import { showConfirm } from '../utils/confirm-dialog';

interface FilterState {
  searchText: string;
  selectedCategory: string;
  selectedChandamName: string;
  hasExamples: boolean;
}

let currentFilterState: FilterState = {
  searchText: '',
  selectedCategory: '',
  selectedChandamName: '',
  hasExamples: false,
};

let currentFilters: AvailableFilters | null = null;
let allRulesCount = 0;
let allRulesCache: RuleSummaryDetailed[] = [];
let currentRuleSetName = '';
let currentRuleSetId = '';

// Main function: Render learn index page
export async function renderLearnIndexPage(ruleSet: string) {
  // Show page-level loading indicator immediately
  const content = document.getElementById('content');
  if (content) {
    content.innerHTML = `<div class="page-loading">
      <svg class="loader-svg" viewBox="0 0 96 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle class="loader-circle" cx="24" cy="24" r="10" fill="#1a3a5c"/>
        <circle class="loader-circle" cx="48" cy="24" r="10" fill="#b8860b"/>
        <circle class="loader-circle" cx="72" cy="24" r="10" fill="#1a3a5c"/>
      </svg>
    </div>`;
  }

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

  // Step 3: Get all rules with detailed metadata (exclude GenricVruttam from UI)
  const rules = (await WasmBridge.getAllRulesDetailed('te'))
    .filter(r => r.padyamSubType !== 'GenricVruttam');
  allRulesCount = rules.length;
  allRulesCache = rules;
  currentRuleSetName = ruleSetConfig.name;
  currentRuleSetId = ruleSet;

  // Step 3b: Get available filter values (no counts - faster!)
  currentFilters = await WasmBridge.getAvailableFilters('te');

  // Step 3c: Load favorite identifiers from browser storage
  const allFavorites = await favoritesService.getAllFavorites();

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

  // For custom-fav, map ruleId -> original ruleSetId for correct link generation
  const originalRuleSetMap = ruleSet === 'custom-fav'
    ? new Map(allFavorites.map(fav => [fav.ruleId, fav.ruleSetId]))
    : undefined;

  // Step 4: Apply filters and group results
  const filteredRules = await applyFilters(rules);
  const grouped = groupRulesByCategory(filteredRules);

  // Step 5: Render page HTML with filters and favorite status
  renderLearnIndexPageHtml(ruleSetConfig.name, filteredRules.length, ruleSet, grouped, favoriteIds, originalRuleSetMap);
}

async function applyFilters(allRules: RuleSummaryDetailed[]): Promise<RuleSummaryDetailed[]> {
  if (currentFilterState.searchText === '' && currentFilterState.selectedCategory === '' && currentFilterState.selectedChandamName === '' && !currentFilterState.hasExamples) {
    return allRules;
  }

  return await WasmBridge.searchRules({
    query: currentFilterState.searchText || undefined,
    categories: currentFilterState.selectedCategory ? [currentFilterState.selectedCategory] : undefined,
    chandamNames: currentFilterState.selectedChandamName ? [currentFilterState.selectedChandamName] : undefined,
    hasExamples: currentFilterState.hasExamples ? true : undefined,
    maxResults: 0
  }, 'te');
}

// Helper: Render page HTML
function renderLearnIndexPageHtml(
  ruleSetName: string,
  ruleCount: number,
  ruleSetId: string,
  grouped: Map<string, RuleSummaryDetailed[]>,
  favoriteIds: Set<string>,
  originalRuleSetMap?: Map<string, string>
) {
  const content = document.getElementById('content');
  if (!content) return;

  const breadcrumbs = buildRuleSetBreadcrumbs(ruleSetId, 'learn', ruleSetName);

  const hasResults = ruleCount > 0;
  const resultsSection = hasResults
    ? `<div class="chandam-groups">${renderChandamGroups(grouped, ruleSetId, favoriteIds, originalRuleSetMap)}</div>`
    : `<div class="empty-state">
         <p>${t('filter_no_results')}</p>
         <p>${t('filter_try_removing')}</p>
       </div>`;

  content.innerHTML = `
    <div class="learn-index-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="page-header-controls">
        <h1>${ruleSetName}</h1>
        <button class="action-btn btn-export-book" data-action="export-book">
          <span class="material-symbols-outlined" style="font-size:16px" aria-hidden="true">download</span>
          <span>${t('export_book')}</span>
        </button>
        ${renderModeSwitcher({ ruleSetId, currentMode: 'learn' })}
      </div>
      <div class="filter-bar">
        <div class="filter-bar-row">
          <div class="filter-inputs">
            <input
              type="search"
              class="filter-search"
              placeholder="${t('filter_search_placeholder')}"
              value="${currentFilterState.searchText}"
              data-filter="search"
              aria-label="${t('filter_search_placeholder')}"
              enterkeyhint="search"
            />
            ${renderCategoryDropdown()}
            ${renderExamplesToggle()}
          </div>
          <div class="filter-actions">
            <span class="filter-result-count">${ruleCount !== allRulesCount ? `${t('filter_results')} (${ruleCount}/${allRulesCount})` : `${allRulesCount}`}</span>
            <button class="btn-clear-filters" data-action="clear-filters">
              <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">delete_sweep</span>
              ${t('editor_btn_clear')}
            </button>
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
  favoriteIds: Set<string>,
  originalRuleSetMap?: Map<string, string>
): string {
  const sortedKeys = getSortedGroupKeys(grouped);

  return sortedKeys.map(groupKey => {
    const rules = grouped.get(groupKey)!;
    return `
      <div class="chandam-group">
        <h2>${getGroupDisplayName(groupKey, grouped)}</h2>
        ${rules.map(rule => renderRuleListItem(rule, ruleSetId, favoriteIds, originalRuleSetMap)).join('')}
      </div>
    `;
  }).join('');
}


// Helper: Render a single rule list item
function renderRuleListItem(rule: RuleSummaryDetailed, ruleSetId: string, favoriteIds: Set<string>, originalRuleSetMap?: Map<string, string>): string {
  const effectiveRuleSetId = originalRuleSetMap?.get(rule.identifier) || ruleSetId;
  const displayName = rule.shortName && rule.shortName !== rule.name ? rule.shortName : rule.name;
  const aliasHtml = rule.alias
    ? `<span class="rule-alias-inline">(${rule.alias})</span>`
    : '';

  // Compact summary: gana + yati + prasa (pre-formatted HTML from backend)
  const summaryHtml = rule.compactSummary
    ? `<div class="rule-compact-summary">${rule.compactSummary}</div>`
    : '';

  // Condensed constraints as inline text
  const metaParts: string[] = [];
  if (rule.min && rule.max && rule.min !== -1 && rule.max !== -1) {
    metaParts.push(rule.min === rule.max
      ? `${rule.min} ${t('metric_chars')}`
      : `${rule.min}-${rule.max} ${t('metric_chars')}`);
  } else if (rule.charLength && rule.charLength !== -1) {
    metaParts.push(`${rule.charLength} ${t('metric_chars')}`);
  }
  if (rule.matraLength && rule.matraLength !== -1) {
    metaParts.push(`${rule.matraLength} ${t('metric_matras')}`);
  }
  if (rule.lines && rule.lines > 0) {
    const padaLabel = rule.lines === 1 ? t('pada_singular') : t('pada_plural');
    metaParts.push(`${rule.lines} ${padaLabel}`);
  }
  if (rule.exampleCount && rule.exampleCount > 0) {
    metaParts.push(`${rule.exampleCount} ${t('metric_examples')}`);
  }
  if (rule.chandamName) {
    metaParts.push(rule.chandamName);
  }
  const metaHtml = metaParts.length > 0
    ? `<div class="rule-item-meta">${metaParts.join(' · ')}</div>`
    : '';

  const isCustomRuleSet = ruleSetId === 'custom-rules' || ruleSetId === 'custom-fav';
  const compositeId = `${ruleSetId}:${rule.identifier}`;
  const isFavorited = !isCustomRuleSet && favoriteIds.has(compositeId);
  const favoritedClass = isFavorited ? ' favorited' : '';

  const isCustomRule = rule.identifier.startsWith('custom-');
  const deleteButton = isCustomRule
    ? `<a class="rule-action-icon btn-delete-inline" data-action="delete-rule" data-rule-id="${rule.identifier}" data-rule-name="${rule.name.replace(/"/g, '&quot;')}" title="${t('learn_btn_delete')}">
        <span class="material-symbols-outlined" style="font-size:16px" aria-hidden="true">delete</span>
        ${t('learn_btn_delete')}
      </a>`
    : '';

  return `
    <div class="rule-list-item${favoritedClass}">
      <div class="rule-item-header">
        <span class="rule-name meter-name">${displayName}</span>
        ${aliasHtml}
        <div class="rule-item-actions">
          <a href="${makeUrl(`/learn/${effectiveRuleSetId}/${rule.identifier}`)}" class="rule-action-icon" title="${t('link_learn')}">
            <span class="material-symbols-outlined" style="font-size:16px" aria-hidden="true">menu_book</span>
            ${t('link_learn')}
          </a>
          <a href="${makeUrl(`/compute/${effectiveRuleSetId}/${rule.identifier}`)}" class="rule-action-icon" title="${t('link_try')}">
            <span class="material-symbols-outlined" style="font-size:16px" aria-hidden="true">play_arrow</span>
            ${t('link_try')}
          </a>
          ${deleteButton}
        </div>
      </div>
      ${summaryHtml}
      ${metaHtml}
    </div>
  `;
}

function getSelectedFilterLabel(): string {
  if (currentFilterState.selectedChandamName && currentFilters) {
    const idx = currentFilters.chandamNames.indexOf(currentFilterState.selectedChandamName);
    return idx >= 0 ? currentFilters.chandamLabels[idx] : currentFilterState.selectedChandamName;
  }
  if (currentFilterState.selectedCategory) {
    return getSubTypeDisplayName(currentFilterState.selectedCategory);
  }
  return t('filter_all_categories');
}

function renderCategoryDropdown(): string {
  if (!currentFilters) return '';

  const allLabel = t('filter_all_categories');
  const selectedLabel = getSelectedFilterLabel();

  const categoryItems = currentFilters.categories
    .filter(cat => cat !== 'GenricVruttam')
    .map(cat =>
      `<div class="rule-item" role="option" data-filter-type="category" data-value="${cat}" aria-selected="${cat === currentFilterState.selectedCategory}">${getSubTypeDisplayName(cat)}</div>`
    ).join('');

  const chandamItems = (currentFilters.chandamNames.length > 0)
    ? currentFilters.chandamNames.map((name, i) =>
      `<div class="rule-item" role="option" data-filter-type="chandam" data-value="${name}" aria-selected="${name === currentFilterState.selectedChandamName}">${currentFilters!.chandamLabels[i]}</div>`
    ).join('')
    : '';

  return `
    <details class="rule-picker-inline" id="category-picker">
      <summary id="selected-category-name" aria-haspopup="listbox">${selectedLabel} ▼</summary>
      <div class="picker-dropdown" role="listbox" aria-label="${t('filter_all_categories')}">
        <div class="rule-list">
          <div class="rule-item" role="option" data-filter-type="category" data-value="" aria-selected="${!currentFilterState.selectedCategory && !currentFilterState.selectedChandamName}">${allLabel}</div>
          ${categoryItems}
          ${chandamItems ? `<div class="rule-group-header">${getSubTypeDisplayName('Vruttam')}</div>${chandamItems}` : ''}
        </div>
      </div>
    </details>
  `;
}

function renderExamplesToggle(): string {
  if (!currentFilters || !currentFilters.hasRulesWithExamples || !currentFilters.hasRulesWithoutExamples) {
    return '';
  }

  return `
    <label class="toggle-switch compact">
      <input type="checkbox" id="filter-has-examples" ${currentFilterState.hasExamples ? 'checked' : ''}>
      <span class="toggle-slider"></span>
      <span class="toggle-label">${t('filter_with_examples')}</span>
    </label>
  `;
}

function attachFilterEventListeners(ruleSetId: string) {
  const searchInput = document.querySelector('.filter-search') as HTMLInputElement;
  if (searchInput) {
    let lastSearchedText = currentFilterState.searchText;

    async function executeSearch() {
      const newText = searchInput.value;
      if (newText === lastSearchedText) return;
      lastSearchedText = newText;
      currentFilterState.searchText = newText;
      const done = analyticsService.startTimedEvent('filter_search', {
        ruleSet: ruleSetId,
        queryLength: newText.length
      });
      await refreshResults(ruleSetId);
      done();
    }

    searchInput.addEventListener('keydown', async (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      await executeSearch();
    });

    searchInput.addEventListener('blur', async () => {
      await executeSearch();
    });

    searchInput.addEventListener('search', async () => {
      await executeSearch();
    });
  }

  const categoryPicker = document.getElementById('category-picker') as HTMLDetailsElement;
  if (categoryPicker) {
    categoryPicker.querySelectorAll('.rule-item').forEach(item => {
      item.addEventListener('click', async () => {
        const el = item as HTMLElement;
        const filterType = el.dataset.filterType || 'category';
        const value = el.dataset.value || '';

        const si = document.querySelector('.filter-search') as HTMLInputElement;
        if (si) currentFilterState.searchText = si.value;

        if (filterType === 'chandam') {
          currentFilterState.selectedChandamName = value;
          currentFilterState.selectedCategory = '';
        } else {
          currentFilterState.selectedCategory = value;
          currentFilterState.selectedChandamName = '';
        }

        const summary = document.getElementById('selected-category-name');
        if (summary) {
          summary.textContent = getSelectedFilterLabel() + ' ▼';
        }
        categoryPicker.open = false;

        const done = analyticsService.startTimedEvent('filter_category', {
          ruleSet: ruleSetId,
          filterType,
          value: value || 'all'
        });
        await refreshResults(ruleSetId);
        done();
      });
    });

    document.addEventListener('click', (e) => {
      if (categoryPicker.open && !categoryPicker.contains(e.target as Node)) {
        categoryPicker.open = false;
      }
    });
  }

  const examplesToggle = document.getElementById('filter-has-examples') as HTMLInputElement;
  if (examplesToggle) {
    examplesToggle.addEventListener('change', async () => {
      const si = document.querySelector('.filter-search') as HTMLInputElement;
      if (si) currentFilterState.searchText = si.value;
      currentFilterState.hasExamples = examplesToggle.checked;
      const done = analyticsService.startTimedEvent('filter_examples', {
        ruleSet: ruleSetId,
        enabled: String(examplesToggle.checked)
      });
      await refreshResults(ruleSetId);
      done();
    });
  }

  const clearButton = document.querySelector('[data-action="clear-filters"]');
  if (clearButton) {
    clearButton.addEventListener('click', async () => {
      currentFilterState = { searchText: '', selectedCategory: '', selectedChandamName: '', hasExamples: false };
      const done = analyticsService.startTimedEvent('filter_clear', { ruleSet: ruleSetId });
      await refreshResults(ruleSetId);
      done();
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


async function handleDeleteFromList(ruleId: string, ruleName: string) {
  const confirmed = await showConfirm(t('alert_delete_confirm'), {
    title: `${t('action_delete_custom_rule')}: ${ruleName}`,
    cancelText: t('creator_btn_cancel'),
    confirmText: t('action_delete_custom_rule')
  });

  if (!confirmed) {
    return;
  }

  const done = analyticsService.startTimedEvent('custom_rule_deleted', {
    ruleId: ruleId,
    source: 'index_page'
  });

  try {
    await customRulesService.deleteCustomRule(ruleId);

    const isFavorited = await favoritesService.isFavorited('custom-rules', ruleId);
    if (isFavorited) {
      const ruleDto = await WasmBridge.getRuleDto(ruleId);
      await favoritesService.toggleFavorite('custom-rules', ruleId, ruleDto);
    }

    done();
    window.location.reload();

  } catch (error) {
    console.error('Failed to delete rule:', error);
    notify(t('alert_delete_failed'), 'error');
  }
}
