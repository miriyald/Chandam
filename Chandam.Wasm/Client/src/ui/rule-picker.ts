import type { RuleSummary } from '../types';

export function renderRulePicker(rules: RuleSummary[], containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Group by type
  const grouped = rules.reduce((acc, rule) => {
    const type = rule.padyamType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(rule);
    return acc;
  }, {} as Record<string, RuleSummary[]>);

  // Build select dropdown
  const select = document.createElement('select');
  select.id = 'rule-select';
  select.className = 'rule-picker';

  Object.keys(grouped).sort().forEach(type => {
    const optgroup = document.createElement('optgroup');
    optgroup.label = type;

    grouped[type].forEach(rule => {
      const option = document.createElement('option');
      option.value = rule.identifier;
      option.textContent = `${rule.name} (${rule.frequency})`;
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
