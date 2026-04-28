const BRAND = 'ఛందం';
const HOME_TITLE = 'ఛందం - Telugu Poetry Meter Analysis';
const SEPARATOR = ' : ';

export function setPageTitle(...segments: string[]): void {
  if (segments.length === 0) {
    document.title = HOME_TITLE;
    return;
  }
  document.title = [...segments, BRAND].join(SEPARATOR);
}
