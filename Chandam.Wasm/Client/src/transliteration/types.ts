export type IndicScript = 'te' | 'kn' | 'de';
export type RomanScheme = 'rts' | 'itx' | 'iast';
export type SchemeType = 'tr' | 'uc';
export type SchemeId = `${SchemeType}:${RomanScheme | IndicScript}`;
export type TranslitScheme = RomanScheme | 'none';

export interface SchemeTable {
  hash: Record<string, number | number[]>;
  array: string[];
}

export interface ScriptConfig {
  baseCodePoint: number;
  halantOffset: number;
  overrides: Record<number, string>;
}

export interface IMEState {
  inputBuffer: string;
  prevOutputLen: number;
}

export interface IMEInstance {
  destroy(): void;
  getScheme(): TranslitScheme;
  getScript(): IndicScript;
}

export interface IMEOptions {
  scheme?: TranslitScheme;
  script?: IndicScript;
}
