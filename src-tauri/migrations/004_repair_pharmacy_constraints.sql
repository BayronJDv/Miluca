PRAGMA foreign_keys = OFF;

CREATE TABLE stock_notifications_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  view_date TEXT
);

INSERT INTO stock_notifications_new (id, product_id, start_date, view_date)
SELECT id, product_id, start_date, view_date
FROM stock_notifications
WHERE EXISTS (SELECT 1 FROM products WHERE products.id = stock_notifications.product_id);

DROP TABLE stock_notifications;
ALTER TABLE stock_notifications_new RENAME TO stock_notifications;

PRAGMA foreign_keys = ON;
