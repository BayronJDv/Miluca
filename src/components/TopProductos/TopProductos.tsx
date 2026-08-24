import { useState, useEffect } from 'react';
import { obtenerProductosMasVendidos, ProductoMasVendido } from '../../db/sales';
import styles from './TopProductos.module.css';

const rankClasses = [
  styles.rank1,
  styles.rank2,
  styles.rank3,
  styles.rankDefault,
  styles.rankDefault,
  styles.rankDefault,
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
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={`material-symbols-outlined ${styles.headerIcon}`}>star</span>
        <h3 className={styles.title}>Top 6 Productos Más Vendidos</h3>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando productos...</div>
      ) : productos.length === 0 ? (
        <div className={styles.empty}>No hay ventas registradas</div>
      ) : (
        <div className={styles.list}>
          {productos.map((p, i) => (
            <div key={p.product_id} className={styles.row}>
              <div className={`${styles.rank} ${rankClasses[i] || styles.rankDefault}`}>
                {i + 1}
              </div>
              <div className={styles.info}>
                <p className={styles.name}>{p.name}</p>
                <p className={styles.code}>{p.code}</p>
              </div>
              <div className={styles.stats}>
                <p className={styles.units}>{p.total_vendido} uds</p>
                <p className={styles.revenue}>{formatCurrency(p.total_ingresos)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
