import { useState, useEffect, useCallback } from 'react';
import KPICard from '../components/KPICard/KPICard';
import StockAlerts from '../components/StockAlerts/StockAlerts';
import QuickAccess from '../components/QuickAccess/QuickAccess';
import TopProductos from '../components/TopProductos/TopProductos';
import { obtenerTotalVentasHoy, obtenerNumeroTransaccionesHoy, obtenerProfitHoy } from '../db/sales';
import { obtenerTotalCompras } from '../db/purchases';
import { listUsers } from '../db/users';
import { isAdminAtom } from '../store/UserAtom';
import { useAtomValue } from 'jotai';
import styles from './Home.module.css';

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
  const [vendedorId, setVendedorId] = useState<number | ''>('');
  const [usuarios, setUsuarios] = useState<{ id: number; username: string; role: string }[]>([]);

  useEffect(() => {
    listUsers().then(setUsuarios).catch(console.error);
  }, []);

  const loadData = useCallback(async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const { fechaInicio, fechaFin } = getDateRange(periodo);
      setLoading(true);
      try {
        const [total, count, profitVal, compras] = await Promise.all([
          obtenerTotalVentasHoy(fechaInicio, fechaFin, vendedorId || undefined),
          obtenerNumeroTransaccionesHoy(fechaInicio, fechaFin, vendedorId || undefined),
          obtenerProfitHoy(fechaInicio, fechaFin, vendedorId || undefined),
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
    }, [periodo, isAdmin, vendedorId]);

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
    <div className={styles.root}>
      {/* Dashboard Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Panel de Control</h2>
          <p className={styles.subtitle}>Bienvenido de nuevo. Aquí tienes el resumen operativo. usuario {isAdmin.toString()}</p>
        </div>

        {/* Period Selector */}
        {isAdmin && (
          <div className={styles.headerRight}>
            <select
              className={styles.vendedorSelect}
              value={vendedorId}
              onChange={e => setVendedorId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Todos los vendedores</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
            </select>
            <div className={styles.periodSelector}>
              {periodos.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodo(p.key)}
                  className={`${styles.periodBtn} ${periodo === p.key ? styles.periodBtnActive : ''}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Period Label*/}
      {isAdmin && (
        <div className={styles.periodLabel}>
          <span className={`material-symbols-outlined ${styles.periodIcon}`}>calendar_today</span>
          <span className={styles.periodText}>{titulo}</span>
        </div>
      )}

      {/* KPI Cards Grid*/}
      {isAdmin && (
        <div className={styles.kpiGrid}>
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>
      )}

      {/* Bottom Section: 2 Columns */}
      <div className={styles.bottomGrid}>
        <TopProductos />
        <div className={styles.bottomRight}>
          <QuickAccess />
          <StockAlerts />
        </div>
      </div>
    </div>
  );
}