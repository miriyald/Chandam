export function wrapPoemLines(beautifiedHtml: string): string {
  return beautifiedHtml
    .split(/<br\s*\/?>/gi)
    .filter(line => line.trim())
    .map(line => `<span class="poem-line">${line}</span>`)
    .join('');
}
