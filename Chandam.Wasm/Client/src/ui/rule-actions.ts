/**
 * Rule actions toolbar component
 * Currently includes: Favorite button
 * Future: Share, Print, Copy link, etc.
 */
import { favoritesService } from '../services/storage/favorites-service';
import { WasmBridge } from '../wasm-bridge';
import { analyticsService } from '../services/analytics-service';

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

  // Check if already favorited
  const isFavorited = await favoritesService.isFavorited(ruleSetId, ruleId);

  container.innerHTML = `
    <div class="rule-actions">
      ${renderFavoriteButton(isFavorited, ruleSetId, ruleId)}
    </div>
  `;

  // Attach event handlers
  attachFavoriteHandler(ruleSetId, ruleId);
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
            data-favorited="${isFavorited}"
            title="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}"
            aria-label="${isFavorited ? 'Remove from favorites' : 'Add to favorites'}">
      ${heartSvg}
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

function attachFavoriteHandler(ruleSetId: string, ruleId: string): void {
  const btn = document.getElementById('btn-favorite');
  if (btn) {
    btn.addEventListener('click', () => handleFavoriteClick(ruleSetId, ruleId));
  }
}

async function handleFavoriteClick(ruleSetId: string, ruleId: string) {
  const btn = document.getElementById('btn-favorite');
  if (!btn) return;

  try {
    // Add animation class
    btn.classList.add('favoriting');

    // Get full rule data
    const ruleInfo = await WasmBridge.getRuleInfo(ruleId);

    // Toggle favorite
    const newState = await favoritesService.toggleFavorite(ruleSetId, ruleId, ruleInfo);

    // Track favorite toggle
    const totalFavorites = await favoritesService.getFavoriteCount();
    analyticsService.trackEvent('favorite_toggle', {
      action: newState ? 'add' : 'remove',
      ruleSet: ruleSetId,
      ruleId: ruleId,
      totalFavorites
    });

    // Update button state
    btn.setAttribute('data-favorited', String(newState));
    btn.setAttribute('title', newState ? 'Remove from favorites' : 'Add to favorites');
    btn.setAttribute('aria-label', newState ? 'Remove from favorites' : 'Add to favorites');

    // Remove animation class after animation completes
    setTimeout(() => btn.classList.remove('favoriting'), 300);

  } catch (error) {
    console.error('Failed to toggle favorite:', error);

    if (error instanceof Error && error.message.includes('Maximum 50 favorites')) {
      // Track favorites limit reached
      analyticsService.trackEvent('favorites_limit_reached', {
        ruleId: ruleId
      });

      alert('Maximum 50 favorites reached. Please remove some to add new ones.');
    } else {
      alert('Failed to update favorite');
    }

    btn.classList.remove('favoriting');
  }
}
