import { executeInTransaction, getDb } from './database';
import { ajustarCantidadLote } from './batches';
import { registrarMovimiento } from './stock_movements';

export interface Disposal { id: number; batch_id: number; quantity: number; reason: string; disposal_date: string; notes: string | null; lot_number?: string; product_name?: string; }

export async function registrarBaja(input: { batch_id: number; quantity: number; reason: 'vencido' | 'averiado' | 'retiro_mercado' | 'otro'; notes?: string; user_id?: number | null }): Promise<number> {
  return executeInTransaction(async db => {
    const batches = await db.select<{ quantity: number }[]>('SELECT quantity FROM product_batches WHERE id = ? AND status IN (\'activo\', \'vencido\')', [input.batch_id]);
    if (!batches.length || batches[0].quantity < input.quantity) throw new Error('Cantidad no disponible en el lote');
    const result = await db.execute('INSERT INTO disposals (batch_id, quantity, reason, user_id, notes) VALUES (?, ?, ?, ?, ?)', [input.batch_id, input.quantity, input.reason, input.user_id ?? null, input.notes ?? null]);
    await ajustarCantidadLote(input.batch_id, -input.quantity, db);
    await registrarMovimiento({ batch_id: input.batch_id, movement_type: 'baja', quantity: input.quantity, user_id: input.user_id, reason: input.reason, reference_type: 'disposal', reference_id: result.lastInsertId }, db);
    return result.lastInsertId ?? 0;
  });
}

export async function obtenerBajas(): Promise<Disposal[]> {
  const db = await getDb();
  return db.select<Disposal[]>(`SELECT d.*, b.lot_number, p.name AS product_name FROM disposals d JOIN product_batches b ON b.id = d.batch_id JOIN products p ON p.id = b.product_id ORDER BY d.disposal_date DESC`);
}
