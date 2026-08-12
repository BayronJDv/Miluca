import { save, open } from '@tauri-apps/plugin-dialog';
import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { invoke } from '@tauri-apps/api/core';
import Btn from '../components/design/Btn';
import PageHeader from '../components/design/PageHeader';
import { Input } from '../components/design/Input';
import { Select } from '../components/design/Select';
import { listUsers, changePassword, createUser, deleteUser } from '../db/users';
import { isAdminAtom } from '../store/UserAtom';
import { getDb, closeDb } from '../db/database';
import { list_thermal_printers, test_thermal_printer, ENCODE, type TestPrintRequest } from 'tauri-plugin-thermal-printer';


export default function Configuracion() {
  const isAdmin = useAtomValue(isAdminAtom);

  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [users, setUsers] = useState<{ id: number; username: string; role: string }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changing, setChanging] = useState(false);

  // Estados para la creación de un nuevo usuario
  const [createUsername, setCreateUsername] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('seller');
  const [creating, setCreating] = useState(false);

  // Estado para la eliminación
  const [deleting, setDeleting] = useState(false);

  // Estado para impresoras
  const [printers, setPrinters] = useState<{ name: string; interface_type: string; identifier: string; status: string }[]>([]);
  const [printersLoading, setPrintersLoading] = useState(true);
  const [testingPrinter, setTestingPrinter] = useState<string | null>(null);

  const refreshUsers = () => {
    listUsers().then(setUsers);
  };

  const listPrinters = async () => {
    setPrintersLoading(true);
    try {
      const response = await list_thermal_printers();
      setPrinters(response);
    } catch (error) {
      console.log("List printers failed:" + error)
      setPrinters([]);
    } finally {
      setPrintersLoading(false);
    }
  }

  const handleTestPrinter = async (printerName: string) => {
    setTestingPrinter(printerName);
    try {
      await test_thermal_printer({
        printer_info: {
          printer: printerName,
          paper_size: "Mm80",
          options: {
            code_page: 6,
            encode: ENCODE.WINDOWS_1252,
            use_gbk: false
          },
          sections: []
        },
        include_text: true,
        include_text_styles: true,
        include_alignment: true,
        include_columns: true,
        include_separators: true,
        include_barcode: true,
        include_barcode_types: false,
        include_qr: true,
        include_image: false,
        image_base64: null,
        include_beep: true,
        test_cash_drawer: false,
        cut_paper: true,
        test_feed: true,
        test_all_fonts: false,
        test_invert: false,
        test_rotate: false
      } as TestPrintRequest);
    } catch (error) {
      console.error("Test print failed:", error);
      alert("Error al probar la impresora: " + error);
    } finally {
      setTestingPrinter(null);
    }
  };

  useEffect(() => {
    refreshUsers();
    listPrinters();


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

  const handleCreateUser = async () => {
    if (!createUsername || !createPassword) {
      alert('Completa el usuario y la contraseña.');
      return;
    }
    setCreating(true);
    try {
      await createUser(createUsername, createPassword, createRole);
      alert('Usuario creado exitosamente.');
      setCreateUsername('');
      setCreatePassword('');
      setCreateRole('seller');
      refreshUsers(); // Recargar lista de usuarios
    } catch (err) {
      alert('Error al crear el usuario: ' + err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUserId) {
      alert('Selecciona un usuario para eliminar.');
      return;
    }
    const userToDelete = users.find((u) => String(u.id) === selectedUserId);
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar al usuario "${userToDelete?.username}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteUser(Number(selectedUserId));
      alert('Usuario eliminado exitosamente.');
      setSelectedUserId('');
      refreshUsers(); // Recargar lista de usuarios
    } catch (err) {
      alert('Error al eliminar el usuario: ' + err);
    } finally {
      setDeleting(false);
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
  // 1. Seleccionar archivo .db (usando el plugin dialog)
  const backupPath = await open({
    filters: [{ name: 'Base de Datos', extensions: ['db'] }],
    multiple: false,
  });
  if (!backupPath) return;

  // 2. Primera confirmación con advertencia clara
  const confirmed = window.confirm(
    'RESTAURACIÓN DE BASE DE DATOS\n\n' +
    'Esta acción:\n' +
    '• Reemplazará TODOS los datos actuales\n' +
    '• Se creará un backup de seguridad automático\n' +
    '• La aplicación se reiniciará automáticamente\n\n' +
    '¿Estás seguro de continuar?'
  );
  if (!confirmed) return;

  // 3. Segunda confirmación obligatoria escribiendo una palabra clave
  const verification = window.prompt(
    'ACCION CRÍTICA INTERRUMPIDA\n\n' +
    'Para proceder definitivamente con la restauración, por favor escribe la palabra "RESTAURAR" en mayúsculas:'
  );

  if (verification !== 'RESTAURAR') {
    alert('Restauración cancelada. La palabra clave introducida no coincide.');
    return;
  }

  setRestoring(true);
  try {
    // 4. Cerrar la conexión a la base de datos desde JS/TS (libera los descriptores de archivo)
    console.log('Cerrando conexión a la base de datos...');
    // Nota: Asegúrate de que closeDb esté importada desde tu manejador de base de datos
    await closeDb();
    console.log('Base de datos cerrada correctamente');

    // 5. Invocar comando Rust para mover/reemplazar el archivo físico
    console.log('Restaurando archivo de base de datos mediante Rust...');
    await invoke('restore_database', { backupPath });
    console.log('Archivo de base de datos reemplazado correctamente');

    // 6. Alerta de éxito programando el cierre
    alert('Base de datos restaurada exitosamente.\n\nLa aplicación se cerrará en 2 segundos...');

    // 7. Esperar 2 segundos para que el usuario lea el aviso y apagar/reiniciar la app
    setTimeout(async () => {
      try {
        await invoke('restart_app');
      } catch (err) {
        console.error('Error al reiniciar la app:', err);
        // Fallback si falla el reinicio por completo: al menos refrescar la ventana actual
        window.location.reload();
      }
    }, 2000);

  } catch (err) {
    console.error('Error en restore:', err);

    // Tratamiento de errores limpio
    let errorMsg = 'Error al restaurar la base de datos:\n\n';
    if (typeof err === 'string') {
      errorMsg += err;
    } else if (err instanceof Error) {
      errorMsg += err.message;
    } else {
      errorMsg += String(err);
    }
    alert(errorMsg);

    try {
      await getDb();
      console.log('Base de datos reconectada después del error');
    } catch (e) {
      console.error('Error crítico al reconectar:', e);
    }
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

      {/* Sección Superior: Copias de seguridad */}
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

        {/* Renderizado condicional: Solo visible si el usuario es Admin */}
        {isAdmin && (
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
        )}
      </div>

      {/* Sección Inferior: Gestión de usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-lg">

        {/* Formulario 1: Crear Usuario */}
        <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] w-full">
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">person_add</span>
            <h3 className="font-label-lg text-label-lg text-on-surface">Crear nuevo usuario</h3>
          </div>
          <p className="text-body-sm text-secondary mb-md leading-relaxed">
            Registra un nuevo usuario asignándole un rol en el sistema.
          </p>

          <div className="flex flex-col gap-md">
            <Input
              label="Nombre de usuario"
              type="text"
              value={createUsername}
              onChange={setCreateUsername}
              icon="person"
            />
            <Input
              label="Contraseña"
              type="password"
              value={createPassword}
              onChange={setCreatePassword}
              icon="lock"
            />
            <Select
              label="Rol"
              placeholder="Seleccionar rol"
              value={createRole}
              onChange={setCreateRole}
              options={[
                { value: 'admin', label: 'Administrador' },
                { value: 'seller', label: 'Vendedor' },
              ]}
              icon="manage_accounts"
            />
            <div>
              <Btn icon="add" onClick={handleCreateUser} disabled={creating}>
                {creating ? 'Guardando...' : 'Crear usuario'}
              </Btn>
            </div>
          </div>
        </div>

        {/* Formulario 2: Modificar / Eliminar Usuario Existente */}
        <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] w-full">
          <div className="flex items-center gap-sm mb-sm">
            <span className="material-symbols-outlined text-[20px] text-primary">manage_accounts</span>
            <h3 className="font-label-lg text-label-lg text-on-surface">Administrar usuario</h3>
          </div>
          <p className="text-body-sm text-secondary mb-md leading-relaxed">
            Cambia la contraseña o elimina cuentas del sistema de forma permanente.
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

            <div className="flex gap-sm mt-sm">
              <Btn icon="lock" onClick={handleChangePassword} disabled={changing}>
                {changing ? 'Cambiando...' : 'Cambiar contraseña'}
              </Btn>

              {selectedUserId && (
                <Btn icon="delete" variant="danger" onClick={handleDeleteUser} disabled={deleting}>
                  {deleting ? 'Eliminando...' : 'Eliminar usuario'}
                </Btn>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Sección: Impresoras térmicas */}
      <div className="mt-lg">
        <div className="flex items-center gap-sm mb-lg">
          <span className="material-symbols-outlined text-[20px] text-primary">print</span>
          <h3 className="font-label-lg text-label-lg text-on-surface">Impresoras térmicas</h3>
        </div>

        {printersLoading ? (
          <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] flex items-center justify-center">
            <span className="text-body-sm text-secondary">Buscando impresoras...</span>
          </div>
        ) : printers.length === 0 ? (
          <div className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col items-center justify-center py-xl">
            <span className="material-symbols-outlined text-[40px] text-tertiary mb-sm">printer_disabled</span>
            <span className="text-body-md text-secondary">No se encontraron impresoras térmicas conectadas</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {printers.map((printer, index) => (
              <div
                key={printer.identifier || index}
                className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0] flex flex-col"
              >
                <div className="flex items-center gap-sm mb-md">
                  <span className="material-symbols-outlined text-[20px] text-primary">print</span>
                  <h4 className="font-label-md text-label-md text-on-surface truncate">{printer.name}</h4>
                </div>

                <div className="flex flex-col gap-sm">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">cable</span>
                    <span className="text-body-sm text-secondary">{printer.interface_type}</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">link</span>
                    <span className="text-body-sm text-secondary truncate">{printer.identifier}</span>
                  </div>
                  <div className="flex items-center gap-sm">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        printer.status === 'IDLE' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                    />
                    <span className="text-body-sm text-secondary">{printer.status}</span>
                  </div>
                </div>

                <div className="mt-auto pt-md">
                  <Btn
                    icon="download"
                    variant="ghost"
                    onClick={() => handleTestPrinter(printer.name)}
                    disabled={testingPrinter !== null}
                  >
                    {testingPrinter === printer.name ? 'Probando...' : 'Probar impresión'}
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
