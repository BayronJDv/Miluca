import { useCallback, useEffect, useState } from "react";
import {
  obtenerLotesPorVencer,
  obtenerLotesVencidos,
  ProductBatch,
} from "../db/batches";
import { registrarBaja } from "../db/disposals";
import PageHeader from "../components/design/PageHeader";
import Btn from "../components/design/Btn";
import { userIdAtom } from "../store/UserAtom";
import { useAtomValue } from "jotai";
import { formatMesAnio } from "../utils/dates";
import styles from './Vencimientos.module.css';

type LotRow = ProductBatch & { product_name?: string };

export default function Vencimientos() {
  const [rows, setRows] = useState<LotRow[]>([]);
  const [days, setDays] = useState(30);
  const [selectedRow, setSelectedRow] = useState<LotRow | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState<
    "vencido" | "averiado" | "retiro_mercado" | "otro"
  >("vencido");
  const [notes, setNotes] = useState("");
  const userId = useAtomValue(userIdAtom);
  const load = useCallback(async () => {
    setRows([
      ...(await obtenerLotesVencidos()),
      ...(await obtenerLotesPorVencer(days)),
    ] as LotRow[]);
  }, [days]);
  useEffect(() => {
    let cancelled = false;
    load().catch((error) => {
      if (!cancelled) alert(String(error));
    });
    return () => {
      cancelled = true;
    };
  }, [load]);
  const dispose = async () => {
    if (!selectedRow || !quantity || Number(quantity) <= 0)
      return alert("Indica una cantidad válida.");
    try {
      await registrarBaja({
        batch_id: selectedRow.id,
        quantity: Number(quantity),
        reason,
        notes,
        user_id: userId,
      });
      setSelectedRow(null);
      setQuantity("");
      setNotes("");
      await load();
    } catch (error) {
      alert(String(error));
    }
  };
  return (
    <div className={styles.root}>
      <PageHeader
        title="Vencimientos y bajas"
        subtitle="Control de lotes próximos a vencer y vencidos"
      />
      <div className="filter-bar">
        <h3 className={styles.formTitle}>Dias de alerta</h3>
        <label className="field">
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 30)}
            className="control"
          />
        </label>
      </div>
      <div className="page-card page-card--pad">
        <div className={styles.tableWrap}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Lote</th>
                <th>Vencimiento</th>
                <th>Cantidad</th>
                <th>acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.product_name}</td>
                  <td>{row.lot_number}</td>
                  <td>{row.expiration_date ? formatMesAnio(row.expiration_date) : "Sin fecha"}</td>
                  <td>{row.quantity}</td>
                  <td>
                    <Btn
                      onClick={() => {
                        const ahora = new Date();
                        const mesActual = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
                        setSelectedRow(row);
                        setQuantity(String(row.quantity));
                        setReason(
                          row.expiration_date &&
                            row.expiration_date.slice(0, 7) < mesActual
                            ? "vencido"
                            : "otro",
                        );
                      }}
                    >
                      Registrar baja
                    </Btn>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No hay lotes por vencer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {selectedRow && (
        <div className="overlay">
          <div className="modal">
            <h3 className={styles.modalTitle}>Registrar baja</h3>
            <p className="text-secondary">
              {selectedRow.product_name} · lote {selectedRow.lot_number} ·
              disponibles {selectedRow.quantity}
            </p>
            <label className={`field ${styles.fieldSpaced}`}>
              Cantidad
              <input
                type="number"
                min="0.01"
                max={selectedRow.quantity}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label className={`field ${styles.fieldSpaced}`}>
              Motivo
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as typeof reason)}
              >
                <option value="vencido">Vencido</option>
                <option value="averiado">Averiado</option>
                <option value="retiro_mercado">Retiro del mercado</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <label className={`field ${styles.fieldSpaced}`}>
              Notas
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className={styles.modalActions}>
              <Btn variant="ghost" onClick={() => setSelectedRow(null)}>
                Cancelar
              </Btn>
              <Btn onClick={dispose}>Confirmar baja</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
