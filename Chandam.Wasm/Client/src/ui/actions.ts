import { WasmBridge } from '../wasm-bridge';
import { getEditorText, setEditorText, clearEditor } from './editor';
import { getSelectedRule } from './rule-picker';
import { renderFirstMatch, hideResults } from './results';
import { t } from '../i18n';
import { notify } from '../utils/notify';

export async function handleDetermineAndShowResults() {
  const poemText = getEditorText();
  if (!poemText.trim()) {
    notify(t('alert_enter_poem'), 'warning');
    return;
  }

  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

  try {
    const response = await WasmBridge.determine(poemText, yati, prasa);
    if (response.success && response.matches.length > 0) {
      // Show only the first (best) match - NO TAB SWITCHING
      renderFirstMatch(response.matches[0], 'results-container');

      // Show results section
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.style.display = 'block';
    } else {
      notify(response.errorMessage || t('alert_no_matches'), 'error');
    }
  } catch (err) {
    console.error('Determine failed:', err);
    notify(t('alert_error'), 'error');
  }
}

// Keep old function name for backward compatibility
export const handleDetermine = handleDetermineAndShowResults;

export async function handleMatch() {
  const poemText = getEditorText();
  const ruleId = getSelectedRule();

  if (!poemText.trim()) {
    notify(t('alert_enter_poem'), 'warning');
    return;
  }

  if (!ruleId) {
    notify(t('alert_select_rule'), 'warning');
    // Add visual feedback to rule picker
    const rulePicker = document.getElementById('rule-picker-inline');
    if (rulePicker) {
      rulePicker.classList.add('error');
      setTimeout(() => rulePicker.classList.remove('error'), 2000);
    }
    return;
  }

  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

  try {
    const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
    if (response.isMatch && response.match) {
      renderFirstMatch(response.match, 'results-container');

      // Show results section
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) resultsSection.style.display = 'block';
    } else {
      notify(response.errorMessage || t('alert_no_match'), 'error');
    }
  } catch (err) {
    console.error('Match failed:', err);
    notify(t('alert_error'), 'error');
  }
}

export async function handleRandom() {
  const ruleId = getSelectedRule();
  if (!ruleId) {
    notify(t('alert_select_rule'), 'warning');
    return;
  }

  try {
    const result = await WasmBridge.getRandomPoem(ruleId);
    if (result.text) {
      setEditorText(result.text);
      if (result.isGenerated) {
        notify(t('alert_generated_poem'), 'info');
      }
    } else {
      notify(t('alert_no_examples'), 'warning');
    }
  } catch (err) {
    console.error('Random poem failed:', err);
  }
}

export function handleClear() {
  clearEditor();
  hideResults();
}
