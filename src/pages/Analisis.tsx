import React, { useState, useCallback, useEffect, useMemo } from 'react';
import PageHeader from '../components/design/PageHeader';
import { colors } from '../components/design/colors';
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
            accent: colors.primary,
        },
        {
            key: 'ingresos',
            label: 'Ingresos',
            labelTop: 'Mayores ingresos',
            labelBottom: 'Menores ingresos',
            format: formatPrice,
            adminOnly: false,
            accent: '#2E7D5B',
        },
        {
            key: 'ganancia',
            label: 'Ganancia',
            labelTop: 'Mayor ganancia',
            labelBottom: 'Menor ganancia',
            format: formatPrice,
            adminOnly: true,
            accent: '#B8860B',
        },
        {
            key: 'num_ventas',
            label: 'N° de ventas (rotación)',
            labelTop: 'Mayor rotación',
            labelBottom: 'Menor rotación',
            format: formatNumero,
            adminOnly: false,
            accent: '#6A4C93',
        },
        ] as MetricConfig[]).filter((m) => !m.adminOnly || isAdmin), // <-- Aquí le aseguras el tipo antes de filtrar
    [isAdmin]
    );

  useEffect(() => {
    // Si el usuario deja de ser admin o la métrica de ganancia no está disponible, redirige a una válida
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

  // ---- Datos derivados ----

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

  // ---- Subcomponentes visuales ----

  const KpiCard: React.FC<{ label: string; value: string; accent: string; hint?: string }> = ({
    label,
    value,
    accent,
    hint,
  }) => (
    <div
      style={{
        flex: '1 1 200px',
        background: colors.surfaceLowest,
        border: `1px solid ${colors.outlineVariant}`,
        borderRadius: 10,
        padding: '16px 18px',
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: colors.secondary }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: colors.onSurface, marginTop: 4 }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: colors.secondary, marginTop: 2 }}>{hint}</div>}
    </div>
  );

  const RankingPanel: React.FC<{
    titulo: string;
    items: ProductoEstadistica[];
    accent: string;
    invertido?: boolean;
  }> = ({ titulo, items, accent }) => {
    const maxValor = Math.max(1, ...items.map((p) => Math.abs(p[metricaConfig.key])));
    return (
      <div
        style={{
          flex: '1 1 340px',
          background: colors.surfaceLowest,
          border: `1px solid ${colors.outlineVariant}`,
          borderRadius: 10,
          padding: 18,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: colors.onSurface, marginBottom: 14 }}>{titulo}</div>
        {items.length === 0 ? (
          <div style={{ fontSize: 13, color: colors.secondary, padding: '12px 0' }}>
            No hay datos suficientes para este período.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((p, idx) => {
              const valor = p[metricaConfig.key];
              const anchoPct = Math.max(6, (Math.abs(valor) / maxValor) * 100);
              return (
                <div key={p.product_id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ color: colors.onSurface, fontWeight: 600 }}>
                      {idx + 1}. {p.name}
                    </span>
                    <span style={{ color: colors.secondary, fontWeight: 700 }}>
                      {metricaConfig.format(valor)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      borderRadius: 4,
                      background: colors.surfaceLow,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${anchoPct}%`,
                        background: valor < 0 ? '#C0392B' : accent,
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fade-up">
      <PageHeader title="Análisis de Ventas" subtitle="Rendimiento de productos: qué se mueve, qué no, y qué deja más ganancia." />

      {/* Filtro de fechas */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: 'block', marginBottom: 6 }}>
            Rango de Fechas
          </label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable={true}
            placeholderText="Todo el historial"
            dateFormat="dd/MM/yyyy"
            customInput={
              <input
                style={{
                  height: 42,
                  padding: '0 12px',
                  border: `1px solid ${colors.outlineVariant}`,
                  borderRadius: 8,
                  fontSize: 14,
                  outline: 'none',
                  color: colors.onSurface,
                  background: '#fff',
                  width: 240,
                }}
              />
            }
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.secondary }}>
          Cargando análisis de ventas...
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
            <KpiCard label="UNIDADES VENDIDAS" value={formatNumero(totales.unidades)} accent={colors.primary} />
            <KpiCard label="INGRESOS TOTALES" value={formatPrice(totales.ingresos)} accent="#2E7D5B" />
            {isAdmin && <KpiCard label="GANANCIA TOTAL" value={formatPrice(totales.ganancia)} accent="#B8860B" />}
            <KpiCard
              label="SIN MOVIMIENTO"
              value={formatNumero(totales.sinMovimiento)}
              accent="#C0392B"
              hint="Productos con 0 ventas en el período"
            />
          </div>

          {/* Selector de métrica */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {METRICAS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetricaActiva(m.key)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${metricaActiva === m.key ? m.accent : colors.outlineVariant}`,
                  background: metricaActiva === m.key ? m.accent : '#fff',
                  color: metricaActiva === m.key ? '#fff' : colors.onSurface,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Rankings top / bottom para la métrica activa */}
          {metricaConfig && (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
              <RankingPanel titulo={`🏆 ${metricaConfig.labelTop}`} items={topRanking} accent={metricaConfig.accent} />
              <RankingPanel titulo={`⚠️ ${metricaConfig.labelBottom}`} items={bottomRanking} accent={metricaConfig.accent} />
            </div>
          )}

          {/* Tabla completa */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.onSurface }}>Todos los productos</div>
            <div style={{ position: 'relative' }}>
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o código..."
                style={{
                  height: 38,
                  padding: '0 12px',
                  border: `1px solid ${colors.outlineVariant}`,
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none',
                  width: 260,
                  color: colors.onSurface,
                  background: '#fff',
                }}
              />
            </div>
          </div>

          <div
            style={{
              background: colors.surfaceLowest,
              border: `1px solid ${colors.outlineVariant}`,
              borderRadius: 10,
              overflow: 'hidden',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ background: colors.surfaceLow }}>
                  {columnas.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      style={{
                        padding: '12px 16px',
                        textAlign: col.align,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        color: colors.secondary,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      {col.label}
                      {sortConfig.key === col.key && (sortConfig.dir === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasTabla.map((p) => (
                  <tr key={p.product_id} className="hover-row" style={{ borderTop: `1px solid ${colors.outlineVariant}` }}>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                      {p.name}
                      <div style={{ fontSize: 11, color: colors.secondary, fontWeight: 400 }}>{p.code}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>
                      {formatNumero(p.stock)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>
                      {formatNumero(p.unidades_vendidas)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>
                      {formatNumero(p.num_ventas)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, textAlign: 'right' }}>
                      {formatPrice(p.ingresos)}
                    </td>
                    {isAdmin && (
                      <td
                        style={{
                          padding: '12px 16px',
                          fontSize: 13,
                          textAlign: 'right',
                          fontWeight: 600,
                          color: p.ganancia < 0 ? '#C0392B' : colors.primary,
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
              <div style={{ padding: '40px 20px', textAlign: 'center', color: colors.secondary }}>
                No se encontraron productos que coincidan con tu búsqueda.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalisisVentas;