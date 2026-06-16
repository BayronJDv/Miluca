import { save, open } from '@tauri-apps/plugin-dialog';
import { useState, useEffect } from 'react';
import Btn from '../components/design/Btn';
import PageHeader from '../components/design/PageHeader';
import { Input } from '../components/design/Input';
import { Select } from '../components/design/Select';
import { getDb } from '../db/database';
import { listUsers, changePassword } from '../db/users';

export default function Configuracion() {
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [users, setUsers] = useState<{ id: number; username: string; role: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    listUsers().then(setUsers);
  }, []);

  const handleChangePassword = async () => {
    if (!selectedUserId) {
      alert('Selecciona un usuario.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      alert('Completa todos los campos.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    setChanging(true);
    try {
      await changePassword(Number(selectedUserId), newPassword);
      alert('Contraseña cambiada exitosamente.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert('Error al cambiar la contraseña: ' + err);
    } finally {
      setChanging(false);
    }
  };

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

      <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] w-full mt-lg">
        <div className="flex items-center gap-sm mb-sm">
          <span className="material-symbols-outlined text-[20px] text-primary">lock</span>
          <h3 className="font-label-lg text-label-lg text-on-surface">Cambiar contraseña</h3>
        </div>
        <p className="text-body-sm text-secondary mb-md leading-relaxed">
          Cambia la contraseña de un usuario del sistema.
        </p>

        <div className="flex flex-col gap-md">
          <div className="flex items-end gap-md">
            <div className="flex-1">
              <Select
                label="Usuario"
                placeholder="Seleccionar usuario"
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={users.map((u) => ({
                  value: String(u.id),
                  label: `${u.username}`,
                }))}
                icon="person"
              />
            </div>
            {selectedUserId && (
              <div className="mb-1">
                <label className="text-[12px] font-semibold tracking-wide text-[#424754] block mb-1">Rol</label>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[#d5e0f8] text-[#545f73]">
                  {users.find((u) => String(u.id) === selectedUserId)?.role}
                </span>
              </div>
            )}
          </div>
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            icon="lock"
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            icon="lock"
          />
          <div>
            <Btn icon="lock" onClick={handleChangePassword} disabled={changing}>
              {changing ? 'Cambiando...' : 'Cambiar contraseña'}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}
