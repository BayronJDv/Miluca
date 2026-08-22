import React, { useCallback, useEffect, useMemo, useState } from "react";
import { confirm } from "@tauri-apps/plugin-dialog";
import PageHeader from "../components/design/PageHeader";
import Btn from "../components/design/Btn";
import { Icon } from "../components/design/Icon";
import {
  crearProducto,
  eliminarProducto,
  modificarProducto,
  obtenerProductos,
  Producto,
} from "../db/products";
import {
  obtenerKardexProducto,
  obtenerLotes,
  ProductBatch,
} from "../db/batches";
import { userIdAtom } from "../store/UserAtom";
import { useAtomValue } from "jotai";

type FormState = {
  name: string;
  code: string;
  price: string;
  alert_stock: string;
  generic_name: string;
  active_ingredient: string;
  dosage_form: string;
  concentration: string;
  presentation: string;
  manufacturer: string;
  category: NonNullable<Producto["category"]>;
  requires_prescription: boolean;
  requires_lot_control: boolean;
  has_invima: boolean;
  invima_info: string;
  wholesale_price: string;
  wholesale_min_qty: string;
};

const emptyForm = (): FormState => ({
  name: "",
  code: "",
  price: "",
  alert_stock: "5",
  generic_name: "",
  active_ingredient: "",
  dosage_form: "",
  concentration: "",
  presentation: "",
  manufacturer: "",
  category: "medicamento",
  requires_prescription: false,
  requires_lot_control: true,
  has_invima: false,
  invima_info: "",
  wholesale_price: "",
  wholesale_min_qty: "",
});

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label style={{ gridColumn: wide ? "1 / -1" : undefined }}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function ProductForm({
  value,
  editing,
  onChange,
  onSave,
  onClose,
  reason,
  setReason,
}: {
  value: FormState;
  editing: boolean;
  onChange: (key: keyof FormState, value: string | boolean) => void;
  onSave: () => void;
  onClose: () => void;
  reason: string;
  setReason: (value: string) => void;
}) {
  return (
    <div className="modal--sheet modal">
      <div className="modal-header">
        <div>
          <div className="font-headline-sm">
            {editing
              ? "Editar producto farmacéutico"
              : "Nuevo producto farmacéutico"}
          </div>
          <div className="field-label mt-xs">
            El inventario físico se registra mediante compras y lotes.
          </div>
        </div>
        <button onClick={onClose} className="btn-icon">
          <Icon name="close" size={20} />
        </button>
      </div>
      <div className="modal-body">
        <div className="section-label">IDENTIFICACIÓN Y PRESENTACIÓN</div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Field label="Nombre comercial *" wide>
            <input
              className="control"
              value={value.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Ej. Dolex 500 mg"
            />
          </Field>
          <Field label="Código de barras *">
            <input
              className="control"
              value={value.code}
              onChange={(e) => onChange("code", e.target.value)}
              placeholder="770..."
            />
          </Field>
          <Field label="Nombre genérico">
            <input
              className="control"
              value={value.generic_name}
              onChange={(e) => onChange("generic_name", e.target.value)}
              placeholder="Acetaminofén"
            />
          </Field>
          <Field label="Principio activo">
            <input
              className="control"
              value={value.active_ingredient}
              onChange={(e) => onChange("active_ingredient", e.target.value)}
            />
          </Field>
          <Field label="Forma farmacéutica">
            <input
              className="control"
              value={value.dosage_form}
              onChange={(e) => onChange("dosage_form", e.target.value)}
              placeholder="Tableta, jarabe..."
            />
          </Field>
          <Field label="Concentración">
            <input
              className="control"
              value={value.concentration}
              onChange={(e) => onChange("concentration", e.target.value)}
              placeholder="500 mg"
            />
          </Field>
          <Field label="Presentación">
            <input
              className="control"
              value={value.presentation}
              onChange={(e) => onChange("presentation", e.target.value)}
              placeholder="Caja x 30 tabletas"
            />
          </Field>
          <Field label="Fabricante / laboratorio">
            <input
              className="control"
              value={value.manufacturer}
              onChange={(e) => onChange("manufacturer", e.target.value)}
            />
          </Field>
          <Field label="Categoría">
            <select
              className="control"
              value={value.category}
              onChange={(e) => onChange("category", e.target.value)}
            >
              {[
                ["medicamento", "Medicamento"],
                ["dispositivo_medico", "Dispositivo médico"],
                ["cosmetico", "Cosmético"],
                ["alimento", "Alimento"],
                ["otro", "Otro"],
              ].map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="section-label mt-lg">REGULACIÓN Y TRAZABILIDAD</div>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={value.requires_lot_control}
              onChange={(e) =>
                onChange("requires_lot_control", e.target.checked)
              }
            />{" "}
            Exige control de lote y vencimiento
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={value.requires_prescription}
              onChange={(e) =>
                onChange("requires_prescription", e.target.checked)
              }
            />{" "}
            Requiere fórmula médica
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={value.has_invima}
              onChange={(e) => onChange("has_invima", e.target.checked)}
            />{" "}
            Tiene registro INVIMA activo
          </label>
          {value.has_invima && (
            <Field label="Registro INVIMA o enlace" wide>
              <input
                className="control"
                value={value.invima_info}
                onChange={(e) => onChange("invima_info", e.target.value)}
                placeholder="RSA..., INVIMA o URL"
              />
            </Field>
          )}
        </div>

        <div className="section-label mt-lg">PRECIOS Y ALERTAS</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
          }}
        >
          <Field label="Precio de venta *">
            <input
              type="number"
              min="0"
              className="control"
              value={value.price}
              onChange={(e) => onChange("price", e.target.value)}
            />
          </Field>
          <Field label="Stock mínimo">
            <input
              type="number"
              min="0"
              className="control"
              value={value.alert_stock}
              onChange={(e) => onChange("alert_stock", e.target.value)}
            />
          </Field>
          <Field label="Costo">
            <div className="control control--readonly">Se captura por lote</div>
          </Field>
          <Field label="Precio mayorista">
            <input
              type="number"
              min="0"
              className="control"
              value={value.wholesale_price}
              onChange={(e) => onChange("wholesale_price", e.target.value)}
              placeholder="Opcional"
            />
          </Field>
          <Field label="Cantidad mínima mayorista">
            <input
              type="number"
              min="1"
              className="control"
              value={value.wholesale_min_qty}
              onChange={(e) => onChange("wholesale_min_qty", e.target.value)}
              placeholder="Ej. 12"
            />
          </Field>
          <div
            className="field-label"
            style={{ alignSelf: "end", paddingBottom: 9 }}
          >
            Se aplica automáticamente en el POS al alcanzar la cantidad.
          </div>
        </div>
        {editing && (
          <div className="mt-md">
            <Field label="Razón de modificación *">
              <input
                className="control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Corrección de precio, datos regulatorios..."
              />
            </Field>
          </div>
        )}
      </div>
      <div className="modal-footer">
        <Btn variant="ghost" onClick={onClose}>
          Cancelar
        </Btn>
        <Btn onClick={onSave}>
          {editing ? "Guardar cambios" : "Crear producto"}
        </Btn>
      </div>
    </div>
  );
}

