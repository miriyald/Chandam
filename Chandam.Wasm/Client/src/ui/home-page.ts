import { makeUrl } from '../utils/url-helpers';

// Main function: Render landing page
export function renderHomePage() {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="home-page-landing">
      <div class="hero-section">
        <h1 class="hero-title">ఛందం</h1>
        <h2 class="hero-subtitle">Telugu Poetry Meter Analysis</h2>

        <p class="hero-description">
          Discover, analyze, and learn about Telugu poetry meters (Chandam).
          Our comprehensive collection includes 379 rules covering classical and modern meters.
        </p>

        <div class="hero-actions">
          <a href="${makeUrl('/rule-sets')}" class="btn-primary btn-large">
            Browse Rule Sets
          </a>
        </div>
      </div>

      <div class="quick-links-section">
        <h3>Quick Links</h3>
        <div class="quick-links-grid">
          <a href="${makeUrl('/rule-sets')}" class="quick-link-card">
            <span class="quick-link-icon">📚</span>
            <span class="quick-link-title">Rule Sets</span>
            <span class="quick-link-desc">Browse all meter collections</span>
          </a>
          <a href="${makeUrl('/about')}" class="quick-link-card">
            <span class="quick-link-icon">ℹ️</span>
            <span class="quick-link-title">About</span>
            <span class="quick-link-desc">Learn about this project</span>
          </a>
          <a href="${makeUrl('/credits')}" class="quick-link-card">
            <span class="quick-link-icon">🙏</span>
            <span class="quick-link-title">Credits</span>
            <span class="quick-link-desc">Contributors and sources</span>
          </a>
          <a href="${makeUrl('/contact')}" class="quick-link-card">
            <span class="quick-link-icon">✉️</span>
            <span class="quick-link-title">Contact</span>
            <span class="quick-link-desc">Get in touch</span>
          </a>
        </div>
      </div>
    </div>
  `;
}
