import { getDb } from './database';

export interface User {
  id?: number;
  username: string;
  password: string;
  rol?: string;
}

export async function Login(u: User): Promise<Omit<User, 'password'> | null> {
  const db = await getDb();
  const rows = await db.select<{ id: number; username: string; role: string }[]>(
    'SELECT id, username, role FROM users WHERE username = $1 AND password = $2',
    [u.username, u.password]
  );
  if (rows.length === 0) return null;
  return { id: rows[0].id, username: rows[0].username, rol: rows[0].role };
}