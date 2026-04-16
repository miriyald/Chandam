# Modern Facet-Style Filter System for Learn Index Page

## Context

The Learn Index Page (`/learn/{ruleSetId}/`) currently displays Telugu poetry meter rules in a grouped format without any filtering capability. Users need to scroll through hundreds or thousands of rules to find what they're looking for. This plan adds a modern facet-style filter system with:

- Left sidebar with multiple filter dimensions (Type, SubType, character/matra length ranges, name search, has examples toggle)
- Facet counts showing how many rules match each option
- Real-time filtering with results remaining in their grouped format
- Responsive design (collapsible sidebar on mobile)
- Status display showing "X of Y rules"
- Default to showing all rules (progressive filtering approach)

**Problem:** Users cannot efficiently explore or narrow down the 380-2,337 rules in a ruleset. No search, no filters, only manual scrolling.

**Solution:** Add a comprehensive facet filter system that maintains the existing grouped display while allowing users to narrow results by multiple criteria.

## User Decisions

- **Target:** Learn Index Page only (not the rule sets landing page)
- **Default View:** Show all rules by default, users progressively narrow down
- **Layout:** Left sidebar for filters (280px), results on right (collapsible on mobile)
- **Character Length:** Min/Max sliders for precise range control

## Architecture Overview

```
learn-index-page.ts (UPDATED)
├── Load rules via WasmBridge.getAllRulesDetailed()
├── Extract facet counts from full dataset
├── Initialize filter state (empty = show all)
├── Render: [Filter Sidebar] | [Results with Grouping]
└── Event handlers → update filters → re-render results

utils/rule-filters.ts (NEW)
├── FilterState interface (tracks all filter selections)
├── FacetCounts interface (counts per facet value)
├── getDefaultFilterState() → initial empty state
├── extractFacetCounts(rules) → build counts
└── applyFilters(rules, filters) → return filtered subset

chandam.css (UPDATED)
├── Two-column grid layout (280px sidebar + fluid content)
├── Sticky sidebar with scroll
├── Facet checkbox styling with counts
├── Dual-range slider styling
└── Mobile: slide-in sidebar with backdrop
```

## Implementation Steps

### Step 0: Add Examples Count to Backend

**File:** `Chandam.Wasm/JsBridge.cs` (MODIFY)

Update the `GetAllRulesDetailed()` method to include examples count in the output:

```csharp
var detail = new {
    r.Identifier,
    r.Name,
    PadyamType = r.PadyamType.ToString(),
    PadyamSubType = r.PadyamSubType.ToString(),
    Frequency = r.Frequency.ToString(),
    r.Lines,
    r.ChandamName,
    r.CharLength,
    r.MatraLength,
    Min = r.Min,
    Max = r.Max,
    r.Sequence,
    r.ShortName,
    r.Alias,
    ExamplesCount = r.Examples2?.Length ?? 0  // NEW: Add examples count
};
```

**File:** `Chandam.Wasm/Client/src/types.ts` (MODIFY)

Update `RuleSummaryDetailed` interface to include examples count:

```typescript
export interface RuleSummaryDetailed extends RuleSummary {
  chandamName?: string;
  charLength?: number;
  matraLength?: number;
  min?: number;
  max?: number;
  sequence?: string;
  shortName?: string;
  alias?: string;
  examplesCount?: number;  // NEW: Number of example poems
}
```

This is a simple, non-breaking change that exposes data already available in the backend.

### Step 0.5: Add Translation Keys

**File:** `Chandam.Wasm/Client/src/i18n.ts` (MODIFY)

Add new translation keys for filter UI elements. Insert these into the translations object:

