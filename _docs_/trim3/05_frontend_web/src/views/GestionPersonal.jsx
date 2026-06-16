import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

// ── Constantes ────────────────────────────────────────────────────────────────
const ROLES       = ["Administrador", "Recepcionista", "Entrenador"];
const ROLES_CREAR = ["Recepcionista", "Entrenador"]; // Al crear, no se puede asignar Admin directamente

const ROLE_BADGE = {
  Administrador: { bg: "linear-gradient(135deg,#7c3aed,#4f46e5)", label: "👑 Admin"         },
  Recepcionista: { bg: "linear-gradient(135deg,#2563eb,#0891b2)", label: "🗂️ Recepcionista"  },
  Entrenador:    { bg: "linear-gradient(135deg,#059669,#0d9488)", label: "🏆 Entrenador"     },
};

const ESTADO_BADGE = {
  Activo:    { cls: "success", icon: "✅" },
  Inactivo:  { cls: "danger",  icon: "🚫" },
  Pendiente: { cls: "warning", icon: "⏳" },
};

const FORM_VACÍO = {
  email: "", password: "", role: "Recepcionista", estado_cuenta: "Activo",
  nombres: "", apellidos: "",
};

const FORM_EDIT_VACÍO = {
  email: "", password: "", role: "Recepcionista", estado_cuenta: "Activo",
  nombres: "", apellidos: "",
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function GestionPersonal() {
  const { user: adminUser, authAxios, logout } = useAuth();
  const navigate = useNavigate();

  const [personal,     setPersonal]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [busqueda,     setBusqueda]     = useState("");
  const [toast,        setToast]        = useState({ msg: "", type: "success" });

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
        if (err?.response?.status === 401) { logout(); navigate("/login"); }
        else setError("No se pudo cargar el personal.");
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const getId = (u) => u._id ?? u.id;

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
        ...formData,
        id: Date.now(),
        rol: formData.role,
        estado_cuenta: formData.estado_cuenta || "Activo",
        fecha_registro: new Date().toISOString(),
        // password_hash: "", // ← En producción este campo reemplaza a 'password'
      };
      const { data } = await authAxios.post("/usuarios", newUser);
      setPersonal((prev) => [...prev, data]);
      setCrearModal(false);
      setFormData(FORM_VACÍO);
      showToast(`✅ Usuario "${data.email}" creado correctamente.`);
    } catch {
      setFormError("Error al crear. Verifica el servidor.");
    } finally {
      setSaving(false);
    }
  };

  /** Abrir modal de edición */
  const abrirEditar = (u) => {
    setEditModal(u);
    setFormError("");
    setFormData({
      email:         u.email         || "",
      password:      u.password      || "",
      role:          u.role          || u.rol || "Recepcionista",
      estado_cuenta: u.estado_cuenta || "Activo",
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
        ...formData,
        rol: formData.role,   // sincronizar campo 'rol' también
      };
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
    } catch {
      showToast("❌ Error al eliminar. Verifica el servidor.", "danger");
    } finally {
      setSaving(false);
    }
  };

  /** Cambio rápido de estado */
  const cambiarEstado = async (u, nuevoEstado) => {
    try {
      const id = getId(u);
      const { data } = await authAxios.patch(`/usuarios/${id}`, { estado_cuenta: nuevoEstado });
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
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2"
                style={{
                  width: 36, height: 36,
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  fontSize: "1.1rem",
                }}
              >
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
            <span
              className="badge px-3 py-2"
              style={{
                background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                fontSize: "0.72rem",
                letterSpacing: "0.04em",
              }}
            >
              👑 Super Usuario — Acceso Total
            </span>
            <button
              id="btn-crear-personal"
              className="btn btn-sm fw-semibold text-white px-4"
              style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", border: "none" }}
              onClick={() => { setCrearModal(true); setFormData(FORM_VACÍO); setFormError(""); }}
            >
              ➕ Nuevo empleado
            </button>
          </div>
        </div>

        {/* ── Tabla de Personal ── */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0 flex-wrap gap-2">
            <span className="fw-semibold text-muted small">
              {filtrados.length} empleado{filtrados.length !== 1 ? "s" : ""}
            </span>
            <input
              id="busqueda-personal"
              type="text"
              className="form-control form-control-sm"
              style={{ maxWidth: 280 }}
              placeholder="🔍 Nombre, correo, rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="card-body p-0">
            {error   && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className="spinner-border" style={{ color: "#7c3aed" }} /></div>}

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
                      const estado   = u.estado_cuenta || "Activo";
                      const estadoB  = ESTADO_BADGE[estado] || ESTADO_BADGE.Activo;
                      const nombre   = [u.nombres, u.apellidos].filter(Boolean).join(" ") || u.email;

                      return (
                        <tr key={getId(u)}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>

                          {/* Empleado */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                style={{
                                  width: 36, height: 36, fontSize: "0.85rem",
                                  background: badge.bg,
                                  boxShadow: isMe ? "0 0 0 2px #a78bfa" : "none",
                                }}
                              >
                                {(u.email || "?")[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombre}</div>
                                {isMe && (
                                  <span className="badge" style={{ background: "#a78bfa22", color: "#7c3aed", fontSize: "0.6rem" }}>
                                    Tú
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td>
                            <small className="text-muted">{u.email}</small>
                          </td>

                          {/* Rol */}
                          <td>
                            <span
                              className="badge px-2 py-1"
                              style={{ background: badge.bg, fontSize: "0.65rem" }}
                            >
                              {badge.label}
                            </span>
                          </td>

                          {/* Estado — dropdown rápido */}
                          <td>
                            <select
                              className="form-select form-select-sm border-0 p-0"
                              style={{ width: "auto", background: "transparent", cursor: "pointer", fontSize: "0.8rem" }}
                              value={estado}
                              onChange={(e) => cambiarEstado(u, e.target.value)}
                              title="Cambiar estado de cuenta"
                            >
                              {["Activo", "Inactivo", "Pendiente"].map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                            </select>
                          </td>

                          {/* Fecha */}
                          <td>
                            <small className="text-muted">
                              {u.fecha_registro
                                ? new Date(u.fecha_registro).toLocaleDateString("es-CO")
                                : "—"}
                            </small>
                          </td>

                          {/* Acciones */}
                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              {/* Editar (siempre disponible) */}
                              <button
                                className="btn btn-outline-primary btn-sm"
                                id={`btn-editar-personal-${getId(u)}`}
                                title="Editar empleado"
                                onClick={() => abrirEditar(u)}
                              >
                                ✏️
                              </button>

                              {/* Eliminar — deshabilitado para el propio Admin */}
                              <button
                                className="btn btn-outline-danger btn-sm"
                                id={`btn-eliminar-personal-${getId(u)}`}
                                title={isMe ? "No puedes eliminarte a ti mismo" : "Eliminar empleado"}
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

        {/* ── Leyenda de permisos por rol ── */}
        <div className="mt-4">
          <div className="row g-3">
            {[
              {
                rol: "Administrador",
                icon: "👑",
                color: "#7c3aed",
                permisos: ["✅ Dashboard financiero", "✅ Afiliados (CRUD)", "✅ Rutinas (CRUD)", "✅ Dietas (CRUD)", "✅ Gestión de Personal"],
              },
              {
                rol: "Recepcionista",
                icon: "🗂️",
                color: "#2563eb",
                permisos: ["✅ Afiliados (CRUD)", "👁️ Rutinas (Solo lectura)", "👁️ Dietas (Solo lectura)", "🚫 Gestión de Personal"],
              },
              {
                rol: "Entrenador",
                icon: "🏆",
                color: "#059669",
                permisos: ["👁️ Afiliados (Solo lectura)", "✅ Rutinas (CRUD)", "✅ Dietas (CRUD)", "🚫 Gestión de Personal"],
              },
            ].map(({ rol, icon, color, permisos }) => (
              <div key={rol} className="col-md-4">
                <div
                  className="card border-0 h-100"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}22 !important`,
                    boxShadow: `0 2px 12px ${color}10`,
                  }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span
                        className="rounded-2 d-flex align-items-center justify-content-center text-white"
                        style={{ width: 32, height: 32, background: color, fontSize: "1rem" }}
                      >
                        {icon}
                      </span>
                      <strong style={{ color, fontSize: "0.85rem" }}>{rol}</strong>
                    </div>
                    <ul className="list-unstyled mb-0">
                      {permisos.map((p) => (
                        <li key={p} className="small text-muted mb-1" style={{ fontSize: "0.78rem" }}>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CREAR EMPLEADO
      ═══════════════════════════════════════════════════════════════════════ */}
      {crearModal && (
        <ModalPersonal
          titulo="➕ Nuevo Empleado"
          colorHeader="linear-gradient(135deg,#7c3aed,#4f46e5)"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCrear}
          onCancel={() => { setCrearModal(false); setFormData(FORM_VACÍO); }}
          saving={saving}
          formError={formError}
          isEdit={false}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: EDITAR EMPLEADO
      ═══════════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <ModalPersonal
          titulo={`✏️ Editar — ${editModal.email}`}
          colorHeader="linear-gradient(135deg,#e94560,#c62a47)"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleEditar}
          onCancel={() => setEditModal(null)}
          saving={saving}
          formError={formError}
          isEdit={true}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CONFIRMAR ELIMINACIÓN
      ═══════════════════════════════════════════════════════════════════════ */}
      {deleteModal && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.65)", zIndex: 1055 }}
          onClick={() => !saving && setDeleteModal(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 text-white" style={{ background: "linear-gradient(135deg,#dc2626,#991b1b)" }}>
                <h5 className="modal-title">⚠️ Eliminar empleado</h5>
                <button className="btn-close btn-close-white" onClick={() => setDeleteModal(null)} />
              </div>
              <div className="modal-body text-center py-4">
                <div className="mb-3" style={{ fontSize: "2.5rem" }}>🗑️</div>
                <p className="mb-1">
                  ¿Estás seguro de eliminar a{" "}
                  <strong className="text-danger">{deleteModal.email}</strong>?
                </p>
                <small className="text-muted">Esta acción no se puede deshacer.</small>
              </div>
              <div className="modal-footer border-0 justify-content-center gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm px-4"
                  onClick={() => setDeleteModal(null)}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  id="btn-confirmar-eliminar-personal"
                  className="btn btn-danger btn-sm px-4 fw-semibold"
                  onClick={handleEliminar}
                  disabled={saving}
                >
                  {saving ? <><span className="spinner-border spinner-border-sm me-2" />Eliminando...</> : "🗑️ Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Sub-componente modal reutilizable ─────────────────────────────────────────
function ModalPersonal({ titulo, colorHeader, formData, setFormData, onSubmit, onCancel, saving, formError, isEdit }) {
  const set = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  return (
    <div
      className="modal d-block"
      style={{ background: "rgba(0,0,0,0.6)", zIndex: 1055 }}
      onClick={() => !saving && onCancel()}
    >
      <div
        className="modal-dialog modal-lg modal-dialog-scrollable"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header text-white border-0" style={{ background: colorHeader }}>
            <h5 className="modal-title">{titulo}</h5>
            <button className="btn-close btn-close-white" onClick={onCancel} disabled={saving} />
          </div>

          <form onSubmit={onSubmit}>
            <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {formError && (
                <div className="alert alert-danger py-2 mb-3">
                  <small>⚠️ {formError}</small>
                </div>
              )}

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
                  <input
                    type="password"
                    className="form-control"
                    required={!isEdit}
                    value={formData.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder={isEdit ? "••••••••" : "Nueva contraseña"}
                  />
                </div>

                {/* Rol — selector destacado */}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">
                    Rol del empleado <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select fw-semibold"
                    value={formData.role}
                    onChange={(e) => set("role", e.target.value)}
                    style={{
                      borderColor: "#7c3aed44",
                      color: "#1e1b4b",
                    }}
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
                    value={formData.estado_cuenta}
                    onChange={(e) => set("estado_cuenta", e.target.value)}
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
                className="btn btn-sm text-white fw-semibold px-4"
                style={{ background: colorHeader, border: "none" }}
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
