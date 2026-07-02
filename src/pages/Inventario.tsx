import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import PageHeader from '../components/design/PageHeader';
import { Input } from '../components/design/Input';
// import { Chip } from '../components/design/Chip';  Esto sirve para la eleccion multiple, pero todavia no la tenemos en sql
import { colors } from '../components/design/colors';
import { Icon, IconName } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { crearProducto, obtenerProductos, modificarProducto, eliminarProducto, Producto } from '../db/products';
import { userIdAtom } from '../store/UserAtom';
import { useAtomValue } from 'jotai';

interface FormData {
  name: string;
  code: string;
  price: string;
  cost: string;
  stock: string;
  alert_stock: string;
}

interface StatCard {
  icon: IconName;
  label: string;
  value: string;
  valueColor?: string;
}

const ModalContent = memo(({ 
  title, 
  subtitle, 
  formData, 
  onInputChange, 
  onSave, 
  onClose,
  isEditing = false,
  razonModificacion = "",
  onRazonChange
}: { 
  title: string;
  subtitle: string;
  formData: FormData;
  onInputChange: (key: keyof FormData, value: string) => void;
  onSave: () => void;
  onClose: () => void;
  isEditing?: boolean;
  razonModificacion?: string;
  onRazonChange?: (value: string) => void;
}) => {
  const handleNameChange = useCallback((value: string) => {
    onInputChange('name', value);
  }, [onInputChange]);

  const handleCodeChange = useCallback((value: string) => {
    onInputChange('code', value);
  }, [onInputChange]);

  const handlePriceChange = useCallback((value: string) => {
    onInputChange('price', value);
  }, [onInputChange]);

  const handleCostChange = useCallback((value: string) => {
    onInputChange('cost', value);
  }, [onInputChange]);

  const handleStockChange = useCallback((value: string) => {
    onInputChange('stock', value);
  }, [onInputChange]);

  const handleAlertStockChange = useCallback((value: string) => {
    onInputChange('alert_stock', value);
  }, [onInputChange]); // <-- Añadido

  const gainPercentage = useMemo(() => {
    const cost = parseFloat(formData.cost);
    const price = parseFloat(formData.price);
    if (!cost || !price || cost === 0) return "0%";
    return `${(((price - cost) / cost) * 100).toFixed(1)}%`;
  }, [formData.cost, formData.price]);

  const gainColor = useMemo(() => {
    const cost = parseFloat(formData.cost);
    const price = parseFloat(formData.price);
    if (!cost || !price || cost === 0) return colors.secondary;
    const pct = ((price - cost) / cost) * 100;
    return pct > 0 ? "#16A34A" : colors.red;
  }, [formData.cost, formData.price]);

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
        {/* Nombre del Producto */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
            Nombre del Producto <span style={{ color: colors.red }}>*</span>
          </label>
          <Input
            placeholder="Ej. Monitor UltraWide 34'"
            value={formData.name}
            onChange={handleNameChange}
          />
        </div>

        {/* Código SKU */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
            Código (SKU) <span style={{ color: colors.red }}>*</span>
          </label>
          <Input
            placeholder="INV-0000"
            value={formData.code}
            onChange={handleCodeChange}
            disabled={isEditing}
            style={isEditing ? { background: colors.surfaceLow, cursor: 'not-allowed' } : {}}
          />
          {isEditing && (
            <div style={{ fontSize: 11, color: colors.secondary, marginTop: 4 }}>
              El código no puede ser modificado
            </div>
          )}
        </div>

        {/* Finanzas y Costos Section */}
        <div style={{
          background: "#EFF6FF",
          border: "1px solid #BFDBFE",
          borderRadius: 10,
          padding: "16px 16px 18px 16px",
          marginBottom: 20,
        }}>
          <div style={{ 
            display: "flex", alignItems: "center", gap: 7, 
            marginBottom: 14,
          }}>
            <Icon name="wallet" size={15} color={colors.primary} />
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary, letterSpacing: "0.07em" }}>
              FINANZAS Y COSTOS
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
                Costo de Compra <span style={{ color: colors.red }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, color: colors.secondary, fontWeight: 600, pointerEvents: "none",
                  zIndex: 1,
                }}>$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={handleCostChange}
                  style={{ paddingLeft: 28 }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
                Precio de Venta <span style={{ color: colors.red }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                  fontSize: 13, color: colors.secondary, fontWeight: 600, pointerEvents: "none",
                  zIndex: 1,
                }}>$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handlePriceChange}
                  style={{ paddingLeft: 28 }}
                />
              </div>
            </div>
          </div>

          {/* Porcentaje de Ganancia */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
              Porcentaje de Ganancia
            </label>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#fff", border: `1px solid ${colors.outlineVariant}`,
              borderRadius: 8, padding: "9px 12px",
              minHeight: 40,
            }}>
              <span style={{ 
                fontSize: 14, fontWeight: 700,
                color: gainColor,
              }}>
                {gainPercentage}
              </span>
              <Icon name="info" size={15} color={colors.outline} />
            </div>
          </div>
        </div>

        {/* Distribución de Stock (Fila con dos columnas para Stock y Stock Mínimo) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
              Stock {isEditing ? "Actual" : "Inicial"} <span style={{ color: colors.red }}>*</span>
            </label>
            <Input
              type="number"
              placeholder="0"
              value={formData.stock}
              onChange={handleStockChange}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
              Stock Mínimo Alerta <span style={{ color: colors.red }}>*</span>
            </label>
            <Input
              type="number"
              placeholder="Ej. 5"
              value={formData.alert_stock}
              onChange={handleAlertStockChange}
            />
          </div>
        </div>

        {/* Razon modificacion*/}
        {isEditing && (
          <div style={{ marginTop: 16, marginBottom: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
              Razón de la modificación <span style={{ color: colors.red }}>*</span>
            </label>
            <Input
              placeholder="Ej. Corrección de precio / Ajuste de inventario físico"
              value={razonModificacion}
              onChange={(value) => onRazonChange && onRazonChange(value)}
            />
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div style={{ 
        display: "flex", justifyContent: "flex-end", gap: 10,
        padding: "14px 24px 20px 24px",
        borderTop: `1px solid ${colors.outlineVariant}`,
      }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={onSave}>{isEditing ? "Actualizar Producto" : "Guardar Producto"}</Btn>
      </div>
    </div>
  );
});

ModalContent.displayName = 'ModalContent';

const Inventario: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [form, setForm] = useState<FormData>({ 
    name: "", code: "", price: "", cost: "", stock: "", alert_stock: "5" // Por defecto 5
  });
  const [editForm, setEditForm] = useState<FormData>({ 
    name: "", code: "", price: "", cost: "", stock: "", alert_stock: "" 
  });
  const [items, setItems] = useState<Producto[]>([]);
  const [, setLoading] = useState(true);
  const [razonModificacion, setRazonModificacion] = useState<string>("");
  const userId = useAtomValue(userIdAtom);
  
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setLoading(true);
    const productos = await obtenerProductos();
    setItems(productos);
    setLoading(false);
  };

  const filtered = useMemo(() => 
    items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.code.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  );

  const totalValue = useMemo(() => 
    items.reduce((sum, item) => sum + item.cost * item.stock, 0),
    [items]
  );

  // Ahora dinámicamente evalúa usando el alert_stock de cada item, cayendo en 5 si no se define.
  const lowStockCount = useMemo(() => 
    items.filter(item => item.stock < (item.alert_stock ?? 5)).length,
    [items]
  );

  const stats: StatCard[] = [
    { icon: "inventory", label: "Total Productos", value: items.length.toLocaleString() },
    { icon: "warning", label: "Productos Stock Bajo", value: lowStockCount.toString(), valueColor: colors.red },
    { icon: "wallet", label: "Valor Inventario", value: "$" + totalValue.toLocaleString("es-CO", { minimumFractionDigits: 2 }) },
    { icon: "history", label: "Última Carga", value: "Hoy, 09:15" },
  ];

  const handleInputChange = useCallback((key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleEditInputChange = useCallback((key: keyof FormData, value: string) => {
    setEditForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreateProduct = useCallback(async () => {
    if (!form.name || !form.code || !form.price || !form.cost || !form.stock || !form.alert_stock) {
      alert('Por favor complete todos los campos');
      return;
    }

    const newProduct: Producto = {
      name: form.name,
      code: form.code,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      stock: parseInt(form.stock),
      alert_stock: parseInt(form.alert_stock) // <-- Añadido
    };

    await crearProducto(newProduct);
    await cargarProductos();
    
    setShowModal(false);
    setForm({ name: "", code: "", price: "", cost: "", stock: "", alert_stock: "5" });
  }, [form]);

  const handleUpdateProduct = useCallback(async () => {
    if (!editingProduct || !editingProduct.id) return;
    
    if (!editForm.name || !editForm.code || !editForm.price || !editForm.cost || !editForm.stock || !editForm.alert_stock) {
      alert('Por favor complete todos los campos');
      return;
    }
    
    if (!razonModificacion.trim()) {
      alert('Por favor ingrese la razón de la modificación');
      return;
    }

    const updatedProduct: Partial<Omit<Producto, 'id'>> = {
      name: editForm.name,
      code: editForm.code,
      price: parseFloat(editForm.price),
      cost: parseFloat(editForm.cost),
      stock: parseInt(editForm.stock),
      alert_stock: parseInt(editForm.alert_stock) // <-- Añadido
    };
    
    console.log("PRODUCTO MODIFICADO, SU RAZON FUE:", razonModificacion);
    await modificarProducto(editingProduct.id, updatedProduct, razonModificacion, userId);
    await cargarProductos();
    
    setShowEditModal(false);
    setEditingProduct(null);
    setRazonModificacion(""); 
    setEditForm({ name: "", code: "", price: "", cost: "", stock: "", alert_stock: "" });
  }, [editForm, editingProduct, userId, razonModificacion]);

  const handleEdit = useCallback((product: Producto) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      code: product.code,
      price: product.price.toString(),
      cost: product.cost.toString(),
      stock: product.stock.toString(),
      alert_stock: (product.alert_stock ?? 5).toString() // <-- Añadido
    });
    setRazonModificacion(""); 
    setShowEditModal(true);
  }, []);

  const handleDelete = useCallback(async (product: Producto) => {
    if (!product.id) return;
    
    const confirmDelete = window.confirm(`¿Estás seguro de que deseas eliminar el producto "${product.name}"?`);
    if (confirmDelete) {
      await eliminarProducto(product.id);
      await cargarProductos();
    }
  }, []);

  const handleDuplicate = useCallback(async (item: Producto) => {
    const newCode = `${item.code}_COPY_${Date.now()}`; 
    const duplicatedProduct: Producto = {
      name: `${item.name} (Copia)`,
      code: newCode,
      price: item.price,
      cost: item.cost,
      stock: item.stock,
      alert_stock: item.alert_stock ?? 5 // <-- Añadido
    };
    
    await crearProducto(duplicatedProduct);
    await cargarProductos();
  }, []);

  const handleHistory = useCallback((code: string) => {
    console.log('Ver historial:', code);
  }, []);

  // Modificado para usar dinámicamente el stock de alerta propio del elemento
  const getStockColor = useCallback((item: Producto): string => {
    const limit = item.alert_stock ?? 5;
    if (item.stock === 0) return colors.red;
    if (item.stock < limit) return colors.amber;
    return colors.onSurface;
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setForm({ name: "", code: "", price: "", cost: "", stock: "", alert_stock: "5" });
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingProduct(null);
    setRazonModificacion(""); 
    setEditForm({ name: "", code: "", price: "", cost: "", stock: "", alert_stock: "" });
  }, []);

  return (
    <div className="fade-up">
      <PageHeader
        title="Listado de Inventario"
        subtitle="Gestión centralizada de existencias, precios y alertas de stock."
        actions={<Btn icon="plus" onClick={() => setShowModal(true)}>CREAR PRODUCTO</Btn>}
      />
      
      {/* Stats Cards */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ 
            flex: 1, background: colors.surfaceLowest, 
            border: `1px solid ${colors.outlineVariant}`, borderRadius: 10, 
            padding: "16px 20px", display: "flex", gap: 14, alignItems: "center" 
          }}>
            <div style={{ 
              width: 40, height: 40, background: colors.surfaceContainer, 
              borderRadius: 8, display: "flex", alignItems: "center", 
              justifyContent: "center" 
            }}>
              <Icon name={stat.icon} size={20} color={colors.primary} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: colors.secondary, fontWeight: 500 }}>
                {stat.label}
              </div>
              <div style={{ 
                fontSize: 20, fontWeight: 700, 
                color: stat.valueColor || colors.onSurface, 
                letterSpacing: "-0.02em" 
              }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 14 }}>
        <Input 
          placeholder="Buscar producto por nombre o código..." 
          value={search} 
          onChange={setSearch} 
          icon="search" 
        />
      </div>

      {/* Products Table */}
      <div style={{ 
        background: colors.surfaceLowest, border: `1px solid ${colors.outlineVariant}`, 
        borderRadius: 10, overflow: "hidden", overflowX: "auto" 
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
          <thead>
            <tr style={{ background: colors.surfaceLow }}>
              {["NOMBRE DEL PRODUCTO", "CÓDIGO", "P. VENTA", "COSTO", "STOCK", "ACCIONES"].map(header => (
                <th key={header} style={{ 
                  padding: "12px 16px", textAlign: "left", fontSize: 11, 
                  fontWeight: 700, letterSpacing: "0.05em", color: colors.secondary, 
                  whiteSpace: "nowrap" 
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const limit = row.alert_stock ?? 5;
              return (
                <tr key={row.id || row.code} className="hover-row" style={{ borderTop: `1px solid ${colors.outlineVariant}` }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                    {row.stock === 0 && (
                      <div style={{ 
                        fontSize: 11, color: colors.red, fontWeight: 700, 
                        display: "flex", alignItems: "center", gap: 3, marginTop: 2 
                      }}>
                        <Icon name="warning" size={12} color={colors.red} /> SIN STOCK
                      </div>
                    )}
                    {row.stock > 0 && row.stock < limit && (
                      <div style={{ 
                        fontSize: 11, color: colors.amber, fontWeight: 700, 
                        display: "flex", alignItems: "center", gap: 3, marginTop: 2 
                      }}>
                        <Icon name="warning" size={12} color={colors.amber} /> STOCK BAJO (&lt;{limit})
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: colors.secondary }}>
                    {row.code}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700 }}>
                    ${row.price.toFixed(2)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>
                    ${row.cost.toFixed(2)}
                  </td>
                  <td style={{ 
                    padding: "14px 16px", fontSize: 14, fontWeight: 700, 
                    color: getStockColor(row) 
                  }}>
                    {row.stock}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button 
                        onClick={() => handleEdit(row)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline, display: "flex" }}
                        title="Editar"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button 
                        onClick={() => handleDuplicate(row)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline, display: "flex" }}
                        title="Duplicar"
                      >
                        <Icon name="copy" size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(row)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline, display: "flex" }}
                        title="Eliminar"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                      <button 
                        onClick={() => handleHistory(row.code)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline, display: "flex" }}
                        title="Historial"
                      >
                        <Icon name="history" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filtered.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            No se encontraron productos
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showModal && (
        <div style={{ 
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          zIndex: 200,
          backdropFilter: "blur(2px)",
        }}>
          <ModalContent
            title="Nuevo Producto"
            subtitle="Complete la información para registrar el artículo en el sistema."
            formData={form}
            onInputChange={handleInputChange}
            onSave={handleCreateProduct}
            onClose={handleCloseModal}
            isEditing={false}
          />
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div style={{ 
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          zIndex: 200,
          backdropFilter: "blur(2px)",
        }}>
          <ModalContent
            title={`Editar Producto: ${editingProduct.name}`}
            subtitle="Modifique los campos necesarios y guarde los cambios."
            formData={editForm}
            onInputChange={handleEditInputChange}
            onSave={handleUpdateProduct}
            onClose={handleCloseEditModal}
            isEditing={true}
            razonModificacion={razonModificacion}
            onRazonChange={setRazonModificacion} 
          />
        </div>
      )}
    </div>
  );
};

export default Inventario;