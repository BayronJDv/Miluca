import { getDb } from './database';

export interface Producto {
  id?: number;
  name: string;
  code: number;
  price: number;
  cost: number;
  stock: number;
}

export async function crearProducto(p: Producto): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO products (name, code, price, cost, stock) VALUES ($1, $2, $3, $4, $5)',
    [p.name, p.code, p.price, p.cost, p.stock]
  );
}

export async function obtenerProductos(): Promise<Producto[]> {
  const db = await getDb();
  return await db.select('SELECT * FROM products ORDER BY name');
}

export async function eliminarProducto(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM products WHERE id = $1', [id]);
}