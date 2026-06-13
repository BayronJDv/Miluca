import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:mydatabase.db');

    await db.execute('PRAGMA journal_mode = WAL');
    await db.execute('PRAGMA busy_timeout = 10000');
    await db.execute('PRAGMA synchronous = NORMAL');
    await db.execute('PRAGMA cache_size = -2000');
    await db.execute('PRAGMA temp_store = MEMORY');
    await db.execute('PRAGMA mmap_size = 268435456');
  }
  return db;
}

// Global Operation Queue to prevent SQLITE_BUSY deadlocks across all modules
type QueueOperation = () => Promise<any>;
const globalOperationQueue: QueueOperation[] = [];
let isProcessingGlobalQueue = false;

async function processGlobalQueue() {
  if (isProcessingGlobalQueue) return;
  isProcessingGlobalQueue = true;

  while (globalOperationQueue.length > 0) {
    const operation = globalOperationQueue.shift();
    if (operation) {
      try {
        await operation();
      } catch (error) {
        console.error('Error processing global queued operation:', error);
      }
    }
  }

  isProcessingGlobalQueue = false;
}

export function enqueueGlobalOperation<T>(operation: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    globalOperationQueue.push(async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processGlobalQueue();
  });
}

/**
 * Safely executes a block of code within a database transaction.
 * Queues the operation globally to ensure no other transactions run concurrently.
 */
export function executeInTransaction<T>(operation: (db: Database) => Promise<T>): Promise<T> {
  return enqueueGlobalOperation(async () => {
    const dbInstance = await getDb();
    // NOTA: No usamos BEGIN/COMMIT manualmente porque tauri-plugin-sql usa un pool de conexiones,
    // por lo que cada db.execute() puede ir a una conexión distinta, lo que causa errores
    // "cannot start a transaction within a transaction".
    // En su lugar, dependemos de que enqueueGlobalOperation serializa todas las operaciones
    // para evitar race conditions a nivel de aplicación.
    return await operation(dbInstance);
  });
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.execute('PRAGMA wal_checkpoint(TRUNCATE)');
    await db.close();
    db = null;
  }
}
