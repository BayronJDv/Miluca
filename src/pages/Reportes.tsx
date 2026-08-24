import { useState, useCallback } from 'react';
import PageHeader from '../components/design/PageHeader';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { save } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { obtenerVentasPorDia } from '../db/sales';
import { obtenerComprasPorDia } from '../db/purchases';
import styles from './Reportes.module.css';

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

  const isDisabled = loading || !startDate || !endDate;

  return (
    <div className={styles.root}>
      <PageHeader
        title="Reportes"
        subtitle="Genera reportes detallados de ventas y egresos por rango de fechas."
      />

      <div className={styles.filterRow}>
        <div>
          <label className="field-label">Rango de Fechas</label>
          <DatePicker
            selectsRange={true}
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
            isClearable={true}
            placeholderText="Seleccionar rango..."
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

        <button
          onClick={generarReporte}
          disabled={isDisabled}
          className="btn-solid btn-solid--md"
          style={{ cursor: isDisabled ? "not-allowed" : "pointer" }}
        >
          {loading ? "Generando..." : "Generar Reporte"}
        </button>

        {generated && rows.length > 0 && (
          <button
            onClick={() => exportToCSV(rows)}
            className="btn-outline"
          >
            Exportar CSV
          </button>
        )}
      </div>

      <div className="page-card page-card--flush overflow-x-auto">
        {loading ? (
          <div className="empty-state">Generando reporte...</div>
        ) : !generated ? (
          <div className="empty-state">Selecciona un rango de fechas y presiona "Generar Reporte"</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No se encontraron datos en el rango seleccionado</div>
        ) : (
          <table className="data-table ">
            <thead>
              <tr>
                {["FECHA", "VENTAS", "N° VENTAS", "GANANCIA", "EGRESOS"].map(header => (
                  <th key={header} className={header !== "FECHA" ? "align-right" : ""}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.fecha} className="hover-row">
                  <td className={styles.cellBold}>
                    {formatDateDisplay(row.fecha)}
                  </td>
                  <td className={`align-right ${styles.cellBold}`}>
                    {formatPrice(row.ventas)}
                  </td>
                  <td className="align-right">
                    {row.numVentas}
                  </td>
                  <td className={`align-right text-income ${styles.cellBold}`}>
                    {formatPrice(row.ganancia)}
                  </td>
                  <td className={`align-right text-expense ${styles.cellBold}`}>
                    {formatPrice(row.egresos)}
                  </td>
                </tr>
              ))}
              <tr className="totals-row">
                <td>TOTALES</td>
                <td className="align-right">{formatPrice(totals.ventas)}</td>
                <td className="align-right">{totals.numVentas}</td>
                <td className="align-right text-income">{formatPrice(totals.ganancia)}</td>
                <td className="align-right text-expense">{formatPrice(totals.egresos)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
