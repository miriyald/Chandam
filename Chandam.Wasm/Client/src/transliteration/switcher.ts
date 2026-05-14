import type { TranslitScheme, IndicScript } from './types';
import { loadPreference, savePreference } from './preferences';

export type SchemeChangeCallback = (scheme: TranslitScheme, script: IndicScript) => void;

let currentScheme: TranslitScheme;
let currentScript: IndicScript;
let toggleBtn: HTMLElement | null = null;
let onChangeCallback: SchemeChangeCallback | null = null;

export function initSwitcher(onChange: SchemeChangeCallback): void {
  const pref = loadPreference();
  currentScheme = pref.scheme;
  currentScript = pref.script;

  toggleBtn = document.getElementById('kb-toggle');
  if (!toggleBtn) return;

  updateButtonState();
  toggleBtn.addEventListener('click', handleToggle);
  onChangeCallback = onChange;
}

export function getActiveScheme(): TranslitScheme {
  return currentScheme;
}

export function getActiveScript(): IndicScript {
  return currentScript;
}

function handleToggle(): void {
  if (currentScheme === 'none') {
    currentScheme = 'rts';
  } else {
    currentScheme = 'none';
  }

  savePreference({ scheme: currentScheme, script: currentScript });
  updateButtonState();
  onChangeCallback?.(currentScheme, currentScript);
}

function updateButtonState(): void {
  if (!toggleBtn) return;

  const isActive = currentScheme !== 'none';
  toggleBtn.classList.toggle('active', isActive);
  toggleBtn.setAttribute('aria-pressed', String(isActive));

  const rect = toggleBtn.querySelector('rect');
  const text = toggleBtn.querySelector('text');
  if (rect && text) {
    rect.setAttribute('fill', isActive ? '#1a3a5c' : '#999');
    text.setAttribute('fill', isActive ? '#f5f3f0' : '#ccc');
  }
}
