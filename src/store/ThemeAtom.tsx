import { atom } from "jotai";

export type Theme = "light" | "dark";

const STORAGE_KEY = "gualcala.theme";

function getInitialTheme(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "dark" || v === "light") return v;
  } catch { /* ignore */ }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export const themeAtom = atom<Theme>(getInitialTheme());

export const toggleThemeAtom = atom(null, (get, set) => {
  const next: Theme = get(themeAtom) === "dark" ? "light" : "dark";
  set(themeAtom, next);
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  document.documentElement.setAttribute("data-theme", next);
});

export function syncThemeToDom(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}
