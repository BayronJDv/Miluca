import React, { useState, useCallback, useMemo } from 'react';
import { print_thermal_printer, ENCODE, type PrintJobRequest } from 'tauri-plugin-thermal-printer';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { buscarProductosPorNombre, buscarProductosPorCodigo, Producto } from '../db/products';
import { estimarUtilidadVenta, registrarVenta, Factura } from '../db/sales';
import { mensajeError } from '../db/errors';
import { getSelectedPrinter, getBusinessData } from '../db/settings';
import { buildReceiptSections } from '../print/receipt';
import { useAtomValue } from 'jotai';
import { userAtom } from '../store/UserAtom';

interface CartItem {
  id: number; name: string; price: number; qty: number;
  product_id: number; product_stock: number; basePrice: number;
  wholesalePrice: number | null; wholesaleMinQty: number | null;
  priceMode: 'auto' | 'unitario' | 'mayorista';
}

const Pos: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [received, setReceived] = useState<string>("");
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Factura | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastPayment, setLastPayment] = useState<{ received: number; change: number } | null>(null);
  const [printing, setPrinting] = useState(false);
  const currentUser = useAtomValue(userAtom);

  const handleSearch = useCallback(async (value: string) => {
    setSearch(value);
    if (value.length >= 2) { setLoading(true); setProducts(await buscarProductosPorNombre(value)); setLoading(false); }
    else setProducts([]);
  }, []);

  const handleBarcode = useCallback(async (code: string) => {
    const product = await buscarProductosPorCodigo(code);
    if (product) addToCart(product);
    else alert('Producto no encontrado');
  }, []);

  const addToCart = useCallback((product: Producto) => {
    if (product.stock <= 0) { alert('Producto sin stock disponible'); return; }
    const existing = cart.find(item => item.product_id === product.id);
    if (existing && existing.qty + 1 > product.stock) { alert(`Stock insuficiente. Solo hay ${product.stock} unidades disponibles`); return; }
    setCart(prev => {
      const isExisting = prev.some(item => item.product_id === product.id);
      if (isExisting) return prev.map(item => item.product_id === product.id
        ? { ...item, qty: item.qty + 1, price: item.priceMode === 'auto' && item.wholesalePrice && item.wholesaleMinQty && item.qty + 1 >= item.wholesaleMinQty ? item.wholesalePrice : item.priceMode === 'auto' ? item.basePrice : item.price }
        : item);
      return [...prev, { id: product.id!, product_id: product.id!, name: product.name, price: product.price, qty: 1, product_stock: product.stock, basePrice: product.price, wholesalePrice: product.wholesale_price ?? null, wholesaleMinQty: product.wholesale_min_qty ?? null, priceMode: 'auto' }];
    });
  }, [cart]);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    const item = cart.find(i => i.product_id === productId);
    if (!item) return;
    const newQty = item.qty + delta;
    if (delta > 0 && newQty > item.product_stock) { alert(`Stock insuficiente. Solo hay ${item.product_stock}`); return; }
    setCart(prev => {
      if (newQty < 1) return prev.filter(i => i.product_id !== productId);
      return prev.map(i => i.product_id === productId
        ? { ...i, qty: newQty, price: i.priceMode === 'auto' && i.wholesalePrice && i.wholesaleMinQty && newQty >= i.wholesaleMinQty ? i.wholesalePrice : i.priceMode === 'auto' ? i.basePrice : i.price }
        : i);
    });
  }, [cart]);

  const togglePriceMode = useCallback((productId: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id !== productId || !item.wholesalePrice) return item;
      const mode = item.priceMode === 'auto' ? 'mayorista' : item.priceMode === 'mayorista' ? 'unitario' : 'auto';
      const price = mode === 'mayorista' ? item.wholesalePrice : mode === 'unitario' ? item.basePrice : (item.wholesaleMinQty && item.qty >= item.wholesaleMinQty ? item.wholesalePrice : item.basePrice);
      return { ...item, price, priceMode: mode };
    }));
  }, []);

  const removeItem = useCallback((productId: number) => setCart(prev => prev.filter(item => item.product_id !== productId)), []);
  const clearCart = useCallback(() => { if (window.confirm('¿Vaciar carrito?')) { setCart([]); setReceived(""); } }, []);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart]);
  const receivedNumber = useMemo(() => Number(received.replace(/\D/g, "")) || 0, [received]);
  const change = useMemo(() => Math.max(0, receivedNumber - total), [receivedNumber, total]);
  const formatPrice = (n: number): string => "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });

  const handleConfirmSale = useCallback(async () => {
    if (cart.length === 0) { alert('El carrito está vacío'); return; }
    if (receivedNumber < total) { alert(`El valor recibido (${formatPrice(receivedNumber)}) es menor al total (${formatPrice(total)})`); return; }
    const items = cart.map(item => ({ product_id: item.product_id, quantity: item.qty, price: item.price }));
    try {
      const estimate = await estimarUtilidadVenta(items);
      const lossLines = estimate.lines.filter(line => line.profit < 0);
      if (lossLines.length > 0) {
        const grouped = new Map<number, typeof lossLines>();
        for (const line of lossLines) grouped.set(line.product_id, [...(grouped.get(line.product_id) ?? []), line]);
        const details = Array.from(grouped.values()).map(lines => {
          const first = lines[0];
          const lots = lines.map(line => `${line.lot_number} (costo ${formatPrice(line.cost)}, pérdida ${formatPrice(Math.abs(line.profit))})`).join(', ');
          return `- ${first.product_name}: se toman unidades de ${lines.length} lote(s); ${lots}.`;
        }).join('\n');
        alert(`Venta bloqueada: uno o más lotes tienen un costo superior al precio de venta.\n\n${details}\n\nSe aconseja cambiar el precio del producto desde Inventario y volver a intentar la venta.`);
        return;
      }
      const factura = await registrarVenta(items, currentUser?.id ?? null);
      setLastInvoice(factura); setLastPayment({ received: receivedNumber, change }); setShowInvoice(true);
      setCart([]); setReceived("");
    } catch (error) { console.error('Error al registrar venta:', error); alert(`No se pudo procesar la venta: ${mensajeError(error)}`); }
  }, [cart, total, receivedNumber, change]);

  const handlePrint = useCallback(async () => {
    if (!lastInvoice || !lastPayment) return;
    const printer = getSelectedPrinter();
    if (!printer) { alert('No hay una impresora seleccionada. Configúrala en la sección de Configuración.'); return; }
    const business = getBusinessData();
    const sections = buildReceiptSections({ business, factura: lastInvoice, cashier: currentUser?.username ?? 'Cajero', received: lastPayment.received, change: lastPayment.change });
    setPrinting(true);
    try {
      const request: PrintJobRequest = { printer, paper_size: 'Mm80', options: { code_page: 6, encode: ENCODE.WINDOWS_1252, use_gbk: false }, sections };
      await print_thermal_printer(request);
    } catch (error) { console.error('Error al imprimir:', error); alert('Error al imprimir el recibo: ' + error); }
    finally { setPrinting(false); }
  }, [lastInvoice, lastPayment, currentUser]);

  return (
    <div className="fade-up page-split">
      <div className="page-split-left">
        <div className="page-card page-card--pad" style={{ border: '2px dashed var(--color-primary)' }}>
          <div className="section-label">ESCANEO DE CÓDIGO DE BARRAS</div>
          <input type="text" placeholder="Escanear o ingresar código de barras..."
            onKeyDown={e => { if (e.key === 'Enter') { handleBarcode((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
            className="control control--xl" autoFocus />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', display: 'flex' }}>
              <Icon name="search" size={16} />
            </span>
            <input placeholder="Búsqueda manual por nombre..." value={search} onChange={e => handleSearch(e.target.value)}
              style={{ width: '100%', height: 42, paddingLeft: 34, paddingRight: 12, border: '1px solid var(--color-outline-variant)', borderRadius: 8, fontSize: 14, background: '#fff' }} />
          </div>
        </div>
        <div className="result-list">
          <div className="page-card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Resultados de Búsqueda</span>
            <span className="text-secondary" style={{ fontSize: 12, fontWeight: 600 }}>STOCK DISPONIBLE</span>
          </div>
          {loading && <div style={{ padding: 20, textAlign: 'center' }}>Buscando...</div>}
          {products.map(product => (
            <div key={product.id} onClick={() => addToCart(product)} className="result-row">
              <div className="result-thumb"><Icon name="box" size={18} color="var(--color-secondary)" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{product.name}</div>
                <div className="text-secondary" style={{ fontSize: 12 }}>Cód: {product.code}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-primary" style={{ fontSize: 15, fontWeight: 700 }}>{formatPrice(product.price)}</div>
              </div>
            </div>
          ))}
          {!loading && products.length === 0 && search.length >= 2 && <div className="empty-state">No se encontraron productos</div>}
        </div>
      </div>

      <div className="page-split-right">
        <div className="page-card-header">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Carrito de Venta</div>
          <button onClick={clearCart} className="btn-icon btn-icon--muted"><Icon name="trash" size={18} /></button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {cart.map(item => (
            <div key={item.product_id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-surface-container)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, marginRight: 8 }}>{item.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(item.price)}</span>
                  <button onClick={() => removeItem(item.product_id)} className="btn-icon btn-icon--muted"><Icon name="close" size={16} /></button>
                </div>
              </div>
              {item.wholesalePrice && <button onClick={() => togglePriceMode(item.product_id)} className="btn-link" style={{ fontSize: 11, padding: 0 }}>
                {item.priceMode === 'mayorista' ? 'Mayorista' : item.priceMode === 'unitario' ? 'Precio unitario' : 'Precio automático'}
              </button>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stepper">
                  <button onClick={() => updateQuantity(item.product_id, -1)} className="btn-icon" style={{ color: 'var(--color-on-surface)' }}><Icon name="minus" size={16} /></button>
                  <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQuantity(item.product_id, 1)} className="btn-icon" style={{ color: 'var(--color-on-surface)' }}><Icon name="plus" size={16} /></button>
                </div>
                <span className="text-primary" style={{ fontSize: 13, fontWeight: 600 }}>{formatPrice(item.price * item.qty)}</span>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="empty-state">Carrito vacío</div>}
        </div>
        <div className="cart-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="text-secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>TOTAL ACUMULADO</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-on-surface)', letterSpacing: '-0.02em' }}>{formatPrice(total)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <div className="text-secondary" style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>VALOR RECIBIDO</div>
              <div style={{ position: 'relative' }}>
                <span className="text-secondary" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14 }}>$</span>
                <input type="text" value={received} onChange={e => setReceived(e.target.value)}
                  style={{ width: '100%', height: 40, paddingLeft: 24, borderRadius: 8, border: '1px solid var(--color-outline-variant)', fontSize: 15, fontWeight: 700, background: '#fff' }} />
              </div>
            </div>
            <div>
              <div className="text-secondary" style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>CAMBIO</div>
              <div style={{ height: 40, display: 'flex', alignItems: 'center', fontSize: 18, fontWeight: 800, color: change >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                {formatPrice(change)}
              </div>
            </div>
          </div>
          <button onClick={handleConfirmSale} className="btn-solid btn-solid--md" style={{ width: '100%' }}>
            <Icon name="confirm" size={18} color="#fff" />
            Confirmar Venta
          </button>
        </div>
      </div>

      {showInvoice && lastInvoice && (
        <div className="overlay overlay--solid">
          <div className="modal--receipt modal">
            <h2 style={{ marginBottom: 16 }}>Comprobante de Venta</h2>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Factura #:</strong> {lastInvoice.venta.id}</p>
              <p><strong>Fecha:</strong> {new Date(lastInvoice.venta.sale_date).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
              <p><strong>Total:</strong> {formatPrice(lastInvoice.venta.total)}</p>
              <p><strong>Ganancia:</strong> {formatPrice(lastInvoice.venta.profit)}</p>
            </div>
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead><tr>
                <th>Producto</th><th className="align-right">Cant.</th><th className="align-right">Precio</th><th className="align-right">Subtotal</th>
              </tr></thead>
              <tbody>
                {lastInvoice.items.map(item => (
                  <tr key={`${item.product_id}-${item.batch_id ?? item.quantity}`}>
                    <td>{item.product_name}<div className="text-secondary" style={{ fontSize: 10 }}>{item.lot_number ? `Lote ${item.lot_number}` : ''}{item.expiration_date ? ` · Vence ${item.expiration_date}` : ''}</div></td>
                    <td className="align-right">{item.quantity}</td>
                    <td className="align-right">{formatPrice(item.price)}</td>
                    <td className="align-right">{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setShowInvoice(false); setLastInvoice(null); setLastPayment(null); }}>Cerrar</Btn>
              <Btn icon="download" onClick={handlePrint} disabled={printing}>{printing ? 'Imprimiendo...' : 'Imprimir'}</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
