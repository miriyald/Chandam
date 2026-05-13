import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildStaticPageBreadcrumbs } from './breadcrumbs';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { collectionService } from '../services/storage/collection-service';
import { favoritesService } from '../services/storage/favorites-service';
import { customRulesService } from '../services/storage/custom-rules-service';
import { storageService } from '../services/storage/storage-service';
import { analyticsService } from '../services/analytics-service';
import { MAX_POEMS, MAX_FAVORITES, MAX_CUSTOM_RULES } from '../constants';

export async function renderMyDataPage(): Promise<void> {
  setPageTitle(t('my_data_title'));

  const content = document.getElementById('content');
  if (!content) return;

  const [poemCount, favCount, customCount] = await Promise.all([
    collectionService.getPoemCount(),
    favoritesService.getFavoriteCount(),
    customRulesService.getCustomRulesCount(),
  ]);

  const breadcrumbs = buildStaticPageBreadcrumbs(t('my_data_title'));

  content.innerHTML = `
    <div class="rule-sets-page my-data-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <div class="my-data-header">
        <h1>${t('my_data_title')}</h1>
        <button id="btn-clear-all-data" class="btn-clear-data">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          ${t('my_data_clear_btn')}
        </button>
      </div>

      <div class="rule-set-cards">
        <a href="${makeUrl('/my-writings')}" class="rule-set-card my-data-card">
          <div class="my-data-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </div>
          <h2>${t('my_data_writings_title')}</h2>
          <p class="my-data-count">${poemCount}/${MAX_POEMS}</p>
        </a>

        <a href="${makeUrl('/rule-sets')}" class="rule-set-card my-data-card">
          <div class="my-data-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
          </div>
          <h2>${t('my_data_favorites_title')}</h2>
          <p class="my-data-count">${favCount}/${MAX_FAVORITES}</p>
        </a>

        <a href="${makeUrl('/rule-sets')}" class="rule-set-card my-data-card">
          <div class="my-data-icon">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
          </div>
          <h2>${t('my_data_custom_rules_title')}</h2>
          <p class="my-data-count">${customCount}/${MAX_CUSTOM_RULES}</p>
        </a>
      </div>
    </div>
  `;

  document.getElementById('btn-clear-all-data')?.addEventListener('click', async () => {
    const confirmed = confirm(t('clear_data_warning'));
    if (confirmed) {
      await storageService.clearAll();
      analyticsService.trackEvent('clear_all_data', {});
      window.location.reload();
    }
  });

  analyticsService.trackEvent('page_view', { page: 'my_data' });
}
