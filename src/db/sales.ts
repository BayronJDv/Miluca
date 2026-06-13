import { getDb, enqueueGlobalOperation, executeInTransaction } from './database';
import { actualizarStock } from './products';

export interface Venta {
  id?: number;
  sale_date: string;
  total: number;
  profit: number;
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

export async function registrarVenta(
  items: { product_id: number; quantity: number; price: number }[]
): Promise<Factura> {
  return executeInTransaction(async (db) => {
    // 1. Get product costs and verify stock within transaction
    const ids = items.map(i => i.product_id);
    const placeholders = ids.map(() => '?').join(',');
    const productsInfo = await db.select<{ id: number; stock: number; cost: number }[]>(
      `SELECT id, stock, cost FROM products WHERE id IN (${placeholders})`,
      ids
    );

    const productMap = new Map(productsInfo.map(p => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        throw new Error(`Producto no encontrado ID: ${item.product_id}`);
      }
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para producto ID: ${item.product_id}`);
      }
    }

    // 2. Calculate total and profit (profit = Σ (price - cost) × quantity)
    let total = 0;
    let profit = 0;
    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      total += item.quantity * item.price;
      profit += (item.price - product.cost) * item.quantity;
    }

    // 3. Insert sale with profit
    const result = await db.execute(
      `INSERT INTO sales (sale_date, total, profit) 
       VALUES (datetime('now'), ?, ?)`,
      [total, profit]
    );
    
    const saleId = result.lastInsertId;
    
    // 4. Insert items and update stock (passing the db instance!)
    for (const item of items) {
      await db.execute(
        `INSERT INTO sale_items (sale_id, product_id, quantity, subtotal) 
         VALUES (?, ?, ?, ?)`,
        [saleId, item.product_id, item.quantity, item.quantity * item.price]
      );
      
      // Crucial: Pass the SAME transaction database connection to avoid locks
      await actualizarStock(item.product_id, -item.quantity, db);
    }
    
    // 5. Fetch resulting invoice to return
    const venta = await db.select<Venta[]>(
      'SELECT * FROM sales WHERE id = ?',
      [saleId]
    );
    
    const itemsConNombre = await db.select<ItemVenta[]>(
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
    );
    
    return {
      venta: venta[0],
      items: itemsConNombre
    };
  });
}

export async function obtenerVentas(
  pagina: number = 1,
  porPagina: number = 20,
  fechaInicio?: string,
  fechaFin?: string
): Promise<{ ventas: Venta[]; total: number; pagina: number; totalPaginas: number }> {
  // Use enqueueGlobalOperation for reads to avoid SQLITE_BUSY if writing
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    const offset = (pagina - 1) * porPagina;
    
    const conditions: string[] = [];
    const params: (string | number)[] = [];
    if (fechaInicio) {
      conditions.push("date(sale_date, 'localtime') >= ?");
      params.push(fechaInicio);
    }
    if (fechaFin) {
      conditions.push("date(sale_date, 'localtime') <= ?");
      params.push(fechaFin);
    }
    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [{ count }] = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM sales ${whereClause}`,
      params
    );
    
    const ventas = await db.select<Venta[]>(
      `SELECT * FROM sales
       ${whereClause}
       ORDER BY sale_date DESC
       LIMIT ? OFFSET ?`,
      [...params, porPagina, offset]
    );
    
    return {
      ventas,
      total: count,
      pagina,
      totalPaginas: Math.ceil(count / porPagina),
    };
  });
}

export async function obtenerTotalVentasHoy(
  fechaInicio?: string,
  fechaFin?: string
): Promise<number> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    let query: string;
    let params: string[];
    if (fechaInicio && fechaFin) {
      query = `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE date(sale_date, 'localtime') >= ? AND date(sale_date, 'localtime') <= ?`;
      params = [fechaInicio, fechaFin];
    } else {
      query = `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE date(sale_date, 'localtime') = date('now', 'localtime')`;
      params = [];
    }
    const result = await db.select<{ total: number }[]>(query, params);
    return result[0].total;
  });
}

export async function obtenerProfitHoy(
  fechaInicio?: string,
  fechaFin?: string
): Promise<number> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    let query: string;
    let params: string[];
    if (fechaInicio && fechaFin) {
      query = `SELECT COALESCE(SUM(profit), 0) as profit FROM sales WHERE date(sale_date, 'localtime') >= ? AND date(sale_date, 'localtime') <= ?`;
      params = [fechaInicio, fechaFin];
    } else {
      query = `SELECT COALESCE(SUM(profit), 0) as profit FROM sales WHERE date(sale_date, 'localtime') = date('now', 'localtime')`;
      params = [];
    }
    const result = await db.select<{ profit: number }[]>(query, params);
    return result[0].profit;
  });
}

export async function obtenerNumeroTransaccionesHoy(
  fechaInicio?: string,
  fechaFin?: string
): Promise<number> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    let query: string;
    let params: string[];
    if (fechaInicio && fechaFin) {
      query = `SELECT COUNT(*) as count FROM sales WHERE date(sale_date, 'localtime') >= ? AND date(sale_date, 'localtime') <= ?`;
      params = [fechaInicio, fechaFin];
    } else {
      query = `SELECT COUNT(*) as count FROM sales WHERE date(sale_date, 'localtime') = date('now', 'localtime')`;
      params = [];
    }
    const result = await db.select<{ count: number }[]>(query, params);
    return result[0].count;
  });
}

export async function obtenerFactura(id: number): Promise<Factura | null> {
  return enqueueGlobalOperation(async () => {
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
