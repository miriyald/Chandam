/**
 * Storage models for browser persistence
 */

export interface EditorState {
  text: string;
  language: string;
  matchYati: boolean;
  matchPrasa: boolean;
  selectedRule?: string;
}

export interface UIState {
  ruleSet: string;          // 'frequent' | 'complete' | 'custom-fav' | 'custom-1'...
  autoDetect: boolean;
  lastVisited?: string;
}

export interface FavoriteEntry {
  id: string;               // Composite: "${ruleSetId}:${ruleId}"
  ruleSetId: string;        // Source ruleset
  ruleId: string;           // Rule identifier
  ruleData: any;            // Full RuleDto (copied)
  favoritedAt: number;      // Timestamp
}

export interface CustomRuleset {
  id: string;               // 'custom-fav', 'custom-1', 'custom-2'...
  name: string;
  description: string;
  rules: any[];             // RuleDto[] (use any to avoid C# type coupling)
  type: 'favorites' | 'custom';  // Type flag
  createdAt: number;
  updatedAt: number;
}
