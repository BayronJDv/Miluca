import React, { useState, useCallback, useEffect } from 'react';
import PageHeader from '../components/design/PageHeader';
import { Icon } from '../components/design/Icon';
import { obtenerVentas, obtenerFactura, Venta, ItemVenta } from '../db/sales';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAtomValue } from 'jotai';
import { isAdminAtom, userIdAtom, userAtom } from '../store/UserAtom';
import { devolverCliente, obtenerPendienteDevolucionVenta } from '../db/returns';
import { imprimirFactura } from '../print/printer';

const HistorialVentas: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [items, setItems] = useState<Venta[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detallesCache, setDetallesCache] = useState<Record<number, ItemVenta[]>>({});
  const [loadingDetalle, setLoadingDetalle] = useState<number | null>(null);
  const isAdmin = useAtomValue(isAdminAtom);
  const userId = useAtomValue(userIdAtom);
  const currentUser = useAtomValue(userAtom);
  const [printingId, setPrintingId] = useState<number | null>(null);
  const [returnTarget, setReturnTarget] = useState<{ saleId: number; batchId: number; name: string; max: number } | null>(null);
  const [returnQuantity, setReturnQuantity] = useState('');
  const [returnReason, setReturnReason] = useState('Devolución de cliente');

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

  useEffect(() => { cargarVentas(); }, [cargarVentas]);

  const formatPrice = (n: number): string =>
    "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });

  const formatDate = (dateString: string): string => {
    const safeDateString = dateString.includes('T')
      ? dateString
      : dateString.replace(' ', 'T') + 'Z';
    return new Date(safeDateString).toLocaleString('es-CO', {
      timeZone: 'America/Bogota', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleToggleExpand = async (ventaId: number) => {
    if (expandedId === ventaId) { setExpandedId(null); return; }
    setExpandedId(ventaId);
    if (!detallesCache[ventaId]) {
      setLoadingDetalle(ventaId);
      try {
        const factura = await obtenerFactura(ventaId);
        if (factura) setDetallesCache(prev => ({ ...prev, [ventaId]: factura.items }));
      } catch (error) { console.error("Error al cargar detalles de la venta:", error); }
      finally { setLoadingDetalle(null); }
    }
  };

  const handleReprint = async (ventaId: number) => {
    setPrintingId(ventaId);
    try {
      const factura = await obtenerFactura(ventaId);
      if (!factura) { alert('No se encontró la venta a reimprimir.'); return; }
      await imprimirFactura({ factura, cashier: currentUser?.username ?? 'Cajero', isReprint: true });
    } catch (error) {
      console.error('Error al reimprimir ticket:', error);
      alert('No se pudo reimprimir el ticket: ' + error);
    } finally {
      setPrintingId(null);
    }
  };

  const openReturn = async (saleId: number, item: ItemVenta) => {
    if (!item.batch_id) return alert('Este ítem no tiene lote asociado.');
    const max = await obtenerPendienteDevolucionVenta(saleId, item.batch_id);
    if (!max) return alert('La cantidad completa de este lote ya fue devuelta.');
    setReturnTarget({ saleId, batchId: item.batch_id, name: item.product_name, max });
    setReturnQuantity(String(max));
  };

  const submitReturn = async () => {
    if (!returnTarget) return;
    try { await devolverCliente({ sale_id: returnTarget.saleId, batch_id: returnTarget.batchId, quantity: Number(returnQuantity), reason: returnReason, user_id: userId }); setReturnTarget(null); alert('Devolución registrada en el lote original y kardex.'); }
    catch (error) { alert(String(error)); }
  };

  const getTableHeaders = () => {
    const headers = ["ID VENTA", "FECHA", "TOTAL"];
    if (isAdmin) headers.push("GANANCIA");
    headers.push("ACCIÓN");
    return headers;
  };

  return (
    <div className="fade-up">
      <PageHeader title="Historial de Ventas" subtitle="Registro detallado de todas las ventas realizadas." />
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label className="field-label">Rango de Fechas</label>
          <DatePicker selectsRange startDate={startDate} endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable placeholderText="Seleccionar rango..." dateFormat="dd/MM/yyyy"
            showMonthDropdown showYearDropdown scrollableYearDropdown yearDropdownItemNumber={20} dropdownMode="select"
            customInput={<input className="control control--md" />} />
        </div>
      </div>

      <div className="page-card page-card--flush">
        {loading ? (
          <div className="empty-state">Cargando historial de ventas...</div>
        ) : (
          <table className="data-table" style={{ minWidth: 650 }}>
            <thead><tr>
              {getTableHeaders().map(header => (
                <th key={header} className={header === "TOTAL" || header === "GANANCIA" ? 'align-right' : ''}>{header}</th>
              ))}
            </tr></thead>
            <tbody>
              {items.map((row) => (
                <React.Fragment key={row.id}>
                  <tr>
                    <td style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>#{row.id}</td>
                    <td>{formatDate(row.sale_date)}</td>
                    <td style={{ fontWeight: 700 }} className="align-right">{formatPrice(row.total)}</td>
                    {isAdmin && <td className="text-primary align-right" style={{ fontWeight: 700 }}>{formatPrice(row.profit)}</td>}
                    <td>
                      <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                        <button onClick={() => row.id && handleToggleExpand(row.id)} className="btn-link">
                          {expandedId === row.id ? "Ocultar" : "Ver detalle"}
                          <Icon name={expandedId === row.id ? "minus" : "plus"} size={18} />
                        </button>
                        <button onClick={() => row.id && handleReprint(row.id)} className="btn-link" disabled={printingId === row.id}>
                          {printingId === row.id ? 'Imprimiendo...' : 'Imprimir'}
                          <Icon name="download" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="row-detail">
                      <td colSpan={isAdmin ? 5 : 4} style={{ padding: "16px 24px" }}>
                        <div className="page-card page-card--flush" style={{ borderRadius: 8 }}>
                          <div className="page-card-header" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-secondary)' }}>
                            PRODUCTOS DE LA VENTA #{row.id}
                          </div>
                          {loadingDetalle === row.id ? (
                            <div className="empty-state" style={{ fontSize: 13 }}>Cargando detalles...</div>
                          ) : detallesCache[row.id!] ? (
                            <table className="data-table">
                              <thead><tr>
                                <th>Producto</th><th className="align-right">Cantidad</th><th className="align-right">Precio Unit.</th><th className="align-right">Subtotal</th><th className="align-right">Acción</th>
                              </tr></thead>
                              <tbody>
                                {detallesCache[row.id!].map(item => (
                                  <tr key={`${item.product_id}-${item.batch_id ?? item.quantity}`}>
                                    <td>{item.product_name}</td>
                                    <td className="align-right">{item.quantity}</td>
                                    <td className="align-right">{formatPrice(item.price)}</td>
                                    <td className="align-right" style={{ fontWeight: 600 }}>{formatPrice(item.subtotal)}</td>
                                    <td className="align-right"><button onClick={() => openReturn(row.id!, item)} className="btn-mini-solid">Devolver</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="empty-state" style={{ fontSize: 13 }}>No se pudieron cargar los detalles.</div>
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
        {!loading && items.length === 0 && <div className="empty-state">No se encontraron ventas</div>}
      </div>
      {returnTarget && <div className="overlay"><div className="modal"><h3 style={{ marginTop: 0 }}>Devolución de cliente</h3><p className="text-secondary">{returnTarget.name} · máximo pendiente: {returnTarget.max}</p><label className="field" style={{ marginTop: 12 }}>Cantidad<input type="number" min="0.01" max={returnTarget.max} value={returnQuantity} onChange={e => setReturnQuantity(e.target.value)} /></label><label className="field" style={{ marginTop: 12 }}>Motivo<input value={returnReason} onChange={e => setReturnReason(e.target.value)} /></label><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}><button onClick={() => setReturnTarget(null)} className="btn-mini-outline">Cancelar</button><button onClick={submitReturn} className="btn-mini-solid">Confirmar devolución</button></div></div></div>}
    </div>
  );
};

export default HistorialVentas;
