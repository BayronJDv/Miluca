import { getDb, enqueueGlobalOperation, executeInTransaction } from './database';
import { obtenerLotesVendibles, ajustarCantidadLote } from './batches';
import { registrarMovimiento } from './stock_movements';
import { verificarYCrearNotificacion } from './product_notifications';

export interface Venta {
  id?: number;
  sale_date: string;
  total: number;
  profit: number;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_nit?: string | null;
}

export interface ItemVenta {
  product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  batch_id?: number;
  lot_number?: string | null;
  expiration_date?: string | null;
}

export interface Factura {
  venta: Venta;
  items: ItemVenta[];
}

export interface EstimacionVenta {
  totalProfit: number;
  lines: { product_id: number; product_name: string; price: number; quantity: number; profit: number; lot_number: string; cost: number; expiration_date: string | null }[];
}

/** Simula FEFO sin modificar stock para detectar pérdidas antes de confirmar. */
export async function estimarUtilidadVenta(items: { product_id: number; quantity: number; price: number }[]): Promise<EstimacionVenta> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    const lines: EstimacionVenta['lines'] = [];
    for (const item of items) {
      const product = (await db.select<{ name: string }[]>('SELECT name FROM products WHERE id = ?', [item.product_id]))[0];
      if (!product) throw new Error(`Producto no encontrado ID: ${item.product_id}`);
      let remaining = item.quantity;
      const lots = await obtenerLotesVendibles(item.product_id, db);
      for (const lot of lots) {
        if (remaining <= 0) break;
        const quantity = Math.min(remaining, lot.quantity);
        lines.push({ product_id: item.product_id, product_name: product.name, price: item.price, quantity, profit: (item.price - lot.cost) * quantity, lot_number: lot.lot_number, cost: lot.cost, expiration_date: lot.expiration_date });
        remaining -= quantity;
      }
      if (remaining > 0) throw new Error(`Stock insuficiente para ${product.name}.`);
    }
    return { totalProfit: lines.reduce((sum, line) => sum + line.profit, 0), lines };
  });
}

export async function registrarVenta(
  items: { product_id: number; quantity: number; price: number }[], userId: number | null = null, customerId: number | null = null
): Promise<Factura> {
  return executeInTransaction(async (db) => {
    let total = 0;
    let profit = 0;
    const allocations: { item: typeof items[number]; batchId: number; quantity: number; cost: number }[] = [];
    for (const item of items) {
      let remaining = item.quantity;
      const batches = await obtenerLotesVendibles(item.product_id, db);
      for (const batch of batches) {
        if (remaining <= 0) break;
        const quantity = Math.min(remaining, batch.quantity);
        allocations.push({ item, batchId: batch.id, quantity, cost: batch.cost });
        remaining -= quantity;
      }
      if (remaining > 0) throw new Error(`Stock insuficiente para producto ID: ${item.product_id}`);
    }
    for (const allocation of allocations) {
      total += allocation.quantity * allocation.item.price;
      profit += (allocation.item.price - allocation.cost) * allocation.quantity;
    }

    const result = await db.execute(
      `INSERT INTO sales (user_id, customer_id, sale_date, total, profit) VALUES (?, ?, datetime('now'), ?, ?)`, [userId, customerId, total, profit]
    );
    
    const saleId = result.lastInsertId;
    
    for (const allocation of allocations) {
      await db.execute(
        `INSERT INTO sale_items (sale_id, product_id, batch_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)`,
        [saleId, allocation.item.product_id, allocation.batchId, allocation.quantity, allocation.item.price, allocation.quantity * allocation.item.price]
      );
      await ajustarCantidadLote(allocation.batchId, -allocation.quantity, db);
      await registrarMovimiento({ batch_id: allocation.batchId, movement_type: 'salida_venta', quantity: allocation.quantity, user_id: userId, reference_type: 'sale', reference_id: saleId }, db);
    }
    for (const item of items) await verificarYCrearNotificacion(item.product_id, db);
    
    // 5. Fetch resulting invoice to return
    const venta = await db.select<Venta[]>(
      `SELECT s.*, c.name as customer_name, c.nit as customer_nit
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.id = ?`,
      [saleId]
    );
    
    const itemsConNombre = await db.select<ItemVenta[]>(
      `SELECT 
        si.product_id,
        p.name as product_name,
         si.unit_price as price,
        si.quantity,
         si.subtotal, si.batch_id, b.lot_number, b.expiration_date
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        JOIN product_batches b ON b.id = si.batch_id
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
      `SELECT s.*, c.name as customer_name, c.nit as customer_nit
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       ${whereClause}
       ORDER BY s.sale_date DESC
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
  fechaFin?: string,
  vendedorId?: number
): Promise<number> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (fechaInicio && fechaFin) {
      where.push("date(sale_date, 'localtime') >= ? AND date(sale_date, 'localtime') <= ?");
      params.push(fechaInicio, fechaFin);
    } else {
      where.push("date(sale_date, 'localtime') = date('now', 'localtime')");
    }
    if (vendedorId) {
      where.push("user_id = ?");
      params.push(vendedorId);
    }
    const query = `SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE ${where.join(' AND ')}`;
    const result = await db.select<{ total: number }[]>(query, params);
    return result[0].total;
  });
}

