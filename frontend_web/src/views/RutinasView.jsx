import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto, inicial, cicloActivo } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import { trackEvent } from "../utils/analytics";
import s from "./RutinasView.module.css";

const DAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIA_SEMANA_MAP = { Lunes:1, Martes:2, "Miércoles":3, Jueves:4, Viernes:5, Sábado:6, Domingo:7 };
const GRUPOS_MUSCULARES = ["Piernas","Pecho","Espalda","Hombros","Bíceps","Tríceps","Core","Glúteos"];
const NIVELES = ["Principiante","Intermedio","Avanzado"];
const NIVEL_COLOR = {
  Principiante:{bg:"#0ea5e922",text:"#0284c7"},
  Intermedio:{bg:"#4b9ecb22",text:"#4b9ecb"},
  Avanzado:{bg:"#ef444422",text:"#dc2626"},
};
const OBJETIVO_ICON = {"Perdida de grasa":"🔥","Aumento de masa":"💪","Mantenimiento":"⚖️"};

const avatarColor = (nombre) => {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
};

export default function RutinasView() {
  const { user, authAxios } = useAuth();
  const { toast, showToast } = useToast();
  const navigate = useNavigate();
  const role = user?.role || "Recepcionista";

  // ── State ──────────────────────────────────────────────────
  const [afiliados, setAfiliados] = useState([]);
  const [catalogoEj, setCatalogoEj] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Modal state
  const [modal, setModal] = useState(null); // null | "asignar" | "catalogo" | "nuevo" | "editar" | "eliminar" | "verPerfil"
  const [modalAfiliado, setModalAfiliado] = useState(null);
  const [modalEjercicio, setModalEjercicio] = useState(null);

  // Asignar state
  const [asignarAfiliadoId, setAsignarAfiliadoId] = useState("");
  const [asignarAfiliadoData, setAsignarAfiliadoData] = useState(null);
  const [ejerciciosDisponibles, setEjerciciosDisponibles] = useState([]);
  const [selectedEjercicios, setSelectedEjercicios] = useState({}); // { [id_ejercicio]: { series, repeticiones, dia_numero } }
  const [selectedRutinas, setSelectedRutinas] = useState({}); // { [dia_numero]: [ { id_ejercicio, series, repeticiones } ] }

  // Nuevo/Editar ejercicio form
  const [formEj, setFormEj] = useState({ nombre_ejercicio:"", grupo_muscular:"Pecho", nivel_minimo:"Principiante", descripcion:"" });

  // Delete
  const [deleteEjId, setDeleteEjId] = useState("");

  // ── Data fetching ───────────────────────────────────────────
  const fetchAfiliados = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[RutinasView]", err);
      showToast("Error al cargar afiliados", "danger");
    } finally {
      setLoading(false);
    }
  }, [authAxios, showToast]);

  const fetchEjercicios = useCallback(async () => {
    try {
      const { data } = await authAxios.get("/catalogo/ejercicios");
      setCatalogoEj(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[RutinasView] catálogo:", err);
      showToast("Error al cargar catálogo de ejercicios", "danger");
    }
  }, [authAxios, showToast]);

  useEffect(() => { fetchAfiliados(); fetchEjercicios(); }, [fetchAfiliados, fetchEjercicios]);

  // ── Derived data ────────────────────────────────────────────
  const filtered = afiliados.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return nombreCompleto(a).toLowerCase().includes(q) || (a.correo||a.email||"").toLowerCase().includes(q) || (a.documento||"").includes(q);
  });
  const totalAfiliados = afiliados.length;
  const conPlan = afiliados.filter((a) => !!cicloActivo(a)?.plan_entrenamiento).length;
  const sinPlan = totalAfiliados - conPlan;
  const totalEjercicios = catalogoEj.length;

  // ── Modal handlers ──────────────────────────────────────────
  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setModalAfiliado(null);
    setModalEjercicio(null);
    setAsignarAfiliadoId("");
    setAsignarAfiliadoData(null);
    setEjerciciosDisponibles([]);
    setSelectedEjercicios({});
    setSelectedRutinas({});
    setFormEj({ nombre_ejercicio:"", grupo_muscular:"Pecho", nivel_minimo:"Principiante", descripcion:"" });
    setDeleteEjId("");
  };

  const openAsignar = async () => {
    setAsignarAfiliadoId("");
    setAsignarAfiliadoData(null);
    setEjerciciosDisponibles([]);
    setSelectedEjercicios({});
    setSelectedRutinas({});
    setModal("asignar");
  };

  const handleAfiliadoSelect = async (e) => {
    const id = e.target.value;
    setAsignarAfiliadoId(id);
    if (!id) { setAsignarAfiliadoData(null); setEjerciciosDisponibles([]); return; }
    const a = afiliados.find((x) => String(getId(x)) === id);
    setAsignarAfiliadoData(a || null);
    try {
      const { data } = await authAxios.get(`/afiliados/${id}/ejercicios-disponibles`);
      setEjerciciosDisponibles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[RutinasView] disponibles:", err);
      showToast("Error al cargar ejercicios disponibles", "danger");
      setEjerciciosDisponibles([]);
    }
  };

  const addEjercicioToRutina = (ej) => {
    const id = ej.id_ejercicio ?? ej.id;
    if (selectedEjercicios[id]) return;
    setSelectedEjercicios((prev) => ({ ...prev, [id]: { series:3, repeticiones:12, dia_numero:1 } }));
  };

  const updateEjercicioSel = (id, field, value) => {
    setSelectedEjercicios((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const removeEjercicioSel = (id) => {
    setSelectedEjercicios((prev) => { const c={...prev}; delete c[id]; return c; });
  };

  const handleAsignar = async (e) => {
    e.preventDefault();
    const idsEjer = Object.keys(selectedEjercicios);
    if (idsEjer.length === 0) {
      showToast("Selecciona al menos un ejercicio", "danger");
      return;
    }
    const a = asignarAfiliadoData;
    if (!a) { showToast("Selecciona un afiliado", "danger"); return; }
    setSaving(true);
    try {
      const idAfiliado = getId(a);
      let idCiclo;
      const cicloExistente = cicloActivo(a);
      if (cicloExistente && (cicloExistente.id_ciclo || cicloExistente.id)) {
        idCiclo = cicloExistente.id_ciclo || cicloExistente.id;
      } else {
        const fechaInicio = new Date().toISOString().split("T")[0];
        const fechaFin = new Date(Date.now()+90*86400000).toISOString().split("T")[0];
        const { data: ciclo } = await authAxios.post("/afiliados/ciclos", {
          id_usuario: idAfiliado,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          objetivo_fisico: a.objetivo_fisico || "Mantenimiento",
          nivel_experiencia: a.nivel_experiencia || "Principiante",
          disponibilidad_dias: Number(a.disponibilidad_semanal_dias) || 3,
        });
        idCiclo = ciclo.id_ciclo ?? ciclo.id;
      }

      // Crear o actualizar plan de entrenamiento
      let planData = null;
      try {
        const resp = await authAxios.get(`/planes/entrenamiento/${idCiclo}`);
        planData = resp.data;
      } catch (getErr) {
        if (getErr.response?.status !== 404) throw getErr;
      }
      if (planData) {
        await authAxios.patch(`/planes/entrenamiento/${idCiclo}`, { observaciones:"" });
      } else {
        await authAxios.post("/planes/entrenamiento", { id_ciclo: idCiclo });
      }

      // Mapa de rutinas existentes: dia_numero → id_rutina
      const rutinasExistentes = {};
      if (planData && Array.isArray(planData.rutinas)) {
        for (const r of planData.rutinas) {
          rutinasExistentes[r.dia_numero] = r.id_rutina;
        }
      }

      // Agrupar ejercicios por día
      const porDia = {};
      idsEjer.forEach((idEj) => {
        const ej = selectedEjercicios[idEj];
        const dia = Number(ej.dia_numero) || 1;
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push({ id_ejercicio: Number(idEj), series: Number(ej.series)||3, repeticiones: Number(ej.repeticiones)||12 });
      });

      // Crear rutinas y asignar ejercicios
      for (const diaStr of Object.keys(porDia)) {
        const diaNum = Number(diaStr);
        if (rutinasExistentes[diaNum]) {
          try {
            await authAxios.delete(`/planes/rutinas/${rutinasExistentes[diaNum]}`);
          } catch (delErr) {
            console.warn("[RutinasView] error al eliminar rutina existente:", delErr);
          }
        }
        const ejercDelDia = porDia[diaNum];
        const { data: rutina } = await authAxios.post("/planes/rutinas", {
          id_ciclo: idCiclo,
          nombre_rutina: "Rutina " + (DAY_LABELS[diaNum-1] || "Día "+diaNum),
          dia_numero: diaNum,
          enfoque_muscular: "Full Body",
        });
        const idRutina = rutina.id ?? rutina.id_rutina;
        for (let i = 0; i < ejercDelDia.length; i++) {
          await authAxios.post(`/planes/rutinas/${idRutina}/ejercicios`, {
            id_ejercicio: ejercDelDia[i].id_ejercicio,
            series: ejercDelDia[i].series,
            repeticiones: ejercDelDia[i].repeticiones,
            orden: i + 1,
          });
        }
      }

      showToast("Plan de entrenamiento creado correctamente", "success");
      trackEvent("metaFit_rutina_asignada", { afiliado_id: getId(a) });
      closeModal();
      fetchAfiliados();
    } catch (err) {
      console.error("[RutinasView] asignar:", err);
      showToast(err.response?.data?.error || err.message || "Error al asignar rutina", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleGuardarEjercicio = async (e) => {
    e.preventDefault();
    if (!formEj.nombre_ejercicio.trim()) { showToast("El nombre es obligatorio", "danger"); return; }
    setSaving(true);
    try {
      if (modal === "editar" && modalEjercicio) {
        const id = modalEjercicio.id_ejercicio ?? modalEjercicio.id;
        await authAxios.put(`/catalogo/ejercicios/${id}`, formEj);
        showToast("Ejercicio actualizado", "success");
      } else {
        await authAxios.post("/catalogo/ejercicios", formEj);
        showToast("Ejercicio creado", "success");
      }
      closeModal();
      fetchEjercicios();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || "Error al guardar ejercicio", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminarEjercicio = async (e) => {
    e.preventDefault();
    if (!deleteEjId) { showToast("Selecciona un ejercicio", "danger"); return; }
    setSaving(true);
    try {
      await authAxios.delete(`/catalogo/ejercicios/${deleteEjId}`);
      showToast("Ejercicio eliminado", "success");
      closeModal();
      fetchEjercicios();
    } catch (err) {
      const msg = err.response?.status === 409
        ? "No se puede eliminar: el ejercicio está siendo usado en planes activos"
        : (err.response?.data?.error || err.message || "Error al eliminar");
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────
  const badgeNivel = (nivel) => {
    if (!nivel) return null;
    const cfg = NIVEL_COLOR[nivel] || { bg:"#6b728018", text:"#6b7280" };
    return <span className={s.badgeNivel} style={{ background:cfg.bg, color:cfg.text }}>{nivel}</span>;
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <AppLayout>
      {toast.msg && (
        <div style={{ position:"fixed", top:16, right:16, zIndex:9999, padding:"0.5rem 1rem", borderRadius:8,
          background: toast.type==="danger" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          border: toast.type==="danger" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
          color: toast.type==="danger" ? "#ef4444" : "#22c55e" }}>
          {toast.msg}
        </div>
      )}

      <div className={s.page}>
        {/* HEADER */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 className={s.headerTitle}>🏋️ Planes de Entrenamiento</h1>
            <p className={s.headerSub}>Gestión de rutinas y planes de entrenamiento para afiliados</p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button type="button" className={s.btnPrimary} onClick={openAsignar}>➕ Asignar Rutina</button>
            <button type="button" className={s.btnOutline} onClick={() => { fetchEjercicios(); setModal("catalogo"); }}>📋 Ver Catálogo</button>
            <button type="button" className={s.btnAsignar} onClick={() => setModal("nuevo")}>➕ Agregar Ejercicio</button>
            <button type="button" className={s.btnOutlineDanger} onClick={() => { fetchEjercicios(); setModal("eliminar"); }}>🗑️ Eliminar Ejercicio</button>
          </div>
        </div>

        {/* KPIs */}
        <div className={s.kpiRow}>
          <div className={s.kpiCard}>
            <div className={s.kpiValue}>{totalAfiliados}</div>
            <div className={s.kpiLabel}>Total Afiliados</div>
          </div>
          <div className={s.kpiCard}>
            <div className={s.kpiValue} style={{ color:"#22c55e" }}>{conPlan}</div>
            <div className={s.kpiLabel}>Con Plan de Entrenamiento</div>
          </div>
          <div className={s.kpiCard}>
            <div className={s.kpiValue} style={{ color:"#ef4444" }}>{sinPlan}</div>
            <div className={s.kpiLabel}>Sin Plan Asignado</div>
          </div>
          <div className={s.kpiCard}>
            <div className={s.kpiValue} style={{ color:"#e31c25" }}>{totalEjercicios}</div>
            <div className={s.kpiLabel}>Ejercicios en Catálogo</div>
          </div>
        </div>

        {/* SEARCH + TABLE CARD */}
        <div className={s.tableCardHeader} style={{ marginBottom:16, borderRadius:14, border:"1px solid var(--mf-border)", display:"flex", gap:12, flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", padding:"0.75rem 1rem" }}>
          <span className="fw-bold" style={{ fontSize:"0.85rem", color:"var(--mf-text)" }}>🏋️ Afiliados</span>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <input type="text" className={s.searchInput} placeholder="Buscar afiliado..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{ maxWidth:260, padding:"0.4rem 0.7rem", fontSize:"0.85rem" }} />
            <button type="button" className={s.btnRefresh} onClick={fetchAfiliados} disabled={loading} title="Refrescar">{loading ? <span className="spinner-border spinner-border-sm" /> : "🔄"}</button>
          </div>
        </div>

        {/* TABLE */}
        <div className={s.tableCard}>
          <div style={{ overflowX:"auto" }}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Afiliado</th>
                  <th>Objetivo</th>
                  <th>Nivel</th>
                  <th>Días/sem</th>
                  <th>Plan activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && afiliados.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-4"><span className="spinner-border spinner-border-sm" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className={s.emptyState}>{search ? "No se encontraron afiliados" : "No hay afiliados registrados"}</td></tr>
                ) : filtered.map((a, idx) => {
                  const ciclo = cicloActivo(a);
                  const tienePlan = ciclo && !!ciclo.plan_entrenamiento;
                  const nombre = nombreCompleto(a);
                  const email = a.correo || a.email || "";
                  return (
                    <tr key={getId(a)}>
                      <td style={{ color:"var(--mf-muted)", fontSize:"0.78rem" }}>{idx + 1}</td>
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                          <div className={s.avatar} style={{ background:avatarColor(nombre) }}>{inicial(a)}</div>
                          <div>
                            <div style={{ fontSize:"0.85rem", fontWeight:600 }}>{nombre}</div>
                            <div className={s.emailText}>{email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{a.objetivo_fisico ? <span>{OBJETIVO_ICON[a.objetivo_fisico]||""} {a.objetivo_fisico}</span> : "—"}</td>
                      <td>{badgeNivel(a.nivel_experiencia)}</td>
                      <td style={{ color:"var(--mf-text)" }}>{a.disponibilidad_semanal_dias || "—"}</td>
                      <td>{tienePlan ? <span className={s.badgeCiclo}>✅ Activo</span> : <span className={s.badgeSinRutina}>Sin plan</span>}</td>
                      <td>
                        <div className={s.actionBtns}>
                          <button type="button" className={s.btnOutline} style={{ padding:"0.25rem 0.5rem", fontSize:"0.75rem" }} onClick={() => { setModalAfiliado(a); setModal("historial"); }} title="Historial de ciclos">📜</button>
                          {tienePlan && (
                            <button type="button" className={s.btnOutline} style={{ padding:"0.25rem 0.5rem", fontSize:"0.75rem" }} onClick={() => { setModalAfiliado(a); setModal("verPerfil"); }} title="Ver">👁️</button>
                          )}
                          <button type="button" className={s.btnAsignar} style={{ padding:"0.25rem 0.6rem", fontSize:"0.75rem" }} onClick={() => { setAsignarAfiliadoId(String(getId(a))); setAsignarAfiliadoData(a); handleAfiliadoSelect({ target: { value: String(getId(a)) } }); setModal("asignar"); }}>
                            {tienePlan ? "🔄 Nueva" : "➕ Asignar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: ASIGNAR RUTINA                         */}
      {/* ════════════════════════════════════════════ */}
      {modal === "asignar" && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:800 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>{asignarAfiliadoData && cicloActivo(asignarAfiliadoData) ? "🔄 Nueva Rutina" : "➕ Asignar Rutina"}</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>✕</button>
            </div>
            <form onSubmit={handleAsignar}>
              <div className={s.modalBody}>
                {/* Selector de afiliado */}
                <div style={{ marginBottom:16 }}>
                  <label className={s.labelText}>Afiliado</label>
                  <select className={s.selectDark} value={asignarAfiliadoId} onChange={handleAfiliadoSelect} required style={{ width:"100%" }}>
                    <option value="">-- Selecciona un afiliado --</option>
                    {afiliados.map((a) => (
                      <option key={getId(a)} value={getId(a)}>{nombreCompleto(a)} — {a.correo||a.email||""}</option>
                    ))}
                  </select>
                </div>

                {asignarAfiliadoData && (
                  <div className={s.afiliadoSection} style={{ marginBottom:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div className={s.avatarModal} style={{ background:avatarColor(nombreCompleto(asignarAfiliadoData)) }}>{inicial(asignarAfiliadoData)}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{nombreCompleto(asignarAfiliadoData)}</div>
                        <div className={s.emailText}>{asignarAfiliadoData.correo || asignarAfiliadoData.email || ""}</div>
                        <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                          {badgeNivel(asignarAfiliadoData.nivel_experiencia)}
                          <span className={s.badgeDark}>{OBJETIVO_ICON[asignarAfiliadoData.objetivo_fisico]||""} {asignarAfiliadoData.objetivo_fisico||"Sin objetivo"}</span>
                          <span className={s.badgeDark}>📅 {asignarAfiliadoData.disponibilidad_semanal_dias||"?"} días/sem</span>
                        </div>
                        {asignarAfiliadoData.restricciones_medicas && (
                          <div className={s.alertDanger} style={{ marginTop:8, padding:"0.3rem 0.6rem", fontSize:"0.78rem" }}>⚠️ {asignarAfiliadoData.restricciones_medicas}</div>
                        )}
                      </div>
                    </div>
                    {cicloActivo(asignarAfiliadoData) && (
                      <div style={{ marginTop:8, color:"#22c55e", fontSize:"0.78rem" }}>
                        ✅ Ciclo activo detectado (ID: {cicloActivo(asignarAfiliadoData).id_ciclo}) — se reutilizará
                      </div>
                    )}
                  </div>
                )}

                {/* Ejercicios disponibles */}
                {asignarAfiliadoData && (
                  <>
                    <label className={s.labelText}>Ejercicios disponibles ({ejerciciosDisponibles.length})</label>
                    {ejerciciosDisponibles.length === 0 ? (
                      <div className={s.emptyState}>No hay ejercicios disponibles para este afiliado</div>
                    ) : (
                      <div className={s.gruposMusculares} style={{ display:"flex", gap:4, marginBottom:8 }}>
                        {[...new Set(ejerciciosDisponibles.map(e=>e.grupo_muscular))].filter(Boolean).map((g) => (
                          <button key={g} type="button" className={s.badgeDark} style={{ cursor:"pointer" }}
                            onClick={() => {
                              const first = ejerciciosDisponibles.find((e) => e.grupo_muscular === g && !selectedEjercicios[e.id_ejercicio??e.id]);
                              if (first) addEjercicioToRutina(first);
                            }}>➕ {g}</button>
                        ))}
                      </div>
                    )}
                    <div style={{ maxHeight:300, overflowY:"auto", border:"1px solid var(--mf-border)", borderRadius:8, padding:"0.5rem", marginBottom:12 }}>
                      {ejerciciosDisponibles.map((ej) => {
                        const id = ej.id_ejercicio ?? ej.id;
                        const checked = !!selectedEjercicios[id];
                        const data = selectedEjercicios[id] || {};
                        return (
                          <div key={id} className={`${s.ejercicioItem} ${checked ? s.ejercicioItemChecked : ""}`}>
                            <div className={s.ejercicioRow}>
                              <input type="checkbox" className={s.checkboxDark} checked={checked} onChange={() => checked ? removeEjercicioSel(id) : addEjercicioToRutina(ej)} />
                              <span className={s.ejercicioName}>{ej.nombre_ejercicio || ej.nombre}</span>
                              <span className={s.ejercicioMeta}>{ej.grupo_muscular || ""}</span>
                            </div>
                            {checked && (
                              <div className={s.formRow}>
                                <div className={s.formGroup}>
                                  <label className={s.inlineLabel}>Series</label>
                                  <input type="number" className={s.inlineInput} min={1} max={20} value={data.series??3} onChange={(e)=>updateEjercicioSel(id,"series",e.target.value)} />
                                </div>
                                <div className={s.formGroup}>
                                  <label className={s.inlineLabel}>Reps</label>
                                  <input type="number" className={s.inlineInput} min={1} max={100} value={data.repeticiones??12} onChange={(e)=>updateEjercicioSel(id,"repeticiones",e.target.value)} />
                                </div>
                                <div className={s.formGroup} style={{ minWidth:100 }}>
                                  <label className={s.inlineLabel}>Día</label>
                                  <select className={s.inlineSelect} value={data.dia_numero??1} onChange={(e)=>updateEjercicioSel(id,"dia_numero",e.target.value)}>
                                    {DAY_LABELS.map((d, i) => <option key={i+1} value={i+1}>{d}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className={s.btnConfirmar} disabled={saving || !asignarAfiliadoData || Object.keys(selectedEjercicios).length === 0}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : "✅ Crear Plan de Entrenamiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: CATÁLOGO DE EJERCICIOS                 */}
      {/* ════════════════════════════════════════════ */}
      {modal === "catalogo" && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:800 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>📋 Catálogo de Ejercicios</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal}>✕</button>
            </div>
            <div className={s.modalBody}>
              {catalogoEj.length === 0 ? (
                <div className={s.emptyState}>No hay ejercicios en el catálogo</div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Grupo Muscular</th>
                        <th>Nivel Mínimo</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalogoEj.map((ej, idx) => (
                        <tr key={ej.id_ejercicio ?? ej.id}>
                          <td style={{ color:"var(--mf-muted)", fontSize:"0.78rem" }}>{idx + 1}</td>
                          <td style={{ fontWeight:600 }}>{ej.nombre_ejercicio || ej.nombre}</td>
                          <td>{ej.grupo_muscular ? <span className={s.badgeDark}>{ej.grupo_muscular}</span> : "—"}</td>
                          <td>{badgeNivel(ej.nivel_minimo)}</td>
                          <td>
                            <div className={s.actionBtns}>
                              <button type="button" className={s.btnOutline} style={{ padding:"0.2rem 0.5rem", fontSize:"0.72rem" }}
                                onClick={() => { setModalEjercicio(ej); setFormEj({ nombre_ejercicio:ej.nombre_ejercicio||ej.nombre||"", grupo_muscular:ej.grupo_muscular||"Pecho", nivel_minimo:ej.nivel_minimo||"Principiante", descripcion:ej.descripcion||"" }); setModal("editar"); }}>✏️</button>
                              <button type="button" className={s.btnOutlineDanger} style={{ padding:"0.2rem 0.5rem", fontSize:"0.72rem" }}
                                onClick={() => { setDeleteEjId(ej.id_ejercicio ?? ej.id); setModal("eliminar"); }}>🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.btnPrimary} onClick={() => setModal("nuevo")}>➕ Nuevo Ejercicio</button>
              <button type="button" className={s.btnOutline} onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: NUEVO / EDITAR EJERCICIO               */}
      {/* ════════════════════════════════════════════ */}
      {(modal === "nuevo" || modal === "editar") && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:500 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>{modal === "nuevo" ? "🏋️ Nuevo Ejercicio" : "✏️ Editar Ejercicio"}</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>✕</button>
            </div>
            <form onSubmit={handleGuardarEjercicio}>
              <div className={s.modalBody}>
                <div style={{ marginBottom:12 }}>
                  <label className={s.labelText}>Nombre del ejercicio *</label>
                  <input className={s.inputDark} value={formEj.nombre_ejercicio} onChange={(e)=>setFormEj((f)=>({...f, nombre_ejercicio:e.target.value}))} placeholder="Ej: Press de banca" required style={{ width:"100%" }} />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className={s.labelText}>Grupo muscular</label>
                  <select className={s.selectDark} value={formEj.grupo_muscular} onChange={(e)=>setFormEj((f)=>({...f, grupo_muscular:e.target.value}))} style={{ width:"100%" }}>
                    {GRUPOS_MUSCULARES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className={s.labelText}>Nivel mínimo</label>
                  <select className={s.selectDark} value={formEj.nivel_minimo} onChange={(e)=>setFormEj((f)=>({...f, nivel_minimo:e.target.value}))} style={{ width:"100%" }}>
                    {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom:12 }}>
                  <label className={s.labelText}>Descripción (opcional)</label>
                  <textarea className={s.textareaDark} rows={3} value={formEj.descripcion} onChange={(e)=>setFormEj((f)=>({...f, descripcion:e.target.value}))} placeholder="Instrucciones o notas..." style={{ width:"100%" }} />
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className={s.btnConfirmar} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : (modal === "nuevo" ? "💾 Guardar" : "💾 Guardar Cambios")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: ELIMINAR EJERCICIO                     */}
      {/* ════════════════════════════════════════════ */}
      {modal === "eliminar" && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:450 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>🗑️ Eliminar Ejercicio</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>✕</button>
            </div>
            <form onSubmit={handleEliminarEjercicio}>
              <div className={s.modalBody}>
                <div className={s.alertDanger} style={{ marginBottom:"0.75rem", padding:"0.5rem 0.75rem", fontSize:"0.82rem" }}>⚠️ Esta acción no se puede deshacer.</div>
                {catalogoEj.length === 0 ? (
                  <div className={s.emptyState}>No hay ejercicios en el catálogo</div>
                ) : (
                  <>
                    <label className={s.labelText}>Seleccionar ejercicio</label>
                    <select className={s.selectDark} value={deleteEjId} onChange={(e)=>setDeleteEjId(e.target.value)} style={{ width:"100%" }}>
                      <option value="">-- Selecciona --</option>
                      {catalogoEj.map((ej) => (
                        <option key={ej.id_ejercicio??ej.id} value={ej.id_ejercicio??ej.id}>
                          {ej.nombre_ejercicio||ej.nombre} ({ej.grupo_muscular||"Sin grupo"})
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className={s.btnDanger} disabled={saving || !deleteEjId}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : "🗑️ Eliminar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: HISTORIAL DE CICLOS (editar/eliminar) */}
      {/* ════════════════════════════════════════════ */}
      {modal === "historial" && modalAfiliado && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:760 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>📜 Historial de Ciclos — {nombreCompleto(modalAfiliado)}</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal}>✕</button>
            </div>
            <div className={s.modalBody}>
              <HistorialCiclos afiliado={modalAfiliado} authAxios={authAxios} onCambio={fetchAfiliados} showToast={showToast} />
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.btnOutline} onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: VER PERFIL DEL AFILIADO                */}
      {/* ════════════════════════════════════════════ */}
      {modal === "verPerfil" && modalAfiliado && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:700 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>👁️ Rutina: {nombreCompleto(modalAfiliado)}</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.afiliadoSection} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div className={s.avatarModal} style={{ background:avatarColor(nombreCompleto(modalAfiliado)) }}>{inicial(modalAfiliado)}</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:"0.9rem" }}>{nombreCompleto(modalAfiliado)}</div>
                    <div className={s.emailText}>{modalAfiliado.correo||modalAfiliado.email||""}</div>
                    <div style={{ display:"flex", gap:6, marginTop:4, flexWrap:"wrap" }}>
                      {badgeNivel(modalAfiliado.nivel_experiencia)}
                    </div>
                  </div>
                </div>
              </div>
              {(() => {
                const ciclo = cicloActivo(modalAfiliado);
                if (!ciclo || !ciclo.plan_entrenamiento) {
                  return <div className={s.emptyState}>Este afiliado no tiene un plan de entrenamiento activo</div>;
                }
                return <PlanDisplay afiliado={modalAfiliado} authAxios={authAxios} />;
              })()}
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.btnOutline} onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Sub-component: Historial de ciclos del afiliado ─────────
// Permite al staff ver todos los ciclos, editar objetivo/nivel/fechas/días
// (PATCH /ciclos/:id_ciclo) y eliminarlos (DELETE /ciclos/:id_ciclo).
function HistorialCiclos({ afiliado, authAxios, onCambio, showToast }) {
  const [ciclos, setCiclos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const { data } = await authAxios.get(`/afiliados/${getId(afiliado)}/ciclos`);
      setCiclos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[RutinasView] historial ciclos:", err);
      showToast("Error al cargar el historial de ciclos", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [afiliado]);

  const iniciarEdicion = (c) => {
    setEditandoId(c.id_ciclo);
    setForm({ fecha_inicio: toDateInput(c.fecha_inicio), fecha_fin: toDateInput(c.fecha_fin),
      objetivo_fisico: c.objetivo_fisico || "Mantenimiento", nivel_experiencia: c.nivel_experiencia || "Intermedio",
      disponibilidad_dias: c.disponibilidad_dias ?? 3, activo: Boolean(c.activo) });
  };

  const guardar = async (c) => {
    setSaving(true);
    try {
      await authAxios.patch(`/ciclos/${c.id_ciclo}`, {
        fecha_inicio: form.fecha_inicio, fecha_fin: form.fecha_fin,
        objetivo_fisico: form.objetivo_fisico, nivel_experiencia: form.nivel_experiencia,
        disponibilidad_dias: Number(form.disponibilidad_dias), activo: form.activo,
      });
      showToast("Ciclo actualizado correctamente", "success");
      setEditandoId(null); setForm(null);
      await cargar();
      if (onCambio) onCambio();
    } catch (err) {
      console.error("[RutinasView] actualizar ciclo:", err);
      showToast(err.response?.data?.error || err.message || "Error al actualizar ciclo", "danger");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar el ciclo ${c.id_ciclo} (${toDateInput(c.fecha_inicio)} → ${toDateInput(c.fecha_fin)})? Se borrarán planes, progreso y registros asociados.`)) return;
    setSaving(true);
    try {
      await authAxios.delete(`/ciclos/${c.id_ciclo}`);
      showToast("Ciclo eliminado correctamente", "success");
      await cargar();
      if (onCambio) onCambio();
    } catch (err) {
      console.error("[RutinasView] eliminar ciclo:", err);
      showToast(err.response?.data?.error || err.message || "Error al eliminar ciclo", "danger");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={s.emptyState}><span className="spinner-border spinner-border-sm" /></div>;
  if (ciclos.length === 0) return <div className={s.emptyState}>Este afiliado no tiene ciclos registrados</div>;

  return (
    <div>
      {ciclos.map((c) => (
        <div key={c.id_ciclo} className={s.afiliadoSection} style={{ marginBottom:12, padding:"0.6rem 0.75rem" }}>
          {editandoId === c.id_ciclo ? (
            <div>
              <div className={s.formRow}>
                <div className={s.formGroup}>
                  <label className={s.inlineLabel}>Inicio</label>
                  <input type="date" className={s.inlineInput} value={form.fecha_inicio} onChange={(e)=>setForm((f)=>({...f, fecha_inicio:e.target.value}))} />
                </div>
                <div className={s.formGroup}>
                  <label className={s.inlineLabel}>Fin</label>
                  <input type="date" className={s.inlineInput} value={form.fecha_fin} onChange={(e)=>setForm((f)=>({...f, fecha_fin:e.target.value}))} />
                </div>
                <div className={s.formGroup} style={{ minWidth:120 }}>
                  <label className={s.inlineLabel}>Objetivo</label>
                  <select className={s.inlineSelect} value={form.objetivo_fisico} onChange={(e)=>setForm((f)=>({...f, objetivo_fisico:e.target.value}))}>
                    {Object.keys(OBJETIVO_ICON).map((o) => <option key={o} value={o}>{OBJETIVO_ICON[o]} {o}</option>)}
                    <option value="Rehabilitacion">🤕 Rehabilitación</option>
                  </select>
                </div>
                <div className={s.formGroup} style={{ minWidth:110 }}>
                  <label className={s.inlineLabel}>Nivel</label>
                  <select className={s.inlineSelect} value={form.nivel_experiencia} onChange={(e)=>setForm((f)=>({...f, nivel_experiencia:e.target.value}))}>
                    {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className={s.formGroup} style={{ minWidth:70 }}>
                  <label className={s.inlineLabel}>Días/sem</label>
                  <select className={s.inlineSelect} value={form.disponibilidad_dias} onChange={(e)=>setForm((f)=>({...f, disponibilidad_dias:e.target.value}))}>
                    {[1,2,3,4,5,6,7].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className={s.formGroup} style={{ minWidth:70 }}>
                  <label className={s.inlineLabel}>Activo</label>
                  <input type="checkbox" className={s.checkboxDark} checked={form.activo} onChange={(e)=>setForm((f)=>({...f, activo:e.target.checked}))} />
                </div>
              </div>
              <div style={{ display:"flex", gap:6, marginTop:8 }}>
                <button type="button" className={s.btnConfirmar} style={{ padding:"0.25rem 0.6rem", fontSize:"0.75rem" }} disabled={saving} onClick={() => guardar(c)}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : "💾 Guardar"}
                </button>
                <button type="button" className={s.btnOutline} style={{ padding:"0.25rem 0.6rem", fontSize:"0.75rem" }} disabled={saving} onClick={() => { setEditandoId(null); setForm(null); }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              <div style={{ fontWeight:600, fontSize:"0.85rem" }}>
                #{c.id_ciclo} · {toDateInput(c.fecha_inicio)} → {toDateInput(c.fecha_fin)}
              </div>
              {c.activo ? <span className={s.badgeCiclo}>✅ Activo</span> : <span className={s.badgeSinRutina}>Inactivo</span>}
              <span className={s.badgeDark}>{OBJETIVO_ICON[c.objetivo_fisico]||""} {c.objetivo_fisico||"Sin objetivo"}</span>
              <span className={s.badgeDark}>{c.nivel_experiencia||"—"}</span>
              <span className={s.badgeDark}>📅 {c.disponibilidad_dias||"—"} días</span>
              {c.numero_ciclo ? <span className={s.badgeDark}>#{c.numero_ciclo}</span> : null}
              <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
                <button type="button" className={s.btnOutline} style={{ padding:"0.25rem 0.5rem", fontSize:"0.75rem" }} onClick={() => iniciarEdicion(c)} title="Editar">✏️</button>
                <button type="button" className={s.btnOutlineDanger} style={{ padding:"0.25rem 0.5rem", fontSize:"0.75rem" }} disabled={saving} onClick={() => eliminar(c)} title="Eliminar">🗑️</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Sub-component: PlanDisplay ──────────────────────────────
// Muestra el plan de entrenamiento del afiliado con edición inline
// de series/repeticiones/peso (PATCH/DELETE ejercicios) y las notas
// del afiliado por ejercicio (GET /afiliados/:id/notas-ejercicio).
function PlanDisplay({ afiliado, authAxios }) {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [edit, setEdit] = useState({}); // { [rutina:ejercicio]: { series, repeticiones, peso_kg } }
  const [savingKey, setSavingKey] = useState(null);
  const [notas, setNotas] = useState([]);
  const { showToast } = useToast();

  const cargar = async () => {
    try {
      const ciclo = cicloActivo(afiliado);
      if (!ciclo) { setError("Sin ciclo activo"); return; }
      const idCiclo = ciclo.id_ciclo ?? ciclo.id;
      const { data } = await authAxios.get(`/planes/entrenamiento/${idCiclo}`);
      setPlan(data);
      setError(null);
    } catch (err) {
      console.error("[RutinasView] ver plan:", err);
      setError("Error al cargar plan de entrenamiento");
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afiliado]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authAxios.get(`/afiliados/${getId(afiliado)}/notas-ejercicio`);
        setNotas(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("[RutinasView] notas:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afiliado]);

  if (error) return <div className={s.emptyState}>{error}</div>;
  if (!plan) return <div className={s.emptyState}>Cargando plan...</div>;

  const rutinas = plan.rutinas || [];
  if (rutinas.length === 0) return <div className={s.emptyState}>No hay rutinas asignadas en este plan</div>;

  const notasPorEjercicio = (idEjercicio) => notas.filter((n) => String(n.id_ejercicio) === String(idEjercicio));

  const inicioEdicion = (rutina, ej) => {
    const key = `${rutina.id_rutina}:${ej.id_ejercicio}`;
    setEdit((prev) => ({ ...prev, [key]: { series: ej.series ?? "", repeticiones: ej.repeticiones ?? "", peso_kg: ej.peso_kg ?? "" } }));
  };

  const guardarEdicion = async (rutina, ej) => {
    const key = `${rutina.id_rutina}:${ej.id_ejercicio}`;
    const payload = { series: Number(edit[key].series), repeticiones: Number(edit[key].repeticiones) };
    if (edit[key].peso_kg !== "" && edit[key].peso_kg !== null) payload.peso_kg = Number(edit[key].peso_kg);
    setSavingKey(key);
    try {
      await authAxios.patch(`/planes/rutinas/${rutina.id_rutina}/ejercicios/${ej.id_ejercicio}`, payload);
      showToast("Ejercicio actualizado", "success");
      setEdit((prev) => { const c = { ...prev }; delete c[key]; return c; });
      window.dispatchEvent(new Event("rutina-modificada"));
      await cargar();
    } catch (err) {
      console.error("[RutinasView] guardar ejercicio:", err);
      showToast(err.response?.data?.error || err.message || "Error al actualizar ejercicio", "danger");
    } finally {
      setSavingKey(null);
    }
  };

  const quitarEjercicio = async (rutina, ej) => {
    if (!window.confirm(`¿Quitar "${ej.nombre_ejercicio || ej.nombre}" de la rutina?`)) return;
    setSavingKey(`${rutina.id_rutina}:${ej.id_ejercicio}`);
    try {
      await authAxios.delete(`/planes/rutinas/${rutina.id_rutina}/ejercicios/${ej.id_ejercicio}`);
      showToast("Ejercicio eliminado de la rutina", "success");
      window.dispatchEvent(new Event("rutina-modificada"));
      await cargar();
    } catch (err) {
      console.error("[RutinasView] quitar ejercicio:", err);
      showToast(err.response?.data?.error || err.message || "Error al eliminar ejercicio", "danger");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      <div style={{ textAlign:"right", marginBottom:8 }}>
        <button type="button" className={s.btnRefresh} onClick={cargar} title="Recargar">🔄</button>
      </div>
      {rutinas.map((rutina, ri) => (
        <div key={rutina.id_rutina ?? ri} style={{ marginBottom:16 }}>
          <h5 style={{ color:"#e31c25", fontSize:"0.9rem", margin:"0 0 8px 0", display:"flex", alignItems:"center", gap:6 }}>
            📅 {DAY_LABELS[(rutina.dia_numero ?? 1) - 1] || `Día ${rutina.dia_numero}`}
            {rutina.enfoque_muscular ? <span className="badge" style={{ background:"rgba(227, 28, 37, 0.15)", color:"var(--mf-accent)", fontSize:"0.65rem", padding:"0.1rem 0.4rem" }}>{rutina.enfoque_muscular}</span> : null}
          </h5>
          {Array.isArray(rutina.ejercicios) && rutina.ejercicios.length > 0 ? (
            <table className={s.table} style={{ fontSize:"0.8rem" }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Ejercicio</th>
                  <th>Series</th>
                  <th>Reps</th>
                  <th>Peso (kg)</th>
                  <th>Notas del afiliado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rutina.ejercicios.filter(e=>e).map((ej, ei) => {
                  const key = `${rutina.id_rutina}:${ej.id_ejercicio}`;
                  const editing = !!edit[key];
                  const ejNotas = notasPorEjercicio(ej.id_ejercicio);
                  const guardando = savingKey === key;
                  return (
                    <tr key={ei}>
                      <td style={{ color:"var(--mf-muted)" }}>{ej.orden ?? ei + 1}</td>
                      <td>
                        <div style={{ fontWeight:600 }}>{ej.nombre_ejercicio || ej.nombre || "—"}</div>
                        {ej.instrucciones ? <div className={s.emailText}>{ej.instrucciones}</div> : null}
                      </td>
                      {editing ? (
                        <>
                          <td><input type="number" min={1} className={s.inlineInput} style={{ width:60 }} value={edit[key].series} onChange={(e)=>setEdit((prev)=>({...prev, [key]: {...prev[key], series: e.target.value}}))} /></td>
                          <td><input type="number" min={1} className={s.inlineInput} style={{ width:60 }} value={edit[key].repeticiones} onChange={(e)=>setEdit((prev)=>({...prev, [key]: {...prev[key], repeticiones: e.target.value}}))} /></td>
                          <td><input type="number" min={0} step="0.5" className={s.inlineInput} style={{ width:70 }} value={edit[key].peso_kg} onChange={(e)=>setEdit((prev)=>({...prev, [key]: {...prev[key], peso_kg: e.target.value}}))} /></td>
                        </>
                      ) : (
                        <>
                          <td>{ej.series ?? "—"}</td>
                          <td>{ej.repeticiones ?? "—"}</td>
                          <td>{ej.peso_kg ?? "—"}</td>
                        </>
                      )}
                      <td>
                        {ejNotas.length === 0 ? (
                          <span className="text-muted" style={{ fontSize:"0.72rem" }}>Sin notas</span>
                        ) : (
                          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                            {ejNotas.map((n) => (
                              <div key={n.id_nota} className={s.alertDanger} style={{ margin:0, padding:"0.2rem 0.4rem", fontSize:"0.7rem" }}>
                                {n.nota}
                                <div className="text-muted" style={{ fontSize:"0.62rem" }}>{toDateInput(n.fecha_nota)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        {editing ? (
                          <div className={s.actionBtns}>
                            <button type="button" className={s.btnConfirmar} style={{ padding:"0.25rem 0.5rem", fontSize:"0.72rem" }} disabled={guardando} onClick={() => guardarEdicion(rutina, ej)}>
                              {guardando ? <span className="spinner-border spinner-border-sm" /> : "💾"}
                            </button>
                            <button type="button" className={s.btnOutline} style={{ padding:"0.25rem 0.5rem", fontSize:"0.72rem" }} disabled={guardando} onClick={() => setEdit((prev)=>{ const c={...prev}; delete c[key]; return c; })}>✖</button>
                          </div>
                        ) : (
                          <div className={s.actionBtns}>
                            <button type="button" className={s.btnOutline} style={{ padding:"0.25rem 0.5rem", fontSize:"0.72rem" }} onClick={() => inicioEdicion(rutina, ej)} title="Editar serie/reps/peso">✏️</button>
                            <button type="button" className={s.btnOutlineDanger} style={{ padding:"0.25rem 0.5rem", fontSize:"0.72rem" }} disabled={guardando} onClick={() => quitarEjercicio(rutina, ej)} title="Quitar de la rutina">🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={s.emptyState} style={{ margin:0, padding:"0.5rem" }}>Sin ejercicios asignados</div>
          )}
        </div>
      ))}
    </div>
  );
}
