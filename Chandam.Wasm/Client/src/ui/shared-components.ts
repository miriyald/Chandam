import { t } from '../i18n';
import type { MatchFlags } from '../types';

export interface EditorCardConfig {
  contextText: string;
  showRulePicker: boolean;
  showAutoDetect: boolean;
  rulePickerId?: string;
}

function isChecked(id: string, fallback: boolean): boolean {
  return (document.getElementById(id) as HTMLInputElement | null)?.checked ?? fallback;
}

export function readMatchFlags(): MatchFlags {
  return {
    yati: isChecked('match-yati', true),
    prasa: isChecked('match-prasa', true),
    santiPrasa: isChecked('match-santi-prasa', false),
    soundexSandhi: isChecked('match-soundex-sandhi', false)
  };
}

/**
 * Renders unified editor card with toolbar, textarea, and controls
 * @param config - Card configuration
 * @returns HTML string for complete editor card
 */
export function renderEditorCard(config: EditorCardConfig): string {
  return `
    <div class="editor-section">
      <div class="editor-toolbar">
        <div class="editor-context-group">
          ${config.showRulePicker ? `
            <label class="toggle-switch" for="auto-detect">
              <input type="checkbox" id="auto-detect" checked aria-label="${t('editor_auto_detect')}">
              <span class="toggle-slider"></span>
              <span class="toggle-label">${t('editor_auto_detect')}</span>
            </label>
            <span class="separator" aria-hidden="true">|</span>
            <details class="rule-picker-inline" id="rule-picker-inline" style="display: none;">
              <summary id="selected-rule-name" aria-haspopup="listbox">${t('editor_matching_with')} ${t('editor_select_rule')}</summary>
              <div class="picker-dropdown" id="rule-picker-container" role="listbox"></div>
            </details>
            <span id="editor-context-label" class="editor-context" style="display: inline;">
              ${config.contextText}
            </span>
          ` : `
            <span class="editor-context">${config.contextText}</span>
          `}
        </div>

        <div class="editor-actions">
          <button id="btn-random" title="${t('editor_btn_random')}">
            <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">casino</span>
            ${t('editor_btn_random')}
          </button>
          <span class="action-separator" aria-hidden="true">|</span>
          <button id="btn-clear" title="${t('editor_btn_clear')}">
            <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">delete_sweep</span>
            ${t('editor_btn_clear')}
          </button>
        </div>
      </div>

      <textarea id="poem-editor" rows="5" placeholder="${t('editor_placeholder')}" aria-label="${t('editor_placeholder')}"></textarea>

      <div class="controls-bar">
        <div class="toggle-group">
          <label class="toggle-switch" for="match-yati">
            <input type="checkbox" id="match-yati" checked aria-label="${t('editor_yati')}">
            <span class="toggle-slider"></span>
            <span class="toggle-label">${t('editor_yati')}</span>
          </label>
          <span class="separator" aria-hidden="true">|</span>
          <label class="toggle-switch" for="match-prasa">
            <input type="checkbox" id="match-prasa" checked aria-label="${t('editor_prasa')}">
            <span class="toggle-slider"></span>
            <span class="toggle-label">${t('editor_prasa')}</span>
          </label>
        </div>

        <div class="main-actions">
          <button id="btn-analyze" class="btn-primary">
            <span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">play_arrow</span>
            ${t('editor_btn_analyze')}
          </button>
        </div>
      </div>

      <details class="advanced-options" id="advanced-options">
        <summary>${t('editor_advanced')}</summary>
        <div class="toggle-group stacked">
          <label class="toggle-switch" for="match-santi-prasa">
            <input type="checkbox" id="match-santi-prasa" aria-label="${t('editor_santi_prasa')}">
            <span class="toggle-slider"></span>
            <span class="toggle-label">${t('editor_santi_prasa')}</span>
          </label>
          <label class="toggle-switch" for="match-soundex-sandhi">
            <input type="checkbox" id="match-soundex-sandhi" aria-label="${t('editor_soundex_sandhi')}">
            <span class="toggle-slider"></span>
            <span class="toggle-label">${t('editor_soundex_sandhi')}</span>
          </label>
        </div>
      </details>
    </div>
  `;
}

/**
 * Santi Prasa and Soundex Sandhi only take effect when Yati is on, so the row is
 * hidden and cleared when Yati is off. The server enforces the same rule.
 */
export function attachAdvancedOptionsToggle(): void {
  const yatiToggle = document.getElementById('match-yati') as HTMLInputElement | null;
  const advanced = document.getElementById('advanced-options') as HTMLDetailsElement | null;
  if (!yatiToggle || !advanced) return;

  const sync = () => {
    advanced.style.display = yatiToggle.checked ? 'block' : 'none';
    if (yatiToggle.checked) return;

    advanced.open = false;
    for (const id of ['match-santi-prasa', 'match-soundex-sandhi']) {
      const input = document.getElementById(id) as HTMLInputElement | null;
      if (input) input.checked = false;
    }
  };

  yatiToggle.addEventListener('change', sync);
  sync();
}

/**
 * Shows rule picker and hides context label (for auto-detect OFF state)
 */
export function showRulePicker(): void {
  const contextLabel = document.getElementById('editor-context-label');
  const rulePicker = document.getElementById('rule-picker-inline');

  if (contextLabel) contextLabel.style.display = 'none';
  if (rulePicker) rulePicker.style.display = 'inline-block';
}

/**
 * Hides rule picker and shows context label (for auto-detect ON state)
 */
export function hideRulePicker(): void {
  const contextLabel = document.getElementById('editor-context-label');
  const rulePicker = document.getElementById('rule-picker-inline');

  if (contextLabel) contextLabel.style.display = 'inline';
  if (rulePicker) rulePicker.style.display = 'none';
}
