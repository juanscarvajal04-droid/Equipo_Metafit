import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto, inicial, cicloActivo } from "../utils/afiliadoHelpers";
import s from "./DietasView.module.css";

const OBJETIVO_CONFIG = {
  "Perdida de grasa": { icono: "🔥", color: "#e94560", bg: "#e9456018" },
  "Aumento de masa":  { icono: "💪", color: "#2563eb", bg: "#2563eb18" },
  "Mantenimiento":    { icono: "⚖️", color: "#059669", bg: "#05966918" },
};

const RESTRICCION_COLOR = {
  "Enfermedad": { bg: "#ef444418", text: "#dc2626" },
  "Alergia":    { bg: "#f9731618", text: "#ea580c" },
  "Lesion":     { bg: "#eab30818", text: "#ca8a04" },
};

import { useToast } from "../hooks/useToast";

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
  const { toast, showToast }        = useToast();

  // Modal asignar plan
  const [asignarModal, setAsignarModal] = useState(null);
  const [alimentosDisp, setAlimentosDisp] = useState([]);
  const [alimentosSel, setAlimentosSel] = useState({});
  const [calorias, setCalorias] = useState("");
  const [numComidas, setNumComidas] = useState(4);
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [asigError, setAsigError] = useState("");
  const [loadingAl, setLoadingAl] = useState(false);

  // Modal crear nuevo alimento en catálogo
  const [showNuevoAl, setShowNuevoAl] = useState(false);
  const [nuevoAlForm, setNuevoAlForm] = useState({
    nombre_alimento: "",
    proteinas: "",
    carbohidratos: "",
    grasas: "",
  });
  const [guardandoAl, setGuardandoAl] = useState(false);
  const [errorAl, setErrorAl] = useState("");

  // Modal eliminar alimento
  const [showEliminarAl, setShowEliminarAl] = useState(false);
  const [catalogoAlList, setCatalogoAlList] = useState([]);
  const [elimAlSeleccionado, setElimAlSeleccionado] = useState("");
  const [eliminandoAl, setEliminandoAl] = useState(false);
  const [errorElimAl, setErrorElimAl] = useState("");

  // Modal catálogo de alimentos
  const [showCatalogoAl, setShowCatalogoAl] = useState(false);
  const [catalogoAlData, setCatalogoAlData] = useState([]);
  const [loadingCatAl, setLoadingCatAl] = useState(false);

  // Modal editar alimento
  const [editAlModal, setEditAlModal] = useState(null);
  const [editAlForm, setEditAlForm] = useState({
    nombre_alimento: "",
    proteinas: "",
    carbohidratos: "",
    grasas: "",
  });
  const [guardandoEditAl, setGuardandoEditAl] = useState(false);
  const [errorEditAl, setErrorEditAl] = useState("");

  // Modal ver plan activo
  const [verModal, setVerModal] = useState(null);

  const cargarAfiliados = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(data);
      if (esRefresh) showToast(`Lista actualizada — ${data.length} afiliados`);
    } catch (err) {
      console.error('[DietasView] Error al cargar:', err.response?.status, err.response?.data || err.message);
      if (err?.response?.status === 401) { logout(); navigate("/login"); }
      else setError("No se pudieron cargar los afiliados.");
    } finally {
      esRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [authAxios, logout, navigate, showToast]);

  useEffect(() => { cargarAfiliados(); }, []);

  const tienePlanNutricional = (a) => !!cicloActivo(a)?.plan_nutricional;

  const filtrados = afiliados
    .filter((a) => {
      const t = busqueda.toLowerCase();
      return (
        nombreCompleto(a).toLowerCase().includes(t) ||
        (a.objetivo_fisico || "").toLowerCase().includes(t) ||
        (a.restricciones || []).some((r) => (r.nombre_restriccion || r.nombre || "").toLowerCase().includes(t))
      );
    })
    .sort((a, b) => {
      const aConPlan = tienePlanNutricional(a);
      const bConPlan = tienePlanNutricional(b);
      if (!aConPlan && bConPlan) return -1;
      if (aConPlan && !bConPlan) return 1;
      return 0;
    });

  const totalConPlan   = afiliados.filter((a) => tienePlanNutricional(a)).length;
  const alertasAlergia = afiliados.filter((a) => (a.restricciones || []).some((r) => r.tipo === "Alergia" || r.tipo === "Enfermedad")).length;

  const abrirAsignar = async (afiliado) => {
    setAsignarModal(afiliado);
    setAlimentosSel({});
    setCalorias("");
    setNumComidas(4);
    setObs("");
    setAsigError("");

    setLoadingAl(true);
    try {
      const { data } = await authAxios.get(`/afiliados/${getId(afiliado)}/alimentos-disponibles`);
      setAlimentosDisp(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length > 0) {
        const calAuto = Math.round(data.reduce((sum, a) => sum + (a.proteinas * 4 + a.carbohidratos * 4 + a.grasas * 9), 0) / data.length * 2.2);
        setCalorias(String(Math.min(5000, Math.max(800, calAuto))));
      }
    } catch (err) {
      console.error('[DietasView] Error cargando alimentos:', err);
      setAlimentosDisp([]);
      setAsigError("No se pudieron cargar los alimentos disponibles.");
    } finally {
      setLoadingAl(false);
    }
  };

  const toggleAlimento = (idAl) => {
    setAlimentosSel((prev) => {
      if (prev[idAl]) {
        const copy = { ...prev };
        delete copy[idAl];
        return copy;
      }
      return {
        ...prev,
        [idAl]: { cantidad_g: 100, num_comida: 1 },
      };
    });
  };

  const updateAlimento = (idAl, field, value) => {
    setAlimentosSel((prev) => ({
      ...prev,
      [idAl]: { ...prev[idAl], [field]: value },
    }));
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    const ids = Object.keys(alimentosSel);
    if (ids.length === 0) { setAsigError("Selecciona al menos un alimento."); return; }
    if (!calorias || isNaN(Number(calorias))) { setAsigError("Ingresa las calorías estimadas."); return; }

    setSaving(true); setAsigError("");
    try {
      const id = getId(asignarModal);

      // 1. Reutilizar ciclo activo existente o crear uno nuevo
      let idCiclo;
      const cicloExistente = asignarModal.ciclo_activo;
      if (cicloExistente) {
        idCiclo = cicloExistente.id_ciclo;
      } else {
        const cicloPayload = {
          id_usuario: id,
          fecha_inicio: new Date().toISOString().split("T")[0],
          fecha_fin: (() => { const d = new Date(); d.setDate(d.getDate() + 84); return d.toISOString().split("T")[0]; })(),
          objetivo_fisico: asignarModal.objetivo_fisico,
          nivel_experiencia: asignarModal.nivel_experiencia,
          disponibilidad_dias: asignarModal.disponibilidad_semanal_dias || 3,
          grupo_muscular_prioritario: asignarModal.grupo_muscular_prioritario || null,
        };
        const { data: cicloData } = await authAxios.post("/afiliados/ciclos", cicloPayload);
        idCiclo = cicloData.id_ciclo;
      }

      // 2. Crear plan nutricional
      await authAxios.post("/planes/nutricional", {
        id_ciclo: idCiclo,
        calorias_objetivo: Number(calorias),
        num_comidas: numComidas,
        observaciones: obs || null,
      });

      // 3. Agregar cada alimento seleccionado al detalle
      for (const idAl of ids) {
        const al = alimentosSel[idAl];
        await authAxios.post(`/planes/nutricional/${idCiclo}/detalle`, {
          id_alimento: parseInt(idAl),
          num_comida: al.num_comida,
          cantidad_g: al.cantidad_g,
        });
      }

      // 4. Actualizar estado local
      setAfiliados((prev) => prev.map((a) =>
        getId(a) === id ? {
          ...a,
          ciclo_activo: {
            ...a.ciclo_activo,
            id_ciclo: idCiclo,
            plan_nutricional: {
              calorias_objetivo: Number(calorias),
              num_comidas: numComidas,
            },
          },
        } : a
      ));
      setAsignarModal(null);
      showToast(`Plan nutricional creado para ${nombreCompleto(asignarModal)} con ${ids.length} alimentos`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Error desconocido";
      console.error('[DietasView.handleAsignar]', err);
      setAsigError(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      {toast.msg && (
        <div className={`${s.toast} shadow-lg`}>
          {toast.msg}
        </div>
      )}

      <div className={`container-fluid py-4 px-3 px-md-4 ${s.page}`}>
        {/* ── Encabezado ── */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className={`h4 fw-bold mb-0 d-flex align-items-center gap-2 ${s.headerTitle}`}>
              <span className={`d-inline-flex align-items-center justify-content-center text-white ${s.headerIcon}`}>🥗</span>
              Planes de Dieta
            </h1>
            <small className={s.headerSub}>
              {isAdmin
                ? "Vista de administrador — supervisión de planes nutricionales activos"
                : "Crea planes nutricionales personalizados con alimentos del catálogo disponible"}
            </small>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: "Total afiliados", valor: afiliados.length, color: "#4b9ecb" },
              { label: "Con plan activo", valor: totalConPlan, color: "#22c55e" },
              { label: "Alertas nutrición", valor: alertasAlergia, color: "#ef4444" },
            ].map((k) => (
              <div key={k.label} className={`text-center px-3 py-2 ${s.kpiCard}`}>
                <div className={`fw-bold fs-5 ${s.kpiValor}`} style={{ color: k.color }}>
                  {loading ? "—" : k.valor}
                </div>
                <div className={s.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-1 flex-wrap">
            <button className={`d-flex align-items-center gap-1 ${s.btnOutline}`}
              onClick={() => {
                setNuevoAlForm({ nombre_alimento: "", proteinas: "", carbohidratos: "", grasas: "" });
                setErrorAl("");
                setShowNuevoAl(true);
              }}
              title="Agregar nuevo alimento al catálogo">
              🥗 Agregar
            </button>
            <button className={`d-flex align-items-center gap-1 ${s.btnOutlineDanger}`}
              onClick={async () => {
                setErrorElimAl("");
                setElimAlSeleccionado("");
                try {
                  const { data } = await authAxios.get("/catalogo/alimentos");
                  setCatalogoAlList(Array.isArray(data) ? data : []);
                  setShowEliminarAl(true);
                } catch { setShowEliminarAl(true); }
              }}
              title="Eliminar alimento del catálogo">
              🗑️ Eliminar
            </button>
            <button className={`d-flex align-items-center gap-1 ${s.btnOutline}`}
              onClick={async () => {
                setLoadingCatAl(true);
                setShowCatalogoAl(true);
                try {
                  const { data } = await authAxios.get("/catalogo/alimentos");
                  setCatalogoAlData(Array.isArray(data) ? data : []);
                } catch { setCatalogoAlData([]); }
                setLoadingCatAl(false);
              }}
              title="Ver catálogo completo de alimentos">
              📋 Catálogo
            </button>
          </div>
        </div>

        {/* ── Tabla de afiliados ── */}
        <div className={`mb-4 ${s.tableCard}`}>
          <div className={s.tableCardHeader}>
            <span style={{color:"#94a3b8",fontSize:"0.85rem",fontWeight:600}}>{filtrados.length} afiliados</span>
            <div className="d-flex gap-2 align-items-center" style={{flex:1}}>
              <input type="text" className={`form-control form-control-sm ${s.searchInput}`}
                placeholder="🔍 Nombre, objetivo, restricción..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <button className={`d-flex align-items-center gap-1 ${s.btnRefresh}`}
                onClick={() => cargarAfiliados(true)} disabled={refreshing}>
                {refreshing
                  ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  : "🔄"}
                Actualizar
              </button>
            </div>
          </div>

          <div style={{borderRadius:"0 0 14px 14px"}}>
            {error   && <div className={s.alertDanger} style={{margin:"0.75rem",padding:"0.4rem 0.75rem"}}><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className={`spinner-border ${s.spinnerTeal}`} /></div>}

            {!loading && !error && (
              <div className="table-responsive">
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th style={{paddingLeft:"1.25rem"}}>#</th>
                      <th>Afiliado</th>
                      <th>Objetivo</th>
                      <th>Restricciones</th>
                      <th>Plan activo</th>
                      <th className="text-center">Calorías</th>
                      <th className="text-center">Comidas/día</th>
                      <th className="text-center" style={{paddingRight:"1rem"}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={`text-center py-5 ${s.emptyState}`}>
                          {busqueda ? `Sin resultados para "${busqueda}"` : "No hay afiliados."}
                        </td>
                      </tr>
                    ) : filtrados.map((a, idx) => {
                      const ciclo = cicloActivo(a);
                      const plan = ciclo?.plan_nutricional;
                      const objCfg = OBJETIVO_CONFIG[a.objetivo_fisico] || OBJETIVO_CONFIG["Mantenimiento"];
                      const restr = a.restricciones || [];
                      const hayAlerta = restr.some((r) => r.tipo === "Alergia" || r.tipo === "Enfermedad");

                      return (
                        <tr key={getId(a)} className={!plan ? s.rowSinPlan : hayAlerta ? s.rowConAlerta : ""}>
                          <td style={{paddingLeft:"1.25rem"}} className={s.emptyState}>{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={s.avatar}
                                style={{ background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small" style={{color:"#e0e0e0"}}>{nombreCompleto(a)}</div>
                                <div className={s.emailText}>{a.correo || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge px-2 py-1"
                              style={{ background: objCfg.bg, color: objCfg.color, fontSize: "0.7rem" }}>
                              {objCfg.icono} {a.objetivo_fisico || "—"}
                            </span>
                          </td>
                          <td>
                            {restr.length === 0 ? (
                              <span className={s.badgeDark} style={{fontSize:"0.7rem"}}>✓ Sin restricciones</span>
                            ) : (
                              <div className="d-flex flex-wrap gap-1">
                                {restr.slice(0, 2).map((r) => {
                                  const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                                  return (
                                    <span key={r.id_restriccion} className="badge px-2 py-1"
                                      title={r.efecto_relevante || r.nombre}
                                      style={{ background: cfg.bg, color: cfg.text, fontSize: "0.65rem" }}>
                                      ⚠️ {r.nombre_restriccion}
                                    </span>
                                  );
                                })}
                                {restr.length > 2 && (
                                  <span className={s.badgeDark} style={{fontSize:"0.65rem"}}>+{restr.length - 2}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {plan?.nombre_plan ? (
                              <span className={s.badgeDark} style={{fontSize:"0.7rem"}}>✅ {plan.nombre_plan}</span>
                            ) : plan ? (
                              <span className={s.badgeDark} style={{fontSize:"0.7rem",background:"rgba(234,179,8,0.15)",color:"#eab308"}}>⚙️ Plan personalizado</span>
                            ) : (
                              <span className={s.badgeDark} style={{fontSize:"0.7rem",background:"rgba(239,68,68,0.1)",color:"#ef4444"}}>❌ Sin plan</span>
                            )}
                          </td>
                          <td className="text-center">
                            {plan?.calorias_objetivo ? (
                              <span className={s.badgeDark} style={{fontSize:"0.7rem"}}>{plan.calorias_objetivo} kcal</span>
                            ) : (
                              <small className={s.emptyState}>—</small>
                            )}
                          </td>
                          <td className="text-center">
                            {plan?.num_comidas ? (
                              <span className={s.badgeDark} style={{fontSize:"0.7rem"}}>{plan.num_comidas}×/día</span>
                            ) : (
                              <small className={s.emptyState}>—</small>
                            )}
                          </td>
                          <td className="text-center" style={{paddingRight:"1rem"}}>
                            <div className="d-flex gap-1 justify-content-center">
                              {plan && (
                                <button className={s.btnOutline}
                                  title="Ver plan activo" onClick={() => setVerModal(a)}>👁️</button>
                              )}
                              <button className={`btn btn-sm fw-semibold text-white ${s.btnAsignar}`}
                                title={plan ? "Crear nuevo plan" : "Asignar plan"}
                                onClick={() => abrirAsignar(a)}>
                                {plan ? "🔄 Nueva" : "➕ Asignar"}
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: ASIGNAR PLAN NUTRICIONAL PERSONALIZADO
      ═══════════════════════════════════════════════════════════════════════ */}
      {asignarModal && (
        <div className={`modal d-block ${s.modalOverlay}`}
          onClick={() => !saving && setAsignarModal(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content border-0 shadow-lg ${s.modalContent}`}>
              <div className={`modal-header ${s.modalHeaderTeal}`}>
                <h5 className="modal-title">🥗 Crear Plan Nutricional — {nombreCompleto(asignarModal)}</h5>
                <button className="btn-close btn-close-white"
                  onClick={() => !saving && setAsignarModal(null)} disabled={saving} />
              </div>

              <form onSubmit={handleAsignar}>
                <div className={`modal-body ${s.modalBodyScroll}`}>
                  {asigError && (
                    <div className={s.alertDanger} style={{padding:"0.4rem 0.75rem",marginBottom:"0.75rem"}}><small>⚠️ {asigError}</small></div>
                  )}

                  {/* ── Info del afiliado + restricciones ── */}
                  <div className={s.afiliadoInfoBox}>
                    <div className={s.avatarLg}
                      style={{ background: `hsl(${(getId(asignarModal) * 47) % 360},65%,55%)` }}>
                      {inicial(asignarModal)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{nombreCompleto(asignarModal)}</div>
                      <div className="text-muted small">
                        {OBJETIVO_CONFIG[asignarModal.objetivo_fisico]?.icono} {asignarModal.objetivo_fisico}
                        &nbsp;·&nbsp;{asignarModal.nivel_experiencia}
                        &nbsp;·&nbsp;{asignarModal.disponibilidad_semanal_dias}d/sem
                      </div>
                      {(asignarModal.restricciones || []).length > 0 && (
                        <div className="mt-2 d-flex flex-wrap gap-1">
                          {asignarModal.restricciones.map((r) => {
                            const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                            return (
                              <span key={r.id_restriccion} className="badge px-2 py-1"
                                style={{ background: cfg.bg, color: cfg.text, fontSize: "0.65rem" }}
                                title={r.efecto_relevante || ""}>
                                ⚠️ {r.nombre_restriccion}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Selector de alimentos disponibles ── */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">
                    🍽️ Alimentos disponibles ({alimentosDisp.length})
                  </h6>

                  {loadingAl ? (
                    <div className="text-center py-4">
                      <div className={`spinner-border ${s.spinnerTeal}`} />
                      <p className="text-muted small mt-2">Cargando alimentos disponibles...</p>
                    </div>
                  ) : (
                    <div className="table-responsive mb-4" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <table className={s.table}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Alimento</th>
                            <th className="text-center">Prot (g)</th>
                            <th className="text-center">Carb (g)</th>
                            <th className="text-center">Gras (g)</th>
                            <th className="text-center">Kcal/100g</th>
                            <th style={{ width: 80 }}>Gramos</th>
                            <th style={{ width: 100 }}>Comida</th>
                          </tr>
                        </thead>
                        <tbody>
                          {alimentosDisp.length === 0 ? (
                            <tr>
                              <td colSpan={8} className={`text-center py-3 ${s.emptyState}`}>
                                No hay alimentos disponibles para este afiliado.
                              </td>
                            </tr>
                          ) : (
                            alimentosDisp.map((al) => {
                              const sel = alimentosSel[al.id_alimento];
                              const kcal = Math.round(al.proteinas * 4 + al.carbohidratos * 4 + al.grasas * 9);
                              return (
                                <tr key={al.id_alimento}
                                  style={sel ? { background: "rgba(124,58,237,0.15)" } : {}}>
                                  <td>
                                    <input type="checkbox" className={s.checkboxDark}
                                      checked={!!sel}
                                      onChange={() => toggleAlimento(al.id_alimento)} />
                                  </td>
                                  <td><span className="small" style={{color:"#e0e0e0"}}>{al.nombre_alimento}</span></td>
                                  <td className="text-center small" style={{color:"#94a3b8"}}>{al.proteinas}</td>
                                  <td className="text-center small" style={{color:"#94a3b8"}}>{al.carbohidratos}</td>
                                  <td className="text-center small" style={{color:"#94a3b8"}}>{al.grasas}</td>
                                  <td className="text-center small fw-semibold" style={{color:"#e0e0e0"}}>{kcal}</td>
                                  {sel ? (
                                    <>
                                      <td>
                                        <input type="number" className={`form-control form-control-sm ${s.inputDark}`} min={1} max={2000}
                                          value={sel.cantidad_g} style={{ width: 70 }}
                                          onChange={(e) => updateAlimento(al.id_alimento, "cantidad_g", Math.max(1, parseFloat(e.target.value) || 1))} />
                                      </td>
                                      <td>
                                        <select className={`form-select form-select-sm ${s.selectDark}`}
                                          value={sel.num_comida}
                                          onChange={(e) => updateAlimento(al.id_alimento, "num_comida", parseInt(e.target.value))}>
                                          {[1, 2, 3, 4, 5, 6].map((n) => (
                                            <option key={n} value={n}>Comida {n}</option>
                                          ))}
                                        </select>
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={2} className={s.emptyState} style={{fontSize:"0.85rem",textAlign:"center"}}>—</td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ── Resumen de selección ── */}
                  {Object.keys(alimentosSel).length > 0 && (
                    <div className={s.summaryCard}>
                      <small className="fw-semibold" style={{color:"#a78bfa"}}>
                        {Object.keys(alimentosSel).length} alimentos seleccionados
                        &nbsp;·&nbsp;
                        {new Set(Object.values(alimentosSel).map((a) => a.num_comida)).size} comida(s)
                      </small>
                    </div>
                  )}

                  {/* ── Parámetros del plan ── */}
                  <h6 className="fw-bold text-uppercase small mb-3" style={{color:"#94a3b8"}}>Ajustar parámetros</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Calorías estimadas/día *</label>
                      <div className="input-group">
                        <input type="number" className={`form-control ${s.inputDark}`} min={800} max={6000} step={50}
                          value={calorias} onChange={(e) => setCalorias(e.target.value)} required />
                        <span className={`input-group-text small ${s.inputGroupText}`}>kcal</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Comidas por día</label>
                      <select className={`form-select ${s.selectDark}`} value={numComidas}
                        onChange={(e) => setNumComidas(Number(e.target.value))}>
                        {[3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>{n} comidas/día</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Observaciones</label>
                      <input type="text" className={`form-control ${s.inputDark}`} placeholder="Ej: evitar lácteos..."
                        value={obs} onChange={(e) => setObs(e.target.value)} />
                    </div>
                  </div>

                  {tienePlanNutricional(asignarModal) && (
                    <div className={s.alertWarning} style={{marginTop:"1rem",padding:"0.4rem 0.75rem"}}>
                      <small>⚠️ Este afiliado ya tiene un plan activo. Crear uno nuevo reemplazará el ciclo anterior.</small>
                    </div>
                  )}
                </div>

                <div className={`modal-footer border-0 ${s.modalFooter}`}>
                  <button type="button" className={`btn btn-sm px-4 ${s.btnOutline}`}
                    onClick={() => setAsignarModal(null)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className={`btn btn-sm ${s.btnConfirmar}`}
                    disabled={saving || Object.keys(alimentosSel).length === 0}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "✅ Crear Plan Nutricional"}
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
        const plan = ciclo?.plan_nutricional;

        return (
          <div className={`modal d-block ${s.modalOverlay}`} onClick={() => setVerModal(null)}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
              <div className={`modal-content border-0 shadow-lg ${s.modalContent}`}>
                <div className={`modal-header ${s.modalHeaderDark}`}>
                  <h5 className="modal-title">🥗 Plan activo — {nombreCompleto(verModal)}</h5>
                  <button className="btn-close btn-close-white" onClick={() => setVerModal(null)} />
                </div>

                <div className={`modal-body ${s.modalBody}`}>
                  <div className="row g-3 mb-4">
                    {[
                      { label: "Plan", v: plan?.nombre_plan || "Personalizado" },
                      { label: "Objetivo", v: plan?.objetivo_dieta || verModal.objetivo_fisico },
                      { label: "Calorías", v: plan?.calorias_objetivo ? `${plan.calorias_objetivo} kcal` : "—" },
                      { label: "Comidas/día", v: plan?.num_comidas || "—" },
                      { label: "Inicio ciclo", v: ciclo?.fecha_inicio || "—" },
                      { label: "Fin ciclo", v: ciclo?.fecha_fin || "—" },
                    ].map((f) => (
                      <div key={f.label} className="col-6 col-md-4">
                        <small className="d-block text-uppercase fw-semibold" style={{ fontSize: "0.65rem", color:"#94a3b8" }}>
                          {f.label}
                        </small>
                        <span className="small fw-semibold" style={{color:"#e0e0e0"}}>{f.v || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Restricciones */}
                  {(verModal.restricciones || []).length > 0 && (
                    <>
                      <h6 className="fw-bold mb-3" style={{color:"#e0e0e0"}}>⚠️ Restricciones del afiliado</h6>
                      {verModal.restricciones.map((r) => {
                        const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                        return (
                          <div key={r.id_restriccion} className="rounded-3 p-2 mb-2 d-flex align-items-center gap-2"
                            style={{ background: cfg.bg }}>
                            <span style={{ color: cfg.text, fontWeight: 700 }}>⚠️</span>
                            <div>
                              <div className="small fw-semibold" style={{ color: cfg.text }}>{r.nombre_restriccion}</div>
                              {r.efecto_relevante && (
                                <div style={{ fontSize: "0.7rem", color:"#94a3b8" }}>{r.efecto_relevante}</div>
                              )}
                            </div>
                            <span className="badge ms-auto" style={{ background: cfg.bg, color: cfg.text, fontSize: "0.6rem", border: `1px solid ${cfg.text}44` }}>
                              {r.tipo}
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Detalle de comidas */}
                  {plan?.detalle?.length > 0 && (
                    <>
                      <h6 className="fw-bold mb-3" style={{color:"#e0e0e0"}}>📋 Distribución de comidas</h6>
                      {Array.from(new Set(plan.detalle.map((d) => d.num_comida))).map((nc) => (
                        <div key={nc} className={s.infoCard} style={{marginBottom:"0.5rem"}}>
                          <div className="fw-semibold small mb-2" style={{color:"#e0e0e0"}}>Comida {nc}</div>
                          {plan.detalle.filter((d) => d.num_comida === nc).map((d, i) => (
                            <div key={i} className="d-flex justify-content-between small py-1" style={{color:"#94a3b8",borderBottom:"1px solid #252545"}}>
                              <span>🍽️ {d.nombre_alimento}</span>
                              <span className="fw-semibold" style={{color:"#e0e0e0"}}>{d.cantidad_g} g</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}

                  {plan?.observaciones && (
                    <div className={s.alertInfo} style={{padding:"0.4rem 0.75rem",marginTop:"0.75rem"}}>
                      <small>📝 {plan.observaciones}</small>
                    </div>
                  )}
                </div>

                <div className={`modal-footer border-0 ${s.modalFooter}`}>
                  <button className={`btn btn-sm px-3 fw-semibold ${s.btnConfirmar}`}
                    onClick={() => { setVerModal(null); abrirAsignar(verModal); }}>
                    🔄 Crear nuevo plan
                  </button>
                  <button className={`btn btn-sm px-3 ${s.btnOutline}`} onClick={() => setVerModal(null)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: NUEVO ALIMENTO EN CATÁLOGO
      ═══════════════════════════════════════════════════════════════════════ */}
      {showNuevoAl && (
        <div className={`modal d-block ${s.modalOverlay}`} onClick={() => !guardandoAl && setShowNuevoAl(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content border-0 shadow-lg ${s.modalContent}`}>
              <div className={`modal-header ${s.modalHeaderTeal}`}>
                <h5 className="modal-title">🥗 Nuevo Alimento</h5>
                <button className="btn-close btn-close-white" onClick={() => !guardandoAl && setShowNuevoAl(false)} disabled={guardandoAl} />
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!nuevoAlForm.nombre_alimento.trim()) { setErrorAl("El nombre del alimento es obligatorio."); return; }
                const proteinas = parseFloat(nuevoAlForm.proteinas);
                const carbohidratos = parseFloat(nuevoAlForm.carbohidratos);
                const grasas = parseFloat(nuevoAlForm.grasas);
                if (isNaN(proteinas) || isNaN(carbohidratos) || isNaN(grasas)) { setErrorAl("Todos los macros deben ser valores numéricos."); return; }
                setGuardandoAl(true); setErrorAl("");
                try {
                  await authAxios.post("/catalogo/alimentos", {
                    nombre_alimento: nuevoAlForm.nombre_alimento.trim(),
                    proteinas,
                    carbohidratos,
                    grasas,
                  });
                  setShowNuevoAl(false);
                  showToast(`Alimento "${nuevoAlForm.nombre_alimento}" creado correctamente`);
                  // Refrescar alimentos disponibles si el modal de asignación está abierto
                  if (asignarModal) {
                    const { data } = await authAxios.get(`/afiliados/${getId(asignarModal)}/alimentos-disponibles`);
                    setAlimentosDisp(Array.isArray(data) ? data : []);
                  }
                } catch (err) {
                  setErrorAl(err?.response?.data?.error || "Error al crear el alimento");
                } finally {
                  setGuardandoAl(false);
                }
              }}>
                <div className={`modal-body ${s.modalBody}`}>
                  {errorAl && <div className={s.alertDanger} style={{padding:"0.4rem 0.75rem",marginBottom:"0.75rem"}}><small>⚠️ {errorAl}</small></div>}
                  <div className="mb-3">
                    <label className={`form-label small fw-semibold ${s.labelText}`}>Nombre del alimento *</label>
                    <input type="text" className={`form-control ${s.inputDark}`} required
                      value={nuevoAlForm.nombre_alimento}
                      onChange={(e) => setNuevoAlForm({ ...nuevoAlForm, nombre_alimento: e.target.value })} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Proteínas (g) *</label>
                      <input type="number" className={`form-control ${s.inputDark}`} min={0} step={0.1} required
                        value={nuevoAlForm.proteinas}
                        onChange={(e) => setNuevoAlForm({ ...nuevoAlForm, proteinas: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Carbohidratos (g) *</label>
                      <input type="number" className={`form-control ${s.inputDark}`} min={0} step={0.1} required
                        value={nuevoAlForm.carbohidratos}
                        onChange={(e) => setNuevoAlForm({ ...nuevoAlForm, carbohidratos: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Grasas (g) *</label>
                      <input type="number" className={`form-control ${s.inputDark}`} min={0} step={0.1} required
                        value={nuevoAlForm.grasas}
                        onChange={(e) => setNuevoAlForm({ ...nuevoAlForm, grasas: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className={`modal-footer border-0 ${s.modalFooter}`}>
                  <button type="button" className={`btn btn-sm px-4 ${s.btnOutline}`}
                    onClick={() => !guardandoAl && setShowNuevoAl(false)} disabled={guardandoAl}>
                    Cancelar
                  </button>
                  <button type="submit" className={`btn btn-sm fw-semibold px-4 text-white ${s.btnConfirmar}`}
                    disabled={guardandoAl}>
                    {guardandoAl
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "💾 Guardar Alimento"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: ELIMINAR ALIMENTO
      ═══════════════════════════════════════════════════════════════════════ */}
      {showEliminarAl && (
        <div className={`modal d-block ${s.modalOverlay}`} onClick={() => !eliminandoAl && setShowEliminarAl(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content border-0 shadow-lg ${s.modalContent}`}>
              <div className={`modal-header ${s.modalHeaderTeal}`}>
                <h5 className="modal-title">🗑️ Eliminar Alimento</h5>
                <button className="btn-close btn-close-white" onClick={() => !eliminandoAl && setShowEliminarAl(false)} disabled={eliminandoAl} />
              </div>
              <div className={`modal-body ${s.modalBody}`}>
                {errorElimAl && <div className={s.alertDanger} style={{padding:"0.4rem 0.75rem",marginBottom:"0.75rem"}}><small>⚠️ {errorElimAl}</small></div>}
                <div className="mb-3">
                  <label className={`form-label small fw-semibold ${s.labelText}`}>Seleccioná el alimento a eliminar *</label>
                  <select className={`form-select ${s.selectDark}`} value={elimAlSeleccionado}
                    onChange={(e) => setElimAlSeleccionado(e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {catalogoAlList.map((al) => (
                      <option key={al.id_alimento} value={al.id_alimento}>
                        {al.nombre_alimento} ({al.proteinas}g prot · {al.carbohidratos}g carb · {al.grasas}g gras)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`modal-footer border-0 ${s.modalFooter}`}>
                <button type="button" className={`btn btn-sm px-4 ${s.btnOutline}`}
                  onClick={() => !eliminandoAl && setShowEliminarAl(false)} disabled={eliminandoAl}>Cancelar</button>
                <button type="button" className={`btn btn-sm px-4 fw-semibold ${s.btnDanger}`}
                  disabled={!elimAlSeleccionado || eliminandoAl}
                  onClick={async () => {
                    setEliminandoAl(true); setErrorElimAl("");
                    try {
                      await authAxios.delete(`/catalogo/alimentos/${elimAlSeleccionado}`);
                      setShowEliminarAl(false);
                      const nombre = catalogoAlList.find(a => String(a.id_alimento) === elimAlSeleccionado)?.nombre_alimento || "";
                      showToast(`Alimento "${nombre}" eliminado correctamente`);
                      if (asignarModal) {
                        const { data } = await authAxios.get(`/afiliados/${getId(asignarModal)}/alimentos-disponibles`);
                        setAlimentosDisp(Array.isArray(data) ? data : []);
                      }
                    } catch (err) {
                      setErrorElimAl(err?.response?.data?.error || "Error al eliminar el alimento");
                    } finally { setEliminandoAl(false); }
                  }}>
                  {eliminandoAl ? <><span className="spinner-border spinner-border-sm me-2" />Eliminando...</> : "🗑️ Confirmar Eliminación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CATÁLOGO DE ALIMENTOS
      ═══════════════════════════════════════════════════════════════════════ */}
      {showCatalogoAl && (
        <div className={`modal d-block ${s.modalOverlay}`} onClick={() => setShowCatalogoAl(false)}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content border-0 shadow-lg ${s.modalContent}`}>
              <div className={`modal-header ${s.modalHeaderTeal}`}>
                <h5 className="modal-title">📋 Catálogo de Alimentos</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowCatalogoAl(false)} />
              </div>
              <div className={`modal-body ${s.modalBody}`}>
                {loadingCatAl ? (
                  <div className="text-center py-4"><div className={`spinner-border ${s.spinnerTeal}`} /></div>
                ) : catalogoAlData.length === 0 ? (
                  <p className={`text-center py-3 ${s.emptyState}`}>No hay alimentos en el catálogo.</p>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className={s.table}>
                      <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Nombre</th>
                          <th className="text-center">Prot (g)</th>
                          <th className="text-center">Carb (g)</th>
                          <th className="text-center">Gras (g)</th>
                          <th className="text-center">Kcal/100g</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalogoAlData.map((al) => {
                          const kcal = Math.round(al.proteinas * 4 + al.carbohidratos * 4 + al.grasas * 9);
                          return (
                            <tr key={al.id_alimento}>
                              <td><span className="small fw-semibold" style={{color:"#e0e0e0"}}>{al.nombre_alimento}</span></td>
                              <td className="text-center small" style={{color:"#94a3b8"}}>{al.proteinas}</td>
                              <td className="text-center small" style={{color:"#94a3b8"}}>{al.carbohidratos}</td>
                              <td className="text-center small" style={{color:"#94a3b8"}}>{al.grasas}</td>
                              <td className="text-center small fw-semibold" style={{color:"#e0e0e0"}}>{al.calorias_por_100g ?? kcal}</td>
                              <td className="text-center">
                                <div className="d-flex gap-1 justify-content-center">
                                  <button className={s.btnOutline} title="Editar"
                                    onClick={() => {
                                      setEditAlForm({
                                        nombre_alimento: al.nombre_alimento,
                                        proteinas: String(al.proteinas),
                                        carbohidratos: String(al.carbohidratos),
                                        grasas: String(al.grasas),
                                      });
                                      setErrorEditAl("");
                                      setEditAlModal(al.id_alimento);
                                    }}>✏️</button>
                                  <button className={s.btnOutlineDanger} title="Eliminar"
                                    onClick={async () => {
                                      if (!window.confirm(`¿Eliminar "${al.nombre_alimento}"?`)) return;
                                      try {
                                        await authAxios.delete(`/catalogo/alimentos/${al.id_alimento}`);
                                        setCatalogoAlData((prev) => prev.filter((a) => a.id_alimento !== al.id_alimento));
                                        showToast(`Alimento "${al.nombre_alimento}" eliminado`);
                                        if (asignarModal) {
                                          const { data } = await authAxios.get(`/afiliados/${getId(asignarModal)}/alimentos-disponibles`);
                                          setAlimentosDisp(Array.isArray(data) ? data : []);
                                        }
                                      } catch (err) {
                                        showToast(err?.response?.data?.error || "Error al eliminar", "danger");
                                      }
                                    }}>🗑️</button>
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
              <div className={`modal-footer border-0 ${s.modalFooter}`}>
                <button className={`btn btn-sm px-4 ${s.btnOutline}`} onClick={() => setShowCatalogoAl(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: EDITAR ALIMENTO
      ═══════════════════════════════════════════════════════════════════════ */}
      {editAlModal && (
        <div className={`modal d-block ${s.modalOverlay}`} onClick={() => !guardandoEditAl && setEditAlModal(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-content border-0 shadow-lg ${s.modalContent}`}>
              <div className={`modal-header ${s.modalHeaderTeal}`}>
                <h5 className="modal-title">✏️ Editar Alimento</h5>
                <button className="btn-close btn-close-white" onClick={() => !guardandoEditAl && setEditAlModal(null)} disabled={guardandoEditAl} />
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editAlForm.nombre_alimento.trim()) { setErrorEditAl("El nombre del alimento es obligatorio."); return; }
                const proteinas = parseFloat(editAlForm.proteinas);
                const carbohidratos = parseFloat(editAlForm.carbohidratos);
                const grasas = parseFloat(editAlForm.grasas);
                if (isNaN(proteinas) || isNaN(carbohidratos) || isNaN(grasas)) { setErrorEditAl("Todos los macros deben ser valores numéricos."); return; }
                setGuardandoEditAl(true); setErrorEditAl("");
                try {
                  await authAxios.put(`/catalogo/alimentos/${editAlModal}`, {
                    nombre_alimento: editAlForm.nombre_alimento.trim(),
                    proteinas, carbohidratos, grasas,
                  });
                  setEditAlModal(null);
                  showToast(`Alimento "${editAlForm.nombre_alimento}" actualizado`);
                  const { data } = await authAxios.get("/catalogo/alimentos");
                  setCatalogoAlData(Array.isArray(data) ? data : []);
                  if (asignarModal) {
                    const { data: disp } = await authAxios.get(`/afiliados/${getId(asignarModal)}/alimentos-disponibles`);
                    setAlimentosDisp(Array.isArray(disp) ? disp : []);
                  }
                } catch (err) {
                  setErrorEditAl(err?.response?.data?.error || "Error al actualizar");
                } finally { setGuardandoEditAl(false); }
              }}>
                <div className={`modal-body ${s.modalBody}`}>
                  {errorEditAl && <div className={s.alertDanger} style={{padding:"0.4rem 0.75rem",marginBottom:"0.75rem"}}><small>⚠️ {errorEditAl}</small></div>}
                  <div className="mb-3">
                    <label className={`form-label small fw-semibold ${s.labelText}`}>Nombre del alimento *</label>
                    <input type="text" className={`form-control ${s.inputDark}`} required
                      value={editAlForm.nombre_alimento}
                      onChange={(e) => setEditAlForm({ ...editAlForm, nombre_alimento: e.target.value })} />
                  </div>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Proteínas (g) *</label>
                      <input type="number" className={`form-control ${s.inputDark}`} min={0} step={0.1} required
                        value={editAlForm.proteinas}
                        onChange={(e) => setEditAlForm({ ...editAlForm, proteinas: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Carbohidratos (g) *</label>
                      <input type="number" className={`form-control ${s.inputDark}`} min={0} step={0.1} required
                        value={editAlForm.carbohidratos}
                        onChange={(e) => setEditAlForm({ ...editAlForm, carbohidratos: e.target.value })} />
                    </div>
                    <div className="col-md-4">
                      <label className={`form-label small fw-semibold ${s.labelText}`}>Grasas (g) *</label>
                      <input type="number" className={`form-control ${s.inputDark}`} min={0} step={0.1} required
                        value={editAlForm.grasas}
                        onChange={(e) => setEditAlForm({ ...editAlForm, grasas: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className={`modal-footer border-0 ${s.modalFooter}`}>
                  <button type="button" className={`btn btn-sm px-4 ${s.btnOutline}`}
                    onClick={() => !guardandoEditAl && setEditAlModal(null)} disabled={guardandoEditAl}>Cancelar</button>
                  <button type="submit" className={`btn btn-sm fw-semibold px-4 text-white ${s.btnConfirmar}`}
                    disabled={guardandoEditAl}>
                    {guardandoEditAl
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "💾 Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