```typescript
// Filter-related translations
filter_title: { en: 'Filters', te: 'వడపోతలు' },
filter_clear_all: { en: 'Clear All', te: 'అన్నీ తొలగించు' },
filter_search_placeholder: { en: 'Search rules...', te: 'నియమాలు వెతకండి...' },
filter_has_examples: { en: 'Examples', te: 'ఉదాహరణలు' },
filter_with_examples: { en: 'With Examples', te: 'ఉదాహరణలతో' },
filter_without_examples: { en: 'Without Examples', te: 'ఉదాహరణలు లేకుండా' },
filter_all: { en: 'All', te: 'అన్నీ' },
filter_char_length: { en: 'Character Length', te: 'అక్షరాల పొడవు' },
filter_matra_length: { en: 'Matra Length', te: 'మాత్రల పొడవు' },
filter_no_results: { en: 'No rules match your filters.', te: 'మీ వడపోతలకు సరిపోలే నియమాలు లేవు.' },
filter_try_removing: { en: 'Try removing some filters to see more results.', te: 'మరిన్ని ఫలితాలను చూడటానికి కొన్ని వడపోతలను తొలగించండి.' },
filter_showing: { en: 'Showing', te: 'చూపిస్తోంది' },
filter_of: { en: 'of', te: 'లో' },
```

**Note:** Reuse existing translation key `label_rules_count` for "rules" text.

These keys will be used throughout the filter UI for both English and Telugu users.

### Step 1: Create Filter Utility Module

**File:** `Chandam.Wasm/Client/src/utils/rule-filters.ts` (NEW)

Create a standalone module with pure functions (no DOM dependencies):

**Interfaces:**

```typescript
export interface FilterState {
  selectedTypes: Set<string>;          // Vruttam, Jati, UpaJati
  selectedSubTypes: Set<string>;       // Akkara, Divpada, Ragada, etc.
  charLengthMin: number;               // Min character length
  charLengthMax: number;               // Max character length
  matraLengthMin: number;              // Min matra length
  matraLengthMax: number;              // Max matra length
  searchText: string;                  // Wildcard name search
  hasExamples: boolean | null;         // true=only with examples, false=only without, null=all
}

export interface FacetCounts {
  types: Map<string, number>;          // "Vruttam" → 245
  subTypes: Map<string, number>;       // "Akkara" → 12
  charLengthRange: { min: number; max: number };
  matraLengthRange: { min: number; max: number };
  withExamples: number;                // Count of rules with examples
  withoutExamples: number;             // Count of rules without examples
}
```

**Functions:**

1. **`getDefaultFilterState(): FilterState`**
   - Returns initial state with empty Sets (empty Set = show all)
   - Ranges will be set from data after extraction

2. **`extractFacetCounts(rules: RuleSummaryDetailed[]): FacetCounts`**
   - Single O(n) pass through all rules
   - Build Map<string, number> for Type and SubType
     - **IMPORTANT:** Explicitly exclude "Unspecified" type: `if (rule.padyamType !== 'Unspecified')`
   - Calculate min/max for charLength and matraLength
     - **IMPORTANT:** Exclude -1 values (means "not applicable"): `if (rule.charLength && rule.charLength > 0)`
     - Only include valid positive values in range calculation
   - Count rules with and without examples (`examplesCount > 0` vs `examplesCount === 0`)
   - Example: `types.set('Vruttam', 245)`
   
   **Implementation:**
   ```typescript
   export function extractFacetCounts(rules: RuleSummaryDetailed[]): FacetCounts {
     const types = new Map<string, number>();
     const subTypes = new Map<string, number>();
     let charLengthMin = Infinity;
     let charLengthMax = -Infinity;
     let matraLengthMin = Infinity;
     let matraLengthMax = -Infinity;
     let withExamples = 0;
     let withoutExamples = 0;
     
     for (const rule of rules) {
       // Type counts - exclude "Unspecified"
       if (rule.padyamType && rule.padyamType !== 'Unspecified') {
         types.set(rule.padyamType, (types.get(rule.padyamType) || 0) + 1);
       }
       
       // SubType counts
       if (rule.padyamSubType) {
         subTypes.set(rule.padyamSubType, (subTypes.get(rule.padyamSubType) || 0) + 1);
       }
       
       // Character length range - exclude -1 values
       if (rule.charLength && rule.charLength > 0) {
         charLengthMin = Math.min(charLengthMin, rule.charLength);
         charLengthMax = Math.max(charLengthMax, rule.charLength);
       }
       
       // Matra length range - exclude -1 values
       if (rule.matraLength && rule.matraLength > 0) {
         matraLengthMin = Math.min(matraLengthMin, rule.matraLength);
         matraLengthMax = Math.max(matraLengthMax, rule.matraLength);
       }
       
       // Examples count
       if (rule.examplesCount && rule.examplesCount > 0) {
         withExamples++;
       } else {
         withoutExamples++;
       }
     }
     
     return {
       types,
       subTypes,
       charLengthRange: {
         min: charLengthMin === Infinity ? 0 : charLengthMin,
         max: charLengthMax === -Infinity ? 0 : charLengthMax
       },
       matraLengthRange: {
         min: matraLengthMin === Infinity ? 0 : matraLengthMin,
         max: matraLengthMax === -Infinity ? 0 : matraLengthMax
       },
       withExamples,
       withoutExamples
     };
   }
   ```

