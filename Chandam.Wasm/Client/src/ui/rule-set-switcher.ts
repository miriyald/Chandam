import { RULE_SETS, getRuleSet } from '../config';
import { WasmBridge } from '../wasm-bridge';
import { renderRulePicker } from './rule-picker';
import { createDynamicLoader } from '../utils/loader';
import { LoadingEvents, LoadingEventType } from '../utils/loading-events';
import { t } from '../i18n';

// Lazy initialization of dynamic loader (only created on first use)
let dynamicLoaderInitialized = false;

function ensureDynamicLoaderInitialized() {
  if (dynamicLoaderInitialized) return;

  // Create container
  const loaderContainer = document.createElement('div');
  loaderContainer.id = 'dynamic-loader-container';
  document.body.appendChild(loaderContainer);

  // Initialize loader (auto-wires to events)
  createDynamicLoader();

  dynamicLoaderInitialized = true;
  console.log('Dynamic loader initialized');
}

export function renderRuleSetSwitcher(containerId: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const select = document.createElement('select');
  select.id = 'rule-set-select';
  select.className = 'rule-set-switcher';

  RULE_SETS.forEach(ruleSet => {
    const option = document.createElement('option');
    option.value = ruleSet.id;
    option.textContent = `${ruleSet.name} (${ruleSet.ruleCount} rules)`;
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

  // Ensure loader is initialized before using it
  ensureDynamicLoaderInitialized();

  // Emit loading started event - loader listens and shows itself
  LoadingEvents.emit(LoadingEventType.LoadingStarted, {
    source: 'rule-set-switch',
    message: `Loading ${ruleSet.name}`
  });

  try {
    console.log(`Switching to rule set: ${ruleSet.name}`);

    // Pure business logic - no UI concerns
    const result = await WasmBridge.reloadRules(ruleSet.rulesFile, ruleSet.examplesFile);

    if (result.success) {
      const rules = await WasmBridge.getAllRules();
      renderRulePicker(rules, 'rule-picker-container');
      console.log(`Loaded ${rules.length} rules from ${ruleSet.name}`);

      // Emit success event
      LoadingEvents.emit(LoadingEventType.LoadingCompleted, {
        source: 'rule-set-switch',
        message: `Loaded ${rules.length} rules`
      });
    } else {
      // Emit failure event
      LoadingEvents.emit(LoadingEventType.LoadingFailed, {
        source: 'rule-set-switch',
        message: result.errorMessage || 'Unknown error'
      });

      alert(`${t('alert_error')}: ${result.errorMessage}`);
    }
  } catch (err) {
    console.error('Failed to switch rule set:', err);

    // Emit failure event
    LoadingEvents.emit(LoadingEventType.LoadingFailed, {
      source: 'rule-set-switch',
      message: err instanceof Error ? err.message : 'Unknown error'
    });

    alert(t('alert_error'));
  }
}
