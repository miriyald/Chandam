import { storageService } from '../services/storage/storage-service';

let saveTimeout: number | undefined;

export function getEditorText(): string {
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  return editor?.value || '';
}

export function setEditorText(text: string) {
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  if (editor) editor.value = text;
}

export function clearEditor() {
  setEditorText('');
  // Also clear saved editor state
  storageService.clearEditorState();
}

/**
 * Enable auto-save for editor text.
 * Debounces saves to 1 second after user stops typing.
 * Call this once after rendering the editor on a page.
 */
export function enableEditorAutoSave() {
  const editor = document.getElementById('poem-editor') as HTMLTextAreaElement;
  if (!editor) {
    console.warn('Cannot enable auto-save: editor element not found');
    return;
  }

  // Remove existing listener if any (prevent duplicate listeners)
  editor.removeEventListener('input', handleEditorInput);

  // Add debounced auto-save listener
  editor.addEventListener('input', handleEditorInput);

  console.log('Editor auto-save enabled (1s debounce)');
}

function handleEditorInput(event: Event) {
  const editor = event.target as HTMLTextAreaElement;

  // Clear previous timeout
  if (saveTimeout !== undefined) {
    window.clearTimeout(saveTimeout);
  }

  // Save 1 second after user stops typing
  saveTimeout = window.setTimeout(() => {
    storageService.saveEditorState({ text: editor.value });
    console.log('Editor text auto-saved to localStorage');
  }, 1000);
}
