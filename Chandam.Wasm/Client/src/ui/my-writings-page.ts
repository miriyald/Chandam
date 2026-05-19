/**
 * My Writings page — displays user's saved poem collection
 */
import { collectionService } from '../services/storage/collection-service';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { analyticsService } from '../services/analytics-service';
import { storageService } from '../services/storage/storage-service';
import { makeUrl } from '../utils/url-helpers';
import type { CollectionPoem } from '../services/storage/models';
import { wrapPoemLines } from '../utils/poem-html';
import { showConfirm } from '../utils/confirm-dialog';

let actionController: AbortController | null = null;
let cachedPoems: CollectionPoem[] = [];

export async function renderMyWritingsPage(): Promise<void> {
  setPageTitle(t('nav_my_writings'));

  const content = document.getElementById('content');
  if (!content) return;

  cachedPoems = await collectionService.getAllPoems();
  content.innerHTML = renderPageContent(cachedPoems);
  attachHandlers(content);

  analyticsService.trackEvent('page_view', { page: 'my_writings', poemCount: cachedPoems.length });
}

function renderPageContent(poems: CollectionPoem[]): string {
  const count = poems.length;

  if (count === 0) {
    return `
      <div class="my-writings-page">
        <h1>${t('nav_my_writings')}</h1>
        <div class="writings-empty">
          <p>${t('writings_empty')}</p>
        </div>
      </div>
    `;
  }

  const cards = poems
    .sort((a, b) => b.addedAt - a.addedAt)
    .map(poem => renderWritingCard(poem))
    .join('');

  return `
    <div class="my-writings-page">
      <h1>${t('nav_my_writings')}</h1>
      <p class="writings-subtitle">${t('writings_subtitle').replace('{count}', String(count))}</p>
      <div class="writings-list">
        ${cards}
      </div>
    </div>
  `;
}

function renderWritingCard(poem: CollectionPoem): string {
  const poemHtml = poem.beautified
    ? `<div class="poem">${wrapPoemLines(poem.beautified)}</div>`
    : `<pre class="poem-text">${escapeHtml(poem.poemText)}</pre>`;

  const trashSvg = `<span class="material-symbols-outlined" style="font-size:16px" aria-hidden="true">delete</span>`;
  const playSvg = `<span class="material-symbols-outlined" style="font-size:14px" aria-hidden="true">play_arrow</span>`;

  const tryUrl = makeUrl(`/compute/${poem.ruleSetId}/${poem.ruleIdentifier}`);

  return `
    <div class="writing-card" data-hash="${poem.poemHash}">
      <div class="writing-header">
        <span class="meter-name">${escapeHtml(poem.ruleName)}</span>
        <div class="writing-actions">
          <a href="${tryUrl}" class="try-example-btn" data-hash="${poem.poemHash}" title="${t('btn_try_example')}">
            ${playSvg}
            ${t('btn_try_example')}
          </a>
          <button class="action-btn btn-delete-inline btn-delete-writing" data-hash="${poem.poemHash}"
                  title="${t('writings_delete')}" aria-label="${t('writings_delete')}">
            ${trashSvg}
            <span>${t('writings_delete')}</span>
          </button>
        </div>
      </div>
      <div class="example-poem-area">
        ${poemHtml}
      </div>
    </div>
  `;
}

function attachHandlers(container: HTMLElement): void {
  if (actionController) actionController.abort();
  actionController = new AbortController();

  container.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    // Delete button (or child of it)
    const deleteBtn = target.closest('.btn-delete-writing') as HTMLElement | null;
    if (deleteBtn) {
      const hash = deleteBtn.getAttribute('data-hash');
      if (!hash) return;

      const confirmed = await showConfirm(t('writings_delete_confirm'), {
        title: t('writings_delete'),
        cancelText: t('creator_btn_cancel'),
        confirmText: t('writings_delete')
      });
      if (!confirmed) return;

      await collectionService.removePoem(hash);
      analyticsService.trackEvent('poem_removed', { poemHash: hash });

      cachedPoems = await collectionService.getAllPoems();
      container.innerHTML = renderPageContent(cachedPoems);
      attachHandlers(container);
      return;
    }

    // "Try this Example" — save poem text to editor state before router navigates
    const tryBtn = target.closest('.try-example-btn') as HTMLAnchorElement | null;
    if (tryBtn) {
      const hash = tryBtn.getAttribute('data-hash');
      if (hash) {
        const poem = cachedPoems.find(p => p.poemHash === hash);
        if (poem) {
          storageService.saveEditorState({ text: poem.poemText });
        }
      }
    }
  }, { signal: actionController.signal });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
