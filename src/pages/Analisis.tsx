import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PageHeader from '../components/design/PageHeader';
import { obtenerEstadisticasProductos, ProductoEstadistica } from '../db/product_stats';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAtomValue } from 'jotai';
import { isAdminAtom } from '../store/UserAtom';

type MetricKey = 'unidades_vendidas' | 'ingresos' | 'ganancia' | 'num_ventas';

interface MetricConfig {
  key: MetricKey;
  label: string;
  labelTop: string;
  labelBottom: string;
  format: (n: number) => string;
  adminOnly: boolean;
  accent: string;
  accentClass: string;
}

type SortDireccion = 'asc' | 'desc';

const AnalisisVentas: React.FC = () => {
  const isAdmin = useAtomValue(isAdminAtom);

  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [stats, setStats] = useState<ProductoEstadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [metricaActiva, setMetricaActiva] = useState<MetricKey>('unidades_vendidas');
  const [sortConfig, setSortConfig] = useState<{ key: MetricKey | 'name' | 'stock'; dir: SortDireccion }>({
    key: 'unidades_vendidas',
    dir: 'desc',
  });

  const formatPrice = (n: number): string =>
    (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('es-CO', { minimumFractionDigits: 2 });
  const formatNumero = (n: number): string => n.toLocaleString('es-CO');

  const METRICAS: MetricConfig[] = useMemo(
    () =>
      ([
        {
          key: 'unidades_vendidas',
          label: 'Unidades vendidas',
          labelTop: 'Más vendidos',
          labelBottom: 'Menos vendidos',
          format: formatNumero,
          adminOnly: false,
          accent: 'var(--color-primary)',
          accentClass: 'accent-blue',
        },
        {
          key: 'ingresos',
          label: 'Ingresos',
          labelTop: 'Mayores ingresos',
          labelBottom: 'Menores ingresos',
          format: formatPrice,
          adminOnly: false,
          accent: 'var(--color-metric-green)',
          accentClass: 'accent-green',
        },
        {
          key: 'ganancia',
          label: 'Ganancia',
          labelTop: 'Mayor ganancia',
          labelBottom: 'Menor ganancia',
          format: formatPrice,
          adminOnly: true,
          accent: 'var(--color-metric-gold)',
          accentClass: 'accent-gold',
        },
        {
          key: 'num_ventas',
          label: 'N° de ventas (rotación)',
          labelTop: 'Mayor rotación',
          labelBottom: 'Menor rotación',
          format: formatNumero,
          adminOnly: false,
          accent: 'var(--color-metric-purple)',
          accentClass: 'accent-purple',
        },
      ] as MetricConfig[]).filter((m) => !m.adminOnly || isAdmin),
    [isAdmin]
  );

  useEffect(() => {
    if (!METRICAS.find((m) => m.key === metricaActiva)) {
      setMetricaActiva(METRICAS[0]?.key ?? 'unidades_vendidas');
    }
  }, [METRICAS, metricaActiva]);

  const cargarEstadisticas = useCallback(async () => {
    setLoading(true);
    try {
      const formatLocal = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      const fechaInicioStr = startDate ? formatLocal(startDate) : undefined;
      const fechaFinStr = endDate ? formatLocal(endDate) : undefined;

      const data = await obtenerEstadisticasProductos(fechaInicioStr, fechaFinStr);
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas de productos:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const totales = useMemo(() => {
    return stats.reduce(
      (acc, p) => ({
        unidades: acc.unidades + p.unidades_vendidas,
        ingresos: acc.ingresos + p.ingresos,
        ganancia: acc.ganancia + p.ganancia,
        sinMovimiento: acc.sinMovimiento + (p.unidades_vendidas === 0 ? 1 : 0),
      }),
      { unidades: 0, ingresos: 0, ganancia: 0, sinMovimiento: 0 }
    );
  }, [stats]);

  const metricaConfig = METRICAS.find((m) => m.key === metricaActiva) ?? METRICAS[0];

  const topRanking = useMemo(() => {
    if (!metricaConfig) return [];
    return [...stats]
      .filter((p) => p[metricaConfig.key] > 0)
      .sort((a, b) => b[metricaConfig.key] - a[metricaConfig.key])
      .slice(0, 5);
  }, [stats, metricaConfig]);

  const bottomRanking = useMemo(() => {
    if (!metricaConfig) return [];
    return [...stats].sort((a, b) => a[metricaConfig.key] - b[metricaConfig.key]).slice(0, 5);
  }, [stats, metricaConfig]);

  const filasTabla = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtradas = q
      ? stats.filter((p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
      : stats;

    return [...filtradas].sort((a, b) => {
      const dir = sortConfig.dir === 'asc' ? 1 : -1;
      const va = a[sortConfig.key];
      const vb = b[sortConfig.key];
      if (typeof va === 'string' && typeof vb === 'string') {
        return va.localeCompare(vb) * dir;
      }
      return ((va as number) - (vb as number)) * dir;
    });
  }, [stats, busqueda, sortConfig]);

  const handleSort = (key: typeof sortConfig.key) => {
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }
    );
  };

  const columnas: { key: typeof sortConfig.key; label: string; align: 'left' | 'right' }[] = [
    { key: 'name', label: 'PRODUCTO', align: 'left' },
    { key: 'stock', label: 'STOCK', align: 'right' },
    { key: 'unidades_vendidas', label: 'VENDIDOS', align: 'right' },
    { key: 'num_ventas', label: 'N° VENTAS', align: 'right' },
    { key: 'ingresos', label: 'INGRESOS', align: 'right' },
    ...(isAdmin ? ([{ key: 'ganancia', label: 'GANANCIA', align: 'right' }] as const) : []),
  ];

  const maxValor = Math.max(1, ...topRanking.map((p) => Math.abs(p[metricaConfig.key])));

  return (
    <div className="fade-up">
      <PageHeader title="Análisis de Ventas" subtitle="Rendimiento de productos: qué se mueve, qué no, y qué deja más ganancia." />

      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label className="field-label">Rango de Fechas</label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable={true}
            placeholderText="Todo el historial"
            dateFormat="dd/MM/yyyy"
            showMonthDropdown
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={20}
            dropdownMode="select"
            customInput={
              <input className="control control--md" />
            }
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Cargando análisis de ventas...</div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
              <div className="kpi-card-label">UNIDADES VENDIDAS</div>
              <div className="kpi-card-value">{formatNumero(totales.unidades)}</div>
            </div>
            <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-metric-green)' }}>
              <div className="kpi-card-label">INGRESOS TOTALES</div>
              <div className="kpi-card-value">{formatPrice(totales.ingresos)}</div>
            </div>
            {isAdmin && (
              <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-metric-gold)' }}>
                <div className="kpi-card-label">GANANCIA TOTAL</div>
                <div className="kpi-card-value">{formatPrice(totales.ganancia)}</div>
              </div>
            )}
            <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-metric-red)' }}>
              <div className="kpi-card-label">SIN MOVIMIENTO</div>
              <div className="kpi-card-value">{formatNumero(totales.sinMovimiento)}</div>
              <div className="kpi-card-hint">Productos con 0 ventas en el período</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {METRICAS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetricaActiva(m.key)}
                className={`metric-chip ${m.accentClass} ${metricaActiva === m.key ? 'is-active' : ''}`}
                style={{ '--metric-accent': m.accent } as React.CSSProperties}
              >
                {m.label}
              </button>
            ))}
          </div>

          {metricaConfig && (
            <div className="ranking-grid">
              <div className="ranking-panel">
                <div className="ranking-title">{metricaConfig.labelTop}</div>
                {topRanking.length === 0 ? (
                  <div className="ranking-empty">No hay datos suficientes para este período.</div>
                ) : (
                  <div className="ranking-items">
                    {topRanking.map((p, idx) => {
                      const valor = p[metricaConfig.key];
                      const anchoPct = Math.max(6, (Math.abs(valor) / maxValor) * 100);
                      return (
                        <div key={p.product_id}>
                          <div className="ranking-item-row">
                            <span className="ranking-item-name">{idx + 1}. {p.name}</span>
                            <span className="ranking-item-value">{metricaConfig.format(valor)}</span>
                          </div>
                          <div className="ranking-bar">
                            <div
                              className="ranking-bar-fill"
                              style={{
                                width: `${anchoPct}%`,
                                background: valor < 0 ? 'var(--color-metric-red)' : metricaConfig.accent,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="ranking-panel">
                <div className="ranking-title">{metricaConfig.labelBottom}</div>
                {bottomRanking.length === 0 ? (
                  <div className="ranking-empty">No hay datos suficientes para este período.</div>
                ) : (
                  <div className="ranking-items">
                    {bottomRanking.map((p, idx) => {
                      const valor = p[metricaConfig.key];
                      const anchoPct = Math.max(6, (Math.abs(valor) / maxValor) * 100);
                      return (
                        <div key={p.product_id}>
                          <div className="ranking-item-row">
                            <span className="ranking-item-name">{idx + 1}. {p.name}</span>
                            <span className="ranking-item-value">{metricaConfig.format(valor)}</span>
                          </div>
                          <div className="ranking-bar">
                            <div
                              className="ranking-bar-fill"
                              style={{
                                width: `${anchoPct}%`,
                                background: valor < 0 ? 'var(--color-metric-red)' : metricaConfig.accent,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
            <div className="text-on-surface" style={{ fontSize: 14, fontWeight: 700 }}>Todos los productos</div>
            <div style={{ position: 'relative' }}>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="control"
                style={{ width: 260 }}
              />
            </div>
          </div>

          <div className="page-card page-card--flush overflow-x-auto">
            <table className="data-table min-w-700">
              <thead>
                <tr>
                  {columnas.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className={col.align === 'right' ? 'align-right' : ''}
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                      {col.label}
                      {sortConfig.key === col.key && (sortConfig.dir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasTabla.map((p) => (
                  <tr key={p.product_id} className="hover-row">
                    <td style={{ fontWeight: 600 }}>
                      {p.name}
                      <div className="text-secondary" style={{ fontSize: 11, fontWeight: 400 }}>{p.code}</div>
                    </td>
                    <td className="align-right">{formatNumero(p.stock)}</td>
                    <td className="align-right" style={{ fontWeight: 600 }}>{formatNumero(p.unidades_vendidas)}</td>
                    <td className="align-right">{formatNumero(p.num_ventas)}</td>
                    <td className="align-right">{formatPrice(p.ingresos)}</td>
                    {isAdmin && (
                      <td
                        className="align-right"
                        style={{
                          fontWeight: 600,
                          color: p.ganancia < 0 ? 'var(--color-metric-red)' : 'var(--color-primary)',
                        }}
                      >
                        {formatPrice(p.ganancia)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {filasTabla.length === 0 && (
              <div className="empty-state">No se encontraron productos que coincidan con tu búsqueda.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalisisVentas;