export async function obtenerProfitHoy(
  fechaInicio?: string,
  fechaFin?: string,
  vendedorId?: number
): Promise<number> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (fechaInicio && fechaFin) {
      where.push("date(sale_date, 'localtime') >= ? AND date(sale_date, 'localtime') <= ?");
      params.push(fechaInicio, fechaFin);
    } else {
      where.push("date(sale_date, 'localtime') = date('now', 'localtime')");
    }
    if (vendedorId) {
      where.push("user_id = ?");
      params.push(vendedorId);
    }
    const query = `SELECT COALESCE(SUM(profit), 0) as profit FROM sales WHERE ${where.join(' AND ')}`;
    const result = await db.select<{ profit: number }[]>(query, params);
    return result[0].profit;
  });
}

export async function obtenerNumeroTransaccionesHoy(
  fechaInicio?: string,
  fechaFin?: string,
  vendedorId?: number
): Promise<number> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    const where: string[] = [];
    const params: (string | number)[] = [];
    if (fechaInicio && fechaFin) {
      where.push("date(sale_date, 'localtime') >= ? AND date(sale_date, 'localtime') <= ?");
      params.push(fechaInicio, fechaFin);
    } else {
      where.push("date(sale_date, 'localtime') = date('now', 'localtime')");
    }
    if (vendedorId) {
      where.push("user_id = ?");
      params.push(vendedorId);
    }
    const query = `SELECT COUNT(*) as count FROM sales WHERE ${where.join(' AND ')}`;
    const result = await db.select<{ count: number }[]>(query, params);
    return result[0].count;
  });
}

export interface VentaPorDia {
  fecha: string;
  total_ventas: number;
  num_ventas: number;
  ganancia: number;
}

export async function obtenerVentasPorDia(
  fechaInicio: string,
  fechaFin: string,
  vendedorId?: number
): Promise<VentaPorDia[]> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    let whereClause = "date(sale_date, 'localtime') >= ? AND date(sale_date, 'localtime') <= ?";
    const params: (string | number)[] = [fechaInicio, fechaFin];
    if (vendedorId) {
      whereClause += " AND user_id = ?";
      params.push(vendedorId);
    }
    return db.select<VentaPorDia[]>(
      `SELECT date(sale_date, 'localtime') as fecha,
              COALESCE(SUM(total), 0) as total_ventas,
              COUNT(*) as num_ventas,
              COALESCE(SUM(profit), 0) as ganancia
       FROM sales
       WHERE ${whereClause}
       GROUP BY date(sale_date, 'localtime')
       ORDER BY fecha ASC`,
      params
    );
  });
}

export async function obtenerFactura(id: number): Promise<Factura | null> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    
    const ventas = await db.select<Venta[]>(
      `SELECT s.*, c.name as customer_name, c.nit as customer_nit
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.id = ?`,
      [id]
    );
    
    if (ventas.length === 0) return null;
    
    const items = await db.select<ItemVenta[]>(
      `SELECT 
        si.product_id,
        p.name as product_name,
         si.unit_price as price,
        si.quantity,
         si.subtotal, si.batch_id, b.lot_number, b.expiration_date
        FROM sale_items si
        JOIN products p ON p.id = si.product_id
        JOIN product_batches b ON b.id = si.batch_id
       WHERE si.sale_id = ?`,
      [id]
    );
    
    return {
      venta: ventas[0],
      items
    };
  });
}

export interface ProductoMasVendido {
  product_id: number;
  name: string;
  code: string;
  total_vendido: number;
  total_ingresos: number;
}

export async function obtenerProductosMasVendidos(
  limite: number = 5
): Promise<ProductoMasVendido[]> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    return db.select<ProductoMasVendido[]>(
      `SELECT
        p.id as product_id, p.name, p.code,
        COALESCE(SUM(si.quantity), 0) as total_vendido,
        COALESCE(SUM(si.subtotal), 0) as total_ingresos
       FROM sale_items si
       JOIN products p ON p.id = si.product_id
       GROUP BY si.product_id
       ORDER BY total_vendido DESC
       LIMIT ?`,
      [limite]
    );
  });
}
