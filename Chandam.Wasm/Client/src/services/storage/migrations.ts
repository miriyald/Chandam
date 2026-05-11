/**
 * Sequential migration framework for browser storage.
 * Modeled after DB migration scripts — each step runs exactly once, in order.
 */

export interface Migration {
  version: string;
  name: string;
  migrate: () => Promise<void>;
}

const DB_NAME = 'ChandamDB';
const VERSION_KEY = 'chandam:storage:version';

const migrations: Migration[] = [
  { version: 'A', name: 'compressed-storage', migrate: migrateToA },
];

export async function runMigrations(): Promise<void> {
  const currentVersion = localStorage.getItem(VERSION_KEY) ?? '';

  for (const migration of migrations) {
    if (currentVersion < migration.version) {
      console.log(`Migration: ${migration.name} → ${migration.version}`);
      await migration.migrate();
      localStorage.setItem(VERSION_KEY, migration.version);
    }
  }
}

export function resetMigrationVersion(): void {
  localStorage.removeItem(VERSION_KEY);
}

async function migrateToA(): Promise<void> {
  // Wipe old IndexedDB (v2 with separate favorites/custom-rulesets stores)
  // and let IndexedDBService.init() recreate with fresh compressed schema
  await deleteDatabase();
}

async function deleteDatabase(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => {
      console.warn('Migration: DB delete blocked — closing open connections');
      resolve();
    };
  });
}
