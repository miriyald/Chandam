/**
 * Console API for testing favorites and custom rules
 * Exposed on window.chandam for manual testing
 */
import { storageService } from './storage/storage-service';
import { favoritesService } from './storage/favorites-service';
import { customRulesService } from './storage/custom-rules-service';
import { CustomRulesLoader } from './custom-rules-loader';
import { WasmBridge } from '../wasm-bridge';
import type { CustomRuleset } from './storage/models';
import { STORAGE_KEYS } from '../constants';

const USER_ID_KEY = STORAGE_KEYS.USER_ID;

/**
 * Get or generate persistent user ID for analytics
 * Returns UUID v4 stored in localStorage
 */
export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
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
      getUserId: () => {
        const userId = getUserId();
        console.log('User ID:', userId);
        return userId;
      },
      resetUserId: () => {
        localStorage.removeItem(USER_ID_KEY);
        const newId = getUserId();
        console.log('New user ID generated:', newId);
        return newId;
      }
    },

    // Favorites management
    favorites: {
      list: async () => {
        const favorites = await favoritesService.getAllFavorites();
        console.table(favorites.map(f => ({
          ruleSet: f.ruleSetId,
          rule: f.ruleId,
          name: f.ruleData.name,
          favorited: new Date(f.favoritedAt).toLocaleString()
        })));
        return favorites;
      },

      add: async (ruleSetId: string, ruleId: string) => {
        const isFav = await favoritesService.isFavorited(ruleSetId, ruleId);
        if (isFav) {
          console.log('Already favorited');
          return false;
        }

        const ruleDto = await WasmBridge.getRuleDto(ruleId);
        await favoritesService.toggleFavorite(ruleSetId, ruleId, ruleDto);
        console.log(`Added ${ruleId} to favorites`);
        return true;
      },

      remove: async (ruleSetId: string, ruleId: string) => {
        const isFav = await favoritesService.isFavorited(ruleSetId, ruleId);
        if (!isFav) {
          console.log('Not in favorites');
          return false;
        }

        const ruleDto = await WasmBridge.getRuleDto(ruleId);
        await favoritesService.toggleFavorite(ruleSetId, ruleId, ruleDto);
        console.log(`Removed ${ruleId} from favorites`);
        return true;
      },

      check: async (ruleSetId: string, ruleId: string) => {
        const isFav = await favoritesService.isFavorited(ruleSetId, ruleId);
        console.log(isFav ? 'Favorited' : 'Not favorited');
        return isFav;
      },

      count: async () => {
        const count = await favoritesService.getFavoriteCount();
        console.log(`${count} favorites (max 50)`);
        return count;
      },

      clear: async () => {
        // Remove all favorites by toggling each one off
        const favorites = await favoritesService.getAllFavorites();
        for (const fav of favorites) {
          await favoritesService.toggleFavorite(fav.ruleSetId, fav.ruleId, fav.ruleData);
        }
        console.log('All favorites cleared');
        return true;
      }
    },

    // Custom rulesets management
    custom: {
      list: async () => {
        const allRulesets = await customRulesService.getAllCustomRulesets();
        console.table(allRulesets.map(crs => ({
          id: crs.id,
          name: crs.name,
          type: crs.type,
          rules: crs.rules.length,
          updated: new Date(crs.updatedAt).toLocaleString()
        })));
        return allRulesets;
      },

      get: async (id: string) => {
        return await customRulesService.getCustomRuleset(id);
      },

      set: async (id: string, name: string, rulesJson: string) => {
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

          // Save via the service's internal compressed storage
          await storageService.init();
          const rulesets = await customRulesService.getAllCustomRulesets();
          const idx = rulesets.findIndex(r => r.id === id);
          if (idx >= 0) rulesets[idx] = customRuleset;
          else rulesets.push(customRuleset);
          await storageService.indexedDB.saveData('custom-rulesets', rulesets);

          console.log(`Saved custom ruleset "${name}" with ${rulesArray.length} rules`);

          await CustomRulesLoader.loadCustomRuleset(customRuleset.id);
          console.log('Custom ruleset loaded into WASM engine');

          return true;
        } catch (error) {
          console.error('Invalid JSON:', error);
          return false;
        }
      },

      delete: async (id: string) => {
        if (id === 'custom-fav') {
          console.error('Cannot delete favorites collection. Use chandam.favorites.clear() instead.');
          return false;
        }

        await storageService.init();
        const rulesets = await customRulesService.getAllCustomRulesets();
        const filtered = rulesets.filter(r => r.id !== id);
        await storageService.indexedDB.saveData('custom-rulesets', filtered);
        console.log(`Custom ruleset "${id}" deleted`);
        return true;
      }
    }
  };

  console.log('Chandam console API loaded. Try:');
  console.log('  chandam.favorites.list()');
  console.log('  chandam.custom.list()');
}
