import { useState, useCallback } from 'react';
import PageHeader from '../components/design/PageHeader';
import { colors } from '../components/design/colors';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { obtenerVentasPorDia } from '../db/sales';
import { obtenerComprasPorDia } from '../db/purchases';

interface ReportRow {
  fecha: string;
  ventas: number;
  numVentas: number;
  ganancia: number;
  egresos: number;
}

const formatLocal = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatPrice = (n: number): string =>
  "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });

const formatDateDisplay = (dateString: string): string => {
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

async function exportToCSV(rows: ReportRow[]) {
  const path = await save({
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    defaultPath: `reporte_${new Date().toISOString().slice(0, 10)}.csv`,
  });
  if (!path) return;

  const header = "Fecha,Ventas,N° Ventas,Ganancia,Egresos";
  const data = rows.map(r =>
    `${formatDateDisplay(r.fecha)},${r.ventas.toFixed(2)},${r.numVentas},${r.ganancia.toFixed(2)},${r.egresos.toFixed(2)}`
  );
  const totals = rows.reduce(
    (acc, r) => ({
      ventas: acc.ventas + r.ventas,
      numVentas: acc.numVentas + r.numVentas,
      ganancia: acc.ganancia + r.ganancia,
      egresos: acc.egresos + r.egresos,
    }),
    { ventas: 0, numVentas: 0, ganancia: 0, egresos: 0 }
  );
  const totalRow = `Totales,${totals.ventas.toFixed(2)},${totals.numVentas},${totals.ganancia.toFixed(2)},${totals.egresos.toFixed(2)}`;

  const csv = [header, ...data, totalRow].join('\n');
  try {
    await invoke('save_csv_file', { path, content: csv });
  } catch (err) {
    console.error("Error al exportar CSV:", err);
  }
}

export default function Reportes() {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generarReporte = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    setGenerated(true);
    try {
      const inicio = formatLocal(startDate);
      const fin = formatLocal(endDate);

      const [ventas, compras] = await Promise.all([
        obtenerVentasPorDia(inicio, fin),
        obtenerComprasPorDia(inicio, fin),
      ]);

      const map = new Map<string, ReportRow>();

      for (const v of ventas) {
        map.set(v.fecha, {
          fecha: v.fecha,
          ventas: v.total_ventas,
          numVentas: v.num_ventas,
          ganancia: v.ganancia,
          egresos: 0,
        });
      }

      for (const c of compras) {
        const existing = map.get(c.fecha);
        if (existing) {
          existing.egresos = c.total_compras;
        } else {
          map.set(c.fecha, {
            fecha: c.fecha,
            ventas: 0,
            numVentas: 0,
            ganancia: 0,
            egresos: c.total_compras,
          });
        }
      }

      const sorted = Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
      setRows(sorted);
    } catch (error) {
      console.error("Error al generar reporte:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const totals = rows.reduce(
    (acc, r) => ({
      ventas: acc.ventas + r.ventas,
      numVentas: acc.numVentas + r.numVentas,
      ganancia: acc.ganancia + r.ganancia,
      egresos: acc.egresos + r.egresos,
    }),
    { ventas: 0, numVentas: 0, ganancia: 0, egresos: 0 }
  );

  return (
    <div className="fade-up">
      <PageHeader
        title="Reportes"
        subtitle="Genera reportes detallados de ventas y egresos por rango de fechas."
      />

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: colors.secondary, display: "block", marginBottom: 6 }}>
            Rango de Fechas
          </label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable={true}
            placeholderText="Seleccionar rango..."
            dateFormat="dd/MM/yyyy"
            customInput={
              <input
                style={{
                  height: 42, padding: "0 12px", border: `1px solid ${colors.outlineVariant}`,
                  borderRadius: 8, fontSize: 14, outline: "none", color: colors.onSurface,
                  background: "#fff", width: 240
                }}
              />
            }
          />
        </div>

        <button
          onClick={generarReporte}
          disabled={!startDate || !endDate || loading}
          style={{
            height: 42, padding: "0 24px", border: "none", borderRadius: 8, fontSize: 14,
            fontWeight: 600, cursor: loading || !startDate || !endDate ? "not-allowed" : "pointer",
            background: loading || !startDate || !endDate ? colors.surfaceContainer : colors.primary,
            color: loading || !startDate || !endDate ? colors.secondary : "#fff",
            display: "flex", alignItems: "center", gap: 8
          }}
        >
          {loading ? "Generando..." : "Generar Reporte"}
        </button>

        {generated && rows.length > 0 && (
          <button
            onClick={() => exportToCSV(rows)}
            style={{
              height: 42, padding: "0 24px", border: `1px solid ${colors.outlineVariant}`, borderRadius: 8,
              fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#fff",
              color: colors.onSurface, display: "flex", alignItems: "center", gap: 8
            }}
          >
            Exportar CSV
          </button>
        )}
      </div>

      <div style={{
        background: colors.surfaceLowest, border: `1px solid ${colors.outlineVariant}`,
        borderRadius: 10, overflow: "hidden", overflowX: "auto"
      }}>
        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            Generando reporte...
          </div>
        ) : !generated ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            Selecciona un rango de fechas y presiona "Generar Reporte"
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: colors.secondary }}>
            No se encontraron datos en el rango seleccionado
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr style={{ background: colors.surfaceLow }}>
                {["FECHA", "VENTAS", "N° VENTAS", "GANANCIA", "EGRESOS"].map(header => (
                  <th key={header} style={{
                    padding: "12px 16px", textAlign: header === "FECHA" ? "left" : "right", fontSize: 11,
                    fontWeight: 700, letterSpacing: "0.05em", color: colors.secondary, whiteSpace: "nowrap"
                  }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.fecha} className="hover-row" style={{ borderTop: `1px solid ${colors.outlineVariant}` }}>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, color: colors.onSurface }}>
                    {formatDateDisplay(row.fecha)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, textAlign: "right", fontWeight: 600 }}>
                    {formatPrice(row.ventas)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, textAlign: "right" }}>
                    {row.numVentas}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, textAlign: "right", fontWeight: 600, color: "#16a34a" }}>
                    {formatPrice(row.ganancia)}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 13, textAlign: "right", fontWeight: 600, color: "#dc2626" }}>
                    {formatPrice(row.egresos)}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{ borderTop: `2px solid ${colors.primary}`, background: colors.surfaceLow }}>
                <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 800, color: colors.onSurface }}>
                  TOTALES
                </td>
                <td style={{ padding: "14px 16px", fontSize: 14, textAlign: "right", fontWeight: 800, color: colors.onSurface }}>
                  {formatPrice(totals.ventas)}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 14, textAlign: "right", fontWeight: 800, color: colors.onSurface }}>
                  {totals.numVentas}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 14, textAlign: "right", fontWeight: 800, color: "#16a34a" }}>
                  {formatPrice(totals.ganancia)}
                </td>
                <td style={{ padding: "14px 16px", fontSize: 14, textAlign: "right", fontWeight: 800, color: "#dc2626" }}>
                  {formatPrice(totals.egresos)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
