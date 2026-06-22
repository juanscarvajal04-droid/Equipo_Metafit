import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import s from "./GestionPersonal.module.css";

// ─── Constants ───────────────────────────────────────────────
const ROLES = ["Admin", "Recepcionista", "Entrenador"];
const ESTADOS = ["Activo", "Inactivo", "Pendiente"];

const ROL_MAP = {
  admin: "Admin",
  recepcionista: "Recepcionista",
  entrenador: "Entrenador",
};

const ESTADO_MAP = {
  activo: "Activo",
  inactivo: "Inactivo",
  pendiente: "Pendiente",
};

function badgeRol(rol) {
  const key = (rol || "").toLowerCase();
  const cls = key === "admin" ? s.badgeAdmin
    : key === "recepcionista" ? s.badgeRecepcionista
    : key === "entrenador" ? s.badgeEntrenador
    : "";
  return <span className={cls}>{ROL_MAP[key] || rol || "—"}</span>;
}

function badgeEstado(estado) {
  const key = (estado || "").toLowerCase();
  const cls = key === "activo" ? s.badgeActivo
    : key === "inactivo" ? s.badgeInactivo
    : key === "pendiente" ? s.badgePendiente
    : "";
  return <span className={cls}>{ESTADO_MAP[key] || estado || "—"}</span>;
}

const INITIAL_FORM = {
  nombres: "",
  apellidos: "",
  email: "",
  password: "",
  rol: "Recepcionista",
  estado: "Activo",
};

