/**
 * Storage models for browser persistence
 */

export interface EditorState {
  text: string;
  language: string;
  matchYati: boolean;
  matchPrasa: boolean;
  matchSantiPrasa: boolean;
  matchSoundexSandhi: boolean;
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

export interface CollectionPoem {
  ruleSetId: string;        // e.g., 'frequent', 'complete'
  ruleIdentifier: string;   // e.g., 'utpalamaala'
  ruleName: string;         // rule.name only (NOT alias)
  poemText: string;         // Raw text (for editor / re-analysis)
  beautified: string;       // Pre-rendered HTML
  poemHash: string;         // 16-char short hash for dedup
  addedAt: number;          // Timestamp ms
}

export interface CompressedEntry {
  id: string;               // Well-known key: 'favorites', 'custom-rulesets', 'poems:default'
  data: Uint8Array;         // Gzip-compressed JSON blob
}
