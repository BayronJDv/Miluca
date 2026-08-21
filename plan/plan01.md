# Plan 01: Trazabilidad de farmacia + precio mayorista

> Sistema: Gualcalá (Tauri + React + TypeScript + SQLite vía `@tauri-apps/plugin-sql`)
> Objetivo: adaptar el POS genérico a las necesidades de trazabilidad de una farmacia
> (lotes, fechas de fabricación/vencimiento, registro INVIMA, kardex) supervisada por el
> ente regulador, y agregar precio al por mayor sin afectar el cálculo de ganancias.

## Decisiones confirmadas con el cliente

| Tema | Decisión |
| --- | --- |
| Datos existentes | Empezar limpio: se borra la `.db` y el esquema nuevo se aplica desde cero (001 → 002 → 003) |
| Sistema de migraciones | agregar `003_pharmacy.sql` en `src-tauri/migrations/` y registrarlo en el `vec!` de `src-tauri/src/lib.rs:115` |
| Control de lotes | Solo para productos que lo requieren (flag `requires_lot_control`); el resto usa un "lote por defecto" `'S/N'` sin fechas |
| Asignación en venta | FEFO automático (First Expired, First Out): se descuenta primero del lote que vence antes |
| Registro INVIMA | Dos campos en `products`: `has_invima` (bool, registro activo) e `invima_info` (texto/link con más información) |
| Precio al por mayor | Automático por cantidad + override manual por línea del carrito. Se digita como precio unitario mayorista + cantidad mínima |
| Alcance adicional v1 | Ninguno (medicamentos de control especial, recetas y clientes quedan para después) |

## Concepto central

Hoy el stock y el costo son atributos del **producto**; en una farmacia son atributos del
**LOTE**. El modelo pasa a ser: **Producto (catálogo) → Lote (stock físico) → Kardex (movimientos)**.

```
products (catálogo, lo que el producto ES)
   │
   ├── product_batches (lotes: stock físico trazable)
   │        │
   │        └── stock_movements (kardex inmutable de entradas/salidas)
   │
   └── disposals (bajas de vencidos/averiados, asociadas a lotes)
```

- El stock de un producto = `SUM(quantity)` de sus lotes en estado `activo` (vista `v_product_stock`).
- El costo de un producto = costo de cada lote (cada compra tiene su propio costo).
- Profit de venta = `(precio_aplicado − costo_del_lote) × cantidad`, calculado por lote consumido.

---

## 1. Migración `003_pharmacy.sql`

Nuevo archivo en `src-tauri/migrations/`, registrado en el vector de migraciones de
`src-tauri/src/lib.rs` (línea ~115). Al borrar la `.db` y ejecutar `pnpm tauri dev`,
se aplican 001 → 002 → 003 en orden.

### 1.1 `products` (se recrea la tabla)

Se elimina `stock` y `cost` (pasan a los lotes). Se conservan: `id, name, code UNIQUE, price, alert_stock`.

Nuevas columnas de farmacia:

| Columna | Tipo | Notas |
| --- | --- | --- |
| `generic_name` | TEXT | Nombre genérico (ej. "Acetaminofén") |
| `active_ingredient` | TEXT | Principio activo |
| `dosage_form` | TEXT | Forma farmacéutica (tableta, jarabe, inyectable…) |
| `concentration` | TEXT | Concentración (ej. "500 mg") |
| `presentation` | TEXT | Presentación (ej. "Caja x 30 tabletas") |
| `manufacturer` | TEXT | Laboratorio / fabricante |
| `category` | TEXT | CHECK IN ('medicamento','dispositivo_medico','cosmetico','alimento','otro') |
| `requires_prescription` | INTEGER (0/1) | Requiere receta médica |
| `requires_lot_control` | INTEGER (0/1) | Exige lote + fechas de fabricación/vencimiento |
| `has_invima` | INTEGER (0/1) | Tiene registro INVIMA activo |
| `invima_info` | TEXT | Número de registro o link con más información |

Nuevas columnas de precio mayorista:

