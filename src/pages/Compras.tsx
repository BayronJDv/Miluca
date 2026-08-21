import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { Input } from '../components/design/Input';
import { Select } from '../components/design/Select';
import { buscarProductosPorNombre, buscarProductosPorCodigo, crearProducto, Producto } from '../db/products';
import { obtenerProveedores, Supplier } from '../db/suppliers';
import { registrarCompra, CompraFactura } from '../db/purchases';
import { mensajeError } from '../db/errors';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
    if (value.length >= 2) { setLoading(true); setProducts(await buscarProductosPorNombre(value)); setLoading(false); }
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

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart(prev => {
      const newQty = (prev.find(i => i.product_id === productId)?.qty || 0) + delta;
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
    <div className="fade-up page-split">
      <div className="page-split-left">
        <div className="page-card page-card--pad">
          <div className="section-label">PROVEEDOR</div>
          <Select placeholder="Seleccionar proveedor..." value={selectedSupplier} onChange={setSelectedSupplier} options={supplierOptions} icon="local_shipping" />
        </div>
        <div className="page-card page-card--pad" style={{ border: '2px dashed var(--color-primary)' }}>
          <div className="section-label">ESCANEO DE CÓDIGO DE BARRAS</div>
          <input type="text" placeholder="Escanear o ingresar código de barras..."
            onKeyDown={e => { if (e.key === 'Enter') { handleBarcode((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = ''; } }}
            className="control control--xl" />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-outline)', display: 'flex' }}>
              <Icon name="search" size={16} />
            </span>
            <input placeholder="Búsqueda manual por nombre..." value={search} onChange={e => handleSearch(e.target.value)}
              style={{ width: '100%', height: 42, paddingLeft: 34, paddingRight: 12, border: '1px solid var(--color-outline-variant)', borderRadius: 8, fontSize: 14, background: '#fff' }} />
          </div>
          <button onClick={() => setShowNewProduct(true)} className="btn-outline" style={{ height: 42, padding: '0 16px', fontSize: 12, whiteSpace: 'nowrap' }}>
            <Icon name="plus" size={16} />
            Nuevo Producto
          </button>
        </div>
        <div className="result-list">
          <div className="page-card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Resultados de Búsqueda</span>
            <span className="text-secondary" style={{ fontSize: 12, fontWeight: 600 }}>COSTO / STOCK</span>
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
                <div className="text-primary" style={{ fontSize: 15, fontWeight: 700 }}>{product.cost > 0 ? formatPrice(product.cost) : 'Sin costo registrado'}</div>
                <div className="text-secondary" style={{ fontSize: 11 }}>Stock: {product.stock}</div>
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
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {cart.map(item => (
            <div key={item.product_id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-surface-container)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, marginRight: 8 }}>{item.name}</span>
                <button onClick={() => removeItem(item.product_id)} className="btn-icon btn-icon--muted"><Icon name="close" size={16} /></button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div className="stepper">
                  <button onClick={() => updateQuantity(item.product_id, -1)} className="btn-icon" style={{ color: 'var(--color-on-surface)' }}><Icon name="minus" size={16} /></button>
                  <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQuantity(item.product_id, 1)} className="btn-icon" style={{ color: 'var(--color-on-surface)' }}><Icon name="plus" size={16} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="text-secondary" style={{ fontSize: 11 }}>$</span>
                  <input type="text" value={item.cost} onChange={e => { const val = Number(e.target.value.replace(/\D/g, "")) || 0; updateCost(item.product_id, val); }}
                    style={{ width: 70, height: 28, padding: '0 6px', border: '1px solid var(--color-outline-variant)', borderRadius: 6, fontSize: 13, fontWeight: 600, textAlign: 'right', background: '#fff' }} />
                </div>
                <span className="text-primary" style={{ fontSize: 13, fontWeight: 600, minWidth: 70, textAlign: 'right' }}>{formatPrice(item.cost * item.qty)}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 8 }}>
                <input placeholder={item.requires_lot_control ? 'Lote obligatorio' : 'Lote (S/N)'} value={item.lot_number} onChange={e => updateLot(item.product_id, 'lot_number', e.target.value)} style={{ minWidth: 0, padding: 5, border: '1px solid var(--color-outline-variant)', borderRadius: 5, fontSize: 11 }} />
                <DatePicker selected={parseDateValue(item.manufacture_date)} onChange={(date: Date | null) => updateLot(item.product_id, 'manufacture_date', formatDateValue(date))} dateFormat="dd/MM/yyyy" placeholderText="Fabricación" showMonthDropdown showYearDropdown scrollableYearDropdown yearDropdownItemNumber={20} dropdownMode="select" customInput={<input style={{ minWidth: 0, width: '100%', boxSizing: 'border-box', padding: 5, border: '1px solid var(--color-outline-variant)', borderRadius: 5, fontSize: 11 }} />} />
                <DatePicker selected={parseDateValue(item.expiration_date)} onChange={(date: Date | null) => updateLot(item.product_id, 'expiration_date', formatDateValue(date))} dateFormat="dd/MM/yyyy" placeholderText="Vencimiento" showMonthDropdown showYearDropdown scrollableYearDropdown yearDropdownItemNumber={20} dropdownMode="select" customInput={<input style={{ minWidth: 0, width: '100%', boxSizing: 'border-box', padding: 5, border: '1px solid var(--color-outline-variant)', borderRadius: 5, fontSize: 11 }} />} />
              </div>
            </div>
          ))}
          {cart.length === 0 && <div className="empty-state">Carrito vacío</div>}
        </div>
        <div className="cart-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span className="text-secondary" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>TOTAL COMPRA</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-on-surface)', letterSpacing: '-0.02em' }}>{formatPrice(total)}</span>
          </div>
          <button onClick={handleConfirmPurchase} className="btn-solid btn-solid--md" style={{ width: '100%' }}>
            <Icon name="confirm" size={18} color="#fff" />
            Confirmar Compra
          </button>
        </div>
      </div>

      {showNewProduct && (
        <div className="overlay overlay--solid">
          <div className="modal">
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>Nuevo Producto</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Nombre" placeholder="Nombre del producto" value={newProduct.name} onChange={v => handleNewProductInput('name', v)} />
              <Input label="Código de barras" placeholder="Código único" value={newProduct.code} onChange={v => handleNewProductInput('code', v)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Precio de venta" placeholder="$0" value={newProduct.price} onChange={v => handleNewProductInput('price', v)} icon="attach_money" />
                <Input label="Nombre genérico" placeholder="Acetaminofén" value={newProduct.generic_name} onChange={v => handleNewProductInput('generic_name', v)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ fontSize: 12 }}>Categoría<select value={newProduct.category} onChange={e => handleNewProductInput('category', e.target.value)} style={{ width: '100%', height: 38, marginTop: 5 }}><option value="medicamento">Medicamento</option><option value="dispositivo_medico">Dispositivo médico</option><option value="cosmetico">Cosmético</option><option value="alimento">Alimento</option><option value="otro">Otro</option></select></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, marginTop: 20 }}><input type="checkbox" checked={newProduct.requires_lot_control} onChange={e => setNewProduct(prev => ({ ...prev, requires_lot_control: e.target.checked }))} /> Control de lote obligatorio</label>
              </div>
              <div className="text-secondary" style={{ fontSize: 11 }}>El costo y el stock se capturan en el lote de esta compra, no en el producto.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Precio mayorista" placeholder="Opcional" value={newProduct.wholesale_price} onChange={v => handleNewProductInput('wholesale_price', v)} />
                <Input label="Cantidad mínima mayorista" placeholder="Ej. 12" value={newProduct.wholesale_min_qty} onChange={v => handleNewProductInput('wholesale_min_qty', v)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
              <Btn variant="ghost" onClick={() => { setShowNewProduct(false); setNewProduct({ name: '', code: '', price: '', generic_name: '', category: 'medicamento', requires_lot_control: true, wholesale_price: '', wholesale_min_qty: '' }); }}>Cancelar</Btn>
              <Btn onClick={handleCreateProduct}>Crear y Agregar</Btn>
            </div>
          </div>
        </div>
      )}

      {showReceipt && lastPurchase && (
        <div className="overlay overlay--solid">
          <div className="modal--receipt modal">
            <h2 style={{ marginBottom: 16 }}>resumen de Compra</h2>
            <div style={{ marginBottom: 16 }}>
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
            <table className="data-table" style={{ marginBottom: 16 }}>
              <thead><tr>
                <th>Producto</th><th className="align-right">Cant.</th><th className="align-right">Costo</th><th className="align-right">Subtotal</th>
              </tr></thead>
              <tbody>
                {lastPurchase.items.map(item => (
                  <tr key={item.product_id}>
                    <td>{item.product_name}<div className="text-secondary" style={{ fontSize: 10 }}>{item.lot_number ? `Lote ${item.lot_number}` : ''}{item.expiration_date ? ` · Vence ${item.expiration_date}` : ''}</div></td>
                    <td className="align-right">{item.quantity}</td>
                    <td className="align-right">{formatPrice(item.cost)}</td>
                    <td className="align-right">{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => { setShowReceipt(false); setLastPurchase(null); }}>Cerrar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;
