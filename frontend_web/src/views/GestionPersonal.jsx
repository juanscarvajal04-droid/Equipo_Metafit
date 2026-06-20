import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import s from "./GestionPersonal.module.css";

// ── Constantes ────────────────────────────────────────────────────────────────
const ROLES       = ["Administrador", "Recepcionista", "Entrenador"];
const ROLES_CREAR = ["Recepcionista", "Entrenador"]; // Al crear, no se puede asignar Admin directamente

const ROLE_BADGE = {
  Administrador: { bg: "linear-gradient(135deg,#7c3aed,#4f46e5)", label: "👑 Admin"         },
  Recepcionista: { bg: "linear-gradient(135deg,#2563eb,#0891b2)", label: "🗂️ Recepcionista"  },
  Entrenador:    { bg: "linear-gradient(135deg,#059669,#0d9488)", label: "🏆 Entrenador"     },
};

const FORM_VACÍO = {
  email: "", password: "", role: "Recepcionista", estado: "Activo",
  nombres: "", apellidos: "",
};

const FORM_EDIT_VACÍO = {
  email: "", password: "", role: "Recepcionista", estado: "Activo",
  nombres: "", apellidos: "",
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function GestionPersonal() {
  const { user: adminUser, authAxios } = useAuth();

  const [personal,     setPersonal]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [busqueda,     setBusqueda]     = useState("");
  const { toast, showToast }            = useToast();

  // Modales
  const [crearModal,   setCrearModal]   = useState(false);
  const [editModal,    setEditModal]    = useState(null);   // user object
  const [deleteModal,  setDeleteModal]  = useState(null);   // user object
  const [formData,     setFormData]     = useState(FORM_VACÍO);
  const [saving,       setSaving]       = useState(false);
  const [formError,    setFormError]    = useState("");

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    authAxios.get("/usuarios")
      .then(({ data }) => setPersonal(data))
      .catch((err) => {
        if (err?.response?.status === 401) { /* interceptor global lo maneja */ }
        else setError("No se pudo cargar el personal.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const filtrados = personal.filter((u) => {
    const t = busqueda.toLowerCase();
    return (
      (u.email || "").toLowerCase().includes(t) ||
      (u.nombres || "").toLowerCase().includes(t) ||
      (u.apellidos || "").toLowerCase().includes(t) ||
      (u.role || u.rol || "").toLowerCase().includes(t)
    );
  });

  // ── CRUD ───────────────────────────────────────────────────────────────────

  /** Crear nuevo usuario en /usuarios */
  const handleCrear = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setFormError("Correo y contraseña son obligatorios.");
      return;
    }
    setSaving(true); setFormError("");
    try {
      // 🔐 NOTA DE PRODUCCIÓN: En un entorno real, la contraseña se encriptaría
      // en el backend con bcrypt ANTES de guardarla en la base de datos:
      //   const salt = await bcrypt.genSalt(12);
      //   const hashedPassword = await bcrypt.hash(plainPassword, salt);
      // El frontend NUNCA debe hashear: solo el servidor tiene acceso al salt.
      // MVP: se envía en texto por HTTPS (TLS cifra el canal de transporte).
      const newUser = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        correo: formData.email,
        contrasena: formData.password,
        rol: formData.role,
        estado: formData.estado || "Activo",
      };
      const { data } = await authAxios.post("/usuarios", newUser);
      setPersonal((prev) => [...prev, data]);
      setCrearModal(false);
      setFormData(FORM_VACÍO);
      showToast(`✅ Usuario "${data.email || data.correo}" creado correctamente.`);
    } catch (err) {
      setFormError(err?.response?.data?.error || err.message || "Error al crear. Verifica el servidor.");
    } finally {
      setSaving(false);
    }
  };

  /** Abrir modal de edición */
  const abrirEditar = (u) => {
    setEditModal(u);
    setFormError("");
    setFormData({
      email:         u.email         || u.correo || "",
      password:      "",
      role:          u.role          || u.rol || "Recepcionista",
      estado: u.estado || "Activo",
      nombres:       u.nombres       || "",
      apellidos:     u.apellidos     || "",
    });
  };

  /** Guardar edición (incluyendo cambio de rol) */
  const handleEditar = async (e) => {
    e.preventDefault();
    if (!formData.email) { setFormError("El correo es obligatorio."); return; }
    setSaving(true); setFormError("");
    try {
      const id = getId(editModal);
      const payload = {
        nombres: formData.nombres,
        apellidos: formData.apellidos,
        correo: formData.email,
        rol: formData.role,
        estado: formData.estado,
      };
      if (formData.password) {
        payload.contrasena = formData.password;
      }
      const { data } = await authAxios.patch(`/usuarios/${id}`, payload);
      setPersonal((prev) => prev.map((u) => getId(u) === id ? data : u));
      setEditModal(null);
      showToast(`✅ "${data.email}" actualizado correctamente.`);
    } catch {
      setFormError("Error al guardar. Verifica el servidor.");
    } finally {
      setSaving(false);
    }
  };

  /** Eliminar usuario */
  const handleEliminar = async () => {
    if (!deleteModal) return;
    setSaving(true);
    try {
      const id = getId(deleteModal);
      await authAxios.delete(`/usuarios/${id}`);
      setPersonal((prev) => prev.filter((u) => getId(u) !== id));
      setDeleteModal(null);
      showToast(`🗑️ Usuario eliminado correctamente.`, "danger");
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al eliminar. Verifica el servidor.";
      showToast(`❌ ${msg}`, "danger");
    } finally {
      setSaving(false);
    }
  };

  /** Cambio rápido de estado */
  const cambiarEstado = async (u, nuevoEstado) => {
    try {
      const id = getId(u);
      const { data } = await authAxios.patch(`/usuarios/${id}`, { estado: nuevoEstado });
      setPersonal((prev) => prev.map((x) => getId(x) === id ? data : x));
      showToast(`🔄 Estado de "${u.email}" → "${nuevoEstado}"`);
    } catch {
      showToast("❌ Error al cambiar estado.", "danger");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* Toast */}
      {toast.msg && (
        <div
          className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type === "danger" ? "danger" : "dark"} shadow-lg py-2 px-3`}
          style={{ zIndex: 9999, minWidth: 300 }}
        >
          {toast.msg}
        </div>
      )}

      <div className="container-fluid py-4 px-3 px-md-4">

        {/* ── Encabezado ── */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
              <span className={`d-inline-flex align-items-center justify-content-center rounded-2 ${s.headerIcon}`}>
                🛡️
              </span>
              Gestión de Personal
            </h1>
            <small className="text-muted">
              Módulo exclusivo del Administrador · Crear, editar, cambiar roles y eliminar empleados
            </small>
          </div>

          {/* Badge Admin */}
          <div className="d-flex align-items-center gap-2">
            <span className={`badge px-3 py-2 ${s.badgeAdmin}`}>
              👑 Super Usuario — Acceso Total
            </span>
            <button
              id="btn-crear-personal"
              className={`btn btn-sm ${s.btnCrear}`}
              onClick={() => { setCrearModal(true); setFormData(FORM_VACÍO); setFormError(""); }}
            >
              ➕ Nuevo empleado
            </button>
          </div>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0 flex-wrap gap-2">
            <span className="fw-semibold text-muted small">
              {filtrados.length} empleado{filtrados.length !== 1 ? "s" : ""}
            </span>
            <input
              id="busqueda-personal"
              type="text"
              className={`form-control form-control-sm ${s.searchInput}`}
              placeholder="🔍 Nombre, correo, rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="card-body p-0">
            {error   && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className={`spinner-border ${s.spinnerPurple}`} /></div>}

            {!loading && !error && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">#</th>
                      <th>Empleado</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      <th className="text-center pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-5">
                          {busqueda ? `Sin resultados para "${busqueda}"` : "No hay empleados registrados."}
                        </td>
                      </tr>
                    ) : filtrados.map((u, idx) => {
                      const rolKey   = u.role || u.rol || "Recepcionista";
                      const badge    = ROLE_BADGE[rolKey] || ROLE_BADGE.Recepcionista;
                      const isMe     = getId(u) === getId(adminUser);
                      const estado   = u.estado || "Activo";
                      const nombre   = [u.nombres, u.apellidos].filter(Boolean).join(" ") || u.email;

                      return (
                        <tr key={getId(u)}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>

                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={`${s.avatar} ${isMe ? s.avatarMe : ""}`} style={{ background: badge.bg }}>
                                {(u.email || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombre}</div>
                                {isMe && <span className={s.badgeTu}>Tú</span>}
                              </div>
                            </div>
                          </td>

                          <td><small className="text-muted">{u.email}</small></td>

                          <td>
                            <span className={`badge px-2 py-1 ${s.badgeRol}`} style={{ background: badge.bg }}>
                              {badge.label}
                            </span>
                          </td>

                          <td>
                            <select
                              className={`form-select form-select-sm border-0 p-0 ${s.estadoSelect}`}
                              value={estado}
                              onChange={(e) => cambiarEstado(u, e.target.value)}
                            >
                              {["Activo", "Inactivo", "Pendiente"].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>

                          <td>
                            <small className="text-muted">
                              {u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString("es-CO") : "—"}
                            </small>
                          </td>

                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                className={`btn btn-sm ${s.btnIcon}`}
                                title="Editar empleado"
                                onClick={() => abrirEditar(u)}
                              >
                                ✏️
                              </button>
                              <button
                                className={`btn btn-sm ${s.btnIconDelete}`}
                                title="Eliminar empleado"
                                disabled={isMe}
                                onClick={() => !isMe && setDeleteModal(u)}
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
        </div>

        <div className="mt-4">
          <div className="row g-3">
            {[
              { rol: "Administrador", icon: "👑", color: "#7c3aed", permisos: ["✅ Dashboard", "✅ Afiliados", "✅ Personal"] },
              { rol: "Recepcionista", icon: "🗂️", color: "#2563eb", permisos: ["✅ Afiliados", "👁️ Lectura"] },
              { rol: "Entrenador", icon: "🏆", color: "#059669", permisos: ["👁️ Lectura", "✅ Rutinas"] },
            ].map(({ rol, icon, color, permisos }) => (
              <div key={rol} className="col-md-4">
                <div className={`card border-0 h-100 ${s.cardRol}`} style={{ borderColor: color }}>
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className="rounded-2 d-flex align-items-center justify-content-center text-white" style={{ width: 32, height: 32, background: color }}>
                        {icon}
                      </span>
                      <strong className={s.rolTitle} style={{ color }}>{rol}</strong>
                    </div>
                    <ul className="list-unstyled mb-0">
                      {permisos.map((p) => (
                        <li key={p} className={`small text-muted mb-1 ${s.permisosItem}`}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {crearModal && (
        <ModalPersonal
          titulo="➕ Nuevo Empleado"
          colorHeader={s.modalHeaderPurple}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCrear}
          onCancel={() => { setCrearModal(false); setFormData(FORM_VACÍO); }}
          saving={saving}
          formError={formError}
          isEdit={false}
        />
      )}

      {editModal && (
        <ModalPersonal
          titulo={`✏️ Editar — ${editModal.email}`}
          colorHeader={s.modalHeaderRed}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEditar}
          onCancel={() => setEditModal(null)}
          saving={saving}
          formError={formError}
          isEdit={true}
        />
      )}

      {deleteModal && (
        <div className={`modal d-block ${s.modalOverlay}`} onClick={() => !saving && setDeleteModal(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg">
              <div className={`modal-header ${s.modalHeaderRed}`}>
                <h5 className="modal-title">⚠️ Eliminar empleado</h5>
                <button className="btn-close btn-close-white" onClick={() => setDeleteModal(null)} />
              </div>
              <div className="modal-body text-center py-4">
                <div className={s.deleteEmoji}>🗑️</div>
                <p className="mb-1">¿Estás seguro de eliminar a <strong>{deleteModal.email}</strong>?</p>
              </div>
              <div className="modal-footer border-0 justify-content-center">
                <button className="btn btn-outline-secondary btn-sm px-4" onClick={() => setDeleteModal(null)}>Cancelar</button>
                <button className="btn btn-danger btn-sm px-4" onClick={handleEliminar} disabled={saving}>
                  {saving ? "..." : "🗑️ Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function ModalPersonal({ titulo, colorHeader, formData, setFormData, onSubmit, onCancel, saving, formError, isEdit }) {
  const [showPassword, setShowPassword] = useState(false);
  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  return (
    <div className={`modal d-block ${s.modalOverlay}`} onClick={() => !saving && onCancel()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg">
          <div className={`modal-header ${colorHeader}`}>
            <h5 className="modal-title text-white">{titulo}</h5>
            <button className="btn-close btn-close-white" onClick={onCancel} disabled={saving} />
          </div>

          <form onSubmit={onSubmit}>
            <div className={`modal-body ${s.modalBodyScroll}`}>
              {formError && <div className="alert alert-danger py-2 mb-3"><small>⚠️ {formError}</small></div>}
              <div className="row g-3">
                {/* Nombres y Apellidos */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Nombres</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.nombres}
                    onChange={(e) => set("nombres", e.target.value)}
                    placeholder="Ej: Carlos"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Apellidos</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.apellidos}
                    onChange={(e) => set("apellidos", e.target.value)}
                    placeholder="Ej: Ramírez"
                  />
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Correo electrónico <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={formData.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="empleado@metafit.com"
                  />
                </div>

                  {/* Contraseña */}
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">
                      Contraseña {!isEdit && <span className="text-danger">*</span>}
                      {isEdit && <span className="text-muted small"> (dejar vacío para no cambiar)</span>}
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        required={!isEdit}
                        value={formData.password}
                        onChange={(e) => set("password", e.target.value)}
                        placeholder={isEdit ? "••••••••" : "Nueva contraseña"}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        tabIndex={-1}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                {/* Rol — selector destacado */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Rol del empleado <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select fw-semibold ${s.rolSelect}`}
                    value={formData.role}
                    onChange={(e) => set("role", e.target.value)}
                  >
                    {(isEdit ? ROLES : ROLES_CREAR).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <div className="form-text">
                    {formData.role === "Administrador" && "⚠️ Este empleado tendrá acceso total al sistema."}
                    {formData.role === "Recepcionista" && "🗂️ Puede gestionar afiliados y ver rutinas/dietas."}
                    {formData.role === "Entrenador"    && "🏆 Puede gestionar rutinas/dietas y ver afiliados."}
                  </div>
                </div>

                {/* Estado de cuenta */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Estado de cuenta</label>
                  <select
                    className="form-select"
                    value={formData.estado}
                    onChange={(e) => set("estado", e.target.value)}
                  >
                    {["Activo", "Inactivo", "Pendiente"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-4"
                onClick={onCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                id={isEdit ? "btn-guardar-personal" : "btn-confirmar-crear-personal"}
                type="submit"
                className={`btn btn-sm ${s.btnGuardar}`}
                style={{ background: colorHeader }}
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                  : isEdit ? "💾 Guardar cambios" : "✅ Crear empleado"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
