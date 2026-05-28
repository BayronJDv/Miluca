import React, { useState, useMemo, useCallback } from 'react';
import PageHeader from '../components/design/PageHeader';
import { Input } from '../components/design/Input';
import { Chip } from '../components/design/Chip';
import { colors } from '../components/design/colors';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { Select } from '../components/design/Select';

// Tipos
interface InventoryItem {
  name: string;
  code: string;
  price: number;
  cost: number;
  unit: string;
  stock: number;
  min: number;
  critical?: boolean;
}

interface FormData {
  name: string;
  code: string;
  price: string;
  cost: string;
  unit: string;
  stock: string;
  min: string;
}

interface StatCard {
  icon: string;
  label: string;
  value: string;
  valueColor?: string;
}

const Inventario: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [form, setForm] = useState<FormData>({ 
    name: "", code: "", price: "", cost: "", 
    unit: "UNIDAD", stock: "", min: "" 
  });
  const [items, setItems] = useState<InventoryItem[]>([
    { name: "Papel Bond A4 75g", code: "PPL-001", price: 5.50, cost: 3.20, unit: "PAQUETE", stock: 120, min: 20 },
    { name: "Tóner HP Laserjet M15w", code: "TNR-HPM15", price: 45.00, cost: 30.00, unit: "UNIDAD", stock: 3, min: 5, critical: true },
    { name: "Calculadora Casio FX-991LAX", code: "CAL-CS09", price: 28.90, cost: 18.50, unit: "UNIDAD", stock: 45, min: 10 },
    { name: "Cinta Adhesiva Transparente 1\"", code: "CNT-004", price: 1.20, cost: 0.60, unit: "ROLLO", stock: 200, min: 50 },
    { name: "Resma Papel Carta 500h", code: "RSM-001", price: 8.50, cost: 5.00, unit: "RESMA", stock: 85, min: 30 },
    { name: "Esfero Punta Fina Azul", code: "ESF-007", price: 0.80, cost: 0.35, unit: "UNIDAD", stock: 500, min: 100 },
  ]);

  // Filtrado de items
  const filtered = useMemo(() => 
    items.filter(item => 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      item.code.toLowerCase().includes(search.toLowerCase())
    ),
    [items, search]
  );

  // Valor total del inventario
  const totalValue = useMemo(() => 
    items.reduce((sum, item) => sum + item.cost * item.stock, 0),
    [items]
  );

  // Contar productos con stock bajo (menos del mínimo)
  const lowStockCount = useMemo(() => 
    items.filter(item => item.stock < item.min).length,
    [items]
  );

  // Estadísticas
  const stats: StatCard[] = [
    { icon: "inventory", label: "Total Productos", value: items.length.toLocaleString() },
    { icon: "warning", label: "Stock Bajo", value: lowStockCount.toString(), valueColor: colors.red },
    { icon: "wallet", label: "Valor Inventario", value: "$" + totalValue.toLocaleString("es-CO", { minimumFractionDigits: 2 }) },
    { icon: "history", label: "Última Carga", value: "Hoy, 09:15" },
  ];

  // Handlers del formulario
  const handleInputChange = useCallback((key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreateProduct = useCallback(() => {
    // Validaciones
    if (!form.name || !form.code || !form.price || !form.cost || !form.stock || !form.min) {
      alert('Por favor complete todos los campos');
      return;
    }

    const newProduct: InventoryItem = {
      name: form.name,
      code: form.code,
      price: parseFloat(form.price),
      cost: parseFloat(form.cost),
      unit: form.unit,
      stock: parseInt(form.stock),
      min: parseInt(form.min),
      critical: parseInt(form.stock) < parseInt(form.min)
    };

    setItems(prev => [...prev, newProduct]);
    setShowModal(false);
    
    // Resetear formulario
    setForm({ name: "", code: "", price: "", cost: "", unit: "UNIDAD", stock: "", min: "" });
  }, [form]);

  // Handlers de acciones
  const handleEdit = useCallback((code: string) => {
    console.log('Editar producto:', code);
    // Implementar lógica de edición
  }, []);

  const handleDuplicate = useCallback((item: InventoryItem) => {
    const newCode = `${item.code}_COPY`;
    const duplicatedItem = {
      ...item,
      code: newCode,
      name: `${item.name} (Copia)`,
      critical: false
    };
    setItems(prev => [...prev, duplicatedItem]);
  }, []);

  const handleHistory = useCallback((code: string) => {
    console.log('Ver historial:', code);
    // Implementar lógica de historial
  }, []);

  // Determinar color del stock basado en niveles
  const getStockColor = useCallback((stock: number, min: number, critical?: boolean): string => {
    if (critical) return colors.red;
    if (stock < min * 1.5) return colors.amber;
    return colors.onSurface;
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
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
          <thead>
            <tr style={{ background: colors.surfaceLow }}>
              {["NOMBRE DEL PRODUCTO", "CÓDIGO", "P. VENTA", "COSTO", "UNIDAD", "STOCK", "MÍNIMO", "ACCIONES"].map(header => (
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
            {filtered.map((row, index) => (
              <tr key={row.code} className="hover-row" style={{ borderTop: `1px solid ${colors.outlineVariant}` }}>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{row.name}</div>
                  {row.critical && (
                    <div style={{ 
                      fontSize: 11, color: colors.red, fontWeight: 700, 
                      display: "flex", alignItems: "center", gap: 3, marginTop: 2 
                    }}>
                      <Icon name="warning" size={12} color={colors.red} /> STOCK CRÍTICO
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
                <td style={{ padding: "14px 16px" }}>
                  <Chip color="blue">{row.unit}</Chip>
                </td>
                <td style={{ 
                  padding: "14px 16px", fontSize: 14, fontWeight: 700, 
                  color: getStockColor(row.stock, row.min, row.critical) 
                }}>
                  {row.stock}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: colors.secondary }}>
                  {row.min}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => handleEdit(row.code)}
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
                      onClick={() => handleHistory(row.code)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline, display: "flex" }}
                      title="Historial"
                    >
                      <Icon name="history" size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
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
                  <Icon name="plus" size={22} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.onSurface, lineHeight: 1.2 }}>
                    Nuevo Producto
                  </div>
                  <div style={{ fontSize: 12, color: colors.secondary, marginTop: 2 }}>
                    Complete la información para registrar el artículo en el sistema.
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
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
                  value={form.name}
                  onChange={(value: string) => handleInputChange('name', value)}
                />
              </div>

              {/* Código SKU */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
                  Código (SKU) <span style={{ color: colors.red }}>*</span>
                </label>
                <Input
                  placeholder="INV-0000"
                  value={form.code}
                  onChange={(value: string) => handleInputChange('code', value)}
                />
              </div>

              {/* Finanzas y Costos Section */}
              <div style={{
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                borderRadius: 10,
                padding: "16px 16px 18px 16px",
                marginBottom: 20,
              }}>
                {/* Section Header */}
                <div style={{ 
                  display: "flex", alignItems: "center", gap: 7, 
                  marginBottom: 14,
                }}>
                  <Icon name="wallet" size={15} color={colors.primary} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.primary, letterSpacing: "0.07em" }}>
                    FINANZAS Y COSTOS
                  </span>
                </div>

                {/* Costo y Precio en fila */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
                      Costo de Compra
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                        fontSize: 13, color: colors.secondary, fontWeight: 600, pointerEvents: "none",
                        zIndex: 1,
                      }}>$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={form.cost}
                        onChange={(value: string) => handleInputChange('cost', value)}
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
                        step="0.01"
                        placeholder="0.00"
                        value={form.price}
                        onChange={(value: string) => handleInputChange('price', value)}
                        style={{ paddingLeft: 28 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Porcentaje de Ganancia (calculado automáticamente) */}
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
                      color: (() => {
                        const cost = parseFloat(form.cost);
                        const price = parseFloat(form.price);
                        if (!cost || !price || cost === 0) return colors.secondary;
                        const pct = ((price - cost) / cost) * 100;
                        return pct > 0 ? "#16A34A" : colors.red;
                      })(),
                    }}>
                      {(() => {
                        const cost = parseFloat(form.cost);
                        const price = parseFloat(form.price);
                        if (!cost || !price || cost === 0) return "0%";
                        return `${(((price - cost) / cost) * 100).toFixed(1)}%`;
                      })()}
                    </span>
                    <Icon name="info" size={15} color={colors.outline} />
                  </div>
                </div>
              </div>

              {/* Stock y Mínimo */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
                    Stock Inicial
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={(value: string) => handleInputChange('stock', value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
                    Stock Mínimo (Alerta)
                  </label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={form.min}
                    onChange={(value: string) => handleInputChange('min', value)}
                  />
                </div>
              </div>

              {/* Unidad */}
              <div style={{ marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
                  Unidad de Medida
                </label>
                <Select
                  value={form.unit}
                  onChange={(value: string) => handleInputChange('unit', value)}
                  options={["UNIDAD", "PAQUETE", "RESMA", "ROLLO", "CAJA"]}
                  placeholder="Seleccionar unidad"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ 
              display: "flex", justifyContent: "flex-end", gap: 10,
              padding: "14px 24px 20px 24px",
              borderTop: `1px solid ${colors.outlineVariant}`,
            }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Btn>
              <Btn onClick={handleCreateProduct}>Guardar Producto</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;