/**
 * Custom rules loader service
 * Loads custom rulesets from browser storage into WASM engine
 */
import { customRulesService } from './storage/custom-rules-service';
import type { CustomRuleset } from './storage/models';
import { invalidatePredefinedCache } from '../utils/rule-loader';

declare const DotNet: any;

export class CustomRulesLoader {
  private static _loadedRulesetId: string | null = null;
  private static _loadedRulesetHash: number = 0;

  /**
   * Load custom ruleset from storage by ID.
   * Skips re-loading if the same ruleset (same ID and rule count) is already active.
   */
  static async loadCustomRuleset(rulesetId: string, force = false): Promise<boolean> {
    try {
      const customRuleset = await customRulesService.getCustomRuleset(rulesetId);

      if (!customRuleset || !customRuleset.rules || customRuleset.rules.length === 0) {
        console.log(`No custom ruleset found with ID: ${rulesetId}`);
        return false;
      }

      const hash = customRuleset.rules.length * 31 + (customRuleset.updatedAt ?? 0);
      if (!force && this._loadedRulesetId === rulesetId && this._loadedRulesetHash === hash) {
        return true;
      }

      const result = await this.loadRulesetIntoWasm(customRuleset);
      if (result) {
        this._loadedRulesetId = rulesetId;
        this._loadedRulesetHash = hash;
      }
      return result;
    } catch (error) {
      console.error(`Error loading custom ruleset ${rulesetId}:`, error);
      return false;
    }
  }

  static invalidateCache(): void {
    this._loadedRulesetId = null;
    this._loadedRulesetHash = 0;
  }

  /**
   * Load favorites collection from storage
   */
  static async loadFavoritesCollection(): Promise<boolean> {
    return await this.loadCustomRuleset('custom-fav');
  }

  /**
   * Check if a custom ruleset exists
   */
  static async hasCustomRuleset(rulesetId: string): Promise<boolean> {
    const ruleset = await customRulesService.getCustomRuleset(rulesetId);
    return ruleset !== null && ruleset.rules.length > 0;
  }

  /**
   * Load ruleset into WASM engine
   */
  private static async loadRulesetIntoWasm(ruleset: CustomRuleset): Promise<boolean> {
    try {
      // Convert to RuleSetDto format expected by C#
      const ruleSetJson = JSON.stringify({
        Identifier: ruleset.id,
        Name: ruleset.name,
        Description: ruleset.description,
        Rules: ruleset.rules
      });

      const result = await DotNet.invokeMethodAsync('Chandam.Wasm', 'LoadCustomRules', ruleSetJson);
      const response = JSON.parse(result);

      if (response.success) {
        invalidatePredefinedCache();
        console.log(`Loaded ${response.ruleCount} rules from custom ruleset "${ruleset.name}"`);
        return true;
      } else {
        console.error('Failed to load custom rules:', response.errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error loading rules into WASM:', error);
      return false;
    }
  }
}