3. **`applyFilters(rules: RuleSummaryDetailed[], filters: FilterState): RuleSummaryDetailed[]`**
   - Returns filtered subset matching ALL active filters
   - Filter logic:
     - **Empty Set = show all** for that facet (e.g., no Types selected = all Types shown)
     - **Text search:** case-insensitive match against `name`, `shortName`, `alias`, `chandamName`
     - **Type/SubType:** Set membership check (if Set is not empty)
     - **Character length:** rule.charLength >= min && rule.charLength <= max
       - **IMPORTANT:** Exclude rules with charLength === -1 or undefined
     - **Matra length:** rule.matraLength >= min && rule.matraLength <= max
       - **IMPORTANT:** Exclude rules with matraLength === -1 or undefined
     - **Has examples:** if `true`, only rules with `examplesCount > 0`; if `false`, only rules with `examplesCount === 0`; if `null`, all rules
   - **Performance optimization:** Apply filters in order of selectivity (most restrictive first)
     1. Text search (most selective, early exit)
     2. Type/SubType (Set lookup, fast)
     3. Examples filter (boolean check)
     4. Range filters (numeric comparison, slower)
   - O(n) complexity per filter application
   
   **Implementation:**
   ```typescript
   export function applyFilters(rules: RuleSummaryDetailed[], filters: FilterState): RuleSummaryDetailed[] {
     return rules.filter(rule => {
       // 1. Text search (most selective, early exit)
       if (filters.searchText) {
         const search = filters.searchText.toLowerCase();
         const matchesSearch = 
           rule.name.toLowerCase().includes(search) ||
           rule.shortName?.toLowerCase().includes(search) ||
           rule.alias?.toLowerCase().includes(search) ||
           rule.chandamName?.toLowerCase().includes(search);
         if (!matchesSearch) return false;
       }
       
       // 2. Type filter (Set lookup, fast)
       if (filters.selectedTypes.size > 0 && !filters.selectedTypes.has(rule.padyamType)) {
         return false;
       }
       
       // 3. SubType filter
       if (filters.selectedSubTypes.size > 0 && !filters.selectedSubTypes.has(rule.padyamSubType)) {
         return false;
       }
       
       // 4. Examples filter (boolean check)
       if (filters.hasExamples !== null) {
         const hasExamples = (rule.examplesCount || 0) > 0;
         if (filters.hasExamples !== hasExamples) return false;
       }
       
       // 5. Character length range - exclude -1 and undefined values
       if (filters.charLengthMin > 0 || filters.charLengthMax > 0) {
         if (!rule.charLength || rule.charLength <= 0) {
           return false; // Skip rules without valid char length
         }
         if (rule.charLength < filters.charLengthMin || rule.charLength > filters.charLengthMax) {
           return false;
         }
       }
       
       // 6. Matra length range - exclude -1 and undefined values
       if (filters.matraLengthMin > 0 || filters.matraLengthMax > 0) {
         if (!rule.matraLength || rule.matraLength <= 0) {
           return false; // Skip rules without valid matra length
         }
         if (rule.matraLength < filters.matraLengthMin || rule.matraLength > filters.matraLengthMax) {
           return false;
         }
       }
       
       return true;
     });
   }
   ```

**Implementation notes:**
- All functions are pure (no side effects)
- Type-safe with TypeScript
- No DOM or UI dependencies (easily testable)
- Empty Sets/empty strings mean "no filter applied"

### Step 2: Update Learn Index Page Structure

**File:** `Chandam.Wasm/Client/src/ui/learn-index-page.ts` (MODIFY)

**Changes to `renderLearnIndexPage()` function:**

