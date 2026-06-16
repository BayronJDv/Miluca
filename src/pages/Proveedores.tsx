import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import SupplierCard from '../components/Proveedores/SupplierCard';
import { Input } from '../components/design/Input';
import { colors } from '../components/design/colors';
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
}

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

  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      width: 520, maxWidth: "95vw", maxHeight: "92vh",
      overflowY: "auto",
      boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
    }}>
      {/* Modal Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px 16px 24px",
        borderBottom: `1px solid ${colors.outlineVariant}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: colors.primary,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon name={isEditing ? "edit" : "plus"} size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.onSurface, lineHeight: 1.2 }}>
              {title}
            </div>
            <div style={{ fontSize: 12, color: colors.secondary, marginTop: 2 }}>
              {subtitle}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none", cursor: "pointer",
            width: 32, height: 32, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: colors.outline,
            transition: "background 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = colors.surfaceLow)}
          onMouseLeave={e => (e.currentTarget.style.background = "none")}
        >
          <Icon name="close" size={18} color={colors.outline} />
        </button>
      </div>

      {/* Modal Body */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
            Nombre del Proveedor <span style={{ color: colors.red }}>*</span>
          </label>
          <Input
            placeholder="Ej. Distribuidora ABC"
            value={formData.name}
            onChange={handleNameChange}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
            Informaci&oacute;n de Contacto
          </label>
          <Input
            placeholder="Teléfono, email, dirección..."
            value={formData.contact_info}
            onChange={handleContactChange}
          />
        </div>

        <div style={{ marginBottom: 4 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
            Foto
          </label>

          {photoPreview ? (
            <div style={{
              position: "relative",
              width: 140, height: 140,
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${colors.outlineVariant}`,
              marginBottom: 8,
            }}>
              <img
                src={photoPreview}
                alt="Vista previa"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <button
                onClick={onRemovePhoto}
                style={{
                  position: "absolute", top: 4, right: 4,
                  width: 28, height: 28, borderRadius: "50%",
                  border: "none", cursor: "pointer",
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}
                title="Quitar foto"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={onPickPhoto}
              style={{
                width: 140, height: 140, borderRadius: 12,
                border: `2px dashed ${colors.outlineVariant}`,
                background: colors.surfaceLow,
                cursor: "pointer",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 6, color: colors.secondary, fontSize: 12,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.background = colors.secondaryContainer;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = colors.outlineVariant;
                e.currentTarget.style.background = colors.surfaceLow;
              }}
            >
              <Icon name="plus" size={28} color={colors.secondary} />
              Seleccionar foto
            </button>
          )}
        </div>
      </div>

      {/* Modal Footer */}
      <div style={{
        display: "flex", justifyContent: "flex-end", gap: 10,
        padding: "14px 24px 20px 24px",
        borderTop: `1px solid ${colors.outlineVariant}`,
      }}>
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
  const [form, setForm] = useState<SupplierFormData>({ name: '', contact_info: '', photo_route: '' });
  const [editForm, setEditForm] = useState<SupplierFormData>({ name: '', contact_info: '', photo_route: '' });
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
    });
    const [proveedores, estadisticas] = await Promise.all([
      obtenerProveedores(),
      obtenerEstadisticasProveedores(),
    ]);
    setSuppliers(proveedores);
    setStats(estadisticas);
    setShowCreateModal(false);
    setForm({ name: '', contact_info: '', photo_route: '' });
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
    });
    const [proveedores, estadisticas] = await Promise.all([
      obtenerProveedores(),
      obtenerEstadisticasProveedores(),
    ]);
    setSuppliers(proveedores);
    setStats(estadisticas);
    setShowEditModal(false);
    setEditingSupplier(null);
    setEditForm({ name: '', contact_info: '', photo_route: '' });
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
    setForm({ name: '', contact_info: '', photo_route: '' });
    setCreatePhoto(null);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setShowEditModal(false);
    setEditingSupplier(null);
    setEditForm({ name: '', contact_info: '', photo_route: '' });
    setEditPhoto(null);
    setEditExistingPreview(null);
  }, []);

  const trendIcon = stats && stats.spendingTrend >= 0 ? 'trending_up' : 'trending_down';
  const trendColor = stats && stats.spendingTrend >= 0 ? 'text-green-600' : 'text-red-600';
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
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-110 transition-transform" />
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
                <p className="text-primary font-bold text-lg mt-1">
                  {formatCurrency(stats.topSupplier.monthlyVolume)} <span className="text-secondary text-sm font-normal">vol. mensual</span>
                </p>
              </>
            ) : (
              <p className="text-secondary text-body-md">Sin compras este mes</p>
            )}
          </div>
          {stats?.topSupplier && (
            <div className="mt-md flex">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
                <span className={`${trendColor} font-semibold text-body-sm flex items-center`}>
                  <span className="material-symbols-outlined text-sm">{trendIcon}</span>
                  {trendSign}{(stats?.spendingTrend ?? 0).toFixed(1)}%
                </span>
              </div>
              <div className="mt-md w-full bg-surface-container rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: `${stats?.monthlyBudgetPercent ?? 0}%` }} />
              </div>
              <p className="text-[10px] text-secondary mt-2">{stats?.monthlyBudgetPercent ?? 0}% del presupuesto mensual ejecutado</p>
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
            onEdit={() => openEdit(supplier)}
            onDelete={() => handleDelete(supplier)}
          />
        ))}

        <div onClick={() => setShowCreateModal(true)} className="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-lg hover:border-primary/50 transition-all cursor-pointer group min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-white transition-all mb-md">
            <span className="material-symbols-outlined text-[32px]">add</span>
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
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200,
          backdropFilter: "blur(2px)",
        }}>
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
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 200,
          backdropFilter: "blur(2px)",
        }}>
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
