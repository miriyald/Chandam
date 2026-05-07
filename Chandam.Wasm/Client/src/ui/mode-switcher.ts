import { makeUrl } from '../utils/url-helpers';
import { t } from '../i18n';

export interface ModeSwitcherOptions {
  ruleSetId: string;
  ruleId?: string;        // Optional - only for rule detail pages
  currentMode: 'learn' | 'compute' | 'explore';
}

// Main function: Render mode switcher (segmented control)
export function renderModeSwitcher(options: ModeSwitcherOptions): string {
  const { ruleSetId, ruleId, currentMode } = options;

  // Generate URLs based on whether we're on a rule detail page
  const learnUrl = ruleId
    ? `/learn/${ruleSetId}/${ruleId}`
    : `/learn/${ruleSetId}/`;

  const computeUrl = ruleId
    ? `/compute/${ruleSetId}/${ruleId}`
    : `/compute/${ruleSetId}/`;

  // Determine which mode is active
  const learnActive = currentMode === 'learn';
  const computeActive = currentMode === 'compute';

  // Build class names
  const learnClasses = `mode-tab mode-tab-learn${learnActive ? ' mode-tab-active' : ''}`;
  const computeClasses = `mode-tab mode-tab-compute${computeActive ? ' mode-tab-active' : ''}`;

  // Render as links for inactive modes, spans for active mode
  const learnElement = learnActive
    ? `<span class="${learnClasses}">${escapeHtml(t('mode_learn'))}</span>`
    : `<a href="${makeUrl(learnUrl)}" class="${learnClasses}">${escapeHtml(t('mode_learn'))}</a>`;

  const computeElement = computeActive
    ? `<span class="${computeClasses}">${escapeHtml(t('mode_compute'))}</span>`
    : `<a href="${makeUrl(computeUrl)}" class="${computeClasses}">${escapeHtml(t('mode_compute'))}</a>`;

  return `
    <nav class="mode-switcher" role="tablist" aria-label="${t('mode_switcher_aria_label')}">
      ${learnElement}
      ${computeElement}
    </nav>
  `;
}

// Helper: Escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