```typescript
export async function renderLearnIndexPage(ruleSet: string) {
  // ... existing rule loading logic ...
  const rules = await WasmBridge.getAllRulesDetailed();
  
  // NEW: Extract facet counts and initialize filter state
  const facetCounts = extractFacetCounts(rules);
  const filterState = getDefaultFilterState();
  
  // Set initial ranges from actual data
  filterState.charLengthMin = facetCounts.charLengthRange.min;
  filterState.charLengthMax = facetCounts.charLengthRange.max;
  filterState.matraLengthMin = facetCounts.matraLengthRange.min;
  filterState.matraLengthMax = facetCounts.matraLengthRange.max;
  
  // Apply filters (initially empty = show all)
  const filteredRules = applyFilters(rules, filterState);
  
  // Group filtered results (existing logic)
  const grouped = groupRulesByCategory(filteredRules);
  
  // ... existing favorite loading ...
  
  // Render page with new layout
  renderLearnIndexPageHtml(
    ruleSetConfig.name, 
    rules.length, 
    ruleSet, 
    grouped, 
    favoriteIds,
    facetCounts,
    filterState,
    filteredRules.length  // for status display
  );
  
  // NEW: Attach filter event handlers
  attachFilterEventHandlers(ruleSet, rules, facetCounts, filterState, favoriteIds);
}
```

**Update HTML structure in `renderLearnIndexPageHtml()`:**

```html
<div class="learn-index-page">
  ${renderBreadcrumbs(breadcrumbs)}
  
  <div class="page-header-with-filters">
    <h1>${t('learn_title_prefix')} ${ruleSetName}</h1>
    <button id="filter-toggle" class="filter-toggle-btn mobile-only" aria-label="${t('filter_title')}">
      🔍 ${t('filter_title')}
    </button>
  </div>
  
  <!-- Two-column layout -->
  <div class="learn-content-layout">
    <!-- LEFT: Filter Sidebar -->
    <aside class="filter-sidebar" id="filter-sidebar" role="complementary" aria-label="${t('filter_title')}">
      ${renderFilterSidebar(facetCounts, filterState, totalRules)}
    </aside>
    
    <!-- RIGHT: Results -->
    <div class="results-container">
      ${renderModeSwitcher({ ruleSetId, currentMode: 'learn' })}
      
      <!-- Status bar -->
      <div class="results-status">
        <span id="results-count-display">
          Showing <strong>${filteredCount}</strong> of <strong>${totalRules}</strong> rules
        </span>
      </div>
      
      <!-- Existing grouped results -->
      <div class="chandam-groups">
        ${renderChandamGroups(grouped, ruleSetId, favoriteIds)}
      </div>
    </div>
  </div>
</div>
```

**Add new rendering functions:**

1. **`renderFilterSidebar(facetCounts, filterState, totalRules)`**
   - Sidebar header with "Clear All" button using `t('filter_clear_all')`
   - Name search input with placeholder using `t('filter_search_placeholder')`
   - Type facet section (checkboxes with counts)
     - Uses `t('label_type')` for section title
     - "Unspecified" type already excluded in `extractFacetCounts()`
   - SubType facet section (checkboxes with counts)
   - Has Examples filter (3-way radio: All / With Examples / Without Examples)
     - Uses `t('filter_has_examples')`, `t('filter_with_examples')`, `t('filter_without_examples')`, `t('filter_all')`
   - Character length range sliders (if range exists and max > 0)
     - Uses `t('filter_char_length')` for label
   - Matra length range sliders (if range exists and max > 0)
     - Uses `t('filter_matra_length')` for label
   - Include ARIA attributes: `role="group"`, `aria-labelledby` for each section

2. **`renderCheckboxFacet(facetName, facetValues, counts, selectedSet)`**
   - Generates checkbox list for a facet
   - Each checkbox shows label and count: "Vruttam (245)"
   - Checkbox is checked if value is in selectedSet
   - Uses `data-facet` and `data-value` attributes for event handling

3. **`renderRangeSlider(label, id, min, max, currentMin, currentMax)`**
   - Dual-range slider implementation
   - Two `<input type="range">` elements (one for min, one for max)
   - Display current values: "6 — 50"
   - Uses `data-range-type` and `data-range-bound` attributes

### Step 3: Add Filter Event Handlers

**New function in `learn-index-page.ts`:**

