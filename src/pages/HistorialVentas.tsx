import React, { useState, useCallback, useEffect } from 'react';
import PageHeader from '../components/design/PageHeader';
import { colors } from '../components/design/colors';
import { Icon } from '../components/design/Icon';
import { obtenerVentas, obtenerFactura, Venta, ItemVenta } from '../db/sales';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const HistorialVentas: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [items, setItems] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detallesCache, setDetallesCache] = useState<Record<number, ItemVenta[]>>({});
  const [loadingDetalle, setLoadingDetalle] = useState<number | null>(null);

  const cargarVentas = useCallback(async () => {
    setLoading(true);
    try {
      const formatLocal = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const fechaInicioStr = startDate ? formatLocal(startDate) : undefined;
      const fechaFinStr = endDate ? formatLocal(endDate) : undefined;
      
      const response = await obtenerVentas(1, 100, fechaInicioStr, fechaFinStr);
      setItems(response.ventas);
    } catch (error) {
      console.error("Error al cargar ventas:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  const formatPrice = (n: number): string =>
    "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });

  const formatDate = (dateString: string): string => {
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

  const handleToggleExpand = async (ventaId: number) => {
    if (expandedId === ventaId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(ventaId);

    if (!detallesCache[ventaId]) {
      setLoadingDetalle(ventaId);
      try {
        const factura = await obtenerFactura(ventaId);
        if (factura) {
          setDetallesCache(prev => ({
            ...prev,
            [ventaId]: factura.items
          }));
        }
      } catch (error) {
        console.error("Error al cargar detalles de la venta:", error);
      } finally {
        setLoadingDetalle(null);
      }
    }
  };

  return (
    <div className="fade-up">
      <PageHeader
        title="Historial de Ventas"
        subtitle="Registro detallado de todas las ventas realizadas."
      />
      
      {/* Filtros */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
            Rango de Fechas
          </label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable={true}
            placeholderText="Seleccionar rango..."
            dateFormat="dd/MM/yyyy"
            customInput={
              <input 
                style={{
                  height: 42, padding: "0 12px", border: `1px solid ${colors.outlineVariant}`,
                  borderRadius: 8, fontSize: 14, outline: "none", color: colors.onSurface,
                  background: "#fff", width: 240
                }}
              />
            }
          />
        </div>
      </div>

      {/* Tabla de Ventas */}
      <div style={{ 
        background: colors.surfaceLowest, border: `1px solid ${colors.outlineVariant}`, 
        borderRadius: 10, overflow: "hidden", overflowX: "auto" 
      }}>
        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            Cargando historial de ventas...
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 650 }}>
            <thead>
              <tr style={{ background: colors.surfaceLow }}>
                {["ID VENTA", "FECHA", "TOTAL", "GANANCIA", "ACCIÓN"].map(header => (
                  <th key={header} style={{ 
                    padding: "12px 16px", textAlign: header === "TOTAL" || header === "GANANCIA" ? "right" : "left", fontSize: 11, 
                    fontWeight: 700, letterSpacing: "0.05em", color: colors.secondary, 
                    whiteSpace: "nowrap" 
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <React.Fragment key={row.id}>
                  <tr className="hover-row" style={{ borderTop: `1px solid ${colors.outlineVariant}` }}>
                    <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: colors.secondary }}>
                      #{row.id}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 13 }}>
                      {formatDate(row.sale_date)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, textAlign: "right" }}>
                      {formatPrice(row.total)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 700, textAlign: "right", color: colors.primary }}>
                      {formatPrice(row.profit)}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <button 
                        onClick={() => row.id && handleToggleExpand(row.id)}
                        style={{ 
                          background: "none", border: "none", cursor: "pointer", 
                          color: colors.primary, display: "flex", alignItems: "center", gap: 4,
                          fontSize: 13, fontWeight: 600
                        }}
                      >
                        {expandedId === row.id ? "Ocultar" : "Ver detalle"}
                        <Icon name={expandedId === row.id ? "minus" : "plus"} size={18} />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Fila expandida con detalles */}
                  {expandedId === row.id && (
                    <tr style={{ background: colors.surfaceLowest }}>
                      <td colSpan={5} style={{ padding: "16px 24px", borderTop: `1px solid ${colors.surfaceContainer}` }}>
                        <div style={{ 
                          background: "#fff", border: `1px solid ${colors.outlineVariant}`,
                          borderRadius: 8, overflow: "hidden"
                        }}>
                          <div style={{ 
                            padding: "10px 16px", background: colors.surfaceLow,
                            fontSize: 12, fontWeight: 700, color: colors.secondary,
                            borderBottom: `1px solid ${colors.outlineVariant}`
                          }}>
                            PRODUCTOS DE LA VENTA #{row.id}
                          </div>
                          
                          {loadingDetalle === row.id ? (
                            <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: colors.secondary }}>
                              Cargando detalles...
                            </div>
                          ) : detallesCache[row.id!] ? (
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                              <thead>
                                <tr>
                                  <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, color: colors.secondary, fontWeight: 600 }}>Producto</th>
                                  <th style={{ padding: "8px 16px", textAlign: "right", fontSize: 11, color: colors.secondary, fontWeight: 600 }}>Cantidad</th>
                                  <th style={{ padding: "8px 16px", textAlign: "right", fontSize: 11, color: colors.secondary, fontWeight: 600 }}>Precio Unit.</th>
                                  <th style={{ padding: "8px 16px", textAlign: "right", fontSize: 11, color: colors.secondary, fontWeight: 600 }}>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detallesCache[row.id!].map(item => (
                                  <tr key={item.product_id} style={{ borderTop: `1px solid ${colors.surfaceContainer}` }}>
                                    <td style={{ padding: "8px 16px", fontSize: 13 }}>{item.product_name}</td>
                                    <td style={{ padding: "8px 16px", fontSize: 13, textAlign: "right" }}>{item.quantity}</td>
                                    <td style={{ padding: "8px 16px", fontSize: 13, textAlign: "right" }}>{formatPrice(item.price)}</td>
                                    <td style={{ padding: "8px 16px", fontSize: 13, textAlign: "right", fontWeight: 600 }}>{formatPrice(item.subtotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div style={{ padding: "20px", textAlign: "center", fontSize: 13, color: colors.secondary }}>
                              No se pudieron cargar los detalles.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && items.length === 0 && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            No se encontraron ventas
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialVentas;
