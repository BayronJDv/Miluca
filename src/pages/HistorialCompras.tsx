import React, { useState, useMemo, useCallback, useEffect } from "react";
import PageHeader from "../components/design/PageHeader";
import { Input } from "../components/design/Input";
import { Icon } from "../components/design/Icon";
import {
  obtenerCompras,
  obtenerCompra,
  Compra,
  ItemCompra,
} from "../db/purchases";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { userIdAtom } from "../store/UserAtom";
import {
  devolverProveedor,
  obtenerPendienteDevolucionCompra,
} from "../db/returns";
import { useAtomValue } from "jotai";
import styles from './HistorialCompras.module.css';

const HistorialCompras: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [startDate, endDate] = dateRange;
  const [items, setItems] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detallesCache, setDetallesCache] = useState<
    Record<number, ItemCompra[]>
  >({});
  const [loadingDetalle, setLoadingDetalle] = useState<number | null>(null);
  const userId = useAtomValue(userIdAtom);
  const [returnTarget, setReturnTarget] = useState<{
    purchaseId: number;
    batchId: number;
    name: string;
    max: number;
  } | null>(null);
  const [returnQuantity, setReturnQuantity] = useState("");
  const [returnReason, setReturnReason] = useState("Devolución a proveedor");

  const cargarCompras = useCallback(async () => {
    setLoading(true);
    try {
      const formatLocal = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      const fechaInicioStr = startDate ? formatLocal(startDate) : undefined;
      const fechaFinStr = endDate ? formatLocal(endDate) : undefined;
      const response = await obtenerCompras(
        1,
        100,
        fechaInicioStr,
        fechaFinStr,
      );
      setItems(response.compras);
    } catch (error) {
      console.error("Error al cargar compras:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras]);

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        (item.supplier_name?.toLowerCase() || "sin proveedor").includes(
          search.toLowerCase(),
        ),
      ),
    [items, search],
  );

  const formatPrice = (n: number): string =>
    "$" + n.toLocaleString("es-CO", { minimumFractionDigits: 2 });

  const formatDate = (dateString: string): string => {
    const safeDateString = dateString.includes("T")
      ? dateString
      : dateString.replace(" ", "T") + "Z";
    return new Date(safeDateString).toLocaleString("es-CO", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleToggleExpand = async (compraId: number) => {
    if (expandedId === compraId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(compraId);
    if (!detallesCache[compraId]) {
      setLoadingDetalle(compraId);
      try {
        const detalle = await obtenerCompra(compraId);
        if (detalle)
          setDetallesCache((prev) => ({ ...prev, [compraId]: detalle.items }));
      } catch (error) {
        console.error("Error al cargar detalles de la compra:", error);
      } finally {
        setLoadingDetalle(null);
      }
    }
  };

  const openReturn = async (purchaseId: number, item: ItemCompra) => {
    if (!item.batch_id) return alert("Este ítem no tiene lote asociado.");
    const max = await obtenerPendienteDevolucionCompra(
      purchaseId,
      item.batch_id,
    );
    if (!max)
      return alert("La cantidad completa de este lote ya fue devuelta.");
    setReturnTarget({
      purchaseId,
      batchId: item.batch_id,
      name: item.product_name,
      max,
    });
    setReturnQuantity(String(max));
  };

  const submitReturn = async () => {
    if (!returnTarget) return;
    try {
      await devolverProveedor({
        purchase_id: returnTarget.purchaseId,
        batch_id: returnTarget.batchId,
        quantity: Number(returnQuantity),
        reason: returnReason,
        user_id: userId,
      });
      setReturnTarget(null);
      alert("Devolución al proveedor registrada en el lote y kardex.");
    } catch (error) {
      alert(String(error));
    }
  };

  return (
    <div className={styles.root}>
      <PageHeader
        title="Historial de Compras"
        subtitle="Registro detallado de todas las compras realizadas a proveedores."
      />
      <div className={styles.filtersBar}>
        <div className={styles.searchField}>
          <label className="field-label">Buscar Proveedor</label>
          <Input
            placeholder="Ej. Distribuidora del Sur..."
            value={search}
            onChange={setSearch}
            icon="search"
          />
        </div>
        <div>
          <label className="field-label">Rango de Fechas</label>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(update: [Date | null, Date | null]) =>
              setDateRange(update)
            }
            isClearable
            placeholderText="Seleccionar rango..."
            dateFormat="dd/MM/yyyy"
            showMonthDropdown
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={20}
            dropdownMode="select"
            customInput={<input className="control control--md" />}
          />
        </div>
      </div>

      <div className="page-card page-card--flush">
        {loading ? (
          <div className="empty-state">Cargando historial de compras...</div>
        ) : (
          <table className={`data-table ${styles.tableWide}`}>
            <thead>
              <tr>
                {["ID COMPRA", "FECHA", "PROVEEDOR", "TOTAL", "ACCIÓN"].map(
                  (header) => (
                    <th
                      key={header}
                      className={header === "TOTAL" ? "align-right" : ""}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <React.Fragment key={row.id}>
                  <tr>
                    <td className={styles.idCell}>
                      #{row.id}
                    </td>
                    <td>{formatDate(row.purchase_date)}</td>
                    <td className={styles.supplierCell}>
                      {row.supplier_name || "Sin Proveedor"}
                    </td>
                    <td className={`align-right ${styles.totalCell}`}>
                      {formatPrice(row.total_cost)}
                    </td>
                    <td>
                      <button
                        onClick={() => row.id && handleToggleExpand(row.id)}
                        className="btn-link"
                      >
                        {expandedId === row.id ? "Ocultar" : "Ver detalle"}
                        <Icon
                          name={expandedId === row.id ? "minus" : "plus"}
                          size={18}
                        />
                      </button>
                    </td>
                  </tr>
                  {expandedId === row.id && (
                    <tr className="row-detail">
                      <td colSpan={5} className={styles.detailCell}>
                        <div
                          className={`page-card page-card--flush ${styles.detailCard}`}
                        >
                          <div
                            className={`page-card-header ${styles.detailHeader}`}
                          >
                            PRODUCTOS DE LA COMPRA #{row.id}
                          </div>
                          {loadingDetalle === row.id ? (
                            <div
                              className={`empty-state ${styles.emptySmall}`}
                            >
                              Cargando detalles...
                            </div>
                          ) : detallesCache[row.id!] ? (
                            <table className="data-table">
                              <thead>
                                <tr >
                                  <th>Producto</th>
                                  <th className="align-right">Cantidad</th>
                                  <th className="align-right">Costo Unit.</th>
                                  <th className="align-right">Subtotal</th>
                                  <th className="align-right">Acción</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detallesCache[row.id!].map((item) => (
                                  <tr
                                    key={`${item.product_id}-${item.batch_id ?? item.quantity}`}
                                  >
                                    <td>{item.product_name}</td>
                                    <td className="align-right">
                                      {item.quantity}
                                    </td>
                                    <td className="align-right">
                                      {formatPrice(item.cost)}
                                    </td>
                                    <td
                                      className={`align-right ${styles.subtotalCell}`}
                                    >
                                      {formatPrice(item.subtotal)}
                                    </td>
                                    <td className="align-right">
                                      <button
                                        onClick={() =>
                                          openReturn(row.id!, item)
                                        }
                                        className="btn-mini-solid"
                                      >
                                        Devolver
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div
                              className={`empty-state ${styles.emptySmall}`}
                            >
                              No se pudieron cargar los detalles.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="empty-state">No se encontraron compras</div>
        )}
      </div>
      {returnTarget && (
        <div className="overlay">
          <div className="modal">
            <h3 className={styles.modalTitle}>Devolución a proveedor</h3>
            <p className="text-secondary">
              {returnTarget.name} · máximo pendiente: {returnTarget.max}
            </p>
            <label className={`field ${styles.modalField}`}>
              Cantidad
              <input
                type="number"
                min="0.01"
                max={returnTarget.max}
                value={returnQuantity}
                onChange={(e) => setReturnQuantity(e.target.value)}
              />
            </label>
            <label className={`field ${styles.modalField}`}>
              Motivo
              <input
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
              />
            </label>
            <div className={styles.modalActions}>
              <button
                onClick={() => setReturnTarget(null)}
                className="btn-mini-outline"
              >
                Cancelar
              </button>
              <button onClick={submitReturn} className="btn-mini-solid">
                Confirmar devolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialCompras;
