import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:mydatabase.db');
    
    // Configuraciones para mejor concurrencia
    await db.execute(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      PRAGMA synchronous = NORMAL;
      PRAGMA cache_size = -2000;
      PRAGMA temp_store = MEMORY;
      PRAGMA mmap_size = 268435456;
    `);
    
    console.log('Database configured with WAL mode and busy_timeout=5000ms');
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
    db = null;
  }
}