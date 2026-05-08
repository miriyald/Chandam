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
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z"/></svg>
            ${t('editor_btn_random')}
          </button>
          <span class="action-separator" aria-hidden="true">|</span>
          <button id="btn-clear" title="${t('editor_btn_clear')}">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M16 11h-1V3c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v8H8c-1.1 0-2 .9-2 2v9h12v-9c0-1.1-.9-2-2-2zm-5-7.5h2v7.5h-2V3.5zM6 22v-1h12v1H6z"/></svg>
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
