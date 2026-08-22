import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

export async function checkForUpdates(): Promise<void> {
  try {
    const update = await check();

    if (update) {
      const confirmar = window.confirm(
        `Hay una nueva versión (${update.version}) disponible.\n\n` +
        `¿Desea descargar e instalar la actualización ahora?\n` +
        `La aplicación se reiniciará automáticamente.`
      );

      if (confirmar) {
        await update.downloadAndInstall();
        await relaunch();
      }
    }
  } catch (error) {
    console.error('Error al verificar actualizaciones:', error);
  }
}
