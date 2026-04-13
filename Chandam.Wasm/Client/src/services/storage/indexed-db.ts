/**
 * IndexedDB wrapper for complex structured data
 */
import type { FavoriteEntry, CustomRuleset } from './models';

export class IndexedDBService {
  private dbName = 'ChandamDB';
  private version = 2;  // Bumped for new schema
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create favorites store (new)
        if (!db.objectStoreNames.contains('favorites')) {
          db.createObjectStore('favorites', { keyPath: 'id' });
        }

        // Create custom-rulesets store (renamed from 'rulesets')
        if (!db.objectStoreNames.contains('custom-rulesets')) {
          db.createObjectStore('custom-rulesets', { keyPath: 'id' });
        }
      };
    });
  }

  // ========== Favorites Methods ==========

  async getFavorite(compositeId: string): Promise<FavoriteEntry | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('favorites', 'readonly');
      const store = tx.objectStore('favorites');
      const request = store.get(compositeId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllFavorites(): Promise<FavoriteEntry[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('favorites', 'readonly');
      const store = tx.objectStore('favorites');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async addFavorite(favorite: FavoriteEntry): Promise<void> {
    if (!this.db) await this.init();

    // Check max 50 limit
    const allFavorites = await this.getAllFavorites();
    if (allFavorites.length >= 50) {
      throw new Error('Maximum 50 favorites reached');
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('favorites', 'readwrite');
      const store = tx.objectStore('favorites');
      const request = store.put(favorite);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async removeFavorite(compositeId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('favorites', 'readwrite');
      const store = tx.objectStore('favorites');
      const request = store.delete(compositeId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async isFavorited(compositeId: string): Promise<boolean> {
    const favorite = await this.getFavorite(compositeId);
    return favorite !== undefined;
  }

  // ========== Custom Rulesets Methods ==========

  async getCustomRuleset(id: string): Promise<CustomRuleset | undefined> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('custom-rulesets', 'readonly');
      const store = tx.objectStore('custom-rulesets');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllCustomRulesets(): Promise<CustomRuleset[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('custom-rulesets', 'readonly');
      const store = tx.objectStore('custom-rulesets');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCustomRuleset(ruleset: CustomRuleset): Promise<void> {
    if (!this.db) await this.init();

    // Enforce max 20 rules limit (except for favorites collection)
    if (ruleset.type !== 'favorites' && ruleset.rules.length > 20) {
      throw new Error('Custom ruleset cannot exceed 20 rules');
    }

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('custom-rulesets', 'readwrite');
      const store = tx.objectStore('custom-rulesets');
      const request = store.put(ruleset);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCustomRuleset(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('custom-rulesets', 'readwrite');
      const store = tx.objectStore('custom-rulesets');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
