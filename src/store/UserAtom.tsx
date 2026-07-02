import { atom } from "jotai";

export interface User {
  id: number;
  username: string;
  rol: 'admin' | 'seller';
}

export const userAtom = atom<User | null>(null);

export const isAdminAtom = atom((get) => {
  const user = get(userAtom);
  return user?.rol === 'admin';
});

export const userIdAtom = atom((get) => {
  const user = get(userAtom);
  return user?.id;
});