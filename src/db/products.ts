import { getDb } from './database';
import Database from '@tauri-apps/plugin-sql';
import { registrarModificacion } from './edit_history';
import { verificarYCrearNotificacion } from './product_notifications';

export interface Producto {
  id?: number; name: string; code: string; price: number; stock: number; cost: number; alert_stock?: number;
  generic_name?: string | null; active_ingredient?: string | null; dosage_form?: string | null;
  concentration?: string | null; presentation?: string | null; manufacturer?: string | null;
  category?: 'medicamento' | 'dispositivo_medico' | 'cosmetico' | 'alimento' | 'otro';
  requires_prescription?: number; requires_lot_control?: number; has_invima?: number;
  invima_info?: string | null; wholesale_price?: number | null; wholesale_min_qty?: number | null;
}

const PRODUCT_COLUMNS = new Set(['name', 'code', 'price', 'alert_stock', 'generic_name', 'active_ingredient', 'dosage_form', 'concentration', 'presentation', 'manufacturer', 'category', 'requires_prescription', 'requires_lot_control', 'has_invima', 'invima_info', 'wholesale_price', 'wholesale_min_qty']);

async function productosConStock<T extends Producto>(db: Database, clause = '', params: unknown[] = []): Promise<T[]> {
  return db.select<T[]>(`SELECT p.*, COALESCE(v.stock, 0) AS stock,
    COALESCE((SELECT b.cost FROM product_batches b WHERE b.product_id = p.id ORDER BY b.created_at DESC LIMIT 1), 0) AS cost
    FROM products p LEFT JOIN v_product_stock v ON v.product_id = p.id ${clause}`, params);
}

export async function crearProducto(p: Producto): Promise<void> {
  const db = await getDb();
  await db.execute(`INSERT INTO products (name, code, price, alert_stock, generic_name, active_ingredient, dosage_form, concentration, presentation, manufacturer, category, requires_prescription, requires_lot_control, has_invima, invima_info, wholesale_price, wholesale_min_qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    p.name, p.code, p.price, p.alert_stock ?? 5, p.generic_name ?? null, p.active_ingredient ?? null, p.dosage_form ?? null,
    p.concentration ?? null, p.presentation ?? null, p.manufacturer ?? null, p.category ?? 'otro', p.requires_prescription ?? 0,
    p.requires_lot_control ?? 0, p.has_invima ?? 0, p.invima_info ?? null, p.wholesale_price ?? null, p.wholesale_min_qty ?? null
  ]);
}

export async function obtenerProductos(): Promise<Producto[]> { return productosConStock(await getDb(), 'ORDER BY p.name'); }

export async function buscarProductosPorCodigo(code: string): Promise<Producto | null> {
  const rows = await productosConStock(await getDb(), 'WHERE p.code = ?', [code]);
  return rows[0] ?? null;
}

export async function buscarProductosPorNombre(busqueda: string): Promise<Producto[]> {
  const like = `%${busqueda}%`;
  return productosConStock(await getDb(), 'WHERE p.name LIKE ? OR p.code LIKE ? ORDER BY p.name LIMIT 50', [like, like]);
}

export async function buscarProductosPaginado(busqueda: string, pagina = 1, porPagina = 10): Promise<{ productos: Producto[]; total: number; pagina: number; totalPaginas: number }> {
  const db = await getDb(); const offset = (pagina - 1) * porPagina; const like = `%${busqueda}%`;
  const [{ count }] = await db.select<{ count: number }[]>('SELECT COUNT(*) as count FROM products WHERE name LIKE ? OR code LIKE ?', [like, like]);
  const productos = await productosConStock(db, 'WHERE p.name LIKE ? OR p.code LIKE ? ORDER BY p.name LIMIT ? OFFSET ?', [like, like, porPagina, offset]);
  return { productos, total: count, pagina, totalPaginas: Math.ceil(count / porPagina) };
}

export async function modificarProducto(id: number, p: Partial<Omit<Producto, 'id'>>, modificationReason: string, modifiedBy: number | null = null): Promise<{ success: boolean; message: string; notificationResult?: any }> {
  const campos = Object.keys(p).filter(c => PRODUCT_COLUMNS.has(c)) as (keyof typeof p)[];
  if (!campos.length) return { success: false, message: 'No se enviaron campos para modificar.' };
  const db = await getDb();
  try {
    const old = await db.select<any[]>(`SELECT ${campos.join(', ')} FROM products WHERE id = ?`, [id]);
    if (!old.length) return { success: false, message: `El producto con ID ${id} no existe.` };
    await db.execute(`UPDATE products SET ${campos.map(c => `${c} = ?`).join(', ')} WHERE id = ?`, [...campos.map(c => p[c]), id]);
    await registrarModificacion(id, modificationReason, old[0], p, modifiedBy, db);
    const notificationResult = await verificarYCrearNotificacion(id, db);
    return { success: true, message: 'Producto actualizado e historial registrado con éxito.', notificationResult };
  } catch (error) { return { success: false, message: `Error en el proceso de modificación: ${String(error)}` }; }
}

export async function eliminarProducto(id: number): Promise<void> { await (await getDb()).execute('DELETE FROM products WHERE id = ?', [id]); }
