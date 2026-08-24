import React, { useState, useCallback, useEffect } from 'react';
import PageHeader from '../components/design/PageHeader';
import { Icon } from '../components/design/Icon';
import { listarHistorialPorFecha, EditHistoryEntry } from '../db/edit_history';
import styles from './HistorialEdiciones.module.css';

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

  const renderCambio = (
    label: string, 
    prev: string | number | null | undefined, 
    next: string | number | null | undefined, 
    isPrice = false
  ) => {
    const hasChanged = prev !== next;
    if (!hasChanged) return null;

    let colorClass = 'text-on-surface';
    let indicador = "";

    if (typeof prev === 'number' && typeof next === 'number') {
      if (next > prev) {
        colorClass = 'text-delta-up';
        indicador = " ↗";
      } else if (next < prev) {
        colorClass = 'text-delta-down';
        indicador = " ↘";
      }
    }

    return (
      <tr className="data-table">
        <td className={`text-secondary ${styles.labelCell}`}>{label}</td>
        <td className={styles.oldValue}>
          {isPrice ? formatPrice(prev as number) : prev ?? "-"}
        </td>
        <td className={`${colorClass} ${styles.newValue}`}>
          {isPrice ? formatPrice(next as number) : next ?? "-"}
          <span className={styles.indicator}>{indicador}</span>
        </td>
      </tr>
    );
  };

  const headers = ["FECHA", "CÓDIGO", "PRODUCTO (ACTUAL)", "MOTIVO", "ACCIÓN"];

  return (
    <div className={styles.root}>
      <PageHeader
        title="Historial de Ediciones"
        subtitle="Registro de modificaciones y auditoría de cambios en los productos."
      />

      <div className={`page-card page-card--flush ${styles.cardWrapper}`}>
        {loading ? (
          <div className="empty-state">Cargando historial de cambios...</div>
        ) : (
          <table className={`data-table ${styles.tableWide}`}>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const rowId = row.id!;
                return (
                  <React.Fragment key={rowId}>
                    <tr>
                      <td>
                        {formatDate(row.modification_date)}
                      </td>
                      <td className={styles.codeCell}>
                        {row.current_product_code ? `${row.current_product_code}` : `ID: ${row.product_id}`}
                      </td>
                      <td className={styles.productCell}>
                        {row.new_name || row.previous_name || 'Producto Eliminado/Desconocido'}
                      </td>
                      <td className={styles.reasonCell}>
                        {row.modification_reason}
                      </td>
                      <td>
                        <button 
                          onClick={() => handleToggleExpand(rowId)}
                          className="btn-link"
                        >
                          {expandedId === rowId ? "Ocultar" : "Ver cambios"}
                          <Icon name={expandedId === rowId ? "minus" : "plus"} size={18} />
                        </button>
                      </td>
                    </tr>
                    
                    {expandedId === rowId && (
                      <tr className="row-detail">
                        <td colSpan={headers.length} className={styles.detailCell}>
                          <div className={`page-card page-card--flush ${styles.detailCard}`}>
                            <div className={`page-card-header ${styles.detailHeader}`}>
                              DETALLE DE VALORES MODIFICADOS (ID CAMBIO #{rowId})
                            </div>
                            
                            <table className="data-table">
                              <thead>
                                <tr className={styles.detailHeadRow}>
                                  <th className={styles.detailTh}>Propiedad</th>
                                  <th className={styles.detailTh}>Valor Anterior</th>
                                  <th className={styles.detailTh}>Valor Nuevo</th>
                                </tr>
                              </thead>
                              <tbody>
                                {renderCambio("Nombre del Producto", row.previous_name, row.new_name)}
                                {renderCambio("Precio de Venta", row.previous_price, row.new_price, true)}
                                {renderCambio("Costo base", row.previous_cost, row.new_cost, true)}
                                {renderCambio("Existencias (Stock)", row.previous_stock, row.new_stock)}
                                
                                {row.previous_name === row.new_name && 
                                 row.previous_price === row.new_price && 
                                 row.previous_cost === row.new_cost && 
                                 row.previous_stock === row.new_stock && (
                                  <tr>
                                    <td colSpan={3} className={`empty-state ${styles.emptyItalic}`}>
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
          <div className="empty-state">No hay registros en el historial de modificaciones.</div>
        )}
      </div>
    </div>
  );
};

export default HistorialEdiciones;
