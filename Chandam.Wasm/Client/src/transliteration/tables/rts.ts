import type { SchemeTable } from '../types';

/**
 * RTS (Rice Transliteration Scheme) mapping table.
 * A publicly documented transliteration standard for Telugu.
 *
 * Hash maps Roman input sequences to internal phoneme codes.
 * Array maps internal positions back to Roman strings (for reverse conversion).
 *
 * Internal code ranges:
 *   2-19: vowels
 *   101-147: consonants
 *   200-205: special marks
 *   252-255: control codes
 */
export const RTS_TABLE: SchemeTable = {
  hash: {
    // Vowels (standalone triggers)
    'a': 2,
    "a'": 3, 'A': 3, 'aa': 3,
    'i': 4,
    "i'": 5, 'I': 5, 'ee': 5, 'ii': 5,
    'u': 6,
    "u'": 7, 'U': 7, 'uu': 7, 'oo': 7,
    'R': 8,
    'Ru': 9,
    '~l': 10,
    '~L': 11,
    'e': 13,
    "e'": 14, 'E': 14, 'ea': 14,
    'ai': 15,
    'o': 17,
    "o'": 18, 'O': 18, 'oa': 18,
    'au': 19, 'ou': 19,

    // Special marks
    '@M': 201, '@m': 201,
    'M': 202,
    '@h': 203,
    '@2': 204,

    // Consonants
    'k': 101,
    'kh': 102, 'K': 102,
    'g': 103,
    'gh': 104, 'G': 104,
    '~m': 105,
    'ch': 106, 'c': 106,
    'Ch': 107, 'C': 107,
    'j': 108,
    'jh': 109, 'J': 109,
    '~n': 110,
    'T': 111,
    'Th': 112,
    'D': 113,
    'Dh': 114,
    'N': 115,
    't': 116,
    'th': 117,
    'd': 118,
    'dh': 119,
    'n': 120,
    'p': 122,
    'ph': 123, 'f': 123, 'P': 123,
    'b': 124,
    'bh': 125, 'B': 125,
    'm': 126,
    'y': 127,
    'r': 128,
    '~r': 129,
    'l': 130,
    'L': 131,
    'v': 133, 'w': 133,
    'S': 134,
    'sh': 135,
    's': 136,
    'h': 137,

    // Nasal+consonant sequences (anusvara + consonant)
    'nk': [202, 101],
    'nkh': [202, 102],
    'nK': [202, 102],
    'ng': [202, 103],
    'ngh': [202, 104],
    'nG': [202, 104],
    'nc': [202, 106],
    'nch': [202, 106],
    'nCh': [202, 107],
    'nC': [202, 107],
    'nj': [202, 108],
    'njh': [202, 109],
    'nJ': [202, 109],
    'nT': [202, 111],
    'nTh': [202, 112],
    'nD': [202, 113],
    'nDh': [202, 114],
    'nt': [202, 116],
    'nth': [202, 117],
    'nd': [202, 118],
    'ndh': [202, 119],
    'np': [202, 122],
    'nph': [202, 123],
    'nf': [202, 123],
    'nP': [202, 123],
    'nb': [202, 124],
    'nbh': [202, 125],
    'nB': [202, 125],
    'nS': [202, 134],
    'nsh': [202, 135],
    'ns': [202, 136],
    'mk': [202, 101],
    'mkh': [202, 102],
    'mK': [202, 102],
    'mg': [202, 103],
    'mgh': [202, 104],
    'mG': [202, 104],
    'mc': [202, 106],
    'mch': [202, 106],
    'mCh': [202, 107],
    'mC': [202, 107],
    'mj': [202, 108],
    'mjh': [202, 109],
    'mJ': [202, 109],
    'mT': [202, 111],
    'mTh': [202, 112],
    'mD': [202, 113],
    'mDh': [202, 114],
    'mt': [202, 116],
    'mth': [202, 117],
    'md': [202, 118],
    'mdh': [202, 119],
    'mp': [202, 122],
    'mph': [202, 123],
    'mf': [202, 123],
    'mP': [202, 123],
    'mb': [202, 124],
    'mbh': [202, 125],
    'mB': [202, 125],
    'mS': [202, 134],
    'msh': [202, 135],
    'ms': [202, 136],
    'mv': [202, 133],
    'mw': [202, 133],

    // Combined sounds
    'x': [101, 135],  // ksha

    // Control
    '#': 255,  // toggle indic mode
    '^': 254,  // explicit halant with ZWJ
    '&': 253,  // explicit halant
    '_': 252,  // separator (no-op)
  },

  // Reverse array: position -> RTS string (for UC->TR conversion)
  // Indexed by Unicode offset positions within a script block
  array: [
    '',      // 0: unused
    '@M',    // 1: chandrabindu
    'M',     // 2: anusvara
    '@h',    // 3: visarga
    '',      // 4: unused
    'a',     // 5: అ
    'A',     // 6: ఆ
    'i',     // 7: ఇ
    'I',     // 8: ఈ
    'u',     // 9: ఉ
    'U',     // 10: ఊ
    'R',     // 11: ఋ
    '~l',    // 12: ఌ
    '',      // 13: unused
    'e',     // 14: ఎ
    'E',     // 15: ఏ
    'ai',    // 16: ఐ
    '',      // 17: unused
    'o',     // 18: ఒ
    'O',     // 19: ఓ
    'au',    // 20: ఔ
    'k',     // 21: క
    'kh',    // 22: ఖ
    'g',     // 23: గ
    'gh',    // 24: ఘ
    '~m',    // 25: ఙ
    'ch',    // 26: చ
    'Ch',    // 27: ఛ
    'j',     // 28: జ
    'jh',    // 29: ఝ
    '~n',    // 30: ఞ
    'T',     // 31: ట
    'Th',    // 32: ఠ
    'D',     // 33: డ
    'Dh',    // 34: ఢ
    'N',     // 35: ణ
    't',     // 36: త
    'th',    // 37: థ
    'd',     // 38: ద
    'dh',    // 39: ధ
    'n',     // 40: న
    '',      // 41: unused
    'p',     // 42: ప
    'ph',    // 43: ఫ
    'b',     // 44: బ
    'bh',    // 45: భ
    'm',     // 46: మ
    'y',     // 47: య
    'r',     // 48: ర
    '~r',    // 49: ఱ
    'l',     // 50: ల
    'L',     // 51: ళ
    '',      // 52: unused
    'v',     // 53: వ
    'S',     // 54: శ
    'sh',    // 55: ష
    's',     // 56: స
    'h',     // 57: హ
  ],
};
