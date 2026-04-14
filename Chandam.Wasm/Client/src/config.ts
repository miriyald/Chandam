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
    id: 'popular',
    name: 'ప్రముఖ ఛందస్సులు',
    description: 'తెలుగులో అత్యంత వాడుకలో ఉన్న ఛందస్సులు',
    rulesFile: 'data/popular-rules.min.json.gz',
    examplesFile: 'data/popular-examples.min.json.gz',
    ruleCount: 14
  },

  {
    id: 'complete',
    name: 'చంధోరత్నావళి',
    description: 'దిలీపు మిరియాల సంకలనం: అనేక చంధస్సు వనరులు మరియూ ముఖ్యంగా కోవెల సంపత్కుమారాచార్య రచనలు',
    rulesFile: 'data/chandam.min.json.gz',
    examplesFile: 'data/chandam-complete-examples.min.json.gz',
    ruleCount: 317
  },
  {
    id: 'topella',
    name: 'అనంతచ్చంధము',
    description: 'శ్రీ తోపెల్ల బాలసుబ్రహ్మణ్య శర్మగారి సంకలనం: అనేక చంధస్సు వనరులు మరియూ స్వయంగా సృజించినవి.',
    rulesFile: 'data/topella.min.json.gz',
    examplesFile: '',
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
