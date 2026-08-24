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
import {
  list_thermal_printers,
  test_thermal_printer,
  ENCODE,
  type TestPrintRequest,
  type PrinterInfo,
} from 'tauri-plugin-thermal-printer';
import {
  getSelectedPrinter,
  setSelectedPrinter,
  getBusinessData,
  setBusinessData,
  type BusinessData,
} from '../db/settings';
import styles from './Configuracion.module.css';


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
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [printersLoading, setPrintersLoading] = useState(true);
  const [testingPrinter, setTestingPrinter] = useState(false);
  const [selectedPrinter, setSelectedPrinterState] = useState<string>(getSelectedPrinter());

  // Estado para datos de la empresa
  const [businessForm, setBusinessForm] = useState<BusinessData>(getBusinessData());
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savedBusiness, setSavedBusiness] = useState(false);

  const refreshUsers = () => {
    listUsers().then(setUsers);
  };

  const refreshPrinters = async () => {
    setPrintersLoading(true);
    try {
      const response = await list_thermal_printers();
      setPrinters(response);

      // Si la impresora guardada ya no existe, limpiar la selección
      const current = getSelectedPrinter();
      if (current && !response.some((p) => p.name === current)) {
        setSelectedPrinter('');
        setSelectedPrinterState('');
      }
    } catch (error) {
      console.log("List printers failed:" + error)
      setPrinters([]);
    } finally {
      setPrintersLoading(false);
    }
  }

  const handleChangePrinter = (printerName: string) => {
    setSelectedPrinterState(printerName);
    setSelectedPrinter(printerName);
  };

  const handleTestPrinter = async () => {
    if (!selectedPrinter) {
      alert('Primero selecciona una impresora.');
      return;
    }
    setTestingPrinter(true);
    try {
      await test_thermal_printer({
        printer_info: {
          printer: selectedPrinter,
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
      setTestingPrinter(false);
    }
  };

  const handleSaveBusiness = () => {
    setSavingBusiness(true);
    setSavedBusiness(false);
    try {
      const data: BusinessData = {
        ...businessForm,
        tax_rate: Number.isFinite(Number(businessForm.tax_rate)) ? Number(businessForm.tax_rate) : 0,
      };
      setBusinessData(data);
      setSavedBusiness(true);
      setTimeout(() => setSavedBusiness(false), 2500);
    } catch (error) {
      alert('Error al guardar los datos de la empresa: ' + error);
    } finally {
      setSavingBusiness(false);
    }
  };

  useEffect(() => {
    refreshUsers();
    refreshPrinters();
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
    <div className={styles.root}>
      <PageHeader
        title="Configuración"
        subtitle="Administra las opciones del sistema"
      />

      {/* Sección Superior: Copias de seguridad */}
      <div className={styles.grid2}>
        <div className={`${styles.card} ${styles.cardFlex}`}>
          <div className={styles.cardHeader}>
            <span className={`material-symbols-outlined ${styles.cardIcon} ${styles.cardIconPrimary}`}>backup</span>
            <h3 className={styles.cardTitle}>Copia de seguridad</h3>
          </div>
          <p className={styles.cardDesc}>
            Genera una copia completa y consistente de la base de datos.
          </p>
          <div className={styles.cardActionsTop}>
            <Btn icon="download" onClick={handleBackup} disabled={backingUp}>
              {backingUp ? 'Generando...' : 'Generar copia'}
            </Btn>
          </div>
        </div>

        {/* Renderizado condicional: Solo visible si el usuario es Admin */}
        {isAdmin && (
          <div className={`${styles.card} ${styles.cardFlex}`}>
            <div className={styles.cardHeader}>
              <span className={`material-symbols-outlined ${styles.cardIcon} ${styles.cardIconError}`}>restore_page</span>
              <h3 className={styles.cardTitle}>Restaurar base de datos</h3>
            </div>
            <p className={styles.cardDesc}>
              Reemplaza los datos actuales con una copia de seguridad previa. Irreversible.
            </p>
            <div className={styles.cardActionsTop}>
              <Btn icon="download" variant="danger" onClick={handleRestore} disabled={restoring}>
                {restoring ? 'Restaurando...' : 'Restaurar desde copia'}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {/* Sección Inferior: Gestión de usuarios */}
      <div className={styles.grid2}>

        {/* Formulario 1: Crear Usuario */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={`material-symbols-outlined ${styles.cardIcon} ${styles.cardIconPrimary}`}>person_add</span>
            <h3 className={styles.cardTitle}>Crear nuevo usuario</h3>
          </div>
          <p className={styles.cardDesc}>
            Registra un nuevo usuario asignándole un rol en el sistema.
          </p>

          <div className={styles.formCol}>
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
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={`material-symbols-outlined ${styles.cardIcon} ${styles.cardIconPrimary}`}>manage_accounts</span>
            <h3 className={styles.cardTitle}>Administrar usuario</h3>
          </div>
          <p className={styles.cardDesc}>
            Cambia la contraseña o elimina cuentas del sistema de forma permanente.
          </p>

          <div className={styles.formCol}>
            <div className={styles.formRow}>
              <div className={styles.flex1}>
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
                <div>
                  <span className={styles.roleLabel}>Rol</span>
                  <span className={styles.roleBadge}>
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

            <div className={styles.actionsRow}>
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
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={`material-symbols-outlined ${styles.cardIcon} ${styles.cardIconPrimary}`}>print</span>
          <h3 className={styles.cardTitle}>Impresoras térmicas</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.cardDesc}>
            Selecciona la impresora que se usará para emitir los recibos de compra. También puedes
            verificar que funcione correctamente con una prueba de impresión.
          </p>

          {printersLoading ? (
            <div className={styles.loadingBox}>
              <span className={styles.loadingText}>Buscando impresoras...</span>
            </div>
          ) : (
            <>
              <div className={styles.formCol}>
                <div className={styles.formRow}>
                  <div className={styles.flex1}>
                    <Select
                      label="Impresora predeterminada"
                      placeholder={
                        printers.length === 0
                          ? 'No hay impresoras disponibles'
                          : 'Seleccionar impresora'
                      }
                      value={selectedPrinter}
                      onChange={handleChangePrinter}
                      options={printers.map((printer) => ({
                        value: printer.name,
                        label: `${printer.name}${printer.status === 'IDLE' ? '' : ` (${printer.status})`}`,
                      }))}
                      icon="download"
                    />
                  </div>
                  <div>
                    <Btn icon="history" variant="ghost" onClick={refreshPrinters}>
                      Actualizar
                    </Btn>
                  </div>
                </div>

                {selectedPrinter && printers.find((p) => p.name === selectedPrinter) && (
                  <div className={styles.printerInfo}>
                    <div className={styles.printerName}>
                      {(() => {
                        const printer = printers.find((p) => p.name === selectedPrinter);
                        return printer ? printer.name : selectedPrinter;
                      })()}
                    </div>
                    {(() => {
                      const printer = printers.find((p) => p.name === selectedPrinter);
                      return printer ? (
                        <div className={styles.formCol}>
                          <div className={styles.printerRow}>
                            <span className={`material-symbols-outlined ${styles.cardIcon}`}>cable</span>
                            <span className={styles.printerRowText}>{printer.interface_type}</span>
                          </div>
                          <div className={styles.printerRow}>
                            <span className={`material-symbols-outlined ${styles.cardIcon}`}>link</span>
                            <span className={styles.printerRowTextTruncate}>{printer.identifier}</span>
                          </div>
                          <div className={styles.printerRow}>
                            <span
                              className={`${styles.statusDot} ${printer.status === 'IDLE' ? styles.statusIdle : styles.statusBusy}`}
                            />
                            <span className={styles.printerRowText}>{printer.status}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {printers.length === 0 && (
                  <div className={styles.noPrinters}>
                    <span className={`material-symbols-outlined ${styles.noPrintersIcon}`}>printer_disabled</span>
                    <span className={styles.noPrintersText}>
                      No se encontraron impresoras térmicas conectadas
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.testRow}>
                <Btn
                  icon="download"
                  onClick={handleTestPrinter}
                  disabled={testingPrinter || !selectedPrinter}
                >
                  {testingPrinter ? 'Probando...' : 'Probar impresión'}
                </Btn>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sección: Datos de la empresa */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span className={`material-symbols-outlined ${styles.cardIcon} ${styles.cardIconPrimary}`}>storefront</span>
          <h3 className={styles.cardTitle}>Datos de la empresa</h3>
        </div>

        <div className={styles.card}>
          <p className={styles.cardDesc}>
            Estos datos aparecerán en el encabezado y pie de los recibos de compra impresos.
          </p>

          <div className={styles.grid2}>
            <div className={styles.span2}>
              <Input
                label="Nombre / Razón social"
                value={businessForm.name}
                onChange={(v) => setBusinessForm((prev) => ({ ...prev, name: v }))}
                icon="receipt"
              />
            </div>
            <Input
              label="NIT"
              value={businessForm.rfc}
              onChange={(v) => setBusinessForm((prev) => ({ ...prev, rfc: v }))}
              icon="info"
            />
            <Input
              label="Teléfono"
              value={businessForm.phone}
              onChange={(v) => setBusinessForm((prev) => ({ ...prev, phone: v }))}
              icon="person"
            />
            <div className={styles.span2}>
              <Input
                label="Dirección"
                value={businessForm.address}
                onChange={(v) => setBusinessForm((prev) => ({ ...prev, address: v }))}
                icon="box"
              />
            </div>
            <Input
              label="Ciudad"
              value={businessForm.city}
              onChange={(v) => setBusinessForm((prev) => ({ ...prev, city: v }))}
              icon="filter"
            />
            <Input
              label="Correo electrónico"
              value={businessForm.email}
              onChange={(v) => setBusinessForm((prev) => ({ ...prev, email: v }))}
              icon="person"
            />
            <Input
              label="Sitio web"
              value={businessForm.website}
              onChange={(v) => setBusinessForm((prev) => ({ ...prev, website: v }))}
              icon="search"
            />
            <Input
              label="IVA (%)"
              type="number"
              value={String(businessForm.tax_rate)}
              onChange={(v) =>
                setBusinessForm((prev) => ({ ...prev, tax_rate: Number(v) || 0 }))
              }
              icon="attach_money"
            />
            <div className={styles.span2}>
              <Input
                label="Lema"
                value={businessForm.slogan}
                onChange={(v) => setBusinessForm((prev) => ({ ...prev, slogan: v }))}
                icon="star"
              />
            </div>
            <div className={styles.span2}>
              <Input
                label="Leyenda al pie del recibo"
                value={businessForm.footer}
                onChange={(v) => setBusinessForm((prev) => ({ ...prev, footer: v }))}
                icon="receipt"
              />
            </div>
          </div>

          <div className={styles.actionsRow}>
            <Btn icon="check" onClick={handleSaveBusiness} disabled={savingBusiness}>
              {savingBusiness ? 'Guardando...' : 'Guardar datos'}
            </Btn>
            {savedBusiness && (
              <span className={styles.savedMsg}>Datos guardados</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
