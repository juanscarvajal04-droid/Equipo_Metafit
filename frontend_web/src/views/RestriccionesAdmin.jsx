import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useToast } from "../hooks/useToast";
import { useApi } from "../hooks/useApi";
import { useMutation } from "../hooks/useMutation";
import {
  fetchRestricciones,
  crearRestriccion,
  actualizarRestriccion,
  eliminarRestriccion,
  TIPOS_RESTRICCION,
  TIPO_ICONO,
  FORM_RESTRICCION_VACIO,
} from "../services/restriccionService";
import { trackEvent } from "../utils/analytics";
import s from "./RestriccionesAdmin.module.css";

const TIPO_CLASS = {
  Enfermedad: s.badgeEnfermedad,
  Lesion: s.badgeLesion,
  Alergia: s.badgeAlergia,
  Medicamento: s.badgeMedicamento,
  Otra: s.badgeOtra,
};

export default function RestriccionesAdmin() {
  const { toast, showToast } = useToast();

  const {
    data: restricciones,
    loading,
    execute: loadRestricciones,
  } = useApi(fetchRestricciones);

  const { mutate: handleCreate } = useMutation(crearRestriccion);
  const { mutate: handleUpdate } = useMutation(actualizarRestriccion);
  const { mutate: handleDelete } = useMutation(eliminarRestriccion);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_RESTRICCION_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    loadRestricciones();
  }, [loadRestricciones]);

  const abrirNuevo = () => {
    setEditando(null);
    setForm(FORM_RESTRICCION_VACIO);
    setModalAbierto(true);
  };

  const abrirEditar = (r) => {
    setEditando(r);
    setForm({
      nombre_restriccion: r.nombre_restriccion,
      tipo: r.tipo || "Otra",
      efecto_relevante: r.efecto_relevante || "",
    });
    setModalAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre_restriccion.trim()) {
      showToast("El nombre de la restricción es obligatorio", "danger");
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        const id = editando.id_restriccion ?? editando.id;
        await handleUpdate(id, form);
        showToast("Restricción actualizada", "success");
        trackEvent("metaFit_restriccion_actualizada", { id });
      } else {
        const res = await handleCreate(form);
        showToast("Restricción creada", "success");
        trackEvent("metaFit_restriccion_creada", { id: res?.id });
      }
      setModalAbierto(false);
      await loadRestricciones();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || "Error al guardar", "danger");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async (r) => {
    const nombre = r.nombre_restriccion || "";
    if (!window.confirm(`¿Eliminar la restricción "${nombre}"?`)) return;
    try {
      const id = r.id_restriccion ?? r.id;
      await handleDelete(id);
      showToast("Restricción eliminada", "success");
      trackEvent("metaFit_restriccion_eliminada", { id });
      await loadRestricciones();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || "Error al eliminar", "danger");
    }
  };

  const lista =
    (Array.isArray(restricciones) ? restricciones : []).filter((r) => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        (r.nombre_restriccion || "").toLowerCase().includes(q) ||
        (r.tipo || "").toLowerCase().includes(q)
      );
    });

  return (
    <AppLayout>
      {toast.msg && (
        <div
          className={toast.type === "danger" ? s.alertDanger : s.alertSuccess}
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            padding: "0.5rem 1rem",
            borderRadius: 8,
            color: "#fff",
            background: toast.type === "danger" ? "#e31c25" : "#198754",
          }}
        >
          {toast.msg}
        </div>
      )}

      <div className={s.page}>
        <div className={s.headerRow}>
          <div>
            <h1 className={s.headerTitle}>🛡️ Gestión de Restricciones</h1>
            <p className={s.headerSub}>
              Catálogo de condiciones médicas, lesiones, alergias y medicamentos
            </p>
          </div>
          <button type="button" className={s.btnPrimary} onClick={abrirNuevo}>
            + Nueva restricción
          </button>
        </div>

        <input
          type="text"
          className={s.inputDark}
          placeholder="Buscar por nombre o tipo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ maxWidth: 360, marginBottom: 16 }}
        />

        <div className={s.tableCard}>
          {loading ? (
            <div style={{ padding: "3rem 0", textAlign: "center", color: "var(--mf-muted)" }}>
              Cargando restricciones...
            </div>
          ) : lista.length === 0 ? (
            <div className={s.emptyState}>No se encontraron restricciones.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Efecto relevante</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((r, idx) => {
                    const id = r.id_restriccion ?? r.id;
                    return (
                      <tr key={id}>
                        <td style={{ color: "var(--mf-muted)", fontSize: "0.78rem" }}>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>
                          {TIPO_ICONO[r.tipo] || "📌"} {r.nombre_restriccion}
                        </td>
                        <td>
                          <span className={`${s.badge} ${TIPO_CLASS[r.tipo] || s.badgeOtra}`}>
                            {r.tipo || "Otra"}
                          </span>
                        </td>
                        <td style={{ color: "var(--mf-muted)" }}>{r.efecto_relevante || "—"}</td>
                        <td>
                          <div className={s.acciones}>
                            <button type="button" className={s.btnIcon} title="Editar" onClick={() => abrirEditar(r)}>
                              ✏️
                            </button>
                            <button
                              type="button"
                              className={`${s.btnIcon} ${s.btnIconDanger}`}
                              title="Eliminar"
                              onClick={() => confirmarEliminar(r)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {modalAbierto && (
          <div className={s.modalOverlay} onClick={() => !guardando && setModalAbierto(false)}>
            <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
              <form onSubmit={guardar}>
                <div className={s.modalHeader}>
                  <h5 className={s.modalTitle}>
                    {editando ? "✏️ Editar restricción" : "➕ Nueva restricción"}
                  </h5>
                  <button
                    type="button"
                    className={s.btnOutline}
                    onClick={() => !guardando && setModalAbierto(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className={s.modalBody}>
                  <div>
                    <label className={s.labelText}>Nombre *</label>
                    <input
                      className={s.inputDark}
                      value={form.nombre_restriccion}
                      onChange={(e) => setForm({ ...form, nombre_restriccion: e.target.value })}
                      placeholder="Ej: Asma"
                      required
                    />
                  </div>
                  <div>
                    <label className={s.labelText}>Tipo *</label>
                    <select
                      className={s.inputDark}
                      value={form.tipo}
                      onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    >
                      {TIPOS_RESTRICCION.map((t) => (
                        <option key={t} value={t}>
                          {TIPO_ICONO[t]} {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Efecto relevante</label>
                    <textarea
                      className={`${s.inputDark} ${s.textareaDesc}`}
                      value={form.efecto_relevante}
                      onChange={(e) => setForm({ ...form, efecto_relevante: e.target.value })}
                      placeholder="Ej: Evitar esfuerzos de alta intensidad"
                    />
                  </div>
                </div>
                <div className={s.modalFooter}>
                  <button
                    type="button"
                    className={s.btnOutline}
                    onClick={() => !guardando && setModalAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className={s.btnPrimary} disabled={guardando}>
                    {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}