| Columna | Tipo | Notas |
| --- | --- | --- |
| `wholesale_price` | REAL NULL, CHECK >= 0 | Precio unitario al por mayor. NULL = sin precio mayorista |
| `wholesale_min_qty` | INTEGER NULL, CHECK > 0 | Cantidad mínima para aplicar el precio mayorista (ej. 30 = 1 caja). NULL = sin precio mayorista |

### 1.2 `product_batches` (nueva — el stock vive aquí)

```sql
CREATE TABLE product_batches (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id       INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_number       TEXT    NOT NULL,               -- 'S/N' si el producto no requiere lote
  manufacture_date TEXT,                           -- NULL si no requiere lote
  expiration_date  TEXT,                           -- NULL si no requiere lote
  quantity         REAL    NOT NULL CHECK (quantity >= 0),
  cost             REAL    NOT NULL CHECK (cost >= 0),
  supplier_id      INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_item_id INTEGER,                        -- origen de la entrada
  status           TEXT    NOT NULL DEFAULT 'activo'
                   CHECK (status IN ('activo','vencido','cuarentena','baja')),
  created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (product_id, lot_number, expiration_date)
);
```

### 1.3 `stock_movements` (nueva — kardex inmutable)

```sql
CREATE TABLE stock_movements (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id       INTEGER NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
  movement_type  TEXT    NOT NULL CHECK (movement_type IN
                 ('entrada_compra','salida_venta','ajuste_entrada','ajuste_salida','baja','devolucion_entrada','devolucion_salida')),
  quantity       REAL    NOT NULL CHECK (quantity > 0),  -- el signo lo da el tipo
  movement_date  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason         TEXT,
  reference_type TEXT,                                   -- 'sale' | 'purchase' | 'disposal' | NULL
  reference_id   INTEGER
);
```

### 1.4 `disposals` (nueva — bajas de vencidos/averiados)

```sql
CREATE TABLE disposals (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id      INTEGER NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
  quantity      REAL    NOT NULL CHECK (quantity > 0),
  reason        TEXT    NOT NULL CHECK (reason IN ('vencido','averiado','retiro_mercado','otro')),
  disposal_date TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes         TEXT
);
```

### 1.5 Otras modificaciones

- `sale_items`: agregar `batch_id INTEGER REFERENCES product_batches(id) ON DELETE RESTRICT` (un sale_item por lote consumido).
- `purchase_items`: agregar `batch_id INTEGER REFERENCES product_batches(id)` + columnas de captura `lot_number, manufacture_date, expiration_date`.
- `suppliers`: agregar `nit, address, email`.
- `edit_history`: se recrea con snapshots JSON (`previous_json TEXT`, `new_json TEXT`, `modification_reason`, `modified_by`, fecha) en lugar de columnas fijas — con tantos campos nuevos el diseño anterior no escala.
- Vista: `CREATE VIEW v_product_stock AS SELECT product_id, COALESCE(SUM(quantity),0) AS stock FROM product_batches WHERE status = 'activo' GROUP BY product_id;`
- Índices: `product_batches(product_id, status, expiration_date)`, `stock_movements(batch_id)`, `stock_movements(reference_type, reference_id)`, `sale_items(batch_id)`, `purchase_items(batch_id)`.

---

## 2. Capa de datos (`src/db/`)

- **Nuevos módulos:** `batches.ts`, `stock_movements.ts`, `disposals.ts`.
- **`products.ts`:** interfaz `Producto` extendida; el stock se lee de `v_product_stock`;
  eliminar `actualizarStock` sobre `products` (el stock ya no vive ahí).
- **`purchases.ts` (`registrarCompra`):** cada ítem recibido trae lote + fecha fabricación +
  vencimiento + costo → crea el `product_batch` y un movimiento kardex `entrada_compra`.
  Es la **única entrada de stock**. Validaciones: vencimiento > hoy, fabricación ≤ vencimiento.
- **`sales.ts` (`registrarVenta`):** **FEFO** — para cada ítem, consumir de los lotes activos
  ordenados por `expiration_date ASC` (lotes sin fecha al final), bloquear lotes vencidos,
  generar un `sale_item` por lote consumido + movimiento kardex `salida_venta`, y calcular
  `profit = Σ (precio_aplicado − costo_lote) × cantidad_por_lote`.
