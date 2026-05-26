# Miluca (Tauri + React + TypeScript)

Guía rápida para empezar a desarrollar este proyecto en tu máquina local.

## Requisitos previos

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)
- Dependencias del sistema para Tauri (según tu sistema operativo):
  - https://tauri.app/start/prerequisites/

## 1) Instalar dependencias

```bash
pnpm install --ignore-scripts
```

## 2) Desarrollo web (solo frontend)

```bash
pnpm dev
```

Esto levanta Vite para desarrollo del frontend.

## 3) Desarrollo de app de escritorio (Tauri)

```bash
pnpm tauri dev
```

Este comando abre la app de escritorio usando Tauri y recarga cambios en caliente.

## 4) Build de producción del frontend

```bash
pnpm build
```

## Estructura principal

- `src/`: aplicación React/TypeScript
- `src-tauri/`: backend nativo de Tauri (Rust)

## Recomendado para VS Code

- Extensión **Tauri**
- Extensión **rust-analyzer**
