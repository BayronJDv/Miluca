import { useEffect, useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import PageHeader from '../components/design/PageHeader';
import { buscarProductosPorNombre, Producto } from '../db/products';
import { obtenerKardexRegulatorio } from '../db/regulatory_reports';
import { formatMesAnio } from '../utils/dates';
import styles from './Kardex.module.css';

type Movement = { movement_date: string; movement_type: string; quantity: number; product_name: string; code: string; lot_number: string; manufacture_date: string | null; expiration_date: string | null; cost: number; reason: string | null };
const toIsoDate = (date: Date | null) => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
const formatMovementDate = (value: string) => {
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  return new Date(normalized).toLocaleString('es-CO', { timeZone: 'America/Bogota', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function Kardex() {
  const [products, setProducts] = useState<Producto[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Producto | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2 || selected) { setProducts([]); return; }
    const timer = window.setTimeout(async () => setProducts(await buscarProductosPorNombre(query.trim())), 250);
    return () => window.clearTimeout(timer);
  }, [query, selected]);

  const load = async () => {
    if (!selected?.id) return;
    setLoading(true);
    try {
      const [from, to] = dateRange;
      setRows(await obtenerKardexRegulatorio(selected.id, from ? toIsoDate(from) : undefined, to ? toIsoDate(to) : undefined) as Movement[]);
    } finally { setLoading(false); }
  };

  const exportCsv = async () => {
    const path = await save({ defaultPath: `kardex_${new Date().toISOString().slice(0, 10)}.csv`, filters: [{ name: 'CSV', extensions: ['csv'] }] });
    if (!path) return;
    const header = 'Fecha,Movimiento,Producto,Código,Lote,Fabricación,Vencimiento,Cantidad,Costo,Motivo';
    const body = rows.map(row => [formatMovementDate(row.movement_date), row.movement_type, row.product_name, row.code, row.lot_number, row.manufacture_date ?? '', row.expiration_date ?? '', row.quantity, row.cost, row.reason ?? ''].map(value => `"${String(value).replace(/"/g, '""')}"`).join(','));
    await invoke('save_csv_file', { path, content: [header, ...body].join('\n') });
  };

  return <div className={styles.root}>
    <PageHeader title="Kardex regulatorio" subtitle="Movimientos inmutables por producto y lote." />
    <div className={`page-card page-card--pad ${styles.filters}`}>
      <label className="field">Producto
        <div className={styles.fieldWrap}>
          <input className={`control ${styles.productInput}`} value={selected ? `${selected.name} · ${selected.code}` : query} placeholder="Buscar producto..." onChange={event => { setSelected(null); setQuery(event.target.value); setShowResults(true); }} onFocus={() => setShowResults(true)} />
          {selected && <button onClick={() => { setSelected(null); setQuery(''); setRows([]); }} className="autocomplete-clear">×</button>}
          {showResults && !selected && products.length > 0 && <div className="autocomplete autocomplete--fixed">{products.map(product => <button key={product.id} onMouseDown={() => { setSelected(product); setQuery(''); setShowResults(false); }} className="autocomplete-item"><strong>{product.name}</strong><span>{product.code} · stock {product.stock}</span></button>)}</div>}
        </div>
      </label>
      <label className="field">Rango de fechas
        <DatePicker selectsRange startDate={dateRange[0]} endDate={dateRange[1]} onChange={(range: [Date | null, Date | null]) => setDateRange(range)} isClearable placeholderText="Seleccionar rango..." dateFormat="dd/MM/yyyy" showMonthDropdown showYearDropdown scrollableYearDropdown yearDropdownItemNumber={20} dropdownMode="select" customInput={<input className="control control--md" />} />
      </label>
      <button onClick={load} disabled={!selected || loading} className={`btn-solid btn-solid--md ${styles.consultBtn}`}>{loading ? 'Consultando...' : 'Consultar'}</button>
      {rows.length > 0 && <button onClick={exportCsv} className="btn-outline">Exportar CSV</button>}
    </div>
    <div className="page-card page-card--flush"><div className={styles.tableWrap}><table className={`data-table ${styles.dataTable}`}><thead><tr>{['FECHA LOCAL','MOVIMIENTO','LOTE','FABRICACIÓN','VENCIMIENTO','CANTIDAD','COSTO','MOTIVO'].map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.movement_date}-${index}`}><td>{formatMovementDate(row.movement_date)}</td><td>{row.movement_type}</td><td>{row.lot_number}</td><td>{formatMesAnio(row.manufacture_date) || '-'}</td><td>{formatMesAnio(row.expiration_date) || '-'}</td><td>{row.quantity}</td><td>${row.cost?.toLocaleString('es-CO')}</td><td>{row.reason || '-'}</td></tr>)}{!rows.length && <tr><td colSpan={8} className="empty-state">{selected ? 'No hay movimientos para los filtros seleccionados.' : 'Busca y selecciona un producto para consultar su kardex.'}</td></tr>}</tbody></table></div></div>
  </div>;
}
