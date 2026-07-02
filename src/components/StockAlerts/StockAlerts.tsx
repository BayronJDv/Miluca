import { useState, useEffect } from 'react';
import { 
  listarNotificaciones, 
  marcarNotificacionComoVista, 
  eliminarNotificacion, 
  StockNotification 
} from '../../db/product_notifications'

function StockAlerts() {
  const [alerts, setAlerts] = useState<StockNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 3;

  // Cargar notificaciones desde la DB
  const cargarAlertas = async () => {
    const response = await listarNotificaciones();
    if (response.success) {
      setAlerts(response.notifications);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  // Lógica original de colores y estados
  const getStockStatus = (current: number = 0, min: number = 1) => {
    const percentage = (current / min) * 100;
    if (percentage < 30) return { color: 'error', textColor: 'text-error' };
    if (percentage < 80) return { color: 'orange', textColor: 'text-orange-500' };
    return { color: 'success', textColor: 'text-success' };
  };

  // Manejadores de acciones de tus botones
  const handleMarcarVista = async (id: number) => {
    const res = await marcarNotificacionComoVista(id);
    if (res.success) await cargarAlertas();
  };

  const handleEliminar = async (id: number) => {
    const res = await eliminarNotificacion(id);
    if (res.success) {
      // Ajustar el índice del slide si eliminamos el último elemento de una página
      if (currentIndex > 0 && alerts.length - 1 <= currentIndex) {
        setCurrentIndex(currentIndex - itemsPerPage);
      }
      await cargarAlertas();
    }
  };

  // Navegación del Slide (Avanzar de 3 en 3)
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

  // Recorte de la lista para mostrar estrictamente un máximo de 3
  const visibleAlerts = alerts.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <section className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0]">
      {/* Header Estilo Original */}
      <div className="flex justify-between items-center mb-xl">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-error">warning</span>
          <h3 className="font-headline-sm text-headline-sm">Alertas de Stock Bajo</h3>
        </div>
        
        {/* Controles del Slide (Solo visibles si hay más de 3 alertas) */}
        {alerts.length > itemsPerPage ? (
          <div className="flex items-center gap-xs text-secondary">
            <button 
              onClick={prevSlide} 
              disabled={currentIndex === 0}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-20 transition-opacity"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-xs font-semibold select-none">
              {Math.floor(currentIndex / itemsPerPage) + 1} / {Math.ceil(alerts.length / itemsPerPage)}
            </span>
            <button 
              onClick={nextSlide} 
              disabled={currentIndex + itemsPerPage >= alerts.length}
              className="p-1 rounded hover:bg-surface-container disabled:opacity-20 transition-opacity"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        ) : (
          <p className="text-secondary font-label-md text-label-md"></p>
        )}
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-md">
        {visibleAlerts.length === 0 ? (
          <p className="text-center text-secondary py-md text-sm">No hay alertas de stock.</p>
        ) : (
          visibleAlerts.map((item) => {
            const current = item.product_stock ?? 0;
            const min = item.product_alert_stock ?? 1;
            const status = getStockStatus(current, min);
            const percentage = (current / min) * 100;

            return (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-md bg-background rounded-lg group hover:bg-surface-container transition-colors"
              >
                {/* Información del Producto (Diseño original intacto) */}
                <div className="flex items-center gap-md">
                  <div>
                    <p className="font-body-md text-body-md text-on-surface font-semibold">{item.product_name}</p>
                    <p className="text-xs text-secondary">ID Producto: #{item.product_id}</p>
                  </div>
                </div>

                {/* Contenedor derecho: Stock + Barra + Botones de Acción */}
                <div className="flex items-center gap-lg">
                  <div className="text-right">
                    <div className="flex items-center gap-xs justify-end">
                      <span className={`text-body-sm font-bold ${status.textColor}`}>{current} unidades</span>
                      <span className="text-xs text-secondary">/ min {min}</span>
                    </div>
                    <div className="w-32 h-1 bg-outline-variant rounded-full mt-xs overflow-hidden ml-auto">
                      <div 
                        className={`h-full ${status.color === 'error' ? 'bg-error' : 'bg-orange-500'}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Botones de Acción (Aparecen al hacer hover sobre la fila) */}
                  <div className="flex items-center gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleMarcarVista(item.id!)}
                      title="Marcar como vista"
                      className="p-1 rounded-full hover:bg-outline-variant text-secondary flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </button>
                    <button
                      onClick={() => handleEliminar(item.id!)}
                      title="Eliminar alerta"
                      className="p-1 rounded-full hover:bg-red-50 text-error flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
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