/**
 * Console API for testing favorites and custom rules
 * Exposed on window.chandam for manual testing
 */
import { storageService } from './storage/storage-service';
import { favoritesService } from './storage/favorites-service';
import { CustomRulesLoader } from './custom-rules-loader';
import { WasmBridge } from '../wasm-bridge';
import type { CustomRuleset } from './storage/models';

const USER_ID_KEY = 'chandam:userId';

/**
 * Get or generate persistent user ID for analytics
 * Returns UUID v4 stored in localStorage
 */
export function getUserId(): string {
  // Check if user ID exists
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    // Generate new UUID v4
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
    console.log('[Analytics] Generated new user ID:', userId.substring(0, 8) + '...');
  }

  return userId;
}

// Expose console API for testing
export function initConsoleAPI() {
  (window as any).chandam = {
    // Storage inspection
    storage: {
      getEditor: () => storageService.loadEditorState(),
      getUI: () => storageService.loadUIState(),
      clear: () => storageService.clearAll()
    },

    // Analytics
    analytics: {
      // Get current user ID
      getUserId: () => {
        const userId = getUserId();
        console.log('User ID:', userId);
        return userId;
      },
      // Reset user ID (generate new one)
      resetUserId: () => {
        localStorage.removeItem(USER_ID_KEY);
        const newId = getUserId();
        console.log('New user ID generated:', newId);
        return newId;
      }
    },

    // Favorites management
    favorites: {
      // Get all favorites
      list: async () => {
        await storageService.init();
        const favorites = await favoritesService.getAllFavorites();
        console.table(favorites.map(f => ({
          ruleSet: f.ruleSetId,
          rule: f.ruleId,
          name: f.ruleData.name,
          favorited: new Date(f.favoritedAt).toLocaleString()
        })));
        return favorites;
      },

      // Add to favorites
      add: async (ruleSetId: string, ruleId: string) => {
        await storageService.init();
        const isFav = await favoritesService.isFavorited(ruleSetId, ruleId);

        if (isFav) {
          console.log('Already favorited');
          return false;
        }

        // Get rule data
        const ruleInfo = await WasmBridge.getRuleInfo(ruleId);
        await favoritesService.toggleFavorite(ruleSetId, ruleId, ruleInfo);
        console.log(`Added ${ruleId} to favorites`);
        return true;
      },

      // Remove from favorites
      remove: async (ruleSetId: string, ruleId: string) => {
        await storageService.init();
        const isFav = await favoritesService.isFavorited(ruleSetId, ruleId);

        if (!isFav) {
          console.log('Not in favorites');
          return false;
        }

        const ruleInfo = await WasmBridge.getRuleInfo(ruleId);
        await favoritesService.toggleFavorite(ruleSetId, ruleId, ruleInfo);
        console.log(`Removed ${ruleId} from favorites`);
        return true;
      },

      // Check if favorited
      check: async (ruleSetId: string, ruleId: string) => {
        await storageService.init();
        const isFav = await favoritesService.isFavorited(ruleSetId, ruleId);
        console.log(isFav ? 'Favorited ❤️' : 'Not favorited 🤍');
        return isFav;
      },

      // Get count
      count: async () => {
        await storageService.init();
        const count = await favoritesService.getFavoriteCount();
        console.log(`${count} favorites (max 50)`);
        return count;
      },

      // Clear all favorites
      clear: async () => {
        await storageService.init();
        const favorites = await favoritesService.getAllFavorites();
        for (const fav of favorites) {
          await storageService.indexedDB.removeFavorite(fav.id);
        }
        await favoritesService.regenerateFavoritesRuleset();
        console.log('All favorites cleared');
        return true;
      }
    },

    // Custom rulesets management
    custom: {
      // List all custom rulesets
      list: async () => {
        await storageService.init();
        const customRulesets = await storageService.indexedDB.getAllCustomRulesets();
        console.table(customRulesets.map(crs => ({
          id: crs.id,
          name: crs.name,
          type: crs.type,
          rules: crs.rules.length,
          updated: new Date(crs.updatedAt).toLocaleString()
        })));
        return customRulesets;
      },

      // Get specific custom ruleset
      get: async (id: string) => {
        await storageService.init();
        return await storageService.indexedDB.getCustomRuleset(id);
      },

      // Create/update custom ruleset from JSON string
      set: async (id: string, name: string, rulesJson: string) => {
        await storageService.init();

        try {
          const rulesArray = JSON.parse(rulesJson);

          if (!Array.isArray(rulesArray)) {
            console.error('Rules must be an array');
            return false;
          }

          if (rulesArray.length > 20) {
            console.error('Cannot exceed 20 rules per custom ruleset');
            return false;
          }

          if (id === 'custom-fav') {
            console.error('Cannot manually edit favorites collection. Use chandam.favorites API.');
            return false;
          }

          const customRuleset: CustomRuleset = {
            id: id,
            name: name,
            description: `User-defined rules (${rulesArray.length} rules)`,
            rules: rulesArray,
            type: 'custom',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          await storageService.indexedDB.saveCustomRuleset(customRuleset);
          console.log(`Saved custom ruleset "${name}" with ${rulesArray.length} rules`);

          // Load into WASM
          await CustomRulesLoader.loadCustomRuleset(customRuleset.id);
          console.log('Custom ruleset loaded into WASM engine');

          return true;
        } catch (error) {
          console.error('Invalid JSON:', error);
          return false;
        }
      },

      // Delete custom ruleset
      delete: async (id: string) => {
        await storageService.init();

        if (id === 'custom-fav') {
          console.error('Cannot delete favorites collection. Use chandam.favorites.clear() instead.');
          return false;
        }

        await storageService.indexedDB.deleteCustomRuleset(id);
        console.log(`Custom ruleset "${id}" deleted`);
        return true;
      }
    }
  };

  console.log('Chandam console API loaded. Try:');
  console.log('  chandam.favorites.list()');
  console.log('  chandam.custom.list()');
}