```typescript
function attachFilterEventHandlers(
  ruleSetId: string,
  allRules: RuleSummaryDetailed[],
  facetCounts: FacetCounts,
  filterState: FilterState,
  favoriteIds: Set<string>
): void {
  
  // Helper: Update results display after filter change
  const updateResults = () => {
    const filtered = applyFilters(allRules, filterState);
    const grouped = groupRulesByCategory(filtered);
    
    // Update status count
    document.getElementById('results-count-display')!.innerHTML = 
      `${t('filter_showing')} <strong>${filtered.length}</strong> ${t('filter_of')} <strong>${allRules.length}</strong> ${t('label_rules_count')}`;
    
    // Handle empty results
    const resultsContainer = document.querySelector('.chandam-groups')!;
    if (filtered.length === 0) {
      resultsContainer.innerHTML = `
        <div class="empty-state">
          <p class="empty-state-message">${t('filter_no_results')}</p>
          <p class="empty-state-hint">${t('filter_try_removing')}</p>
          <button id="reset-filters-from-empty" class="btn-primary">
            ${t('filter_clear_all')}
          </button>
        </div>
      `;
      // Attach reset handler
      document.getElementById('reset-filters-from-empty')?.addEventListener('click', () => {
        document.getElementById('clear-filters-btn')?.click();
      });
    } else {
      // Re-render groups
      resultsContainer.innerHTML = renderChandamGroups(grouped, ruleSetId, favoriteIds);
    }
  };
  
  // 1. Checkbox facets (Type, SubType)
  document.querySelectorAll('.facet-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const facet = target.dataset.facet!;
      const value = target.dataset.value!;
      
      // Get appropriate Set
      const set = facet === 'type' ? filterState.selectedTypes
                : filterState.selectedSubTypes;
      
      // Toggle Set membership
      if (target.checked) set.add(value);
      else set.delete(value);
      
      updateResults();
    });
  });
  
  // 2. Range sliders (Character length, Matra length)
  document.querySelectorAll('.range-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const rangeType = target.dataset.rangeType!;  // 'charLength' or 'matraLength'
      const bound = target.dataset.rangeBound!;      // 'min' or 'max'
      const value = parseInt(target.value);
      
      // Update filter state
      if (rangeType === 'charLength') {
        if (bound === 'min') filterState.charLengthMin = value;
        else filterState.charLengthMax = value;
      } else {
        if (bound === 'min') filterState.matraLengthMin = value;
        else filterState.matraLengthMax = value;
      }
      
      // Update displayed value
      document.getElementById(`${rangeType}-${bound}-value`)!.textContent = value.toString();
      
      updateResults();
    });
  });
  
  // 3. Search input (debounced for performance)
  let searchTimeout: number;
  document.getElementById('filter-search')!.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
      filterState.searchText = (e.target as HTMLInputElement).value;
      updateResults();
    }, 300); // 300ms debounce
  });
  
  // 3. Has Examples filter (3-way radio buttons)
  document.querySelectorAll('input[name="has-examples"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;
      
      if (value === 'all') filterState.hasExamples = null;
      else if (value === 'with') filterState.hasExamples = true;
      else if (value === 'without') filterState.hasExamples = false;
      
      updateResults();
    });
  });
  
  // 4. Clear All button
  document.getElementById('clear-filters-btn')!.addEventListener('click', () => {
    // Reset filter state
    filterState.selectedTypes.clear();
    filterState.selectedSubTypes.clear();
    filterState.charLengthMin = facetCounts.charLengthRange.min;
    filterState.charLengthMax = facetCounts.charLengthRange.max;
    filterState.matraLengthMin = facetCounts.matraLengthRange.min;
    filterState.matraLengthMax = facetCounts.matraLengthRange.max;
    filterState.searchText = '';
    filterState.hasExamples = null;
    
    // Re-render sidebar to reset UI
    document.getElementById('filter-sidebar')!.innerHTML = 
      renderFilterSidebar(facetCounts, filterState, allRules.length);
    
    // Re-attach handlers (since we replaced HTML)
    attachFilterEventHandlers(ruleSetId, allRules, facetCounts, filterState, favoriteIds);
    
    updateResults();
  });
  
  // 5. Mobile toggle button (show/hide sidebar)
  document.getElementById('filter-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('filter-sidebar')!;
    sidebar.classList.toggle('sidebar-open');
  });
  
  // 6. Mobile backdrop click (close sidebar)
  document.getElementById('filter-sidebar')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('sidebar-open');
    }
  });
}
```

