import KPICard from '../components/KPICard/KPICard';
import StockAlerts from '../components/StockAlerts/StockAlerts';
import QuickAccess from '../components/QuickAccess/QuickAccess';
import SummaryCard from '../components/SummaryCard/SummaryCard';
import styles from './Home.module.css';

const kpiData = [
  {
    title: 'Total Ventas',
    value: '$45,230.00',
    icon: 'monetization_on',
    trend: '+12.5%',
    trendUp: true,
    variant: 'primary'
  },
  {
    title: 'Transacciones',
    value: '1,248',
    icon: 'receipt_long',
    trend: 'Hoy: 84',
    trendUp: null,
    variant: 'secondary'
  },
  {
    title: 'Gastos Registrados',
    value: '$12,840.50',
    icon: 'payments',
    trend: '+4%',
    trendUp: false,
    variant: 'error'
  },
  {
    title: 'Resultado Neto',
    value: '$32,389.50',
    icon: 'account_balance_wallet',
    trend: null,
    trendUp: null,
    variant: 'neutral'
  }
];

export default function Home() {
  return (
    <div className={styles.dashboard}>
      {/* Dashboard Header */}
      <div className="flex justify-between items-end mb-lg">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Panel de Control</h2>
          <p className="text-secondary font-body-md text-body-md">Bienvenido de nuevo. Aquí tienes el resumen operativo de hoy.</p>
        </div>
        <div className="flex gap-md">
          <button className="flex items-center gap-sm px-md py-sm bg-surface-container-high text-on-surface rounded-lg hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            <span className="font-label-md text-label-md">Últimos 30 días</span>
          </button>
          <button className="flex items-center gap-sm px-md py-sm bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="font-label-md text-label-md">Exportar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-lg">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Bottom Section: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <StockAlerts />
        <div className="space-y-lg">
          <QuickAccess />
          <SummaryCard />
        </div>
      </div>
    </div>
  );
}

