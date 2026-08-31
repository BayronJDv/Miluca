import { useEffect, useState } from 'react';
import PageHeader from '../components/design/PageHeader';
import Btn from '../components/design/Btn';
import { buscarProductosPorNombre, Producto } from '../db/products';
import { obtenerLotes, ProductBatch } from '../db/batches';
import { obtenerBajas, registrarBaja, Disposal } from '../db/disposals';
import { userIdAtom } from '../store/UserAtom';
import { useAtomValue } from 'jotai';
import { formatMesAnio } from '../utils/dates';
import styles from './Bajas.module.css';

export default function Bajas() {
  const userId = useAtomValue(userIdAtom);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Producto[]>([]);
  const [product, setProduct] = useState<Producto | null>(null);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [batchId, setBatchId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<'vencido' | 'averiado' | 'retiro_mercado' | 'otro'>('vencido');
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<Disposal[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2 || product) { setProducts([]); return; }
    const timer = window.setTimeout(async () => setProducts(await buscarProductosPorNombre(query)), 250);
    return () => window.clearTimeout(timer);
  }, [query, product]);

  useEffect(() => { obtenerBajas().then(setHistory); }, []);

  useEffect(() => {
    if (product?.id) obtenerLotes(product.id).then(setBatches);
    else setBatches([]);
  }, [product]);

  const submit = async () => {
    if (!batchId || !quantity || Number(quantity) <= 0) return alert('Selecciona un lote y una cantidad válida.');
    try {
      await registrarBaja({ batch_id: Number(batchId), quantity: Number(quantity), reason, notes, user_id: userId });
      setQuantity(''); setNotes(''); setBatchId('');
      setHistory(await obtenerBajas());
      if (product?.id) setBatches(await obtenerLotes(product.id));
    } catch (error) { alert(String(error)); }
  };

  return (
    <div className={styles.root}>
      <PageHeader title="Bajas de inventario" subtitle="Registra y consulta bajas parciales o totales de lotes." />

      <div className={`page-card page-card--pad ${styles.formCard}`}>
        <h3 className={styles.formTitle}>Registrar nueva baja</h3>
        <div className={styles.formGrid}>
          <label className="field">Producto
            <div className={styles.autocompleteWrapper}>
              <input className="control" value={product ? `${product.name} · ${product.code}` : query} placeholder="Buscar producto..."
                onChange={e => { setProduct(null); setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)} />
              {showResults && !product && products.length > 0 && (
                <div className="autocomplete">
                  {products.map(item => (
                    <button key={item.id} onMouseDown={() => { setProduct(item); setQuery(''); setShowResults(false); }} className="autocomplete-item">
                      <strong>{item.name}</strong>
                      <span>{item.code} · stock {item.stock}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </label>
          <label className="field">Lote
            <select className="control" value={batchId} onChange={e => setBatchId(e.target.value)}>
              <option value="">Seleccionar lote...</option>
              {batches.filter(batch => batch.quantity > 0).map(batch => (
                <option key={batch.id} value={batch.id}>{batch.lot_number} · {batch.quantity} disponibles · vence {formatMesAnio(batch.expiration_date) || 'sin fecha'} · ingreso {batch.created_at.slice(0, 10)}</option>
              ))}
            </select>
          </label>
          <label className="field">Cantidad
            <input type="number" min="0.01" step="0.01" className="control" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </label>
          <label className="field">Motivo
            <select className="control" value={reason} onChange={e => setReason(e.target.value as typeof reason)}>
              <option value="vencido">Vencido</option>
              <option value="averiado">Averiado</option>
              <option value="retiro_mercado">Retiro del mercado</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className={`field ${styles.notesField}`}>Notas
            <input className="control" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones de la baja" />
          </label>
        </div>
        <div className={styles.submitRow}>
          <Btn icon="delete" variant="danger" onClick={submit}>Registrar baja</Btn>
        </div>
      </div>

      <div className="page-card page-card--flush">
        <h3 className={styles.historyTitle}>Historial de bajas</h3>
        <div className={styles.tableWrapper}>
          <table className={`data-table min-w-600 ${styles.tableWide}`}>
            <thead>
              <tr>{['FECHA','PRODUCTO','LOTE','CANTIDAD','MOTIVO','NOTAS'].map(header => <th key={header}>{header}</th>)}</tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item.id}>
                  <td>{new Date(item.disposal_date).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                  <td>{item.product_name}</td>
                  <td>{item.lot_number}</td>
                  <td>{item.quantity}</td>
                  <td>{item.reason}</td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))}
              {!history.length && <tr><td colSpan={6} className="empty-state">No hay bajas registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
