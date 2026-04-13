import { WasmBridge } from '../wasm-bridge';

/**
 * Loads a rule set via WASM bridge, logging errors without throwing.
 * Shared by all page modules that need to load a rule set before rendering.
 */
export async function loadRuleSet(rulesFile: string, examplesFile: string): Promise<void> {
  try {
    const result = await WasmBridge.reloadRules(rulesFile, examplesFile);
    if (!result.success) {
      console.error('Failed to load rules:', result.errorMessage);
    }
  } catch (err) {
    console.error('Failed to load rule set:', err);
  }
}
