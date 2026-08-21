import { getDb } from './database';
import Database from '@tauri-apps/plugin-sql';
import { Producto } from './products';

export interface StockNotification {
  id?: number;
  product_id: number;
  start_date: string;
  view_date?: string | null;
  product_name?: string;
  product_stock?: number;
  product_alert_stock?: number;
}

/**
 * 1. Verifica si un producto necesita notificación y la crea si es necesario
 */
export async function verificarYCrearNotificacion(
  productoId: number, 
  dbParam?: Database
): Promise<{
  success: boolean;
  message: string;
  notification?: StockNotification;
  product?: Producto;
}> {
  const db = dbParam || await getDb();
  
  try {
    // 1. Obtener el producto con su stock actual
    const productos = await db.select<Producto[]>(
      `SELECT p.id, p.name, p.code, p.price,
              COALESCE(v.stock, 0) AS stock,
              (SELECT b.cost FROM product_batches b WHERE b.product_id = p.id ORDER BY b.created_at DESC LIMIT 1) AS cost,
              COALESCE(p.alert_stock, 1) as alert_stock
       FROM products p LEFT JOIN v_product_stock v ON v.product_id = p.id WHERE p.id = $1`,
      [productoId]
    );

    if (!productos || productos.length === 0) {
      return {
        success: false,
        message: `Producto con ID ${productoId} no encontrado`
      };
    }

    const producto = productos[0];
    const alertStock = producto.alert_stock || 1;

    // 2. NUEVO: Verificar si el stock actual ya NO necesita alerta
    if (producto.stock > alertStock) {
      // Intentamos eliminar cualquier notificación existente para este producto ya que el stock es correcto
      const result = await db.execute(
        `DELETE FROM stock_notifications WHERE product_id = $1`,
        [productoId]
      );

      const rowsAffected = result.rowsAffected || 0;
      const extraMessage = rowsAffected > 0 
        ? ` Se eliminaron ${rowsAffected} notificación(es) previa(s).` 
        : '';

      return {
        success: false,
        message: `Producto "${producto.name}" no necesita alerta (Stock: ${producto.stock} > ${alertStock}).${extraMessage}`,
        product: producto
      };
    }

    const now = new Date().toISOString();

    // 3. Buscar si ya existe una notificación (cualquiera, vista o no) para este producto
    const notificacionesExistentes = await db.select<StockNotification[]>(
      `SELECT id, product_id, start_date, view_date 
       FROM stock_notifications 
       WHERE product_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [productoId]
    );

    if (notificacionesExistentes && notificacionesExistentes.length > 0) {
      const notificacionId = notificacionesExistentes[0].id;

      // ACTUALIZAR: Se reestablece como no vista (NULL) y se actualiza la fecha
      await db.execute(
        `UPDATE stock_notifications 
         SET view_date = NULL, start_date = $1 
         WHERE id = $2`,
        [now, notificacionId]
      );

      const notificacionActualizada: StockNotification = {
        id: notificacionId,
        product_id: productoId,
        start_date: now,
        view_date: null,
        product_name: producto.name,
        product_stock: producto.stock,
        product_alert_stock: alertStock
      };

      return {
        success: true,
        message: `Notificación actualizada y marcada como NO vista para "${producto.name}" (Nuevo Stock: ${producto.stock})`,
        notification: notificacionActualizada,
        product: producto
      };
    }

    // 4. CREAR: Si no existía ninguna, se inserta una nueva
    const result = await db.execute(
      `INSERT INTO stock_notifications (product_id, start_date) 
       VALUES ($1, $2)`,
      [productoId, now]
    );

    const nuevaNotificacion: StockNotification = {
      id: result.lastInsertId,
      product_id: productoId,
      start_date: now,
      view_date: null,
      product_name: producto.name,
      product_stock: producto.stock,
      product_alert_stock: alertStock
    };

    return {
      success: true,
      message: `Nueva notificación creada para "${producto.name}" (Stock: ${producto.stock} ≤ ${alertStock})`,
      notification: nuevaNotificacion,
      product: producto
    };

  } catch (error) {
    console.error('Error en verificarYCrearNotificacion:', error);
    return {
      success: false,
      message: `Error al procesar la notificación: ${String(error)}`
    };
  }
}

/**
 * 2. Lista todas las notificaciones ordenadas
 */
export async function listarNotificaciones(
  dbParam?: Database
): Promise<{
  success: boolean;
  message: string;
  notifications: StockNotification[];
  pending: StockNotification[];
  viewed: StockNotification[];
}> {
  const db = dbParam || await getDb();
  
  try {
    const notificaciones = await db.select<StockNotification[]>(
      `SELECT 
        sn.id,
        sn.product_id,
        sn.start_date,
        sn.view_date,
        p.name as product_name,
         COALESCE(v.stock, 0) as product_stock,
         p.alert_stock as product_alert_stock
       FROM stock_notifications sn
       JOIN products p ON p.id = sn.product_id
       LEFT JOIN v_product_stock v ON v.product_id = p.id
       ORDER BY 
        CASE WHEN sn.view_date IS NULL THEN 0 ELSE 1 END,
        COALESCE(sn.view_date, sn.start_date) ASC`
    );

    // Tipado seguro para evitar errores en JS/TS en comparación estricta
    const pending = notificaciones.filter(n => n.view_date === null || n.view_date === undefined);
    const viewed = notificaciones.filter(n => n.view_date !== null && n.view_date !== undefined);

    return {
      success: true,
      message: `${notificaciones.length} notificaciones encontradas (${pending.length} pendientes, ${viewed.length} vistas)`,
      notifications: notificaciones,
      pending: pending,
      viewed: viewed
    };

  } catch (error) {
    console.error('Error al listar notificaciones:', error);
    return {
      success: false,
      message: `Error al obtener notificaciones: ${String(error)}`,
      notifications: [],
      pending: [],
      viewed: []
    };
  }
}

/**
 * 3. Marca una notificación como vista
 */
export async function marcarNotificacionComoVista(
  notificationId: number,
  dbParam?: Database
): Promise<{ success: boolean; message: string }> {
  const db = dbParam || await getDb();
  
  try {
    const now = new Date().toISOString();
    // Quitamos el filtro "WHERE view_date IS NULL" para permitir actualizar siempre
    const result = await db.execute(
      `UPDATE stock_notifications SET view_date = $1 WHERE id = $2`,
      [now, notificationId]
    );

    if (result.rowsAffected === 0) {
      return { success: false, message: `No se encontró la notificación ${notificationId}` };
    }

    return { success: true, message: `Notificación ${notificationId} marcada como vista` };
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    return { success: false, message: `Error: ${String(error)}` };
  }
}

/**
 * 4. Elimina una notificación completamente
 */
export async function eliminarNotificacion(
  notificationId: number,
  dbParam?: Database
): Promise<{ success: boolean; message: string }> {
  const db = dbParam || await getDb();
  
  try {
    const result = await db.execute(
      `DELETE FROM stock_notifications WHERE id = $1`,
      [notificationId]
    );

    if (result.rowsAffected === 0) {
      return { success: false, message: `No se encontró la notificación ${notificationId}` };
    }

    return { success: true, message: `Notificación ${notificationId} eliminada` };
  } catch (error) {
    console.error('Error al eliminar notificación:', error);
    return { success: false, message: `Error: ${String(error)}` };
  }
}
