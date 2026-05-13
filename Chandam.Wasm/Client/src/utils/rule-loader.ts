import { WasmBridge } from '../wasm-bridge';
import { CustomRulesLoader } from '../services/custom-rules-loader';

let _loadedRulesFile: string | null = null;

export function invalidatePredefinedCache(): void {
  _loadedRulesFile = null;
}

/**
 * Loads a rule set via WASM bridge, logging errors without throwing.
 * Shared by all page modules that need to load a rule set before rendering.
 * Skips reload if the same rulesFile is already active.
 */
export async function loadRuleSet(rulesFile: string, examplesFile: string): Promise<void> {
  if (rulesFile === _loadedRulesFile) {
    return;
  }

  try {
    CustomRulesLoader.invalidateCache();
    const result = await WasmBridge.reloadRules(rulesFile, examplesFile);
    if (!result.success) {
      console.error('Failed to load rules:', result.errorMessage);
    } else {
      _loadedRulesFile = rulesFile;
    }
  } catch (err) {
    console.error('Failed to load rule set:', err);
  }
}
