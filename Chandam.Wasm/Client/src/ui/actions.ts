import { WasmBridge } from '../wasm-bridge';
import { getEditorText, setEditorText, clearEditor } from './editor';
import { getSelectedRule } from './rule-picker';
import { renderFirstMatch, hideResults } from './results';

export async function handleDetermine() {
  const poemText = getEditorText();
  if (!poemText.trim()) {
    alert('దయచేసి పద్యం టెక్స్ట్ ఇవ్వండి (Please enter poem text)');
    return;
  }

  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

  try {
    const response = await WasmBridge.determine(poemText, yati, prasa);
    if (response.success && response.matches.length > 0) {
      // Show only the first (best) match
      renderFirstMatch(response.matches[0], 'results-container');

      // Auto-select best match in dropdown
      const ruleSelect = document.getElementById('rule-select') as HTMLSelectElement;
      if (ruleSelect) {
        ruleSelect.value = response.matches[0].rule.identifier;
      }

      // Switch to Match tab so user can see the selection
      const matchTab = document.getElementById('tab-match');
      if (matchTab) {
        matchTab.click();
      }
    } else {
      alert(response.errorMessage || 'సరిపోలికలు దొరకలేదు (No matches found)');
    }
  } catch (err) {
    console.error('Determine failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
}

export async function handleMatch() {
  const poemText = getEditorText();
  const ruleId = getSelectedRule();

  if (!poemText.trim() || !ruleId) {
    alert('దయచేసి పద్యం మరియు ఛందం ఎంచుకోండి (Please select poem and rule)');
    return;
  }

  const yati = (document.getElementById('match-yati') as HTMLInputElement)?.checked ?? true;
  const prasa = (document.getElementById('match-prasa') as HTMLInputElement)?.checked ?? true;

  try {
    const response = await WasmBridge.tryMatch(poemText, ruleId, yati, prasa);
    if (response.isMatch && response.match) {
      renderFirstMatch(response.match, 'results-container');
    } else {
      alert(response.errorMessage || 'సరిపోలలేదు (No match)');
    }
  } catch (err) {
    console.error('Match failed:', err);
    alert('లోపం సంభవించింది (Error occurred)');
  }
}

export async function handleRandom() {
  const ruleId = getSelectedRule();
  if (!ruleId) {
    alert('దయచేసి ఛందం ఎంచుకోండి (Please select a rule)');
    return;
  }

  try {
    const poem = await WasmBridge.getRandomPoem(ruleId);
    if (poem) {
      setEditorText(poem);
    } else {
      alert('ఉదాహరణలు అందుబాటులో లేవు (No examples available)');
    }
  } catch (err) {
    console.error('Random poem failed:', err);
  }
}

export function handleClear() {
  clearEditor();
  hideResults();
}
