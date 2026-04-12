import { getRuleSet } from '../config';
import { WasmBridge } from '../wasm-bridge';
import { makeUrl } from './url-helpers';

// Validate rule set exists in config
export function validateRuleSet(ruleSetId: string): boolean {
  return getRuleSet(ruleSetId) !== undefined;
}

// Validate rule exists (async - needs WASM call)
export async function validateRule(ruleId: string): Promise<boolean> {
  try {
    await WasmBridge.getRuleInfo(ruleId);
    return true;
  } catch {
    return false;
  }
}

// Handle invalid rule set - redirect to home
export function handleInvalidRuleSet(attemptedSet: string) {
  console.warn(`Invalid rule set: ${attemptedSet}, redirecting to home`);
  window.location.href = makeUrl('/');
}

// Handle invalid rule - redirect to rule set page
export function handleInvalidRule(ruleSet: string, attemptedRule: string) {
  console.warn(`Invalid rule: ${attemptedRule} in ${ruleSet}, redirecting to rule set page`);
  window.location.href = makeUrl(`/compute/${ruleSet}/`);
}
