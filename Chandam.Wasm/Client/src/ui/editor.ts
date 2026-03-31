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
}
