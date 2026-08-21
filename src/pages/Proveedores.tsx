import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import SupplierCard from '../components/Proveedores/SupplierCard';
import { Input } from '../components/design/Input';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { obtenerProveedores, obtenerEstadisticasProveedores, crearProveedor, modificarProveedor, eliminarProveedor, Supplier, SupplierStats } from '../db/suppliers';
import { invoke } from '@tauri-apps/api/core';

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
            <div className="font-headline-sm text-headline-sm text-on-surface" style={{ lineHeight: 1.2 }}>
              {title}
            </div>
            <div className="text-body-sm text-secondary" style={{ marginTop: 2 }}>
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
        <div style={{ marginBottom: 16 }}>
          <label className="field-label">
            Nombre del Proveedor <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <Input
            placeholder="Ej. Distribuidora ABC"
            value={formData.name}
            onChange={handleNameChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">
            Informaci&oacute;n de Contacto
          </label>
          <Input
            placeholder="Teléfono de contacto..."
            value={formData.contact_info}
            onChange={handleContactChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">
            NIT
          </label>
          <Input
            placeholder="Ej. 900123456-7"
            value={formData.nit}
            onChange={handleNitChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">
            Email
          </label>
          <Input
            placeholder="Ej. contacto@proveedor.com"
            value={formData.email}
            onChange={handleEmailChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="field-label">
            Direcci&oacute;n
          </label>
          <Input
            placeholder="Ej. Calle 123 #45-67"
            value={formData.address}
            onChange={handleAddressChange}
          />
        </div>

        <div style={{ marginBottom: 4 }}>
          <label className="field-label">
            Foto
          </label>

          {photoPreview ? (
            <div className="photo-preview-container">
              <img
                src={photoPreview}
                alt="Vista previa"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

const Proveedores: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [proveedores, estadisticas] = await Promise.all([
          obtenerProveedores(),
          obtenerEstadisticasProveedores(),
        ]);
        setSuppliers(proveedores);
        setStats(estadisticas);
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

  const trendIcon = stats && stats.spendingTrend >= 0 ? 'trending_up' : 'trending_down';
  const trendColor = stats && stats.spendingTrend >= 0 ? 'var(--color-delta-up)' : 'var(--color-delta-down)';
  const trendSign = stats && stats.spendingTrend >= 0 ? '+' : '';

  return (
    <div className="fade-up">
      <div className="flex justify-between items-center mb-xl">
        <h2 className="font-headline-md text-headline-md text-on-surface">Gesti&oacute;n de Proveedores</h2>
        <button onClick={() => setShowCreateModal(true)} className="flex items-center bg-primary text-white px-lg py-sm rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all active:scale-95 shadow-md">
          <span className="material-symbols-outlined mr-sm">add</span>
          + NUEVO PROVEEDOR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        <div className="bg-white p-lg rounded-xl card-shadow flex flex-col justify-between relative overflow-hidden group border border-outline-variant">
          <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-primary/5 group-hover:scale-110 transition-transform" />
          <div>
            <p className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-base">Proveedor Principal</p>
            {loading ? (
              <div className="space-y-2">
                <div className="h-5 w-40 bg-surface-container-high rounded animate-pulse" />
                <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse" />
              </div>
            ) : stats?.topSupplier ? (
              <>
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{stats.topSupplier.name}</h3>
                <p className="font-bold text-lg mt-1" style={{ color: 'var(--color-primary)' }}>
                  {formatCurrency(stats.topSupplier.monthlyVolume)} <span className="text-secondary text-sm font-normal">vol. mensual</span>
                </p>
              </>
            ) : (
              <p className="text-secondary text-body-md">Sin compras este mes</p>
            )}
          </div>
          {stats?.topSupplier && (
            <div className="mt-md flex">
              <span className="inline-flex items-center px-sm py-xs rounded-full text-xs font-medium" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                <span className="material-symbols-outlined text-sm mr-1" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Most Reliable
              </span>
            </div>
          )}
        </div>

        <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant">
          <p className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-base">Total Proveedores</p>
          {loading ? (
            <div className="h-9 w-16 bg-surface-container-high rounded animate-pulse" />
          ) : (
            <h3 className="font-display-lg text-display-lg text-on-surface">{stats?.total ?? 0}</h3>
          )}
        </div>

        <div className="bg-white p-lg rounded-xl card-shadow border border-outline-variant">
          <p className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-base">Compras del Mes</p>
          {loading ? (
            <div className="space-y-2">
              <div className="h-9 w-28 bg-surface-container-high rounded animate-pulse" />
              <div className="h-2 w-full bg-surface-container-high rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-xs">
                <h3 className="font-display-lg text-display-lg text-on-surface">{formatCurrency(stats?.monthlySpending ?? 0)}</h3>
                <span className="font-semibold text-body-sm flex items-center" style={{ color: trendColor }}>
                  <span className="material-symbols-outlined text-sm">{trendIcon}</span>
                  {trendSign}{(stats?.spendingTrend ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="mt-md w-full rounded-full h-2" style={{ background: 'var(--color-surface-container)' }}>
                <div className="h-2 rounded-full" style={{ background: 'var(--color-primary)', width: `${stats?.monthlyBudgetPercent ?? 0}%` }} />
              </div>
              <p style={{ fontSize: 10 }} className="text-secondary mt-2">{stats?.monthlyBudgetPercent ?? 0}% del presupuesto mensual ejecutado</p>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
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

        <div onClick={() => setShowCreateModal(true)} className="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-lg hover:border-primary/50 transition-all cursor-pointer group min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all mb-md">
            <span className="material-symbols-outlined" style={{ fontSize: 32 }}>add</span>
          </div>
          <p className="font-headline-sm text-headline-sm text-secondary group-hover:text-on-surface">Agregar Proveedor</p>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'create')}
      />
      <input
        ref={editFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
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
    </div>
  );
};

export default Proveedores;
