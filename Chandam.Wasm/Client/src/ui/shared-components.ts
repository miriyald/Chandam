import type { RuleSummaryDetailed } from '../types';

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
              <span class="toggle-label">Auto-detect</span>
            </label>
            <span class="separator">|</span>
            <details class="rule-picker-inline" id="rule-picker-inline" style="display: none;">
              <summary id="selected-rule-name">Matching with: Select a rule ▼</summary>
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
          <button id="btn-random" title="Random example">🎲 Random</button>
          <span class="action-separator">|</span>
          <button id="btn-clear" title="Clear">🧹 Clear</button>
        </div>
      </div>

      <textarea id="poem-editor" rows="5" placeholder="పద్యం ఇక్కడ టైప్ చేయండి..."></textarea>

      <div class="controls-bar">
        <div class="toggle-group">
          <label class="toggle-switch">
            <input type="checkbox" id="match-yati" checked>
            <span class="toggle-slider"></span>
            <span class="toggle-label">Yati</span>
          </label>
          <span class="separator">|</span>
          <label class="toggle-switch">
            <input type="checkbox" id="match-prasa" checked>
            <span class="toggle-slider"></span>
            <span class="toggle-label">Prasa</span>
          </label>
        </div>

        <div class="main-actions">
          <button id="btn-analyze" class="btn-primary">Analyze Poem</button>
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
