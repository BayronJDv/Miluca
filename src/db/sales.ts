import { getDb } from './database';
import { actualizarStock } from './products';

export interface Venta {
  id?: number;
  sale_date: string;
  total: number;
}

export interface ItemVenta {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Factura {
  venta: Venta;
  items: ItemVenta[];
}

type QueueOperation = () => Promise<any>;
const operationQueue: QueueOperation[] = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  
  while (operationQueue.length > 0) {
    const operation = operationQueue.shift();
    if (operation) {
      try {
        await operation();
      } catch (error) {
        console.error('Error processing queued operation:', error);
      }
    }
  }
  
  isProcessingQueue = false;
}

function enqueueOperation<T>(operation: () => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    operationQueue.push(async () => {
      try {
        const result = await operation();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
    processQueue();
  });
}

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 100
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const isLockError = error.message?.toLowerCase().includes('locked') ||
                          error.message?.toLowerCase().includes('busy');
      
      if (!isLockError || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(2, attempt) + Math.random() * 100;
      console.log(`Database locked, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error('Operation failed after retries');
}



async function validarYPrepararVenta(
  items: { product_id: number; quantity: number; price: number }[]
): Promise<{
  isValid: boolean;
  total: number;
  error?: string;
}> {
  const db = await getDb();
  
  for (const item of items) {
    const stockCheck = await db.select<{ stock: number }[]>(
      'SELECT stock FROM products WHERE id = ?',
      [item.product_id]
    );
    
    if (!stockCheck.length) {
      return {
        isValid: false,
        total: 0,
        error: `Producto ID ${item.product_id} no encontrado`
      };
    }
    
    if (stockCheck[0].stock < item.quantity) {
      return {
        isValid: false,
        total: 0,
        error: `Stock insuficiente para producto ID: ${item.product_id}. Disponible: ${stockCheck[0].stock}, Requerido: ${item.quantity}`
      };
    }
  }
  
  const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  
  return {
    isValid: true,
    total,
  };
}

async function ejecutarTransaccionVenta(
  items: { product_id: number; quantity: number; price: number }[],
  total: number
): Promise<Factura> {
  return enqueueOperation(() =>
    withRetry(async () => {
      const db = await getDb();
      
      try {
        await db.execute('BEGIN IMMEDIATE');
        
        for (const item of items) {
          const updateResult = await db.execute(
            `UPDATE products 
             SET stock = stock - ? 
             WHERE id = ? AND stock >= ?`,
            [item.quantity, item.product_id, item.quantity]
          );
          
          if (updateResult.rowsAffected === 0) {
            throw new Error(`Stock insuficiente para producto ID: ${item.product_id}`);
          }
        }
        
        const result = await db.execute(
          `INSERT INTO sales (sale_date, total) 
           VALUES (datetime('now'), ?)`,
          [total]
        );
        
        const saleId = result.lastInsertId;
        
        for (const item of items) {
          await db.execute(
            `INSERT INTO sale_items (sale_id, product_id, quantity, subtotal) 
             VALUES (?, ?, ?, ?)`,
            [saleId, item.product_id, item.quantity, item.quantity * item.price]
          );
        }
        
        await db.execute('COMMIT');
        
        const [venta, itemsConNombre] = await Promise.all([
          db.select<Venta[]>(
            'SELECT * FROM sales WHERE id = ?',
            [saleId]
          ),
          db.select<ItemVenta[]>(
            `SELECT 
              si.product_id,
              p.name as product_name,
              p.price as price,
              si.quantity,
              si.subtotal
             FROM sale_items si
             JOIN products p ON p.id = si.product_id
             WHERE si.sale_id = ?`,
            [saleId]
          )
        ]);
        
        return {
          venta: venta[0],
          items: itemsConNombre
        };
        
      } catch (error) {
        try {
          await db.execute('ROLLBACK');
        } catch (rollbackError) {
          console.error('Error al hacer rollback:', rollbackError);
        }
        throw error;
      }
    })
  );
}

export async function registrarVenta(
  items: { product_id: number; quantity: number; price: number }[]
): Promise<Factura> {
  const validation = await validarYPrepararVenta(items);
  
  if (!validation.isValid) {
    throw new Error(validation.error);
  }
  
  return ejecutarTransaccionVenta(items, validation.total);
}

export async function obtenerVentas(
  pagina: number = 1,
  porPagina: number = 20
): Promise<{ ventas: Venta[]; total: number; pagina: number; totalPaginas: number }> {
  return withRetry(async () => {
    const db = await getDb();
    const offset = (pagina - 1) * porPagina;
    
    const [{ count }] = await db.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM sales'
    );
    
    const ventas = await db.select<Venta[]>(
      `SELECT * FROM sales
       ORDER BY sale_date DESC
       LIMIT ? OFFSET ?`,
      [porPagina, offset]
    );
    
    return {
      ventas,
      total: count,
      pagina,
      totalPaginas: Math.ceil(count / porPagina),
    };
  });
}

export async function obtenerFactura(id: number): Promise<Factura | null> {
  return withRetry(async () => {
    const db = await getDb();
    
    const ventas = await db.select<Venta[]>(
      'SELECT * FROM sales WHERE id = ?',
      [id]
    );
    
    if (ventas.length === 0) return null;
    
    const items = await db.select<ItemVenta[]>(
      `SELECT 
        si.product_id,
        p.name as product_name,
        p.price as price,
        si.quantity,
        si.subtotal
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       WHERE si.sale_id = ?`,
      [id]
    );
    
    return {
      venta: ventas[0],
      items
    };
  });
}

export function getQueueStatus() {
  return {
    pendingOperations: operationQueue.length,
    isProcessing: isProcessingQueue
  };
}