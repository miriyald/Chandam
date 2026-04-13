/**
 * Custom rules loader service
 * Loads custom rulesets from browser storage into WASM engine
 */
import { storageService } from './storage/storage-service';
import type { CustomRuleset } from './storage/models';

declare const DotNet: any;

export class CustomRulesLoader {
  /**
   * Load custom ruleset from storage by ID
   */
  static async loadCustomRuleset(rulesetId: string): Promise<boolean> {
    try {
      await storageService.init();
      const customRuleset = await storageService.indexedDB.getCustomRuleset(rulesetId);

      if (!customRuleset || !customRuleset.rules || customRuleset.rules.length === 0) {
        console.log(`No custom ruleset found with ID: ${rulesetId}`);
        return false;
      }

      return await this.loadRulesetIntoWasm(customRuleset);
    } catch (error) {
      console.error(`Error loading custom ruleset ${rulesetId}:`, error);
      return false;
    }
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
    await storageService.init();
    const ruleset = await storageService.indexedDB.getCustomRuleset(rulesetId);
    return ruleset !== undefined && ruleset.rules.length > 0;
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
