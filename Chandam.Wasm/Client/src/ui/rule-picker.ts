import type { RuleSummaryDetailed } from '../types';
import { groupRulesByCategory, getSortedGroupKeys } from '../utils/rule-grouping';

export function renderRulePicker(rules: RuleSummaryDetailed[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Group rules by category using shared utility
  const grouped = groupRulesByCategory(rules);
  const sortedKeys = getSortedGroupKeys(grouped);

  // Build select dropdown
  const select = document.createElement('select');
  select.id = 'rule-select';
  select.className = 'rule-picker';

  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = '-- Select a rule --';
  select.appendChild(defaultOption);

  // Render groups
  sortedKeys.forEach(groupKey => {
    const groupRules = grouped.get(groupKey)!;

    const optgroup = document.createElement('optgroup');
    optgroup.label = groupKey; // Just chandamName, no suffix

    groupRules.forEach(rule => {
      const option = document.createElement('option');
      option.value = rule.identifier;
      // Use shortName if available, else name (no frequency)
      option.textContent = rule.shortName || rule.name;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });

  container.innerHTML = '';
  container.appendChild(select);
}

export function getSelectedRule(): string {
  const select = document.getElementById('rule-select') as HTMLSelectElement;
  return select?.value || '';
}
