import type { RuleSummaryDetailed } from '../types';
import { groupRulesByCategory, getSortedGroupKeys, getGroupDisplayName } from '../utils/rule-grouping';
import { t } from '../i18n';

/**
 * Renders rule picker list inside the <details> dropdown container
 * Note: This replaces the <select> dropdown with a custom <details> list
 */
export function renderRulePicker(rules: RuleSummaryDetailed[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Group rules by category
  const grouped = groupRulesByCategory(rules);
  const sortedKeys = getSortedGroupKeys(grouped);

  // Build rule list
  const ruleList = document.createElement('div');
  ruleList.className = 'rule-list';

  let firstRule: { id: string; name: string } | null = null;

  sortedKeys.forEach(groupKey => {
    const groupRules = grouped.get(groupKey)!;

    const groupHeader = document.createElement('div');
    groupHeader.className = 'rule-group-header';
    groupHeader.textContent = getGroupDisplayName(groupKey, grouped);
    ruleList.appendChild(groupHeader);

    groupRules.forEach(rule => {
      // Track first rule for default selection
      if (!firstRule) {
        firstRule = {
          id: rule.identifier,
          name: rule.shortName || rule.name
        };
      }

      const ruleItem = document.createElement('div');
      ruleItem.className = 'rule-item';
      ruleItem.textContent = rule.shortName || rule.name;
      ruleItem.dataset.ruleId = rule.identifier;
      ruleItem.dataset.ruleName = rule.shortName || rule.name;

      ruleItem.addEventListener('click', () => {
        selectRule(rule.identifier, rule.shortName || rule.name);
      });

      ruleList.appendChild(ruleItem);
    });
  });

  container.innerHTML = '';
  container.appendChild(ruleList);

  // Initialize and select first rule by default
  initializeRulePicker(firstRule);

  // Close dropdown when clicking outside
  setupClickOutsideHandler();
}

/**
 * Initializes rule picker with optional default selection
 */
function initializeRulePicker(defaultRule?: { id: string; name: string } | null): void {
  const details = document.getElementById('rule-picker-inline') as HTMLDetailsElement;
  const summary = document.getElementById('selected-rule-name');

  if (details && defaultRule) {
    // Auto-select first rule by default
    details.dataset.selectedRule = defaultRule.id;
    if (summary) {
      summary.textContent = `${t('editor_matching_with')} ${defaultRule.name} ▼`;
    }
  } else if (details) {
    // No selection
    details.dataset.selectedRule = '';
    if (summary) {
      summary.textContent = `${t('editor_matching_with')} ${t('editor_select_rule')}`;
    }
  }

  if (details) {
    details.open = false;
  }
}

/**
 * Sets up click outside handler to close dropdown
 */
function setupClickOutsideHandler(): void {
  const details = document.getElementById('rule-picker-inline') as HTMLDetailsElement;
  if (!details) return;

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (details.open && !details.contains(e.target as Node)) {
      details.open = false;
    }
  });
}

/**
 * Selects a rule and updates the UI (internal)
 */
function selectRule(ruleId: string, ruleName: string): void {
  setSelectedRule(ruleId, ruleName);
}

/**
 * Selects a rule and updates the UI (public API)
 * Can be called from other modules to programmatically select a rule
 */
export function setSelectedRule(ruleId: string, ruleName: string): void {
  // Update summary text to show selected rule
  const summary = document.getElementById('selected-rule-name');
  if (summary) {
    summary.textContent = `${t('editor_matching_with')} ${ruleName} ▼`;
    summary.classList.add('has-selection');
  }

  // Store selected rule ID in dataset
  const details = document.getElementById('rule-picker-inline') as HTMLDetailsElement;
  if (details) {
    details.dataset.selectedRule = ruleId;
    details.open = false; // Close dropdown after selection
  }
}

/**
 * Gets the currently selected rule ID
 * @returns Rule identifier, or empty string if none selected
 */
export function getSelectedRule(): string {
  const details = document.getElementById('rule-picker-inline') as HTMLDetailsElement;
  return details?.dataset.selectedRule || '';
}

/**
 * Checks if a rule is currently selected
 */
export function hasRuleSelected(): boolean {
  const ruleId = getSelectedRule();
  return ruleId !== '';
}
