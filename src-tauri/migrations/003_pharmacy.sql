PRAGMA foreign_keys = OFF;

ALTER TABLE products RENAME TO products_legacy;
ALTER TABLE sale_items RENAME TO sale_items_legacy;
ALTER TABLE purchase_items RENAME TO purchase_items_legacy;
ALTER TABLE edit_history RENAME TO edit_history_legacy;

CREATE TABLE products (
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

INSERT INTO products (id, name, code, price, alert_stock)
SELECT id, name, code, price, alert_stock FROM products_legacy;

ALTER TABLE suppliers ADD COLUMN nit TEXT;
ALTER TABLE suppliers ADD COLUMN address TEXT;
ALTER TABLE suppliers ADD COLUMN email TEXT;

CREATE TABLE product_batches (
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

CREATE TABLE stock_movements (
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

CREATE TABLE sale_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  batch_id INTEGER NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  subtotal REAL NOT NULL CHECK (subtotal >= 0)
);
CREATE TABLE purchase_items (
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

CREATE TABLE disposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER NOT NULL REFERENCES product_batches(id) ON DELETE RESTRICT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL CHECK (reason IN ('vencido','averiado','retiro_mercado','otro')),
  disposal_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT
);

CREATE TABLE edit_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  previous_json TEXT,
  new_json TEXT,
  modification_reason TEXT NOT NULL,
  modified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  modification_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT INTO product_batches (product_id, lot_number, quantity, cost)
SELECT id, 'S/N', stock, cost FROM products_legacy WHERE stock > 0;

DROP TABLE products_legacy;
DROP TABLE sale_items_legacy;
DROP TABLE purchase_items_legacy;
DROP TABLE edit_history_legacy;

CREATE VIEW v_product_stock AS
SELECT product_id, COALESCE(SUM(quantity), 0) AS stock
FROM product_batches WHERE status = 'activo' GROUP BY product_id;

CREATE INDEX idx_product_batches_product_status_expiration ON product_batches(product_id, status, expiration_date);
CREATE INDEX idx_stock_movements_batch ON stock_movements(batch_id);
CREATE INDEX idx_stock_movements_reference ON stock_movements(reference_type, reference_id);
CREATE INDEX idx_sale_items_batch ON sale_items(batch_id);
CREATE INDEX idx_purchase_items_batch ON purchase_items(batch_id);

PRAGMA foreign_keys = ON;
