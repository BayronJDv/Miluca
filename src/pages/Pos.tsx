import React, { useState, useCallback, useMemo } from 'react';
import { colors } from '../components/design/colors';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';
import { buscarProductosPorNombre, buscarProductosPorCodigo, Producto } from '../db/products';
import { registrarVenta, Factura } from '../db/sales';

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  product_id: number;
}

const Pos: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [received, setReceived] = useState<string>("");
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Factura | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);

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
    const product = await buscarProductosPorCodigo(code);
    if (product) {
      addToCart(product);
    } else {
      alert('Producto no encontrado');
    }
  }, []);

  const addToCart = useCallback((product: Producto) => {
    if (product.stock <= 0) {
      alert('Producto sin stock disponible');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
          alert(`Stock insuficiente. Solo hay ${product.stock} unidades`);
          return prev;
        }
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
        price: product.price,
        qty: 1
      }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.product_id === productId);
      if (item) {
        const newQty = item.qty + delta;
        if (newQty < 1) return prev.filter(i => i.product_id !== productId);
        if (delta > 0) {
          const product = products.find(p => p.id === productId);
          if (product && newQty > product.stock) {
            alert(`Stock insuficiente. Máximo ${product.stock}`);
            return prev;
          }
        }
      }
      return prev.map(item =>
        item.product_id === productId
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      );
    });
  }, [products]);

  const removeItem = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    if (window.confirm('¿Vaciar carrito?')) {
      setCart([]);
      setReceived("");
    }
  }, []);

  const total = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart]
  );

  const receivedNumber = useMemo(() => 
    Number(received.replace(/\D/g, "")) || 0,
    [received]
  );

  const change = useMemo(() => 
    Math.max(0, receivedNumber - total),
    [receivedNumber, total]
  );

  const formatPrice = (n: number): string => 
    "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });

  const handleConfirmSale = useCallback(async () => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    
    if (receivedNumber < total) {
      alert(`El valor recibido (${formatPrice(receivedNumber)}) es menor al total (${formatPrice(total)})`);
      return;
    }
    
    const items = cart.map(item => ({
      product_id: item.product_id,
      quantity: item.qty,
      price: item.price
    }));
    
    try {
      console.log('Registrando venta con items:');
      const factura = await registrarVenta(items);
      console.log('terminadisima venta con items:');
      setLastInvoice(factura);
      setShowInvoice(true);
      
      setCart([]);
      setReceived("");
      
      console.log('Venta registrada:', factura);
    } catch (error) {
      console.error('Error al registrar venta:', error);
      alert('Error al procesar la venta');
    }
  }, [cart, total, receivedNumber]);

  return (
    <div 
      className="fade-up" 
      style={{ display: "flex", gap: 16, height: "calc(100vh - 60px - 48px)" }}
    >
      {/* Left Panel - Mismo diseño visual que tenías */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
        
        {/* Barcode Scanner - Ahora funcional */}
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
            autoFocus
          />
        </div>

        {/* Manual Search */}
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
              STOCK DISPONIBLE
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
                  {formatPrice(product.price)}
                </div>
                <div style={{ fontSize: 11, color: product.stock < (product.min_stock || 2) ? colors.red : colors.secondary }}>
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

      {/* Right Panel: Cart - Mismo diseño pero con datos reales */}
      <div style={{ 
        width: 320, display: "flex", flexDirection: "column", 
        background: colors.surfaceLowest, border: `1px solid ${colors.outlineVariant}`, 
        borderRadius: 10, overflow: "hidden" 
      }}>
        {/* Cart Header */}
        <div style={{ 
          padding: "16px 20px", borderBottom: `1px solid ${colors.outlineVariant}`, 
          display: "flex", justifyContent: "space-between", alignItems: "center" 
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Carrito de Venta</div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(item.price)}</span>
                  <button 
                    onClick={() => removeItem(item.product_id)} 
                    style={{ background: "none", border: "none", cursor: "pointer", color: colors.outline }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary }}>
                  {formatPrice(item.price * item.qty)}
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

        {/* Cart Footer con total y confirmación */}
        <div style={{ 
          padding: "16px 20px", background: colors.surfaceLow, 
          borderTop: `1px solid ${colors.outlineVariant}` 
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: colors.secondary }}>
              TOTAL ACUMULADO
            </span>
            <span style={{ fontSize: 22, fontWeight: 800, color: colors.onSurface, letterSpacing: "-0.02em" }}>
              {formatPrice(total)}
            </span>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.secondary, marginBottom: 4 }}>
                VALOR RECIBIDO
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ 
                  position: "absolute", left: 10, top: "50%", 
                  transform: "translateY(-50%)", color: colors.secondary, fontSize: 14 
                }}>
                  $
                </span>
                <input
                  type="text"
                  value={received} 
                  onChange={e => setReceived(e.target.value)}
                  style={{ 
                    width: "100%", height: 40, paddingLeft: 24, borderRadius: 8, 
                    border: `1px solid ${colors.outlineVariant}`, fontSize: 15, 
                    fontWeight: 700, background: "#fff" 
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.secondary, marginBottom: 4 }}>
                CAMBIO
              </div>
              <div style={{ 
                height: 40, display: "flex", alignItems: "center", 
                fontSize: 18, fontWeight: 800, 
                color: change >= 0 ? colors.green : colors.error 
              }}>
                {formatPrice(change)}
              </div>
            </div>
          </div>
          
          <button 
            onClick={handleConfirmSale}
            style={{
              width: "100%", height: 48, background: colors.primary, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, 
              cursor: "pointer", display: "flex", alignItems: "center", 
              justifyContent: "center", gap: 8,
            }}
          >
            <Icon name="confirm" size={18} color="#fff" />
            Confirmar Venta
          </button>
        </div>
      </div>

      {/* Modal de Factura/Comprobante */}
      {showInvoice && lastInvoice && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff", borderRadius: 12, width: 500, maxWidth: "90vw",
            maxHeight: "80vh", overflow: "auto", padding: 24
          }}>
            <h2 style={{ marginBottom: 16 }}>Comprobante de Venta</h2>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Factura #:</strong> {lastInvoice.venta.id}</p>
              <p><strong>Fecha:</strong> {new Date(lastInvoice.venta.sale_date).toLocaleString()}</p>
              <p><strong>Total:</strong> {formatPrice(lastInvoice.venta.total)}</p>
            </div>
            
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #ddd" }}>
                  <th style={{ textAlign: "left", padding: 8 }}>Producto</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Cant.</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Precio</th>
                  <th style={{ textAlign: "right", padding: 8 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map(item => (
                  <tr key={item.product_id} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 8 }}>{item.product_name}</td>
                    <td style={{ textAlign: "right", padding: 8 }}>{item.quantity}</td>
                    <td style={{ textAlign: "right", padding: 8 }}>{formatPrice(item.price)}</td>
                    <td style={{ textAlign: "right", padding: 8 }}>{formatPrice(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: "bold" }}>
                  <td colSpan={3} style={{ textAlign: "right", padding: 8 }}>Total:</td>
                  <td style={{ textAlign: "right", padding: 8 }}>{formatPrice(lastInvoice.venta.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => {
                setShowInvoice(false);
                setLastInvoice(null);
              }}>
                Cerrar
              </Btn>
              <Btn onClick={() => {
                window.print();
              }}>
                Imprimir
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pos;