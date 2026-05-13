/**
 * IndexedDB wrapper — single compressed-data store.
 * All structured data stored as gzip-compressed JSON blobs.
 */
import { compressToGzip, decompressFromGzip } from '../../utils/compression';
import type { CompressedEntry } from './models';

export class IndexedDBService {
  private dbName = 'ChandamDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('compressed-data')) {
          db.createObjectStore('compressed-data', { keyPath: 'id' });
        }
      };
    });
  }

  async destroyAndRecreate(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(this.dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });

    await this.init();
  }

  async getData<T>(id: string): Promise<T | undefined> {
    if (!this.db) await this.init();

    const entry = await this.getRaw(id);
    if (!entry) return undefined;

    const json = await decompressFromGzip(entry.data);
    return JSON.parse(json) as T;
  }

  async saveData<T>(id: string, data: T): Promise<void> {
    if (!this.db) await this.init();

    const json = JSON.stringify(data);
    const compressed = await compressToGzip(json);
    const entry: CompressedEntry = { id, data: compressed };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('compressed-data', 'readwrite');
      const store = tx.objectStore('compressed-data');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteData(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('compressed-data', 'readwrite');
      const store = tx.objectStore('compressed-data');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('compressed-data', 'readwrite');
      const store = tx.objectStore('compressed-data');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getRaw(id: string): Promise<CompressedEntry | undefined> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('compressed-data', 'readonly');
      const store = tx.objectStore('compressed-data');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
