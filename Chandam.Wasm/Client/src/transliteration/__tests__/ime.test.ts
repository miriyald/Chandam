/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { attachIMEToElement } from '../ime';

function createMockInput(): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'text';
  let cursorPos = 0;

  Object.defineProperty(el, 'selectionStart', {
    get: () => cursorPos,
    set: (v: number) => { cursorPos = v; },
  });
  Object.defineProperty(el, 'selectionEnd', {
    get: () => cursorPos,
    set: (v: number) => { cursorPos = v; },
  });

  el.setSelectionRange = (start: number, end: number) => {
    cursorPos = start;
  };

  return el;
}

function pressKey(el: HTMLInputElement, key: string) {
  el.dispatchEvent(new KeyboardEvent('keypress', { key, bubbles: true }));
}

function pressKeydown(el: HTMLInputElement, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function fireBeforeInput(el: HTMLInputElement, data: string, inputType = 'insertText') {
  const event = new InputEvent('beforeinput', {
    data,
    inputType,
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(event);
}

function fireBeforeInputDelete(el: HTMLInputElement) {
  const event = new InputEvent('beforeinput', {
    data: null,
    inputType: 'deleteContentBackward',
    bubbles: true,
    cancelable: true,
  });
  el.dispatchEvent(event);
}

describe('IME state machine', () => {
  let el: HTMLInputElement;
  let cleanup: () => void;
  const getScheme = () => ({ scheme: 'rts' as const, script: 'te' as const });

  beforeEach(() => {
    el = createMockInput();
    document.body.appendChild(el);
    cleanup = attachIMEToElement(el, getScheme);
  });

  it('converts single consonant+vowel to Telugu', () => {
    pressKey(el, 'k');
    pressKey(el, 'a');
    expect(el.value).toBe('క');
  });

  it('converts vowel standalone', () => {
    pressKey(el, 'a');
    expect(el.value).toBe('అ');
  });

  it('builds conjuncts across multiple keystrokes', () => {
    pressKey(el, 'k');
    pressKey(el, 'k');
    pressKey(el, 'a');
    expect(el.value).toBe('క్క');
  });

  it('resets buffer on space (passthrough)', () => {
    pressKey(el, 'k');
    pressKey(el, 'a');
    // Space is a word boundary - not intercepted by keypress, reset on keydown
    pressKeydown(el, ' ');
    // After reset, next char starts fresh
    pressKey(el, 'g');
    pressKey(el, 'a');
    // The space itself is passthrough (not prevented), so the IME state resets
    // Value depends on whether space was appended by browser
    expect(el.value).toContain('గ');
  });

  it('handles backspace by truncating buffer', () => {
    pressKey(el, 'k');
    pressKey(el, 'a');
    expect(el.value).toBe('క');
    pressKeydown(el, 'Backspace');
    // After backspace, buffer is 'k' (removed 'a'), re-converts
    expect(el.value).toBe('క్'); // 'k' alone produces consonant with halant
  });

  it('passes through when scheme is none', () => {
    cleanup();
    const noneScheme = () => ({ scheme: 'none' as const, script: 'te' as const });
    cleanup = attachIMEToElement(el, noneScheme);
    el.value = '';

    pressKey(el, 'k');
    // When scheme is 'none', keypress is not prevented - value unchanged by IME
    expect(el.value).toBe('');
  });

  it('cleans up event listeners on destroy', () => {
    cleanup();
    el.value = '';
    pressKey(el, 'k');
    pressKey(el, 'a');
    // After cleanup, IME should not intercept
    expect(el.value).toBe('');
  });
});

describe('IME beforeinput (mobile virtual keyboard)', () => {
  let el: HTMLInputElement;
  let cleanup: () => void;
  const getScheme = () => ({ scheme: 'rts' as const, script: 'te' as const });

  beforeEach(() => {
    el = createMockInput();
    document.body.appendChild(el);
    cleanup = attachIMEToElement(el, getScheme);
  });

  it('converts via beforeinput insertText', () => {
    fireBeforeInput(el, 'k');
    fireBeforeInput(el, 'a');
    expect(el.value).toBe('క');
  });

  it('converts standalone vowel via beforeinput', () => {
    fireBeforeInput(el, 'a');
    expect(el.value).toBe('అ');
  });

  it('builds conjuncts via beforeinput', () => {
    fireBeforeInput(el, 'k');
    fireBeforeInput(el, 'k');
    fireBeforeInput(el, 'a');
    expect(el.value).toBe('క్క');
  });

  it('handles deleteContentBackward', () => {
    fireBeforeInput(el, 'k');
    fireBeforeInput(el, 'a');
    expect(el.value).toBe('క');
    fireBeforeInputDelete(el);
    expect(el.value).toBe('క్');
  });

  it('resets on word boundary via beforeinput', () => {
    fireBeforeInput(el, 'k');
    fireBeforeInput(el, 'a');
    fireBeforeInput(el, ' '); // space - word boundary
    fireBeforeInput(el, 'g');
    fireBeforeInput(el, 'a');
    expect(el.value).toContain('క');
    expect(el.value).toContain('గ');
  });

  it('passes through when scheme is none', () => {
    cleanup();
    const noneScheme = () => ({ scheme: 'none' as const, script: 'te' as const });
    cleanup = attachIMEToElement(el, noneScheme);
    el.value = '';

    fireBeforeInput(el, 'k');
    expect(el.value).toBe('');
  });
});
