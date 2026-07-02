import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { colors } from '../components/design/colors';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { Input } from '../components/design/Input';
import { Select } from '../components/design/Select';
import { buscarProductosPorNombre, buscarProductosPorCodigo, crearProducto, Producto } from '../db/products';
import { obtenerProveedores, Supplier } from '../db/suppliers';
import { registrarCompra, CompraFactura } from '../db/purchases';

interface CartItem {
  id: number;
  name: string;
  cost: number;
  qty: number;
  product_id: number;
  code: string;
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

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    code: '',
    price: '',
    cost: ''
  });

  useEffect(() => {
    obtenerProveedores().then(setSuppliers);
  }, []);

  const supplierOptions = useMemo(() =>
    suppliers.map(s => ({ value: String(s.id), label: s.name })),
    [suppliers]
  );

  const handleSearch = useCallback(async (value: string) => {
    setSearch(value);
    if (value.length >= 2) {
      setLoading(true);
      const results = await buscarProductosPorNombre(value);
      setProducts(results);
      setLoading(false);
    } else {
      setProducts([]);
    }
  }, []);

  const handleBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    const product = await buscarProductosPorCodigo(code.trim());
    if (product) {
      addToCart(product);
    } else {
      alert('Producto no encontrado. Puede crearlo con el botón "Nuevo Producto".');
    }
  }, []);

  const addToCart = useCallback((product: Producto) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id!,
        product_id: product.id!,
        name: product.name,
        cost: product.cost,
        qty: 1,
        code: product.code
      }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart(prev => {
      const newQty = (prev.find(i => i.product_id === productId)?.qty || 0) + delta;
      if (newQty < 1) return prev.filter(i => i.product_id !== productId);
      return prev.map(item =>
        item.product_id === productId
          ? { ...item, qty: newQty }
          : item
      );
    });
  }, []);

  const updateCost = useCallback((productId: number, cost: number) => {
    setCart(prev =>
      prev.map(item =>
        item.product_id === productId
          ? { ...item, cost: Math.max(0, cost) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    if (window.confirm('¿Vaciar carrito de compra?')) {
      setCart([]);
    }
  }, []);

  const total = useMemo(() =>
    cart.reduce((sum, item) => sum + item.cost * item.qty, 0),
    [cart]
  );

  const formatPrice = (n: number): string =>
    "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });

  const handleNewProductInput = useCallback((key: string, value: string) => {
    setNewProduct(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreateProduct = useCallback(async () => {
    const { name, code, price, cost } = newProduct;
    if (!name || !code || !price || !cost) {
      alert('Todos los campos son obligatorios');
      return;
    }
    const priceNum = Number(price.replace(/\D/g, ""));
    const costNum = Number(cost.replace(/\D/g, ""));
    if (!priceNum || !costNum) {
      alert('Precio y costo deben ser valores válidos');
      return;
    }
    try {
      const product: Producto = {
        name,
        code,
        price: priceNum,
        cost: costNum,
        stock: 0
      };
      await crearProducto(product);
      const created = await buscarProductosPorCodigo(code);
      if (created) {
        addToCart(created);
      }
      setShowNewProduct(false);
      setNewProduct({ name: '', code: '', price: '', cost: '' });
    } catch (error) {
      console.error('Error al crear producto:', error);
      alert('Error al crear producto. Puede que el código ya exista.');
    }
  }, [newProduct, addToCart]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedSupplier) {
      alert('Seleccione un proveedor');
      return;
    }
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const items = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.qty,
      cost: item.cost
    }));

    try {
      const factura = await registrarCompra(items, Number(selectedSupplier));
      setLastPurchase(factura);
      setShowReceipt(true);
      setCart([]);
      setSelectedSupplier("");
    } catch (error) {
      console.error('Error al registrar compra:', error);
      alert('Error al procesar la compra');
    }
  }, [cart, selectedSupplier]);

  return (
    <div
      className="fade-up"
      style={{ display: "flex", gap: 16, height: "calc(100vh - 60px - 48px)" }}
    >
      {/* Left Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>

        {/* Supplier Select */}
        <div style={{
          background: colors.surfaceLowest,
          border: `1px solid ${colors.outlineVariant}`,
          borderRadius: 10,
          padding: "16px 20px",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.06em", color: colors.primary,
            marginBottom: 8
          }}>
            PROVEEDOR
          </div>
          <Select
            placeholder="Seleccionar proveedor..."
            value={selectedSupplier}
            onChange={setSelectedSupplier}
            options={supplierOptions}
            icon="local_shipping"
          />
        </div>

        {/* Barcode Scanner */}
        <div style={{
          background: colors.surfaceLowest,
          border: `2px dashed ${colors.primary}`,
          borderRadius: 10,
          padding: "20px 24px",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700,
            letterSpacing: "0.06em", color: colors.primary,
            marginBottom: 6
          }}>
            ESCANEO DE CÓDIGO DE BARRAS
          </div>
          <input
            type="text"
            placeholder="Escanear o ingresar código de barras..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBarcode((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "16px",
              border: `1px solid ${colors.outlineVariant}`,
              borderRadius: 8,
              outline: "none"
            }}
          />
        </div>

        {/* Manual Search + Quick Create */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{
              position: "absolute", left: 10, top: "50%",
              transform: "translateY(-50%)", color: colors.outline,
              display: "flex"
            }}>
              <Icon name="search" size={16} />
            </span>
            <input
              placeholder="Búsqueda manual por nombre..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              style={{
                width: "100%", height: 42, paddingLeft: 34, paddingRight: 12,
                border: `1px solid ${colors.outlineVariant}`, borderRadius: 8,
                fontSize: 14, background: "#fff",
              }}
            />
          </div>
          <button
            onClick={() => setShowNewProduct(true)}
            style={{
              height: 42, padding: "0 16px",
              background: colors.surfaceLowest,
              border: `1px solid ${colors.outlineVariant}`,
              borderRadius: 8, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: colors.secondary,
              whiteSpace: "nowrap"
            }}
          >
            <Icon name="plus" size={16} />
            Nuevo Producto
          </button>
        </div>

        {/* Search Results */}
        <div style={{
          background: colors.surfaceLowest,
          border: `1px solid ${colors.outlineVariant}`,
          borderRadius: 10, flex: 1, overflow: "auto"
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            padding: "14px 20px", borderBottom: `1px solid ${colors.outlineVariant}`
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Resultados de Búsqueda</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.secondary }}>
              COSTO / STOCK
            </span>
          </div>

          {loading && <div style={{ padding: "20px", textAlign: "center" }}>Buscando...</div>}

          {products.map(product => (
            <div
              key={product.id}
              onClick={() => addToCart(product)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 20px", borderBottom: `1px solid ${colors.surfaceContainer}`,
                cursor: "pointer",
              }}
            >
              <div style={{
                width: 38, height: 38, background: colors.surfaceContainer,
                borderRadius: 8, display: "flex", alignItems: "center",
                justifyContent: "center"
              }}>
                <Icon name="box" size={18} color={colors.secondary} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{product.name}</div>
                <div style={{ fontSize: 12, color: colors.secondary }}>Cód: {product.code}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.primary }}>
                  {formatPrice(product.cost)}
                </div>
                <div style={{ fontSize: 11, color: colors.secondary }}>
                  Stock: {product.stock}
                </div>
              </div>
            </div>
          ))}

          {!loading && products.length === 0 && search.length >= 2 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
              No se encontraron productos
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div style={{
        width: 340, display: "flex", flexDirection: "column",
        background: colors.surfaceLowest, border: `1px solid ${colors.outlineVariant}`,
        borderRadius: 10, overflow: "hidden"
      }}>
        {/* Cart Header */}
        <div style={{
          padding: "16px 20px", borderBottom: `1px solid ${colors.outlineVariant}`,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Carrito de Compra</div>
          </div>
          <button
            onClick={clearCart}
            style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline }}
          >
            <Icon name="trash" size={18} />
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
          {cart.map(item => (
            <div key={item.product_id} style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.surfaceContainer}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, marginRight: 8 }}>
                  {item.name}
                </span>
                <button
                  onClick={() => removeItem(item.product_id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline }}
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: colors.surfaceContainer, borderRadius: 8, padding: "2px 6px"
                }}>
                  <button
                    onClick={() => updateQuantity(item.product_id, -1)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: colors.onSurface }}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product_id, 1)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: colors.onSurface }}
                  >
                    <Icon name="plus" size={16} />
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, color: colors.secondary }}>$</span>
                  <input
                    type="text"
                    value={item.cost}
                    onChange={e => {
                      const val = Number(e.target.value.replace(/\D/g, "")) || 0;
                      updateCost(item.product_id, val);
                    }}
                    style={{
                      width: 70, height: 28, padding: "0 6px",
                      border: `1px solid ${colors.outlineVariant}`,
                      borderRadius: 6, fontSize: 13, fontWeight: 600,
                      textAlign: "right", background: "#fff"
                    }}
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary, minWidth: 70, textAlign: "right" }}>
                  {formatPrice(item.cost * item.qty)}
                </span>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
              Carrito vacío
            </div>
          )}
        </div>

        {/* Cart Footer */}
        <div style={{
          padding: "16px 20px", background: colors.surfaceLow,
          borderTop: `1px solid ${colors.outlineVariant}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: colors.secondary }}>
              TOTAL COMPRA
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: colors.onSurface, letterSpacing: "-0.02em" }}>
              {formatPrice(total)}
            </span>
          </div>

          <button
            onClick={handleConfirmPurchase}
            style={{
              width: "100%", height: 48, background: colors.primary, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8,
            }}
          >
            <Icon name="confirm" size={18} color="#fff" />
            Confirmar Compra
          </button>
        </div>
      </div>

      {/* Modal: New Product */}
      {showNewProduct && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, width: 420, maxWidth: "90vw",
            padding: 24
          }}>
            <h3 style={{ marginBottom: 16, fontSize: 18 }}>Nuevo Producto</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Input
                label="Nombre"
                placeholder="Nombre del producto"
                value={newProduct.name}
                onChange={v => handleNewProductInput('name', v)}
              />
              <Input
                label="Código de barras"
                placeholder="Código único"
                value={newProduct.code}
                onChange={v => handleNewProductInput('code', v)}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input
                  label="Precio de venta"
                  placeholder="$0"
                  value={newProduct.price}
                  onChange={v => handleNewProductInput('price', v)}
                  icon="attach_money"
                />
                <Input
                  label="Costo"
                  placeholder="$0"
                  value={newProduct.cost}
                  onChange={v => handleNewProductInput('cost', v)}
                  icon="attach_money"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              <Btn variant="ghost" onClick={() => {
                setShowNewProduct(false);
                setNewProduct({ name: '', code: '', price: '', cost: '' });
              }}>
                Cancelar
              </Btn>
              <Btn onClick={handleCreateProduct}>
                Crear y Agregar
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Receipt */}
      {showReceipt && lastPurchase && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, width: 500, maxWidth: "90vw",
            maxHeight: "80vh", overflow: "auto", padding: 24
          }}>
            <h2 style={{ marginBottom: 16 }}>Comprobante de Compra</h2>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Compra #:</strong> {lastPurchase.compra.id}</p>
              <p><strong>Fecha:</strong> {
                new Date(lastPurchase.compra.purchase_date.includes('T') 
                  ? lastPurchase.compra.purchase_date 
                  : lastPurchase.compra.purchase_date.replace(' ', 'T') + 'Z'
                ).toLocaleString('es-CO', { timeZone: 'America/Bogota' })
              }</p>
              <p><strong>Total:</strong> {formatPrice(lastPurchase.compra.total_cost)}</p>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ textAlign: "left", padding: 8 }}>Producto</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Cant.</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Costo</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lastPurchase.items.map(item => (
                  <tr key={item.product_id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 8 }}>{item.product_name}</td>
                    <td style={{ textAlign: "right", padding: 8 }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: 8 }}>{formatPrice(item.cost)}</td>
                    <td style={{ textAlign: "right", padding: 8 }}>{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: "bold" }}>
                  <td colSpan={3} style={{ textAlign: "right", padding: 8 }}>Total:</td>
                  <td style={{ textAlign: "right", padding: 8 }}>{formatPrice(lastPurchase.compra.total_cost)}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => {
                setShowReceipt(false);
                setLastPurchase(null);
              }}>
                Cerrar
              </Btn>
              <Btn onClick={() => { window.print(); }}>
                Imprimir
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;
