import { WasmBridge } from '../wasm-bridge';
import { CustomRulesLoader } from '../services/custom-rules-loader';

/**
 * Loads a rule set via WASM bridge, logging errors without throwing.
 * Shared by all page modules that need to load a rule set before rendering.
 */
export async function loadRuleSet(rulesFile: string, examplesFile: string): Promise<void> {
  try {
    CustomRulesLoader.invalidateCache();
    const result = await WasmBridge.reloadRules(rulesFile, examplesFile);
    if (!result.success) {
      console.error('Failed to load rules:', result.errorMessage);
    }
  } catch (err) {
    console.error('Failed to load rule set:', err);
  }
}
