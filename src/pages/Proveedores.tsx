import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import SupplierCard from '../components/Proveedores/SupplierCard';
import { Input } from '../components/design/Input';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { obtenerProveedores, obtenerEstadisticasProveedores, crearProveedor, modificarProveedor, eliminarProveedor, Supplier, SupplierStats } from '../db/suppliers';
import { obtenerClientes, crearCliente, modificarCliente, eliminarCliente, Customer } from '../db/customers';
import { invoke } from '@tauri-apps/api/core';
import styles from './Proveedores.module.css';

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`;
}

interface SupplierFormData {
  name: string;
  contact_info: string;
  photo_route: string;
  nit: string;
  address: string;
  email: string;
}

const EMPTY_FORM: SupplierFormData = {
  name: '',
  contact_info: '',
  photo_route: '',
  nit: '',
  address: '',
  email: '',
};

interface PhotoSelection {
  data: string;
  ext: string;
  preview: string;
}

const ModalContent = memo(({
  title,
  subtitle,
  formData,
  onInputChange,
  onSave,
  onClose,
  isEditing = false,
  photoPreview,
  onPickPhoto,
  onRemovePhoto,
}: {
  title: string;
  subtitle: string;
  formData: SupplierFormData;
  onInputChange: (key: keyof SupplierFormData, value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isEditing?: boolean;
  photoPreview: string | null;
  onPickPhoto: () => void;
  onRemovePhoto: () => void;
}) => {
  const handleNameChange = useCallback((value: string) => {
    onInputChange('name', value);
  }, [onInputChange]);

  const handleContactChange = useCallback((value: string) => {
    onInputChange('contact_info', value);
  }, [onInputChange]);

  const handleNitChange = useCallback((value: string) => {
    onInputChange('nit', value);
  }, [onInputChange]);

  const handleAddressChange = useCallback((value: string) => {
    onInputChange('address', value);
  }, [onInputChange]);

  const handleEmailChange = useCallback((value: string) => {
    onInputChange('email', value);
  }, [onInputChange]);

  return (
    <div className="modal modal--supplier">
      {/* Modal Header */}
      <div className="modal-header">
        <div className="flex items-center gap-md">
          <div className="modal-icon-box">
            <Icon name={isEditing ? "edit" : "plus"} size={22} color="var(--color-on-primary)" />
          </div>
          <div>
            <div className={`font-headline-sm text-headline-sm text-on-surface ${styles.modalTitle}`}>
              {title}
            </div>
            <div className={`text-body-sm text-secondary ${styles.modalSubtitle}`}>
              {subtitle}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="modal-close-btn"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-container-low)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <Icon name="close" size={18} color="var(--color-outline)" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="modal-body">
        <div className={styles.modalField}>
          <label className="field-label">
            Nombre del Proveedor <span className={styles.labelDanger}>*</span>
          </label>
          <Input
            placeholder="Ej. Distribuidora ABC"
            value={formData.name}
            onChange={handleNameChange}
          />
        </div>

        <div className={styles.modalField}>
          <label className="field-label">
            Informaci&oacute;n de Contacto
          </label>
          <Input
            placeholder="Teléfono de contacto..."
            value={formData.contact_info}
            onChange={handleContactChange}
          />
        </div>

        <div className={styles.modalField}>
          <label className="field-label">
            NIT
          </label>
          <Input
            placeholder="Ej. 900123456-7"
            value={formData.nit}
            onChange={handleNitChange}
          />
        </div>

        <div className={styles.modalField}>
          <label className="field-label">
            Email
          </label>
          <Input
            placeholder="Ej. contacto@proveedor.com"
            value={formData.email}
            onChange={handleEmailChange}
          />
        </div>

        <div className={styles.modalField}>
          <label className="field-label">
            Direcci&oacute;n
          </label>
          <Input
            placeholder="Ej. Calle 123 #45-67"
            value={formData.address}
            onChange={handleAddressChange}
          />
        </div>

        <div className={styles.modalFieldSm}>
          <label className="field-label">
            Foto
          </label>

          {photoPreview ? (
            <div className="photo-preview-container">
              <img
                src={photoPreview}
                alt="Vista previa"
                className={styles.previewImg}
              />
              <button
                onClick={onRemovePhoto}
                className="photo-remove-btn"
                title="Quitar foto"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={onPickPhoto}
              className="photo-upload-btn"
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.background = 'var(--color-secondary-container)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--color-outline-variant)';
                e.currentTarget.style.background = 'var(--color-surface-container-low)';
              }}
            >
              <Icon name="plus" size={28} color="var(--color-secondary)" />
              Seleccionar foto
            </button>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div className="modal-footer">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={onSave}>{isEditing ? "Actualizar Proveedor" : "Guardar Proveedor"}</Btn>
      </div>
    </div>
  );
});

ModalContent.displayName = 'ModalContent';

interface CustomerFormData {
  name: string;
  contact_info: string;
  nit: string;
  address: string;
  email: string;
}

const EMPTY_CUSTOMER_FORM: CustomerFormData = {
  name: '',
  contact_info: '',
  nit: '',
  address: '',
  email: '',
};

const CustomerModalContent = memo(({
  title,
  subtitle,
  formData,
  onInputChange,
  onSave,
  onClose,
  isEditing,
}: {
  title: string;
  subtitle: string;
  formData: CustomerFormData;
  onInputChange: (key: keyof CustomerFormData, value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isEditing: boolean;
}) => {
  return (
    <div className="modal modal--supplier">
      <div className="modal-header">
        <div className="flex items-center gap-md">
          <div className="modal-icon-box">
            <Icon name={isEditing ? "edit" : "plus"} size={22} color="var(--color-on-primary)" />
          </div>
          <div>
            <div className={`font-headline-sm text-headline-sm text-on-surface ${styles.modalTitle}`}>
              {title}
            </div>
            <div className={`text-body-sm text-secondary ${styles.modalSubtitle}`}>
              {subtitle}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="modal-close-btn"
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-surface-container-low)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
          <Icon name="close" size={18} color="var(--color-outline)" />
        </button>
      </div>

      <div className="modal-body">
        <div className={styles.modalField}>
          <label className="field-label">Nombre del Cliente <span className={styles.labelDanger}>*</span></label>
          <Input placeholder="Ej. Juan Pérez" value={formData.name} onChange={v => onInputChange('name', v)} />
        </div>
        <div className={styles.modalField}>
          <label className="field-label">Teléfono de Contacto</label>
          <Input placeholder="Ej. 3001234567" value={formData.contact_info} onChange={v => onInputChange('contact_info', v)} />
        </div>
        <div className={styles.modalField}>
          <label className="field-label">NIT / Cédula</label>
          <Input placeholder="Ej. 1234567890" value={formData.nit} onChange={v => onInputChange('nit', v)} />
        </div>
        <div className={styles.modalField}>
          <label className="field-label">Email</label>
          <Input placeholder="Ej. cliente@correo.com" value={formData.email} onChange={v => onInputChange('email', v)} />
        </div>
        <div className={styles.modalField}>
          <label className="field-label">Dirección</label>
          <Input placeholder="Ej. Calle 123 #45-67" value={formData.address} onChange={v => onInputChange('address', v)} />
        </div>
      </div>

      <div className="modal-footer">
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={onSave}>{isEditing ? "Actualizar Cliente" : "Guardar Cliente"}</Btn>
      </div>
    </div>
  );
});

CustomerModalContent.displayName = 'CustomerModalContent';

const Proveedores: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [proveedores, estadisticas, clientes] = await Promise.all([
          obtenerProveedores(),
          obtenerEstadisticasProveedores(),
          obtenerClientes(),
        ]);
        setSuppliers(proveedores);
        setStats(estadisticas);
        setCustomers(clientes);
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierFormData>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<SupplierFormData>(EMPTY_FORM);
  const [createPhoto, setCreatePhoto] = useState<PhotoSelection | null>(null);
  const [editPhoto, setEditPhoto] = useState<PhotoSelection | null>(null);
  const [editExistingPreview, setEditExistingPreview] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState<CustomerFormData>(EMPTY_CUSTOMER_FORM);
  const [editCustomerForm, setEditCustomerForm] = useState<CustomerFormData>(EMPTY_CUSTOMER_FORM);

  const refreshCustomers = useCallback(async () => {
    const list = await obtenerClientes();
    setCustomers(list);
  }, []);

  const handleInputChange = useCallback((key: keyof SupplierFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEditInputChange = useCallback((key: keyof SupplierFormData, value: string) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const readFileAsBase64 = useCallback((file: File): Promise<PhotoSelection> => {
    return new Promise((resolve, reject) => {
      const ext = file.name.split('.').pop() || 'png';
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ data: base64, ext, preview: result });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const handlePickPhoto = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleEditPickPhoto = useCallback(() => {
    editFileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, mode: 'create' | 'edit') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const selection = await readFileAsBase64(file);
    if (mode === 'create') {
      setCreatePhoto(selection);
    } else {
      setEditPhoto(selection);
      setEditExistingPreview(null);
    }
    e.target.value = '';
  }, [readFileAsBase64]);

  const handleRemovePhoto = useCallback((mode: 'create' | 'edit') => {
    if (mode === 'create') {
      setCreatePhoto(null);
    } else {
      setEditPhoto(null);
      if (editingSupplier?.photo_route) {
        loadExistingPreview(editingSupplier.photo_route);
      }
    }
  }, [editingSupplier]);

  const loadExistingPreview = useCallback(async (photoRoute: string) => {
    try {
      const base64 = await invoke<string>('get_supplier_image_base64', { path: photoRoute });
      setEditExistingPreview(base64);
    } catch {
      setEditExistingPreview(null);
    }
  }, []);

  const uploadPhoto = useCallback(async (photo: PhotoSelection): Promise<string> => {
    return await invoke<string>('save_supplier_image', { data: photo.data, ext: photo.ext });
  }, []);

  const handleCreate = useCallback(async () => {
    if (!form.name.trim()) {
      alert('Por favor ingrese el nombre del proveedor');
      return;
    }
    let photoRoute = form.photo_route.trim() || null;
    if (createPhoto) {
      photoRoute = await uploadPhoto(createPhoto);
    }
    await crearProveedor({
      name: form.name.trim(),
      contact_info: form.contact_info.trim() || null,
      photo_route: photoRoute,
      nit: form.nit.trim() || null,
      address: form.address.trim() || null,
      email: form.email.trim() || null,
    });
    const [proveedores, estadisticas] = await Promise.all([
      obtenerProveedores(),
      obtenerEstadisticasProveedores(),
    ]);
    setSuppliers(proveedores);
    setStats(estadisticas);
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setCreatePhoto(null);
  }, [form, createPhoto, uploadPhoto]);

  const handleUpdate = useCallback(async () => {
    if (!editingSupplier || !editingSupplier.id) return;
    if (!editForm.name.trim()) {
      alert('Por favor ingrese el nombre del proveedor');
      return;
    }
    let photoRoute = editPhoto
      ? await uploadPhoto(editPhoto)
      : (editForm.photo_route.trim() || null);
    await modificarProveedor(editingSupplier.id, {
      name: editForm.name.trim(),
      contact_info: editForm.contact_info.trim() || null,
      photo_route: photoRoute,
      nit: editForm.nit.trim() || null,
      address: editForm.address.trim() || null,
      email: editForm.email.trim() || null,
    });
    const [proveedores, estadisticas] = await Promise.all([
      obtenerProveedores(),
      obtenerEstadisticasProveedores(),
    ]);
    setSuppliers(proveedores);
    setStats(estadisticas);
    setShowEditModal(false);
    setEditingSupplier(null);
    setEditForm(EMPTY_FORM);
    setEditPhoto(null);
    setEditExistingPreview(null);
  }, [editForm, editingSupplier, editPhoto, uploadPhoto]);

  const handleDelete = useCallback(async (supplier: Supplier) => {
    if (!supplier.id) return;
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el proveedor "${supplier.name}"?`);
    if (confirmDelete) {
      await eliminarProveedor(supplier.id);
      const [proveedores, estadisticas] = await Promise.all([
        obtenerProveedores(),
        obtenerEstadisticasProveedores(),
      ]);
      setSuppliers(proveedores);
      setStats(estadisticas);
    }
  }, []);

  const openEdit = useCallback((supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditForm({
      name: supplier.name,
      contact_info: supplier.contact_info ?? '',
      photo_route: supplier.photo_route ?? '',
      nit: supplier.nit ?? '',
      address: supplier.address ?? '',
      email: supplier.email ?? '',
    });
    setEditPhoto(null);
    setEditExistingPreview(null);
    if (supplier.photo_route) {
      loadExistingPreview(supplier.photo_route);
    }
    setShowEditModal(true);
  }, [loadExistingPreview]);

  const handleCloseCreate = useCallback(() => {
    setShowCreateModal(false);
    setForm(EMPTY_FORM);
    setCreatePhoto(null);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingSupplier(null);
    setEditForm(EMPTY_FORM);
    setEditPhoto(null);
    setEditExistingPreview(null);
  }, []);

  const handleCustomerInputChange = useCallback((key: keyof CustomerFormData, value: string) => {
    setCustomerForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEditCustomerInputChange = useCallback((key: keyof CustomerFormData, value: string) => {
    setEditCustomerForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCustomerCreate = useCallback(async () => {
    if (!customerForm.name.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }
    await crearCliente({
      name: customerForm.name.trim(),
      contact_info: customerForm.contact_info.trim() || null,
      nit: customerForm.nit.trim() || null,
      address: customerForm.address.trim() || null,
      email: customerForm.email.trim() || null,
    });
    await refreshCustomers();
    setShowCreateCustomerModal(false);
    setCustomerForm(EMPTY_CUSTOMER_FORM);
  }, [customerForm, refreshCustomers]);

  const handleCustomerUpdate = useCallback(async () => {
    if (!editingCustomer || !editingCustomer.id) return;
    if (!editCustomerForm.name.trim()) {
      alert('Por favor ingrese el nombre del cliente');
      return;
    }
    await modificarCliente(editingCustomer.id, {
      name: editCustomerForm.name.trim(),
      contact_info: editCustomerForm.contact_info.trim() || null,
      nit: editCustomerForm.nit.trim() || null,
      address: editCustomerForm.address.trim() || null,
      email: editCustomerForm.email.trim() || null,
    });
    await refreshCustomers();
    setShowEditCustomerModal(false);
    setEditingCustomer(null);
    setEditCustomerForm(EMPTY_CUSTOMER_FORM);
  }, [editingCustomer, editCustomerForm, refreshCustomers]);

  const handleCustomerDelete = useCallback(async (customer: Customer) => {
    if (!customer.id) return;
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el cliente "${customer.name}"?`);
    if (confirmDelete) {
      await eliminarCliente(customer.id);
      await refreshCustomers();
    }
  }, [refreshCustomers]);

  const openCustomerEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setEditCustomerForm({
      name: customer.name,
      contact_info: customer.contact_info ?? '',
      nit: customer.nit ?? '',
      address: customer.address ?? '',
      email: customer.email ?? '',
    });
    setShowEditCustomerModal(true);
  }, []);

  const handleCloseCreateCustomer = useCallback(() => {
    setShowCreateCustomerModal(false);
    setCustomerForm(EMPTY_CUSTOMER_FORM);
  }, []);

  const handleCloseEditCustomer = useCallback(() => {
    setShowEditCustomerModal(false);
    setEditingCustomer(null);
    setEditCustomerForm(EMPTY_CUSTOMER_FORM);
  }, []);

  const trendIcon = stats && stats.spendingTrend >= 0 ? 'trending_up' : 'trending_down';
  const trendColor = stats && stats.spendingTrend >= 0 ? 'var(--color-delta-up)' : 'var(--color-delta-down)';
  const trendSign = stats && stats.spendingTrend >= 0 ? '+' : '';

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <h2 className="font-headline-md text-on-surface">Gesti&oacute;n de Proveedores</h2>
        <button onClick={() => setShowCreateModal(true)} className={styles.newBtn}>
          <span className="material-symbols-outlined">add</span>
          + NUEVO PROVEEDOR
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statCardDecor} />
          <div>
            <p className={styles.statLabel}>Proveedor Principal</p>
            {loading ? (
              <div className={styles.skeletonStack}>
                <div className={`${styles.skeleton} ${styles.skeletonH20W160}`} />
                <div className={`${styles.skeleton} ${styles.skeletonH16W128}`} />
              </div>
            ) : stats?.topSupplier ? (
              <>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{stats.topSupplier.name}</h3>
                <p className={`font-bold text-lg mt-1 ${styles.primaryText}`}>
                  {formatCurrency(stats.topSupplier.monthlyVolume)} <span className="text-secondary text-sm font-normal">vol. mensual</span>
                </p>
              </>
            ) : (
              <p className="text-secondary text-body-md">Sin compras este mes</p>
            )}
          </div>
          {stats?.topSupplier && (
            <div className={styles.reliableWrap}>
              <span className={`inline-flex items-center px-sm py-xs rounded-full text-xs font-medium ${styles.successBadge}`}>
                <span className={`material-symbols-outlined text-sm mr-1 ${styles.verifiedFill}`}>verified</span>
                Most Reliable
              </span>
            </div>
          )}
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Total Proveedores</p>
          {loading ? (
            <div className={`${styles.skeleton} ${styles.skeletonH36W64}`} />
          ) : (
            <h3 className={styles.statValue}>{stats?.total ?? 0}</h3>
          )}
        </div>

        <div className={styles.statCard}>
          <p className={styles.statLabel}>Compras del Mes</p>
          {loading ? (
            <div className={styles.skeletonStack}>
              <div className={`${styles.skeleton} ${styles.skeletonH36W112}`} />
              <div className={`${styles.skeleton} ${styles.skeletonH8Full}`} />
            </div>
          ) : (
            <>
              <div className={styles.flexBaseline}>
                <h3 className={styles.statValue}>{formatCurrency(stats?.monthlySpending ?? 0)}</h3>
                <span className={styles.trend} style={{ color: trendColor }}>
                  <span className="material-symbols-outlined text-sm">{trendIcon}</span>
                  {trendSign}{(stats?.spendingTrend ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className={styles.budgetTrack}>
                <div className={styles.budgetFill} style={{ width: `${stats?.monthlyBudgetPercent ?? 0}%` }} />
              </div>
              <p className={styles.budgetDesc}>{stats?.monthlyBudgetPercent ?? 0}% del presupuesto mensual ejecutado</p>
            </>
          )}
        </div>
      </div>

      <div className={styles.supplierGrid}>
        {suppliers.map((supplier) => (
            <SupplierCard
            key={supplier.id}
            name={supplier.name}
            phone={supplier.contact_info ?? ''}
            imageUrl={supplier.photo_route}
            initials={getInitials(supplier.name)}
            nit={supplier.nit}
            address={supplier.address}
            email={supplier.email}
            onEdit={() => openEdit(supplier)}
            onDelete={() => handleDelete(supplier)}
          />
        ))}

        <div onClick={() => setShowCreateModal(true)} className={styles.addCard}>
          <div className={styles.addCardIcon}>
            <span className={`material-symbols-outlined ${styles.iconLg}`}>add</span>
          </div>
          <p className={styles.addCardLabel}>Agregar Proveedor</p>
        </div>
      </div>

      <div className={styles.headerRow} style={{ marginTop: 'var(--spacing-xl)' }}>
        <h2 className="font-headline-md text-on-surface">Gesti&oacute;n de Clientes</h2>
        <button onClick={() => setShowCreateCustomerModal(true)} className={styles.newBtn}>
          <span className="material-symbols-outlined">add</span>
          + NUEVO CLIENTE
        </button>
      </div>

      <div className={styles.supplierGrid}>
        {customers.map((customer) => (
          <SupplierCard
            key={customer.id}
            name={customer.name}
            phone={customer.contact_info ?? ''}
            initials={getInitials(customer.name)}
            nit={customer.nit}
            address={customer.address}
            email={customer.email}
            onEdit={() => openCustomerEdit(customer)}
            onDelete={() => handleCustomerDelete(customer)}
          />
        ))}

        <div onClick={() => setShowCreateCustomerModal(true)} className={styles.addCard}>
          <div className={styles.addCardIcon}>
            <span className={`material-symbols-outlined ${styles.iconLg}`}>add</span>
          </div>
          <p className={styles.addCardLabel}>Agregar Cliente</p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => handleFileChange(e, 'create')}
      />
      <input
        ref={editFileInputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={(e) => handleFileChange(e, 'edit')}
      />

      {/* Create Supplier Modal */}
      {showCreateModal && (
        <div className="overlay">
          <ModalContent
            title="Nuevo Proveedor"
            subtitle="Registre un nuevo proveedor en el sistema."
            formData={form}
            onInputChange={handleInputChange}
            onSave={handleCreate}
            onClose={handleCloseCreate}
            isEditing={false}
            photoPreview={createPhoto?.preview ?? null}
            onPickPhoto={handlePickPhoto}
            onRemovePhoto={() => handleRemovePhoto('create')}
          />
        </div>
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && editingSupplier && (
        <div className="overlay">
          <ModalContent
            title={`Editar Proveedor: ${editingSupplier.name}`}
            subtitle="Modifique los campos necesarios y guarde los cambios."
            formData={editForm}
            onInputChange={handleEditInputChange}
            onSave={handleUpdate}
            onClose={handleCloseEdit}
            isEditing={true}
            photoPreview={editPhoto?.preview ?? editExistingPreview ?? null}
            onPickPhoto={handleEditPickPhoto}
            onRemovePhoto={() => handleRemovePhoto('edit')}
          />
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateCustomerModal && (
        <div className="overlay">
          <CustomerModalContent
            title="Nuevo Cliente"
            subtitle="Registre un nuevo cliente en el sistema."
            formData={customerForm}
            onInputChange={handleCustomerInputChange}
            onSave={handleCustomerCreate}
            onClose={handleCloseCreateCustomer}
            isEditing={false}
          />
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && editingCustomer && (
        <div className="overlay">
          <CustomerModalContent
            title={`Editar Cliente: ${editingCustomer.name}`}
            subtitle="Modifique los campos necesarios y guarde los cambios."
            formData={editCustomerForm}
            onInputChange={handleEditCustomerInputChange}
            onSave={handleCustomerUpdate}
            onClose={handleCloseEditCustomer}
            isEditing={true}
          />
        </div>
      )}
    </div>
  );
};

export default Proveedores;
