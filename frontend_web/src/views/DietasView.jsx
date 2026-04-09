import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getId          = (doc) => doc._id ?? doc.id;
const nombreCompleto = (a)   => [a.nombres, a.apellidos].filter(Boolean).join(" ") || "Sin nombre";
const inicial        = (a)   => (a.nombres || a.correo || "?")[0].toUpperCase();
const cicloActivo    = (a)   => a.ciclos?.find((c) => c.activo) || null;

const OBJETIVO_CONFIG = {
  "Pérdida de grasa": { icono: "🔥", color: "#e94560", bg: "#e9456018" },
  "Aumento de masa":  { icono: "💪", color: "#2563eb", bg: "#2563eb18" },
  "Mantenimiento":    { icono: "⚖️", color: "#059669", bg: "#05966918" },
};

// Restricciones tipo alerta
const RESTRICCION_COLOR = {
  "Enfermedad": { bg: "#ef444418", text: "#dc2626" },
  "Alergia":    { bg: "#f9731618", text: "#ea580c" },
  "Lesión":     { bg: "#eab30818", text: "#ca8a04" },
};

// ── Catálogo de planes nutricionales ─────────────────────────────────────────
const PLANES_NUTRICIONALES = [
  {
    id: 1,
    nombre: "Plan Hipercalórico",
    objetivo: "Aumento de masa",
    calorias: 3200,
    comidas: 6,
    icono: "💪",
    color: "#2563eb",
    descripcion: "Superávit calórico con alto contenido proteico. Ideal para ganar masa muscular.",
    macros: { proteinas: "35%", carbos: "45%", grasas: "20%" },
    compatible: ["Aumento de masa"],
    alimentos: ["Pollo", "Arroz", "Avena", "Huevo", "Almendras"],
  },
  {
    id: 2,
    nombre: "Dieta Mediterránea",
    objetivo: "Mantenimiento",
    calorias: 2000,
    comidas: 4,
    icono: "🫒",
    color: "#059669",
    descripcion: "Rica en grasas saludables, vegetales y proteínas magras. Equilibrada y sostenible.",
    macros: { proteinas: "25%", carbos: "40%", grasas: "35%" },
    compatible: ["Mantenimiento", "Pérdida de grasa"],
    alimentos: ["Pescado", "Aceite de oliva", "Quinoa", "Brócoli", "Tomate"],
  },
  {
    id: 3,
    nombre: "Plan de Definición",
    objetivo: "Pérdida de grasa",
    calorias: 1600,
    comidas: 5,
    icono: "🔥",
    color: "#e94560",
    descripcion: "Déficit calórico controlado. Alto en proteínas para preservar músculo.",
    macros: { proteinas: "40%", carbos: "30%", grasas: "30%" },
    compatible: ["Pérdida de grasa"],
    alimentos: ["Atún", "Pechuga", "Brócoli", "Batata", "Claras"],
  },
  {
    id: 4,
    nombre: "Plan Low-Carb",
    objetivo: "Pérdida de grasa",
    calorias: 1800,
    comidas: 4,
    icono: "🥩",
    color: "#7c3aed",
    descripcion: "Reducción de carbohidratos para acelerar la quema de grasa sin perder músculo.",
    macros: { proteinas: "35%", carbos: "15%", grasas: "50%" },
    compatible: ["Pérdida de grasa", "Mantenimiento"],
    alimentos: ["Carne magra", "Huevo", "Aguacate", "Espinaca", "Almendras"],
  },
  {
    id: 5,
    nombre: "Plan Plant-Based",
    objetivo: "Mantenimiento",
    calorias: 1900,
    comidas: 5,
    icono: "🌱",
    color: "#0d9488",
    descripcion: "100% basado en plantas. Alto en fibra y micronutrientes esenciales.",
    macros: { proteinas: "20%", carbos: "55%", grasas: "25%" },
    compatible: ["Mantenimiento", "Pérdida de grasa"],
    alimentos: ["Lentejas", "Garbanzos", "Quinoa", "Tofu", "Batata"],
  },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function DietasView() {
  const { user, authAxios, logout } = useAuth();
  const navigate = useNavigate();
  const role     = user?.role || "Entrenador";
  const isAdmin  = role === "Administrador";

  const [afiliados,  setAfiliados]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");
  const [busqueda,   setBusqueda]   = useState("");
  const [toast,      setToast]      = useState({ msg: "", type: "success" });

  // Modal asignar plan
  const [asignarModal, setAsignarModal] = useState(null);
  const [planSelec,    setPlanSelec]    = useState(null);
  const [calorias,     setCalorias]     = useState("");
  const [numComidas,   setNumComidas]   = useState(4);
  const [obs,          setObs]          = useState("");
  const [saving,       setSaving]       = useState(false);
  const [asigError,    setAsigError]    = useState("");

  // Modal ver plan activo
  const [verModal, setVerModal] = useState(null);

  // ── Helpers (definidos antes de cargarAfiliados para poder usar showToast) ──
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

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
  const tienePlanNutricional = (a) => !!cicloActivo(a)?.plan_nutricional;
  const tieneAlergia         = (a) => (a.restricciones || []).some((r) => r.tipo === "Alergia");
  const tieneEnfermedad      = (a) => (a.restricciones || []).some((r) => r.tipo === "Enfermedad");

  const filtrados = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return (
      nombreCompleto(a).toLowerCase().includes(t) ||
      (a.objetivo_fisico || "").toLowerCase().includes(t) ||
      (a.restricciones || []).some((r) => r.nombre.toLowerCase().includes(t))
    );
  });

  // KPIs
  const totalConPlan     = afiliados.filter((a) => tienePlanNutricional(a)).length;
  const alertasAlergia   = afiliados.filter((a) => tieneAlergia(a) || tieneEnfermedad(a)).length;

  // ── Asignar plan nutricional ───────────────────────────────────────────────
  const abrirAsignar = (afiliado) => {
    setAsignarModal(afiliado);
    const compatible = PLANES_NUTRICIONALES.find(
      (p) => p.compatible.includes(afiliado.objetivo_fisico)
    ) || PLANES_NUTRICIONALES[0];
    setPlanSelec(compatible);
    setCalorias(String(compatible.calorias));
    setNumComidas(compatible.comidas);
    setObs("");
    setAsigError("");
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    if (!planSelec) { setAsigError("Selecciona un plan nutricional."); return; }
    if (!calorias || isNaN(Number(calorias))) { setAsigError("Ingresa las calorías estimadas."); return; }

    setSaving(true); setAsigError("");
    try {
      const id      = getId(asignarModal);
      const ciclos  = (asignarModal.ciclos || []).map((c) => ({ ...c, activo: false }));

      const nuevoCiclo = {
        numero_ciclo: ciclos.length + 1,
        fecha_inicio: new Date().toISOString().split("T")[0],
        fecha_fin:    (() => {
          const d = new Date(); d.setDate(d.getDate() + 84); // 12 semanas
          return d.toISOString().split("T")[0];
        })(),
        activo:           true,
        fecha_creacion:   new Date().toISOString(),
        asignado_por_id:  getId(user),
        plan_entrenamiento: null,
        plan_nutricional: {
          plan_base_id:          planSelec.id,
          nombre_plan:           planSelec.nombre,
          objetivo_dieta:        planSelec.objetivo,
          calorias_estimadas:    Number(calorias),
          num_comidas_diarias:   numComidas,
          es_automatico:         false,
          modificado_por_id:     getId(user),
          observaciones:         obs || null,
          macros:                planSelec.macros,
          alimentos_base:        planSelec.alimentos,
          detalle:               [],
        },
        progreso_fisico: [],
      };

      const { data } = await authAxios.patch(`/afiliados/${id}`, {
        ciclos: [...ciclos, nuevoCiclo],
      });

      setAfiliados((prev) => prev.map((a) => getId(a) === id ? data : a));
      setAsignarModal(null);
      showToast(`✅ Plan "${planSelec.nombre}" asignado a ${nombreCompleto(data)}`);
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
                style={{ width: 36, height: 36, background: "linear-gradient(135deg,#0891b2,#0d9488)", fontSize: "1.1rem" }}
              >
                🥗
              </span>
              Planes de Dieta
            </h1>
            <small className="text-muted">
              {isAdmin
                ? "Vista de administrador — supervisión de planes nutricionales activos"
                : "Asigna y gestiona planes nutricionales personalizados para cada afiliado"}
            </small>
          </div>

          {/* KPIs */}
          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: "Total afiliados",    valor: afiliados.length,   color: "#0891b2" },
              { label: "Con plan activo",    valor: totalConPlan,        color: "#059669" },
              { label: "Alertas nutrición",  valor: alertasAlergia,      color: "#e94560" },
            ].map((k) => (
              <div
                key={k.label}
                className="card border-0 shadow-sm text-center px-3 py-2"
                style={{ minWidth: 115 }}
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
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0 flex-wrap gap-2">
            <span className="fw-semibold text-muted small">{filtrados.length} afiliados</span>
            <div className="d-flex gap-2 align-items-center">
              <input
                id="busqueda-dietas"
                type="text"
                className="form-control form-control-sm"
                style={{ maxWidth: 240 }}
                placeholder="🔍 Nombre, objetivo, restricción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button
                id="btn-refresh-dietas"
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
            {loading && <div className="text-center py-5"><div className="spinner-border" style={{ color: "#0891b2" }} /></div>}

            {!loading && !error && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">#</th>
                      <th>Afiliado</th>
                      <th>Objetivo</th>
                      <th>Restricciones</th>
                      <th>Plan activo</th>
                      <th className="text-center">Calorías</th>
                      <th className="text-center">Comidas/día</th>
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
                      const ciclo    = cicloActivo(a);
                      const plan     = ciclo?.plan_nutricional;
                      const objCfg   = OBJETIVO_CONFIG[a.objetivo_fisico] || OBJETIVO_CONFIG["Mantenimiento"];
                      const restr    = a.restricciones || [];
                      const hayAlerta = tieneAlergia(a) || tieneEnfermedad(a);

                      return (
                        <tr key={getId(a)} style={{ background: hayAlerta ? "#fff8f8" : "transparent" }}>
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
                            <span
                              className="badge px-2 py-1"
                              style={{ background: objCfg.bg, color: objCfg.color, fontSize: "0.7rem" }}
                            >
                              {objCfg.icono} {a.objetivo_fisico || "—"}
                            </span>
                          </td>

                          {/* Restricciones */}
                          <td>
                            {restr.length === 0 ? (
                              <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: "0.7rem" }}>
                                ✓ Sin restricciones
                              </span>
                            ) : (
                              <div className="d-flex flex-wrap gap-1">
                                {restr.slice(0, 2).map((r) => {
                                  const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                                  return (
                                    <span
                                      key={r.id_restriccion}
                                      className="badge px-2 py-1"
                                      title={r.efecto_relevante || r.nombre}
                                      style={{ background: cfg.bg, color: cfg.text, fontSize: "0.65rem" }}
                                    >
                                      ⚠️ {r.nombre}
                                    </span>
                                  );
                                })}
                                {restr.length > 2 && (
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: "0.65rem" }}>
                                    +{restr.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Plan activo */}
                          <td>
                            {plan?.nombre_plan ? (
                              <span
                                className="badge px-2 py-1"
                                style={{ background: "#0891b218", color: "#0891b2", fontSize: "0.7rem" }}
                              >
                                ✅ {plan.nombre_plan}
                              </span>
                            ) : plan ? (
                              <span className="badge bg-warning bg-opacity-15 text-warning" style={{ fontSize: "0.7rem" }}>
                                ⚙️ Plan personalizado
                              </span>
                            ) : (
                              <span className="badge bg-danger bg-opacity-10 text-danger" style={{ fontSize: "0.7rem" }}>
                                ❌ Sin plan
                              </span>
                            )}
                          </td>

                          {/* Calorías */}
                          <td className="text-center">
                            {plan?.calorias_estimadas ? (
                              <span className="badge bg-light text-dark border">
                                {plan.calorias_estimadas} kcal
                              </span>
                            ) : (
                              <small className="text-muted">—</small>
                            )}
                          </td>

                          {/* Comidas/día */}
                          <td className="text-center">
                            {plan?.num_comidas_diarias ? (
                              <span className="badge bg-light text-dark border">
                                {plan.num_comidas_diarias}×/día
                              </span>
                            ) : (
                              <small className="text-muted">—</small>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              {plan && (
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  id={`btn-ver-dieta-${getId(a)}`}
                                  title="Ver plan activo"
                                  onClick={() => setVerModal(a)}
                                >
                                  👁️
                                </button>
                              )}
                              <button
                                className="btn btn-sm fw-semibold text-white"
                                id={`btn-asignar-dieta-${getId(a)}`}
                                title={plan ? "Cambiar plan" : "Asignar plan"}
                                style={{ background: "linear-gradient(135deg,#0891b2,#0d9488)", border: "none", fontSize: "0.78rem" }}
                                onClick={() => abrirAsignar(a)}
                              >
                                {plan ? "🔄 Cambiar" : "➕ Asignar"}
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

        {/* ── Catálogo de planes nutricionales ── */}
        <div>
          <h2 className="h6 fw-bold text-muted text-uppercase mb-3" style={{ letterSpacing: "0.06em" }}>
            🍽️ Catálogo de Planes Nutricionales
          </h2>
          <div className="row g-3">
            {PLANES_NUTRICIONALES.map((p) => (
              <div key={p.id} className="col-md-6 col-xl-4">
                <div
                  className="card border-0 shadow-sm h-100"
                  style={{ borderLeft: `4px solid ${p.color}` }}
                >
                  <div className="card-body p-3">
                    {/* Header tarjeta */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold" style={{ color: p.color }}>
                          {p.icono} {p.nombre}
                        </div>
                        <small className="text-muted">{p.descripcion}</small>
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="d-flex gap-2 my-2 flex-wrap">
                      {Object.entries(p.macros).map(([key, val]) => (
                        <span
                          key={key}
                          className="badge px-2 py-1"
                          style={{ background: `${p.color}18`, color: p.color, fontSize: "0.65rem" }}
                        >
                          {key === "proteinas" ? "🥩" : key === "carbos" ? "🌾" : "🥑"} {val}
                        </span>
                      ))}
                    </div>

                    {/* Calorías y comidas */}
                    <div className="d-flex gap-3 text-muted small mb-2">
                      <span>🔥 {p.calorias} kcal/día</span>
                      <span>🍽️ {p.comidas} comidas/día</span>
                    </div>

                    {/* Alimentos típicos */}
                    <div className="d-flex flex-wrap gap-1 mt-2">
                      {p.alimentos.map((al) => (
                        <span
                          key={al}
                          className="badge bg-light text-secondary border"
                          style={{ fontSize: "0.62rem" }}
                        >
                          {al}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: ASIGNAR PLAN NUTRICIONAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {asignarModal && (
        <div
          className="modal d-block"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 1055 }}
          onClick={() => !saving && setAsignarModal(null)}
        >
          <div
            className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div
                className="modal-header text-white border-0"
                style={{ background: "linear-gradient(135deg,#0891b2,#0d9488)" }}
              >
                <h5 className="modal-title">
                  🥗 Asignar Plan Nutricional — {nombreCompleto(asignarModal)}
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
                    className="rounded-3 p-3 mb-4 d-flex align-items-start gap-3 flex-wrap"
                    style={{ background: "#f0fdfa", border: "1px solid #99f6e4" }}
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
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{nombreCompleto(asignarModal)}</div>
                      <div className="text-muted small">
                        {OBJETIVO_CONFIG[asignarModal.objetivo_fisico]?.icono} {asignarModal.objetivo_fisico}
                        &nbsp;·&nbsp; {asignarModal.nivel_experiencia}
                        &nbsp;·&nbsp; {asignarModal.disponibilidad_semanal_dias}d/sem
                      </div>
                      {/* Restricciones del afiliado */}
                      {(asignarModal.restricciones || []).length > 0 && (
                        <div className="mt-2 d-flex flex-wrap gap-1">
                          {asignarModal.restricciones.map((r) => {
                            const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                            return (
                              <span
                                key={r.id_restriccion}
                                className="badge px-2 py-1"
                                style={{ background: cfg.bg, color: cfg.text, fontSize: "0.65rem" }}
                                title={r.efecto_relevante || ""}
                              >
                                ⚠️ {r.nombre}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selector de plan */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">
                    Selecciona un plan nutricional
                  </h6>
                  <div className="row g-2 mb-4">
                    {PLANES_NUTRICIONALES.map((p) => {
                      const selec = planSelec?.id === p.id;
                      const compatible = p.compatible.includes(asignarModal.objetivo_fisico);
                      return (
                        <div key={p.id} className="col-md-6 col-xl-4">
                          <div
                            className="card border-0 h-100"
                            style={{
                              cursor: "pointer",
                              background: selec ? `${p.color}12` : "#f8fafc",
                              border:     selec ? `2px solid ${p.color}` : "2px solid #e2e8f0",
                              transition: "all 0.15s ease",
                              opacity:    1,
                            }}
                            onClick={() => {
                              setPlanSelec(p);
                              setCalorias(String(p.calorias));
                              setNumComidas(p.comidas);
                            }}
                          >
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="fw-semibold small" style={{ color: p.color }}>
                                  {p.icono} {p.nombre}
                                </div>
                                {selec && <span style={{ color: p.color }}>✓</span>}
                              </div>
                              <div className="text-muted mt-1" style={{ fontSize: "0.68rem" }}>
                                🔥 {p.calorias} kcal · 🍽️ {p.comidas} comidas/día
                              </div>
                              {compatible && (
                                <span
                                  className="badge mt-2 px-2"
                                  style={{ background: `${p.color}18`, color: p.color, fontSize: "0.6rem" }}
                                >
                                  ⭐ Recomendado para este objetivo
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Personalización */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">
                    Ajustar parámetros
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Calorías estimadas/día *</label>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control"
                          min={800} max={6000} step={50}
                          value={calorias}
                          onChange={(e) => setCalorias(e.target.value)}
                          required
                        />
                        <span className="input-group-text text-muted small">kcal</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Comidas por día</label>
                      <select
                        className="form-select"
                        value={numComidas}
                        onChange={(e) => setNumComidas(Number(e.target.value))}
                      >
                        {[3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>{n} comidas/día</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Observaciones</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: evitar lácteos..."
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Advertencia si ya tiene plan */}
                  {tienePlanNutricional(asignarModal) && (
                    <div className="alert alert-warning mt-3 py-2">
                      <small>
                        ⚠️ Este afiliado ya tiene un plan activo. Asignar uno nuevo reemplazará el ciclo anterior.
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
                    id="btn-confirmar-asignar-dieta"
                    type="submit"
                    className="btn btn-sm text-white fw-semibold px-4"
                    style={{ background: "linear-gradient(135deg,#0891b2,#0d9488)", border: "none" }}
                    disabled={saving || !planSelec}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "✅ Asignar plan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: VER PLAN NUTRICIONAL ACTIVO
      ═══════════════════════════════════════════════════════════════════════ */}
      {verModal && (() => {
        const ciclo = cicloActivo(verModal);
        const plan  = ciclo?.plan_nutricional;
        const objCfg = OBJETIVO_CONFIG[verModal.objetivo_fisico] || OBJETIVO_CONFIG["Mantenimiento"];

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
                    🥗 Plan activo — {nombreCompleto(verModal)}
                  </h5>
                  <button className="btn-close btn-close-white" onClick={() => setVerModal(null)} />
                </div>

                <div className="modal-body">
                  {/* Resumen del plan */}
                  <div className="row g-3 mb-4">
                    {[
                      { label: "Plan",          v: plan?.nombre_plan           || "Personalizado" },
                      { label: "Objetivo",       v: plan?.objetivo_dieta        || verModal.objetivo_fisico },
                      { label: "Calorías",       v: plan?.calorias_estimadas ? `${plan.calorias_estimadas} kcal` : "—" },
                      { label: "Comidas/día",    v: plan?.num_comidas_diarias   || "—" },
                      { label: "Inicio ciclo",   v: ciclo?.fecha_inicio         || "—" },
                      { label: "Fin ciclo",      v: ciclo?.fecha_fin            || "—" },
                    ].map((f) => (
                      <div key={f.label} className="col-6 col-md-4">
                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                          {f.label}
                        </small>
                        <span className="small fw-semibold">{f.v || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Macros */}
                  {plan?.macros && (
                    <>
                      <h6 className="fw-bold mb-3">📊 Distribución de macronutrientes</h6>
                      <div className="row g-2 mb-4">
                        {Object.entries(plan.macros).map(([key, val]) => (
                          <div key={key} className="col-4">
                            <div
                              className="card border-0 text-center p-3"
                              style={{ background: "#0891b218" }}
                            >
                              <div className="fw-bold fs-5" style={{ color: "#0891b2" }}>{val}</div>
                              <small className="text-muted text-capitalize">{key}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Alimentos base */}
                  {plan?.alimentos_base?.length > 0 && (
                    <>
                      <h6 className="fw-bold mb-3">🍱 Alimentos base del plan</h6>
                      <div className="d-flex flex-wrap gap-2 mb-4">
                        {plan.alimentos_base.map((al) => (
                          <span key={al} className="badge bg-light text-dark border px-3 py-2">
                            {al}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Detalle de comidas (si existe) */}
                  {plan?.detalle?.length > 0 && (
                    <>
                      <h6 className="fw-bold mb-3">📋 Distribución de comidas</h6>
                      {Array.from(new Set(plan.detalle.map((d) => d.numero_comida))).map((nc) => (
                        <div key={nc} className="border rounded-3 p-3 mb-2">
                          <div className="fw-semibold small mb-2">Comida {nc}</div>
                          {plan.detalle.filter((d) => d.numero_comida === nc).map((d, i) => (
                            <div key={i} className="d-flex justify-content-between small text-muted border-bottom py-1">
                              <span>🍽️ {d.nombre_alimento}</span>
                              <span className="fw-semibold">{d.cantidad_g} g</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}

                  {/* Restricciones del afiliado */}
                  {(verModal.restricciones || []).length > 0 && (
                    <>
                      <h6 className="fw-bold mt-4 mb-3">⚠️ Restricciones del afiliado</h6>
                      {verModal.restricciones.map((r) => {
                        const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                        return (
                          <div
                            key={r.id_restriccion}
                            className="rounded-3 p-2 mb-2 d-flex align-items-center gap-2"
                            style={{ background: cfg.bg }}
                          >
                            <span style={{ color: cfg.text, fontWeight: 700 }}>⚠️</span>
                            <div>
                              <div className="small fw-semibold" style={{ color: cfg.text }}>{r.nombre}</div>
                              {r.efecto_relevante && (
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{r.efecto_relevante}</div>
                              )}
                            </div>
                            <span
                              className="badge ms-auto"
                              style={{ background: cfg.bg, color: cfg.text, fontSize: "0.6rem", border: `1px solid ${cfg.text}44` }}
                            >
                              {r.tipo}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Observaciones */}
                  {plan?.observaciones && (
                    <div className="alert alert-info py-2 mt-3">
                      <small>📝 {plan.observaciones}</small>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0">
                  <button
                    className="btn btn-sm px-3 fw-semibold"
                    style={{ background: "linear-gradient(135deg,#0891b2,#0d9488)", color: "#fff", border: "none" }}
                    onClick={() => { setVerModal(null); abrirAsignar(verModal); }}
                  >
                    🔄 Cambiar plan
                  </button>
                  <button
                    className="btn btn-secondary btn-sm px-3"
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