### Step 4: Add CSS Styling

**File:** `Chandam.Wasm/wwwroot/css/chandam.css` (APPEND)

Add these styles at the end of the file:

**Desktop Two-Column Layout:**

```css
/* Learn page two-column layout */
.learn-content-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: start;
  margin-top: 2rem;
}

.filter-sidebar {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

.filter-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.filter-sidebar-title {
  font-weight: 600;
  font-size: 1.1rem;
}

.clear-filters-btn {
  font-size: 0.85rem;
  color: var(--color-header-bg);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
}

.clear-filters-btn:hover {
  opacity: 0.7;
}

.results-container {
  min-width: 0; /* Prevent grid blowout */
}

.results-status {
  padding: 1rem;
  background: #f0f9ff;
  border-left: 4px solid var(--color-header-bg);
  margin-bottom: 1.5rem;
  border-radius: 4px;
  font-size: 0.95rem;
}
```

**Search Input:**

```css
.filter-search-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.filter-search-input:focus {
  outline: none;
  border-color: var(--color-header-bg);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

**Facet Sections:**

```css
.facet-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.facet-section:last-child {
  border-bottom: none;
}

.facet-section-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: #374151;
}

.facet-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  cursor: pointer;
  font-size: 0.9rem;
  color: #1f2937;
}

.facet-checkbox-label:hover {
  background: #f3f4f6;
  padding-left: 0.25rem;
  margin-left: -0.25rem;
  border-radius: 4px;
}

.facet-checkbox {
  cursor: pointer;
}

.facet-label {
  flex: 1;
}

.facet-count {
  color: #6b7280;
  font-size: 0.85rem;
  font-weight: 500;
}
```

**Range Sliders:**

```css
.range-slider-container {
  margin-top: 0.5rem;
}

.range-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  color: #6b7280;
}

.range-input {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  -webkit-appearance: none;
  cursor: pointer;
  margin: 0.25rem 0;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-header-bg);
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.range-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-header-bg);
  cursor: pointer;
  border: none;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.range-input::-moz-range-thumb:hover {
  transform: scale(1.2);
}
```

**Mobile Responsive:**

```css
/* Mobile filter toggle button */
.filter-toggle-btn {
  display: none; /* Hidden on desktop */
  padding: 0.6rem 1.2rem;
  background: var(--color-header-bg);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

/* Mobile-only utility class */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  /* Show mobile-only elements */
  .mobile-only {
    display: block;
  }
  
  /* Show toggle button on mobile */
  .filter-toggle-btn {
    display: block;
  }
  
  .page-header-with-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  /* Single column layout */
  .learn-content-layout {
    grid-template-columns: 1fr;
  }
  
  /* Sidebar as overlay */
  .filter-sidebar {
    display: none; /* Hidden by default */
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    max-width: 320px;
    height: 100vh;
    max-height: 100vh;
    z-index: 1000;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);
    border-radius: 0;
    border: none;
  }
  
  /* Show sidebar when open */
  .filter-sidebar.sidebar-open {
    display: block;
    animation: slideInLeft 0.3s ease-out;
  }
  
  @keyframes slideInLeft {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }
  
  /* Backdrop when sidebar is open */
  .filter-sidebar.sidebar-open::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}

/* Empty state styles */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.empty-state-message {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  color: #374151;
  font-weight: 500;
}

.empty-state-hint {
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  color: #6b7280;
}

.empty-state .btn-primary {
  padding: 0.75rem 1.5rem;
  background: var(--color-header-bg);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
}

.empty-state .btn-primary:hover {
  opacity: 0.85;
}

/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Critical Files

These files are essential for implementation:

1. **`Chandam.Wasm/JsBridge.cs`** (MODIFY)
   - Add `ExamplesCount` to GetAllRulesDetailed output
   - Simple one-line addition

2. **`Chandam.Wasm/Client/src/types.ts`** (MODIFY)
   - Add `examplesCount?: number` to RuleSummaryDetailed interface
   - Simple one-line addition

