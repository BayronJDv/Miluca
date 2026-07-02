import React, { useState, useCallback, useEffect } from 'react';
import PageHeader from '../components/design/PageHeader';
import { colors } from '../components/design/colors';
import { Icon } from '../components/design/Icon';
import { listarHistorialPorFecha, EditHistoryEntry } from '../db/edit_history';

const HistorialEdiciones: React.FC = () => {
  const [items, setItems] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const cargarHistorial = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listarHistorialPorFecha();
      if (response.success) {
        setItems(response.history);
      } else {
        console.error(response.message);
      }
    } catch (error) {
      console.error("Error al cargar historial de ediciones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  const formatPrice = (n: number | null | undefined): string => {
    if (n === null || n === undefined) return "-";
    return "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return "-";
    const safeDateString = dateString.includes('T') 
      ? dateString 
      : dateString.replace(' ', 'T') + 'Z';
      
    return new Date(safeDateString).toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const handleToggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Helper para renderizar celdas comparativas con indicadores visuales
  const renderCambio = (
    label: string, 
    prev: string | number | null | undefined, 
    next: string | number | null | undefined, 
    isPrice = false
  ) => {
    const hasChanged = prev !== next;
    if (!hasChanged) return null;

    let colorCambio = colors.onSurface;
    let indicador = "";

    if (typeof prev === 'number' && typeof next === 'number') {
      if (next > prev) {
        colorCambio = "#2e7d32"; // Verde si incrementa (precio/stock)
        indicador = " ↗";
      } else if (next < prev) {
        colorCambio = "#c62828"; // Rojo si disminuye
        indicador = " ↘";
      }
    }

    return (
      <tr style={{ borderTop: `1px solid ${colors.surfaceContainer}` }}>
        <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 600, color: colors.secondary }}>{label}</td>
        <td style={{ padding: "10px 16px", fontSize: 13, textDecoration: "line-through", color: "#a0a0a0" }}>
          {isPrice ? formatPrice(prev as number) : prev ?? "-"}
        </td>
        <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 700, color: colorCambio }}>
          {isPrice ? formatPrice(next as number) : next ?? "-"}
          <span style={{ fontSize: 11 }}>{indicador}</span>
        </td>
      </tr>
    );
  };

  const headers = ["FECHA", "CÓDIGO", "PRODUCTO (ACTUAL)", "MOTIVO", "ACCIÓN"];

  return (
    <div className="fade-up">
      <PageHeader
        title="Historial de Ediciones"
        subtitle="Registro de modificaciones y auditoría de cambios en los productos."
      />

      {/* Contenedor de la Tabla */}
      <div style={{ 
        background: colors.surfaceLowest, border: `1px solid ${colors.outlineVariant}`, 
        borderRadius: 10, overflow: "hidden", overflowX: "auto", marginTop: 24
      }}>
        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            Cargando historial de cambios...
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 750 }}>
            <thead>
              <tr style={{ background: colors.surfaceLow }}>
                {headers.map(header => (
                  <th key={header} style={{ 
                    padding: "12px 16px", 
                    textAlign: "left", 
                    fontSize: 11, 
                    fontWeight: 700, 
                    letterSpacing: "0.05em", 
                    color: colors.secondary, 
                    whiteSpace: "nowrap" 
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const rowId = row.id!;
                return (
                  <React.Fragment key={rowId}>
                    <tr className="hover-row" style={{ borderTop: `1px solid ${colors.outlineVariant}` }}>
                      <td style={{ padding: "14px 16px", fontSize: 13 }}>
                        {formatDate(row.modification_date)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: colors.secondary }}>
                        {row.current_product_code ? `${row.current_product_code}` : `ID: ${row.product_id}`}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 500 }}>
                        {row.new_name || row.previous_name || 'Producto Eliminado/Desconocido'}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontStyle: "italic", color: colors.onSurfaceVariant }}>
                        {row.modification_reason}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <button 
                          onClick={() => handleToggleExpand(rowId)}
                          style={{ 
                            background: "none", border: "none", cursor: "pointer", 
                            color: colors.primary, display: "flex", alignItems: "center", gap: 4,
                            fontSize: 13, fontWeight: 600
                          }}
                        >
                          {expandedId === rowId ? "Ocultar" : "Ver cambios"}
                          <Icon name={expandedId === rowId ? "minus" : "plus"} size={18} />
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila Desplegable con la Auditoría Exacta de Atributos */}
                    {expandedId === rowId && (
                      <tr style={{ background: colors.surfaceLowest }}>
                        <td colSpan={headers.length} style={{ padding: "16px 24px", borderTop: `1px solid ${colors.surfaceContainer}` }}>
                          <div style={{ 
                            background: "#fff", border: `1px solid ${colors.outlineVariant}`,
                            borderRadius: 8, overflow: "hidden"
                          }}>
                            <div style={{ 
                              padding: "10px 16px", background: colors.surfaceLow,
                              fontSize: 12, fontWeight: 700, color: colors.secondary,
                              borderBottom: `1px solid ${colors.outlineVariant}`
                            }}>
                              DETALLE DE VALORES MODIFICADOS (ID CAMBIO #{rowId})
                            </div>
                            
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ background: "#fafafa" }}>
                                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, color: colors.secondary, fontWeight: 600 }}>Propiedad</th>
                                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, color: colors.secondary, fontWeight: 600 }}>Valor Anterior</th>
                                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, color: colors.secondary, fontWeight: 600 }}>Valor Nuevo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {renderCambio("Nombre del Producto", row.previous_name, row.new_name)}
                                {renderCambio("Precio de Venta", row.previous_price, row.new_price, true)}
                                {renderCambio("Costo base", row.previous_cost, row.new_cost, true)}
                                {renderCambio("Existencias (Stock)", row.previous_stock, row.new_stock)}
                                
                                {/* Si no hubo cambios detectados en estos campos mapeados */}
                                {row.previous_name === row.new_name && 
                                 row.previous_price === row.new_price && 
                                 row.previous_cost === row.new_cost && 
                                 row.previous_stock === row.new_stock && (
                                  <tr>
                                    <td colSpan={3} style={{ padding: "16px", textAlign: "center", fontSize: 13, color: colors.secondary, fontStyle: "italic" }}>
                                      No se alteraron los valores base (Nombre, Precios o Stock).
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        
        {!loading && items.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            No hay registros en el historial de modificaciones.
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialEdiciones;