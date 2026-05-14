import type { IndicScript, ScriptConfig } from '../types';

/**
 * Unicode block base code points for Indic scripts.
 * Source: Unicode Standard, Chapter 12 (publicly available).
 */
export const SCRIPT_CONFIG: Record<IndicScript, ScriptConfig> = {
  te: { baseCodePoint: 0x0C00, halantOffset: 0x4D, overrides: {} },
  kn: { baseCodePoint: 0x0C80, halantOffset: 0x4D, overrides: {} },
  de: { baseCodePoint: 0x0900, halantOffset: 0x4D, overrides: {} },
};

/**
 * Maps internal phoneme codes to Unicode offsets within a script block.
 *
 * Internal code ranges:
 *   1-19: Standalone vowels
 *   101-147: Consonants
 *   200-205: Special marks (anusvara, visarga, etc.)
 *
 * Each entry: [standalone_offset, matra_offset]
 * matra_offset is -1 if no dependent form exists.
 *
 * Derived from public Unicode charts for Indic scripts.
 */

// Vowel mappings: code -> [independent_offset, dependent_matra_offset]
export const VOWEL_MAP: Record<number, [number, number]> = {
  2:  [0x05, 0x3E],  // a  -> అ, (no matra for 'a' - it's inherent)
  3:  [0x06, 0x3E],  // A  -> ఆ, ా
  4:  [0x07, 0x3F],  // i  -> ఇ, ి
  5:  [0x08, 0x40],  // I  -> ఈ, ీ
  6:  [0x09, 0x41],  // u  -> ఉ, ు
  7:  [0x0A, 0x42],  // U  -> ఊ, ూ
  8:  [0x0B, 0x43],  // R (vocalic r) -> ఋ, ృ
  9:  [0x60, 0x44],  // RR (vocalic rr) -> ౠ, ౄ
  10: [0x0C, 0x62],  // L (vocalic l) -> ఌ, ౢ
  11: [0x61, 0x63],  // LL (vocalic ll) -> ౡ, ౣ
  13: [0x0E, 0x46],  // e  -> ఎ, ె
  14: [0x0F, 0x47],  // E  -> ఏ, ే
  15: [0x10, 0x48],  // ai -> ఐ, ై
  17: [0x12, 0x4A],  // o  -> ఒ, ొ
  18: [0x13, 0x4B],  // O  -> ఓ, ో
  19: [0x14, 0x4C],  // au -> ఔ, ౌ
};

// Consonant mappings: code -> offset from script base
export const CONSONANT_MAP: Record<number, number> = {
  101: 0x15, // ka  -> క
  102: 0x16, // kha -> ఖ
  103: 0x17, // ga  -> గ
  104: 0x18, // gha -> ఘ
  105: 0x19, // ~Na -> ఙ
  106: 0x1A, // cha -> చ
  107: 0x1B, // Cha -> ఛ
  108: 0x1C, // ja  -> జ
  109: 0x1D, // jha -> ఝ
  110: 0x1E, // ~na -> ఞ
  111: 0x1F, // Ta  -> ట
  112: 0x20, // Tha -> ఠ
  113: 0x21, // Da  -> డ
  114: 0x22, // Dha -> ఢ
  115: 0x23, // Na  -> ణ
  116: 0x24, // ta  -> త
  117: 0x25, // tha -> థ
  118: 0x26, // da  -> ద
  119: 0x27, // dha -> ధ
  120: 0x28, // na  -> న
  122: 0x2A, // pa  -> ప
  123: 0x2B, // pha -> ఫ
  124: 0x2C, // ba  -> బ
  125: 0x2D, // bha -> భ
  126: 0x2E, // ma  -> మ
  127: 0x2F, // ya  -> య
  128: 0x30, // ra  -> ర
  129: 0x31, // Ra  -> ఱ (retroflex ra)
  130: 0x32, // la  -> ల
  131: 0x33, // La  -> ళ (retroflex la)
  133: 0x35, // va  -> వ
  134: 0x36, // Sa  -> శ
  135: 0x37, // sha -> ష
  136: 0x38, // sa  -> స
  137: 0x39, // ha  -> హ
};

// Special marks: code -> offset from script base
export const MARK_MAP: Record<number, number> = {
  200: 0x01, // chandrabindu
  201: 0x01, // chandrabindu (alternate)
  202: 0x02, // anusvara (sunna) -> ం
  203: 0x03, // visarga -> ః
  204: 0x3D, // avagraha -> ఽ
};