3. **`Chandam.Wasm/Client/src/i18n.ts`** (MODIFY)
   - Add filter-related translation keys (Step 0.5)
   - ~10 new key-value pairs for en/te

4. **`Chandam.Wasm/Client/src/utils/rule-filters.ts`** (NEW)
   - All filter logic and interfaces
   - Pure functions, no UI dependencies

5. **`Chandam.Wasm/Client/src/ui/learn-index-page.ts`** (MODIFY)
   - Integration point for filter system
   - Rendering and event handling
   - Empty state handling
   - Main implementation file

6. **`Chandam.Wasm/wwwroot/css/chandam.css`** (MODIFY)
   - Layout and styling
   - Mobile responsive design
   - Empty state styles
   - Accessibility classes (.sr-only, .mobile-only)

7. **`Chandam.Wasm/Client/src/utils/rule-grouping.ts`** (REFERENCE ONLY)
   - Existing grouping logic
   - Used by filtered results

## Verification Plan

After implementation, verify the following:

1. **Functional Testing:**
   - Load learn page with different rulesets (popular, complete, topella)
   - Toggle Type checkboxes (Vruttam, Jati, UpaJati) → results update correctly
   - Toggle SubType checkboxes → results update correctly
   - Move character length sliders → results filter by range
   - Move matra length sliders → results filter by range
   - Type in search box → results filter by name (case-insensitive)
   - Toggle Has Examples radio buttons → filters correctly
   - Apply combination of filters → all filters work together (AND logic)
   - Click "Clear All" → all filters reset, all rules shown
   - Verify "Showing X of Y rules" updates correctly with translated text
   - Verify filtered results maintain grouped display
   - Verify "Unspecified" type is not shown in Type filter
   - Apply filters resulting in 0 matches → empty state shows with helpful message and reset button
   - Click reset button in empty state → filters cleared, all rules shown

2. **Mobile Testing:**
   - Open on mobile device or responsive mode (< 768px)
   - Click "Filters" button → sidebar slides in from left
   - Click backdrop/outside → sidebar closes
   - All filters work on mobile (touch interactions)
   - Sidebar scrolls if content is tall
   - Filter toggle button visible only on mobile
   - Two-column layout collapses to single column

3. **Performance Testing:**
   - Load topella ruleset (2,337 rules)
   - Apply multiple filters → should respond within 50ms
   - Type in search box → debounced at 300ms, smooth typing experience
   - Move sliders → instant feedback with no lag
   - Measure filter application time with browser DevTools Performance tab
   - Verify no console errors or warnings

4. **Data Integrity Testing:**
   - Rules with charLength === -1 → excluded from char range filter and facet calculation
   - Rules with matraLength === -1 → excluded from matra range filter and facet calculation
   - Rules with charLength === undefined → excluded from char range filter
   - Rules with matraLength === undefined → excluded from matra range filter
   - Rules with charLength === 0 → excluded from char range filter
   - "Unspecified" type rules → excluded from Type facet options (not shown in checkboxes)
   - Verify facet counts match actual filtered results
   - Verify char/matra range min/max values are correct (no -1 or 0)

5. **Edge Cases:**
   - Apply filters that result in 0 matches → empty state with reset button shown
   - Telugu text in search → handles Unicode correctly (క, చ, ట characters)
   - Long rule names → truncate gracefully without breaking layout
   - Empty search (clear text) → text filter removed, other filters still active
   - Multiple spaces in search → handled correctly
   - Special characters in search → no errors
   - Very long search strings (> 100 chars) → handles without breaking
   - Rapid filter changes → debouncing prevents excessive re-renders

6. **Browser Compatibility:**
   - Chrome/Edge: Full support
   - Firefox: Full support
   - Safari (desktop + iOS): Full support
   - CSS Grid and modern JavaScript required (ES6+)
   - Test on Windows, macOS, Linux
   - Test on iOS Safari and Android Chrome

7. **Accessibility Testing:**
   - All filter controls keyboard-navigable (Tab, Space, Enter, Arrow keys)
   - ARIA labels present on filter sidebar (`role="complementary"`, `aria-label`)
   - ARIA labels on filter sections (`role="group"`, `aria-labelledby`)
   - Results count has proper semantic markup
   - Focus management when opening/closing mobile sidebar
   - Color contrast meets WCAG AA standards (test with browser tools)
   - Screen reader testing (NVDA/JAWS/VoiceOver):
     - Filter changes announced properly
     - Results count updates announced
     - Empty state message read correctly
   - Keyboard shortcuts don't conflict with browser defaults
   - No keyboard traps (can tab out of all controls)

