export interface RuleSet {
  id: string;
  name: string;
  rulesFile: string;
  examplesFile: string;
  description: string;
  sizeKB: number;
}

export const RULE_SETS: RuleSet[] = [
  {
    id: 'frequent',
    name: 'Frequent Rules',
    rulesFile: 'data/chandam-rules.min.json',
    examplesFile: 'data/chandam-examples.min.json',
    description: '14 most common rules (fast)',
    sizeKB: 9.3
  },
  {
    id: 'complete',
    name: 'Complete Telugu',
    rulesFile: 'data/telugu-complete.min.json',
    examplesFile: 'data/telugu-complete-examples.min.json',
    description: '379 rules with examples',
    sizeKB: 65
  }
];

export const DEFAULT_RULE_SET = 'frequent';

export function getRuleSet(id: string): RuleSet | undefined {
  return RULE_SETS.find(rs => rs.id === id);
}
