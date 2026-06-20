import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto, inicial, cicloActivo } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import styles from "./RutinasView.module.css";

const NIVEL_COLOR = {
  Principiante: { bg: "#0ea5e922", text: "#0284c7", label: "Principiante" },
  Intermedio:   { bg: "#8b5cf622", text: "#7c3aed", label: "Intermedio"   },
  Avanzado:     { bg: "#ef444422", text: "#dc2626", label: "Avanzado"     },
};

const OBJETIVO_ICON = {
  "Perdida de grasa": "🔥",
  "Aumento de masa":  "💪",
  "Mantenimiento":    "⚖️",
};

const RESTRICCION_COLOR = {
  "Enfermedad": { bg: "#ef444418", text: "#dc2626" },
  "Alergia":    { bg: "#f9731618", text: "#ea580c" },
  "Lesion":     { bg: "#eab30818", text: "#ca8a04" },
};

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

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
  const { toast, showToast }         = useToast();

  // Modal crear rutina personalizada
  const [asignarModal, setAsignarModal] = useState(null);
  const [ejerciciosDisp, setEjerciciosDisp] = useState([]);
  const [ejerciciosSel, setEjerciciosSel] = useState({});
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState("");
  const [saving, setSaving] = useState(false);
  const [asigError, setAsigError] = useState("");
  const [loadingEj, setLoadingEj] = useState(false);

  // Modal ver rutina activa
  const [verModal, setVerModal] = useState(null);

  const cargarAfiliados = useCallback(async (esRefresh = false) => {
    esRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(data);
      if (esRefresh) showToast(`Lista actualizada — ${data.length} afiliados`);
    } catch (err) {
      console.error('[RutinasView] Error al cargar:', err.response?.status, err.response?.data || err.message);
      if (err?.response?.status === 401) { logout(); navigate("/login"); }
      else setError("No se pudieron cargar los afiliados.");
    } finally {
      esRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [authAxios, logout, navigate, showToast]);

  useEffect(() => { cargarAfiliados(); }, []);

  const filtrados = afiliados
    .filter((a) => {
      const t = busqueda.toLowerCase();
      return (
        nombreCompleto(a).toLowerCase().includes(t) ||
        (a.objetivo_fisico || "").toLowerCase().includes(t) ||
        (a.nivel_experiencia || "").toLowerCase().includes(t)
      );
    })
    .sort((a, b) => {
      const aConRutina = !!cicloActivo(a);
      const bConRutina = !!cicloActivo(b);
      if (!aConRutina && bConRutina) return -1;
      if (aConRutina && !bConRutina) return 1;
      return 0;
    });

  const abrirAsignar = async (afiliado) => {
    setAsignarModal(afiliado);
    setEjerciciosSel({});
    setAsigError("");
    setFechaInicio(new Date().toISOString().split("T")[0]);
    const fin = new Date();
    fin.setDate(fin.getDate() + 56);
    setFechaFin(fin.toISOString().split("T")[0]);

    setLoadingEj(true);
    try {
      const { data } = await authAxios.get(`/afiliados/${getId(afiliado)}/ejercicios-disponibles`);
      setEjerciciosDisp(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[RutinasView] Error cargando ejercicios:', err);
      setEjerciciosDisp([]);
      setAsigError("No se pudieron cargar los ejercicios disponibles.");
    } finally {
      setLoadingEj(false);
    }
  };

  const toggleEjercicio = (idEj) => {
    setEjerciciosSel((prev) => {
      if (prev[idEj]) {
        const copy = { ...prev };
        delete copy[idEj];
        return copy;
      }
      return {
        ...prev,
        [idEj]: { series: 3, repeticiones: 12, dia: 1 },
      };
    });
  };

  const updateEjercicio = (idEj, field, value) => {
    setEjerciciosSel((prev) => ({
      ...prev,
      [idEj]: { ...prev[idEj], [field]: value },
    }));
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    const ids = Object.keys(ejerciciosSel);
    if (ids.length === 0) { setAsigError("Selecciona al menos un ejercicio."); return; }
    if (!fechaInicio || !fechaFin) { setAsigError("Las fechas son obligatorias."); return; }
    if (fechaFin <= fechaInicio) { setAsigError("La fecha de fin debe ser posterior al inicio."); return; }

    setSaving(true); setAsigError("");
    try {
      const id = getId(asignarModal);
      // 1. Crear ciclo
      const cicloPayload = {
        id_usuario: id,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        objetivo_fisico: asignarModal.objetivo_fisico,
        nivel_experiencia: asignarModal.nivel_experiencia,
        disponibilidad_dias: asignarModal.disponibilidad_semanal_dias || 3,
        grupo_muscular_prioritario: asignarModal.grupo_muscular_prioritario || null,
        observaciones: "Plan creado desde el asistente inteligente",
      };
      const { data: cicloData } = await authAxios.post("/afiliados/ciclos", cicloPayload);
      const idCiclo = cicloData.id_ciclo;

      // 2. Crear plan de entrenamiento
      await authAxios.post("/planes/entrenamiento", { id_ciclo: idCiclo });

      // 3. Agrupar ejercicios por día y crear rutinas + ejercicios
      const dias = {};
      for (const idEj of ids) {
        const ej = ejerciciosSel[idEj];
        if (!dias[ej.dia]) dias[ej.dia] = [];
        dias[ej.dia].push(idEj);
      }

      for (const [diaNum, ejerciciosDiaIds] of Object.entries(dias)) {
        const nombreDia = DAY_LABELS[parseInt(diaNum) - 1] || `Día ${diaNum}`;
        const { data: rutinaData } = await authAxios.post("/planes/rutinas", {
          id_ciclo: idCiclo,
          nombre_rutina: `Día ${diaNum} — ${nombreDia}`,
          enfoque_muscular: "Full Body",
          dia_numero: parseInt(diaNum),
        });
        const idRutina = rutinaData.id;

        for (let i = 0; i < ejerciciosDiaIds.length; i++) {
          const idEj = ejerciciosDiaIds[i];
          const ej = ejerciciosSel[idEj];
          await authAxios.post(`/planes/rutinas/${idRutina}/ejercicios`, {
            id_ejercicio: parseInt(idEj),
            series: ej.series,
            repeticiones: ej.repeticiones,
            orden: i + 1,
          });
        }
      }

      // 4. Actualizar estado local
      setAfiliados((prev) => prev.map((a) =>
        getId(a) === id ? {
          ...a,
          ciclo_activo: {
            id_ciclo: idCiclo,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            plan_entrenamiento: { nombre_rutina: "Personalizado", enfoque: "Asistente inteligente" },
            numero_ciclo: (asignarModal.ciclo_activo?.numero_ciclo || 0) + 1,
          },
        } : a
      ));
      setAsignarModal(null);
      showToast(`Plan de entrenamiento creado para ${nombreCompleto(asignarModal)} con ${ids.length} ejercicios`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Error desconocido";
      console.error('[RutinasView.handleAsignar]', err.response?.data || err);
      setAsigError(`Error al guardar: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const gruposMusculares = [...new Set(ejerciciosDisp.map((e) => e.grupo_muscular))];

  return (
    <AppLayout>
      {toast.msg && (
        <div className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type === "danger" ? "danger" : "dark"} shadow-lg py-2 px-3 ${styles.toast}`}>
          {toast.msg}
        </div>
      )}

      <div className="container-fluid py-4 px-3 px-md-4">
        {/* ── Encabezado ── */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
              <span className={`d-inline-flex align-items-center justify-content-center rounded-2 text-white ${styles.titleIcon}`}>
                🏋️
              </span>
              Planes de Entrenamiento
            </h1>
            <small className="text-muted">
              {isAdmin
                ? "Vista de administrador — supervisión de rutinas asignadas"
                : "Crea rutinas personalizadas seleccionando ejercicios del catálogo disponible"}
            </small>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: "Total afiliados", valor: afiliados.length, color: "#059669" },
              { label: "Con rutina activa", valor: afiliados.filter((a) => cicloActivo(a)).length, color: "#7c3aed" },
              { label: "Sin rutina", valor: afiliados.filter((a) => !cicloActivo(a)).length, color: "#e94560" },
            ].map((k) => (
              <div key={k.label} className={`card border-0 shadow-sm text-center px-3 py-2 ${styles.kpiCard}`}>
                <div className="fw-bold fs-5" style={{ color: k.color }}>
                  {loading ? "—" : k.valor}
                </div>
                <div className={`text-muted ${styles.kpiLabel}`}>{k.label}</div>
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
                type="text"
                className={`form-control form-control-sm ${styles.searchInput}`}
                placeholder="🔍 Nombre, objetivo, nivel..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button
                className={`btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 ${styles.exportBtn}`}
                onClick={() => cargarAfiliados(true)}
                disabled={refreshing}
                title="Recargar lista de afiliados"
              >
                {refreshing
                  ? <span className={`spinner-border spinner-border-sm ${styles.spinnerSm}`} />
                  : "🔄"}
                Actualizar
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            {error   && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className={`spinner-border ${styles.spinnerBrand}`} /></div>}

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
                      const sinRutina = !cicloActivo(a);
                      const ciclo = cicloActivo(a);
                      const nivelCfg = NIVEL_COLOR[a.nivel_experiencia] || NIVEL_COLOR.Principiante;

                      return (
                        <tr key={getId(a)} style={sinRutina ? { background: "#fff8f0", borderLeft: "3px solid #f97316" } : {}}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={styles.avatarTd}
                                style={{ background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className={`text-muted ${styles.emailSm}`}>{a.correo || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td><small>{OBJETIVO_ICON[a.objetivo_fisico]} {a.objetivo_fisico || "—"}</small></td>
                          <td>
                            <span className={`badge px-2 py-1 ${styles.badgeSm}`}
                              style={{ background: nivelCfg.bg, color: nivelCfg.text }}>
                              {nivelCfg.label}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="badge bg-light text-dark border">
                              {a.disponibilidad_semanal_dias || "—"}d
                            </span>
                          </td>
                          <td>
                            {ciclo?.plan_entrenamiento?.nombre_rutina ? (
                              <span className={`badge px-2 py-1 ${styles.badgeCiclo}`}>
                                ✅ {ciclo.plan_entrenamiento.nombre_rutina}
                              </span>
                            ) : ciclo ? (
                              <span className={`badge bg-warning bg-opacity-15 text-warning ${styles.badgeSm}`}>
                                ⚙️ Plan personalizado
                              </span>
                            ) : (
                              <span className={`badge bg-danger bg-opacity-10 text-danger ${styles.badgeSm}`}>
                                ❌ Sin rutina
                              </span>
                            )}
                          </td>
                          <td>
                            {ciclo ? (
                              <small className="text-muted">{ciclo.fecha_inicio} → {ciclo.fecha_fin}</small>
                            ) : (
                              <small className="text-muted">—</small>
                            )}
                          </td>
                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              {ciclo && (
                                <button className="btn btn-outline-primary btn-sm"
                                  title="Ver rutina activa"
                                  onClick={() => setVerModal(a)}>👁️</button>
                              )}
                              <button className={`btn btn-sm fw-semibold text-white ${styles.btnAsignar}`}
                                title={ciclo ? "Crear nueva rutina" : "Asignar rutina"}
                                onClick={() => abrirAsignar(a)}>
                                {ciclo ? "🔄 Nueva" : "➕ Asignar"}
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
          MODAL: ASIGNAR RUTINA PERSONALIZADA
      ═══════════════════════════════════════════════════════════════════════ */}
      {asignarModal && (
        <div className={`modal d-block ${styles.modalOverlay}`}
          onClick={() => !saving && setAsignarModal(null)}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg">
              <div className={`modal-header text-white border-0 ${styles.modalHeaderVerde}`}>
                <h5 className="modal-title">🏋️ Crear Rutina — {nombreCompleto(asignarModal)}</h5>
                <button className="btn-close btn-close-white"
                  onClick={() => !saving && setAsignarModal(null)} disabled={saving} />
              </div>

              <form onSubmit={handleAsignar}>
                <div className={`modal-body ${styles.modalBody}`}>
                  {asigError && (
                    <div className="alert alert-danger py-2 mb-3"><small>⚠️ {asigError}</small></div>
                  )}

                  {/* ── Info del afiliado + restricciones ── */}
                  <div className={`rounded-3 p-3 mb-4 ${styles.afiliadoSection}`}>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className={styles.avatarModal}
                        style={{ background: `hsl(${(getId(asignarModal) * 47) % 360},65%,55%)` }}>
                        {inicial(asignarModal)}
                      </div>
                      <div>
                        <div className="fw-semibold">{nombreCompleto(asignarModal)}</div>
                        <div className="text-muted small">
                          {OBJETIVO_ICON[asignarModal.objetivo_fisico]} {asignarModal.objetivo_fisico}
                          &nbsp;·&nbsp;{asignarModal.nivel_experiencia}
                          &nbsp;·&nbsp;{asignarModal.disponibilidad_semanal_dias}d/sem
                          {asignarModal.grupo_muscular_prioritario && (
                            <>· Grupo prioritario: {asignarModal.grupo_muscular_prioritario}</>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Restricciones del afiliado */}
                    {(asignarModal.restricciones || []).length > 0 && (
                      <div className="d-flex flex-wrap gap-1 mt-2">
                        {(asignarModal.restricciones || []).map((r) => {
                          const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                          return (
                            <span key={r.id_restriccion} className="badge px-2 py-1"
                              style={{ background: cfg.bg, color: cfg.text, fontSize: "0.65rem" }}
                              title={r.efecto_relevante || ""}>
                              ⚠️ {r.nombre_restriccion}
                              {r.efecto_relevante && ` — ${r.efecto_relevante}`}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Selector de ejercicios disponibles ── */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">
                    🏋️ Ejercicios disponibles ({ejerciciosDisp.length})
                  </h6>

                  {loadingEj ? (
                    <div className="text-center py-4">
                      <div className={`spinner-border ${styles.spinnerBrand}`} />
                      <p className="text-muted small mt-2">Cargando ejercicios disponibles...</p>
                    </div>
                  ) : (
                    <div className="table-responsive mb-4" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                          <tr>
                            <th style={{ width: 40 }}></th>
                            <th>Ejercicio</th>
                            <th>Grupo muscular</th>
                            <th>Nivel</th>
                            <th style={{ width: 70 }}>Series</th>
                            <th style={{ width: 70 }}>Reps</th>
                            <th style={{ width: 120 }}>Día</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ejerciciosDisp.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center text-muted py-3">
                                No hay ejercicios disponibles para este afiliado.
                              </td>
                            </tr>
                          ) : (
                            gruposMusculares.map((gm) => {
                              const ejerciciosGM = ejerciciosDisp.filter(e => e.grupo_muscular === gm);
                              return ejerciciosGM.map((ej, i) => {
                                const nivelCfg = NIVEL_COLOR[ej.nivel_minimo] || NIVEL_COLOR.Principiante;
                                const sel = ejerciciosSel[ej.id_ejercicio];
                                return (
                                  <tr key={ej.id_ejercicio}
                                    style={sel ? { background: `${nivelCfg.text}08` } : {}}
                                    className={i === 0 ? "border-top" : ""}>
                                    {i === 0 && (
                                      <td rowSpan={ejerciciosGM.length}
                                        className="fw-semibold text-muted small align-middle"
                                        style={{ background: "#f8fafc", fontSize: "0.7rem", writingMode: "vertical-lr", textOrientation: "mixed", width: 20 }}>
                                        {gm}
                                      </td>
                                    )}
                                    <td>
                                      <input type="checkbox" className="form-check-input"
                                        checked={!!sel}
                                        onChange={() => toggleEjercicio(ej.id_ejercicio)} />
                                    </td>
                                    <td>
                                      <span className="small">{ej.nombre_ejercicio}</span>
                                    </td>
                                    <td>
                                      <span className="badge px-2" style={{ background: nivelCfg.bg, color: nivelCfg.text, fontSize: "0.6rem" }}>
                                        {nivelCfg.label}
                                      </span>
                                    </td>
                                    {sel ? (
                                      <>
                                        <td>
                                          <input type="number" className="form-control form-control-sm" min={1} max={20}
                                            value={sel.series} style={{ width: 60 }}
                                            onChange={(e) => updateEjercicio(ej.id_ejercicio, "series", Math.max(1, parseInt(e.target.value) || 1))} />
                                        </td>
                                        <td>
                                          <input type="number" className="form-control form-control-sm" min={1} max={100}
                                            value={sel.repeticiones} style={{ width: 60 }}
                                            onChange={(e) => updateEjercicio(ej.id_ejercicio, "repeticiones", Math.max(1, parseInt(e.target.value) || 1))} />
                                        </td>
                                        <td>
                                          <select className="form-select form-select-sm"
                                            value={sel.dia}
                                            onChange={(e) => updateEjercicio(ej.id_ejercicio, "dia", parseInt(e.target.value))}>
                                            {DAY_LABELS.map((label, i) => (
                                              <option key={i} value={i + 1}>Día {i + 1} ({label})</option>
                                            ))}
                                          </select>
                                        </td>
                                      </>
                                    ) : (
                                      <td colSpan={3} className="text-muted small text-center">—</td>
                                    )}
                                  </tr>
                                );
                              });
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* ── Resumen de la selección ── */}
                  {Object.keys(ejerciciosSel).length > 0 && (
                    <div className="rounded-3 p-3 mb-3" style={{ background: "#f0fdfa", border: "1px solid #99f6e4" }}>
                      <small className="fw-semibold">
                        {Object.keys(ejerciciosSel).length} ejercicios seleccionados
                        &nbsp;·&nbsp;
                        {new Set(Object.values(ejerciciosSel).map(e => e.dia)).size} día(s)
                      </small>
                    </div>
                  )}

                  {/* ── Fechas del ciclo ── */}
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">Período del ciclo</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Fecha de inicio *</label>
                      <input type="date" className="form-control" value={fechaInicio}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setFechaInicio(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Fecha de fin *</label>
                      <input type="date" className="form-control" value={fechaFin}
                        min={fechaInicio}
                        onChange={(e) => setFechaFin(e.target.value)} required />
                    </div>
                  </div>

                  {cicloActivo(asignarModal) && (
                    <div className="alert alert-warning mt-3 py-2">
                      <small>⚠️ Este afiliado ya tiene un ciclo activo. Crear uno nuevo finalizará el anterior.</small>
                    </div>
                  )}
                </div>

                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-outline-secondary btn-sm px-4"
                    onClick={() => setAsignarModal(null)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className={`btn btn-sm text-white fw-semibold px-4 ${styles.btnConfirmar}`}
                    disabled={saving || Object.keys(ejerciciosSel).length === 0}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "✅ Crear Plan de Entrenamiento"}
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
        const plan = ciclo?.plan_entrenamiento;
        return (
          <div className={`modal d-block ${styles.modalOverlay}`} onClick={() => setVerModal(null)}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable"
              onClick={(e) => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg">
                <div className={`modal-header text-white border-0 ${styles.modalHeaderOscuro}`}>
                  <h5 className="modal-title">🏋️ Rutina activa — {nombreCompleto(verModal)}</h5>
                  <button className="btn-close btn-close-white" onClick={() => setVerModal(null)} />
                </div>
                <div className="modal-body">
                  <div className="row g-3 mb-4">
                    {[
                      { label: "Ciclo Nº", v: ciclo?.numero_ciclo },
                      { label: "Inicio", v: ciclo?.fecha_inicio },
                      { label: "Fin", v: ciclo?.fecha_fin },
                      { label: "Enfoque", v: plan?.enfoque || "—" },
                      { label: "Días/sem", v: plan?.dias_semana ? `${plan.dias_semana} días` : "—" },
                    ].map((f) => (
                      <div key={f.label} className="col-6 col-md-4">
                        <small className={`text-muted d-block text-uppercase fw-semibold ${styles.dataLabel}`}>
                          {f.label}
                        </small>
                        <span className="small fw-semibold">{f.v || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {(verModal.restricciones || []).length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">⚠️ Restricciones del afiliado</h6>
                      {verModal.restricciones.map((r) => {
                        const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                        return (
                          <div key={r.id_restriccion} className="rounded-3 p-2 mb-1 d-flex align-items-center gap-2"
                            style={{ background: cfg.bg }}>
                            <span style={{ color: cfg.text, fontWeight: 700 }}>⚠️</span>
                            <div>
                              <div className="small fw-semibold" style={{ color: cfg.text }}>{r.nombre_restriccion}</div>
                              {r.efecto_relevante && (
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{r.efecto_relevante}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {plan?.rutinas?.length > 0 ? (
                    <>
                      <h6 className="fw-bold mb-3">📋 Días de entrenamiento</h6>
                      {plan.rutinas.map((r) => (
                        <div key={r.dia_numero} className="border rounded-3 p-3 mb-2">
                          <div className="fw-semibold small mb-2">{r.nombre_rutina || r.nombre || `Día ${r.dia_numero}`}</div>
                          {r.ejercicios?.map((ej, i) => (
                            <div key={i} className="d-flex justify-content-between small text-muted border-bottom py-1">
                              <span>🏃 {ej.nombre_ejercicio || ej.nombre}</span>
                              <span className="fw-semibold">{ej.series}×{ej.repeticiones}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center text-muted py-3">
                      <div className="fs-3 mb-2">📋</div>
                      <p className="small">Sin ejercicios detallados aún.</p>
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button className="btn btn-outline-success btn-sm"
                    onClick={() => { setVerModal(null); abrirAsignar(verModal); }}>
                    🔄 Crear nueva rutina
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setVerModal(null)}>
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
