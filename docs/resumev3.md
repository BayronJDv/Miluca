# Resumen v3: trazabilidad farmacéutica y precio mayorista

## Objetivo

La versión 3 adapta Gualcalá, originalmente un POS genérico, a la operación de una farmacia. El cambio principal consiste en dejar de tratar el stock y el costo como propiedades permanentes del producto y pasar a administrarlos por lote. También se incorporan datos regulatorios, kardex, control de vencimientos y precio al por mayor.

La decisión responde a una necesidad operativa y regulatoria: dos compras del mismo producto pueden tener costos, fechas de vencimiento y proveedores diferentes. Por eso el producto representa el catálogo, el lote representa la existencia física y el kardex representa la historia de movimientos.

## Cambios en la base de datos

Se creó `src-tauri/migrations/003_pharmacy.sql` y se registró como migración versión 3 en `src-tauri/src/lib.rs`.

### Productos

La tabla `products` fue reconstruida para eliminar `stock` y `cost`, ya que esos valores ahora pertenecen a los lotes. Se conservaron los datos comerciales principales:

- Nombre.
- Código único de barras.
- Precio de venta.
- Stock mínimo de alerta.

Se añadieron los campos farmacéuticos:

- Nombre genérico.
- Principio activo.
- Forma farmacéutica.
- Concentración.
- Presentación.
- Fabricante o laboratorio.
- Categoría.
- Requiere fórmula médica.
- Requiere control de lote.
- Registro INVIMA activo.
- Información o enlace INVIMA.

También se añadieron `wholesale_price` y `wholesale_min_qty` para soportar precio mayorista por cantidad.

### Lotes

`product_batches` almacena la existencia física trazable:

- Producto asociado.
- Número de lote.
- Fecha de fabricación.
- Fecha de vencimiento.
- Cantidad disponible.
- Costo de adquisición.
- Proveedor.
- Estado del lote.

Los productos que no requieren trazabilidad utilizan el lote `S/N` y pueden tener fechas nulas. Esto evita obligar a todos los productos del catálogo a capturar información que no necesitan.

### Kardex

`stock_movements` es el registro inmutable de entradas y salidas. Registra compras, ventas, ajustes, devoluciones y bajas, además de usuario, motivo y referencia de la operación.

El kardex permite responder qué ocurrió con una cantidad específica y de qué lote provino, algo que no era posible con un único campo `products.stock`.

### Bajas

`disposals` registra bajas parciales o totales por vencimiento, avería, retiro del mercado u otro motivo. Una baja descuenta la cantidad del lote y genera automáticamente un movimiento de kardex.

### Tablas relacionadas

- `sale_items` ahora guarda `batch_id` y `unit_price`.
- `purchase_items` guarda lote y fechas de fabricación/vencimiento.
- `suppliers` incorpora NIT, dirección y correo.
- `edit_history` usa snapshots JSON para soportar la ampliación de campos del producto.
- `v_product_stock` calcula el stock agregado a partir de lotes activos.

## Capa de datos

Se añadieron los módulos:

- `src/db/batches.ts`: consulta, creación, actualización y vencimiento de lotes.
- `src/db/stock_movements.ts`: registro y consulta de movimientos del kardex.
- `src/db/disposals.ts`: registro de bajas y ajuste de cantidades.
- `src/db/regulatory_reports.ts`: consultas para kardex e informes regulatorios.

### Compras

`registrarCompra` ahora:

1. Valida que el lote sea obligatorio cuando el producto requiere control.
2. Valida que el vencimiento sea posterior a la fecha actual.
3. Valida que fabricación no sea posterior a vencimiento.
4. Crea el lote con su costo y proveedor.
5. Crea el movimiento `entrada_compra`.

La compra es la única operación normal que ingresa stock al sistema.

### Ventas y FEFO

`registrarVenta` implementa FEFO, es decir, First Expired, First Out. Los lotes se ordenan por vencimiento ascendente y se bloquean los lotes vencidos.

Si una venta necesita más cantidad de la disponible en un lote, se divide automáticamente en varios `sale_items`. La utilidad se calcula con el costo real de cada lote:

```text
utilidad = (precio aplicado - costo del lote) × cantidad consumida
```

Esto evita calcular ganancias usando un costo promedio o un costo desactualizado del producto.

## Precio mayorista

El POS mantiene por línea:

