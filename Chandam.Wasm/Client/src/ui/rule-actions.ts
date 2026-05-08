/**
 * Rule actions toolbar component
 * Currently includes: Favorite button, Delete button (for custom rules)
 * Future: Share, Print, Copy link, etc.
 */
import { favoritesService } from '../services/storage/favorites-service';
import { WasmBridge } from '../wasm-bridge';
import { analyticsService } from '../services/analytics-service';
import { storageService } from '../services/storage/storage-service';
import { makeUrl } from '../utils/url-helpers';
import { submitToGitHub, buildExamplePayload } from '../utils/github-submit';
import { t } from '../i18n';

/**
 * Renders action toolbar for rule pages (Learn & Compute)
 */
export async function renderRuleActions(
  containerId: string,
  ruleSetId: string,
  ruleId: string
): Promise<void> {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Ensure storage is initialized
  await storageService.init();

  // Check if already favorited
  // For custom-fav (virtual collection), check by ruleId alone since favorites
  // are stored with their original ruleSetId, not "custom-fav"
  let isFavorited: boolean;
  if (ruleSetId === 'custom-fav') {
    const allFavs = await storageService.indexedDB.getAllFavorites();
    isFavorited = allFavs.some(fav => fav.ruleId === ruleId);
  } else {
    isFavorited = await favoritesService.isFavorited(ruleSetId, ruleId);
  }

  container.innerHTML = `
    <div class="rule-actions">
      ${renderFavoriteButton(isFavorited, ruleSetId, ruleId)}
      ${renderGitHubButton(ruleSetId, ruleId)}
      ${renderCreateRuleButton()}
      ${renderDeleteButton(ruleSetId, ruleId)}
    </div>
  `;

  // Attach event handlers
  attachFavoriteHandler(ruleSetId, ruleId);
  attachGitHubHandler(ruleSetId, ruleId);
  attachDeleteHandler(ruleSetId, ruleId);
}

function renderFavoriteButton(isFavorited: boolean, ruleSetId: string, ruleId: string): string {
  const heartSvg = `
    <svg class="heart-icon" viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
  `;

  return `
    <button id="btn-favorite"
            class="action-btn btn-favorite"
            data-rule-set="${ruleSetId}"
            data-rule-id="${ruleId}"
            data-favorited="${String(isFavorited)}"
            title="${isFavorited ? t('action_remove_favorite') : t('action_add_favorite')}"
            aria-label="${isFavorited ? t('action_remove_favorite') : t('action_add_favorite')}">
      ${heartSvg}
      <span>${isFavorited ? t('action_remove_favorite') : t('action_add_favorite')}</span>
    </button>
  `;
}

function renderDeleteButton(ruleSetId: string, ruleId: string): string {
  // Show for ANY custom rule (identified by "custom-" prefix)
  // This allows deletion from both detail pages in custom-rules and custom-fav views
  if (!ruleId.startsWith('custom-')) {
    return '';
  }

  const trashSvg = `
    <svg class="trash-icon" viewBox="0 0 24 24" width="24" height="24">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  `;

  return `
    <button id="btn-delete"
            class="action-btn btn-delete"
            data-rule-set="${ruleSetId}"
            data-rule-id="${ruleId}"
            title="${t('action_delete_custom_rule')}"
            aria-label="${t('action_delete_custom_rule')}">
      ${trashSvg}
      <span>${t('action_delete_custom_rule')}</span>
    </button>
  `;
}

// Future action buttons (placeholder structure)
/*
function renderShareButton(ruleSetId: string, ruleId: string): string {
  return `
    <button class="action-btn btn-share" title="Share rule">
      <svg class="share-icon" viewBox="0 0 24 24" width="24" height="24">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
      </svg>
    </button>
  `;
}

function renderPrintButton(ruleSetId: string, ruleId: string): string {
  return `
    <button class="action-btn btn-print" title="Print rule">
      <svg class="print-icon" viewBox="0 0 24 24" width="24" height="24">
        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
      </svg>
    </button>
  `;
}
*/

function renderGitHubButton(ruleSetId: string, ruleId: string): string {
  if (!ruleId.startsWith('custom-')) return '';

  const githubSvg = `
    <svg class="github-icon" viewBox="0 0 24 24" width="20" height="20">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.49.5.09.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.607.069-.607 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  `;

  return `
    <button id="btn-github-submit"
            class="action-btn btn-github"
            data-rule-set="${ruleSetId}"
            data-rule-id="${ruleId}"
            title="${t('action_submit_github')}"
            aria-label="${t('action_submit_github')}">
      ${githubSvg}
      <span>${t('action_submit_github')}</span>
    </button>
  `;
}

