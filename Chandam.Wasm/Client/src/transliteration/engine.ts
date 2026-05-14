import type { IndicScript, RomanScheme, SchemeId, SchemeTable } from './types';
import { SCRIPT_CONFIG, VOWEL_MAP, CONSONANT_MAP, MARK_MAP } from './tables/unicode-map';
import { RTS_TABLE } from './tables/rts';

function getTable(scheme: RomanScheme): SchemeTable {
  switch (scheme) {
    case 'rts': return RTS_TABLE;
    default: return RTS_TABLE;
  }
}

function chr(codePoint: number): string {
  return String.fromCharCode(codePoint);
}

/**
 * Convert transliterated Roman text to Unicode Indic script.
 * Uses greedy longest-match (3->2->1 chars) against the scheme's hash table.
 */
export function trToUc(input: string, scheme: RomanScheme, script: IndicScript): string {
  const table = getTable(scheme);
  const config = SCRIPT_CONFIG[script];
  const base = config.baseCodePoint;
  const halant = base + config.halantOffset;
  const hash = table.hash;

  let output = '';
  let matraPending = false;
  let i = 0;
  const len = input.length;

  while (i < len) {
    let matched = false;

    // Greedy match: try 3, 2, 1 character substrings
    for (let size = 3; size > 0; size--) {
      if (i + size > len) continue;
      const substr = input.substring(i, i + size);
      const code = hash[substr];

      if (code !== undefined) {
        if (Array.isArray(code)) {
          for (const c of code) {
            output += encodePhoneme(c, base, halant, matraPending);
            matraPending = isConsonant(c);
          }
        } else {
          output += encodePhoneme(code, base, halant, matraPending);
          matraPending = isConsonant(code);
        }
        i += size;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // No match: emit halant if consonant pending, then passthrough
      if (matraPending) {
        output += chr(halant);
        matraPending = false;
      }
      output += input[i];
      i++;
    }
  }

  // Final: if a consonant is pending at end of string, add halant
  if (matraPending) {
    output += chr(halant);
  }

  return output;
}

function isConsonant(code: number): boolean {
  return code >= 101 && code <= 147;
}

function isVowel(code: number): boolean {
  return code >= 2 && code <= 19;
}

/**
 * Encode a single phoneme code to Unicode character(s).
 * Handles the matra/halant state logic.
 */
function encodePhoneme(code: number, base: number, halant: number, matraPending: boolean): string {
  // Special marks (anusvara, visarga, etc.)
  if (code >= 200 && code <= 205) {
    const offset = MARK_MAP[code];
    if (offset === undefined) return '';
    let result = '';
    if (matraPending) {
      // Consonant was pending - no halant needed, mark attaches directly
    }
    result += chr(base + offset);
    return result;
  }

  // Vowels
  if (isVowel(code)) {
    const vowel = VOWEL_MAP[code];
    if (!vowel) return '';

    if (matraPending) {
      // After a consonant: use dependent matra form
      if (code === 2) {
        // 'a' is inherent - no matra needed
        return '';
      }
      return chr(base + vowel[1]);
    } else {
      // Standalone: use independent vowel form
      return chr(base + vowel[0]);
    }
  }

  // Consonants
  if (isConsonant(code)) {
    const offset = CONSONANT_MAP[code];
    if (offset === undefined) return '';

    let result = '';
    if (matraPending) {
      // Previous consonant needs halant before this one
      result += chr(halant);
    }
    result += chr(base + offset);
    return result;
  }

  // Control codes
  if (code === 252) return '';  // separator
  if (code === 253 || code === 254) {
    // Explicit halant
    if (matraPending) return chr(halant);
    return '';
  }
  if (code === 255) return '';  // mode toggle (handled at IME level)

  return '';
}

/**
 * Convert between two Unicode Indic scripts using offset arithmetic.
 */
export function ucToUc(input: string, srcScript: IndicScript, tgtScript: IndicScript): string {
  if (srcScript === tgtScript) return input;

  const srcBase = SCRIPT_CONFIG[srcScript].baseCodePoint;
  const tgtBase = SCRIPT_CONFIG[tgtScript].baseCodePoint;
  const srcEnd = srcBase + 0x7F;

  let output = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    if (ch >= srcBase && ch <= srcEnd) {
      output += chr(tgtBase + (ch - srcBase));
    } else {
      output += input[i];
    }
  }
  return output;
}

/**
 * Convert Unicode Indic text to transliterated Roman.
 */
export function ucToTr(input: string, srcScript: IndicScript, scheme: RomanScheme): string {
  const table = getTable(scheme);
  const config = SCRIPT_CONFIG[srcScript];
  const base = config.baseCodePoint;
  const halantCode = base + config.halantOffset;
  const arr = table.array;

  let output = '';
  let matraPending = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);

    if (ch < base || ch > base + 0x7F) {
      if (matraPending) {
        output += 'a';
        matraPending = false;
      }
      output += input[i];
      continue;
    }

    const offset = ch - base;

    // Halant
    if (offset === config.halantOffset) {
      matraPending = false;
      continue;
    }

    // Consonant range: 0x15-0x39
    if (offset >= 0x15 && offset <= 0x39) {
      if (matraPending) {
        output += 'a';
      }
      const idx = offset - base + base; // Direct offset lookup
      if (offset < arr.length && arr[offset]) {
        output += arr[offset];
      }
      matraPending = true;
      continue;
    }

    // Vowel sign (matra) range: 0x3E-0x4C, 0x62-0x63
    if ((offset >= 0x3E && offset <= 0x4C) || (offset >= 0x62 && offset <= 0x63)) {
      matraPending = false;
      // Find the matching vowel in array by scanning
      if (offset < arr.length && arr[offset]) {
        output += arr[offset];
      }
      continue;
    }

    // Standalone vowel, mark, or other
    if (matraPending) {
      output += 'a';
      matraPending = false;
    }
    if (offset < arr.length && arr[offset]) {
      output += arr[offset];
    }
  }

  if (matraPending) {
    output += 'a';
  }

  return output;
}

/**
 * Main conversion dispatcher.
 * Scheme format: "type:script" (e.g., "tr:rts", "uc:te")
 */
export function convert(input: string, inScheme: SchemeId, outScheme: SchemeId): string {
  if (!input) return '';
  if (inScheme === outScheme) return input;

  const [inType, inLang] = inScheme.split(':') as [string, string];
  const [outType, outLang] = outScheme.split(':') as [string, string];

  if (inType === 'tr' && outType === 'uc') {
    return trToUc(input, inLang as RomanScheme, outLang as IndicScript);
  }
  if (inType === 'uc' && outType === 'uc') {
    return ucToUc(input, inLang as IndicScript, outLang as IndicScript);
  }
  if (inType === 'uc' && outType === 'tr') {
    return ucToTr(input, inLang as IndicScript, outLang as RomanScheme);
  }
  if (inType === 'tr' && outType === 'tr') {
    // TR->TR: go through Unicode as intermediate
    const intermediate = trToUc(input, inLang as RomanScheme, 'te');
    return ucToTr(intermediate, 'te', outLang as RomanScheme);
  }

  return input;
}
