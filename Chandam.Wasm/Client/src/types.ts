export interface RuleSummary {
  identifier: string;
  name: string;
  padyamType: string;
  padyamSubType: string;
  frequency: string;
  lines: number;
}

export interface DetermineResponse {
  matches: ChandamMatch[];
  success: boolean;
  errorMessage?: string;
}

export interface ChandamMatch {
  rule: RuleInfo;
  score: number;
  total: number;
  matchPercentage: number;
  isMatched: boolean;
  errors?: MatchError[];
  renderedHtml?: string;
  renderedText?: string;
  renderedMarkdown?: string;
}

export interface RuleInfo {
  identifier: string;
  name: string;
  description: string;
  padyamType: string;
  padyamSubType: string;
  frequency: string;
  lines: number;
  ganas?: string;
  yati?: string;
  prasa?: string;
  examples?: PoemExample[];
}

export interface MatchError {
  line: number;
  position: number;
  mismatchType: string;
  mismatchDescription: string;
  expected: string;
  actual: string;
  remarks?: string;
}

export interface PoemExample {
  text: string;
  author?: string;
  source?: string;
}

export interface TryMatchResponse {
  match: ChandamMatch;
  success: boolean;
  errorMessage?: string;
}

export interface ScoresResponse {
  scores: ScoreEntry[];
  totalRulesEvaluated: number;
  success: boolean;
  errorMessage?: string;
}

export interface ScoreEntry {
  ruleId: string;
  ruleName: string;
  score: number;
  total: number;
  matchPercentage: number;
}
