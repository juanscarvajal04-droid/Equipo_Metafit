import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getId       = (doc) => doc._id ?? doc.id;
const nombreCompleto = (a) => [a.nombres, a.apellidos].filter(Boolean).join(" ") || "Sin nombre";
const inicial     = (a)   => (a.nombres || a.correo || "?")[0].toUpperCase();
const cicloActivo = (a)   => a.ciclos?.find((c) => c.activo) || null;
const numRestr    = (a)   => a.restricciones?.length || 0;

const OBJETIVO_CONFIG = {
  "Pérdida de grasa": { icono: "🔥", color: "#e94560", bg: "#e9456022" },
  "Aumento de masa":  { icono: "💪", color: "#0d6efd", bg: "#0d6efd22" },
  "Mantenimiento":    { icono: "⚖️", color: "#198754", bg: "#19875422" },
};

const OBJETIVOS  = Object.keys(OBJETIVO_CONFIG);
const NIVELES    = ["Principiante", "Intermedio", "Avanzado"];
const ESTADOS    = ["Activo", "Inactivo", "Pendiente"];

const badgeEstado = (estado) => {
  const map = { activo: "success", inactivo: "danger", pendiente: "warning" };
  const c   = map[(estado || "").toLowerCase()] || "secondary";
  return <span className={`badge bg-${c}`}>{estado || "—"}</span>;
};
const badgeNivel = (nivel) => {
  const map = { principiante: "info", intermedio: "primary", avanzado: "dark" };
  const c   = map[(nivel || "").toLowerCase()] || "secondary";
  return <span className={`badge bg-${c} bg-opacity-75`}>{nivel || "—"}</span>;
};

