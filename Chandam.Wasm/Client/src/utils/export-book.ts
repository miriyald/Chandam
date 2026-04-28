import { WasmBridge } from '../wasm-bridge';
import type { RuleInfo, RuleSummaryDetailed } from '../types';
import { groupRulesByCategory, getSortedGroupKeys, getGroupDisplayName } from './rule-grouping';
import { t } from '../i18n';
import { analyticsService } from '../services/analytics-service';

type ProgressCallback = (current: number, total: number) => void;

let cancelExport = false;

function formatDateTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// --- Progress UI ---

function showExportProgress(): void {
  cancelExport = false;
  const overlay = document.createElement('div');
  overlay.className = 'export-progress-overlay';
  overlay.id = 'export-progress-overlay';
  overlay.innerHTML = `
    <div class="export-progress-card">
      <h3>${t('export_progress_title')}</h3>
      <div class="export-progress-bar-container">
        <div class="export-progress-bar" id="export-progress-bar" style="width: 0%"></div>
      </div>
      <p class="export-progress-text" id="export-progress-text">0 / 0</p>
      <button class="btn-cancel-export" id="btn-cancel-export">${t('export_cancel')}</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('btn-cancel-export')?.addEventListener('click', () => {
    cancelExport = true;
  });
}

function updateExportProgress(current: number, total: number): void {
  const pct = Math.round((current / total) * 100);
  const bar = document.getElementById('export-progress-bar');
  if (bar) bar.style.width = `${pct}%`;
  const text = document.getElementById('export-progress-text');
  if (text) text.textContent = `${current} / ${total}`;
}

function hideExportProgress(): void {
  document.getElementById('export-progress-overlay')?.remove();
}

// --- Data Fetching ---

async function fetchAllRuleDetails(
  rules: RuleSummaryDetailed[],
  onProgress: ProgressCallback
): Promise<Map<string, RuleInfo>> {
  const results = new Map<string, RuleInfo>();

  for (let i = 0; i < rules.length; i++) {
    if (cancelExport) break;

    try {
      const info = await WasmBridge.getRuleInfo(rules[i].identifier);
      results.set(rules[i].identifier, info);
    } catch (err) {
      console.warn(`Failed to fetch rule: ${rules[i].identifier}`, err);
    }

    onProgress(i + 1, rules.length);
  }

  return results;
}

// --- HTML Generation ---

function generateInlineCSS(): string {
  return `
    :root {
      --font-display: 'Timmana', 'Noto Sans Telugu', sans-serif;
      --font-editor: 'Suranna', 'Noto Sans Telugu', serif;
      --font-main: 'Noto Sans Telugu', sans-serif;
      --color-text: #1a1a1a;
      --color-poem: darkblue;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font-main);
      color: var(--color-text);
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      background: #fff;
    }

    h1 { font-family: var(--font-display); font-size: 2.5rem; margin-bottom: 0.5rem; }
    h2 { font-family: var(--font-display); font-size: 1.8rem; margin: 2rem 0 1rem; border-bottom: 2px solid #000; padding-bottom: 0.5rem; }
    h3 { font-family: var(--font-display); font-size: 1.4rem; margin: 1.5rem 0 0.75rem; }

    .title-page { text-align: center; padding: 4rem 0; border-bottom: 3px double #000; margin-bottom: 3rem; }
    .title-page h1 { font-size: 3rem; margin-bottom: 0.5rem; }
    .title-page .subtitle { font-size: 1.3rem; color: #555; margin-bottom: 1rem; }
    .title-page .meta { color: #888; font-size: 0.9rem; }

    .toc { margin-bottom: 3rem; padding-bottom: 2rem; border-bottom: 1px solid #ddd; }
    .toc h2 { border-bottom: none; }
    .toc-group { margin-bottom: 1rem; }
    .toc-group-name { font-weight: 700; font-size: 1.05rem; margin-bottom: 0.3rem; }
    .toc-list { list-style: none; padding-left: 1rem; }
    .toc-list li { margin-bottom: 0.2rem; }
    .toc-list a { color: #1f618d; text-decoration: none; }
    .toc-list a:hover { text-decoration: underline; }

    .group-section { margin-bottom: 3rem; }
    .rule-section { margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }

    .rule-alias { color: #7f8c8d; font-size: 0.95rem; margin-bottom: 0.5rem; }

    .rule-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
    .badge { padding: 0.25rem 0.7rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    .badge-type { background: #e8daef; color: #6c3483; }
    .badge-chars { background: #d6eaf8; color: #1f618d; }
    .badge-matras { background: #d5f4e6; color: #186a3b; }
    .badge-chandam { background: #fdebd0; color: #935116; }
    .badge-lines { background: #fce4ec; color: #880e4f; }

    .rule-sequence { margin-bottom: 0.75rem; }
    .rule-sequence code {
      background: #fff8dc; padding: 0.3rem 0.6rem; border-radius: 3px;
      font-family: monospace; font-size: 0.9rem; color: #d35400;
      border-left: 3px solid #f39c12; display: inline-block; word-break: break-all;
    }

    .description-content { line-height: 1.8; margin-bottom: 1.5rem; }
    .description-content h2 { font-size: 1.2rem; margin-top: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid #ddd; }
    .description-content ul, .description-content ol { margin-left: 1.5rem; margin-bottom: 1rem; }
    .description-content li { margin-bottom: 0.5rem; }
    .description-content code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: monospace; font-size: 0.9em; }
    .description-content p { margin-bottom: 0.75rem; }
    .description-content .laghu { color: #e74c3c; font-weight: bold; font-family: monospace; font-size: 1.1em; }
    .description-content .guru { color: #3498db; font-weight: bold; font-family: monospace; font-size: 1.1em; }
    .description-content .gName { color: #16a085; font-weight: 600; }

    .examples-section { margin-top: 1rem; }
    .examples-section h4 { font-size: 1rem; margin-bottom: 0.75rem; color: #555; }

    .example-card {
      background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px;
      padding: 1.2rem; margin-bottom: 1rem;
    }
    .example-poem-area {
      background: white; border: 1px solid #e0e0e0; border-radius: 6px; padding: 1rem;
    }
    .poem {
      font-family: var(--font-editor); font-size: 1.1rem;
      letter-spacing: 0.05em; line-height: 1.8; color: var(--color-poem);
    }
    .poem u { text-decoration: underline; text-decoration-color: #ff8000; text-underline-offset: 2px; text-decoration-thickness: 1.5px; }
    .poem b { font-weight: 700; color: #6a4c93; }
    .poem-text {
      background: white; border: 1px solid #ddd; border-radius: 4px;
      padding: 1rem; font-family: var(--font-editor); font-size: 1.1rem;
      line-height: 1.8; white-space: pre-wrap; color: var(--color-poem);
    }
    .poem-attribution { text-align: right; color: #666; font-style: italic; margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid #eee; }
    .example-reference { color: #666; font-size: 0.85rem; margin-top: 0.5rem; }

    .footer { text-align: center; color: #999; font-size: 0.85rem; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #ddd; }

    @media print {
      body { padding: 0; max-width: 100%; }
      .title-page { page-break-after: always; }
      .toc { page-break-after: always; }
      .group-section { page-break-before: always; }
      .rule-section { page-break-inside: avoid; }
      .example-card { page-break-inside: avoid; }
      a { color: inherit; text-decoration: none; }
    }
  `;
}

function generateTitlePage(title: string, ruleCount: number): string {
  const date = new Date().toLocaleDateString('te-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  return `
    <div class="title-page">
      <h1>${escapeHtml(title)}</h1>
      <div class="subtitle">${t('export_book_subtitle')}</div>
      <div class="meta">${ruleCount} rules &middot; ${date}</div>
      <div class="meta">${t('export_book_generated')}</div>
    </div>
  `;
}

function generateTableOfContents(
  grouped: Map<string, RuleSummaryDetailed[]>,
  sortedKeys: string[],
  ruleInfos: Map<string, RuleInfo>
): string {
  const groups = sortedKeys.map(key => {
    const rules = grouped.get(key)!;
    const displayName = getGroupDisplayName(key, grouped);
    const items = rules.map(r => {
      const info = ruleInfos.get(r.identifier);
      const name = info?.shortName || info?.name || r.name;
      return `<li><a href="#rule-${escapeHtml(r.identifier)}">${escapeHtml(name)}</a></li>`;
    }).join('');

    return `
      <div class="toc-group">
        <div class="toc-group-name">${escapeHtml(displayName)}</div>
        <ul class="toc-list">${items}</ul>
      </div>
    `;
  }).join('');

  return `
    <div class="toc">
      <h2>Table of Contents</h2>
      ${groups}
    </div>
  `;
}

const SUBTYPE_TELUGU: Record<string, string> = {
  'Akkara': 'అక్కరలు',
  'Divpada': 'ద్విపదలు',
  'Jati': 'జాతి',
  'Ragada': 'రగడలు',
  'Ragada2': 'రగడలు',
  'Shatpada': 'షట్పదలు',
  'UpaJati': 'ఉపజాతి',
  'Sisamu': 'సీసములు',
  'Vruttam': 'వృత్తం',
  'DaMDakamu': 'దండకము',
  'ArdhaVruttam': 'అర్ధ సమవృత్తం',
  'VishamaVruttam': 'విషమవృత్తం',
  'GenricVruttam': 'ఏదేని సమ వృత్తం',
};

function generateRuleSection(ruleInfo: RuleInfo): string {
  const displayName = ruleInfo.shortName && ruleInfo.shortName !== ruleInfo.name
    ? ruleInfo.shortName : ruleInfo.name;

  const aliasHtml = ruleInfo.alias
    ? `<div class="rule-alias">${escapeHtml(ruleInfo.alias)}</div>` : '';

  const badges: string[] = [];

  if (ruleInfo.padyamSubType) {
    const teluguType = SUBTYPE_TELUGU[ruleInfo.padyamSubType] || ruleInfo.padyamSubType;
    badges.push(`<span class="badge badge-type">${escapeHtml(teluguType)}</span>`);
  }

  if (ruleInfo.min && ruleInfo.max && ruleInfo.min !== -1 && ruleInfo.max !== -1) {
    const charText = ruleInfo.min === ruleInfo.max
      ? `${ruleInfo.min} ${t('metric_chars')}`
      : `${ruleInfo.min}-${ruleInfo.max} ${t('metric_chars')}`;
    badges.push(`<span class="badge badge-chars">${charText}</span>`);
  } else if (ruleInfo.charLength && ruleInfo.charLength !== -1) {
    badges.push(`<span class="badge badge-chars">${ruleInfo.charLength} ${t('metric_chars')}</span>`);
  }

  if (ruleInfo.matraLength && ruleInfo.matraLength !== -1) {
    badges.push(`<span class="badge badge-matras">${ruleInfo.matraLength} ${t('metric_matras')}</span>`);
  }

  if (ruleInfo.lines && ruleInfo.lines > 0) {
    const label = ruleInfo.lines === 1 ? t('pada_singular') : t('pada_plural');
    badges.push(`<span class="badge badge-lines">${ruleInfo.lines} ${label}</span>`);
  }

  if (ruleInfo.chandamName) {
    badges.push(`<span class="badge badge-chandam">${escapeHtml(ruleInfo.chandamName)}</span>`);
  }

  const badgesHtml = badges.length > 0
    ? `<div class="rule-badges">${badges.join('')}</div>` : '';

  const sequenceHtml = ruleInfo.sequence
    ? `<div class="rule-sequence"><code>${escapeHtml(ruleInfo.sequence)}</code></div>` : '';

  const descriptionHtml = ruleInfo.description
    ? `<div class="description-content">${ruleInfo.description}</div>` : '';

  const examplesHtml = generateExamplesSection(ruleInfo.examples);

  return `
    <div class="rule-section" id="rule-${escapeHtml(ruleInfo.identifier)}">
      <h3>${escapeHtml(displayName)}</h3>
      ${aliasHtml}
      ${badgesHtml}
      ${sequenceHtml}
      ${descriptionHtml}
      ${examplesHtml}
    </div>
  `;
}

function generateExamplesSection(examples: RuleInfo['examples']): string {
  if (!examples || examples.length === 0) return '';

  const cards = examples.map(ex => {
    const poemHtml = ex.beautified
      ? `<div class="poem">${ex.beautified}</div>`
      : `<pre class="poem-text">${escapeHtml(ex.text)}</pre>`;

    const authorHtml = ex.author
      ? `<div class="poem-attribution">&mdash; ${escapeHtml(ex.author)}</div>` : '';

    const refHtml = ex.reference
      ? `<div class="example-reference">${escapeHtml(ex.reference)}</div>` : '';

    return `
      <div class="example-card">
        <div class="example-poem-area">
          ${poemHtml}
          ${authorHtml}
        </div>
        ${refHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="examples-section">
      <h4>${t('section_examples')} (${examples.length})</h4>
      ${cards}
    </div>
  `;
}

function generateBookHtml(
  title: string,
  ruleInfos: Map<string, RuleInfo>,
  rules: RuleSummaryDetailed[],
  isSingleRule: boolean
): string {
  let bodyContent: string;

  if (isSingleRule) {
    const ruleInfo = ruleInfos.values().next().value!;
    bodyContent = `
      ${generateTitlePage(title + ' — ' + ruleInfo.name, 1)}
      ${generateRuleSection(ruleInfo)}
    `;
  } else {
    const grouped = groupRulesByCategory(rules);
    const sortedKeys = getSortedGroupKeys(grouped);

    const tocHtml = generateTableOfContents(grouped, sortedKeys, ruleInfos);

    const contentHtml = sortedKeys.map(key => {
      const groupRules = grouped.get(key)!;
      const displayName = getGroupDisplayName(key, grouped);
      const ruleSections = groupRules
        .map(r => {
          const info = ruleInfos.get(r.identifier);
          return info ? generateRuleSection(info) : '';
        })
        .join('');

      return `
        <div class="group-section">
          <h2>${escapeHtml(displayName)}</h2>
          ${ruleSections}
        </div>
      `;
    }).join('');

    bodyContent = `
      ${generateTitlePage(title, ruleInfos.size)}
      ${tocHtml}
      <div class="book-content">${contentHtml}</div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="te">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;700&family=Timmana&family=Suranna&display=swap" rel="stylesheet">
  <style>${generateInlineCSS()}</style>
</head>
<body>
  ${bodyContent}
  <div class="footer">${t('export_book_generated')} &middot; ${new Date().toISOString().split('T')[0]}</div>
</body>
</html>`;
}

// --- Download Trigger ---

function triggerDownload(htmlContent: string, filename: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Public API ---

export async function exportFullBook(
  ruleSetName: string,
  ruleSetId: string,
  rules: RuleSummaryDetailed[]
): Promise<void> {
  const startTime = Date.now();

  analyticsService.trackEvent('export_book_started', {
    ruleSetId,
    ruleCount: rules.length,
    type: 'full'
  });

  showExportProgress();

  try {
    const ruleInfos = await fetchAllRuleDetails(rules, updateExportProgress);

    if (cancelExport) {
      analyticsService.trackEvent('export_book_cancelled', { ruleSetId, ruleCount: rules.length });
      return;
    }

    const html = generateBookHtml(ruleSetName, ruleInfos, rules, false);
    const filename = `${ruleSetId}-${formatDateTime()}.html`;
    triggerDownload(html, filename);

    analyticsService.trackEvent('export_book_completed', {
      ruleSetId,
      ruleCount: ruleInfos.size,
      type: 'full',
      durationMs: Date.now() - startTime,
      fileSizeKB: Math.round(html.length / 1024)
    });
  } catch (err) {
    console.error('Export failed:', err);
    analyticsService.trackEvent('export_book_error', { ruleSetId, error: String(err) });
  } finally {
    hideExportProgress();
  }
}

export async function exportSingleRule(
  ruleSetName: string,
  ruleInfo: RuleInfo
): Promise<void> {
  analyticsService.trackEvent('export_book_started', {
    ruleId: ruleInfo.identifier,
    type: 'single'
  });

  const ruleInfos = new Map<string, RuleInfo>();
  ruleInfos.set(ruleInfo.identifier, ruleInfo);

  const html = generateBookHtml(ruleSetName, ruleInfos, [], true);
  const filename = `${ruleInfo.identifier}-${formatDateTime()}.html`;
  triggerDownload(html, filename);

  analyticsService.trackEvent('export_book_completed', {
    ruleId: ruleInfo.identifier,
    type: 'single',
    fileSizeKB: Math.round(html.length / 1024)
  });
}
