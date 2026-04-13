/**
 * Favorites management service
 */
import { storageService } from './storage-service';
import type { FavoriteEntry, CustomRuleset } from './models';

export class FavoritesService {
  async isFavorited(ruleSetId: string, ruleId: string): Promise<boolean> {
    await storageService.init();
    const compositeId = this.makeCompositeId(ruleSetId, ruleId);
    return storageService.indexedDB.isFavorited(compositeId);
  }

  async toggleFavorite(ruleSetId: string, ruleId: string, ruleData: any): Promise<boolean> {
    await storageService.init();
    const compositeId = this.makeCompositeId(ruleSetId, ruleId);
    const isFavorited = await storageService.indexedDB.isFavorited(compositeId);

    if (isFavorited) {
      // Remove favorite
      await storageService.indexedDB.removeFavorite(compositeId);
    } else {
      // Add favorite
      const favorite: FavoriteEntry = {
        id: compositeId,
        ruleSetId,
        ruleId,
        ruleData,
        favoritedAt: Date.now()
      };

      await storageService.indexedDB.addFavorite(favorite);
    }

    // Regenerate favorites collection
    await this.regenerateFavoritesRuleset();

    return !isFavorited; // Return new state
  }

  async regenerateFavoritesRuleset(): Promise<void> {
    await storageService.init();

    // Get all favorites
    const allFavorites = await storageService.indexedDB.getAllFavorites();

    // Sort by favoritedAt (chronological order)
    allFavorites.sort((a, b) => a.favoritedAt - b.favoritedAt);

    // Extract rule data
    const favoriteRules = allFavorites.map(fav => fav.ruleData);

    if (favoriteRules.length > 0) {
      // Create/update favorites ruleset
      const favRuleset: CustomRuleset = {
        id: 'custom-fav',
        name: '⭐ My Favorites',
        description: `${favoriteRules.length} favorited rules from various rulesets`,
        rules: favoriteRules,
        type: 'favorites',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await storageService.indexedDB.saveCustomRuleset(favRuleset);
    } else {
      // Delete if no favorites left
      try {
        await storageService.indexedDB.deleteCustomRuleset('custom-fav');
      } catch (e) {
        // Ignore if doesn't exist
      }
    }
  }

  async getFavoriteCount(): Promise<number> {
    await storageService.init();
    const favorites = await storageService.indexedDB.getAllFavorites();
    return favorites.length;
  }

  async getAllFavorites(): Promise<FavoriteEntry[]> {
    await storageService.init();
    return storageService.indexedDB.getAllFavorites();
  }

  private makeCompositeId(ruleSetId: string, ruleId: string): string {
    return `${ruleSetId}:${ruleId}`;
  }
}

// Singleton instance
export const favoritesService = new FavoritesService();
