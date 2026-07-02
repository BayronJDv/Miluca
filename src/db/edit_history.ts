import { getDb } from './database';
import Database from '@tauri-apps/plugin-sql';
import { Producto } from './products';

export interface EditHistoryEntry {
  id?: number;
  product_id: number;
  modification_reason: string;
  modification_date?: string;
  // Valores anteriores
  previous_name?: string | null;
  previous_price?: number | null;
  previous_cost?: number | null;
  previous_stock?: number | null;
  // Valores nuevos
  new_name?: string | null;
  new_price?: number | null;
  new_cost?: number | null;
  new_stock?: number | null;
  modified_by?: number | null;
  
  current_product_code?: string;
}

export async function registrarModificacion(
  productId: number,
  reason: string,
  previousState: Partial<Producto> | null,
  newState: Partial<Producto> | null,
  modifiedBy: number | null = null,
  dbParam?: Database
): Promise<{
  success: boolean;
  message: string;
  historyEntry?: EditHistoryEntry;
}> {
  const db = dbParam || await getDb();
  const now = new Date().toISOString();

  try {
    const result = await db.execute(
      `INSERT INTO edit_history (
        product_id, modification_reason, modification_date,
        previous_name, previous_price, previous_cost, previous_stock,
        new_name, new_price, new_cost, new_stock,
        modified_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        productId,
        reason,
        now,
        previousState?.name ?? null,
        previousState?.price ?? null,
        previousState?.cost ?? null,
        previousState?.stock ?? null,
        newState?.name ?? null,
        newState?.price ?? null,
        newState?.cost ?? null,
        newState?.stock ?? null,
        modifiedBy
      ]
    );

    const historyEntry: EditHistoryEntry = {
      id: result.lastInsertId,
      product_id: productId,
      modification_reason: reason,
      modification_date: now,
      previous_name: previousState?.name ?? null,
      previous_price: previousState?.price ?? null,
      previous_cost: previousState?.cost ?? null,
      previous_stock: previousState?.stock ?? null,
      new_name: newState?.name ?? null,
      new_price: newState?.price ?? null,
      new_cost: newState?.cost ?? null,
      new_stock: newState?.stock ?? null,
      modified_by: modifiedBy
    };

    return {
      success: true,
      message: `Historial de modificación registrado con éxito para el producto ID ${productId}`,
      historyEntry
    };

  } catch (error) {
    console.error('Error al registrar modificación:', error);
    return {
      success: false,
      message: `Error al insertar en el historial: ${String(error)}`
    };
  }
}

/**
 * 2. Lista el historial de modificaciones ordenado por fecha de la más reciente a la más antigua.
 * Incluye opcionalmente el código actual del producto mediante un JOIN para mejorar la UI.
 */
export async function listarHistorialPorFecha(
  dbParam?: Database
): Promise<{
  success: boolean;
  message: string;
  history: EditHistoryEntry[];
}> {
  const db = dbParam || await getDb();

  try {
    const history = await db.select<EditHistoryEntry[]>(
      `SELECT 
        eh.*,
        p.code as current_product_code
       FROM edit_history eh
       LEFT JOIN products p ON p.id = eh.product_id
       ORDER BY eh.modification_date DESC`
    );

    return {
      success: true,
      message: `${history.length} registros de modificaciones encontrados.`,
      history
    };

  } catch (error) {
    console.error('Error al listar el historial:', error);
    return {
      success: false,
      message: `Error al recuperar el historial: ${String(error)}`,
      history: []
    };
  }
}

/**
 * 3. Elimina un registro específico del historial por su ID.
 */
export async function eliminarRegistroHistorial(
  historyId: number,
  dbParam?: Database
): Promise<{
  success: boolean;
  message: string;
}> {
  const db = dbParam || await getDb();

  try {
    // Primero validamos si el registro existe
    const registros = await db.select<EditHistoryEntry[]>(
      `SELECT id FROM edit_history WHERE id = $1`,
      [historyId]
    );

    if (!registros || registros.length === 0) {
      return {
        success: false,
        message: `El registro de historial con ID ${historyId} no existe.`
      };
    }

    await db.execute(
      `DELETE FROM edit_history WHERE id = $1`,
      [historyId]
    );

    return {
      success: true,
      message: `Registro de historial ${historyId} eliminado correctamente.`
    };

  } catch (error) {
    console.error('Error al eliminar registro del historial:', error);
    return {
      success: false,
      message: `Error al eliminar el registro: ${String(error)}`
    };
  }
}
