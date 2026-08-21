import { useState, useEffect, useCallback } from 'react';
import KPICard from '../components/KPICard/KPICard';
import StockAlerts from '../components/StockAlerts/StockAlerts';
import QuickAccess from '../components/QuickAccess/QuickAccess';
import TopProductos from '../components/TopProductos/TopProductos';
import { obtenerTotalVentasHoy, obtenerNumeroTransaccionesHoy, obtenerProfitHoy } from '../db/sales';
import { obtenerTotalCompras } from '../db/purchases';
import { isAdminAtom } from '../store/UserAtom';
import { useAtomValue } from 'jotai';

type Periodo = 'day' | 'week' | 'month';

const periodos: { key: Periodo; label: string }[] = [
  { key: 'day', label: 'Hoy' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mes' },
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateRange(period: Periodo): { fechaInicio: string; fechaFin: string; titulo: string } {
  const now = new Date();

  if (period === 'day') {
    const dateStr = toLocalDateStr(now);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = now.toLocaleDateString('es-ES', options);
    return { fechaInicio: dateStr, fechaFin: dateStr, titulo: `Hoy - ${formatted}` };
  }

  if (period === 'week') {
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fechaInicio = toLocalDateStr(monday);
    const fechaFin = toLocalDateStr(sunday);
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return {
      fechaInicio,
      fechaFin,
      titulo: `Semana - ${monday.toLocaleDateString('es-ES', opts)} - ${sunday.toLocaleDateString('es-ES', opts)}`,
    };
  }

  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fechaInicio = toLocalDateStr(firstDay);
  const fechaFin = toLocalDateStr(lastDay);
  const opts: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
  return {
    fechaInicio,
    fechaFin,
    titulo: `Mes - ${now.toLocaleDateString('es-ES', opts)}`,
  };
}

export default function Home() {
  const isAdmin = useAtomValue(isAdminAtom);

  const [periodo, setPeriodo] = useState<Periodo>('day');
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [numTransacciones, setNumTransacciones] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);
  const [totalCompras, setTotalCompras] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const { fechaInicio, fechaFin } = getDateRange(periodo);
      setLoading(true);
      try {
        const [total, count, profitVal, compras] = await Promise.all([
          obtenerTotalVentasHoy(fechaInicio, fechaFin),
          obtenerNumeroTransaccionesHoy(fechaInicio, fechaFin),
          obtenerProfitHoy(fechaInicio, fechaFin),
          obtenerTotalCompras(fechaInicio, fechaFin),
        ]);
        setTotalVentas(total);
        setNumTransacciones(count);
        setProfit(profitVal);
        setTotalCompras(compras);
      } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
      } finally {
        setLoading(false);
      }
    }, [periodo, isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const { titulo } = getDateRange(periodo);

  const kpiData = isAdmin ? [
    {
      title: 'Total Ventas',
      value: loading ? 'Cargando...' : formatCurrency(totalVentas),
      icon: 'monetization_on',
      trend: undefined, // Cambiado de null a undefined
      trendUp: undefined, // Cambiado de null a undefined
      variant: 'primary' as const,
    },
    {
      title: 'Transacciones',
      value: loading ? '...' : String(numTransacciones),
      icon: 'receipt_long',
      trend: undefined, // Cambiado de null a undefined
      trendUp: undefined, // Cambiado de null a undefined
      variant: 'secondary' as const,
    },
    {
      title: 'Granancias',
      value: loading ? 'Cargando...' : formatCurrency(profit),
      icon: 'trending_up',
      trend: undefined, // Cambiado de null a undefined
      trendUp: undefined, // Cambiado de null a undefined
      variant: 'neutral' as const,
    },
    {
      title: 'Egresos (Compras)',
      value: loading ? 'Cargando...' : formatCurrency(totalCompras),
      icon: 'shopping_cart',
      trend: undefined, // Cambiado de null a undefined
      trendUp: undefined, // Cambiado de null a undefined
      variant: 'error' as const,
    },
  ] : [];

  return (
    <div className="fade-up">
      {/* Dashboard Header */}
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Panel de Control</h2>
          <p className="text-secondary font-body-md text-body-md">Bienvenido de nuevo. Aquí tienes el resumen operativo. usuario {isAdmin.toString()}</p>
        </div>

        {/* Period Selector */}
        {isAdmin && (
          <div className="flex rounded-lg bg-surface-container-high p-xs gap-xs">
            {periodos.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                className={`px-md py-sm rounded-md text-label-md font-label-md transition-colors ${
                  periodo === p.key
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Period Label*/}
      {isAdmin && (
        <div className="flex items-center gap-sm mb-lg">
          <span className="material-symbols-outlined text-sm text-secondary">calendar_today</span>
          <span className="font-body-md text-body-md text-secondary">{titulo}</span>
        </div>
      )}

      {/* KPI Cards Grid*/}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-lg">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>
      )}

      {/* Bottom Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <TopProductos />
        <div className="space-y-lg">
          <QuickAccess />
          <StockAlerts />
        </div>
      </div>
    </div>
  );
}