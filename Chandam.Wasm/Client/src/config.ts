export interface RuleSet {
  id: string;
  name: string;
  rulesFile: string;
  examplesFile: string;
  description: string;
  ruleCount: number;
}

export const RULE_SETS: RuleSet[] = [
  {
    id: 'frequent',
    name: 'Frequent Rules',
    rulesFile: 'data/chandam-rules.min.json.gz',
    examplesFile: 'data/chandam-examples.min.json.gz',
    description: 'Most common Telugu poetry meters',
    ruleCount: 14
  },

  {
    id: 'complete',
    name: 'Complete Telugu',
    rulesFile: 'data/telugu-complete.min.json.gz',
    examplesFile: 'data/telugu-complete-examples.min.json.gz',
    description: 'Comprehensive collection with examples',
    ruleCount: 379
  },
  {
    id: 'topella',
    name: 'Topella Collection',
    rulesFile: 'data/topella.min.json.gz',
    examplesFile: '',
    description: '2337 rare Telugu Vruttam meters',
    ruleCount: 2337
  }
];

export const DEFAULT_RULE_SET = 'frequent';

export function getRuleSet(id: string): RuleSet | undefined {
  return RULE_SETS.find(rs => rs.id === id);
}

/**
 * Get ruleset configuration (predefined or custom)
 * Async version that checks IndexedDB for custom rulesets
 */
export async function getRuleSetAsync(id: string): Promise<RuleSet | undefined> {
  // First check predefined rulesets
  const predefined = getRuleSet(id);
  if (predefined) return predefined;

  // Check custom rulesets in IndexedDB
  const { storageService } = await import('./services/storage/storage-service');
  await storageService.init();
  const customRuleset = await storageService.indexedDB.getCustomRuleset(id);

  if (customRuleset) {
    // Convert CustomRuleset to RuleSet format
    return {
      id: customRuleset.id,
      name: customRuleset.name,
      rulesFile: '', // Custom rulesets don't have files
      examplesFile: '',
      description: customRuleset.description,
      ruleCount: customRuleset.rules.length
    };
  }

  return undefined;
}
