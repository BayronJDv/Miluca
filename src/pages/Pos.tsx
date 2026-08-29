import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { QtyStepper } from '../components/design/QtyStepper';
import { Select } from '../components/design/Select';
import { Input } from '../components/design/Input';
import { buscarProductosPorNombre, buscarProductosPorCodigo, Producto } from '../db/products';
import { estimarUtilidadVenta, registrarVenta, Factura } from '../db/sales';
import { obtenerClientes, crearCliente, Customer } from '../db/customers';
import { mensajeError } from '../db/errors';
import { imprimirFactura } from '../print/printer';
import { useAtomValue } from 'jotai';
import { userAtom } from '../store/UserAtom';
import styles from './Pos.module.css';

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', contact_info: '', nit: '', address: '', email: '' });
  const currentUser = useAtomValue(userAtom);

  useEffect(() => {
    obtenerClientes().then(list => {
      setCustomers(list);
      const generico = list.find(c => c.name.toLowerCase() === 'generico');
      setSelectedCustomer(generico?.id != null ? String(generico.id) : (list[0]?.id != null ? String(list[0].id) : ""));
    });
  }, []);

  const customerOptions = useMemo(() => customers.map(c => ({ value: String(c.id), label: c.name })), [customers]);

  const handleNewCustomerInput = useCallback((key: keyof typeof newCustomer, value: string) => {
    setNewCustomer(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreateCustomer = useCallback(async () => {
    if (!newCustomer.name.trim()) { alert('Por favor ingrese el nombre del cliente'); return; }
    try {
      const id = await crearCliente({
        name: newCustomer.name.trim(),
        contact_info: newCustomer.contact_info.trim() || null,
        nit: newCustomer.nit.trim() || null,
        address: newCustomer.address.trim() || null,
        email: newCustomer.email.trim() || null,
      });
      const list = await obtenerClientes();
      setCustomers(list);
      setSelectedCustomer(String(id));
      setShowNewCustomer(false);
      setNewCustomer({ name: '', contact_info: '', nit: '', address: '', email: '' });
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('No se pudo crear el cliente: ' + error);
    }
  }, [newCustomer]);

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

  const setQuantity = useCallback((productId: number, newQty: number) => {
    const item = cart.find(i => i.product_id === productId);
    if (!item || newQty === item.qty) return;
    if (newQty > item.product_stock) { alert(`Stock insuficiente. Solo hay ${item.product_stock}`); return; }
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
      const factura = await registrarVenta(items, currentUser?.id ?? null, selectedCustomer ? Number(selectedCustomer) : null);
      setLastInvoice(factura); setLastPayment({ received: receivedNumber, change }); setShowInvoice(true);
      setCart([]); setReceived("");
    } catch (error) { console.error('Error al registrar venta:', error); alert(`No se pudo procesar la venta: ${mensajeError(error)}`); }
  }, [cart, total, receivedNumber, change, selectedCustomer]);

  const handlePrint = useCallback(async () => {
    if (!lastInvoice || !lastPayment) return;
    setPrinting(true);
    await imprimirFactura({ factura: lastInvoice, cashier: currentUser?.username ?? 'Cajero', received: lastPayment.received, change: lastPayment.change });
    setPrinting(false);
  }, [lastInvoice, lastPayment, currentUser]);

  return (
    <div className={`${styles.root} page-split`}>
      <div className="page-split-left">
        <div className={`page-card page-card--pad ${styles.barcodeCard}`}>
          <div className="section-label">ESCANEO DE CÓDIGO DE BARRAS</div>
          <input type="text" placeholder="Escanear o ingresar código de barras..."
            onKeyDown={e => { if (e.key === 'Enter') { handleBarcode((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
            className="control control--xl" autoFocus />
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <Icon name="search" size={16} />
            </span>
            <input placeholder="Búsqueda manual por nombre..." value={search} onChange={e => handleSearch(e.target.value)} className={styles.searchInput} />
          </div>
        </div>
        <div className="result-list">
          <div className="page-card-header">
            <span className={styles.resultsTitle}>Resultados de Búsqueda</span>
            <span className={`text-secondary ${styles.resultsSubtitle}`}>STOCK DISPONIBLE</span>
          </div>
          {loading && <div className={styles.loadingBox}>Buscando...</div>}
          {products.map(product => (
            <div key={product.id} onClick={() => addToCart(product)} className="result-row">
              <div className="result-thumb"><Icon name="box" size={18} color="var(--color-secondary)" /></div>
              <div className={styles.productInfo}>
                <div className={styles.productName}>{product.name}</div>
                <div className={`text-secondary ${styles.productCode}`}>Cód: {product.code}</div>
              </div>
              <div className={styles.priceRight}>
                <div className={`text-primary ${styles.priceValue}`}>{formatPrice(product.price)}</div>
              </div>
            </div>
          ))}
          {!loading && products.length === 0 && search.length >= 2 && <div className="empty-state">No se encontraron productos</div>}
        </div>
      </div>

      <div className="page-split-right">
        <div className="page-card page-card--pad">
          <div className={`section-label ${styles.customerHeader}`}>CLIENTE
            <button onClick={() => setShowNewCustomer(true)} className={`btn-outline ${styles.newCustomerBtn}`}>
              <Icon name="plus" size={16} />
              Nuevo Cliente
            </button>
          </div>
          <Select placeholder="Seleccionar cliente..." value={selectedCustomer} onChange={setSelectedCustomer} options={customerOptions} icon="person" />
        </div>
        <div className="page-card-header">
          <div className={styles.cartHeader}>Carrito de Venta</div>
          <button onClick={clearCart} className="btn-icon btn-icon--muted"><Icon name="trash" size={18} /></button>
        </div>
        <div className={styles.cartScroll}>
          {cart.map(item => (
            <div key={item.product_id} className={styles.cartItem}>
              <div className={styles.cartItemTop}>
                <span className={styles.cartItemName}>{item.name}</span>
                <div className={styles.cartItemPriceBox}>
                  <span className={styles.cartItemPrice}>{formatPrice(item.price)}</span>
                  <button onClick={() => removeItem(item.product_id)} className="btn-icon btn-icon--muted"><Icon name="close" size={16} /></button>
                </div>
              </div>
              {item.wholesalePrice && <button onClick={() => togglePriceMode(item.product_id)} className={`btn-link ${styles.wholesaleBtn}`}>
                {item.priceMode === 'mayorista' ? 'Mayorista' : item.priceMode === 'unitario' ? 'Precio unitario' : 'Precio automático'}
              </button>}
              <div className={styles.cartItemBottom}>
                <QtyStepper value={item.qty} onChange={q => setQuantity(item.product_id, q)} />
                <span className={`text-primary ${styles.cartSubtotal}`}>{formatPrice(item.price * item.qty)}</span>
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="empty-state">Carrito vacío</div>}
        </div>
        <div className="cart-footer">
          <div className={styles.footerRow}>
            <span className={`text-secondary ${styles.footerLabel}`}>TOTAL ACUMULADO</span>
            <span className={styles.footerTotal}>{formatPrice(total)}</span>
          </div>
          <div className={styles.receiveGrid}>
            <div>
              <div className={`text-secondary ${styles.receiveLabel}`}>VALOR RECIBIDO</div>
              <div className={styles.receiveWrapper}>
                <span className={`text-secondary ${styles.receivePrefix}`}>$</span>
                <input type="text" value={received} onChange={e => setReceived(e.target.value)} className={styles.receiveInput} />
              </div>
            </div>
            <div>
              <div className={`text-secondary ${styles.receiveLabel}`}>CAMBIO</div>
              <div className={`${styles.changeBox} ${change >= 0 ? styles.changeSuccess : styles.changeError}`}>
                {formatPrice(change)}
              </div>
            </div>
          </div>
          <button onClick={handleConfirmSale} className={`btn-solid btn-solid--md ${styles.fullBtn}`}>
            <Icon name="confirm" size={18} color="var(--color-on-primary)" />
            Confirmar Venta
          </button>
        </div>
      </div>

      {showInvoice && lastInvoice && (
        <div className="overlay overlay--solid">
          <div className="modal--receipt modal">
            <h2 className={styles.invoiceTitle}>Comprobante de Venta</h2>
            <div className={styles.invoiceSection}>
              <p><strong>Factura #:</strong> {lastInvoice.venta.id}</p>
              <p><strong>Fecha:</strong> {new Date(lastInvoice.venta.sale_date.includes('T') ? lastInvoice.venta.sale_date : lastInvoice.venta.sale_date.replace(' ', 'T') + 'Z').toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</p>
              <p><strong>Cliente:</strong> {lastInvoice.venta.customer_name ?? 'Generico'}</p>
              <p><strong>Total:</strong> {formatPrice(lastInvoice.venta.total)}</p>
              <p><strong>Ganancia:</strong> {formatPrice(lastInvoice.venta.profit)}</p>
            </div>
            <table className={`data-table ${styles.invoiceTable}`}>
              <thead><tr>
                <th>Producto</th><th className="align-right">Cant.</th><th className="align-right">Precio</th><th className="align-right">Subtotal</th>
              </tr></thead>
              <tbody>
                {lastInvoice.items.map(item => (
                  <tr key={`${item.product_id}-${item.batch_id ?? item.quantity}`}>
                    <td>{item.product_name}<div className={`text-secondary ${styles.invoiceLot}`}>{item.lot_number ? `Lote ${item.lot_number}` : ''}{item.expiration_date ? ` · Vence ${item.expiration_date}` : ''}</div></td>
                    <td className="align-right">{item.quantity}</td>
                    <td className="align-right">{formatPrice(item.price)}</td>
                    <td className="align-right">{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.invoiceActions}>
              <Btn variant="ghost" onClick={() => { setShowInvoice(false); setLastInvoice(null); setLastPayment(null); }}>Cerrar</Btn>
              <Btn icon="download" onClick={handlePrint} disabled={printing}>{printing ? 'Imprimiendo...' : 'Imprimir'}</Btn>
            </div>
          </div>
        </div>
      )}

      {showNewCustomer && (
        <div className="overlay">
          <div className={`modal ${styles.newCustomerModal}`}>
            <h3 className={styles.modalTitle}>Nuevo Cliente</h3>
            <div className={styles.newCustomerForm}>
              <Input label="Nombre" placeholder="Nombre del cliente" value={newCustomer.name} onChange={v => handleNewCustomerInput('name', v)} />
              <Input label="Teléfono de contacto" placeholder="Ej. 3001234567" value={newCustomer.contact_info} onChange={v => handleNewCustomerInput('contact_info', v)} />
              <Input label="NIT / Cédula" placeholder="Ej. 1234567890" value={newCustomer.nit} onChange={v => handleNewCustomerInput('nit', v)} />
              <Input label="Email" placeholder="Ej. cliente@correo.com" value={newCustomer.email} onChange={v => handleNewCustomerInput('email', v)} />
              <Input label="Dirección" placeholder="Ej. Calle 123 #45-67" value={newCustomer.address} onChange={v => handleNewCustomerInput('address', v)} />
            </div>
            <div className={styles.invoiceActions}>
              <Btn variant="ghost" onClick={() => { setShowNewCustomer(false); setNewCustomer({ name: '', contact_info: '', nit: '', address: '', email: '' }); }}>Cancelar</Btn>
              <Btn onClick={handleCreateCustomer}>Crear y Seleccionar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;
