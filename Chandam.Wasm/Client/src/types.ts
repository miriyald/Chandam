export interface RuleSummary {
  identifier: string;
  name: string;
  padyamType: string;
  padyamSubType: string;
  frequency: string;
  lines: number;
}

export interface RuleSummaryDetailed extends RuleSummary {
  chandamName?: string;
  charLength?: number;
  matraLength?: number;
  min?: number;
  max?: number;
  sequence?: string;
  shortName?: string;
  alias?: string;
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
  html?: string;        // Gana vibhajana table
  markdown?: string;    // Structured summary
  beautified?: string;  // Decorated poem HTML
}

export interface RuleInfo {
  identifier: string;
  name: string;
  description?: string;
  padyamType: string;
  padyamSubType: string;
  ruleType?: string;
  frequency: string;
  lines: number;
  threshold?: number;

  // Pattern properties
  sequence?: string;
  matraSeries?: string;

  // Yati/Prasa properties
  yati?: number[][];
  yatiMode?: string;
  prasa?: boolean;
  prasaYati?: boolean;
  anthyaPrasa?: boolean;
  reverseYati?: boolean;
  onlyPrasaYati?: boolean;
  yatiRecycle?: boolean;

  // Calculated fields
  shortName?: string;
  alias?: string;
  chandamName?: string;
  charLength?: number;
  matraLength?: number;
  min?: number;
  max?: number;

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
  date?: string;
  reference?: string;
  notes?: string;
}

export interface TryMatchResponse {
  isMatch: boolean;
  match?: ChandamMatch;
  errorMessage?: string;
}

export interface ScoresResponse {
  scores: ChandamScore[];
  totalRulesEvaluated: number;
  errorMessage?: string;
}

export interface ChandamScore {
  identifier: string;
  name: string;
  matchPercentage: number;
  padyamType: string;
  frequency: string;
}
