/**
 * Poem collection management service
 */
import { storageService } from './storage-service';
import { generateShortHash } from '../../utils/hash-utils';
import type { CollectionPoem } from './models';
import { MAX_POEMS, STORAGE_KEYS } from '../../constants';

const POEMS_KEY = STORAGE_KEYS.POEMS;

export class CollectionService {
  async addPoem(
    ruleSetId: string,
    ruleIdentifier: string,
    ruleName: string,
    poemText: string,
    beautified: string
  ): Promise<'added' | 'duplicate' | 'full'> {
    await storageService.init();
    const poems = await this.loadPoems();

    if (poems.length >= MAX_POEMS) return 'full';

    const poemHash = await generateShortHash(ruleIdentifier, poemText);
    if (poems.some(p => p.poemHash === poemHash)) return 'duplicate';

    poems.push({
      ruleSetId,
      ruleIdentifier,
      ruleName,
      poemText,
      beautified,
      poemHash,
      addedAt: Date.now()
    });

    await this.savePoems(poems);
    return 'added';
  }

  async removePoem(poemHash: string): Promise<void> {
    await storageService.init();
    const poems = await this.loadPoems();
    const filtered = poems.filter(p => p.poemHash !== poemHash);
    await this.savePoems(filtered);
  }

  async getAllPoems(): Promise<CollectionPoem[]> {
    await storageService.init();
    return this.loadPoems();
  }

  async isInCollection(ruleIdentifier: string, poemText: string): Promise<boolean> {
    await storageService.init();
    const poemHash = await generateShortHash(ruleIdentifier, poemText);
    const poems = await this.loadPoems();
    return poems.some(p => p.poemHash === poemHash);
  }

  async getPoemCount(): Promise<number> {
    const poems = await this.loadPoems();
    return poems.length;
  }

  private async loadPoems(): Promise<CollectionPoem[]> {
    return await storageService.indexedDB.getData<CollectionPoem[]>(POEMS_KEY) ?? [];
  }

  private async savePoems(poems: CollectionPoem[]): Promise<void> {
    await storageService.indexedDB.saveData(POEMS_KEY, poems);
  }
}

export const collectionService = new CollectionService();
