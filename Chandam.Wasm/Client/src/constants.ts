/**
 * Centralized application constants and limits
 */

// External URLs
export const GITHUB_REPO_URL = 'https://github.com/miriyald/chandam';

// Storage limits
export const MAX_POEMS = 20;
export const MAX_FAVORITES = 50;
export const MAX_CUSTOM_RULES = 50;

// UI debounce timings (ms)
export const SEARCH_DEBOUNCE_MS = 300;
export const EDITOR_AUTOSAVE_DEBOUNCE_MS = 1000;

// WASM initialization
export const WASM_INIT_TIMEOUT_MS = 10_000;

// IndexedDB
export const DB_NAME = 'ChandamDB';

// Storage keys
export const STORAGE_KEYS = {
  UI_LANGUAGE: 'chandam-ui-lang',
  USER_ID: 'chandam:userId',
  STORAGE_VERSION: 'chandam:storage:version',
  POEMS: 'poems:default',
  FAVORITES: 'favorites',
  FAV_RULESET: 'custom-rulesets:custom-fav',
  CUSTOM_RULESETS: 'custom-rulesets',
  CUSTOM_RULES_ID: 'custom-rules',
  KB_SCHEME: 'chandam:kb-scheme',
} as const;
