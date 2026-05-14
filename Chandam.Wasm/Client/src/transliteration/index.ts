import type { IndicScript, RomanScheme, TranslitScheme } from './types';
import { attachIMEToElement } from './ime';
import { initSwitcher, getActiveScheme, getActiveScript } from './switcher';

export { convert } from './engine';
export type { IMEInstance, IMEOptions, SchemeId, IndicScript, RomanScheme, TranslitScheme } from './types';

const attachedElements = new Set<HTMLElement>();
const cleanups = new Map<HTMLElement, () => void>();

/**
 * Initialize the keyboard module.
 * Call once during app startup after DOM is ready.
 * Wires up the #kb-toggle button and auto-attaches IME on focus.
 */
export function initKeyboard(): void {
  initSwitcher((_scheme, _script) => {
    // Scheme changed - nothing extra needed; IME reads live state
  });

  // Auto-attach IME to focused text inputs
  document.addEventListener('focusin', (e) => {
    const el = e.target;
    if (!isTextInput(el)) return;
    if (attachedElements.has(el)) return;

    const cleanup = attachIMEToElement(el, () => ({
      scheme: getActiveScheme() as RomanScheme | 'none',
      script: getActiveScript(),
    }));

    attachedElements.add(el);
    cleanups.set(el, cleanup);
  });

  // Cleanup when elements are removed from DOM
  document.addEventListener('focusout', (e) => {
    const el = e.target;
    if (!isTextInput(el)) return;

    // Delay cleanup to handle quick re-focus
    setTimeout(() => {
      if (document.activeElement !== el) {
        const cleanup = cleanups.get(el);
        if (cleanup) {
          cleanup();
          cleanups.delete(el);
          attachedElements.delete(el);
        }
      }
    }, 200);
  });
}

function isTextInput(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) {
    const type = el.type.toLowerCase();
    return type === 'text' || type === 'search' || type === '';
  }
  return false;
}
