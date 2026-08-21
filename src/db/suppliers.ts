import { getDb } from './database';

export interface Supplier {
  id?: number;
  name: string;
  photo_route: string | null;
  contact_info: string | null;
  nit?: string | null;
  address?: string | null;
  email?: string | null;
}

export interface SupplierStats {
  total: number;
  topSupplier: { name: string; monthlyVolume: number } | null;
  monthlySpending: number;
  spendingTrend: number;
  monthlyBudgetPercent: number;
}

export async function obtenerProveedores(): Promise<Supplier[]> {
  const db = await getDb();
  return await db.select<Supplier[]>('SELECT * FROM suppliers ORDER BY name');
}

export async function obtenerProveedor(id: number): Promise<Supplier | null> {
  const db = await getDb();
  const results = await db.select<Supplier[]>(
    'SELECT * FROM suppliers WHERE id = $1',
    [id]
  );
  return results.length > 0 ? results[0] : null;
}

export async function obtenerEstadisticasProveedores(): Promise<SupplierStats> {
  const db = await getDb();

  const [{ total }] = await db.select<{ total: number }[]>(
    'SELECT COUNT(*) as total FROM suppliers'
  );

  const topSupplierResult = await db.select<{ name: string; monthly_volume: number }[]>(
    `SELECT s.name, COALESCE(SUM(pi.cost * pi.quantity), 0) as monthly_volume
     FROM suppliers s
     LEFT JOIN purchases p ON p.supplier_id = s.id
       AND p.purchase_date >= datetime('now', 'start of month')
     LEFT JOIN purchase_items pi ON pi.purchase_id = p.id
     GROUP BY s.id
     ORDER BY monthly_volume DESC
     LIMIT 1`
  );
  const topSupplier = topSupplierResult.length > 0 && topSupplierResult[0].monthly_volume > 0
    ? { name: topSupplierResult[0].name, monthlyVolume: topSupplierResult[0].monthly_volume }
    : null;

  const spendingResult = await db.select<{ current_month: number; prev_month: number }[]>(
    `SELECT
       COALESCE(SUM(CASE WHEN purchase_date >= datetime('now', 'start of month')
         THEN total_cost ELSE 0 END), 0) as current_month,
       COALESCE(SUM(CASE WHEN purchase_date >= datetime('now', '-1 month', 'start of month')
         AND purchase_date < datetime('now', 'start of month')
         THEN total_cost ELSE 0 END), 0) as prev_month
     FROM purchases
     WHERE purchase_date >= datetime('now', '-1 month', 'start of month')`
  );
  const { current_month: monthlySpending, prev_month } = spendingResult[0] ?? { current_month: 0, prev_month: 0 };
  const spendingTrend = prev_month > 0 ? ((monthlySpending - prev_month) / prev_month) * 100 : 0;

  const monthlyBudgetPercent = Math.min(Math.round((monthlySpending / 200000) * 100), 100);

  return {
    total,
    topSupplier,
    monthlySpending,
    spendingTrend,
    monthlyBudgetPercent,
  };
}

export async function crearProveedor(s: Supplier): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO suppliers (name, photo_route, contact_info, nit, address, email) VALUES ($1, $2, $3, $4, $5, $6)',
    [s.name, s.photo_route, s.contact_info, s.nit ?? null, s.address ?? null, s.email ?? null]
  );
}

export async function modificarProveedor(id: number, s: Partial<Omit<Supplier, 'id'>>): Promise<void> {
  const db = await getDb();
  const campos = Object.keys(s) as (keyof typeof s)[];
  if (campos.length === 0) return;

  const sets = campos.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const valores = campos.map((c) => s[c]);

  await db.execute(
    `UPDATE suppliers SET ${sets} WHERE id = $${campos.length + 1}`,
    [...valores, id]
  );
}

export async function eliminarProveedor(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM suppliers WHERE id = $1', [id]);
}
