import { getDb } from './database';

export interface Customer {
  id?: number;
  name: string;
  contact_info: string | null;
  nit?: string | null;
  address?: string | null;
  email?: string | null;
}

export async function obtenerClientes(): Promise<Customer[]> {
  const db = await getDb();
  return await db.select<Customer[]>('SELECT * FROM customers ORDER BY name');
}

export async function obtenerCliente(id: number): Promise<Customer | null> {
  const db = await getDb();
  const results = await db.select<Customer[]>(
    'SELECT * FROM customers WHERE id = $1',
    [id]
  );
  return results.length > 0 ? results[0] : null;
}

export async function crearCliente(c: Customer): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    'INSERT INTO customers (name, contact_info, nit, address, email) VALUES ($1, $2, $3, $4, $5)',
    [c.name, c.contact_info, c.nit ?? null, c.address ?? null, c.email ?? null]
  );
  return result.lastInsertId as number;
}

export async function modificarCliente(id: number, c: Partial<Omit<Customer, 'id'>>): Promise<void> {
  const db = await getDb();
  const campos = Object.keys(c) as (keyof typeof c)[];
  if (campos.length === 0) return;

  const sets = campos.map((cc, i) => `${cc} = $${i + 1}`).join(', ');
  const valores = campos.map((cc) => c[cc]);

  await db.execute(
    `UPDATE customers SET ${sets} WHERE id = $${campos.length + 1}`,
    [...valores, id]
  );
}

export async function eliminarCliente(id: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM customers WHERE id = $1', [id]);
}