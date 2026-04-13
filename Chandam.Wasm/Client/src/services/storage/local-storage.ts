/**
 * localStorage wrapper for simple key-value persistence
 */
export class LocalStorageService {
  private prefix = 'chandam:';

  set(key: string, value: any): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save to localStorage: ${key}`, e);
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Failed to read from localStorage: ${key}`, e);
      return defaultValue;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    // Only clear chandam-prefixed keys
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.prefix))
      .forEach(k => localStorage.removeItem(k));
  }
}
