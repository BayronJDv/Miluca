-- =============================================================
-- Migration 5 — Clientes y facturación a su nombre
-- Motor: SQLite (Tauri SQL plugin)
-- =============================================================

PRAGMA foreign_keys = ON;

-- ─────────────────────────────────────────────────────────────
-- TABLA: customers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  contact_info TEXT,
  nit          TEXT,
  address      TEXT,
  email        TEXT,
  created_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ─────────────────────────────────────────────────────────────
-- sales.customer_id (cliente que realizó la compra)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE sales ADD COLUMN customer_id INTEGER REFERENCES customers (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales (customer_id);

-- ─────────────────────────────────────────────────────────────
-- SEED: cliente genérico (análogo al proveedor "Generico")
-- Permite emitir facturas rápidas sin nombre si el cliente
-- no quiere dar sus datos.
-- ─────────────────────────────────────────────────────────────
INSERT OR IGNORE INTO customers (name, contact_info)
VALUES ('Generico', '315000000');