export default function GestionPersonal() {
  const { user, authAxios } = useAuth();
  const { toast, showToast } = useToast();

  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [modalType, setModalType] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchPersonal = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authAxios.get("/usuarios");
      setPersonal(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Error al cargar personal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const openCreate = () => {
    setFormData({ ...INITIAL_FORM });
    setEditingUser(null);
    setModalType("create");
  };

  const openEdit = (emp) => {
    setFormData({
      nombres: emp.nombres || "",
      apellidos: emp.apellidos || "",
      email: emp.correo || emp.email || "",
      password: "",
      rol: ROL_MAP[(emp.rol || "").toLowerCase()] || emp.rol || "Recepcionista",
      estado: ESTADO_MAP[(emp.estado || "").toLowerCase()] || emp.estado || "Activo",
    });
    setEditingUser(emp);
    setModalType("edit");
  };

  const closeModal = () => {
    if (saving) return;
    setModalType(null);
    setEditingUser(null);
    setFormData({ ...INITIAL_FORM });
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      showToast("El correo es obligatorio", "danger");
      return;
    }
    if (!formData.password.trim()) {
      showToast("La contraseña es obligatoria", "danger");
      return;
    }
    setSaving(true);
    try {
      await authAxios.post("/usuarios", formData);
      showToast("Empleado creado correctamente");
      closeModal();
      fetchPersonal();
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al crear empleado";
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      showToast("El correo es obligatorio", "danger");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!payload.password.trim()) delete payload.password;
      await authAxios.patch(`/usuarios/${getId(editingUser)}`, payload);
      showToast("Empleado actualizado correctamente");
      closeModal();
      fetchPersonal();
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al actualizar empleado";
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await authAxios.delete(`/usuarios/${getId(deleteTarget)}`);
      showToast("Empleado eliminado correctamente");
      setDeleteTarget(null);
      fetchPersonal();
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al eliminar empleado";
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  const nombreCompleto = (emp) =>
    [emp.nombres, emp.apellidos].filter(Boolean).join(" ") || "Sin nombre";

  const filtrados = personal.filter((p) => {
    const t = searchTerm.toLowerCase();
    return (
      nombreCompleto(p).toLowerCase().includes(t) ||
      (p.correo || p.email || "").toLowerCase().includes(t) ||
      (p.rol || "").toLowerCase().includes(t)
    );
  });

  const currentUserId = getId(user);

  return (
    <AppLayout>
      {toast.msg && (
        <div style={{
          position: "fixed", bottom: 0, right: 0, margin: "1rem", zIndex: 9999,
          borderLeft: toast.type === "danger" ? "4px solid #ef4444" : "4px solid #22c55e",
          background: "#1a1a2e", color: "#e0e0e0", border: "1px solid #252545",
          padding: "0.5rem 1rem", borderRadius: "0.5rem",
        }}>
          {toast.msg}
        </div>
      )}

      <div className={s.page}>
        {/* ── Header ─────────────────────────────────── */}
        <div style={{
          marginBottom: "1.5rem", display: "flex",
          justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <h1 className={s.headerTitle}>👥 Gestión de Personal</h1>
            <small className={s.headerSub}>Administración de empleados</small>
          </div>
          <button type="button" className={s.btnPrimary} onClick={openCreate}>
            ➕ Nuevo empleado
          </button>
        </div>

        {/* ── Search ─────────────────────────────────── */}
        <input
          type="text"
          className={s.searchInput}
          placeholder="🔍 Buscar por nombre, correo o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: "1.25rem" }}
        />

        {/* ── Table ──────────────────────────────────── */}
        <div className={s.tableCard}>
          <div className={s.tableCardHeader}>
            <h5 style={{ fontWeight: 700, margin: 0, color: "#e0e0e0" }}>
              👥 Personal ({filtrados.length})
            </h5>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 0" }}>
              <div className="spinner-border" style={{ color: "#4b9ecb" }} />
            </div>
          ) : error ? (
            <div style={{ padding: "1rem", color: "#ef4444" }}>⚠️ {error}</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={s.emptyState} style={{ textAlign: "center", padding: "2rem 0" }}>
                        Sin resultados.
                      </td>
                    </tr>
                  ) : filtrados.map((emp, i) => (
                    <tr key={getId(emp)}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div
                            className={s.avatarTd}
                            style={{
                              background: `hsl(${(getId(emp) * 47) % 360},65%,55%)`,
                            }}
                          >
                            {(emp.nombres || emp.correo || "?")[0].toUpperCase()}
                          </div>
                          <span style={{ color: "#e0e0e0", fontWeight: 600 }}>
                            {nombreCompleto(emp)}
                          </span>
                        </div>
                      </td>
                      <td>{emp.correo || emp.email || "—"}</td>
                      <td>{badgeRol(emp.rol)}</td>
                      <td>{badgeEstado(emp.estado)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.35rem" }}>
                          <button
                            type="button"
                            className={s.btnIcon}
                            onClick={() => openEdit(emp)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className={s.btnIconDelete}
                            onClick={() => setDeleteTarget(emp)}
                            disabled={getId(emp) === currentUserId}
                            title={getId(emp) === currentUserId ? "No puedes eliminarte a ti mismo" : "Eliminar"}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Modal ─────────────────────── */}
      {modalType && (
        <ModalPersonal
          type={modalType}
          formData={formData}
          setFormData={setFormData}
          onSubmit={modalType === "create" ? handleCrear : handleEditar}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* ── Delete Confirmation Modal ───────────────── */}
      {deleteTarget && (
        <div className={s.modalOverlay} onClick={() => !saving && setDeleteTarget(null)}>
          <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>🗑️ Eliminar empleado</h5>
              <button
                type="button"
                className={s.btnOutline}
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                ✕
              </button>
            </div>
            <div className={s.modalBody}>
              <p style={{ color: "#94a3b8", margin: 0 }}>
                ¿Estás seguro de eliminar a{" "}
                <strong style={{ color: "#e0e0e0" }}>
                  {nombreCompleto(deleteTarget)}
                </strong>?
              </p>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className={s.modalFooter}>
              <button
                type="button"
                className={s.btnOutline}
                onClick={() => setDeleteTarget(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={s.btnDangerSolid}
                onClick={handleDelete}
                disabled={saving}
              >
                {saving ? <span className="spinner-border spinner-border-sm" /> : "🗑️ Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ─── ModalPersonal ────────────────────────────────────────────
function ModalPersonal({ type, formData, setFormData, onSubmit, onClose, saving }) {
  const [showPassword, setShowPassword] = useState(false);
  const isEdit = type === "edit";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className={s.modalOverlay} onClick={() => !saving && onClose()}>
      <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={s.modalHeader}>
          <h5 className={s.modalTitle}>
            {isEdit ? "✏️ Editar empleado" : "➕ Nuevo empleado"}
          </h5>
          <button type="button" className={s.btnOutline} onClick={onClose} disabled={saving}>
            ✕
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div className={s.modalBody}>
            <div style={{ marginBottom: "0.75rem" }}>
              <label className={s.labelText}>Nombres</label>
              <input
                type="text"
                name="nombres"
                className={s.inputDark}
                value={formData.nombres}
                onChange={handleChange}
                placeholder="Nombres"
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label className={s.labelText}>Apellidos</label>
              <input
                type="text"
                name="apellidos"
                className={s.inputDark}
                value={formData.apellidos}
                onChange={handleChange}
                placeholder="Apellidos"
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label className={s.labelText}>Correo electrónico *</label>
              <input
                type="email"
                name="email"
                className={s.inputDark}
                value={formData.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label className={s.labelText}>
                Contraseña {isEdit ? "(dejar vacío para mantener)" : "*"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className={s.inputDark}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={isEdit ? "Nueva contraseña" : "Contraseña"}
                  required={!isEdit}
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "0.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1rem",
                    padding: "0.25rem",
                    lineHeight: 1,
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label className={s.labelText}>Rol</label>
              <select
                name="rol"
                className={s.selectDark}
                value={formData.rol}
                onChange={handleChange}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label className={s.labelText}>Estado</label>
              <select
                name="estado"
                className={s.selectDark}
                value={formData.estado}
                onChange={handleChange}
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={s.modalFooter}>
            <button
              type="button"
              className={s.btnOutline}
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={s.btnPrimary}
              disabled={saving}
            >
              {saving ? <span className="spinner-border spinner-border-sm" /> : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
