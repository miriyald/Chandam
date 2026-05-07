/**
 * Helper functions for rule creator page
 */
import type { ValidationResult, RuleDto } from '../services/storage/rule-dto';
import { customRulesService } from '../services/storage/custom-rules-service';
import { t } from '../i18n';
import { MAX_RULE_NAME_LENGTH, RULE_NAME_PATTERN } from './rule-creator-constants';

/**
 * Parse comma-separated yati input into array of numbers
 */
export function parseYatiInput(input: string): number[] {
  if (!input || !input.trim()) {
    return [];
  }

  return input
    .split(',')
    .map(v => parseInt(v.trim(), 10))
    .filter(v => !isNaN(v) && v > 0);
}

/**
 * Collect yati values from all row inputs
 */
export function collectYatiFromRows(rows: NodeListOf<Element>): number[][] {
  const yati: number[][] = [];

  rows.forEach((_, index) => {
    const rowNum = index + 1;
    const yatiInput = document.getElementById(`yati-${rowNum}`) as HTMLInputElement;

    if (yatiInput?.value.trim()) {
      const values = parseYatiInput(yatiInput.value);
      if (values.length > 0) {
        yati.push(values);
      }
    }
  });

  return yati;
}

/**
 * Generate unique identifier from rule name using djb2 hash algorithm
 */
export function generateIdentifierFromName(name: string): string {
  // Normalize and sanitize
  const sanitized = name.trim().toLowerCase();

  // djb2 hash algorithm (better distribution than simple sum)
  let hash = 5381;
  for (let i = 0; i < sanitized.length; i++) {
    hash = ((hash << 5) + hash) + sanitized.charCodeAt(i);
  }

  // Ensure positive 31-bit integer
  const positiveHash = Math.abs(hash) & 0x7FFFFFFF;
  return `custom-${positiveHash}`;
}

/**
 * Validate rule data before submission
 */
export async function validateRule(ruleDto: RuleDto): Promise<ValidationResult> {
  const errors: string[] = [];

  // Name validation
  if (!ruleDto.Name || ruleDto.Name.trim() === '') {
    errors.push(t('creator_validation_name'));
  } else {
    if (ruleDto.Name.length > MAX_RULE_NAME_LENGTH) {
      errors.push(t('creator_validation_name_length').replace('{max}', String(MAX_RULE_NAME_LENGTH)));
    }

    if (!RULE_NAME_PATTERN.test(ruleDto.Name)) {
      errors.push(t('creator_validation_name_invalid'));
    }

    // Check for duplicate identifiers
    const exists = await customRulesService.ruleExists(ruleDto.Identifier);
    if (exists) {
      errors.push(t('creator_validation_name_exists'));
    }
  }

  // Gana validation
  if (!ruleDto.Rules || ruleDto.Rules.length === 0) {
    errors.push(t('creator_validation_ganas'));
  } else {
    // Check if first row has ganas
    if (ruleDto.Rules[0].length === 0) {
      errors.push(t('creator_validation_ganas'));
    }
  }

  // Lines validation
  if (ruleDto.Lines < 1) {
    errors.push(t('creator_validation_lines_min'));
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get element by ID with type safety
 */
export function getElement<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Get element by ID or throw error
 */
export function getRequiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T;
  if (!element) {
    throw new Error(`Required element #${id} not found`);
  }
  return element;
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
