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

      // 1. Crear ciclo
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
      const idCiclo = cicloData.id_ciclo;

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
        <div className={`${s.toast} alert alert-${toast.type === "danger" ? "danger" : "dark"} shadow-lg`}>
          {toast.msg}
        </div>
      )}

      <div className="container-fluid py-4 px-3 px-md-4">
        {/* ── Encabezado ── */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
              <span className={`d-inline-flex align-items-center justify-content-center rounded-2 text-white ${s.headerIcon}`}>🥗</span>
              Planes de Dieta
            </h1>
            <small className="text-muted">
              {isAdmin
                ? "Vista de administrador — supervisión de planes nutricionales activos"
                : "Crea planes nutricionales personalizados con alimentos del catálogo disponible"}
            </small>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: "Total afiliados", valor: afiliados.length, color: "#0891b2" },
              { label: "Con plan activo", valor: totalConPlan, color: "#059669" },
              { label: "Alertas nutrición", valor: alertasAlergia, color: "#e94560" },
            ].map((k) => (
              <div key={k.label} className={`card border-0 shadow-sm text-center px-3 py-2 ${s.kpiCard}`}>
                <div className={`fw-bold fs-5 ${s.kpiValor}`} style={{ color: k.color }}>
                  {loading ? "—" : k.valor}
                </div>
                <div className={`text-muted ${s.kpiLabel}`}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabla de afiliados ── */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0 flex-wrap gap-2">
            <span className="fw-semibold text-muted small">{filtrados.length} afiliados</span>
            <div className="d-flex gap-2 align-items-center">
              <input type="text" className={`form-control form-control-sm ${s.searchInput}`}
                placeholder="🔍 Nombre, objetivo, restricción..."
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <button className={`btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 ${s.btnRefresh}`}
                onClick={() => cargarAfiliados(true)} disabled={refreshing}>
                {refreshing
                  ? <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  : "🔄"}
                Actualizar
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            {error   && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className={`spinner-border ${s.spinnerTeal}`} /></div>}

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
                      const ciclo = cicloActivo(a);
                      const plan = ciclo?.plan_nutricional;
                      const objCfg = OBJETIVO_CONFIG[a.objetivo_fisico] || OBJETIVO_CONFIG["Mantenimiento"];
                      const restr = a.restricciones || [];
                      const hayAlerta = restr.some((r) => r.tipo === "Alergia" || r.tipo === "Enfermedad");

                      return (
                        <tr key={getId(a)} className={!plan ? s.rowSinPlan : hayAlerta ? s.rowConAlerta : ""}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={s.avatar}
                                style={{ background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className={`text-muted ${s.emailText}`}>{a.correo || "—"}</div>
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
                              <span className="badge bg-success bg-opacity-10 text-success" style={{ fontSize: "0.7rem" }}>
                                ✓ Sin restricciones
                              </span>
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
                                  <span className="badge bg-secondary bg-opacity-10 text-secondary" style={{ fontSize: "0.65rem" }}>
                                    +{restr.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            {plan?.nombre_plan ? (
                              <span className="badge px-2 py-1"
                                style={{ background: "#0891b218", color: "#0891b2", fontSize: "0.7rem" }}>
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
                          <td className="text-center">
                            {plan?.calorias_objetivo ? (
                              <span className="badge bg-light text-dark border">{plan.calorias_objetivo} kcal</span>
                            ) : (
                              <small className="text-muted">—</small>
                            )}
                          </td>
                          <td className="text-center">
                            {plan?.num_comidas ? (
                              <span className="badge bg-light text-dark border">{plan.num_comidas}×/día</span>
                            ) : (
                              <small className="text-muted">—</small>
                            )}
                          </td>
                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              {plan && (
                                <button className="btn btn-outline-primary btn-sm"
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
            <div className="modal-content border-0 shadow-lg">
              <div className={`modal-header ${s.modalHeaderTeal}`}>
                <h5 className="modal-title">🥗 Crear Plan Nutricional — {nombreCompleto(asignarModal)}</h5>
                <button className="btn-close btn-close-white"
                  onClick={() => !saving && setAsignarModal(null)} disabled={saving} />
              </div>

              <form onSubmit={handleAsignar}>
                <div className={`modal-body ${s.modalBodyScroll}`}>
                  {asigError && (
                    <div className="alert alert-danger py-2 mb-3"><small>⚠️ {asigError}</small></div>
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
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
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
                              <td colSpan={8} className="text-center text-muted py-3">
                                No hay alimentos disponibles para este afiliado.
                              </td>
                            </tr>
                          ) : (
                            alimentosDisp.map((al) => {
                              const sel = alimentosSel[al.id_alimento];
                              const kcal = Math.round(al.proteinas * 4 + al.carbohidratos * 4 + al.grasas * 9);
                              return (
                                <tr key={al.id_alimento}
                                  style={sel ? { background: "#f0fdfa" } : {}}>
                                  <td>
                                    <input type="checkbox" className="form-check-input"
                                      checked={!!sel}
                                      onChange={() => toggleAlimento(al.id_alimento)} />
                                  </td>
                                  <td><span className="small">{al.nombre_alimento}</span></td>
                                  <td className="text-center small">{al.proteinas}</td>
                                  <td className="text-center small">{al.carbohidratos}</td>
                                  <td className="text-center small">{al.grasas}</td>
                                  <td className="text-center small fw-semibold">{kcal}</td>
                                  {sel ? (
                                    <>
                                      <td>
                                        <input type="number" className="form-control form-control-sm" min={1} max={2000}
                                          value={sel.cantidad_g} style={{ width: 70 }}
                                          onChange={(e) => updateAlimento(al.id_alimento, "cantidad_g", Math.max(1, parseFloat(e.target.value) || 1))} />
                                      </td>
                                      <td>
                                        <select className="form-select form-select-sm"
                                          value={sel.num_comida}
                                          onChange={(e) => updateAlimento(al.id_alimento, "num_comida", parseInt(e.target.value))}>
                                          {[1, 2, 3, 4, 5, 6].map((n) => (
                                            <option key={n} value={n}>Comida {n}</option>
                                          ))}
                                        </select>
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={2} className="text-muted small text-center">—</td>
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
                    <div className="rounded-3 p-3 mb-3" style={{ background: "#f0fdfa", border: "1px solid #99f6e4" }}>
                      <small className="fw-semibold">
                        {Object.keys(alimentosSel).length} alimentos seleccionados
                        &nbsp;·&nbsp;
                        {new Set(Object.values(alimentosSel).map((a) => a.num_comida)).size} comida(s)
                      </small>
                    </div>
                  )}

                  {/* ── Parámetros del plan ── */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">Ajustar parámetros</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Calorías estimadas/día *</label>
                      <div className="input-group">
                        <input type="number" className="form-control" min={800} max={6000} step={50}
                          value={calorias} onChange={(e) => setCalorias(e.target.value)} required />
                        <span className="input-group-text text-muted small">kcal</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Comidas por día</label>
                      <select className="form-select" value={numComidas}
                        onChange={(e) => setNumComidas(Number(e.target.value))}>
                        {[3, 4, 5, 6].map((n) => (
                          <option key={n} value={n}>{n} comidas/día</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Observaciones</label>
                      <input type="text" className="form-control" placeholder="Ej: evitar lácteos..."
                        value={obs} onChange={(e) => setObs(e.target.value)} />
                    </div>
                  </div>

                  {tienePlanNutricional(asignarModal) && (
                    <div className="alert alert-warning mt-3 py-2">
                      <small>⚠️ Este afiliado ya tiene un plan activo. Crear uno nuevo reemplazará el ciclo anterior.</small>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary btn-sm px-4"
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
        const objCfg = OBJETIVO_CONFIG[verModal.objetivo_fisico] || OBJETIVO_CONFIG["Mantenimiento"];

        return (
          <div className={`modal d-block ${s.modalOverlay}`} onClick={() => setVerModal(null)}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg">
                <div className={`modal-header ${s.modalHeaderDark}`}>
                  <h5 className="modal-title">🥗 Plan activo — {nombreCompleto(verModal)}</h5>
                  <button className="btn-close btn-close-white" onClick={() => setVerModal(null)} />
                </div>

                <div className="modal-body">
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
                        <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                          {f.label}
                        </small>
                        <span className="small fw-semibold">{f.v || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {/* Restricciones */}
                  {(verModal.restricciones || []).length > 0 && (
                    <>
                      <h6 className="fw-bold mb-3">⚠️ Restricciones del afiliado</h6>
                      {verModal.restricciones.map((r) => {
                        const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                        return (
                          <div key={r.id_restriccion} className="rounded-3 p-2 mb-2 d-flex align-items-center gap-2"
                            style={{ background: cfg.bg }}>
                            <span style={{ color: cfg.text, fontWeight: 700 }}>⚠️</span>
                            <div>
                              <div className="small fw-semibold" style={{ color: cfg.text }}>{r.nombre_restriccion}</div>
                              {r.efecto_relevante && (
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{r.efecto_relevante}</div>
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
                      <h6 className="fw-bold mb-3">📋 Distribución de comidas</h6>
                      {Array.from(new Set(plan.detalle.map((d) => d.num_comida))).map((nc) => (
                        <div key={nc} className="border rounded-3 p-3 mb-2">
                          <div className="fw-semibold small mb-2">Comida {nc}</div>
                          {plan.detalle.filter((d) => d.num_comida === nc).map((d, i) => (
                            <div key={i} className="d-flex justify-content-between small text-muted border-bottom py-1">
                              <span>🍽️ {d.nombre_alimento}</span>
                              <span className="fw-semibold">{d.cantidad_g} g</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}

                  {plan?.observaciones && (
                    <div className="alert alert-info py-2 mt-3">
                      <small>📝 {plan.observaciones}</small>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0">
                  <button className="btn btn-sm px-3 fw-semibold"
                    style={{ background: "linear-gradient(135deg,#0891b2,#0d9488)", color: "#fff", border: "none" }}
                    onClick={() => { setVerModal(null); abrirAsignar(verModal); }}>
                    🔄 Crear nuevo plan
                  </button>
                  <button className="btn btn-secondary btn-sm px-3" onClick={() => setVerModal(null)}>
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
