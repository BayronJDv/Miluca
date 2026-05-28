import { getDb } from './database';

export interface Producto {
  id?: number;
  name: string;
  code: string;
  price: number;
  cost: number;
  stock: number;
  //min_stock?: number;
  //unit?: string;
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

export async function buscarProductosPorCodigo(code: string): Promise<Producto | null> {
  const db = await getDb();
  const results = await db.select<Producto[]>(
    'SELECT * FROM products WHERE code = $1',
    [code]
  );
  return results.length > 0 ? results[0] : null;
}

export async function buscarProductosPorNombre(busqueda: string): Promise<Producto[]> {
  const db = await getDb();
  const like = `%${busqueda}%`;
  return await db.select<Producto[]>(
    'SELECT * FROM products WHERE name LIKE $1 OR code LIKE $1 ORDER BY name LIMIT 50',
    [like]
  );
}

export async function buscarProductosPaginado(
  busqueda: string,
  pagina: number = 1,
  porPagina: number = 10
): Promise<{ productos: Producto[]; total: number; pagina: number; totalPaginas: number }> {
  const db = await getDb();
  const offset = (pagina - 1) * porPagina;
  const like = `%${busqueda}%`;

  const [{ count }] = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM products WHERE name LIKE $1 OR code LIKE $1',
    [like]
  );

  const productos = await db.select<Producto[]>(
    `SELECT * FROM products 
     WHERE name LIKE $1 OR code LIKE $1 
     ORDER BY name LIMIT $2 OFFSET $3`,
    [like, porPagina, offset]
  );

  return {
    productos,
    total: count,
    pagina,
    totalPaginas: Math.ceil(count / porPagina),
  };
}

export async function modificarProducto(id: number, p: Partial<Omit<Producto, 'id'>>): Promise<void> {
  const db = await getDb();
  const campos = Object.keys(p) as (keyof typeof p)[];
  if (campos.length === 0) return;
  
  const sets = campos.map((c, i) => `${c} = $${i + 1}`).join(', ');
  const valores = campos.map((c) => p[c]);
  
  await db.execute(
    `UPDATE products SET ${sets} WHERE id = $${campos.length + 1}`,
    [...valores, id]
  );
}

export async function eliminarProducto(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM products WHERE id = $1', [id]);
}

export async function actualizarStock(productoId: number, cantidad: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    'UPDATE products SET stock = stock + $1 WHERE id = $2 AND stock + $1 >= 0',
    [cantidad, productoId]
  );
}