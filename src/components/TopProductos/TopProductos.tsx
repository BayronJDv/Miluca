import { useState, useEffect } from 'react';
import { obtenerProductosMasVendidos, ProductoMasVendido } from '../../db/sales';

const rankColors = [
  { bg: '#FFD700', text: '#fff', label: '1' },
  { bg: '#C0C0C0', text: '#fff', label: '2' },
  { bg: '#CD7F32', text: '#fff', label: '3' },
  { bg: '#E2E8F0', text: '#64748B', label: '4' },
  { bg: '#E2E8F0', text: '#64748B', label: '5' },
  { bg: '#E2E8F0', text: '#64748B', label: '6' },
];

export default function TopProductos() {
  const [productos, setProductos] = useState<ProductoMasVendido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await obtenerProductosMasVendidos(6);
        setProductos(data);
      } catch (error) {
        console.error('Error al cargar productos más vendidos:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatCurrency = (n: number) =>
    '$' + n.toLocaleString('es-CO', { minimumFractionDigits: 2 });

  return (
    <section className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0]">
      <div className="flex items-center gap-md mb-xl">
        <span className="material-symbols-outlined text-warning">star</span>
        <h3 className="font-headline-sm text-headline-sm">Top 6 Productos Más Vendidos</h3>
      </div>

      {loading ? (
        <div className="text-center py-lg text-secondary">Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className="text-center py-lg text-secondary">No hay ventas registradas</div>
      ) : (
        <div className="space-y-md">
          {productos.map((p, i) => (
            <div
              key={p.product_id}
              className="flex items-center gap-md p-md bg-background rounded-lg hover:bg-surface-container transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: rankColors[i]?.bg || '#E2E8F0',
                  color: rankColors[i]?.text || '#64748B',
                }}
              >
                {rankColors[i]?.label || i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body-md text-body-md text-on-surface font-semibold truncate">
                  {p.name}
                </p>
                <p className="text-xs text-secondary">{p.code}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-body-md text-body-md text-on-surface font-bold">
                  {p.total_vendido} uds
                </p>
                <p className="text-xs text-secondary">{formatCurrency(p.total_ingresos)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
