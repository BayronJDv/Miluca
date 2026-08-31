import { getDb, enqueueGlobalOperation, executeInTransaction } from './database';
import { crearLote } from './batches';
import { registrarMovimiento } from './stock_movements';
import { verificarYCrearNotificacion } from './product_notifications';

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
  lot_number?: string | null;
  manufacture_date?: string | null;
  expiration_date?: string | null;
  batch_id?: number;
}

export interface CompraFactura {
  compra: Compra;
  items: ItemCompra[];
}

const normalizarMes = (value?: string | null): string | null => (value ? `${value.slice(0, 7)}-01` : null);

export async function registrarCompra(
  items: { product_id: number; quantity: number; cost: number; lot_number?: string; manufacture_date?: string | null; expiration_date?: string | null }[],
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

    const ahora = new Date();
    const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;

    for (const item of items) {
      const product = (await db.select<{ requires_lot_control: number }[]>('SELECT requires_lot_control FROM products WHERE id = ?', [item.product_id]))[0];
      const lotNumber = item.lot_number?.trim() || 'S/N';
      const expiration = normalizarMes(item.expiration_date);
      const manufacture = normalizarMes(item.manufacture_date);
      if (product?.requires_lot_control && (!item.lot_number || !expiration)) throw new Error('El producto requiere lote y fecha de vencimiento');
      if (expiration && expiration.slice(0, 7) < mesActual) throw new Error('El mes de vencimiento no puede ser anterior al mes actual');
      if (manufacture && expiration && manufacture > expiration) throw new Error('La fabricación no puede ser posterior al vencimiento');
      const batchId = await crearLote({ product_id: item.product_id, lot_number: lotNumber, manufacture_date: manufacture, expiration_date: expiration, quantity: item.quantity, cost: item.cost, supplier_id }, db);
      const purchaseItem = await db.execute(
        `INSERT INTO purchase_items (purchase_id, product_id, batch_id, quantity, cost, lot_number, manufacture_date, expiration_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [purchaseId, item.product_id, batchId, item.quantity, item.cost, lotNumber, manufacture, expiration]
      );
      await db.execute('UPDATE product_batches SET purchase_item_id = ? WHERE id = ?', [purchaseItem.lastInsertId, batchId]);
      await registrarMovimiento({ batch_id: batchId, movement_type: 'entrada_compra', quantity: item.quantity, reference_type: 'purchase', reference_id: purchaseId }, db);
      await verificarYCrearNotificacion(item.product_id, db);
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
         (pi.quantity * pi.cost) as subtotal, pi.lot_number, pi.manufacture_date, pi.expiration_date, pi.batch_id
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
         (pi.quantity * pi.cost) as subtotal, pi.lot_number, pi.manufacture_date, pi.expiration_date, pi.batch_id
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
