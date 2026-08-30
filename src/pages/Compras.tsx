import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { QtyStepper } from '../components/design/QtyStepper';
import { Input } from '../components/design/Input';
import { Select } from '../components/design/Select';
import { buscarProductosPorNombre, buscarProductosPorCodigo, crearProducto, Producto } from '../db/products';
import { obtenerProveedores, Supplier } from '../db/suppliers';
import { registrarCompra, CompraFactura } from '../db/purchases';
import { mensajeError } from '../db/errors';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './Compras.module.css';

const formatDateValue = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const parseDateValue = (value: string): Date | null => value ? new Date(`${value}T12:00:00`) : null;

interface CartItem {
  id: number; name: string; cost: number; qty: number; product_id: number; code: string;
  lot_number: string; manufacture_date: string; expiration_date: string; requires_lot_control: number;
}

const Compras: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [lastPurchase, setLastPurchase] = useState<CompraFactura | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', code: '', price: '', generic_name: '', category: 'medicamento', requires_lot_control: true, wholesale_price: '', wholesale_min_qty: '' });

  useEffect(() => { obtenerProveedores().then(setSuppliers); }, []);
  const supplierOptions = useMemo(() => suppliers.map(s => ({ value: String(s.id), label: s.name })), [suppliers]);

  const handleSearch = useCallback(async (value: string) => {
    setSearch(value);
    if (value.length >= 2) {
      setLoading(true);
      try {
        setProducts(await buscarProductosPorNombre(value));
      } finally {
        setLoading(false);
      }
    }
    else setProducts([]);
  }, []);

  const handleBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    const product = await buscarProductosPorCodigo(code.trim());
    if (product) addToCart(product);
    else alert('Producto no encontrado. Puede crearlo con el botón "Nuevo Producto".');
  }, []);

  const addToCart = useCallback((product: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) return prev.map(item => item.product_id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { id: product.id!, product_id: product.id!, name: product.name, cost: product.cost, qty: 1, code: product.code, lot_number: product.requires_lot_control ? '' : 'S/N', manufacture_date: '', expiration_date: '', requires_lot_control: product.requires_lot_control ?? 0 }];
    });
  }, []);

  const setQuantity = useCallback((productId: number, newQty: number) => {
    setCart(prev => {
      if (newQty < 1) return prev.filter(i => i.product_id !== productId);
      return prev.map(item => item.product_id === productId ? { ...item, qty: newQty } : item);
    });
  }, []);

  const updateCost = useCallback((productId: number, cost: number) => {
    setCart(prev => prev.map(item => item.product_id === productId ? { ...item, cost: Math.max(0, cost) } : item));
  }, []);

  const removeItem = useCallback((productId: number) => setCart(prev => prev.filter(item => item.product_id !== productId)), []);
  const updateLot = useCallback((productId: number, field: 'lot_number' | 'manufacture_date' | 'expiration_date', value: string) => {
    setCart(prev => prev.map(item => item.product_id === productId ? { ...item, [field]: value } : item));
  }, []);
  const clearCart = useCallback(() => { if (window.confirm('¿Vaciar carrito de compra?')) setCart([]); }, []);
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.cost * item.qty, 0), [cart]);
  const formatPrice = (n: number | null | undefined): string => "$" + (n ?? 0).toLocaleString("es-CO", { minimumFractionDigits: 2 });
  const handleNewProductInput = useCallback((key: string, value: string) => setNewProduct(prev => ({ ...prev, [key]: value })), []);

  const handleCreateProduct = useCallback(async () => {
    const { name, code, price } = newProduct;
    if (!name || !code || !price) { alert('Nombre, código y precio de venta son obligatorios'); return; }
    const priceNum = Number(price.replace(/\D/g, ""));
    if (!priceNum) { alert('El precio debe ser un valor válido'); return; }
    try {
      const product: Producto = { name, code, price: priceNum, cost: 0, stock: 0, generic_name: newProduct.generic_name || null, category: newProduct.category as Producto['category'], requires_lot_control: Number(newProduct.requires_lot_control), wholesale_price: newProduct.wholesale_price ? Number(newProduct.wholesale_price) : null, wholesale_min_qty: newProduct.wholesale_min_qty ? Number(newProduct.wholesale_min_qty) : null };
      await crearProducto(product);
      const created = await buscarProductosPorCodigo(code);
      if (created) addToCart(created);
      setShowNewProduct(false);
      setNewProduct({ name: '', code: '', price: '', generic_name: '', category: 'medicamento', requires_lot_control: true, wholesale_price: '', wholesale_min_qty: '' });
    } catch (error) { console.error('Error al crear producto:', error); alert('Error al crear producto. Puede que el código ya exista.'); }
  }, [newProduct, addToCart]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedSupplier) { alert('Seleccione un proveedor'); return; }
    if (cart.length === 0) { alert('El carrito está vacío'); return; }
    const items = cart.map(item => ({ product_id: item.product_id, quantity: item.qty, cost: item.cost, lot_number: item.lot_number, manufacture_date: item.manufacture_date || null, expiration_date: item.expiration_date || null }));
    try {
      const factura = await registrarCompra(items, Number(selectedSupplier));
      setLastPurchase(factura); setShowReceipt(true); setCart([]); setSelectedSupplier("");
    } catch (error) { console.error('Error al registrar compra:', error); alert(`No se pudo registrar la compra: ${mensajeError(error)}`); }
  }, [cart, selectedSupplier]);

  return (
    <div className={`${styles.root} page-split`}>
      <div className="page-split-left">
        <div className="page-card page-card--pad">
          <div className="section-label">PROVEEDOR</div>
          <Select placeholder="Seleccionar proveedor..." value={selectedSupplier} onChange={setSelectedSupplier} options={supplierOptions} icon="local_shipping" />
        </div>
        <div className={`page-card page-card--pad ${styles.barcodeCard}`}>
          <div className="section-label">ESCANEO DE CÓDIGO DE BARRAS</div>
          <input type="text" placeholder="Escanear o ingresar código de barras..."
            onKeyDown={e => { if (e.key === 'Enter') { handleBarcode((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
            className="control control--xl" />
        </div>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <Icon name="search" size={16} />
            </span>
            <input placeholder="Búsqueda manual por nombre..." value={search} onChange={e => handleSearch(e.target.value)} className={styles.searchInput} />
          </div>
          <button onClick={() => setShowNewProduct(true)} className={`btn-outline ${styles.newProductBtn}`}>
            <Icon name="plus" size={16} />
            Nuevo Producto
          </button>
        </div>
        <div className="result-list">
          <div className="page-card-header">
            <span className={styles.resultsTitle}>Resultados de Búsqueda</span>
            <span className={`text-secondary ${styles.resultsSubtitle}`}>COSTO / STOCK</span>
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
                <div className={`text-primary ${styles.priceValue}`}>{product.cost > 0 ? formatPrice(product.cost) : 'Sin costo registrado'}</div>
                <div className={`text-secondary ${styles.stockLabel}`}>Stock: {product.stock}</div>
              </div>
            </div>
          ))}
          {!loading && products.length === 0 && search.length >= 2 && <div className="empty-state">No se encontraron productos</div>}
        </div>
      </div>

      <div className="page-split-right">
        <div className="page-card-header">
          <div style={{ fontWeight: 700, fontSize: 15 }}>Carrito de Compra</div>
          <button onClick={clearCart} className="btn-icon btn-icon--muted"><Icon name="trash" size={18} /></button>
        </div>
        <div className={styles.cartScroll}>
          {cart.map(item => (
            <div key={item.product_id} className={styles.cartItem}>
              <div className={styles.cartItemTop}>
                <span className={styles.cartItemName}>{item.name}</span>
                <button onClick={() => removeItem(item.product_id)} className="btn-icon btn-icon--muted"><Icon name="close" size={16} /></button>
              </div>
              <div className={styles.cartItemActions}>
                <QtyStepper value={item.qty} onChange={q => setQuantity(item.product_id, q)} />
                <div className={styles.costBox}>
                  <span className={`text-secondary ${styles.costPrefix}`}>$</span>
                  <input type="text" value={item.cost} onChange={e => { const val = Number(e.target.value.replace(/\D/g, "")) || 0; updateCost(item.product_id, val); }} className={styles.costInput} />
                </div>
                <span className={`text-primary ${styles.subtotal}`}>{formatPrice(item.cost * item.qty)}</span>
              </div>
              <div className={styles.lotGrid}>
                <input placeholder={item.requires_lot_control ? 'Lote obligatorio' : 'Lote (S/N)'} value={item.lot_number} onChange={e => updateLot(item.product_id, 'lot_number', e.target.value)} className={styles.lotInput} />
                <DatePicker selected={parseDateValue(item.manufacture_date)} onChange={(date: Date | null) => updateLot(item.product_id, 'manufacture_date', formatDateValue(date))} dateFormat="dd/MM/yyyy" placeholderText="Fabricación" showMonthDropdown showYearDropdown scrollableYearDropdown yearDropdownItemNumber={20} dropdownMode="select" customInput={<input className={styles.dateInput} />} />
                <DatePicker selected={parseDateValue(item.expiration_date)} onChange={(date: Date | null) => updateLot(item.product_id, 'expiration_date', formatDateValue(date))} dateFormat="dd/MM/yyyy" placeholderText="Vencimiento" showMonthDropdown showYearDropdown scrollableYearDropdown yearDropdownItemNumber={20} dropdownMode="select" customInput={<input className={styles.dateInput} />} />
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="empty-state">Carrito vacío</div>}
        </div>
        <div className="cart-footer">
          <div className={styles.cartFooterRow}>
            <span className={`text-secondary ${styles.cartFooterLabel}`}>TOTAL COMPRA</span>
            <span className={styles.cartFooterTotal}>{formatPrice(total)}</span>
          </div>
          <button onClick={handleConfirmPurchase} className={`btn-solid btn-solid--md ${styles.confirmBtn}`}>
            <Icon name="confirm" size={18} color="var(--color-on-primary)" />
            Confirmar Compra
          </button>
        </div>
      </div>

      {showNewProduct && (
        <div className="overlay">
          <div className={`modal ${styles.newProductModal}`}>
            <h3 className={styles.modalTitle}>Nuevo Producto</h3>
            <div className={styles.modalForm}>
              <Input label="Nombre" placeholder="Nombre del producto" value={newProduct.name} onChange={v => handleNewProductInput('name', v)} />
              <Input label="Código de barras" placeholder="Código único" value={newProduct.code} onChange={v => handleNewProductInput('code', v)} />
              <div className={styles.formGrid}>
                <Input label="Precio de venta" placeholder="$0" value={newProduct.price} onChange={v => handleNewProductInput('price', v)} icon="attach_money" />
                <Input label="Nombre genérico" placeholder="Acetaminofén" value={newProduct.generic_name} onChange={v => handleNewProductInput('generic_name', v)} />
              </div>
              <div className={styles.formGrid}>
                <label className={styles.categoryLabel}>Categoría<select value={newProduct.category} onChange={e => handleNewProductInput('category', e.target.value)} className={styles.categorySelect}><option value="medicamento">Medicamento</option><option value="dispositivo_medico">Dispositivo médico</option><option value="cosmetico">Cosmético</option><option value="alimento">Alimento</option><option value="otro">Otro</option></select></label>
                <label className={styles.checkboxLabel}><input type="checkbox" checked={newProduct.requires_lot_control} onChange={e => setNewProduct(prev => ({ ...prev, requires_lot_control: e.target.checked }))} /> Control de lote obligatorio</label>
              </div>
              <div className={`text-secondary ${styles.hint}`}>El costo y el stock se capturan en el lote de esta compra, no en el producto.</div>
              <div className={styles.formGrid}>
                <Input label="Precio mayorista" placeholder="Opcional" value={newProduct.wholesale_price} onChange={v => handleNewProductInput('wholesale_price', v)} />
                <Input label="Cantidad mínima mayorista" placeholder="Ej. 12" value={newProduct.wholesale_min_qty} onChange={v => handleNewProductInput('wholesale_min_qty', v)} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <Btn variant="ghost" onClick={() => { setShowNewProduct(false); setNewProduct({ name: '', code: '', price: '', generic_name: '', category: 'medicamento', requires_lot_control: true, wholesale_price: '', wholesale_min_qty: '' }); }}>Cancelar</Btn>
              <Btn onClick={handleCreateProduct}>Crear y Agregar</Btn>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastPurchase && (
        <div className="overlay overlay--solid">
          <div className="modal--receipt modal">
            <h2 className={styles.invoiceTitle}>resumen de Compra</h2>
            <div className={styles.invoiceSection}>
              <p><strong>Compra #:</strong> {lastPurchase.compra.id}</p>
              <p><strong>Fecha:</strong> {
                new Date(lastPurchase.compra.purchase_date.includes('T')
                  ? lastPurchase.compra.purchase_date
                  : lastPurchase.compra.purchase_date.replace(' ', 'T') + 'Z'
                ).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
              }</p>
              <p><strong>Total:</strong> {formatPrice(lastPurchase.compra.total_cost)}</p>
              <p>Puede ver mas detalles de su compra en el historial</p>
            </div>
            <table className={`data-table ${styles.invoiceTable}`}>
              <thead><tr>
                <th>Producto</th><th className="align-right">Cant.</th><th className="align-right">Costo</th><th className="align-right">Subtotal</th>
              </tr></thead>
              <tbody>
                {lastPurchase.items.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}<div className={`text-secondary ${styles.invoiceLot}`}>{item.lot_number ? `Lote ${item.lot_number}` : ''}{item.expiration_date ? ` · Vence ${item.expiration_date}` : ''}</div></td>
                    <td className="align-right">{item.quantity}</td>
                    <td className="align-right">{formatPrice(item.cost)}</td>
                    <td className="align-right">{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className={styles.invoiceActions}>
              <Btn variant="ghost" onClick={() => { setShowReceipt(false); setLastPurchase(null); }}>Cerrar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;
