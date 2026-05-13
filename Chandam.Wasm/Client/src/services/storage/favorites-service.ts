/**
 * Favorites management service
 */
import { storageService } from './storage-service';
import type { FavoriteEntry, CustomRuleset } from './models';

const FAVORITES_KEY = 'favorites';
const FAV_RULESET_KEY = 'custom-rulesets:custom-fav';
const MAX_FAVORITES = 50;

export class FavoritesService {
  async isFavorited(ruleSetId: string, ruleId: string): Promise<boolean> {
    const compositeId = this.makeCompositeId(ruleSetId, ruleId);
    const favorites = await this.loadFavorites();
    return favorites.some(f => f.id === compositeId);
  }

  async toggleFavorite(ruleSetId: string, ruleId: string, ruleData: any): Promise<boolean> {
    await storageService.init();
    const compositeId = this.makeCompositeId(ruleSetId, ruleId);
    const favorites = await this.loadFavorites();
    const existingIndex = favorites.findIndex(f => f.id === compositeId);

    if (existingIndex >= 0) {
      favorites.splice(existingIndex, 1);
    } else {
      if (favorites.length >= MAX_FAVORITES) {
        throw new Error(`Maximum ${MAX_FAVORITES} favorites reached`);
      }
      favorites.push({
        id: compositeId,
        ruleSetId,
        ruleId,
        ruleData,
        favoritedAt: Date.now()
      });
    }

    await this.saveFavorites(favorites);
    await this.regenerateFavoritesRuleset(favorites);

    return existingIndex < 0;
  }

  async regenerateFavoritesRuleset(favorites?: FavoriteEntry[]): Promise<void> {
    await storageService.init();
    const allFavorites = favorites ?? await this.loadFavorites();
    allFavorites.sort((a, b) => a.favoritedAt - b.favoritedAt);

    const rulesets = await this.loadCustomRulesets();

    if (allFavorites.length > 0) {
      const favRuleset: CustomRuleset = {
        id: 'custom-fav',
        name: '⭐ My Favorites',
        description: `${allFavorites.length} favorited rules from various rulesets`,
        rules: allFavorites.map(fav => fav.ruleData),
        type: 'favorites',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const idx = rulesets.findIndex(r => r.id === 'custom-fav');
      if (idx >= 0) rulesets[idx] = favRuleset;
      else rulesets.push(favRuleset);
    } else {
      const idx = rulesets.findIndex(r => r.id === 'custom-fav');
      if (idx >= 0) rulesets.splice(idx, 1);
    }

    await storageService.indexedDB.saveData('custom-rulesets', rulesets);
  }

  async getFavoriteCount(): Promise<number> {
    const favorites = await this.loadFavorites();
    return favorites.length;
  }

  async getAllFavorites(): Promise<FavoriteEntry[]> {
    return this.loadFavorites();
  }

  private makeCompositeId(ruleSetId: string, ruleId: string): string {
    return `${ruleSetId}:${ruleId}`;
  }

  private async loadFavorites(): Promise<FavoriteEntry[]> {
    await storageService.init();
    return await storageService.indexedDB.getData<FavoriteEntry[]>(FAVORITES_KEY) ?? [];
  }

  private async saveFavorites(favorites: FavoriteEntry[]): Promise<void> {
    await storageService.indexedDB.saveData(FAVORITES_KEY, favorites);
  }

  private async loadCustomRulesets(): Promise<CustomRuleset[]> {
    return await storageService.indexedDB.getData<CustomRuleset[]>('custom-rulesets') ?? [];
  }
}

// Singleton instance
export const favoritesService = new FavoritesService();
