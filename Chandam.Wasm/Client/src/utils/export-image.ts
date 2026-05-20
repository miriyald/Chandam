import { domToPng } from 'modern-screenshot';
import { analyticsService } from '../services/analytics-service';

const TAGLINE = 'ఛందం© తో పద్య సాహిత్యం మరింత రసమయం..!!';

const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Anek+Telugu:wght@400;500;600;700;800&family=Tiro+Telugu:ital@0;1&display=swap';

let fontCssCache: string | null = null;

async function getInlinedFontCss(): Promise<string> {
  if (fontCssCache) return fontCssCache;

  const cssRes = await fetch(GOOGLE_FONTS_URL);
  let css = await cssRes.text();

  const urlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
  const urls = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(css)) !== null) {
    urls.add(match[1]);
  }

  const urlMap = new Map<string, string>();
  await Promise.all([...urls].map(async (url) => {
    const res = await fetch(url);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const mime = url.includes('.woff2') ? 'font/woff2' : 'font/woff';
    urlMap.set(url, `data:${mime};base64,${base64}`);
  }));

  for (const [url, dataUri] of urlMap) {
    css = css.split(url).join(dataUri);
  }

  fontCssCache = css;
  return css;
}

export type ExportMode = 'poem' | 'results';

export async function exportAsImage(matchCard: HTMLElement, mode: ExportMode, meterName: string, identifier: string): Promise<void> {
  const container = buildExportContainer(matchCard, mode, meterName);
  document.body.appendChild(container);

  try {
    const fontCss = await getInlinedFontCss();
    const style = document.createElement('style');
    style.textContent = fontCss + `
      * { font-family: 'Tiro Telugu', serif; }
      h3 { font-family: 'Anek Telugu', sans-serif; }
    `;
    container.insertBefore(style, container.firstChild);

    const dataUrl = await domToPng(container, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    const prefix = mode === 'poem' ? 'poem' : 'result';
    triggerDownload(dataUrl, `${prefix}-${sanitizeFilename(identifier)}-${formatDateTime()}.png`);
    analyticsService.trackEvent('export_image', { mode, meterName });
  } finally {
    document.body.removeChild(container);
  }
}

function buildExportContainer(matchCard: HTMLElement, mode: ExportMode, meterName: string): HTMLElement {
  const container = document.createElement('div');
  Object.assign(container.style, {
    position: 'fixed',
    left: '-9999px',
    top: '0',
    width: '700px',
    background: '#ffffff',
    padding: '24px',
    fontFamily: "'Tiro Telugu', serif",
  });

  const heading = document.createElement('h3');
  heading.textContent = meterName;
  Object.assign(heading.style, {
    fontFamily: "'Anek Telugu', sans-serif",
    fontSize: '1.4rem',
    color: '#1a2744',
    marginTop: '0',
    marginBottom: '16px',
    borderBottom: '2px solid #2d6a4f',
    paddingBottom: '8px',
  });
  container.appendChild(heading);

  if (mode === 'poem') {
    const poem = matchCard.querySelector('.padyam .poem') as HTMLElement | null;
    if (poem) {
      const clone = poem.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
    }
  } else {
    const bodySplit = matchCard.querySelector('.match-body-split') as HTMLElement | null;
    if (bodySplit) {
      const clone = bodySplit.cloneNode(true) as HTMLElement;
      container.appendChild(clone);
    }
  }

  const tagline = document.createElement('div');
  tagline.textContent = TAGLINE;
  Object.assign(tagline.style, {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#999999',
    marginTop: '16px',
    paddingTop: '8px',
    borderTop: '1px solid #eeeeee',
  });
  container.appendChild(tagline);

  return container;
}

function formatDateTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9ఀ-౿ऀ-ॿ_-]/g, '_').substring(0, 50);
}

function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => document.body.removeChild(a), 100);
}
