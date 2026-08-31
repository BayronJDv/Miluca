import Database from '@tauri-apps/plugin-sql';
import { executeInTransaction, getDb } from './database';
import { ajustarCantidadLote } from './batches';
import { registrarMovimiento } from './stock_movements';

async function cantidadDevuelta(db: Database, movementType: 'devolucion_entrada' | 'devolucion_salida', referenceType: 'sale' | 'purchase', referenceId: number, batchId: number): Promise<number> {
  const rows = await db.select<{ total: number }[]>(`SELECT COALESCE(SUM(quantity), 0) AS total FROM stock_movements WHERE movement_type = ? AND reference_type = ? AND reference_id = ? AND batch_id = ?`, [movementType, referenceType, referenceId, batchId]);
  return rows[0]?.total ?? 0;
}

export async function obtenerPendienteDevolucionVenta(saleId: number, batchId: number): Promise<number> {
  const db = await getDb();
  const sold = await db.select<{ total: number }[]>('SELECT COALESCE(SUM(quantity), 0) AS total FROM sale_items WHERE sale_id = ? AND batch_id = ?', [saleId, batchId]);
  return Math.max(0, (sold[0]?.total ?? 0) - await cantidadDevuelta(db, 'devolucion_entrada', 'sale', saleId, batchId));
}

export async function obtenerPendienteDevolucionCompra(purchaseId: number, batchId: number): Promise<number> {
  const db = await getDb();
  const purchased = await db.select<{ total: number }[]>('SELECT COALESCE(SUM(quantity), 0) AS total FROM purchase_items WHERE purchase_id = ? AND batch_id = ?', [purchaseId, batchId]);
  return Math.max(0, (purchased[0]?.total ?? 0) - await cantidadDevuelta(db, 'devolucion_salida', 'purchase', purchaseId, batchId));
}

export async function devolverCliente(input: { sale_id: number; batch_id: number; quantity: number; reason?: string; user_id?: number | null }): Promise<void> {
  return executeInTransaction(async db => {
    const sold = await db.select<{ total: number }[]>('SELECT COALESCE(SUM(quantity), 0) AS total FROM sale_items WHERE sale_id = ? AND batch_id = ?', [input.sale_id, input.batch_id]);
    const alreadyReturned = await cantidadDevuelta(db, 'devolucion_entrada', 'sale', input.sale_id, input.batch_id);
    const available = (sold[0]?.total ?? 0) - alreadyReturned;
    if (input.quantity <= 0 || input.quantity > available) throw new Error(`La devolución supera la cantidad pendiente (${available}).`);
    const batch = await db.select<{ id: number }[]>('SELECT id FROM product_batches WHERE id = ?', [input.batch_id]);
    if (!batch.length) throw new Error('El lote original ya no existe.');
    await ajustarCantidadLote(input.batch_id, input.quantity, db);
    await db.execute(`UPDATE product_batches SET status = CASE WHEN expiration_date IS NOT NULL AND date(expiration_date, 'start of month') < date('now', 'start of month') THEN 'vencido' ELSE 'activo' END WHERE id = ?`, [input.batch_id]);
    await registrarMovimiento({ batch_id: input.batch_id, movement_type: 'devolucion_entrada', quantity: input.quantity, user_id: input.user_id, reason: input.reason ?? 'Devolución de cliente', reference_type: 'sale', reference_id: input.sale_id }, db);
  });
}

export async function devolverProveedor(input: { purchase_id: number; batch_id: number; quantity: number; reason?: string; user_id?: number | null }): Promise<void> {
  return executeInTransaction(async db => {
    const purchased = await db.select<{ total: number }[]>('SELECT COALESCE(SUM(quantity), 0) AS total FROM purchase_items WHERE purchase_id = ? AND batch_id = ?', [input.purchase_id, input.batch_id]);
    const alreadyReturned = await cantidadDevuelta(db, 'devolucion_salida', 'purchase', input.purchase_id, input.batch_id);
    const available = (purchased[0]?.total ?? 0) - alreadyReturned;
    if (input.quantity <= 0 || input.quantity > available) throw new Error(`La devolución supera la cantidad pendiente (${available}).`);
    await ajustarCantidadLote(input.batch_id, -input.quantity, db);
    await registrarMovimiento({ batch_id: input.batch_id, movement_type: 'devolucion_salida', quantity: input.quantity, user_id: input.user_id, reason: input.reason ?? 'Devolución a proveedor', reference_type: 'purchase', reference_id: input.purchase_id }, db);
  });
}
