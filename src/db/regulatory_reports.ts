import { getDb } from './database';

export async function obtenerKardexRegulatorio(productId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  return db.select(`SELECT sm.movement_date, sm.movement_type, sm.quantity, sm.reason,
    p.name AS product_name, p.code, b.lot_number, b.manufacture_date, b.expiration_date,
    b.cost, sm.reference_type, sm.reference_id
    FROM stock_movements sm JOIN product_batches b ON b.id = sm.batch_id JOIN products p ON p.id = b.product_id
    WHERE b.product_id = ? AND (? IS NULL OR date(sm.movement_date, '-5 hours') >= ?) AND (? IS NULL OR date(sm.movement_date, '-5 hours') <= ?)
    ORDER BY sm.movement_date`, [productId, startDate ?? null, startDate ?? null, endDate ?? null, endDate ?? null]);
}

export async function obtenerInformeVencidosBajas() {
  const db = await getDb();
  return db.select(`SELECT p.name AS product_name, p.code, b.lot_number, b.expiration_date,
    b.quantity AS remaining_quantity, d.quantity AS disposed_quantity, d.reason, d.disposal_date, d.notes
    FROM product_batches b JOIN products p ON p.id = b.product_id LEFT JOIN disposals d ON d.batch_id = b.id
    WHERE b.expiration_date IS NOT NULL AND date(b.expiration_date) < date('now') OR d.id IS NOT NULL
    ORDER BY COALESCE(d.disposal_date, b.expiration_date) DESC`);
}
