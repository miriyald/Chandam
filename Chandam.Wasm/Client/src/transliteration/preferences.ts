import type { IndicScript, RomanScheme, TranslitScheme } from './types';

const STORAGE_KEY = 'chandam:kb-scheme';
const DEFAULT_SCHEME: TranslitScheme = 'rts';
const DEFAULT_SCRIPT: IndicScript = 'te';

export interface KBPreference {
  scheme: TranslitScheme;
  script: IndicScript;
}

export function loadPreference(): KBPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const [scheme, script] = raw.split(':');
      if (isValidScheme(scheme) && isValidScript(script)) {
        return { scheme: scheme as TranslitScheme, script: script as IndicScript };
      }
    }
  } catch { /* localStorage unavailable */ }
  return { scheme: DEFAULT_SCHEME, script: DEFAULT_SCRIPT };
}

export function savePreference(pref: KBPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, `${pref.scheme}:${pref.script}`);
  } catch { /* localStorage unavailable */ }
}

function isValidScheme(s: string | undefined): s is TranslitScheme {
  return s === 'rts' || s === 'itx' || s === 'iast' || s === 'none';
}

function isValidScript(s: string | undefined): s is IndicScript {
  return s === 'te' || s === 'kn' || s === 'de';
}
