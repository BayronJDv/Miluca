import { save, open } from '@tauri-apps/plugin-dialog';
import { useState } from 'react';
import Btn from '../components/design/Btn';
import PageHeader from '../components/design/PageHeader';
import { getDb } from '../db/database';

export default function Configuracion() {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const handleBackup = async () => {
    const path = await save({
      filters: [{ name: 'Base de Datos', extensions: ['db'] }],
      defaultPath: `backup-gualcala-${new Date().toISOString().slice(0, 10)}.db`,
    });
    if (!path) return;

    setBackingUp(true);
    try {
      const db = await getDb();
      const escaped = path.replace(/'/g, "''");
      await db.execute(`VACUUM INTO '${escaped}'`);
      alert('Copia de seguridad creada exitosamente.');
    } catch (err) {
      alert('Error al crear la copia de seguridad: ' + err);
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestore = async () => {
    const path = await open({
      filters: [{ name: 'Base de Datos', extensions: ['db'] }],
      multiple: false,
    });
    if (!path) return;

    const confirmed = window.confirm(
      '¿Estás seguro? Esta acción reemplazará TODOS los datos actuales ' +
      'con los de la copia de seguridad. Esta operación no se puede deshacer.'
    );
    if (!confirmed) return;

    setRestoring(true);
    try {
      const db = await getDb();
      const escaped = path.replace(/'/g, "''");

      await db.execute('PRAGMA foreign_keys = OFF');
      await db.execute(`ATTACH DATABASE '${escaped}' AS backup_db`);

      const tables = await db.select<{ name: string }[]>(
        "SELECT name FROM backup_db.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      for (const { name } of tables) {
        await db.execute(`DELETE FROM "${name}"`);
      }

      await db.execute('DELETE FROM sqlite_sequence');

      for (const { name } of tables) {
        await db.execute(`INSERT INTO "${name}" SELECT * FROM backup_db."${name}"`);
      }

      await db.execute('DETACH DATABASE backup_db');
      await db.execute('PRAGMA foreign_keys = ON');

      alert('Base de datos restaurada exitosamente.');
    } catch (err) {
      alert('Error al restaurar: ' + err);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-lg">
      <PageHeader
        title="Configuración"
        subtitle="Administra las opciones del sistema"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col">
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">backup</span>
            <h3 className="font-label-lg text-label-lg text-on-surface">Copia de seguridad</h3>
          </div>
          <p className="text-body-sm text-secondary mb-md leading-relaxed">
            Genera una copia completa y consistente de la base de datos.
          </p>
          <div className="mt-auto">
            <Btn icon="download" onClick={handleBackup} disabled={backingUp}>
              {backingUp ? 'Generando...' : 'Generar copia'}
            </Btn>
          </div>
        </div>

        <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col">
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-[20px] text-error">restore_page</span>
            <h3 className="font-label-lg text-label-lg text-on-surface">Restaurar base de datos</h3>
          </div>
          <p className="text-body-sm text-secondary mb-md leading-relaxed">
            Reemplaza los datos actuales con una copia de seguridad previa. Irreversible.
          </p>
          <div className="mt-auto">
            <Btn icon="download" variant="danger" onClick={handleRestore} disabled={restoring}>
              {restoring ? 'Restaurando...' : 'Restaurar desde copia'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
