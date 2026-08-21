# AGENTS.md

Tauri 2 desktop POS app: React 19 + TypeScript + Vite frontend, SQLite via `@tauri-apps/plugin-sql`. The Rust side (`src-tauri/src/lib.rs`) is minimal — only filesystem commands (supplier images, DB backup restore, CSV save, restart). **All business and database logic lives in the frontend** (`src/db/*.ts`). UI text and code comments are in Spanish.

## Commands

- `pnpm install` — install deps (pnpm workspace; CI uses pnpm 11 / Node 24)
- `pnpm tauri dev` — run the full desktop app (starts Vite on fixed port 1420 automatically)
- `pnpm dev` — frontend only (useless alone: DB/Tauri APIs unavailable in browser)
- `pnpm build` — **this is the typecheck** (`tsc && vite build`). There is no separate lint, typecheck, or test setup. Verify changes with `pnpm build` + manual run.
- Releases: push a tag `v*` → GitHub Actions builds for ubuntu + windows (`.github/workflows/release.yml`).

## Database & migrations (biggest gotcha)

- DB is `sqlite:mydatabase.db` in the Tauri app data dir. Migrations are plain SQL files in `src-tauri/migrations/`, registered in the `vec!` at `src-tauri/src/lib.rs:115` (tauri-plugin-sql/sqlx).
- **New migrations do NOT apply to an existing `.db`** (see `docs.md`). After adding a migration, the `.db` file (and its folder contents) must be deleted; the app recreates it on next launch.
- Never edit an already-applied migration file — add a new numbered `.sql` file and register it in `lib.rs`.
- `tauri-plugin-sql` uses a **connection pool**: manual `BEGIN/COMMIT` breaks ("transaction within a transaction"). All write flows must go through `enqueueGlobalOperation` / `executeInTransaction` in `src/db/database.ts`, and transaction-scoped helpers must receive the `db` instance explicitly (see `actualizarStock(productoId, cantidad, db)` pattern).
- Dev seed users (from `001_initial.sql`): `admin/admin123`, `seller/seller123`.

## Conventions

- DB access layer: one module per table in `src/db/` (typed interfaces + exported async functions; SQL uses `$1`/`?` placeholders). Pages in `src/pages/`, reusable UI in `src/components/` (design system primitives in `src/components/design/`, colors from `colors.ts`).
- Styling is inline styles + CSS Modules; Tailwind is installed but barely used — follow the existing inline-style pattern.
- App state: jotai atoms (`src/store/UserAtom.tsx`). Printer + business data live in **localStorage** (`src/db/settings.ts`), not in the DB.
- Receipt printing: `tauri-plugin-thermal-printer` (80mm), sections built in `src/print/receipt.ts`.
- `docs.md` tracks sprint/HU progress and known issues; `plan/plan01.md` is the approved redesign plan (pharmacy traceability: products → batches → kardex, FEFO, wholesale pricing) — follow it when implementing that work.
