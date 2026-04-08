// Cache the base path (e.g., "" for local dev, "/chandam" for production)
let cachedBasePath: string | null = null;

function getBasePath(): string {
  const baseElement = document.querySelector('base');
  if (!baseElement || !baseElement.href) return '';

  const url = new URL(baseElement.href);
  let path = url.pathname;

  // Normalize: remove trailing slash, convert "/" to ""
  if (path.endsWith('/') && path.length > 1) {
    path = path.slice(0, -1);
  }
  return path === '/' ? '' : path;
}

/**
 * Generate URL with base path prefix
 * @param path - App-relative path (e.g., "/compute/frequent/")
 * @returns Full path (e.g., "/chandam/compute/frequent/" or "/compute/frequent/")
 */
export function makeUrl(path: string): string {
  if (cachedBasePath === null) {
    cachedBasePath = getBasePath();
  }

  if (!path.startsWith('/')) {
    path = '/' + path;
  }

  return cachedBasePath + path;
}

/**
 * Generate URL with query parameters
 */
export function makeUrlWithParams(path: string, params: Record<string, string | number>): string {
  const baseUrl = makeUrl(path);
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
