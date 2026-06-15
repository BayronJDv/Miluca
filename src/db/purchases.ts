import { getDb, enqueueGlobalOperation, executeInTransaction } from './database';
import { actualizarStock } from './products';

export interface Compra {
  id?: number;
  supplier_id: number | null;
  supplier_name?: string;
  purchase_date: string;
  total_cost: number;
}

export interface ItemCompra {
  product_id: number;
  product_name: string;
  quantity: number;
  cost: number;
  subtotal: number;
}

export interface CompraFactura {
  compra: Compra;
  items: ItemCompra[];
}

export async function registrarCompra(
  items: { product_id: number; quantity: number; cost: number }[],
  supplier_id: number | null
): Promise<CompraFactura> {
  return executeInTransaction(async (db) => {
    const total_cost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

    const result = await db.execute(
      `INSERT INTO purchases (supplier_id, purchase_date, total_cost)
       VALUES (?, datetime('now'), ?)`,
      [supplier_id, total_cost]
    );

    const purchaseId = result.lastInsertId;

    for (const item of items) {
      await db.execute(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, cost)
         VALUES (?, ?, ?, ?)`,
        [purchaseId, item.product_id, item.quantity, item.cost]
      );

      // Pass 'db' explicitly to ensure we use the same connection for the transaction
      await actualizarStock(item.product_id, item.quantity, db);
    }

    const compra = await db.select<Compra[]>(
      'SELECT * FROM purchases WHERE id = ?',
      [purchaseId]
    );

    const itemsConNombre = await db.select<ItemCompra[]>(
      `SELECT
        pi.product_id,
        p.name as product_name,
        pi.quantity,
        pi.cost,
        (pi.quantity * pi.cost) as subtotal
       FROM purchase_items pi
       JOIN products p ON p.id = pi.product_id
       WHERE pi.purchase_id = ?`,
      [purchaseId]
    );

    return {
      compra: compra[0],
      items: itemsConNombre
    };
  });
}

export async function obtenerCompras(
  pagina: number = 1,
  porPagina: number = 20,
  fechaInicio?: string,
  fechaFin?: string
): Promise<{ compras: Compra[]; total: number; pagina: number; totalPaginas: number }> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    const offset = (pagina - 1) * porPagina;

    const conditions: string[] = [];
    const params: any[] = [];

    if (fechaInicio) {
      conditions.push("datetime(p.purchase_date, 'localtime') >= ?");
      params.push(`${fechaInicio} 00:00:00`);
    }
    if (fechaFin) {
      conditions.push("datetime(p.purchase_date, 'localtime') <= ?");
      params.push(`${fechaFin} 23:59:59`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [{ count }] = await db.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM purchases p ${whereClause}`,
      params
    );

    const compras = await db.select<Compra[]>(
      `SELECT p.*, s.name as supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       ${whereClause}
       ORDER BY p.purchase_date DESC
       LIMIT ? OFFSET ?`,
      [...params, porPagina, offset]
    );

    return {
      compras,
      total: count,
      pagina,
      totalPaginas: Math.ceil(count / porPagina),
    };
  });
}

export async function obtenerTotalCompras(
  fechaInicio?: string,
  fechaFin?: string
): Promise<number> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    let query: string;
    let params: string[];
    if (fechaInicio && fechaFin) {
      query = `SELECT COALESCE(SUM(total_cost), 0) as total FROM purchases WHERE datetime(purchase_date, 'localtime') >= ? AND datetime(purchase_date, 'localtime') <= ?`;
      params = [`${fechaInicio} 00:00:00`, `${fechaFin} 23:59:59`];
    } else {
      query = `SELECT COALESCE(SUM(total_cost), 0) as total FROM purchases WHERE date(purchase_date, 'localtime') = date('now', 'localtime')`;
      params = [];
    }
    const result = await db.select<{ total: number }[]>(query, params);
    return result[0].total;
  });
}

export interface CompraPorDia {
  fecha: string;
  total_compras: number;
}

export async function obtenerComprasPorDia(
  fechaInicio: string,
  fechaFin: string
): Promise<CompraPorDia[]> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    return db.select<CompraPorDia[]>(
      `SELECT date(purchase_date, 'localtime') as fecha,
              COALESCE(SUM(total_cost), 0) as total_compras
       FROM purchases
       WHERE date(purchase_date, 'localtime') >= ? AND date(purchase_date, 'localtime') <= ?
       GROUP BY date(purchase_date, 'localtime')
       ORDER BY fecha ASC`,
      [fechaInicio, fechaFin]
    );
  });
}

export async function obtenerCompra(id: number): Promise<CompraFactura | null> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();

    const compras = await db.select<Compra[]>(
      `SELECT p.*, s.name as supplier_name
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE p.id = ?`,
      [id]
    );

    if (compras.length === 0) return null;

    const items = await db.select<ItemCompra[]>(
      `SELECT
        pi.product_id,
        p.name as product_name,
        pi.quantity,
        pi.cost,
        (pi.quantity * pi.cost) as subtotal
       FROM purchase_items pi
       JOIN products p ON p.id = pi.product_id
       WHERE pi.purchase_id = ?`,
      [id]
    );

    return {
      compra: compras[0],
      items
    };
  });
}
