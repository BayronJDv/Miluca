import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerLotesPorVencer, obtenerLotesVencidos } from '../../db/batches';
import {
  listarNotificaciones,
  marcarNotificacionComoVista,
  eliminarNotificacion,
  StockNotification
} from '../../db/product_notifications'
import styles from './StockAlerts.module.css';

function StockAlerts() {
  const [alerts, setAlerts] = useState<StockNotification[]>([]);
  const [expiryCount, setExpiryCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;

  const cargarAlertas = async () => {
    const response = await listarNotificaciones();
    if (response.success) {
      setAlerts(response.notifications);
    }
    const [soon, expired] = await Promise.all([obtenerLotesPorVencer(30), obtenerLotesVencidos()]);
    setExpiryCount(soon.length + expired.length);
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  const getStockStatus = (current: number = 0, min: number = 1) => {
    const percentage = (current / min) * 100;
    if (percentage < 30) return 'error' as const;
    if (percentage < 80) return 'warning' as const;
    return 'success' as const;
  };

  const handleMarcarVista = async (id: number) => {
    const res = await marcarNotificacionComoVista(id);
    if (res.success) await cargarAlertas();
  };

  const handleEliminar = async (id: number) => {
    const res = await eliminarNotificacion(id);
    if (res.success) {
      if (currentIndex > 0 && alerts.length - 1 <= currentIndex) {
        setCurrentIndex(currentIndex - itemsPerPage);
      }
      await cargarAlertas();
    }
  };

  const nextSlide = () => {
    if (currentIndex + itemsPerPage < alerts.length) {
      setCurrentIndex(currentIndex + itemsPerPage);
    }
  };

  const prevSlide = () => {
    if (currentIndex - itemsPerPage >= 0) {
      setCurrentIndex(currentIndex - itemsPerPage);
    }
  };

  const visibleAlerts = alerts.slice(currentIndex, currentIndex + itemsPerPage);
  const statusClass = {
    error: styles.error,
    warning: styles.warning,
    success: styles.success,
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={`material-symbols-outlined ${styles.headerIcon}`}>warning</span>
          <h3 className={styles.title}>Alertas de Stock Bajo</h3>
        </div>

        {alerts.length > itemsPerPage ? (
          <div className={styles.slideControls}>
            <button
              onClick={prevSlide}
              disabled={currentIndex === 0}
              className={styles.slideBtn}
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className={styles.slideCounter}>
              {Math.floor(currentIndex / itemsPerPage) + 1} / {Math.ceil(alerts.length / itemsPerPage)}
            </span>
            <button
              onClick={nextSlide}
              disabled={currentIndex + itemsPerPage >= alerts.length}
              className={styles.slideBtn}
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        ) : (
          <p className={styles.slideCounter}></p>
        )}
      </div>
      {expiryCount > 0 && (
        <Link to="/vencimientos" className={styles.expiryBanner}>
          <span><strong>{expiryCount}</strong> lote(s) vencido(s) o próximos a vencer</span>
          <span className={styles.expiryArrow}>Revisar vencimientos →</span>
        </Link>
      )}

      <div className={styles.list}>
        {visibleAlerts.length === 0 ? (
          <p className={styles.empty}>No hay alertas de stock.</p>
        ) : (
          visibleAlerts.map((item) => {
            const current = item.product_stock ?? 0;
            const min = item.product_alert_stock ?? 1;
            const status = getStockStatus(current, min);
            const percentage = (current / min) * 100;

            return (
              <div key={item.id} className={styles.alertRow}>
                <div className={styles.alertInfo}>
                  <div>
                    <p className={styles.productName}>{item.product_name}</p>
                    <p className={styles.productId}>ID Producto: #{item.product_id}</p>
                  </div>
                </div>

                <div className={styles.alertRight}>
                  <div className={styles.stockInfo}>
                    <div className={styles.stockLine}>
                      <span className={`${styles.stockCurrent} ${statusClass[status]}`}>{current} unidades</span>
                      <span className={styles.stockMin}>/ min {min}</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${statusClass[status]}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      onClick={() => handleMarcarVista(item.id!)}
                      title="Marcar como vista"
                      className={styles.actionBtn}
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button
                      onClick={() => handleEliminar(item.id!)}
                      title="Eliminar alerta"
                      className={`${styles.actionBtn} ${styles.delete}`}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export default StockAlerts;
