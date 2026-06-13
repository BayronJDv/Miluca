-- =============================================================
-- Migration 0 — Schema inicial
-- Motor: SQLite (Tauri SQL plugin)
-- Idempotente: usa IF NOT EXISTS en todas las sentencias
-- =============================================================

PRAGMA foreign_keys = ON;
PRAGMA user_version = 1;

-- ─────────────────────────────────────────────────────────────
-- TABLA: users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT    NOT NULL UNIQUE,
  password TEXT    NOT NULL,
  role     TEXT    NOT NULL CHECK (role IN ('admin', 'seller'))
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: products
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL,
  code      TEXT    NOT NULL UNIQUE,
  price     REAL    NOT NULL CHECK (price     >= 0),
  cost      REAL    NOT NULL CHECK (cost      >= 0),
  stock     REAL    NOT NULL DEFAULT 0 CHECK (stock     >= 0)
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: suppliers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  photo_route  TEXT,
  contact_info TEXT
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: sales
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER REFERENCES users (id) ON DELETE SET NULL,
  sale_date TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  total     REAL    NOT NULL CHECK (total >= 0)
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: sale_items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id    INTEGER NOT NULL REFERENCES sales    (id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity   REAL    NOT NULL CHECK (quantity > 0),
  subtotal   REAL    NOT NULL CHECK (subtotal >= 0)
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: purchases
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id   INTEGER REFERENCES suppliers (id) ON DELETE SET NULL,
  purchase_date TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  total_cost    REAL    NOT NULL CHECK (total_cost >= 0)
);

-- ─────────────────────────────────────────────────────────────
-- TABLA: purchase_items
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases (id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products  (id) ON DELETE RESTRICT,
  quantity    REAL    NOT NULL CHECK (quantity > 0),
  cost        REAL    NOT NULL CHECK (cost    >= 0)
);

-- =============================================================
-- ÍNDICES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_sales_user_id   ON sales (user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales (sale_date);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id    ON sale_items (sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items (product_id);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_id   ON purchases (supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases (purchase_date);

CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items (purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product_id  ON purchase_items (product_id);

-- =============================================================
-- SEED: usuarios por defecto
--
-- NOTA DE DESARROLLO — NO REPLICAR EN PRODUCCIÓN
-- Estos registros son exclusivos del entorno de desarrollo local.
-- Permiten arrancar la app sin configuración previa y probar
-- ambos roles sin pasos adicionales. Antes del primer despliegue
-- real, reemplazar este bloque por un flujo de creación de usuario
-- en el onboarding de la app, y asegurarse de que las contraseñas
-- estén hasheadas (bcrypt / argon2) y no sean texto plano.
--
-- INSERT OR IGNORE → idempotente: si el usuario ya existe
-- (por username UNIQUE) no falla ni duplica el registro.
-- =============================================================
INSERT OR IGNORE INTO users (username, password, role)
VALUES ('admin',  'admin123',  'admin');

INSERT OR IGNORE INTO users (username, password, role)
VALUES ('seller', 'seller123', 'seller');

INSERT OR IGNORE INTO suppliers (name, photo_route, contact_info)
VALUES ('Generico', '/suppliers/generico.jpg', '315000000');
