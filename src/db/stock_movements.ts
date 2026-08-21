import Database from '@tauri-apps/plugin-sql';
import { getDb, enqueueGlobalOperation } from './database';

export type MovementType = 'entrada_compra' | 'salida_venta' | 'ajuste_entrada' | 'ajuste_salida' | 'baja' | 'devolucion_entrada' | 'devolucion_salida';

export async function registrarMovimiento(input: {
  batch_id: number; movement_type: MovementType; quantity: number; user_id?: number | null;
  reason?: string | null; reference_type?: string | null; reference_id?: number | null;
}, dbParam?: Database): Promise<number> {
  const db = dbParam || await getDb();
  const result = await db.execute(
    `INSERT INTO stock_movements (batch_id, movement_type, quantity, user_id, reason, reference_type, reference_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [input.batch_id, input.movement_type, input.quantity, input.user_id ?? null, input.reason ?? null,
      input.reference_type ?? null, input.reference_id ?? null]
  );
  return result.lastInsertId ?? 0;
}

export async function obtenerMovimientos(batchId?: number) {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    return db.select(`SELECT sm.*, b.product_id, b.lot_number, b.expiration_date
      FROM stock_movements sm JOIN product_batches b ON b.id = sm.batch_id
      ${batchId ? 'WHERE sm.batch_id = ?' : ''} ORDER BY sm.movement_date DESC`, batchId ? [batchId] : []);
  });
}
