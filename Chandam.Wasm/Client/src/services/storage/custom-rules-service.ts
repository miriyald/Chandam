/**
 * Custom rules management service
 */
import { storageService } from './storage-service';
import type { CustomRuleset } from './models';
import type { RuleDto } from './rule-dto';

const CUSTOM_RULESETS_KEY = 'custom-rulesets';
const CUSTOM_RULES_ID = 'custom-rules';
const MAX_CUSTOM_RULES = 50;

export class CustomRulesService {
  async createCustomRule(ruleData: RuleDto): Promise<void> {
    await storageService.init();
    const rulesets = await this.loadRulesets();
    let collection = rulesets.find(r => r.id === CUSTOM_RULES_ID);

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
      rulesets.push(collection);
    }

    if (collection.rules.length >= MAX_CUSTOM_RULES) {
      throw new Error(`Maximum ${MAX_CUSTOM_RULES} custom rules reached`);
    }

    collection.rules.push(ruleData);
    collection.updatedAt = Date.now();
    collection.description = `${collection.rules.length} custom ${collection.rules.length === 1 ? 'rule' : 'rules'} created`;

    await this.saveRulesets(rulesets);
  }

  async getAllCustomRules(): Promise<RuleDto[]> {
    await storageService.init();
    const collection = await this.getCustomRulesCollection();
    return collection ? (collection.rules as RuleDto[]) : [];
  }

  async getCustomRulesCount(): Promise<number> {
    const collection = await this.getCustomRulesCollection();
    return collection ? collection.rules.length : 0;
  }

  async deleteCustomRule(ruleId: string): Promise<void> {
    await storageService.init();
    const rulesets = await this.loadRulesets();
    const collection = rulesets.find(r => r.id === CUSTOM_RULES_ID);
    if (!collection) return;

    collection.rules = collection.rules.filter((rule: RuleDto) => rule.Identifier !== ruleId);
    collection.updatedAt = Date.now();
    collection.description = `${collection.rules.length} custom ${collection.rules.length === 1 ? 'rule' : 'rules'} created`;

    if (collection.rules.length === 0) {
      const idx = rulesets.indexOf(collection);
      rulesets.splice(idx, 1);
    }

    await this.saveRulesets(rulesets);
  }

  async getCustomRulesCollection(): Promise<CustomRuleset | null> {
    await storageService.init();
    const rulesets = await this.loadRulesets();
    return rulesets.find(r => r.id === CUSTOM_RULES_ID) ?? null;
  }

  async getCustomRuleset(id: string): Promise<CustomRuleset | null> {
    await storageService.init();
    const rulesets = await this.loadRulesets();
    return rulesets.find(r => r.id === id) ?? null;
  }

  async getAllCustomRulesets(): Promise<CustomRuleset[]> {
    await storageService.init();
    return this.loadRulesets();
  }

  async addExampleToRule(ruleId: string, exampleText: string): Promise<boolean> {
    await storageService.init();
    const rulesets = await this.loadRulesets();
    const collection = rulesets.find(r => r.id === CUSTOM_RULES_ID);
    if (!collection) return false;

    const rule = collection.rules.find((r: RuleDto) => r.Identifier === ruleId);
    if (!rule) return false;

    const normalized = exampleText.trim().replace(/\s+/g, ' ');
    const isDuplicate = rule.Examples.some(
      (ex: string) => ex.trim().replace(/\s+/g, ' ') === normalized
    );
    if (isDuplicate) return false;

    rule.Examples.push(exampleText.trim());
    collection.updatedAt = Date.now();
    await this.saveRulesets(rulesets);
    return true;
  }

  async getCustomRule(ruleId: string): Promise<RuleDto | null> {
    const rules = await this.getAllCustomRules();
    return rules.find((r: RuleDto) => r.Identifier === ruleId) ?? null;
  }

  async ruleExists(ruleId: string): Promise<boolean> {
    const rules = await this.getAllCustomRules();
    return rules.some((rule: RuleDto) => rule.Identifier === ruleId);
  }

  private async loadRulesets(): Promise<CustomRuleset[]> {
    return await storageService.indexedDB.getData<CustomRuleset[]>(CUSTOM_RULESETS_KEY) ?? [];
  }

  private async saveRulesets(rulesets: CustomRuleset[]): Promise<void> {
    await storageService.indexedDB.saveData(CUSTOM_RULESETS_KEY, rulesets);
  }
}

// Singleton instance
export const customRulesService = new CustomRulesService();