- Modo automático.
- Precio unitario forzado.
- Precio mayorista forzado.

En modo automático, cuando la cantidad alcanza `wholesale_min_qty`, se aplica `wholesale_price`. Si la cantidad vuelve a estar por debajo del mínimo, se restaura el precio unitario.

El precio aplicado se envía a ventas y recibos, por lo que la utilidad se calcula sobre el precio real cobrado y no sobre el precio de catálogo.

## Cambios del frontend

### Inventario

Se reemplazó el formulario genérico por una ficha farmacéutica completa. Ahora permite capturar:

- Identificación y código de barras.
- Información farmacéutica.
- Categoría.
- Control de lote.
- Fórmula médica.
- INVIMA.
- Precio de venta.
- Stock mínimo.
- Precio mayorista y cantidad mínima.

El formulario ya no permite digitar stock ni costo inicial. El costo se captura durante la compra y el stock se deriva de los lotes.

La tabla muestra categoría, stock agregado, trazabilidad, INVIMA y configuración mayorista. El detalle de cada producto muestra sus lotes y movimientos del kardex.

### Compras

Cada línea del carrito de compras permite capturar:

- Costo del lote.
- Número de lote.
- Fecha de fabricación.
- Fecha de vencimiento.

La creación rápida de productos también fue actualizada para no solicitar stock ni costo, y permite indicar categoría, nombre genérico y control de lote.

### POS

El POS incorpora el precio mayorista automático y el cambio manual de modo por línea. Los comprobantes muestran lote y vencimiento, incluyendo ventas divididas entre varios lotes.

### Vencimientos y bajas

La vista `/vencimientos` muestra lotes vencidos y próximos a vencer. Desde allí se puede registrar una baja parcial o total con el motivo correspondiente.

El panel de alertas del inicio muestra un acceso directo cuando existen lotes vencidos o próximos a vencer.

### Kardex

La vista `/kardex` permite seleccionar un producto, filtrar por rango de fechas y consultar sus movimientos. También permite exportar el resultado a CSV para soportar informes regulatorios.

## Componente de fechas

Todos los nuevos campos de fecha usan `react-datepicker`, el mismo componente utilizado previamente en Reportes, Historial de ventas, Historial de compras y Análisis.

Se configuró con:

- Selector directo de mes.
- Selector directo de año.
- Dropdown de años desplazable.
- Veinte años visibles en el selector.
- Navegación por selección en lugar de recorrer mes a mes.

La fecha se muestra como `dd/MM/yyyy`, pero se conserva internamente como `YYYY-MM-DD` para SQLite.

## Decisiones técnicas

### Reconstrucción de tablas

SQLite no permite eliminar columnas de forma directa en todos los casos. Por eso la migración reconstruye las tablas que cambiaron de estructura y conserva los datos compatibles cuando es posible.

### Cola global de operaciones

Las operaciones de compras, ventas y bajas utilizan `executeInTransaction` y la cola global existente. Esta decisión evita conflictos con el pool de conexiones de `tauri-plugin-sql` y mantiene las operaciones de stock serializadas.

### Stock calculado

El stock no se duplica en `products`. Se calcula desde `v_product_stock`, reduciendo el riesgo de inconsistencias entre el catálogo y los lotes físicos.

### Lote por defecto

El lote `S/N` permite que dispositivos médicos, cosméticos, alimentos u otros productos sin control obligatorio sigan funcionando sin capturas regulatorias innecesarias.

### FEFO obligatorio

FEFO fue elegido sobre FIFO porque en farmacia la prioridad es evitar vencimientos y pérdidas, no solamente respetar el orden de llegada.

## Verificación

Se verificó lo siguiente:

- `pnpm build` termina correctamente con TypeScript y Vite.
- La migración `001 → 002 → 003` se ejecuta correctamente en SQLite.
- Las claves foráneas de ventas, compras, lotes y proveedores apuntan al esquema nuevo.
- `PRAGMA foreign_key_check` no reporta errores.
- El frontend compila después de integrar los nuevos formularios, vistas y selectores de fecha.

## Puesta en marcha

Debido a la forma actual en que la aplicación aplica migraciones, al instalar esta versión se debe eliminar la base de datos existente y el contenido asociado en la carpeta de datos de Tauri. Después se debe iniciar la aplicación con:

```bash
pnpm tauri dev
```

La base se recreará aplicando las migraciones 001, 002 y 003 en orden.
