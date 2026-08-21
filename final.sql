-- =============================================================
-- BASE DE DATOS CONSOLIDADA - POS Farmacia
-- Generada a partir de las migraciones 001-004
-- Motor: SQLite
-- Para importar en otro PC, usar:
--   sqlite3 mydatabase.db < final.sql
-- =============================================================

PRAGMA foreign_keys = ON;

-- =============================================================
-- TABLA: users
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL UNIQUE,
  password TEXT    NOT NULL,
  role     TEXT    NOT NULL CHECK (role IN ('admin', 'seller'))
);

-- =============================================================
-- TABLA: products (con campos de farmacia - migracion 003)
-- =============================================================
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  price REAL NOT NULL CHECK (price >= 0),
  alert_stock REAL NOT NULL DEFAULT 1 CHECK (alert_stock >= 0),
  generic_name TEXT,
  active_ingredient TEXT,
  dosage_form TEXT,
  concentration TEXT,
  presentation TEXT,
  manufacturer TEXT,
  category TEXT NOT NULL DEFAULT 'otro' CHECK (category IN ('medicamento','dispositivo_medico','cosmetico','alimento','otro')),
  requires_prescription INTEGER NOT NULL DEFAULT 0 CHECK (requires_prescription IN (0,1)),
  requires_lot_control INTEGER NOT NULL DEFAULT 0 CHECK (requires_lot_control IN (0,1)),
  has_invima INTEGER NOT NULL DEFAULT 0 CHECK (has_invima IN (0,1)),
  invima_info TEXT,
  wholesale_price REAL CHECK (wholesale_price IS NULL OR wholesale_price >= 0),
  wholesale_min_qty INTEGER CHECK (wholesale_min_qty IS NULL OR wholesale_min_qty > 0)
);

-- =============================================================
-- TABLA: suppliers (con campos adicionales - migracion 003)
-- =============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  photo_route  TEXT,
  contact_info TEXT,
  nit TEXT,
  address TEXT,
  email TEXT
);

-- =============================================================
-- TABLA: product_batches (lotes - migracion 003)
-- Va antes de sale_items/purchase_items porque lo referencian
-- =============================================================
CREATE TABLE IF NOT EXISTS product_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  lot_number TEXT NOT NULL,
  manufacture_date TEXT,
  expiration_date TEXT,
  quantity REAL NOT NULL CHECK (quantity >= 0),
  cost REAL NOT NULL CHECK (cost >= 0),
  supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_item_id INTEGER,
  status TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo','vencido','cuarentena','baja')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (product_id, lot_number, expiration_date)
);

-- =============================================================
-- TABLA: sales (con profit - migracion 002)
-- =============================================================
CREATE TABLE IF NOT EXISTS sales (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER REFERENCES users (id) ON DELETE SET NULL,
  sale_date TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  total     REAL    NOT NULL CHECK (total >= 0),
  profit    REAL    NOT NULL DEFAULT 0 CHECK (profit >= 0)
);

-- =============================================================
-- TABLA: sale_items (con batch_id - migracion 003)
-- =============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id INTEGER NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  subtotal REAL NOT NULL CHECK (subtotal >= 0)
);

-- =============================================================
-- TABLA: purchases
-- =============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id   INTEGER REFERENCES suppliers (id) ON DELETE SET NULL,
  purchase_date TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  total_cost    REAL    NOT NULL CHECK (total_cost >= 0)
);

-- =============================================================
-- TABLA: purchase_items (con batch_id y lotos - migracion 003)
-- =============================================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id INTEGER REFERENCES product_batches(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  cost REAL NOT NULL CHECK (cost >= 0),
  lot_number TEXT,
  manufacture_date TEXT,
  expiration_date TEXT
);

-- =============================================================
-- TABLA: edit_history (con JSON - migracion 003)
-- =============================================================
CREATE TABLE IF NOT EXISTS edit_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_json TEXT,
  new_json TEXT,
  modification_reason TEXT NOT NULL,
  modified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  modification_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- =============================================================
-- TABLA: stock_notifications (con FK correcta - migracion 004)
-- =============================================================
CREATE TABLE IF NOT EXISTS stock_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  view_date TEXT
);

-- =============================================================
-- TABLA: stock_movements (movimientos de inventario - migracion 003)
-- =============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES product_batches(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada_compra','salida_venta','ajuste_entrada','ajuste_salida','baja','devolucion_entrada','devolucion_salida')),
  quantity REAL NOT NULL CHECK (quantity > 0),
  movement_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  reference_type TEXT,
  reference_id INTEGER
);

-- =============================================================
-- TABLA: disposals (bajas - migracion 003)
-- =============================================================
CREATE TABLE IF NOT EXISTS disposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL CHECK (reason IN ('vencido','averiado','retiro_mercado','otro')),
  disposal_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

-- =============================================================
-- VISTA: stock por producto
-- =============================================================
CREATE VIEW IF NOT EXISTS v_product_stock AS
SELECT product_id, COALESCE(SUM(quantity), 0) AS stock
FROM product_batches WHERE status = 'activo' GROUP BY product_id;

-- =============================================================
-- ÍNDICES
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_sales_user_id   ON sales (user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales (sale_date);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id    ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items (product_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_batch ON sale_items(batch_id);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id   ON purchases (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases (purchase_date);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id  ON purchase_items (product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_batch ON purchase_items(batch_id);

CREATE INDEX IF NOT EXISTS idx_product_batches_product_status_expiration ON product_batches(product_id, status, expiration_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_reference ON stock_movements(reference_type, reference_id);

-- =============================================================
-- SEED: datos iniciales
-- =============================================================
INSERT OR IGNORE INTO users (username, password, role)
VALUES ('admin',  'admin123',  'admin');

INSERT OR IGNORE INTO users (username, password, role)
VALUES ('seller', 'seller123', 'seller');

INSERT OR IGNORE INTO suppliers (name, photo_route, contact_info)
VALUES ('Generico', '/suppliers/generico.jpg', '315000000');

-- =============================================================
-- FIN
-- =============================================================
