import React from 'react';
import styles from './StockAlerts.module.css';

const stockItems = [
  {
    name: 'Cinta Adhesiva Industrial',
    category: 'Ferretería',
    currentStock: 12,
    minStock: 25,
    icon: 'package_2'
  },
  {
    name: 'Toner Impresora HP XL',
    category: 'Oficina',
    currentStock: 2,
    minStock: 10,
    icon: 'category'
  },
  {
    name: 'Cable UTP Cat 6',
    category: 'Redes',
    currentStock: 45,
    minStock: 50,
    icon: 'bolt'
  }
];

function StockAlerts() {
  const getStockStatus = (current, min) => {
    const percentage = (current / min) * 100;
    if (percentage < 30) return { color: 'error', textColor: 'text-error' };
    if (percentage < 80) return { color: 'orange', textColor: 'text-orange-500' };
    return { color: 'success', textColor: 'text-success' };
  };

  return (
    <section className="bg-white p-lg rounded-xl shadow-sm border border-[#E2E8F0]">
      <div className="flex justify-between items-center mb-xl">
        <div className="flex items-center gap-md">
          <span className="material-symbols-outlined text-error">warning</span>
          <h3 className="font-headline-sm text-headline-sm">Alertas de Stock Bajo</h3>
        </div>
        <a className="text-primary font-label-md text-label-md hover:underline" href="#">Ver Inventario</a>
      </div>

      <div className="space-y-md">
        {stockItems.map((item, index) => {
          const status = getStockStatus(item.currentStock, item.minStock);
          const percentage = (item.currentStock / item.minStock) * 100;
          
          return (
            <div key={index} className="flex items-center justify-between p-md bg-background rounded-lg group hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-md">
                <div className="w-10 h-10 bg-white rounded border border-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-secondary">{item.icon}</span>
                </div>
                <div>
                  <p className="font-body-md text-body-md text-on-surface font-semibold">{item.name}</p>
                  <p className="text-xs text-secondary">Categoría: {item.category}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-xs">
                  <span className={`text-body-sm font-bold ${status.textColor}`}>{item.currentStock} unidades</span>
                  <span className="text-xs text-secondary">/ min {item.minStock}</span>
                </div>
                <div className="w-32 h-1 bg-outline-variant rounded-full mt-xs overflow-hidden">
                  <div 
                    className={`h-full ${status.color === 'error' ? 'bg-error' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default StockAlerts;