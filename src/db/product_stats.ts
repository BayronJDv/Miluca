import { getDb, enqueueGlobalOperation } from './database';

export interface ProductoEstadistica {
  product_id: number;
  name: string;
  code: string;
  stock: number;
  price: number;
  cost: number;
  unidades_vendidas: number;
  ingresos: number;
  ganancia: number;
  num_ventas: number; // Nº de transacciones distintas donde apareció el producto (proxy de rotación)
}

/**
 * Devuelve, para CADA producto (incluidos los que no se han vendido en el rango),
 * sus estadísticas de ventas dentro de un rango de fechas opcional.
 *
 * Nota sobre "ganancia": se calcula como subtotal_vendido - (cantidad * costo_actual).
 * Igual que el resto del sistema (ver registrarVenta en sales.ts), se usa el costo
 * ACTUAL del producto, no un costo histórico por venta, ya que no se persiste ese dato.
 * Si el costo de un producto cambió después de venderse, la ganancia mostrada aquí
 * es una aproximación con el costo de hoy.
 */
export async function obtenerEstadisticasProductos(
  fechaInicio?: string,
  fechaFin?: string
): Promise<ProductoEstadistica[]> {
  return enqueueGlobalOperation(async () => {
    const db = await getDb();
    return db.select<ProductoEstadistica[]>(
      `SELECT
        p.id as product_id,
        p.name,
        p.code,
        p.stock,
        p.price,
        p.cost,
        COALESCE(SUM(x.quantity), 0) as unidades_vendidas,
        COALESCE(SUM(x.subtotal), 0) as ingresos,
        COALESCE(SUM(x.subtotal - x.quantity * p.cost), 0) as ganancia,
        COUNT(x.sale_id) as num_ventas
       FROM products p
       LEFT JOIN (
         SELECT si.product_id, si.sale_id, si.quantity, si.subtotal
         FROM sale_items si
         JOIN sales s ON s.id = si.sale_id
         WHERE (? IS NULL OR date(s.sale_date, 'localtime') >= ?)
           AND (? IS NULL OR date(s.sale_date, 'localtime') <= ?)
       ) x ON x.product_id = p.id
       GROUP BY p.id
       ORDER BY p.name`,
      [fechaInicio ?? null, fechaInicio ?? null, fechaFin ?? null, fechaFin ?? null]
    );
  });
}