function toForm(product: Producto): FormState {
  return {
    name: product.name,
    code: product.code,
    price: String(product.price),
    alert_stock: String(product.alert_stock ?? 5),
    generic_name: product.generic_name ?? "",
    active_ingredient: product.active_ingredient ?? "",
    dosage_form: product.dosage_form ?? "",
    concentration: product.concentration ?? "",
    presentation: product.presentation ?? "",
    manufacturer: product.manufacturer ?? "",
    category: product.category ?? "otro",
    requires_prescription: Boolean(product.requires_prescription),
    requires_lot_control: Boolean(product.requires_lot_control),
    has_invima: Boolean(product.has_invima),
    invima_info: product.invima_info ?? "",
    wholesale_price:
      product.wholesale_price == null ? "" : String(product.wholesale_price),
    wholesale_min_qty:
      product.wholesale_min_qty == null
        ? ""
        : String(product.wholesale_min_qty),
  };
}

export default function Inventario() {
  const [items, setItems] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Producto | null>(null);
  const [detail, setDetail] = useState<Producto | null>(null);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [reason, setReason] = useState("");
  const userId = useAtomValue(userIdAtom);
  const load = useCallback(async () => setItems(await obtenerProductos()), []);
  useEffect(() => {
    load();
  }, [load]);
  const filtered = useMemo(
    () =>
      items.filter((p) =>
        `${p.name} ${p.code} ${p.generic_name ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [items, search],
  );
  const update = (key: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const openCreate = () => {
    setEditing(null);
    setShowCreate(true);
    setForm(emptyForm());
    setReason("");
  };
  const save = async () => {
    if (!form.name.trim() || !form.code.trim() || !form.price)
      return alert("Nombre, código de barras y precio son obligatorios.");
    const payload: Producto = {
      name: form.name.trim(),
      code: form.code.trim(),
      price: Number(form.price),
      stock: 0,
      cost: 0,
      alert_stock: Number(form.alert_stock) || 0,
      generic_name: form.generic_name || null,
      active_ingredient: form.active_ingredient || null,
      dosage_form: form.dosage_form || null,
      concentration: form.concentration || null,
      presentation: form.presentation || null,
      manufacturer: form.manufacturer || null,
      category: form.category,
      requires_prescription: Number(form.requires_prescription),
      requires_lot_control: Number(form.requires_lot_control),
      has_invima: Number(form.has_invima),
      invima_info: form.invima_info || null,
      wholesale_price: form.wholesale_price
        ? Number(form.wholesale_price)
        : null,
      wholesale_min_qty: form.wholesale_min_qty
        ? Number(form.wholesale_min_qty)
        : null,
    };
    try {
      if (editing?.id) {
        if (!reason.trim()) return alert("Indica la razón de modificación.");
        await modificarProducto(editing.id, payload, reason, userId);
      } else await crearProducto(payload);
      await load();
      setEditing(null);
      setShowCreate(false);
      setForm(emptyForm());
    } catch (error) {
      alert(String(error));
    }
  };
  const openDetail = async (product: Producto) => {
    setDetail(product);
    const [lotRows, movementRows] = await Promise.all([
      obtenerLotes(product.id!),
      obtenerKardexProducto(product.id!),
    ]);
    setBatches(lotRows);
    setMovements(movementRows as any[]);
  };
  const remove = async (product: Producto) => {
    if (!product.id) return;
    const ok = await confirm(`¿Eliminar ${product.name}?`, {
      title: "Eliminar producto",
      kind: "warning",
      okLabel: "Eliminar",
      cancelLabel: "Cancelar",
    });
    if (ok) {
      await eliminarProducto(product.id);
      await load();
    }
  };
  const totalValue = items.reduce((sum, p) => sum + (p.cost || 0) * p.stock, 0);
  const lowStock = items.filter((p) => p.stock <= (p.alert_stock ?? 5)).length;
  return (
    <div className="fade-up">
      <PageHeader
        title="Inventario farmacéutico"
        subtitle="Catálogo, trazabilidad por lote, regulación y precios."
        actions={
          <Btn icon="plus" onClick={openCreate}>
            NUEVO PRODUCTO
          </Btn>
        }
      />
      <div className="stat-grid">
        {[
          ["Productos", items.length],
          ["Stock bajo", lowStock],
          ["Valor inventario", `$${totalValue.toLocaleString("es-CO")}`],
          [
            "Control de lote",
            items.filter((p) => p.requires_lot_control).length,
          ],
        ].map(([label, value]) => (
          <div key={String(label)} className="stat-card">
            <div className="stat-label">{label}</div>
            <strong className="stat-value">{value}</strong>
          </div>
        ))}
      </div>
      <div className="mb-sm">
        <input
          className="control"
          style={{ maxWidth: 420 }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, genérico o código de barras..."
        />
      </div>
      <div className="page-card page-card--flush">
        <table className="data-table" style={{ minWidth: 950 }}>
          <thead>
            <tr>
              {[
                "PRODUCTO",
                "CÓDIGO",
                "CATEGORÍA",
                "PRECIO",
                "MAYORISTA",
                "STOCK",
                "TRAZABILIDAD",
                "ACCIONES",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <strong>{p.name}</strong>
                  <div className="stat-label">
                    {p.generic_name ||
                      p.active_ingredient ||
                      "Sin nombre genérico"}
                  </div>
                </td>
                <td>{p.code}</td>
                <td>{p.category?.replace("_", " ")}</td>
                <td style={{ fontWeight: 700 }}>
                  ${p.price.toLocaleString("es-CO")}
                </td>
                <td>
                  {p.wholesale_price
                    ? `$${p.wholesale_price.toLocaleString("es-CO")} / ${p.wholesale_min_qty}`
                    : "No definido"}
                </td>
                <td
                  style={{
                    fontWeight: 800,
                    color:
                      p.stock <= (p.alert_stock ?? 5)
                        ? "var(--color-danger)"
                        : undefined,
                  }}
                >
                  {p.stock}
                </td>
                <td style={{ fontSize: 11 }}>
                  <div>
                    {p.requires_lot_control ? "Lote obligatorio" : "Lote S/N"}
                  </div>
                  <div
                    style={{
                      color: p.has_invima ? "var(--color-success)" : undefined,
                    }}
                  >
                    {p.has_invima ? "INVIMA activo" : "Sin INVIMA"}
                  </div>
                </td>
                <td style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    title="Ver lotes y kardex"
                    onClick={() => openDetail(p)}
                    className="btn-icon"
                  >
                    <Icon name="inventory" size={18} />
                  </button>
                  <button
                    title="Editar"
                    onClick={() => {
                      setEditing(p);
                      setForm(toForm(p));
                      setReason("");
                    }}
                    className="btn-icon"
                  >
                    <Icon name="edit" size={18} />
                  </button>
                  <button
                    title="Eliminar"
                    onClick={() => remove(p)}
                    className="btn-icon btn-icon--danger"
                  >
                    <Icon name="delete" size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={8} className="empty-state">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {(editing !== null || showCreate) && (
        <div className="overlay">
          <ProductForm
            value={form}
            editing={Boolean(editing)}
            onChange={update}
            onSave={save}
            onClose={() => {
              setEditing(null);
              setShowCreate(false);
            }}
            reason={reason}
            setReason={setReason}
          />
        </div>
      )}
      {detail && (
        <div className="overlay">
          <div className="modal modal--detail">
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0 }}>{detail.name}</h2>
                <p className="stat-label mt-xs">
                  Lotes físicos y kardex inmutable
                </p>
              </div>
              <button onClick={() => setDetail(null)} className="btn-icon">
                <Icon name="close" />
              </button>
            </div>
            <h3>Lotes</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>LOTE</th>
                  <th>FABRICACIÓN</th>
                  <th>VENCIMIENTO</th>
                  <th>CANTIDAD</th>
                  <th>COSTO</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>{b.lot_number}</td>
                    <td>{b.manufacture_date || "-"}</td>
                    <td>{b.expiration_date || "-"}</td>
                    <td>{b.quantity}</td>
                    <td>${b.cost.toLocaleString("es-CO")}</td>
                    <td>{b.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 style={{ marginTop: 24 }}>Kardex</h3>
            <div style={{ maxHeight: 220, overflow: "auto" }}>
              {movements.map((m) => (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid var(--color-outline-variant)",
                    padding: "9px 0",
                    fontSize: 12,
                  }}
                >
                  <span>
                    {m.movement_date?.slice(0, 10)} · {m.movement_type} · lote{" "}
                    {m.lot_number}
                  </span>
                  <strong>{m.quantity}</strong>
                </div>
              ))}
              {!movements.length && (
                <p className="stat-label">Sin movimientos registrados.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
