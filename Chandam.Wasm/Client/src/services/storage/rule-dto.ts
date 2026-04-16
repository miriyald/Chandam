/**
 * Type definitions for custom rule data transfer objects
 */

export interface RuleDto {
  Identifier: string;
  Name: string;
  Language: 'Telugu' | 'Kannada' | 'Sanskrit';
  PadyamType: 'Vruttam' | 'Jati' | 'UpaJati';
  PadyamSubType: string;
  RuleType: 'Name' | 'Type' | 'Weight';
  Frequency: string;
  Lines: number;
  Threshold: number;
  Rules: string[][];
  Yati?: number[][];
  YatiMode: 'CharPosition' | 'GPosition';
  Prasa: boolean;
  PrasaYati: boolean;
  AnthyaPrasa: boolean;
  InfiniteLength: boolean;
  DeferThresold: boolean;
  YatiRecycle: boolean;
  ReverseYati: boolean;
  OnlyPrasaYati: boolean;
  RuleText: string;
  References: string[];
  Examples: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface GanaOption {
  label: string;
  value: string;
}