// ─── Formulario inicial vacío ─────────────────────────────────────────────────
const FORM_VACIO = {
  nombres: "", apellidos: "", correo: "", telefono: "", direccion: "",
  documento: "", fecha_nacimiento: "", sexo: "Masculino",
  estatura_cm: "", objetivo_fisico: "Pérdida de grasa",
  grupo_muscular_prioritario: "", nivel_experiencia: "Principiante",
  disponibilidad_semanal_dias: "", estado: "Activo",
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout, authAxios } = useAuth();
  const navigate = useNavigate();

  const [afiliados,  setAfiliados]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [busqueda,   setBusqueda]   = useState("");

  // ── Modales ────────────────────────────────────────────────────────────────
  const [verModal,    setVerModal]    = useState(null);  // afiliado a ver
  const [editModal,   setEditModal]   = useState(null);  // afiliado a editar
  const [formEdit,    setFormEdit]    = useState(FORM_VACIO);
  const [savingEdit,  setSavingEdit]  = useState(false);
  const [editError,   setEditError]   = useState("");
  const [deleteModal, setDeleteModal] = useState(null);  // afiliado a eliminar
  const [deleting,    setDeleting]    = useState(false);
  const [toast,       setToast]       = useState("");    // mensaje flotante

  // ── Carga ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    authAxios.get("/660/afiliados")
      .then(({ data }) => setAfiliados(data))
      .catch((err) => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          logout(); navigate("/login");
        } else {
          setError("No se pudieron cargar los afiliados.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  // ── Abrir modal de edición ──────────────────────────────────────────────────
  const abrirEditar = (afiliado) => {
    setEditModal(afiliado);
    setEditError("");
    setFormEdit({
      nombres:                      afiliado.nombres                      || "",
      apellidos:                    afiliado.apellidos                    || "",
      correo:                       afiliado.correo                       || "",
      telefono:                     afiliado.telefono                     || "",
      direccion:                    afiliado.direccion                    || "",
      documento:                    afiliado.documento                    || "",
      fecha_nacimiento:             afiliado.fecha_nacimiento             || "",
      sexo:                         afiliado.sexo                         || "Masculino",
      estatura_cm:                  afiliado.estatura_cm                  || "",
      objetivo_fisico:              afiliado.objetivo_fisico              || "Pérdida de grasa",
      grupo_muscular_prioritario:   afiliado.grupo_muscular_prioritario   || "",
      nivel_experiencia:            afiliado.nivel_experiencia            || "Principiante",
      disponibilidad_semanal_dias:  afiliado.disponibilidad_semanal_dias  || "",
      estado:                       afiliado.estado                       || "Activo",
    });
  };

  // ── Guardar edición ────────────────────────────────────────────────────────
  const guardarEdicion = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError("");
    try {
      const id = getId(editModal);
      const { data: actualizado } = await authAxios.patch(`/afiliados/${id}`, formEdit);
      setAfiliados((prev) => prev.map((a) => (getId(a) === id ? actualizado : a)));
      setEditModal(null);
      showToast(`✅ ${nombreCompleto(actualizado)} actualizado correctamente`);
    } catch {
      setEditError("Error al guardar. Verifica el servidor.");
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────
  const confirmarEliminar = async () => {
    setDeleting(true);
    try {
      const id = getId(deleteModal);
      await authAxios.delete(`/afiliados/${id}`);
      setAfiliados((prev) => prev.filter((a) => getId(a) !== id));
      showToast(`🗑 ${nombreCompleto(deleteModal)} eliminado`);
      setDeleteModal(null);
    } catch {
      showToast("❌ Error al eliminar. Verifica el servidor.");
      setDeleteModal(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtrado y KPIs ────────────────────────────────────────────────────────
  const filtrados        = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return (
      nombreCompleto(a).toLowerCase().includes(t) ||
      (a.correo || "").toLowerCase().includes(t)  ||
      (a.objetivo_fisico || "").toLowerCase().includes(t)
    );
  });
  const totalActivos     = afiliados.filter((a) => a.estado?.toLowerCase() === "activo").length;
  const conCicloActivo   = afiliados.filter((a) => cicloActivo(a)).length;
  const conRestricciones = afiliados.filter((a) => numRestr(a) > 0).length;
  const conteoPorObj     = OBJETIVOS.map((obj) => ({
    objetivo: obj, cantidad: afiliados.filter((a) => a.objetivo_fisico === obj).length,
    ...OBJETIVO_CONFIG[obj],
  }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-vh-100" style={{ background: "#f4f6f9" }}>

      {/* Toast */}
      {toast && (
        <div
          className="position-fixed bottom-0 end-0 m-4 alert alert-dark shadow-lg py-2 px-3"
          style={{ zIndex: 9999, minWidth: 280 }}
        >
          {toast}
        </div>
      )}

      {/* Navbar */}
      <nav className="navbar navbar-dark px-4 py-3 shadow-sm"
        style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
        <span className="navbar-brand fw-bold fs-5">
          💪 MetaFit&nbsp;
          <span className="badge fs-6 text-white" style={{ background: "#e94560" }}>Dashboard</span>
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white-50 small d-none d-md-inline">👤 {user?.email}</span>
          <button id="btn-logout" className="btn btn-outline-light btn-sm"
            onClick={() => { logout(); navigate("/login"); }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="container-fluid py-4 px-3 px-md-4">

        {/* KPIs */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Afiliados",   valor: afiliados.length,   icono: "👥", color: "#0d6efd" },
            { label: "Activos",           valor: totalActivos,        icono: "✅", color: "#198754" },
            { label: "Ciclos en curso",   valor: conCicloActivo,      icono: "🔄", color: "#6f42c1" },
            { label: "Con restricciones", valor: conRestricciones,    icono: "⚠️", color: "#fd7e14" },
          ].map((kpi) => (
            <div key={kpi.label} className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center fs-4"
                    style={{ width: 52, height: 52, background: kpi.color + "22", flexShrink: 0 }}>
                    {kpi.icono}
                  </div>
                  <div>
                    <div className="fw-bold fs-3 lh-1" style={{ color: kpi.color }}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : kpi.valor}
                    </div>
                    <small className="text-muted">{kpi.label}</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards por Objetivo */}
        <h2 className="h5 fw-bold mb-3">🎯 Distribución por Objetivo Físico</h2>
        <div className="row g-3 mb-4">
          {conteoPorObj.map((obj) => (
            <div key={obj.objetivo} className="col-12 col-md-4">
              <div className="card border-0 shadow-sm h-100"
                style={{ borderLeft: `5px solid ${obj.color}` }}>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fs-1">{obj.icono}</span>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3"
                      style={{ width: 60, height: 60, background: obj.bg, color: obj.color }}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : obj.cantidad}
                    </div>
                  </div>
                  <h3 className="h6 fw-bold mb-1" style={{ color: obj.color }}>{obj.objetivo}</h3>
                  <div className="progress mt-2" style={{ height: 6 }}>
                    <div className="progress-bar"
                      style={{ width: afiliados.length > 0 ? `${(obj.cantidad / afiliados.length) * 100}%` : "0%", background: obj.color }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-0">
            <h2 className="h5 fw-bold mb-0">👥 Gestión de Afiliados</h2>
            <input type="text" id="busqueda-afiliados" className="form-control form-control-sm"
              style={{ maxWidth: 280 }} placeholder="🔍 Nombre, correo, objetivo..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="card-body p-0">
            {error && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="text-muted mt-2 small">Cargando afiliados...</p>
              </div>
            )}
            {!loading && !error && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">#</th>
                      <th>Afiliado</th>
                      <th>Contacto</th>
                      <th>Objetivo</th>
                      <th>Nivel</th>
                      <th className="text-center">Días/sem</th>
                      <th className="text-center">Restrict.</th>
                      <th>Ciclo activo</th>
                      <th>Estado</th>
                      <th className="text-center pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr><td colSpan={10} className="text-center text-muted py-5">
                        {busqueda ? `Sin resultados para "${busqueda}"` : "No hay afiliados."}
                      </td></tr>
                    ) : filtrados.map((a, idx) => {
                      const ciclo = cicloActivo(a);
                      return (
                        <tr key={getId(a)}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{ width: 38, height: 38, flexShrink: 0, fontSize: "0.85rem",
                                  background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className="text-muted" style={{ fontSize: "0.72rem" }}>Doc: {a.documento || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="small">{a.correo || "—"}</div>
                            <div className="text-muted" style={{ fontSize: "0.72rem" }}>📞 {a.telefono || "—"}</div>
                          </td>
                          <td><span className="small">{OBJETIVO_CONFIG[a.objetivo_fisico]?.icono || "📌"} {a.objetivo_fisico || "—"}</span></td>
                          <td>{badgeNivel(a.nivel_experiencia)}</td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">{a.disponibilidad_semanal_dias || "—"}d</span>
                          </td>
                          <td className="text-center">
                            {numRestr(a) > 0
                              ? <span className="badge bg-warning text-dark" title={a.restricciones.map((r) => r.nombre).join(", ")}>⚠️ {numRestr(a)}</span>
                              : <span className="badge bg-success bg-opacity-10 text-success">✓</span>}
                          </td>
                          <td>
                            {ciclo ? (
                              <div className="small">
                                <span className="badge bg-primary bg-opacity-10 text-primary mb-1">Ciclo {ciclo.numero_ciclo}</span>
                                <div className="text-muted" style={{ fontSize: "0.72rem" }}>
                                  {ciclo.plan_nutricional?.calorias_estimadas || "—"} kcal · {ciclo.plan_entrenamiento?.rutinas?.length || 0} rutinas
                                </div>
                              </div>
                            ) : <span className="text-muted small">Sin ciclo</span>}
                          </td>
                          <td>{badgeEstado(a.estado)}</td>
                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              <button className="btn btn-outline-primary btn-sm" id={`btn-ver-${getId(a)}`}
                                title="Ver detalle" onClick={() => setVerModal(a)}>👁</button>
                              <button className="btn btn-outline-warning btn-sm" id={`btn-editar-${getId(a)}`}
                                title="Editar" onClick={() => abrirEditar(a)}>✏️</button>
                              <button className="btn btn-outline-danger btn-sm" id={`btn-eliminar-${getId(a)}`}
                                title="Eliminar" onClick={() => setDeleteModal(a)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && (
              <div className="card-footer bg-white text-muted small py-2 px-4 border-0">
                Mostrando <strong>{filtrados.length}</strong> de <strong>{afiliados.length}</strong> afiliados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: EDITAR AFILIADO
      ═══════════════════════════════════════════════════════════════════════ */}
      {editModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => !savingEdit && setEditModal(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">

              {/* Header */}
              <div className="modal-header text-white border-0"
                style={{ background: "linear-gradient(135deg,#e94560,#c62a47)" }}>
                <h5 className="modal-title">✏️ Editar — {nombreCompleto(editModal)}</h5>
                <button type="button" className="btn-close btn-close-white"
                  onClick={() => !savingEdit && setEditModal(null)} />
              </div>

              {/* Body */}
              <form onSubmit={guardarEdicion}>
                <div className="modal-body">
                  {editError && (
                    <div className="alert alert-danger py-2"><small>⚠️ {editError}</small></div>
                  )}

                  {/* ── Datos personales ── */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">👤 Datos personales</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Nombres</label>
                      <input className="form-control" value={formEdit.nombres} required
                        onChange={(e) => setFormEdit({ ...formEdit, nombres: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Apellidos</label>
                      <input className="form-control" value={formEdit.apellidos} required
                        onChange={(e) => setFormEdit({ ...formEdit, apellidos: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Correo</label>
                      <input type="email" className="form-control" value={formEdit.correo}
                        onChange={(e) => setFormEdit({ ...formEdit, correo: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Teléfono</label>
                      <input className="form-control" value={formEdit.telefono}
                        onChange={(e) => setFormEdit({ ...formEdit, telefono: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Documento</label>
                      <input className="form-control" value={formEdit.documento}
                        onChange={(e) => setFormEdit({ ...formEdit, documento: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Fecha de nacimiento</label>
                      <input type="date" className="form-control" value={formEdit.fecha_nacimiento}
                        onChange={(e) => setFormEdit({ ...formEdit, fecha_nacimiento: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Sexo</label>
                      <select className="form-select" value={formEdit.sexo}
                        onChange={(e) => setFormEdit({ ...formEdit, sexo: e.target.value })}>
                        <option>Masculino</option>
                        <option>Femenino</option>
                        <option>Otro</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Estatura (cm)</label>
                      <input type="number" step="0.1" className="form-control" value={formEdit.estatura_cm}
                        onChange={(e) => setFormEdit({ ...formEdit, estatura_cm: parseFloat(e.target.value) || "" })} />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Estado</label>
                      <select className="form-select" value={formEdit.estado}
                        onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}>
                        {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Dirección</label>
                      <input className="form-control" value={formEdit.direccion}
                        onChange={(e) => setFormEdit({ ...formEdit, direccion: e.target.value })} />
                    </div>
                  </div>

                  {/* ── Datos deportivos ── */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">🏋️ Datos deportivos</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Objetivo físico</label>
                      <select className="form-select" value={formEdit.objetivo_fisico}
                        onChange={(e) => setFormEdit({ ...formEdit, objetivo_fisico: e.target.value })}>
                        {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Nivel de experiencia</label>
                      <select className="form-select" value={formEdit.nivel_experiencia}
                        onChange={(e) => setFormEdit({ ...formEdit, nivel_experiencia: e.target.value })}>
                        {NIVELES.map((n) => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Días disponibles/sem</label>
                      <input type="number" min="1" max="7" className="form-control"
                        value={formEdit.disponibilidad_semanal_dias}
                        onChange={(e) => setFormEdit({ ...formEdit, disponibilidad_semanal_dias: parseInt(e.target.value) || "" })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Músculo prioritario</label>
                      <input className="form-control" value={formEdit.grupo_muscular_prioritario}
                        placeholder="Ej: Pecho, Glúteos..."
                        onChange={(e) => setFormEdit({ ...formEdit, grupo_muscular_prioritario: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    onClick={() => !savingEdit && setEditModal(null)} disabled={savingEdit}>
                    Cancelar
                  </button>
                  <button type="submit" id="btn-guardar-edicion"
                    className="btn btn-sm text-white fw-semibold px-4"
                    style={{ background: "linear-gradient(135deg,#e94560,#c62a47)", border: "none" }}
                    disabled={savingEdit}>
                    {savingEdit
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "💾 Guardar cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CONFIRMAR ELIMINACIÓN
      ═══════════════════════════════════════════════════════════════════════ */}
      {deleteModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => !deleting && setDeleteModal(null)}>
          <div className="modal-dialog modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header border-0 bg-danger text-white">
                <h5 className="modal-title">🗑 Eliminar afiliado</h5>
                <button type="button" className="btn-close btn-close-white"
                  onClick={() => !deleting && setDeleteModal(null)} />
              </div>
              <div className="modal-body text-center py-4">
                <p className="mb-1">¿Seguro que deseas eliminar a</p>
                <strong>{nombreCompleto(deleteModal)}</strong>
                <p className="text-muted small mt-2 mb-0">Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer border-0 justify-content-center gap-2">
                <button className="btn btn-outline-secondary btn-sm px-4"
                  onClick={() => setDeleteModal(null)} disabled={deleting}>
                  Cancelar
                </button>
                <button id="btn-confirmar-eliminar"
                  className="btn btn-danger btn-sm px-4 fw-semibold"
                  onClick={confirmarEliminar} disabled={deleting}>
                  {deleting
                    ? <><span className="spinner-border spinner-border-sm me-1" />Eliminando...</>
                    : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: VER DETALLE
      ═══════════════════════════════════════════════════════════════════════ */}
      {verModal && (
        <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setVerModal(null)}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header text-white border-0"
                style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
                <h5 className="modal-title">👤 {nombreCompleto(verModal)}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setVerModal(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  {[
                    { label: "Correo",     valor: verModal.correo },
                    { label: "Teléfono",   valor: verModal.telefono },
                    { label: "Documento",  valor: verModal.documento },
                    { label: "Estatura",   valor: verModal.estatura_cm ? `${verModal.estatura_cm} cm` : "—" },
                    { label: "Sexo",       valor: verModal.sexo },
                    { label: "Nacimiento", valor: verModal.fecha_nacimiento },
                    { label: "Objetivo",   valor: verModal.objetivo_fisico },
                    { label: "Nivel",      valor: verModal.nivel_experiencia },
                    { label: "Días/sem",   valor: verModal.disponibilidad_semanal_dias },
                    { label: "Músculo",    valor: verModal.grupo_muscular_prioritario || "—" },
                  ].map((f) => (
                    <div key={f.label} className="col-6 col-md-4">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.7rem" }}>{f.label}</small>
                      <span className="small fw-semibold">{f.valor || "—"}</span>
                    </div>
                  ))}
                </div>

                {verModal.restricciones?.length > 0 && (
                  <>
                    <h6 className="fw-bold mb-2">⚠️ Restricciones</h6>
                    {verModal.restricciones.map((r) => (
                      <div key={r.id_restriccion} className="alert alert-warning py-2 mb-2">
                        <strong>{r.nombre}</strong>
                        <span className="badge bg-warning text-dark ms-2">{r.tipo}</span>
                        {r.efecto_relevante && <div className="small mt-1 text-muted">{r.efecto_relevante}</div>}
                      </div>
                    ))}
                  </>
                )}

                <h6 className="fw-bold mb-2">📅 Ciclos</h6>
                {(verModal.ciclos || []).map((ciclo) => (
                  <div key={ciclo.numero_ciclo} className="border rounded p-3 mb-3"
                    style={{ borderLeft: ciclo.activo ? "4px solid #0d6efd" : "4px solid #dee2e6" }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong>Ciclo {ciclo.numero_ciclo}</strong>
                      {ciclo.activo
                        ? <span className="badge bg-primary">Activo</span>
                        : <span className="badge bg-secondary">Finalizado</span>}
                    </div>
                    <div className="small text-muted mb-2">
                      {ciclo.fecha_inicio} → {ciclo.fecha_fin}
                    </div>
                    {ciclo.plan_nutricional && (
                      <div className="small mb-1">
                        🥗 <strong>{ciclo.plan_nutricional.calorias_estimadas} kcal</strong> · {ciclo.plan_nutricional.num_comidas_diarias} comidas/día
                      </div>
                    )}
                    {ciclo.plan_entrenamiento?.rutinas?.length > 0 && (
                      <div className="small">
                        🏋️ {ciclo.plan_entrenamiento.rutinas.map((r) => (
                          <span key={r.dia_numero} className="badge bg-light text-dark border me-1">{r.nombre}</span>
                        ))}
                      </div>
                    )}
                    {ciclo.progreso_fisico?.length > 0 && (() => {
                      const u = ciclo.progreso_fisico.at(-1);
                      return (
                        <div className="small mt-2 text-muted">
                          📈 Último: {u.peso_kg} kg · {u.porcentaje_grasa}% grasa · cintura {u.medidas_cm?.cintura} cm ({u.fecha_registro})
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-outline-warning btn-sm" onClick={() => { setVerModal(null); abrirEditar(verModal); }}>
                  ✏️ Editar este afiliado
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setVerModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