- **`product_notifications.ts`:** nuevos tipos de alerta: **por vencer** (umbral de días
  configurable) y **vencidos**, junto a la alerta de stock bajo existente.
- **`edit_history.ts`:** refactor a snapshots JSON.

---

## 3. Precio al por mayor (POS)

- Estado por línea del carrito: `price_mode: 'auto' | 'unitario' | 'mayorista'`.
- En modo `auto`: si `qty ≥ wholesale_min_qty` se aplica `wholesale_price` automáticamente
  (badge "Mayorista" en la línea); si la cantidad baja del mínimo, vuelve al precio unitario.
- Override manual: botón en cada línea del carrito (solo visible si el producto tiene
  `wholesale_price` definido) para forzar precio unitario o mayorista.
- El profit no se afecta: `sales.ts` calcula la ganancia con el precio realmente aplicado.
- El recibo térmico (`src/print/receipt.ts`) muestra el precio aplicado por ítem.

---

## 4. Frontend

### 4.1 `Inventario.tsx`
- Ficha de producto completa: campos de farmacia + INVIMA (bool + info/link) + precio
  mayorista (precio unitario + cantidad mínima, con ayuda visual "equivale a $X la caja de N").
- Corregir label "SKU" → **"Código de barras"** (el campo `code` es el EAN del lector).
- Ya no se digita stock ni costo al crear el producto: entran por compras (lotes).
- Lista: stock agregado (vista) + estado de lotes (ok / por vencer / vencido).
- Detalle de producto: lotes con fechas y kardex de movimientos.
- El % de ganancia del formulario se calcula sobre el **último costo de lote** (referencia).

### 4.2 `Compras.tsx`
- Por cada ítem del carrito de compra: captura de lote + fecha fabricación + fecha vencimiento
  (obligatorio si `requires_lot_control`) + costo, con validaciones de fechas.
- Formulario de "Nuevo Producto" rápido actualizado con los campos nuevos (sin costo/stock).

### 4.3 `Pos.tsx`
- Stock vendible = suma de lotes activos **no vencidos**; producto vencido sin stock activo → bloqueado.
- Aviso visual para lotes próximos a vencer.
- Override mayorista por línea (sección 3).
- Modal de comprobante y recibo térmico incluyen **lote y vencimiento por ítem**.

### 4.4 Nuevas vistas
- **Panel de vencimientos:** lotes por vencer en X días (umbral configurable) y lotes vencidos,
  con acción directa de baja.
- **Módulo de bajas (disposals):** registrar baja parcial/total de un lote con motivo y notas;
  historial de bajas.

### 4.5 `Home.tsx` / `Reportes.tsx`
- Tarjeta de alertas del home incluye vencimientos (además de stock bajo).
- Reportes regulatorios con lote: kardex por producto, compras/ventas con lote, informe de
  vencidos/bajas — exportables a CSV usando el comando `save_csv_file` existente
  (`src-tauri/src/lib.rs:72`).

---

## 5. Orden de implementación

1. Migración `003_pharmacy.sql` + registro en `src-tauri/src/lib.rs`.
2. Capa de datos: `batches.ts`, `stock_movements.ts`, `disposals.ts`, refactor de
   `sales.ts` (FEFO), `purchases.ts` (creación de lotes), `products.ts`, notificaciones.
3. `Compras.tsx` e `Inventario.tsx` (captura de lotes y ficha completa).
4. `Pos.tsx`: FEFO en venta + precio mayorista + recibo con lote/vencimiento.
5. Alertas de vencimiento + módulo de bajas.
6. Reportes/kardex con exportación CSV.

## 6. Verificación

- Borrar la `.db` existente (ver docs.md) y ejecutar `pnpm tauri dev`.
- Flujo completo: crear producto → compra con lote → venta FEFO → comprobar stock por lote,
  profit y kardex.
- Casos borde:
  - Venta que consume 2 lotes distintos (split por FEFO).
  - Lote vencido: bloqueado para venta, visible en panel de vencimientos, baja registrada.
  - Producto sin control de lote (`'S/N'`, fechas NULL).
  - Precio mayorista: cantidad que sube/baja del mínimo en modo `auto`, y override manual.
  - Alertas: stock bajo, por vencer, vencido.