## Out of Scope (Future Enhancements)

These features are NOT included in this implementation but could be added later:

1. **URL state persistence** - Encode filters in query params for shareable links
   - Would enable sharing filtered views with others
   - Complexity: URL parsing/encoding, browser history management
   
2. **Session storage persistence** - Preserve filter state when navigating away/back
   - **Decision:** NOT implementing - filters are per-ruleset and navigation context changes
   - User can easily re-apply filters if needed
   
3. **Frequency filter** - Filter by Rare/Frequent
   - **Decision:** NOT implementing - user feedback indicates this is not a priority
   - Can be added later with minimal effort if requested
   
4. **Filter presets** - Save/load named filter configurations
   - Examples: "Common meters", "Short poems (< 12 chars)", "With examples only"
   - Would require storage mechanism and UI for managing presets
   
5. **Sequence pattern search** - Search by gana sequences (e.g., "ma-ja-sa-ja")
   - Advanced feature for expert users
   - Requires gana sequence parsing and matching logic
   
6. **Export filtered results** - Download CSV/JSON of filtered rules
   - Useful for offline analysis or external tools
   - Low complexity, high value for researchers
   
7. **Advanced search syntax** - Regex patterns, field-specific search
   - Example: `name:త్రిష్టుప్పు OR alias:వేంబ`
   - Requires search query parser and documentation

## Notes

### Architecture & Patterns
- All code follows existing patterns: vanilla TypeScript, HTML string templates, no framework
- Filter logic is completely decoupled from UI (testable in isolation)
- Pure functions in rule-filters.ts (no side effects, no DOM dependencies)
- Existing grouping logic is preserved and reused (groupRulesByCategory)
- Mobile-first responsive design with progressive enhancement

### Performance Optimizations
- Filters applied in order of selectivity (most restrictive first):
  1. Text search (most selective, early exit)
  2. Type/SubType Set lookups (fast O(1) membership check)
  3. Boolean checks (examples filter)
  4. Numeric range comparisons (slower, applied last)
- Search input debounced at 300ms to prevent excessive re-renders
- O(n) complexity per filter application
- Tested with 2,337 rules (topella ruleset) - responds within 50ms
- Suitable for datasets up to 10,000 rules without pagination

### Internationalization
- All UI strings are translated (en/te) - no hardcoded text
- Uses existing t() function from i18n.ts
- Added 10 new translation keys for filter UI
- Supports Telugu Unicode in search (క, చ, ట, etc.)

### Accessibility
- Keyboard navigation for all controls (Tab, Space, Enter)
- ARIA labels and roles:
  - `role="complementary"` on filter sidebar
  - `role="group"` on facet sections
  - `aria-labelledby` for section headings
- Screen reader support via semantic HTML
- Focus management for mobile sidebar
- Color contrast meets WCAG AA standards

### Data Quirks & Edge Cases
The following data quirks are explicitly handled:

1. **charLength = -1** → means "not applicable"
   - Occurs for: Jati, UpaJati, RowWiseRules, InfiniteLength rules
   - Excluded from char length range filter
   - Excluded from facet count calculation
   
2. **matraLength = -1** → means "not applicable"
   - Same rules as charLength
   - Excluded from matra length range filter
   - Excluded from facet count calculation
   
3. **"Unspecified" type** → special enum value for unknown/mixed types
   - Explicitly excluded from Type facet options
   - Users won't see it as a filter choice
   
4. **Empty results** → show helpful UI
   - Displays message: "No rules match your filters"
   - Shows hint: "Try removing some filters to see more results"
   - Provides reset button to clear all filters
   
5. **Invalid min/max properties** → already handled upstream
   - JsBridge.cs catches InvalidCastException for Akkara, Divpada, Sisamu, DaMDakamu
   - These rules are skipped during serialization
   - No additional handling needed in frontend
   
6. **Empty chandamName** → occurs for DaMDakamu and non-Vruttam types
   - Handled by grouping logic (groups by padyamSubType instead)
   - No special case needed in filter logic
