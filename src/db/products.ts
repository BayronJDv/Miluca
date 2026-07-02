import { getDb } from './database';
import Database from '@tauri-apps/plugin-sql';
import { registrarModificacion } from './edit_history';
import { verificarYCrearNotificacion } from './product_notifications';

export interface Producto {
  id?: number;
  name: string;
  code: string;
  price: number;
  cost: number;
  stock: number;
  alert_stock?: number; // Mantenido y ahora utilizado de manera activa
}

export async function crearProducto(p: Producto): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO products (name, code, price, cost, stock, alert_stock) VALUES ($1, $2, $3, $4, $5, $6)',
    [p.name, p.code, p.price, p.cost, p.stock, p.alert_stock ?? 5]
  );
}

export async function obtenerProductos(): Promise<Producto[]> {
  const db = await getDb();
  return await db.select('SELECT * FROM products ORDER BY name');
}

export async function buscarProductosPorCodigo(code: string): Promise<Producto | null> {
  const db = await getDb();
  const results = await db.select<Producto[]>(
    'SELECT * FROM products WHERE code = $1',
    [code]
  );
  return results.length > 0 ? results[0] : null;
}

export async function buscarProductosPorNombre(busqueda: string): Promise<Producto[]> {
  const db = await getDb();
  const like = `%${busqueda}%`;
  return await db.select<Producto[]>(
    'SELECT * FROM products WHERE name LIKE $1 OR code LIKE $1 ORDER BY name LIMIT 50',
    [like]
  );
}

export async function buscarProductosPaginado(
  busqueda: string,
  pagina: number = 1,
  porPagina: number = 10
): Promise<{ productos: Producto[]; total: number; pagina: number; totalPaginas: number }> {
  const db = await getDb();
  const offset = (pagina - 1) * porPagina;
  const like = `%${busqueda}%`;

  const [{ count }] = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM products WHERE name LIKE $1 OR code LIKE $1',
    [like]
  );

  const productos = await db.select<Producto[]>(
    `SELECT * FROM products 
     WHERE name LIKE $1 OR code LIKE $1 
     ORDER BY name LIMIT $2 OFFSET $3`,
    [like, porPagina, offset]
  );

  return {
    productos,
    total: count,
    pagina,
    totalPaginas: Math.ceil(count / porPagina),
  };
}

export async function modificarProducto(
  id: number, 
  p: Partial<Omit<Producto, 'id'>>, 
  modificationReason: string, 
  modifiedBy: number | null = null
): Promise<{ success: boolean; message: string; notificationResult?: any }> {
  
  const campos = Object.keys(p) as (keyof typeof p)[];
  if (campos.length === 0) {
    return { success: false, message: "No se enviaron campos para modificar." };
  }

  const db = await getDb();

  try {
    // 1. OBTENER ESTADO PREVIO
    const camposSelect = campos.join(', ');
    const productosViejos = await db.select<any[]>(
      `SELECT ${camposSelect} FROM products WHERE id = $1`,
      [id]
    );

    if (!productosViejos || productosViejos.length === 0) {
      return { success: false, message: `El producto con ID ${id} no existe.` };
    }

    const estadoAnterior = productosViejos[0];

    // 2. CONSTRUIR LA QUERY DINÁMICA DE ACTUALIZACIÓN
    const sets = campos.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const valores = campos.map((c) => p[c]);

    await db.execute(
      `UPDATE products SET ${sets} WHERE id = $${campos.length + 1}`,
      [...valores, id]
    );

    // 3. REGISTRAR EN EL HISTORIAL
    await registrarModificacion(
      id,
      modificationReason,
      estadoAnterior, 
      p,              
      modifiedBy,
      db
    );

    // 4. VERIFICAR Y ACTUALIZAR ALERTAS DE STOCK (Se disparará dinámicamente según el alert_stock modificado)
    const resultadoNotificacion = await verificarYCrearNotificacion(id, db);

    let mensajeFinal = "¡Producto actualizado e historial registrado con éxito!";
    if (resultadoNotificacion.success) {
      mensajeFinal += ` Además: ${resultadoNotificacion.message}`;
    }

    return { 
      success: true, 
      message: mensajeFinal,
      notificationResult: resultadoNotificacion 
    };

  } catch (error) {
    console.error("Error en modificarProducto:", error);
    return { 
      success: false, 
      message: `Error en el proceso de modificación: ${String(error)}` 
    };
  }
}

export async function eliminarProducto(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM products WHERE id = $1', [id]);
}

export async function actualizarStock(productoId: number, cantidad: number, dbParam?: Database): Promise<void> {
  const db = dbParam || await getDb();
  await db.execute(
    'UPDATE products SET stock = stock + $1 WHERE id = $2 AND stock + $1 >= 0',
    [cantidad, productoId]
  );
}