function renderCreateRuleButton(): string {
  const plusSvg = `
    <svg class="plus-icon" viewBox="0 0 24 24" width="20" height="20">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
    </svg>
  `;

  return `
    <a href="${makeUrl('/create-rule')}"
       class="action-btn btn-create-rule"
       title="${t('action_create_meter')}"
       aria-label="${t('action_create_meter')}">
      ${plusSvg}
      <span>${t('action_create_meter')}</span>
    </a>
  `;
}

function attachGitHubHandler(ruleSetId: string, ruleId: string): void {
  const btn = document.getElementById('btn-github-submit');
  if (btn) {
    btn.addEventListener('click', async () => {
      const trackComplete = analyticsService.startTimedEvent('submit_github_click', {
        ruleId,
        ruleSetId,
        source: 'rule_actions_toolbar'
      });
      const ruleInfo = await WasmBridge.getRuleInfo(ruleId);
      const payload = buildExamplePayload(ruleInfo.name, ruleSetId, ruleId, []);
      submitToGitHub(payload, 'rule_actions');
      trackComplete();
    });
  }
}

function attachFavoriteHandler(ruleSetId: string, ruleId: string): void {
  const btn = document.getElementById('btn-favorite');
  if (btn) {
    btn.addEventListener('click', () => handleFavoriteClick(ruleSetId, ruleId));
  }
}

function attachDeleteHandler(ruleSetId: string, ruleId: string): void {
  const btn = document.getElementById('btn-delete');
  if (btn) {
    btn.addEventListener('click', () => handleDeleteClick(ruleSetId, ruleId));
  }
}

async function handleFavoriteClick(ruleSetId: string, ruleId: string) {
  const btn = document.getElementById('btn-favorite');
  if (!btn) return;

  const done = analyticsService.startTimedEvent('favorite_toggle', {
    ruleSet: ruleSetId,
    ruleId: ruleId
  });

  try {
    // Add animation class
    btn.classList.add('favoriting');

    // Get full rule data
    const ruleInfo = await WasmBridge.getRuleInfo(ruleId);

    // Toggle favorite
    const newState = await favoritesService.toggleFavorite(ruleSetId, ruleId, ruleInfo);

    const totalFavorites = await favoritesService.getFavoriteCount();
    done({ action: newState ? 'add' : 'remove', totalFavorites });

    // Update button state
    btn.setAttribute('data-favorited', String(newState));
    btn.setAttribute('title', newState ? t('action_remove_favorite') : t('action_add_favorite'));
    btn.setAttribute('aria-label', newState ? t('action_remove_favorite') : t('action_add_favorite'));

    // Remove animation class after animation completes
    setTimeout(() => btn.classList.remove('favoriting'), 300);

  } catch (error) {
    console.error('Failed to toggle favorite:', error);

    if (error instanceof Error && error.message.includes('Maximum 50 favorites')) {
      const limitDone = analyticsService.startTimedEvent('favorites_limit_reached', { ruleId });
      limitDone();

      alert(t('alert_max_favorites'));
    } else {
      alert(t('alert_favorite_failed'));
    }

    btn.classList.remove('favoriting');
  }
}

async function handleDeleteClick(ruleSetId: string, ruleId: string) {
  // Confirm deletion
  const confirmed = confirm(t('alert_delete_confirm'));

  if (!confirmed) {
    return;
  }

  const done = analyticsService.startTimedEvent('custom_rule_deleted', {
    ruleId: ruleId,
    source: 'detail_page',
    viewedFrom: ruleSetId
  });

  try {
    // Import services
    const { customRulesService } = await import('../services/storage/custom-rules-service');

    // Delete the rule
    await customRulesService.deleteCustomRule(ruleId);

    // Also remove from favorites if it exists
    // Note: Custom rules are always stored with ruleSetId 'custom-rules' in favorites,
    // even when viewed through 'custom-fav' collection
    const originalRuleSetId = 'custom-rules';
    const isFavorited = await favoritesService.isFavorited(originalRuleSetId, ruleId);
    if (isFavorited) {
      // Get rule data and remove from favorites
      const ruleData = await WasmBridge.getRuleInfo(ruleId);
      await favoritesService.toggleFavorite(originalRuleSetId, ruleId, ruleData);
    }

    done();

    // Navigate back appropriately
    const { makeUrl } = await import('../utils/url-helpers');
    if (ruleSetId === 'custom-fav') {
      // If deleted from favorites view, stay in favorites
      window.location.href = makeUrl('/learn/custom-fav/');
    } else {
      // Otherwise go to custom rules list
      window.location.href = makeUrl('/learn/custom-rules/');
    }

  } catch (error) {
    console.error('Failed to delete rule:', error);
    alert(t('alert_delete_failed'));
  }
}
