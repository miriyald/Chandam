import type { IndicScript, RomanScheme, IMEState } from './types';
import { trToUc } from './engine';

export type SchemeGetter = () => { scheme: RomanScheme | 'none'; script: IndicScript };

const RESET_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  'Home', 'End', 'PageUp', 'PageDown',
  'Escape', 'Tab',
]);

const WORD_BOUNDARY = new Set([' ', '.', ',', ';', ':', '!', '?', '\n', '\r', '(', ')', '[', ']', '{', '}', '"', "'", '/', '\\', '|', '-']);

/**
 * Attach IME behavior to a text input element.
 * Uses beforeinput for mobile virtual keyboards and keypress as fallback for desktop.
 * Returns a cleanup function.
 */
export function attachIMEToElement(
  el: HTMLInputElement | HTMLTextAreaElement,
  getScheme: SchemeGetter,
): () => void {
  const state: IMEState = { inputBuffer: '', prevOutputLen: 0 };
  let handledByBeforeInput = false;

  function onBeforeInput(e: InputEvent) {
    const { scheme, script } = getScheme();
    if (scheme === 'none') return;

    if (e.inputType === 'insertText' && e.data && e.data.length === 1) {
      const char = e.data;

      if (WORD_BOUNDARY.has(char)) {
        resetState(state);
        return;
      }

      e.preventDefault();
      handledByBeforeInput = true;
      state.inputBuffer += char;
      applyConversion(el, state, scheme, script);
      return;
    }

    if (e.inputType === 'deleteContentBackward') {
      if (state.inputBuffer.length > 0) {
        e.preventDefault();
        handledByBeforeInput = true;
        state.inputBuffer = state.inputBuffer.slice(0, -1);
        applyConversion(el, state, scheme, script);
      }
      return;
    }

    if (e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph') {
      resetState(state);
      return;
    }
  }

  function onKeydown(e: KeyboardEvent) {
    const { scheme } = getScheme();
    if (scheme === 'none') return;

    if (RESET_KEYS.has(e.key)) {
      resetState(state);
      return;
    }

    if (e.key === 'Backspace') {
      if (state.inputBuffer.length > 0) {
        e.preventDefault();
        state.inputBuffer = state.inputBuffer.slice(0, -1);
        const { script } = getScheme();
        applyConversion(el, state, scheme, script);
      }
      return;
    }
  }

  function onKeypress(e: KeyboardEvent) {
    // Skip if beforeinput already handled this keystroke
    if (handledByBeforeInput) {
      handledByBeforeInput = false;
      return;
    }

    const { scheme, script } = getScheme();
    if (scheme === 'none') return;
    if (e.ctrlKey || e.altKey || e.metaKey) {
      resetState(state);
      return;
    }

    const char = e.key;
    if (char.length !== 1) return;

    if (WORD_BOUNDARY.has(char)) {
      resetState(state);
      return;
    }

    if (e.key === 'Enter') {
      resetState(state);
      return;
    }

    e.preventDefault();
    state.inputBuffer += char;
    applyConversion(el, state, scheme, script);
  }

  function onMouseup() {
    resetState(state);
  }

  function onTouchend() {
    resetState(state);
  }

  el.addEventListener('beforeinput', onBeforeInput as EventListener);
  el.addEventListener('keydown', onKeydown as EventListener);
  el.addEventListener('keypress', onKeypress as EventListener);
  el.addEventListener('mouseup', onMouseup);
  el.addEventListener('touchend', onTouchend);

  return () => {
    el.removeEventListener('beforeinput', onBeforeInput as EventListener);
    el.removeEventListener('keydown', onKeydown as EventListener);
    el.removeEventListener('keypress', onKeypress as EventListener);
    el.removeEventListener('mouseup', onMouseup);
    el.removeEventListener('touchend', onTouchend);
  };
}

function resetState(state: IMEState) {
  state.inputBuffer = '';
  state.prevOutputLen = 0;
}

function applyConversion(
  el: HTMLInputElement | HTMLTextAreaElement,
  state: IMEState,
  scheme: RomanScheme,
  script: IndicScript,
) {
  const converted = state.inputBuffer.length > 0
    ? trToUc(state.inputBuffer, scheme, script)
    : '';

  const selEnd = el.selectionStart ?? el.value.length;
  const replaceStart = selEnd - state.prevOutputLen;

  el.value =
    el.value.substring(0, replaceStart) +
    converted +
    el.value.substring(selEnd);

  const newCursor = replaceStart + converted.length;
  el.setSelectionRange(newCursor, newCursor);

  state.prevOutputLen = converted.length;

  el.dispatchEvent(new Event('input', { bubbles: true }));
}
