# Plan 02: Kardex, bajas y devoluciones

## Decisiones confirmadas

- Kardex usará búsqueda de producto, no un selector largo.
- Kardex usará un único `DatePicker` con selección de rango.
- Las fechas se mostrarán y filtrarán en la zona horaria de Bogotá.
- Las bajas tendrán una sección dedicada con formulario e historial.
- Se conservará la acción rápida desde Vencimientos.
- Los lotes vencidos se marcarán automáticamente como `vencido`.
- Las devoluciones calcularán cantidades ya devueltas mediante el kardex, sin migración adicional.
- Una devolución de cliente repone el lote original aunque esté vencido.
- Ventas y compras originales permanecen inmutables; las devoluciones solo modifican stock y kardex.

## 1. Kardex

1. Reemplazar el selector de producto por búsqueda con resultados dinámicos.
2. Reemplazar los filtros Desde/Hasta por un solo `react-datepicker` con `selectsRange`.
3. Mostrar `movement_date` con `America/Bogota`.
4. Filtrar en SQL usando `date(movement_date, 'localtime')`.

## 2. Bajas

1. Crear la vista `/bajas`.
2. Buscar producto y seleccionar lote.
3. Capturar cantidad, motivo y notas.
4. Mostrar historial de bajas.
5. Cambiar el prompt de Vencimientos por un modal.
6. Ejecutar `marcarLotesVencidos` al iniciar la aplicación.

## 3. Devoluciones

Crear `src/db/returns.ts` con dos operaciones transaccionales:

- Cliente devuelve: validar contra ventas menos devoluciones, reponer lote original y registrar `devolucion_entrada`.
- Devolución a proveedor: validar contra compras menos devoluciones, descontar lote y registrar `devolucion_salida`.

La cantidad devuelta se obtiene de los movimientos del kardex agrupados por referencia y lote. La interfaz agregará botones de devolución en los detalles de HistorialVentas e HistorialCompras.

## 4. Verificación

- Probar búsqueda y rango del Kardex.
- Confirmar hora de Bogotá.
- Registrar baja parcial y total.
- Confirmar bloqueo de cantidades superiores.
- Probar devolución de cliente y proveedor.
- Confirmar que no se puede devolver dos veces la misma cantidad.
- Ejecutar `pnpm build`.
