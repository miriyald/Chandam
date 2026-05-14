import { makeUrl } from '../utils/url-helpers';
import { renderBreadcrumbs, buildStaticPageBreadcrumbs } from './breadcrumbs';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';
import { collectionService } from '../services/storage/collection-service';
import { customRulesService } from '../services/storage/custom-rules-service';
import { storageService } from '../services/storage/storage-service';
import { analyticsService } from '../services/analytics-service';
import { MAX_POEMS, MAX_FAVORITES, MAX_CUSTOM_RULES } from '../constants';
import { renderRuleSetCard, renderCustomRulesCard } from './rule-sets-page';

export async function renderMyDataPage(): Promise<void> {
  setPageTitle(t('my_data_title'));

  const content = document.getElementById('content');
  if (!content) return;

  const [poemCount, customRulesets] = await Promise.all([
    collectionService.getPoemCount(),
    customRulesService.getAllCustomRulesets(),
  ]);

  const favRuleset = customRulesets.find(rs => rs.type === 'favorites' && rs.rules.length > 0);
  const customRulesCollection = customRulesets.find(rs => rs.id === 'custom-rules' && rs.rules.length > 0);

  const breadcrumbs = buildStaticPageBreadcrumbs(t('my_data_title'));
  const cards: string[] = [];

  // My Writings card — same structure as rule-set-card but links to /my-writings
  if (poemCount > 0) {
    cards.push(`
      <div class="rule-set-card">
        <h2 class="meter-name">${t('my_data_writings_title')}</h2>
        <div class="rule-count">${poemCount}/${MAX_POEMS} ${t('my_data_writings_desc')}</div>
        <p class="description">${t('my_data_writings_subtitle')}</p>
        <div class="card-actions">
          <a href="${makeUrl('/my-writings')}" class="btn-analyze">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            ${t('my_data_view')}
          </a>
        </div>
      </div>
    `);
  }

  // Favorites card — uses exact same rendering as Rule Sets page
  if (favRuleset) {
    const totalExamples = favRuleset.rules.reduce((sum, r) => sum + (r.Examples?.length ?? 0), 0);
    cards.push(renderRuleSetCard({
      id: favRuleset.id,
      name: favRuleset.name,
      description: favRuleset.description,
      ruleCount: favRuleset.rules.length,
      maxCount: MAX_FAVORITES,
      exampleCount: totalExamples,
      isCustom: true,
      isFavorites: true,
    }));
  }

  // Custom Rules card — uses exact same rendering as Rule Sets page
  if (customRulesCollection) {
    cards.push(renderCustomRulesCard({ ...customRulesCollection, maxCount: MAX_CUSTOM_RULES }));
  }

  // Create Custom Rule card — same as Rule Sets page
  cards.push(`
    <a href="${makeUrl('/create-rule')}" class="rule-set-card create-rule-card">
      <div class="create-rule-icon">
        <svg viewBox="0 0 24 24" width="32" height="32"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
      </div>
      <h2>${t('custom_rules_btn_create')}</h2>
    </a>
  `);

  content.innerHTML = `
    <div class="rule-sets-page my-data-page">
      ${renderBreadcrumbs(breadcrumbs)}

      <h1>${t('my_data_title')}</h1>

      <div class="rule-actions my-data-actions">
        <button id="btn-clear-all-data" class="action-btn" title="${t('my_data_clear_btn')}">
          <svg class="trash-icon" viewBox="0 0 24 24" width="16" height="16">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          <span>${t('my_data_clear_btn')}</span>
        </button>
      </div>

      <div class="rule-set-cards">
        ${cards.join('')}
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
