/**
 * Unified storage service facade
 */
import { LocalStorageService } from './local-storage';
import { IndexedDBService } from './indexed-db';
import type { EditorState, UIState } from './models';

export class StorageService {
  private localStorage = new LocalStorageService();
  public indexedDB = new IndexedDBService();
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await this.indexedDB.init();
    this.initialized = true;
  }

  // Editor state
  saveEditorState(state: Partial<EditorState>): void {
    if (state.text !== undefined) this.localStorage.set('editor:text', state.text);
    if (state.language !== undefined) this.localStorage.set('editor:language', state.language);
    if (state.matchYati !== undefined) this.localStorage.set('editor:matchYati', state.matchYati);
    if (state.matchPrasa !== undefined) this.localStorage.set('editor:matchPrasa', state.matchPrasa);
    if (state.selectedRule !== undefined) this.localStorage.set('editor:selectedRule', state.selectedRule);
  }

  loadEditorState(): EditorState {
    return {
      text: this.localStorage.get<string>('editor:text', '') || '',
      language: this.localStorage.get<string>('editor:language', 'te') || 'te',
      matchYati: this.localStorage.get<boolean>('editor:matchYati', true) ?? true,
      matchPrasa: this.localStorage.get<boolean>('editor:matchPrasa', true) ?? true,
      selectedRule: this.localStorage.get<string>('editor:selectedRule', '')
    };
  }

  clearEditorState(): void {
    this.localStorage.remove('editor:text');
    this.localStorage.remove('editor:selectedRule');
  }

  // UI state
  saveUIState(state: Partial<UIState>): void {
    if (state.ruleSet !== undefined) this.localStorage.set('ui:ruleSet', state.ruleSet);
    if (state.autoDetect !== undefined) this.localStorage.set('ui:autoDetect', state.autoDetect);
    if (state.lastVisited !== undefined) this.localStorage.set('ui:lastVisited', state.lastVisited);
  }

  loadUIState(): UIState {
    return {
      ruleSet: this.localStorage.get<string>('ui:ruleSet', 'frequent') || 'frequent',
      autoDetect: this.localStorage.get<boolean>('ui:autoDetect', true) ?? true,
      lastVisited: this.localStorage.get<string>('ui:lastVisited')
    };
  }

  // Clear all data
  async clearAll(): Promise<void> {
    this.localStorage.clear();

    // Clear all favorites and custom rulesets
    await this.init();
    const favorites = await this.indexedDB.getAllFavorites();
    for (const fav of favorites) {
      await this.indexedDB.removeFavorite(fav.id);
    }

    const customRulesets = await this.indexedDB.getAllCustomRulesets();
    for (const ruleset of customRulesets) {
      await this.indexedDB.deleteCustomRuleset(ruleset.id);
    }
  }
}

// Singleton instance
export const storageService = new StorageService();
