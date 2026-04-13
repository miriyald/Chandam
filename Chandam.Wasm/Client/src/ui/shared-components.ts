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
            <label class="toggle-switch">
              <input type="checkbox" id="auto-detect" checked>
              <span class="toggle-slider"></span>
              <span class="toggle-label">${t('editor_auto_detect')}</span>
            </label>
            <span class="separator">|</span>
            <details class="rule-picker-inline" id="rule-picker-inline" style="display: none;">
              <summary id="selected-rule-name">${t('editor_matching_with')} ${t('editor_select_rule')}</summary>
              <div class="picker-dropdown" id="rule-picker-container"></div>
            </details>
            <span id="editor-context-label" class="editor-context" style="display: inline;">
              ${config.contextText}
            </span>
          ` : `
            <span class="editor-context">${config.contextText}</span>
          `}
        </div>

        <div class="editor-actions">
          <button id="btn-random" title="${t('editor_btn_random')}">${t('editor_btn_random')}</button>
          <span class="action-separator">|</span>
          <button id="btn-clear" title="${t('editor_btn_clear')}">${t('editor_btn_clear')}</button>
        </div>
      </div>

      <textarea id="poem-editor" rows="5" placeholder="${t('editor_placeholder')}"></textarea>

      <div class="controls-bar">
        <div class="toggle-group">
          <label class="toggle-switch">
            <input type="checkbox" id="match-yati" checked>
            <span class="toggle-slider"></span>
            <span class="toggle-label">${t('editor_yati')}</span>
          </label>
          <span class="separator">|</span>
          <label class="toggle-switch">
            <input type="checkbox" id="match-prasa" checked>
            <span class="toggle-slider"></span>
            <span class="toggle-label">${t('editor_prasa')}</span>
          </label>
        </div>

        <div class="main-actions">
          <button id="btn-analyze" class="btn-primary">${t('editor_btn_analyze')}</button>
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
