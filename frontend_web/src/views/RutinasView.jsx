import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto, inicial, cicloActivo } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import styles from "./RutinasView.module.css";

const NIVEL_COLOR = {
  Principiante: { bg: "#0ea5e922", text: "#0284c7", label: "Principiante" },
  Intermedio:   { bg: "#4b9ecb22", text: "#4b9ecb", label: "Intermedio"   },
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

const GRUPOS_MUSCULARES = ["Piernas", "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Core", "Glúteos"];
const NIVELES = ["Principiante", "Intermedio", "Avanzado"];

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

  // Modal crear nuevo ejercicio en catálogo
  const [showNuevoEj, setShowNuevoEj] = useState(false);
  const [nuevoEjForm, setNuevoEjForm] = useState({
    nombre_ejercicio: "",
    grupo_muscular: "Piernas",
    nivel_minimo: "Principiante",
    descripcion: "",
  });
  const [guardandoEj, setGuardandoEj] = useState(false);
  const [errorEj, setErrorEj] = useState("");

  // Modal eliminar ejercicio
  const [showEliminarEj, setShowEliminarEj] = useState(false);
  const [catalogoEjList, setCatalogoEjList] = useState([]);
  const [elimEjSeleccionado, setElimEjSeleccionado] = useState("");
  const [eliminandoEj, setEliminandoEj] = useState(false);
  const [errorElimEj, setErrorElimEj] = useState("");

  // Modal catálogo de ejercicios
  const [showCatalogoEj, setShowCatalogoEj] = useState(false);
  const [catalogoEjData, setCatalogoEjData] = useState([]);
  const [loadingCatEj, setLoadingCatEj] = useState(false);

  // Modal editar ejercicio
  const [editEjModal, setEditEjModal] = useState(null);
  const [editEjForm, setEditEjForm] = useState({
    nombre_ejercicio: "",
    grupo_muscular: "Piernas",
    nivel_minimo: "Principiante",
    descripcion: "",
  });
  const [guardandoEditEj, setGuardandoEditEj] = useState(false);
  const [errorEditEj, setErrorEditEj] = useState("");

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
      // 1. Reutilizar ciclo activo existente o crear uno nuevo
      let idCiclo;
      const cicloExistente = asignarModal.ciclo_activo;
      if (cicloExistente) {
        idCiclo = cicloExistente.id_ciclo;
      } else {
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
        idCiclo = cicloData.id_ciclo;
      }

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
            ...a.ciclo_activo,
            id_ciclo: idCiclo,
            plan_entrenamiento: { nombre_rutina: "Personalizado", enfoque: "Asistente inteligente" },
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
        <div className={`position-fixed bottom-0 end-0 m-4 alert shadow-lg py-2 px-3 ${styles.toast}`}
          style={{ borderLeft: toast.type === "danger" ? "4px solid #ef4444" : "4px solid #4b9ecb" }}>
          {toast.msg}
        </div>
      )}

      <div className={`container-fluid py-4 px-3 px-md-4 ${styles.page}`}>
        {/* ── Encabezado ── */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className={`h4 fw-bold mb-0 d-flex align-items-center gap-2 ${styles.headerTitle}`}>
              <span className={`d-inline-flex align-items-center justify-content-center ${styles.titleIcon}`}>
                🏋️
              </span>
              Planes de Entrenamiento
            </h1>
            <small className={styles.headerSub}>
              {isAdmin
                ? "Vista de administrador — supervisión de rutinas asignadas"
                : "Crea rutinas personalizadas seleccionando ejercicios del catálogo disponible"}
            </small>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {[
              { label: "Total afiliados", valor: afiliados.length, color: "#4b9ecb" },
              { label: "Con rutina activa", valor: afiliados.filter((a) => cicloActivo(a)).length, color: "#22c55e" },
              { label: "Sin rutina", valor: afiliados.filter((a) => !cicloActivo(a)).length, color: "#ef4444" },
            ].map((k) => (
              <div key={k.label} className={`text-center px-3 py-2 ${styles.kpiCard}`}>
                <div className="fw-bold fs-5" style={{ color: k.color }}>
                  {loading ? "—" : k.valor}
                </div>
                <div className={styles.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className="d-flex gap-1 flex-wrap">
            <button type="button" className={`d-flex align-items-center gap-1 ${styles.btnOutline}`}
              onClick={() => {
                setNuevoEjForm({ nombre_ejercicio: "", grupo_muscular: "Piernas", nivel_minimo: "Principiante", descripcion: "" });
                setErrorEj("");
                setShowNuevoEj(true);
              }}
              title="Agregar nuevo ejercicio al catálogo">
              🏋️ Agregar
            </button>
            <button type="button" className={`d-flex align-items-center gap-1 ${styles.btnOutlineDanger}`}
              onClick={async () => {
                setErrorElimEj("");
                setElimEjSeleccionado("");
                try {
                  const { data } = await authAxios.get("/catalogo/ejercicios");
                  setCatalogoEjList(Array.isArray(data) ? data : []);
                  setShowEliminarEj(true);
                } catch { setShowEliminarEj(true); }
              }}
              title="Eliminar ejercicio del catálogo">
              🗑️ Eliminar
            </button>
            <button type="button" className={`d-flex align-items-center gap-1 ${styles.btnOutlineInfo}`}
              onClick={async () => {
                setLoadingCatEj(true);
                setShowCatalogoEj(true);
                try {
                  const { data } = await authAxios.get("/catalogo/ejercicios");
                  setCatalogoEjData(Array.isArray(data) ? data : []);
                } catch { setCatalogoEjData([]); }
                setLoadingCatEj(false);
              }}
              title="Ver catálogo completo de ejercicios">
              📋 Catálogo
            </button>
          </div>
        </div>

        {/* ── Tabla de afiliados ── */}
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <span style={{color:"#94a3b8",fontSize:"0.85rem",fontWeight:600}}>{filtrados.length} afiliados</span>
            <div className="d-flex gap-2 align-items-center" style={{flex:1}}>
              <input
                type="text"
                className={`form-control form-control-sm ${styles.searchInput}`}
                placeholder="🔍 Nombre, objetivo, nivel..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button type="button"
                className={`d-flex align-items-center gap-1 ${styles.exportBtn}`}
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

          <div style={{borderRadius:"0 0 14px 14px"}}>
            {error   && <div className={styles.alertDanger} style={{margin:"0.75rem",padding:"0.4rem 0.75rem"}}><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className={`spinner-border ${styles.spinnerBrand}`} /></div>}

            {!loading && !error && (
              <div className="table-responsive">
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{paddingLeft:"1.25rem"}}>#</th>
                      <th>Afiliado</th>
                      <th>Objetivo</th>
                      <th>Nivel</th>
                      <th className="text-center">Días/sem</th>
                      <th>Rutina activa</th>
                      <th>Período</th>
                      <th className="text-center" style={{paddingRight:"1rem"}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={`text-center py-5 ${styles.emptyState}`}>
                          {busqueda ? `Sin resultados para "${busqueda}"` : "No hay afiliados."}
                        </td>
                      </tr>
                    ) : filtrados.map((a, idx) => {
                      const sinRutina = !cicloActivo(a);
                      const ciclo = cicloActivo(a);
                      const nivelCfg = NIVEL_COLOR[a.nivel_experiencia] || NIVEL_COLOR.Principiante;

                      return (
                        <tr key={getId(a)}>
                          <td style={{paddingLeft:"1.25rem"}} className={styles.emptyState}>{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={styles.avatarTd}
                                style={{ background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small" style={{color:"#e0e0e0"}}>{nombreCompleto(a)}</div>
                                <div className={styles.emailSm}>{a.correo || "—"}</div>
                              </div>
                            </div>
                          </td>
                          <td><small style={{color:"#94a3b8"}}>{OBJETIVO_ICON[a.objetivo_fisico]} {a.objetivo_fisico || "—"}</small></td>
                          <td>
                            <span className={`badge px-2 py-1 ${styles.badgeSm}`}
                              style={{ background: nivelCfg.bg, color: nivelCfg.text }}>
                              {nivelCfg.label}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={styles.badgeDark} style={{fontSize:"0.7rem"}}>
                              {a.disponibilidad_semanal_dias || "—"}d
                            </span>
                          </td>
                          <td>
                            {ciclo?.plan_entrenamiento?.nombre_rutina ? (
                              <span className={`badge px-2 py-1 ${styles.badgeCiclo}`}>
                                ✅ {ciclo.plan_entrenamiento.nombre_rutina}
                              </span>
                            ) : ciclo ? (
                              <span className={styles.badgeSm} style={{background:"rgba(234,179,8,0.15)",color:"#eab308"}}>
                                ⚙️ Plan personalizado
                              </span>
                            ) : (
                              <span className={styles.badgeSm} style={{background:"rgba(239,68,68,0.1)",color:"#ef4444"}}>
                                ❌ Sin rutina
                              </span>
                            )}
                          </td>
                          <td>
                            {ciclo ? (
                              <small className={styles.headerSub}>{ciclo.fecha_inicio} → {ciclo.fecha_fin}</small>
                            ) : (
                              <small className={styles.headerSub}>—</small>
                            )}
                          </td>
                          <td className="text-center" style={{paddingRight:"1rem"}}>
                            <div className="d-flex gap-1 justify-content-center">
                              {ciclo && (
                                <button type="button" className={styles.btnOutline}
                                  title="Ver rutina activa"
                                  onClick={() => setVerModal(a)}>👁️</button>
                              )}
                              <button type="button" className={`fw-semibold text-white ${styles.btnAsignar}`}
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
            <div className={`border-0 shadow-lg ${styles.modalContent}`}>
              <div className={`modal-header text-white border-0 ${styles.modalHeaderVerde}`}>
                <h5 className="modal-title">🏋️ Crear Rutina — {nombreCompleto(asignarModal)}</h5>
                <button type="button" className={styles.btnOutline}
                  onClick={() => !saving && setAsignarModal(null)} disabled={saving} aria-label="Cerrar">✕</button>
              </div>

              <form onSubmit={handleAsignar}>
                <div className={`modal-body ${styles.modalBody}`}>
                  {asigError && (
                    <div className={styles.alertDanger} style={{marginBottom:"0.75rem",padding:"0.4rem 0.75rem"}}><small>⚠️ {asigError}</small></div>
                  )}

                  {/* ── Info del afiliado + restricciones ── */}
                  <div className={`rounded-3 p-3 mb-4 ${styles.afiliadoSection}`}>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className={styles.avatarModal}
                        style={{ background: `hsl(${(getId(asignarModal) * 47) % 360},65%,55%)` }}>
                        {inicial(asignarModal)}
                      </div>
                      <div>
                        <div className="fw-semibold" style={{color:"#e0e0e0"}}>{nombreCompleto(asignarModal)}</div>
                        <div className={styles.headerSub} style={{fontSize:"0.85rem"}}>
                          {OBJETIVO_ICON[asignarModal.objetivo_fisico]} {asignarModal.objetivo_fisico}
                          &nbsp;·&nbsp;{asignarModal.nivel_experiencia}
                          &nbsp;·&nbsp;{asignarModal.disponibilidad_semanal_dias}d/sem
                          {asignarModal.grupo_muscular_prioritario && (
                            <>· Grupo prioritario: {asignarModal.grupo_muscular_prioritario}</>
                          )}
                        </div>
                      </div>
                    </div>
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
                  <h6 className="fw-bold mb-3" style={{color:"#94a3b8",fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>
                    🏋️ Ejercicios disponibles ({ejerciciosDisp.length})
                  </h6>

                  {loadingEj ? (
                    <div className="text-center py-4">
                      <div className={`spinner-border ${styles.spinnerBrand}`} />
                      <p className={styles.headerSub} style={{marginTop:"0.5rem",fontSize:"0.85rem"}}>Cargando ejercicios disponibles...</p>
                    </div>
                  ) : (
                    <div className="table-responsive mb-4" style={{ maxHeight: "300px", overflowY: "auto" }}>
                      <table className={styles.table} style={{fontSize:"0.85rem"}}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
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
                              <td colSpan={7} className={`text-center py-3 ${styles.emptyState}`}>
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
                                        className="fw-semibold align-middle"
                                        style={{background:"#16213e",fontSize:"0.7rem",writingMode:"vertical-lr",textOrientation:"mixed",width:20,color:"#94a3b8"}}>
                                        {gm}
                                      </td>
                                    )}
                                    <td>
                                      <input type="checkbox" className={`form-check-input ${styles.checkboxDark}`}
                                        checked={!!sel}
                                        onChange={() => toggleEjercicio(ej.id_ejercicio)} />
                                    </td>
                                    <td>
                                      <span className="small" style={{color:"#e0e0e0"}}>{ej.nombre_ejercicio}</span>
                                    </td>
                                    <td>
                                      <span className="badge px-2" style={{ background: nivelCfg.bg, color: nivelCfg.text, fontSize: "0.6rem" }}>
                                        {nivelCfg.label}
                                      </span>
                                    </td>
                                    {sel ? (
                                      <>
                                        <td>
                                          <input type="number" className={`form-control form-control-sm ${styles.inputDark}`} min={1} max={20}
                                            value={sel.series} style={{ width: 60 }}
                                            onChange={(e) => updateEjercicio(ej.id_ejercicio, "series", Math.max(1, parseInt(e.target.value) || 1))} />
                                        </td>
                                        <td>
                                          <input type="number" className={`form-control form-control-sm ${styles.inputDark}`} min={1} max={100}
                                            value={sel.repeticiones} style={{ width: 60 }}
                                            onChange={(e) => updateEjercicio(ej.id_ejercicio, "repeticiones", Math.max(1, parseInt(e.target.value) || 1))} />
                                        </td>
                                        <td>
                                          <select className={`form-select form-select-sm ${styles.selectDark}`}
                                            value={sel.dia}
                                            onChange={(e) => updateEjercicio(ej.id_ejercicio, "dia", parseInt(e.target.value))}>
                                            {DAY_LABELS.map((label, i) => (
                                              <option key={i} value={i + 1}>Día {i + 1} ({label})</option>
                                            ))}
                                          </select>
                                        </td>
                                      </>
                                    ) : (
                                      <td colSpan={3} className={styles.emptyState} style={{fontSize:"0.85rem",textAlign:"center"}}>—</td>
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
                    <div className={styles.afiliadoSection} style={{marginBottom:"0.75rem"}}>
                      <small className="fw-semibold" style={{color:"#a78bfa"}}>
                        {Object.keys(ejerciciosSel).length} ejercicios seleccionados
                        &nbsp;·&nbsp;
                        {new Set(Object.values(ejerciciosSel).map(e => e.dia)).size} día(s)
                      </small>
                    </div>
                  )}

                  {/* ── Fechas del ciclo ── */}
                  <h6 className="fw-bold mb-3" style={{color:"#94a3b8",fontSize:"0.72rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>Período del ciclo</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className={styles.labelText}>Fecha de inicio *</label>
                      <input type="date" className={`form-control ${styles.inputDark}`} value={fechaInicio}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setFechaInicio(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label className={styles.labelText}>Fecha de fin *</label>
                      <input type="date" className={`form-control ${styles.inputDark}`} value={fechaFin}
                        min={fechaInicio}
                        onChange={(e) => setFechaFin(e.target.value)} required />
                    </div>
                  </div>

                  {cicloActivo(asignarModal) && (
                    <div className={styles.alertDanger} style={{marginTop:"0.75rem",padding:"0.4rem 0.75rem"}}>
                      <small>⚠️ Este afiliado ya tiene un ciclo activo. Crear uno nuevo finalizará el anterior.</small>
                    </div>
                  )}
                </div>

                <div className={`modal-footer ${styles.modalFooter}`}>
                  <button type="button" className={styles.btnOutline}
                    onClick={() => setAsignarModal(null)} disabled={saving}>
                    Cancelar
                  </button>
                  <button type="submit" className={`text-white fw-semibold px-4 ${styles.btnConfirmar}`}
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
              <div className={`border-0 shadow-lg ${styles.modalContent}`}>
                <div className={`modal-header text-white border-0 ${styles.modalHeaderOscuro}`}>
                  <h5 className="modal-title">🏋️ Rutina activa — {nombreCompleto(verModal)}</h5>
                  <button type="button" className={styles.btnOutline} onClick={() => setVerModal(null)} aria-label="Cerrar">✕</button>
                </div>
                <div className={`modal-body ${styles.modalBody}`}>
                  <div className="row g-3 mb-4">
                    {[
                      { label: "Ciclo Nº", v: ciclo?.numero_ciclo },
                      { label: "Inicio", v: ciclo?.fecha_inicio },
                      { label: "Fin", v: ciclo?.fecha_fin },
                      { label: "Enfoque", v: plan?.enfoque || "—" },
                      { label: "Días/sem", v: plan?.dias_semana ? `${plan.dias_semana} días` : "—" },
                    ].map((f) => (
                      <div key={f.label} className="col-6 col-md-4">
                        <small className={`d-block text-uppercase fw-semibold ${styles.dataLabel}`}>
                          {f.label}
                        </small>
                        <span className="small fw-semibold" style={{color:"#e0e0e0"}}>{f.v || "—"}</span>
                      </div>
                    ))}
                  </div>

                  {(verModal.restricciones || []).length > 0 && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2" style={{color:"#e0e0e0"}}>⚠️ Restricciones del afiliado</h6>
                      {verModal.restricciones.map((r) => {
                        const cfg = RESTRICCION_COLOR[r.tipo] || { bg: "#e2e8f0", text: "#64748b" };
                        return (
                          <div key={r.id_restriccion} className="rounded-3 p-2 mb-1 d-flex align-items-center gap-2"
                            style={{ background: cfg.bg }}>
                            <span style={{ color: cfg.text, fontWeight: 700 }}>⚠️</span>
                            <div>
                              <div className="small fw-semibold" style={{ color: cfg.text }}>{r.nombre_restriccion}</div>
                              {r.efecto_relevante && (
                                <div className={styles.headerSub} style={{ fontSize: "0.7rem" }}>{r.efecto_relevante}</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {plan?.rutinas?.length > 0 ? (
                    <>
                      <h6 className="fw-bold mb-3" style={{color:"#e0e0e0"}}>📋 Días de entrenamiento</h6>
                      {plan.rutinas.map((r) => (
                        <div key={r.dia_numero} className={styles.afiliadoSection} style={{marginBottom:"0.5rem"}}>
                          <div className="fw-semibold small mb-2" style={{color:"#e0e0e0"}}>{r.nombre_rutina || r.nombre || `Día ${r.dia_numero}`}</div>
                          {r.ejercicios?.map((ej, i) => (
                            <div key={i} className="d-flex justify-content-between small py-1" style={{color:"#94a3b8",borderBottom:"1px solid #252545"}}>
                              <span>🏃 {ej.nombre_ejercicio || ej.nombre}</span>
                              <span className="fw-semibold" style={{color:"#a78bfa"}}>{ej.series}×{ej.repeticiones}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className={`text-center py-3 ${styles.emptyState}`}>
                      <div className="fs-3 mb-2">📋</div>
                      <p className="small">Sin ejercicios detallados aún.</p>
                    </div>
                  )}
                </div>
                <div className={`modal-footer ${styles.modalFooter}`}>
                  <button type="button" className={styles.btnOutline}
                    onClick={() => { setVerModal(null); abrirAsignar(verModal); }}>
                    🔄 Crear nueva rutina
                  </button>
                  <button type="button" className={styles.btnOutline} onClick={() => setVerModal(null)}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: NUEVO EJERCICIO EN CATÁLOGO
      ═══════════════════════════════════════════════════════════════════════ */}
      {showNuevoEj && (
        <div className={`modal d-block ${styles.modalOverlay}`} onClick={() => !guardandoEj && setShowNuevoEj(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`border-0 shadow-lg ${styles.modalContent}`}>
              <div className={`modal-header text-white border-0 ${styles.modalHeaderVerde}`}>
                <h5 className="modal-title">🏋️ Nuevo Ejercicio</h5>
                <button type="button" className={styles.btnOutline} onClick={() => !guardandoEj && setShowNuevoEj(false)} disabled={guardandoEj} aria-label="Cerrar">✕</button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!nuevoEjForm.nombre_ejercicio.trim()) { setErrorEj("El nombre del ejercicio es obligatorio."); return; }
                setGuardandoEj(true); setErrorEj("");
                try {
                  await authAxios.post("/catalogo/ejercicios", nuevoEjForm);
                  setShowNuevoEj(false);
                  showToast(`Ejercicio "${nuevoEjForm.nombre_ejercicio}" creado correctamente`);
                  // Refrescar ejercicios disponibles si el modal de asignación está abierto
                  if (asignarModal) {
                    const { data } = await authAxios.get(`/afiliados/${getId(asignarModal)}/ejercicios-disponibles`);
                    setEjerciciosDisp(Array.isArray(data) ? data : []);
                  }
                } catch (err) {
                  setErrorEj(err?.response?.data?.error || "Error al crear el ejercicio");
                } finally {
                  setGuardandoEj(false);
                }
              }}>
                <div className={`modal-body ${styles.modalBody}`}>
                  {errorEj && <div className={styles.alertDanger} style={{marginBottom:"0.75rem",padding:"0.4rem 0.75rem"}}><small>⚠️ {errorEj}</small></div>}
                  <div className="mb-3">
                    <label className={styles.labelText}>Nombre del ejercicio *</label>
                    <input type="text" className={`form-control ${styles.inputDark}`} required
                      value={nuevoEjForm.nombre_ejercicio}
                      onChange={(e) => setNuevoEjForm({ ...nuevoEjForm, nombre_ejercicio: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className={styles.labelText}>Grupo muscular *</label>
                    <select className={`form-select ${styles.selectDark}`} required
                      value={nuevoEjForm.grupo_muscular}
                      onChange={(e) => setNuevoEjForm({ ...nuevoEjForm, grupo_muscular: e.target.value })}>
                      {GRUPOS_MUSCULARES.map((gm) => <option key={gm} value={gm}>{gm}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className={styles.labelText}>Nivel mínimo *</label>
                    <select className={`form-select ${styles.selectDark}`} required
                      value={nuevoEjForm.nivel_minimo}
                      onChange={(e) => setNuevoEjForm({ ...nuevoEjForm, nivel_minimo: e.target.value })}>
                      {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className={styles.labelText}>Descripción (opcional)</label>
                    <textarea className={`form-control ${styles.inputDark}`} rows={2}
                      value={nuevoEjForm.descripcion}
                      onChange={(e) => setNuevoEjForm({ ...nuevoEjForm, descripcion: e.target.value })} />
                  </div>
                </div>
                <div className={`modal-footer ${styles.modalFooter}`}>
                  <button type="button" className={styles.btnOutline}
                    onClick={() => !guardandoEj && setShowNuevoEj(false)} disabled={guardandoEj}>
                    Cancelar
                  </button>
                  <button type="submit" className={`text-white fw-semibold px-4 ${styles.btnConfirmar}`}
                    disabled={guardandoEj}>
                    {guardandoEj
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : "💾 Guardar Ejercicio"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: ELIMINAR EJERCICIO
      ═══════════════════════════════════════════════════════════════════════ */}
      {showEliminarEj && (
        <div className={`modal d-block ${styles.modalOverlay}`} onClick={() => !eliminandoEj && setShowEliminarEj(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`border-0 shadow-lg ${styles.modalContent}`}>
              <div className={`modal-header text-white border-0 ${styles.modalHeaderVerde}`}>
                <h5 className="modal-title">🗑️ Eliminar Ejercicio</h5>
                <button type="button" className={styles.btnOutline} onClick={() => !eliminandoEj && setShowEliminarEj(false)} disabled={eliminandoEj} aria-label="Cerrar">✕</button>
              </div>
              <div className={`modal-body ${styles.modalBody}`}>
                {errorElimEj && <div className={styles.alertDanger} style={{marginBottom:"0.75rem",padding:"0.4rem 0.75rem"}}><small>⚠️ {errorElimEj}</small></div>}
                <div className="mb-3">
                  <label className={styles.labelText}>Seleccioná el ejercicio a eliminar *</label>
                  <select className={`form-select ${styles.selectDark}`} value={elimEjSeleccionado}
                    onChange={(e) => setElimEjSeleccionado(e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {catalogoEjList.map((ej) => (
                      <option key={ej.id_ejercicio} value={ej.id_ejercicio}>
                        {ej.nombre_ejercicio} ({ej.grupo_muscular} · {ej.nivel_minimo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={`modal-footer ${styles.modalFooter}`}>
                <button type="button" className={styles.btnOutline}
                  onClick={() => !eliminandoEj && setShowEliminarEj(false)} disabled={eliminandoEj}>Cancelar</button>
                <button type="button" className={styles.btnConfirmar}
                  style={{background:"linear-gradient(135deg,#ef4444,#dc2626)"}}
                  disabled={!elimEjSeleccionado || eliminandoEj}
                  onClick={async () => {
                    setEliminandoEj(true); setErrorElimEj("");
                    try {
                      await authAxios.delete(`/catalogo/ejercicios/${elimEjSeleccionado}`);
                      setShowEliminarEj(false);
                      const nombre = catalogoEjList.find(e => String(e.id_ejercicio) === elimEjSeleccionado)?.nombre_ejercicio || "";
                      showToast(`Ejercicio "${nombre}" eliminado correctamente`);
                      if (asignarModal) {
                        const { data } = await authAxios.get(`/afiliados/${getId(asignarModal)}/ejercicios-disponibles`);
                        setEjerciciosDisp(Array.isArray(data) ? data : []);
                      }
                    } catch (err) {
                      setErrorElimEj(err?.response?.data?.error || "Error al eliminar el ejercicio");
                    } finally { setEliminandoEj(false); }
                  }}>
                  {eliminandoEj ? <><span className="spinner-border spinner-border-sm me-2" />Eliminando...</> : "🗑️ Confirmar Eliminación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CATÁLOGO DE EJERCICIOS
      ═══════════════════════════════════════════════════════════════════════ */}
      {showCatalogoEj && (
        <div className={`modal d-block ${styles.modalOverlay}`} onClick={() => setShowCatalogoEj(false)}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}>
            <div className={`border-0 shadow-lg ${styles.modalContent}`}>
              <div className={`modal-header text-white border-0 ${styles.modalHeaderVerde}`}>
                <h5 className="modal-title">📋 Catálogo de Ejercicios</h5>
                <button type="button" className={styles.btnOutline} onClick={() => setShowCatalogoEj(false)} aria-label="Cerrar">✕</button>
              </div>
              <div className={`modal-body ${styles.modalBody}`}>
                {loadingCatEj ? (
                  <div className="text-center py-4"><div className={`spinner-border ${styles.spinnerBrand}`} /></div>
                ) : catalogoEjData.length === 0 ? (
                  <p className={styles.emptyState} style={{textAlign:"center",padding:"1rem 0"}}>No hay ejercicios en el catálogo.</p>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className={styles.table} style={{fontSize:"0.85rem"}}>
                      <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                          <th>Nombre</th>
                          <th>Grupo muscular</th>
                          <th>Nivel mínimo</th>
                          <th>Descripción</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catalogoEjData.map((ej) => {
                          const nivelCfg = NIVEL_COLOR[ej.nivel_minimo] || NIVEL_COLOR.Principiante;
                          return (
                            <tr key={ej.id_ejercicio}>
                              <td><span className="small fw-semibold" style={{color:"#e0e0e0"}}>{ej.nombre_ejercicio}</span></td>
                              <td><span className="small" style={{color:"#94a3b8"}}>{ej.grupo_muscular}</span></td>
                              <td>
                                <span className="badge px-2" style={{ background: nivelCfg.bg, color: nivelCfg.text, fontSize: "0.6rem" }}>
                                  {nivelCfg.label}
                                </span>
                              </td>
                              <td><small className={styles.headerSub}>{ej.descripcion || "—"}</small></td>
                              <td className="text-center">
                                <div className="d-flex gap-1 justify-content-center">
                                  <button type="button" className={styles.btnOutline} title="Editar"
                                    onClick={() => {
                                      setEditEjForm({
                                        nombre_ejercicio: ej.nombre_ejercicio,
                                        grupo_muscular: ej.grupo_muscular,
                                        nivel_minimo: ej.nivel_minimo,
                                        descripcion: ej.descripcion || "",
                                      });
                                      setErrorEditEj("");
                                      setEditEjModal(ej.id_ejercicio);
                                    }}>✏️</button>
                                  <button type="button" className={styles.btnOutlineDanger} title="Eliminar"
                                    onClick={async () => {
                                      if (!window.confirm(`¿Eliminar "${ej.nombre_ejercicio}"?`)) return;
                                      try {
                                        await authAxios.delete(`/catalogo/ejercicios/${ej.id_ejercicio}`);
                                        setCatalogoEjData((prev) => prev.filter((e) => e.id_ejercicio !== ej.id_ejercicio));
                                        showToast(`Ejercicio "${ej.nombre_ejercicio}" eliminado`);
                                        if (asignarModal) {
                                          const { data } = await authAxios.get(`/afiliados/${getId(asignarModal)}/ejercicios-disponibles`);
                                          setEjerciciosDisp(Array.isArray(data) ? data : []);
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
              <div className={`modal-footer ${styles.modalFooter}`}>
                <button type="button" className={styles.btnOutline} onClick={() => setShowCatalogoEj(false)}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: EDITAR EJERCICIO
      ═══════════════════════════════════════════════════════════════════════ */}
      {editEjModal && (
        <div className={`modal d-block ${styles.modalOverlay}`} onClick={() => !guardandoEditEj && setEditEjModal(null)}>
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className={`border-0 shadow-lg ${styles.modalContent}`}>
              <div className={`modal-header text-white border-0 ${styles.modalHeaderVerde}`}>
                <h5 className="modal-title">✏️ Editar Ejercicio</h5>
                <button type="button" className={styles.btnOutline} onClick={() => !guardandoEditEj && setEditEjModal(null)} disabled={guardandoEditEj} aria-label="Cerrar">✕</button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!editEjForm.nombre_ejercicio.trim()) { setErrorEditEj("El nombre del ejercicio es obligatorio."); return; }
                setGuardandoEditEj(true); setErrorEditEj("");
                try {
                  await authAxios.put(`/catalogo/ejercicios/${editEjModal}`, editEjForm);
                  setEditEjModal(null);
                  showToast(`Ejercicio "${editEjForm.nombre_ejercicio}" actualizado`);
                  const { data } = await authAxios.get("/catalogo/ejercicios");
                  setCatalogoEjData(Array.isArray(data) ? data : []);
                  if (asignarModal) {
                    const { data: disp } = await authAxios.get(`/afiliados/${getId(asignarModal)}/ejercicios-disponibles`);
                    setEjerciciosDisp(Array.isArray(disp) ? disp : []);
                  }
                } catch (err) {
                  setErrorEditEj(err?.response?.data?.error || "Error al actualizar");
                } finally { setGuardandoEditEj(false); }
              }}>
                <div className={`modal-body ${styles.modalBody}`}>
                  {errorEditEj && <div className={styles.alertDanger} style={{marginBottom:"0.75rem",padding:"0.4rem 0.75rem"}}><small>⚠️ {errorEditEj}</small></div>}
                  <div className="mb-3">
                    <label className={styles.labelText}>Nombre del ejercicio *</label>
                    <input type="text" className={`form-control ${styles.inputDark}`} required
                      value={editEjForm.nombre_ejercicio}
                      onChange={(e) => setEditEjForm({ ...editEjForm, nombre_ejercicio: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className={styles.labelText}>Grupo muscular *</label>
                    <select className={`form-select ${styles.selectDark}`} required
                      value={editEjForm.grupo_muscular}
                      onChange={(e) => setEditEjForm({ ...editEjForm, grupo_muscular: e.target.value })}>
                      {GRUPOS_MUSCULARES.map((gm) => <option key={gm} value={gm}>{gm}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className={styles.labelText}>Nivel mínimo *</label>
                    <select className={`form-select ${styles.selectDark}`} required
                      value={editEjForm.nivel_minimo}
                      onChange={(e) => setEditEjForm({ ...editEjForm, nivel_minimo: e.target.value })}>
                      {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className={styles.labelText}>Descripción (opcional)</label>
                    <textarea className={`form-control ${styles.inputDark}`} rows={2}
                      value={editEjForm.descripcion}
                      onChange={(e) => setEditEjForm({ ...editEjForm, descripcion: e.target.value })} />
                  </div>
                </div>
                <div className={`modal-footer ${styles.modalFooter}`}>
                  <button type="button" className={styles.btnOutline}
                    onClick={() => !guardandoEditEj && setEditEjModal(null)} disabled={guardandoEditEj}>Cancelar</button>
                  <button type="submit" className={`text-white fw-semibold px-4 ${styles.btnConfirmar}`}
                    disabled={guardandoEditEj}>
                    {guardandoEditEj
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
