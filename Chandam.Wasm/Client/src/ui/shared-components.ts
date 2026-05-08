import { t } from '../i18n';

export interface EditorCardConfig {
  contextText: string;
  showRulePicker: boolean;
  showAutoDetect: boolean;
  rulePickerId?: string;
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
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            ${t('editor_btn_random')}
          </button>
          <span class="action-separator" aria-hidden="true">|</span>
          <button id="btn-clear" title="${t('editor_btn_clear')}">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
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
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M8 5v14l11-7z"/></svg>
            ${t('editor_btn_analyze')}
          </button>
        </div>
      </div>
    </div>
  `;
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
