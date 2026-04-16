/**
 * Custom rules management service
 */
import { storageService } from './storage-service';
import type { CustomRuleset } from './models';
import type { RuleDto } from './rule-dto';

const CUSTOM_RULES_ID = 'custom-rules';
const MAX_CUSTOM_RULES = 50;

export class CustomRulesService {
  /**
   * Create a new custom rule and add it to the collection
   */
  async createCustomRule(ruleData: RuleDto): Promise<void> {
    await storageService.init();

    // Get current collection or create new one
    let collection = await this.getCustomRulesCollection();

    if (!collection) {
      collection = {
        id: CUSTOM_RULES_ID,
        name: 'Custom Rules',
        description: '0 custom rules created',
        rules: [],
        type: 'custom',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }

    // Check limit
    if (collection.rules.length >= MAX_CUSTOM_RULES) {
      throw new Error(`Maximum ${MAX_CUSTOM_RULES} custom rules reached`);
    }

    // Add rule to collection
    collection.rules.push(ruleData);
    collection.updatedAt = Date.now();
    collection.description = `${collection.rules.length} custom ${collection.rules.length === 1 ? 'rule' : 'rules'} created`;

    // Save to IndexedDB
    await storageService.indexedDB.saveCustomRuleset(collection);
  }

  /**
   * Get all custom rules
   */
  async getAllCustomRules(): Promise<RuleDto[]> {
    await storageService.init();
    const collection = await this.getCustomRulesCollection();
    return collection ? (collection.rules as RuleDto[]) : [];
  }

  /**
   * Get custom rules count
   */
  async getCustomRulesCount(): Promise<number> {
    await storageService.init();
    const collection = await this.getCustomRulesCollection();
    return collection ? collection.rules.length : 0;
  }

  /**
   * Delete a custom rule by its identifier
   */
  async deleteCustomRule(ruleId: string): Promise<void> {
    await storageService.init();

    const collection = await this.getCustomRulesCollection();
    if (!collection) {
      return; // Nothing to delete
    }

    // Remove rule from collection
    collection.rules = collection.rules.filter((rule: RuleDto) => rule.Identifier !== ruleId);
    collection.updatedAt = Date.now();
    collection.description = `${collection.rules.length} custom ${collection.rules.length === 1 ? 'rule' : 'rules'} created`;

    if (collection.rules.length > 0) {
      // Update collection
      await storageService.indexedDB.saveCustomRuleset(collection);
    } else {
      // Delete empty collection
      await storageService.indexedDB.deleteCustomRuleset(CUSTOM_RULES_ID);
    }
  }

  /**
   * Get the custom rules collection
   */
  async getCustomRulesCollection(): Promise<CustomRuleset | null> {
    await storageService.init();
    try {
      const result = await storageService.indexedDB.getCustomRuleset(CUSTOM_RULES_ID);
      return result ?? null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Check if a rule with this identifier already exists
   */
  async ruleExists(ruleId: string): Promise<boolean> {
    const rules = await this.getAllCustomRules();
    return rules.some((rule: RuleDto) => rule.Identifier === ruleId);
  }
}

// Singleton instance
export const customRulesService = new CustomRulesService();
