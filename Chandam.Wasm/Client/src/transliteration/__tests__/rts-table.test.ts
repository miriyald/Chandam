import { describe, it, expect } from 'vitest';
import { RTS_TABLE } from '../tables/rts';

describe('RTS Table completeness', () => {
  const { hash } = RTS_TABLE;

  describe('all consonant entry points exist', () => {
    const consonants = [
      'k', 'kh', 'g', 'gh', '~m',
      'ch', 'Ch', 'j', 'jh', '~n',
      'T', 'Th', 'D', 'Dh', 'N',
      't', 'th', 'd', 'dh', 'n',
      'p', 'ph', 'b', 'bh', 'm',
      'y', 'r', 'l', 'L',
      'v', 'S', 'sh', 's', 'h',
    ];

    it.each(consonants)('hash contains "%s"', (key) => {
      expect(hash[key]).toBeDefined();
      const code = hash[key] as number;
      expect(code).toBeGreaterThanOrEqual(101);
      expect(code).toBeLessThanOrEqual(147);
    });
  });

  describe('all vowel entry points exist', () => {
    const vowels = ['a', 'A', 'i', 'I', 'u', 'U', 'R', 'e', 'E', 'ai', 'o', 'O', 'au'];

    it.each(vowels)('hash contains "%s"', (key) => {
      expect(hash[key]).toBeDefined();
      const code = hash[key] as number;
      expect(code).toBeGreaterThanOrEqual(2);
      expect(code).toBeLessThanOrEqual(19);
    });
  });

  describe('special marks exist', () => {
    it('anusvara (M) maps to 202', () => {
      expect(hash['M']).toBe(202);
    });

    it('visarga (@h) maps to 203', () => {
      expect(hash['@h']).toBe(203);
    });
  });

  describe('multi-char sequences resolve correctly', () => {
    const multiChar: [string, number][] = [
      ['kh', 102],
      ['gh', 104],
      ['Ch', 107],
      ['jh', 109],
      ['Th', 112],
      ['Dh', 114],
      ['th', 117],
      ['dh', 119],
      ['ph', 123],
      ['bh', 125],
      ['sh', 135],
    ];

    it.each(multiChar)('"%s" maps to %d', (key, expected) => {
      expect(hash[key]).toBe(expected);
    });
  });

  describe('nasal+consonant sequences produce arrays', () => {
    const nasals: [string, number[]][] = [
      ['nk', [202, 101]],
      ['ng', [202, 103]],
      ['nch', [202, 106]],
      ['nd', [202, 118]],
      ['mb', [202, 124]],
    ];

    it.each(nasals)('"%s" maps to %j', (key, expected) => {
      expect(hash[key]).toEqual(expected);
    });
  });

  describe('reverse array has entries for consonant offsets', () => {
    const { array } = RTS_TABLE;

    it('has entries at Telugu consonant offset positions', () => {
      // Consonants start at offset 0x15 = 21
      expect(array[0x15]).toBe('k');
      expect(array[0x16]).toBe('kh');
      expect(array[0x17]).toBe('g');
      expect(array[0x1A]).toBe('ch');
      expect(array[0x24]).toBe('t');
      expect(array[0x2A]).toBe('p');
      expect(array[0x2E]).toBe('m');
      expect(array[0x30]).toBe('r');
      expect(array[0x38]).toBe('s');
    });
  });
});
