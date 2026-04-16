/**
 * Constants for rule creator page
 */

export const MAX_LINES = 8;
export const MIN_LINES = 1;
export const DEFAULT_LINE_COUNT = 4;
export const MAX_MATRAS = 50;
export const MIN_THRESHOLD = 1;
export const MAX_RULE_NAME_LENGTH = 100;

// Rule name validation pattern (alphanumeric, spaces, Telugu characters, hyphens)
export const RULE_NAME_PATTERN = /^[\w\s\u0C00-\u0C7F\u0C80-\u0CFF\u0900-\u097F-]+$/;

// CSS selectors
export const SELECTORS = {
  PATTERN_ROW: '.pattern-row-inline',
  ADD_GANA_BTN: '.add-gana-btn',
  REMOVE_GANA_BTN: '.remove-gana-btn',
  REMOVE_ROW_BTN: '.remove-row-btn',
} as const;

// Element IDs
export const ELEMENT_IDS = {
  RULE_NAME: 'rule-name',
  PADYAM_TYPE: 'padyam-type',
  GANA_TYPE: 'gana-type',
  SAME_RULES: 'same-rules',
  LINES: 'lines',
  ADD_PADA_BTN: 'add-pada-btn',
  REMOVE_PADA_BTN: 'remove-pada-btn',
  PATTERN_ROWS_CONTAINER: 'pattern-rows-container',
  PRASA: 'prasa',
  PRASA_YATI: 'prasa-yati',
  ANTHYA_PRASA: 'anthya-prasa',
} as const;
