-- Recepciones multiples por lote: cada compra del mismo producto con el mismo
-- numero de lote crea su propia fila en product_batches, con costo y fechas propios.
-- Se elimina UNIQUE (product_id, lot_number, expiration_date), que impedia registrar
-- dos veces el mismo lote fisico (recompras parciales o reingresos del proveedor).
PRAGMA foreign_keys = OFF;

CREATE TABLE product_batches_new (
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
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT INTO product_batches_new (id, product_id, lot_number, manufacture_date, expiration_date, quantity, cost, supplier_id, purchase_item_id, status, created_at)
SELECT id, product_id, lot_number, manufacture_date, expiration_date, quantity, cost, supplier_id, purchase_item_id, status, created_at
FROM product_batches;

DROP TABLE product_batches;
ALTER TABLE product_batches_new RENAME TO product_batches;

CREATE INDEX idx_product_batches_product_status_expiration ON product_batches(product_id, status, expiration_date);

PRAGMA foreign_keys = ON;
