import { makeUrl } from '../utils/url-helpers';
import { t } from '../i18n';
import { setPageTitle } from '../utils/page-title';

// Main function: Render landing page
export function renderHomePage() {
  setPageTitle();

  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="home-page-landing">
      <div class="hero-section">
        <h1 class="hero-title">ఛందం</h1>
        <h2 class="hero-subtitle">${t('home_title')}</h2>

        <p class="hero-description">
          ${t('home_subtitle')}
        </p>

        <div class="hero-actions">
          <a href="${makeUrl('/rule-sets')}" class="btn-primary btn-large">
            ${t('home_btn_browse_rule_sets')}
          </a>
        </div>
      </div>

      <div class="quick-links-section">
        <h3>${t('home_quick_links')}</h3>
        <div class="quick-links-grid">
          <a href="${makeUrl('/rule-sets')}" class="quick-link-card">
            <span class="quick-link-icon">📚</span>
            <span class="quick-link-title">${t('home_link_rule_sets')}</span>
            <span class="quick-link-desc">${t('home_link_rule_sets_desc')}</span>
          </a>
          <a href="${makeUrl('/about')}" class="quick-link-card">
            <span class="quick-link-icon">ℹ️</span>
            <span class="quick-link-title">${t('home_link_about')}</span>
            <span class="quick-link-desc">${t('home_link_about_desc')}</span>
          </a>
          <a href="${makeUrl('/credits')}" class="quick-link-card">
            <span class="quick-link-icon">🙏</span>
            <span class="quick-link-title">${t('home_link_credits')}</span>
            <span class="quick-link-desc">${t('home_link_credits_desc')}</span>
          </a>
          <a href="${makeUrl('/contact')}" class="quick-link-card">
            <span class="quick-link-icon">✉️</span>
            <span class="quick-link-title">${t('home_link_contact')}</span>
            <span class="quick-link-desc">${t('home_link_contact_desc')}</span>
          </a>
        </div>
      </div>
    </div>
  `;
}
