import Database from '@tauri-apps/plugin-sql';
import { enqueueGlobalOperation, getDb } from './database';

export interface ProductBatch {
  id: number;
  product_id: number;
  lot_number: string;
  manufacture_date: string | null;
  expiration_date: string | null;
  quantity: number;
  cost: number;
  supplier_id: number | null;
  status: 'activo' | 'vencido' | 'cuarentena' | 'baja';
  created_at: string;
}

export async function obtenerLotes(productId: number): Promise<ProductBatch[]> {
  const db = await getDb();
  return db.select<ProductBatch[]>(
    `SELECT * FROM product_batches WHERE product_id = ? ORDER BY
     CASE WHEN expiration_date IS NULL THEN 1 ELSE 0 END, expiration_date ASC, id ASC`, [productId]
  );
}

export async function obtenerLotesVendibles(productId: number, dbParam?: Database): Promise<ProductBatch[]> {
  const db = dbParam || await getDb();
  return db.select<ProductBatch[]>(
    `SELECT * FROM product_batches
     WHERE product_id = ? AND status = 'activo' AND quantity > 0
       AND (expiration_date IS NULL OR date(expiration_date) >= date('now'))
     ORDER BY CASE WHEN expiration_date IS NULL THEN 1 ELSE 0 END, expiration_date ASC, id ASC`, [productId]
  );
}

export async function obtenerLotesPorVencer(dias = 30): Promise<ProductBatch[]> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    return db.select<ProductBatch[]>(
      `SELECT b.*, p.name AS product_name FROM product_batches b JOIN products p ON p.id = b.product_id
       WHERE b.status = 'activo' AND b.expiration_date IS NOT NULL
       AND date(b.expiration_date) BETWEEN date('now') AND date('now', '+' || ? || ' days')
       ORDER BY b.expiration_date`, [dias]
    );
  });
}

export async function obtenerLotesVencidos(): Promise<ProductBatch[]> {
  const db = await getDb();
  return db.select<ProductBatch[]>(
    `SELECT b.*, p.name AS product_name FROM product_batches b JOIN products p ON p.id = b.product_id
     WHERE b.status IN ('activo','vencido') AND b.expiration_date IS NOT NULL
       AND date(b.expiration_date) < date('now') ORDER BY b.expiration_date`
  );
}

export async function marcarLotesVencidos(dbParam?: Database): Promise<void> {
  const db = dbParam || await getDb();
  await db.execute(`UPDATE product_batches SET status = 'vencido'
    WHERE status = 'activo' AND expiration_date IS NOT NULL AND date(expiration_date) < date('now')`);
}

export async function crearLote(
  lote: Omit<ProductBatch, 'id' | 'created_at' | 'status'> & { status?: ProductBatch['status'] },
  dbParam?: Database
): Promise<number> {
  const db = dbParam || await getDb();
  const result = await db.execute(
    `INSERT INTO product_batches (product_id, lot_number, manufacture_date, expiration_date, quantity, cost, supplier_id, purchase_item_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [lote.product_id, lote.lot_number, lote.manufacture_date, lote.expiration_date, lote.quantity,
      lote.cost, lote.supplier_id, null, lote.status ?? 'activo']
  );
  return result.lastInsertId ?? 0;
}

export async function ajustarCantidadLote(batchId: number, quantity: number, db: Database): Promise<void> {
  const result = await db.execute(
    `UPDATE product_batches SET quantity = quantity + ? WHERE id = ? AND quantity + ? >= 0`,
    [quantity, batchId, quantity]
  );
  if (!result.rowsAffected) throw new Error('Cantidad de lote insuficiente');
}

export async function obtenerKardexProducto(productId: number) {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    return db.select(`SELECT sm.*, b.lot_number, b.expiration_date, p.name AS product_name
      FROM stock_movements sm JOIN product_batches b ON b.id = sm.batch_id
      JOIN products p ON p.id = b.product_id WHERE b.product_id = ? ORDER BY sm.movement_date DESC`, [productId]);
  });
}
