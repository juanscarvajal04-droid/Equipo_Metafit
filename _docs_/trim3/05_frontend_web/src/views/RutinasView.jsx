import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getId          = (doc) => doc._id ?? doc.id;
const nombreCompleto = (a)   => [a.nombres, a.apellidos].filter(Boolean).join(" ") || "Sin nombre";
const inicial        = (a)   => (a.nombres || a.correo || "?")[0].toUpperCase();
const cicloActivo    = (a)   => a.ciclos?.find((c) => c.activo) || null;

const NIVEL_COLOR = {
  Principiante: { bg: "#0ea5e922", text: "#0284c7", label: "Principiante" },
  Intermedio:   { bg: "#8b5cf622", text: "#7c3aed", label: "Intermedio"   },
  Avanzado:     { bg: "#ef444422", text: "#dc2626", label: "Avanzado"     },
};

const OBJETIVO_ICON = {
  "Pérdida de grasa": "🔥",
  "Aumento de masa":  "💪",
  "Mantenimiento":    "⚖️",
};

// Rutinas predefinidas que el Entrenador puede asignar
const RUTINAS_PREDEFINIDAS = [
  { id: 1, nombre: "Full Body — Principiante",  dias: 3, enfoque: "Cuerpo completo",  nivel: "Principiante" },
  { id: 2, nombre: "Upper/Lower — Intermedio",  dias: 4, enfoque: "Fuerza",           nivel: "Intermedio"   },
  { id: 3, nombre: "Push/Pull/Legs — Avanzado", dias: 6, enfoque: "Hipertrofia",      nivel: "Avanzado"     },
  { id: 4, nombre: "Cardio + Fuerza",           dias: 4, enfoque: "Pérdida de grasa", nivel: "Principiante" },
  { id: 5, nombre: "Glúteos & Core",            dias: 3, enfoque: "Glúteos",          nivel: "Intermedio"   },
  { id: 6, nombre: "Powerlifting Base",         dias: 4, enfoque: "Fuerza máxima",    nivel: "Avanzado"     },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function RutinasView() {
  const { user, authAxios, logout } = useAuth();
  const navigate = useNavigate();
  const role     = user?.role || "Entrenador";
  const isAdmin  = role === "Administrador";

  const [afiliados,   setAfiliados]  = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [refreshing,  setRefreshing] = useState(false);
  const [error,       setError]      = useState("");
  const [busqueda,    setBusqueda]   = useState("");
  const [toast,       setToast]      = useState({ msg: "", type: "success" });

  // Modal asignar rutina
  const [asignarModal, setAsignarModal] = useState(null);
  const [rutinaSelec,  setRutinaSelec]  = useState(null);
  const [fechaInicio,  setFechaInicio]  = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin,     setFechaFin]     = useState("");
  const [saving,       setSaving]       = useState(false);
  const [asigError,    setAsigError]    = useState("");

  // Modal ver rutina activa
  const [verModal, setVerModal] = useState(null);

  // ── Carga (reutilizable para el botón Actualizar) ──────────────────────────
  const cargarAfiliados = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/660/afiliados");
      setAfiliados(data);
      if (esRefresh) showToast(`✅ Lista actualizada — ${data.length} afiliados`);
    } catch (err) {
      if (err?.response?.status === 401) { logout(); navigate("/login"); }
      else setError("No se pudieron cargar los afiliados.");
    } finally {
      esRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [authAxios, logout, navigate]);

  useEffect(() => { cargarAfiliados(); }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const filtrados = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return (
      nombreCompleto(a).toLowerCase().includes(t) ||
      (a.objetivo_fisico || "").toLowerCase().includes(t) ||
      (a.nivel_experiencia || "").toLowerCase().includes(t)
    );
  });

  // ── Asignar rutina (crea/actualiza ciclo activo) ───────────────────────────
  const abrirAsignar = (afiliado) => {
    setAsignarModal(afiliado);
    const ciclo = cicloActivo(afiliado);
    // Pre-seleccionar rutina compatible con el nivel
    const compatible = RUTINAS_PREDEFINIDAS.find(
      (r) => r.nivel === afiliado.nivel_experiencia
    ) || RUTINAS_PREDEFINIDAS[0];
    setRutinaSelec(compatible);
    setFechaInicio(new Date().toISOString().split("T")[0]);
    // Fecha fin = 8 semanas por defecto
    const fin = new Date();
    fin.setDate(fin.getDate() + 56);
    setFechaFin(fin.toISOString().split("T")[0]);
    setAsigError("");
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!rutinaSelec) { setAsigError("Selecciona una rutina."); return; }
    if (!fechaInicio || !fechaFin) { setAsigError("Las fechas son obligatorias."); return; }
    if (fechaFin <= fechaInicio) { setAsigError("La fecha de fin debe ser posterior al inicio."); return; }

    setSaving(true); setAsigError("");
    try {
      const id = getId(asignarModal);
      const ciclosActuales = asignarModal.ciclos || [];

      // Desactivar ciclos anteriores
      const ciclosActualizados = ciclosActuales.map((c) => ({ ...c, activo: false }));

      const nuevoCiclo = {
        numero_ciclo:       ciclosActualizados.length + 1,
        fecha_inicio:       fechaInicio,
        fecha_fin:          fechaFin,
        activo:             true,
        fecha_creacion:     new Date().toISOString(),
        asignado_por_id:    getId(user),
        plan_entrenamiento: {
          es_automatico:       false,
          rutina_base_id:      rutinaSelec.id,
          nombre_rutina:       rutinaSelec.nombre,
          enfoque:             rutinaSelec.enfoque,
          dias_semana:         rutinaSelec.dias,
          modificado_por_id:   getId(user),
          observaciones:       null,
          rutinas:             [],
        },
        plan_nutricional: null,
        progreso_fisico:  [],
      };

      const payload = { ciclos: [...ciclosActualizados, nuevoCiclo] };
      const { data } = await authAxios.patch(`/afiliados/${id}`, payload);

      setAfiliados((prev) => prev.map((a) => getId(a) === id ? data : a));
      setAsignarModal(null);
      showToast(`✅ Rutina "${rutinaSelec.nombre}" asignada a ${nombreCompleto(data)}`);
    } catch {
      setAsigError("Error al guardar. Verifica el servidor.");
    } finally {
      setSaving(false);
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
                className="d-inline-flex align-items-center justify-content-center rounded-2 text-white"
                style={{ width: 36, height: 36, background: "linear-gradient(135deg,#059669,#0d9488)", fontSize: "1.1rem" }}
              >
                🏋️
              </span>
              Planes de Entrenamiento
            </h1>
            <small className="text-muted">
              {isAdmin
                ? "Vista de administrador — supervisión de rutinas asignadas"
                : "Asigna y gestiona rutinas personalizadas para cada afiliado"}
            </small>
          </div>

          {/* KPIs rápidos */}
          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: "Total afiliados", valor: afiliados.length,                          color: "#059669" },
              { label: "Con rutina activa", valor: afiliados.filter((a) => cicloActivo(a)).length, color: "#7c3aed" },
              { label: "Sin rutina",       valor: afiliados.filter((a) => !cicloActivo(a)).length, color: "#e94560" },
            ].map((k) => (
              <div
                key={k.label}
                className="card border-0 shadow-sm text-center px-3 py-2"
                style={{ minWidth: 110 }}
              >
                <div className="fw-bold fs-5" style={{ color: k.color }}>
                  {loading ? "—" : k.valor}
                </div>
                <div className="text-muted" style={{ fontSize: "0.68rem" }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabla de afiliados ── */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0 flex-wrap gap-2">
            <span className="fw-semibold text-muted small">{filtrados.length} afiliados</span>
            <div className="d-flex gap-2 align-items-center">
              <input
                id="busqueda-rutinas"
                type="text"
                className="form-control form-control-sm"
                style={{ maxWidth: 240 }}
                placeholder="🔍 Nombre, objetivo, nivel..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button
                id="btn-refresh-rutinas"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                style={{ whiteSpace: "nowrap", fontSize: "0.78rem" }}
                onClick={() => cargarAfiliados(true)}
                disabled={refreshing}
                title="Recargar lista de afiliados"
              >
                {refreshing
                  ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  : "🔄"}
                Actualizar
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            {error   && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className="spinner-border" style={{ color: "#059669" }} /></div>}

            {!loading && !error && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">#</th>
                      <th>Afiliado</th>
                      <th>Objetivo</th>
                      <th>Nivel</th>
                      <th className="text-center">Días/sem</th>
                      <th>Rutina activa</th>
                      <th>Período</th>
                      <th className="text-center pe-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-5">
                          {busqueda ? `Sin resultados para "${busqueda}"` : "No hay afiliados."}
                        </td>
                      </tr>
                    ) : filtrados.map((a, idx) => {
                      const ciclo   = cicloActivo(a);
                      const nivelCfg = NIVEL_COLOR[a.nivel_experiencia] || NIVEL_COLOR.Principiante;

                      return (
                        <tr key={getId(a)}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>

                          {/* Afiliado */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                style={{
                                  width: 36, height: 36, fontSize: "0.85rem",
                                  background: `hsl(${(getId(a) * 47) % 360},65%,55%)`,
                                }}
                              >
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{a.correo || "—"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Objetivo */}
                          <td>
                            <small>{OBJETIVO_ICON[a.objetivo_fisico]} {a.objetivo_fisico || "—"}</small>
                          </td>

                          {/* Nivel */}
                          <td>
                            <span
                              className="badge px-2 py-1"
                              style={{ background: nivelCfg.bg, color: nivelCfg.text, fontSize: "0.7rem" }}
                            >
                              {nivelCfg.label}
                            </span>
                          </td>

                          {/* Días */}
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {a.disponibilidad_semanal_dias || "—"}d
                            </span>
                          </td>

                          {/* Rutina activa */}
                          <td>
                            {ciclo?.plan_entrenamiento?.nombre_rutina ? (
                              <span className="badge px-2 py-1" style={{ background: "#05966918", color: "#059669", fontSize: "0.7rem" }}>
                                ✅ {ciclo.plan_entrenamiento.nombre_rutina}
                              </span>
                            ) : ciclo ? (
                              <span className="badge bg-warning bg-opacity-15 text-warning" style={{ fontSize: "0.7rem" }}>
                                ⚙️ Plan personalizado
                              </span>
                            ) : (
                              <span className="badge bg-danger bg-opacity-10 text-danger" style={{ fontSize: "0.7rem" }}>
                                ❌ Sin rutina
                              </span>
                            )}
                          </td>

                          {/* Período */}
                          <td>
                            {ciclo ? (
                              <small className="text-muted">
                                {ciclo.fecha_inicio} → {ciclo.fecha_fin}
                              </small>
                            ) : (
                              <small className="text-muted">—</small>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              {/* Ver detalle del ciclo */}
                              {ciclo && (
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  id={`btn-ver-rutina-${getId(a)}`}
                                  title="Ver rutina activa"
                                  onClick={() => setVerModal(a)}
                                >
                                  👁️
                                </button>
                              )}
                              {/* Asignar / Cambiar rutina */}
                              <button
                                className="btn btn-sm fw-semibold text-white"
                                id={`btn-asignar-rutina-${getId(a)}`}
                                title={ciclo ? "Cambiar rutina" : "Asignar rutina"}
                                style={{ background: "linear-gradient(135deg,#059669,#0d9488)", border: "none", fontSize: "0.78rem" }}
                                onClick={() => abrirAsignar(a)}
                              >
                                {ciclo ? "🔄 Cambiar" : "➕ Asignar"}
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

        {/* ── Catálogo de rutinas disponibles ── */}
        <div className="mt-4">
          <h2 className="h6 fw-bold text-muted text-uppercase mb-3" style={{ letterSpacing: "0.06em" }}>
            📋 Catálogo de Rutinas Disponibles
          </h2>
          <div className="row g-2">
            {RUTINAS_PREDEFINIDAS.map((r) => {
              const nivelCfg = NIVEL_COLOR[r.nivel] || NIVEL_COLOR.Principiante;
              return (
                <div key={r.id} className="col-md-4 col-lg-2">
                  <div
                    className="card border-0 shadow-sm h-100"
                    style={{ borderLeft: `3px solid ${nivelCfg.text}` }}
                  >
                    <div className="card-body p-3">
                      <div className="fw-semibold small mb-1">{r.nombre}</div>
                      <div className="text-muted" style={{ fontSize: "0.68rem" }}>
                        🎯 {r.enfoque} · {r.dias}d/sem
                      </div>
                      <span
                        className="badge mt-2 px-2 py-1"
                        style={{ background: nivelCfg.bg, color: nivelCfg.text, fontSize: "0.6rem" }}
                      >
                        {r.nivel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: ASIGNAR / CAMBIAR RUTINA
      ═══════════════════════════════════════════════════════════════════════ */}
      {asignarModal && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 1055 }}
          onClick={() => !saving && setAsignarModal(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div
                className="modal-header text-white border-0"
                style={{ background: "linear-gradient(135deg,#059669,#0d9488)" }}
              >
                <h5 className="modal-title">
                  🏋️ Asignar Rutina — {nombreCompleto(asignarModal)}
                </h5>
                <button
                  className="btn-close btn-close-white"
                  onClick={() => !saving && setAsignarModal(null)}
                  disabled={saving}
                />
              </div>

              <form onSubmit={handleAsignar}>
                <div className="modal-body">
                  {asigError && (
                    <div className="alert alert-danger py-2 mb-3">
                      <small>⚠️ {asigError}</small>
                    </div>
                  )}

                  {/* Info del afiliado */}
                  <div
                    className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                      style={{
                        width: 44, height: 44, fontSize: "1rem",
                        background: `hsl(${(getId(asignarModal) * 47) % 360},65%,55%)`,
                      }}
                    >
                      {inicial(asignarModal)}
                    </div>
                    <div>
                      <div className="fw-semibold">{nombreCompleto(asignarModal)}</div>
                      <div className="text-muted small">
                        {OBJETIVO_ICON[asignarModal.objetivo_fisico]} {asignarModal.objetivo_fisico}
                        &nbsp;·&nbsp;{asignarModal.nivel_experiencia}
                        &nbsp;·&nbsp;{asignarModal.disponibilidad_semanal_dias}d/sem
                      </div>
                    </div>
                  </div>

                  {/* Selector de rutina */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">
                    Selecciona una rutina
                  </h6>
                  <div className="row g-2 mb-4">
                    {RUTINAS_PREDEFINIDAS.map((r) => {
                      const nivelCfg   = NIVEL_COLOR[r.nivel] || NIVEL_COLOR.Principiante;
                      const seleccionada = rutinaSelec?.id === r.id;
                      return (
                        <div key={r.id} className="col-md-6">
                          <div
                            className="card border-0 h-100"
                            style={{
                              cursor: "pointer",
                              background: seleccionada ? `${nivelCfg.text}12` : "#f8fafc",
                              border:     seleccionada ? `2px solid ${nivelCfg.text}` : "2px solid #e2e8f0",
                              transition: "all 0.15s ease",
                            }}
                            onClick={() => setRutinaSelec(r)}
                          >
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="fw-semibold small">{r.nombre}</div>
                                {seleccionada && (
                                  <span style={{ color: nivelCfg.text, fontSize: "1rem" }}>✓</span>
                                )}
                              </div>
                              <div className="text-muted mt-1" style={{ fontSize: "0.7rem" }}>
                                🎯 {r.enfoque} &nbsp;·&nbsp; 📅 {r.dias} días/sem
                              </div>
                              <span
                                className="badge mt-2 px-2"
                                style={{ background: nivelCfg.bg, color: nivelCfg.text, fontSize: "0.62rem" }}
                              >
                                {r.nivel}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fechas */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">
                    Período del ciclo
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Fecha de inicio *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechaInicio}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Fecha de fin *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechaFin}
                        min={fechaInicio}
                        onChange={(e) => setFechaFin(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Advertencia si ya tiene ciclo */}
                  {cicloActivo(asignarModal) && (
                    <div className="alert alert-warning mt-3 py-2">
                      <small>
                        ⚠️ Este afiliado ya tiene un ciclo activo. Asignar una nueva rutina
                        finalizará el ciclo anterior.
                      </small>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-4"
                    onClick={() => setAsignarModal(null)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirmar-asignar-rutina"
                    type="submit"
                    className="btn btn-sm text-white fw-semibold px-4"
                    style={{ background: "linear-gradient(135deg,#059669,#0d9488)", border: "none" }}
                    disabled={saving || !rutinaSelec}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "✅ Asignar rutina"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: VER RUTINA ACTIVA
      ═══════════════════════════════════════════════════════════════════════ */}
      {verModal && (() => {
        const ciclo = cicloActivo(verModal);
        const plan  = ciclo?.plan_entrenamiento;
        return (
          <div
            className="modal d-block"
            style={{ background: "rgba(0,0,0,0.6)", zIndex: 1055 }}
            onClick={() => setVerModal(null)}
          >
            <div
              className="modal-dialog modal-lg modal-dialog-scrollable"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0 shadow-lg">
                <div
                  className="modal-header text-white border-0"
                  style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}
                >
                  <h5 className="modal-title">
                    🏋️ Rutina activa — {nombreCompleto(verModal)}
                  </h5>
                  <button className="btn-close btn-close-white" onClick={() => setVerModal(null)} />
                </div>
                <div className="modal-body">
                  {/* Info del ciclo */}
                  <div className="row g-3 mb-4">
                    {[
                      { label: "Ciclo Nº",      v: ciclo?.numero_ciclo },
                      { label: "Inicio",         v: ciclo?.fecha_inicio },
                      { label: "Fin",            v: ciclo?.fecha_fin    },
                      { label: "Rutina base",    v: plan?.nombre_rutina || "Personalizada" },
                      { label: "Enfoque",        v: plan?.enfoque       || "—" },
                      { label: "Días/sem",       v: plan?.dias_semana   ? `${plan.dias_semana} días` : "—" },
                    ].map((f) => (
                      <div key={f.label} className="col-6 col-md-4">
                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                          {f.label}
                        </small>
                        <span className="small fw-semibold">{f.v || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Rutinas del ciclo */}
                  {plan?.rutinas?.length > 0 ? (
                    <>
                      <h6 className="fw-bold mb-3">📋 Días de entrenamiento</h6>
                      {plan.rutinas.map((r) => (
                        <div key={r.dia_numero} className="border rounded-3 p-3 mb-2">
                          <div className="fw-semibold small mb-2">{r.nombre}</div>
                          {r.ejercicios?.map((ej, i) => (
                            <div key={i} className="d-flex justify-content-between small text-muted border-bottom py-1">
                              <span>🏃 {ej.nombre}</span>
                              <span className="fw-semibold">{ej.series}×{ej.repeticiones}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <div className="fs-3 mb-2">📋</div>
                      <p className="small">Los ejercicios detallados se configuran al personalizar el plan.</p>
                    </div>
                  )}

                  {/* Progreso físico */}
                  {ciclo?.progreso_fisico?.length > 0 && (
                    <>
                      <h6 className="fw-bold mt-4 mb-3">📈 Progreso físico</h6>
                      {ciclo.progreso_fisico.map((p, i) => (
                        <div key={i} className="border rounded-3 p-3 mb-2">
                          <div className="d-flex justify-content-between mb-1">
                            <strong className="small">{p.fecha_registro}</strong>
                            <span className="badge bg-primary bg-opacity-10 text-primary">{p.peso_kg} kg</span>
                          </div>
                          <div className="row g-2 text-center">
                            {[
                              { l: "% Grasa",  v: `${p.porcentaje_grasa}%`       },
                              { l: "Cintura",  v: `${p.medidas_cm?.cintura} cm`  },
                              { l: "Brazo",    v: `${p.medidas_cm?.brazo} cm`    },
                              { l: "Pierna",   v: `${p.medidas_cm?.pierna} cm`   },
                            ].map((f) => (
                              <div key={f.l} className="col-3">
                                <small className="text-muted d-block" style={{ fontSize: "0.65rem" }}>{f.l}</small>
                                <strong className="small">{f.v || "—"}</strong>
                              </div>
                            ))}
                          </div>
                          {p.observaciones && (
                            <small className="text-muted mt-1 d-block">📝 {p.observaciones}</small>
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button
                    className="btn btn-outline-success btn-sm"
                    onClick={() => { setVerModal(null); abrirAsignar(verModal); }}
                  >
                    🔄 Cambiar rutina
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setVerModal(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </AppLayout>
  );
}
