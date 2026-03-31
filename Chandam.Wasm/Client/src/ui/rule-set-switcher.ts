import { RULE_SETS, getRuleSet } from '../config';
import { WasmBridge } from '../wasm-bridge';
import { renderRulePicker } from './rule-picker';

export function renderRuleSetSwitcher(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const select = document.createElement('select');
  select.id = 'rule-set-select';
  select.className = 'rule-set-switcher';

  RULE_SETS.forEach(ruleSet => {
    const option = document.createElement('option');
    option.value = ruleSet.id;
    option.textContent = `${ruleSet.name} (${ruleSet.sizeKB}KB)`;
    select.appendChild(option);
  });

  // Handle change
  select.addEventListener('change', async () => {
    const selectedId = select.value;
    await switchRuleSet(selectedId);
  });

  container.appendChild(select);
}

export async function switchRuleSet(ruleSetId: string) {
  const ruleSet = getRuleSet(ruleSetId);
  if (!ruleSet) {
    console.error(`Rule set not found: ${ruleSetId}`);
    return;
  }

  // Show loading indicator
  const indicator = document.getElementById('loading-indicator');
  if (indicator) indicator.style.display = 'block';

  try {
    console.log(`Switching to rule set: ${ruleSet.name}`);

    // Reload rules via WASM bridge
    const result = await WasmBridge.reloadRules(ruleSet.rulesFile, ruleSet.examplesFile);

    if (result.success) {
      // Refresh rule picker
      const rules = await WasmBridge.getAllRules();
      renderRulePicker(rules, 'rule-picker-container');
      console.log(`Loaded ${rules.length} rules from ${ruleSet.name}`);
    } else {
      alert(`Failed to load rules: ${result.errorMessage}`);
    }
  } catch (err) {
    console.error('Failed to switch rule set:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  } finally {
    // Hide loading indicator
    if (indicator) indicator.style.display = 'none';
  }
}
