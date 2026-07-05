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

export async function listUsers(): Promise<{ id: number; username: string; role: string }[]> {
  const db = await getDb();
  return await db.select<{ id: number; username: string; role: string }[]>(
    'SELECT id, username, role FROM users'
  );
}

export async function changePassword(userId: number, newPassword: string): Promise<void> {
  const db = await getDb();
  await db.execute('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);
}

export async function createUser(username: string, password: string, role: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
    [username, password, role]
  );
}

export async function deleteUser(userId: number): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM users WHERE id = $1', [userId]);
}