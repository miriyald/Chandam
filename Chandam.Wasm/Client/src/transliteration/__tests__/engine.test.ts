import { describe, it, expect } from 'vitest';
import { convert, trToUc } from '../engine';

describe('trToUc (RTS -> Telugu)', () => {
  const c = (input: string) => trToUc(input, 'rts', 'te');

  describe('standalone vowels', () => {
    it.each([
      ['a', 'అ'],
      ['A', 'ఆ'],
      ['i', 'ఇ'],
      ['I', 'ఈ'],
      ['u', 'ఉ'],
      ['U', 'ఊ'],
      ['R', 'ఋ'],
      ['e', 'ఎ'],
      ['E', 'ఏ'],
      ['ai', 'ఐ'],
      ['o', 'ఒ'],
      ['O', 'ఓ'],
      ['au', 'ఔ'],
    ])('%s -> %s', (input, expected) => {
      expect(c(input)).toBe(expected);
    });
  });

  describe('consonants with inherent a', () => {
    it.each([
      ['ka', 'క'],
      ['kha', 'ఖ'],
      ['ga', 'గ'],
      ['gha', 'ఘ'],
      ['cha', 'చ'],
      ['Cha', 'ఛ'],
      ['ja', 'జ'],
      ['jha', 'ఝ'],
      ['Ta', 'ట'],
      ['Tha', 'ఠ'],
      ['Da', 'డ'],
      ['Dha', 'ఢ'],
      ['Na', 'ణ'],
      ['ta', 'త'],
      ['tha', 'థ'],
      ['da', 'ద'],
      ['dha', 'ధ'],
      ['na', 'న'],
      ['pa', 'ప'],
      ['pha', 'ఫ'],
      ['ba', 'బ'],
      ['bha', 'భ'],
      ['ma', 'మ'],
      ['ya', 'య'],
      ['ra', 'ర'],
      ['la', 'ల'],
      ['La', 'ళ'],
      ['va', 'వ'],
      ['Sa', 'శ'],
      ['sha', 'ష'],
      ['sa', 'స'],
      ['ha', 'హ'],
    ])('%s -> %s', (input, expected) => {
      expect(c(input)).toBe(expected);
    });
  });

  describe('consonant + vowel (matra)', () => {
    it.each([
      ['ki', 'కి'],
      ['kI', 'కీ'],
      ['ku', 'కు'],
      ['kU', 'కూ'],
      ['ke', 'కె'],
      ['kE', 'కే'],
      ['kai', 'కై'],
      ['ko', 'కొ'],
      ['kO', 'కో'],
      ['kau', 'కౌ'],
    ])('%s -> %s', (input, expected) => {
      expect(c(input)).toBe(expected);
    });
  });

  describe('conjuncts (halant)', () => {
    it.each([
      ['kka', 'క్క'],
      ['gga', 'గ్గ'],
      ['tta', 'త్త'],
      ['ppa', 'ప్ప'],
      ['sta', 'స్త'],
      ['kra', 'క్ర'],
      ['tra', 'త్ర'],
      ['pra', 'ప్ర'],
    ])('%s -> %s', (input, expected) => {
      expect(c(input)).toBe(expected);
    });
  });

  describe('anusvara and visarga', () => {
    it.each([
      ['aM', 'అం'],
      ['kaM', 'కం'],
      ['naM', 'నం'],
      ['a@h', 'అః'],
    ])('%s -> %s', (input, expected) => {
      expect(c(input)).toBe(expected);
    });
  });

  describe('nasal+consonant sequences', () => {
    it.each([
      ['anka', 'అంక'],
      ['anga', 'అంగ'],
      ['ancha', 'అంచ'],
      ['anda', 'అంద'],
      ['amba', 'అంబ'],
    ])('%s -> %s', (input, expected) => {
      expect(c(input)).toBe(expected);
    });
  });

  describe('words', () => {
    it.each([
      ['namaskAraM', 'నమస్కారం'],
      ['telugu', 'తెలుగు'],
      ['ChandaM', 'ఛందం'],
      ['padyaM', 'పద్యం'],
      ['kavita', 'కవిత'],
      ['rAmuDu', 'రాముడు'],
    ])('%s -> %s', (input, expected) => {
      expect(c(input)).toBe(expected);
    });
  });

  describe('passthrough for non-matched characters', () => {
    it('passes through spaces', () => {
      expect(c('ka ga')).toBe('క గ');
    });

    it('passes through punctuation', () => {
      expect(c('ka.')).toBe('క.');
    });

    it('passes through digits', () => {
      expect(c('ka1')).toBe('క1');
    });
  });
});

describe('convert() dispatcher', () => {
  it('routes tr:rts -> uc:te correctly', () => {
    expect(convert('ka', 'tr:rts', 'uc:te')).toBe('క');
  });

  it('returns input unchanged for same scheme', () => {
    expect(convert('hello', 'tr:rts', 'tr:rts')).toBe('hello');
  });

  it('returns empty string for empty input', () => {
    expect(convert('', 'tr:rts', 'uc:te')).toBe('');
  });
});
