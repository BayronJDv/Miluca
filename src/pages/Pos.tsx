import React, { useState, useCallback, useMemo } from 'react';
import { colors } from '../components/design/colors';
import { Icon } from '../components/design/Icon';
import Btn from '../components/design/Btn';

// Tipos
interface Product {
  id: number;
  name: string;
  ref: string;
  price: number;
  stock: number;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

const Pos: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [cart, setCart] = useState<CartItem[]>([
    { id: 1, name: "Leche Entera 1L", price: 2400, qty: 2 },
    { id: 2, name: "Detergente Líquido 3L", price: 12500, qty: 1 },
    { id: 3, name: "Pan Tajado Familiar", price: 5600, qty: 1 },
  ]);
  const [received, setReceived] = useState<string>("30000");

  const PRODUCTS: Product[] = [
    { id: 10, name: "Aceite Vegetal 1L", ref: "78000012", price: 4500, stock: 142 },
    { id: 11, name: "Arroz Premium 1kg", ref: "77012345", price: 3200, stock: 56 },
    { id: 12, name: "Café Molido 250g", ref: "77054321", price: 8900, stock: 22 },
    { id: 13, name: "Azúcar x 1kg", ref: "77000888", price: 3800, stock: 80 },
  ];

  // Filtrado de productos
  const filtered = useMemo(() => 
    PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  // Cálculos del carrito
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

  // Formateador de moneda
  const formatPrice = (n: number): string => 
    "$" + n.toLocaleString("es-CO");

  // Handlers del carrito
  const addToCart = useCallback((product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        qty: 1
      }];
    });
  }, []);

  const updateQuantity = useCallback((id: number, delta: number) => {
    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    if (window.confirm('¿Vaciar carrito?')) {
      setCart([]);
    }
  }, []);

  const handleConfirmSale = useCallback(() => {
    if (cart.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    if (receivedNumber < total) {
      alert(`El valor recibido (${formatPrice(receivedNumber)}) es menor al total (${formatPrice(total)})`);
      return;
    }
    
    // Aquí iría la lógica para procesar la venta
    console.log('Venta confirmada:', { cart, total, received: receivedNumber, change });
    alert(`Venta confirmada. Cambio: ${formatPrice(change)}`);
    
    // Limpiar carrito después de la venta (opcional)
    // setCart([]);
    // setReceived("0");
  }, [cart, total, receivedNumber, change]);

  // Manejo de teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'F10') {
      e.preventDefault();
      console.log('Imprimir ticket');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      clearCart();
    }
  }, [clearCart]);

  return (
    <div 
      className="fade-up" 
      style={{ display: "flex", gap: 16, height: "calc(100vh - 60px - 48px)" }}
      onKeyDown={handleKeyDown}
    >
      {/* Left Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>
        
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
            ESCANEO DE CÓDIGO DE BARRAS (ACTIVO)
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: colors.onSurfaceVariant }}>
            Escanear o ingresar código...
          </div>
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
              onChange={e => setSearch(e.target.value)}
              className="input-field"
              style={{
                width: "100%", height: 42, paddingLeft: 34, paddingRight: 12,
                border: `1px solid ${colors.outlineVariant}`, borderRadius: 8, 
                fontSize: 14, background: "#fff",
              }}
            />
          </div>
          <Btn icon="plus" variant="primary">Agregar</Btn>
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
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, letterSpacing: "0.04em" }}>
              STOCK DISPONIBLE
            </span>
          </div>
          
          {filtered.map(product => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)} 
              className="hover-row" 
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
                <div style={{ fontSize: 12, color: colors.secondary }}>Ref: {product.ref}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: colors.primary }}>
                  {formatPrice(product.price)}
                </div>
                <div style={{ fontSize: 11, color: colors.secondary }}>
                  {product.stock} unidades
                </div>
              </div>
            </div>
          ))}
          
          {filtered.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
              No se encontraron productos
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Cart */}
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
            <div style={{ fontSize: 12, color: colors.secondary }}>Cliente: Consumidor Final</div>
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
            <div key={item.id} style={{ padding: "12px 20px", borderBottom: `1px solid ${colors.surfaceContainer}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, marginRight: 8 }}>
                  {item.name}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{formatPrice(item.price)}</span>
                  <button 
                    onClick={() => removeItem(item.id)} 
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
                    onClick={() => updateQuantity(item.id, -1)} 
                    style={{ background: "none", border: "none", cursor: "pointer", color: colors.onSurface }}
                  >
                    <Icon name="minus" size={16} />
                  </button>
                  <span style={{ fontSize: 14, fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                    {item.qty}
                  </span>
                  <button 
                    onClick={() => updateQuantity(item.id, 1)} 
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

        {/* Cart Footer */}
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
                  className="input-field"
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
            className="btn-primary"
          >
            <Icon name="confirm" size={18} color="#fff" />
            Confirmar Venta
          </button>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <span style={{ fontSize: 11, color: colors.secondary }}>
              <kbd style={{ background: colors.surfaceContainer, padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>
                F10
              </kbd> Imprimir
            </span>
            <span style={{ fontSize: 11, color: colors.secondary }}>
              <kbd style={{ background: colors.surfaceContainer, padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>
                ESC
              </kbd> Cancelar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pos;