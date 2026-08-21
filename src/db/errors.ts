export function mensajeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  const message = raw.toLowerCase();

  if (message.includes('profit >= 0') || message.includes('check constraint failed')) {
    return 'La venta generaría una pérdida. Revise el precio de venta y el costo de los lotes antes de reintentar.';
  }
  if (message.includes('stock insuficiente') || message.includes('cantidad de lote insuficiente')) {
    return 'No hay suficiente stock vendible en los lotes activos y no vencidos.';
  }
  if (message.includes('unique constraint') || message.includes('already exists')) {
    return 'Ya existe un registro con ese código o valor único.';
  }
  if (message.includes('no such table') || message.includes('no such column')) {
    return `${raw}. La base de datos requiere aplicar la migración correspondiente.`;
  }
  return raw || 'Ocurrió un error inesperado.';
}
