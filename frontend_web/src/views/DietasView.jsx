// frontend_web/src/views/DietasView.jsx
// ─── Vista Planes Nutricionales (staff Entrenador/Admin) ────
// Gestión de dietas por afiliado: KPIs (total / con plan / sin plan /
// alimentos en catálogo), tabla de afiliados con su objetivo y restricciones,
// y modales para: asignar dieta (+parámetros del plan y selección de
// alimentos), ver el plan nutricional con edición inline de cantidades,
// catálogo de alimentos (ver/crear/editar/eliminar).
//
// Qué rol lo usa: Entrenador y Administrador.
// API calls (vía authAxios): GET /afiliados, GET /catalogo/alimentos,
// GET /afiliados/:id/alimentos-disponibles, POST /afiliados/ciclos,
// GET|POST|PATCH /planes/nutricional(/:idCiclo),
// POST|PATCH|DELETE /planes/nutricional/:idCiclo/detalle,
// POST|PUT|DELETE /catalogo/alimentos(/:id).
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto, inicial, cicloActivo } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import { trackEvent } from "../utils/analytics";
import s from "./DietasView.module.css";

/** Icono + colores del objetivo para badges y tabla. */
const OBJETIVO_CONFIG = {
  "Perdida de grasa": { icono:"🔥", color:"#e94560", bg:"#e9456018" },
  "Aumento de masa":  { icono:"💪", color:"#2563eb", bg:"#2563eb18" },
  "Mantenimiento":    { icono:"⚖️", color:"#059669", bg:"#05966918" },
};
/** Colores de las badges de restricciones médicas según el tipo. */
const RESTRICCION_COLOR = {
  "Enfermedad": { bg:"#ef444418", text:"#dc2626" },
  "Alergia":    { bg:"#f9731618", text:"#ea580c" },
  "Lesion":     { bg:"#eab30818", text:"#ca8a04" },
};

/** Color determinista del avatar según el nombre (hash simple → tono HSL). */
const avatarColor = (nombre) => {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
};

/**
 * DietasView — Vista de planes nutricionales para staff (Entrenador/Admin).
 *
 * Renderiza: header con botones de acción, 4 KPIs, buscador + tabla de
 * afiliados (objetivo + restricciones + estado del plan) y los modales
 * asignar/ver plan/catálogo/nuevo-editar/eliminar alimento.
 *
 * Estado que maneja (agrupado): afiliados y catálogo de alimentos, loading/
 * saving, búsqueda, el modal activo, el afiliado/alimento objetivo, la
 * selección de alimentos para asignar (selectedAlimentos), el formulario del
 * plan (formPlan), el formulario de alimento (formAlimento) y el alimento a
 * eliminar (deleteAlimentoId).
 *
 * @param {Object} _props - Componente de ruta sin props externas.
 * @returns {JSX.Element} Layout de la app con la gestión de dietas.
 */
export default function DietasView() {
  const { user, authAxios } = useAuth();
  const { toast, showToast } = useToast();
  const navigate = useNavigate();
  const role = user?.role || "Recepcionista";

  // ── State ──────────────────────────────────────────────────
  const [afiliados, setAfiliados] = useState([]);
  const [catalogoAlimentos, setCatalogoAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Modal state
  const [modal, setModal] = useState(null);
  const [modalAfiliado, setModalAfiliado] = useState(null);
  const [modalAlimento, setModalAlimento] = useState(null);

  // Asignar state
  const [asignarAfiliadoId, setAsignarAfiliadoId] = useState("");
  const [asignarAfiliadoData, setAsignarAfiliadoData] = useState(null);
  const [alimentosDisponibles, setAlimentosDisponibles] = useState([]);
  const [selectedAlimentos, setSelectedAlimentos] = useState({});
  const [formPlan, setFormPlan] = useState({ calorias_objetivo:"", num_comidas:"3", observaciones:"" });

  // Nuevo/Editar alimento form
  const [formAlimento, setFormAlimento] = useState({ nombre_alimento:"", proteinas:"", carbohidratos:"", grasas:"", calorias_por_100g:"" });

  // Delete
  const [deleteAlimentoId, setDeleteAlimentoId] = useState("");

  // ── Data fetching ───────────────────────────────────────────
  /**
   * useCallback: carga todos los afiliados (GET /afiliados). Memoizado con
   * [authAxios, showToast] para identidad estable en efectos y refrescos.
   */
  const fetchAfiliados = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[DietasView]", err);
      showToast("Error al cargar afiliados", "danger");
    } finally {
      setLoading(false);
    }
  }, [authAxios, showToast]);

  /**
   * useCallback: carga el catálogo de alimentos (GET /catalogo/alimentos).
   * Se re-llama al guardar/eliminar alimentos y al abrir el catálogo.
   */
  const fetchAlimentos = useCallback(async () => {
    try {
      const { data } = await authAxios.get("/catalogo/alimentos");
      setCatalogoAlimentos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[DietasView] catálogo:", err);
      showToast("Error al cargar catálogo de alimentos", "danger");
    }
  }, [authAxios, showToast]);

  /** Al montar carga afiliados y catálogo en paralelo (una sola vez). */
  useEffect(() => { fetchAfiliados(); fetchAlimentos(); }, [fetchAfiliados, fetchAlimentos]);

  // ── Derived data ────────────────────────────────────────────
  // Filtro por nombre/correo + KPIs: "con plan" = ciclo activo con
  // plan_nutricional embebido por el backend.
  const filtered = afiliados.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return nombreCompleto(a).toLowerCase().includes(q) || (a.correo||a.email||"").toLowerCase().includes(q);
  });
  const totalAfiliados = afiliados.length;
  const conPlan = afiliados.filter((a) => !!cicloActivo(a)?.plan_nutricional).length;
  const sinPlan = totalAfiliados - conPlan;
  const totalAlimentos = catalogoAlimentos.length;

  // ── Modal handlers ──────────────────────────────────────────
  /** Resetea TODO el estado de los modales y los cierra (bloqueado si guarda). */
  const closeModal = () => {
    if (saving) return;
    setModal(null);
    setModalAfiliado(null);
    setModalAlimento(null);
    setAsignarAfiliadoId("");
    setAsignarAfiliadoData(null);
    setAlimentosDisponibles([]);
    setSelectedAlimentos({});
    setFormPlan({ calorias_objetivo:"", num_comidas:"3", observaciones:"" });
    setFormAlimento({ nombre_alimento:"", proteinas:"", carbohidratos:"", grasas:"", calorias_por_100g:"" });
    setDeleteAlimentoId("");
  };

  /**
   * Al cambiar el afiliado en el modal de asignar: guarda su id y data, y carga
   * sus alimentos disponibles (GET /afiliados/:id/alimentos-disponibles), que
   * excluyen los que están restringidos al afiliado.
   * @param {Event} e - Evento change del select.
   */
  const handleAfiliadoSelect = async (e) => {
    const id = e.target.value;
    setAsignarAfiliadoId(id);
    if (!id) { setAsignarAfiliadoData(null); setAlimentosDisponibles([]); return; }
    const a = afiliados.find((x) => String(getId(x)) === id);
    setAsignarAfiliadoData(a || null);
    try {
      const { data } = await authAxios.get(`/afiliados/${id}/alimentos-disponibles`);
      setAlimentosDisponibles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[DietasView] disponibles:", err);
      showToast("Error al cargar alimentos disponibles", "danger");
      setAlimentosDisponibles([]);
    }
  };

  /**
   * Marca/desmarca un alimento de la selección. Al marcar se inicializa con
   * 100 g en la comida #1; al desmarcar se elimina del objeto.
   * @param {number} id - Id del alimento del catálogo.
   */
  const toggleAlimento = (id) => {
    setSelectedAlimentos((prev) => {
      if (prev[id]) { const c={...prev}; delete c[id]; return c; }
      return { ...prev, [id]: { cantidad_g:100, num_comida:1 } };
    });
  };

  /**
   * Actualiza cantidad/comida de un alimento seleccionado
   * (escritura inmutable en el objeto anidado).
   * @param {number} id    - Id del alimento.
   * @param {string} field - "cantidad_g" | "num_comida".
   * @param {any} value    - Nuevo valor.
   */
  const updateAlimentoSel = (id, field, value) => {
    setSelectedAlimentos((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  /**
   * Asigna (o reasigna) el plan nutricional al afiliado seleccionado.
   * Flujo completo:
   * 1) Valida que haya al menos 1 alimento y un afiliado.
   * 2) Determina el id_ciclo: reutiliza el ciclo activo o crea uno de 30 días
   *    (POST /afiliados/ciclos) con objetivo/nivel/disponibilidad del afiliado.
   * 3) Garantiza el plan: GET /planes/nutricional/:idCiclo → PATCH (actualiza
   *    calorías/nº comidas/observaciones) o POST (crea) si es 404.
   * 4) Agrega cada alimento seleccionado vía POST /planes/nutricional/:idCiclo/
   *    detalle con cantidad_g y num_comida.
   * 5) Toast + analytics (metaFit_dieta_asignada) + cierre + refresco.
   * @param {Event} e - Evento submit.
   */
  const handleAsignar = async (e) => {
    e.preventDefault();
    const alimentosIds = Object.keys(selectedAlimentos);
    if (alimentosIds.length === 0) {
      showToast("Selecciona al menos un alimento", "danger");
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
        const fechaFin = new Date(Date.now()+30*86400000).toISOString().split("T")[0];
        const { data: cicloRes } = await authAxios.post("/afiliados/ciclos", {
          id_usuario: idAfiliado,
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          objetivo_fisico: a.objetivo || a.objetivo_fisico || "Mantenimiento",
          nivel_experiencia: a.nivel_experiencia || "Principiante",
          disponibilidad_dias: Number(a.disponibilidad_semanal_dias) || 5,
        });
        idCiclo = cicloRes.id_ciclo ?? cicloRes.id;
      }

      // Crear o actualizar plan nutricional
      let planExists = false;
      try {
        await authAxios.get(`/planes/nutricional/${idCiclo}`);
        planExists = true;
      } catch (getErr) {
        if (getErr.response?.status !== 404) throw getErr;
      }
      if (planExists) {
        await authAxios.patch(`/planes/nutricional/${idCiclo}`, {
          calorias_objetivo: Number(formPlan.calorias_objetivo) || 2000,
          num_comidas: Number(formPlan.num_comidas) || 3,
          observaciones: formPlan.observaciones,
        });
      } else {
        await authAxios.post("/planes/nutricional", {
          id_ciclo: idCiclo,
          calorias_objetivo: Number(formPlan.calorias_objetivo) || 2000,
          num_comidas: Number(formPlan.num_comidas) || 3,
          observaciones: formPlan.observaciones,
        });
      }

      // Agregar alimentos al detalle
      for (const idAlimento of alimentosIds) {
        const sel = selectedAlimentos[idAlimento];
        await authAxios.post(`/planes/nutricional/${idCiclo}/detalle`, {
          id_alimento: Number(idAlimento),
          cantidad_g: Number(sel.cantidad_g) || 100,
          num_comida: Number(sel.num_comida) || 1,
        });
      }

      showToast("Plan nutricional creado exitosamente", "success");
      trackEvent("metaFit_dieta_asignada", { afiliado_id: getId(a) });
      closeModal();
      fetchAfiliados();
    } catch (err) {
      console.error("[DietasView] asignar:", err);
      showToast(err.response?.data?.error || err.message || "Error al asignar dieta", "danger");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Crea o actualiza un alimento del catálogo según el modo del modal.
   * Modo "editar": PUT /catalogo/alimentos/:id con valores numéricos
   * normalizados (NaN → 0). Modo "nuevo": POST /catalogo/alimentos.
   * Toast + cierre + refresco del catálogo en ambos casos.
   * @param {Event} e - Evento submit.
   */
  const handleGuardarAlimento = async (e) => {
    e.preventDefault();
    if (!formAlimento.nombre_alimento.trim()) { showToast("El nombre es obligatorio", "danger"); return; }
    setSaving(true);
    try {
      if (modal === "editar" && modalAlimento) {
        const id = modalAlimento.id_alimento ?? modalAlimento.id;
        await authAxios.put(`/catalogo/alimentos/${id}`, {
          nombre_alimento: formAlimento.nombre_alimento,
          proteinas: Number(formAlimento.proteinas) || 0,
          carbohidratos: Number(formAlimento.carbohidratos) || 0,
          grasas: Number(formAlimento.grasas) || 0,
          calorias_por_100g: Number(formAlimento.calorias_por_100g) || 0,
        });
        showToast("Alimento actualizado", "success");
      } else {
        await authAxios.post("/catalogo/alimentos", formAlimento);
        showToast("Alimento creado", "success");
      }
      closeModal();
      fetchAlimentos();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || "Error al guardar alimento", "danger");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Elimina un alimento del catálogo.
   * DELETE /catalogo/alimentos/:id. 409 (FK) → mensaje específico: el alimento
   * está en planes activos.
   */
  const handleEliminarAlimento = async (e) => {
    e.preventDefault();
    if (!deleteAlimentoId) { showToast("Selecciona un alimento", "danger"); return; }
    setSaving(true);
    try {
      await authAxios.delete(`/catalogo/alimentos/${deleteAlimentoId}`);
      showToast("Alimento eliminado", "success");
      closeModal();
      fetchAlimentos();
    } catch (err) {
      const msg = err.response?.status === 409
        ? "No se puede eliminar: el alimento está siendo usado en planes activos"
        : (err.response?.data?.error || err.message || "Error al eliminar");
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  // ── Render helpers ──────────────────────────────────────────
  /**
   * Normaliza la forma variable de `restricciones` del afiliado (puede llegar
   * como array de strings, array de objetos, o mapa tipo->bool) a un array de
   * strings legibles para las badges.
   * @param {*} rest - Restricciones del afiliado.
   * @returns {string[]} Lista de restricciones como texto.
   */
  const formatRestricciones = (rest) => {
    if (!rest) return [];
    if (Array.isArray(rest)) {
      return rest.map((r) => {
        if (typeof r === "string") return r;
        if (r && typeof r === "object") return r.nombre_restriccion || r.tipo || "";
        return "";
      }).filter(Boolean);
    }
    if (typeof rest === "object") {
      const arr = [];
      for (const key of Object.keys(rest)) {
        const val = rest[key];
        if (val === true || val === "true") arr.push(key);
        else if (val && typeof val === "object") arr.push(val.nombre_restriccion || val.tipo || key);
      }
      return arr;
    }
    return [];
  };

  /** Renderiza las badges de restricciones (o "Ninguna") con sus colores. */
  const restriccionesBadges = (restricciones) => {
    const items = formatRestricciones(restricciones);
    if (items.length === 0) return <span className={s.badgeDark}>Ninguna</span>;
    return items.map((r, i) => {
      const cfg = RESTRICCION_COLOR[r] || { bg:"#6b728018", text:"#6b7280" };
      return <span key={i} className={s.badgeDark} style={{ background:cfg.bg, color:cfg.text, marginRight:4, marginBottom:2 }}>{r}</span>;
    });
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
            <h1 className={s.headerTitle}>🥗 Planes Nutricionales</h1>
            <p className={s.headerSub}>Gestión de planes nutricionales para afiliados</p>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button type="button" className={s.btnPrimary} onClick={() => setModal("asignar")}>➕ Asignar Dieta</button>
            <button type="button" className={s.btnOutline} onClick={() => { fetchAlimentos(); setModal("catalogo"); }}>📋 Ver Catálogo</button>
            <button type="button" className={s.btnAsignar} onClick={() => setModal("nuevo")}>➕ Agregar Alimento</button>
            <button type="button" className={s.btnOutlineDanger} onClick={() => { fetchAlimentos(); setModal("eliminar"); }}>🗑️ Eliminar Alimento</button>
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
            <div className={s.kpiLabel}>Con Plan Nutricional</div>
          </div>
          <div className={s.kpiCard}>
            <div className={s.kpiValue} style={{ color:"#ef4444" }}>{sinPlan}</div>
            <div className={s.kpiLabel}>Sin Plan Asignado</div>
          </div>
          <div className={s.kpiCard}>
            <div className={s.kpiValue} style={{ color:"#e31c25" }}>{totalAlimentos}</div>
            <div className={s.kpiLabel}>Alimentos en Catálogo</div>
          </div>
        </div>

        {/* SEARCH + TABLE */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:12,
          background:"var(--mf-surface)", border:"1px solid var(--mf-border)", borderRadius:14, padding:"0.75rem 1rem" }}>
          <span className="fw-bold" style={{ fontSize:"0.85rem", color:"var(--mf-text)" }}>🥗 Afiliados</span>
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
                  <th>Restricciones</th>
                  <th>Plan activo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && afiliados.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-4"><span className="spinner-border spinner-border-sm" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className={s.emptyState}>{search ? "No se encontraron afiliados" : "No hay afiliados registrados"}</td></tr>
                ) : filtered.map((a, idx) => {
                  const ciclo = cicloActivo(a);
                  const tienePlan = ciclo && !!ciclo.plan_nutricional;
                  const objConf = OBJETIVO_CONFIG[a.objetivo] || { icono:"🎯", color:"var(--mf-muted)", bg:"#94a3b818" };
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
                      <td>
                        <span className={s.badgeDark} style={{ background:objConf.bg, color:objConf.color }}>
                          {objConf.icono} {a.objetivo || "Sin objetivo"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:2 }}>
                          {restriccionesBadges(a.restricciones)}
                        </div>
                      </td>
                      <td>
                        {tienePlan ? (
                          <span className={s.badgeSuccess}>✅ Activo</span>
                        ) : (
                          <span className={s.badgeDanger}>❌ Sin plan</span>
                        )}
                      </td>
                      <td>
                        <div className={s.actionBtns}>
                          {tienePlan && (
                            <button type="button" className={s.btnOutline} style={{ padding:"0.25rem 0.5rem", fontSize:"0.75rem" }}
                              onClick={() => { setModalAfiliado(a); setModal("verPerfil"); }} title="Ver">👁️</button>
                          )}
                          <button type="button" className={s.btnAsignar} style={{ padding:"0.25rem 0.6rem", fontSize:"0.75rem" }}
                            onClick={() => {
                              setAsignarAfiliadoId(String(getId(a)));
                              setAsignarAfiliadoData(a);
                              handleAfiliadoSelect({ target: { value: String(getId(a)) } });
                              setModal("asignar");
                            }}>
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
      {/* MODAL: ASIGNAR DIETA                          */}
      {/* ════════════════════════════════════════════ */}
      {modal === "asignar" && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:800 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>{asignarAfiliadoData && cicloActivo(asignarAfiliadoData) ? "🔄 Nueva Dieta" : "➕ Asignar Dieta"}</h5>
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
                  <div className={s.afiliadoInfoBox}>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      <div className={s.avatarModal} style={{ background:avatarColor(nombreCompleto(asignarAfiliadoData)) }}>{inicial(asignarAfiliadoData)}</div>
                      <div>
                        <div style={{ fontWeight:600 }}>{nombreCompleto(asignarAfiliadoData)}</div>
                        <small style={{ color:"var(--mf-muted)" }}>{asignarAfiliadoData.correo||asignarAfiliadoData.email||""}{asignarAfiliadoData.objetivo ? ` · ${asignarAfiliadoData.objetivo}` : ""}</small>
                        <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
                          {restriccionesBadges(asignarAfiliadoData.restricciones)}
                        </div>
                      </div>
                    </div>
                    {cicloActivo(asignarAfiliadoData) && (
                      <div style={{ marginTop:8, color:"#22c55e", fontSize:"0.78rem" }}>
                        ✅ Ciclo activo detectado (ID: {cicloActivo(asignarAfiliadoData).id_ciclo}) — se reutilizará
                      </div>
                    )}
                    {/* Fechas y parámetros del plan */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginTop:12 }}>
                      <div>
                        <label className={s.labelText}>Calorías objetivo</label>
                        <input type="number" className={s.inputDark} value={formPlan.calorias_objetivo} onChange={(e)=>setFormPlan((f)=>({...f, calorias_objetivo:e.target.value}))} placeholder="Ej: 2000" style={{ width:"100%" }} />
                      </div>
                      <div>
                        <label className={s.labelText}>Nº de comidas</label>
                        <select className={s.selectDark} value={formPlan.num_comidas} onChange={(e)=>setFormPlan((f)=>({...f, num_comidas:e.target.value}))} style={{ width:"100%" }}>
                          {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={s.labelText}>Observaciones</label>
                        <input type="text" className={s.inputDark} value={formPlan.observaciones} onChange={(e)=>setFormPlan((f)=>({...f, observaciones:e.target.value}))} placeholder="Opcional" style={{ width:"100%" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Alimentos disponibles */}
                {asignarAfiliadoData && (
                  <>
                    <label className={s.labelText}>Alimentos disponibles ({alimentosDisponibles.length})</label>
                    {alimentosDisponibles.length === 0 ? (
                      <div className={s.emptyState}>No hay alimentos disponibles para este afiliado</div>
                    ) : (
                      <div style={{ maxHeight:350, overflowY:"auto", border:"1px solid var(--mf-border)", borderRadius:8, padding:"0.5rem", marginBottom:12 }}>
                        {alimentosDisponibles.map((al) => {
                          const id = al.id_alimento;
                          const checked = !!selectedAlimentos[id];
                          return (
                            <div key={id} className={`${s.alimentoItem} ${checked ? s.alimentoChecked : ""}`}>
                              <div className={s.alimentoRow}>
                                <input type="checkbox" className={s.checkboxDark} checked={checked} onChange={() => toggleAlimento(id)} />
                                <span className={s.alimentoName}>{al.nombre_alimento}</span>
                                <span className={s.alimentoNutrition}>
                                  P:{al.proteinas}g · C:{al.carbohidratos}g · G:{al.grasas}g · {al.calorias_por_100g} kcal/100g
                                </span>
                              </div>
                              {checked && (
                                <div className={s.formRow}>
                                  <div className={s.formGroup}>
                                    <label className={s.inlineLabel}>Gramos/comida</label>
                                    <input type="number" className={s.inlineInput} value={selectedAlimentos[id]?.cantidad_g??100} min={1}
                                      onChange={(e) => updateAlimentoSel(id, "cantidad_g", e.target.value)} />
                                  </div>
                                  <div className={s.formGroup}>
                                    <label className={s.inlineLabel}>N° Comida</label>
                                    <input type="number" className={s.inlineInput} value={selectedAlimentos[id]?.num_comida??1} min={1} max={10}
                                      onChange={(e) => updateAlimentoSel(id, "num_comida", e.target.value)} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className={s.btnConfirmar} disabled={saving || !asignarAfiliadoData || Object.keys(selectedAlimentos).length === 0}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : "✅ Crear Plan Nutricional"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: VER PERFIL                            */}
      {/* ════════════════════════════════════════════ */}
      {modal === "verPerfil" && modalAfiliado && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:700 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>👁️ Plan Nutricional: {nombreCompleto(modalAfiliado)}</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.afiliadoInfoBox}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div className={s.avatarModal} style={{ background:avatarColor(nombreCompleto(modalAfiliado)) }}>{inicial(modalAfiliado)}</div>
                  <div>
                    <div style={{ fontWeight:600 }}>{nombreCompleto(modalAfiliado)}</div>
                    <small style={{ color:"var(--mf-muted)" }}>{modalAfiliado.correo||modalAfiliado.email||""}</small>
                    <div style={{ display:"flex", gap:4, marginTop:4, flexWrap:"wrap" }}>
                      {restriccionesBadges(modalAfiliado.restricciones)}
                    </div>
                  </div>
                </div>
              </div>
              <DietaDisplay afiliado={modalAfiliado} authAxios={authAxios} />
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.btnOutline} onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: CATÁLOGO DE ALIMENTOS                 */}
      {/* ════════════════════════════════════════════ */}
      {modal === "catalogo" && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:800 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>📋 Catálogo de Alimentos</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal}>✕</button>
            </div>
            <div className={s.modalBody}>
              {catalogoAlimentos.length === 0 ? (
                <div className={s.emptyState}>No hay alimentos en el catálogo</div>
              ) : (
                <div style={{ overflowX:"auto" }}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nombre</th>
                        <th>Proteínas</th>
                        <th>Carbos</th>
                        <th>Grasas</th>
                        <th>Kcal/100g</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {catalogoAlimentos.map((al, idx) => (
                        <tr key={al.id_alimento}>
                          <td style={{ color:"var(--mf-muted)", fontSize:"0.78rem" }}>{idx + 1}</td>
                          <td style={{ fontWeight:600 }}>{al.nombre_alimento}</td>
                          <td>{al.proteinas}g</td>
                          <td>{al.carbohidratos}g</td>
                          <td>{al.grasas}g</td>
                          <td>{al.calorias_por_100g}</td>
                          <td>
                            <div className={s.actionBtns}>
                              <button type="button" className={s.btnOutline} style={{ padding:"0.2rem 0.5rem", fontSize:"0.72rem" }}
                                onClick={() => { setModalAlimento(al); setFormAlimento({ nombre_alimento:al.nombre_alimento, proteinas:String(al.proteinas), carbohidratos:String(al.carbohidratos), grasas:String(al.grasas), calorias_por_100g:String(al.calorias_por_100g) }); setModal("editar"); }}>✏️</button>
                              <button type="button" className={s.btnOutlineDanger} style={{ padding:"0.2rem 0.5rem", fontSize:"0.72rem" }}
                                onClick={() => { setDeleteAlimentoId(al.id_alimento); setModal("eliminar"); }}>🗑️</button>
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
              <button type="button" className={s.btnPrimary} onClick={() => setModal("nuevo")}>➕ Nuevo Alimento</button>
              <button type="button" className={s.btnOutline} onClick={closeModal}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: NUEVO / EDITAR ALIMENTO               */}
      {/* ════════════════════════════════════════════ */}
      {(modal === "nuevo" || modal === "editar") && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:500 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>{modal === "nuevo" ? "🥗 Nuevo Alimento" : "✏️ Editar Alimento"}</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>✕</button>
            </div>
            <form onSubmit={handleGuardarAlimento}>
              <div className={s.modalBody}>
                <div style={{ marginBottom:12 }}>
                  <label className={s.labelText}>Nombre del alimento *</label>
                  <input className={s.inputDark} value={formAlimento.nombre_alimento} onChange={(e)=>setFormAlimento((f)=>({...f, nombre_alimento:e.target.value}))} placeholder="Ej: Pechuga de pollo" required style={{ width:"100%" }} />
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  <div>
                    <label className={s.labelText}>Proteínas (g)</label>
                    <input type="number" className={s.inputDark} value={formAlimento.proteinas} onChange={(e)=>setFormAlimento((f)=>({...f, proteinas:e.target.value}))} step="0.1" style={{ width:"100%" }} />
                  </div>
                  <div>
                    <label className={s.labelText}>Carbohidratos (g)</label>
                    <input type="number" className={s.inputDark} value={formAlimento.carbohidratos} onChange={(e)=>setFormAlimento((f)=>({...f, carbohidratos:e.target.value}))} step="0.1" style={{ width:"100%" }} />
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                  <div>
                    <label className={s.labelText}>Grasas (g)</label>
                    <input type="number" className={s.inputDark} value={formAlimento.grasas} onChange={(e)=>setFormAlimento((f)=>({...f, grasas:e.target.value}))} step="0.1" style={{ width:"100%" }} />
                  </div>
                  <div>
                    <label className={s.labelText}>Calorías por 100g</label>
                    <input type="number" className={s.inputDark} value={formAlimento.calorias_por_100g} onChange={(e)=>setFormAlimento((f)=>({...f, calorias_por_100g:e.target.value}))} step="0.1" style={{ width:"100%" }} />
                  </div>
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
      {/* MODAL: ELIMINAR ALIMENTO                     */}
      {/* ════════════════════════════════════════════ */}
      {modal === "eliminar" && (
        <div className={s.modalOverlay} onClick={closeModal}>
          <div className={s.modalContent} onClick={(e)=>e.stopPropagation()} style={{ maxWidth:450 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle}>🗑️ Eliminar Alimento</h5>
              <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>✕</button>
            </div>
            <form onSubmit={handleEliminarAlimento}>
              <div className={s.modalBody}>
                <div className={s.alertDanger} style={{ marginBottom:"0.75rem", padding:"0.5rem 0.75rem", fontSize:"0.82rem" }}>⚠️ Esta acción no se puede deshacer.</div>
                {catalogoAlimentos.length === 0 ? (
                  <div className={s.emptyState}>No hay alimentos en el catálogo</div>
                ) : (
                  <>
                    <label className={s.labelText}>Seleccionar alimento</label>
                    <select className={s.selectDark} value={deleteAlimentoId} onChange={(e)=>setDeleteAlimentoId(e.target.value)} style={{ width:"100%" }}>
                      <option value="">-- Selecciona --</option>
                      {catalogoAlimentos.map((al) => (
                        <option key={al.id_alimento} value={al.id_alimento}>{al.nombre_alimento}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={closeModal} disabled={saving}>Cancelar</button>
                <button type="submit" className={s.btnDanger} disabled={saving || !deleteAlimentoId}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : "🗑️ Eliminar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ── Sub-component: DietaDisplay ──────────────────────────────
/**
 * DietaDisplay — Muestra el plan nutricional del afiliado (calorías objetivo,
 * nº de comidas, observaciones) y delega la lista de alimentos por comida a
 * <PlanDetalle/> con edición inline de cantidades.
 *
 * API calls (vía authAxios): GET /planes/nutricional/:idCiclo.
 *
 * @param {object} afiliado  - Afiliado con ciclo+plan nutricional activo.
 * @param {object} authAxios - Instancia axios autenticada del contexto.
 * @returns {JSX.Element} Tarjeta de info del plan + detalle de comidas.
 */
function DietaDisplay({ afiliado, authAxios }) {
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);

  /** Carga el plan del ciclo activo (GET /planes/nutricional/:idCiclo). */
  const cargar = async () => {
    try {
      const ciclo = cicloActivo(afiliado);
      if (!ciclo) { setError("Sin ciclo activo"); return; }
      const idCiclo = ciclo.id_ciclo ?? ciclo.id;
      const { data } = await authAxios.get(`/planes/nutricional/${idCiclo}`);
      setPlan(data);
      setError(null);
    } catch (err) {
      console.error("[DietasView] ver plan:", err);
      setError(err.response?.status === 404 ? "No tiene plan nutricional" : "Error al cargar plan");
    }
  };

  /** Carga el plan al montar el modal (o al cambiar de afiliado). */
  useEffect(() => { cargar(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [afiliado]);

  if (error) return <div className={s.emptyState}>{error}</div>;
  if (!plan) return <div className={s.emptyState}>Cargando plan...</div>;

  return (
    <>
      <div style={{ textAlign:"right", marginBottom:8 }}>
        <button type="button" className={s.btnRefresh} onClick={cargar} title="Recargar">🔄</button>
      </div>
      <div className={s.infoCard} style={{ marginBottom:"1rem" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
          <div>
            <small style={{ color:"var(--mf-muted)", fontSize:"0.72rem" }}>Calorías objetivo</small>
            <div style={{ fontWeight:600 }}>{plan.calorias_objetivo || "—"} kcal</div>
          </div>
          <div>
            <small style={{ color:"var(--mf-muted)", fontSize:"0.72rem" }}>Comidas / día</small>
            <div style={{ fontWeight:600 }}>{plan.num_comidas || "—"}</div>
          </div>
          {plan.observaciones && (
            <div style={{ gridColumn:"1/-1" }}>
              <small style={{ color:"var(--mf-muted)", fontSize:"0.72rem" }}>Observaciones</small>
              <div style={{ fontSize:"0.85rem" }}>{plan.observaciones}</div>
            </div>
          )}
        </div>
      </div>

      {Array.isArray(plan.detalle) && plan.detalle.length > 0 ? (
        <PlanDetalle detalle={plan.detalle} numComidas={plan.num_comidas} idCiclo={plan.id_ciclo} authAxios={authAxios} onCambio={cargar} />
      ) : (
        <div className={s.emptyState}>Este plan no tiene alimentos asignados</div>
      )}
    </>
  );
}

/**
 * PlanDetalle — Lista los alimentos del plan agrupados por comida (#1…N) con
 * edición inline de la cantidad en gramos.
 *
 * "💾 Guardar" → PATCH /planes/nutricional/:idCiclo/detalle/:id_alimento
 * "🗑️ Quitar"  → DELETE /planes/nutricional/:idCiclo/detalle/:id_alimento
 * Ambos disparan el evento window 'dieta-modificada' y llaman onCambio()
 * para que el padre recargue el plan.
 *
 * @param {object[]} detalle     - Detalle de alimentos del plan.
 * @param {number}   numComidas  - Nº de comidas del plan (información).
 * @param {number}   idCiclo     - Ciclo dueño del plan.
 * @param {object}   authAxios   - Instancia axios autenticada.
 * @param {Function} onCambio    - Callback de refresco (cargar del padre).
 * @returns {JSX.Element[]} Tarjetas "Comida #N" con cada alimento editable.
 */
function PlanDetalle({ detalle, numComidas, idCiclo, authAxios, onCambio }) {
  const { showToast } = useToast();
  const [edits, setEdits] = useState({});
  const [savingKey, setSavingKey] = useState(null);

  // Agrupa los alimentos por num_comida preservando el orden del backend.
  const grouped = {};
  for (const d of detalle) {
    const key = d.num_comida || 1;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(d);
  }
  const keys = Object.keys(grouped).sort((a, b) => Number(a) - Number(b));

  /** Clave única "nºcomida:id_alimento" para ediciones y savingKey. */
  const clave = (d) => `${d.num_comida || 1}:${d.id_alimento}`;

  /**
   * Persiste la nueva cantidad de un alimento. PATCH /planes/nutricional/
   * :idCiclo/detalle/:id_alimento con cantidad_gramos y el nº de comida (se
   * envía num_comida_anterior para el UPSERT correcto). Toast + cierre de la
   * edición + evento "dieta-modificada" + refresco del padre.
   * @param {object} d - Alimento del detalle (lleva id_alimento y num_comida).
   */
  const guardar = async (d) => {
    const key = clave(d);
    const cantidad = edits[key];
    if (cantidad === undefined || cantidad === "") return;
    setSavingKey(key);
    try {
      await authAxios.patch(`/planes/nutricional/${idCiclo}/detalle/${d.id_alimento}`, {
        cantidad_gramos: Number(cantidad),
        num_comida: Number(d.num_comida),
        num_comida_anterior: Number(d.num_comida),
      });
      showToast("Cantidad actualizada", "success");
      setEdits((prev) => { const c = { ...prev }; delete c[key]; return c; });
      window.dispatchEvent(new Event("dieta-modificada"));
      if (onCambio) onCambio();
    } catch (err) {
      console.error("[DietasView] actualizar detalle:", err);
      showToast(err.response?.data?.error || err.message || "Error al actualizar cantidad", "danger");
    } finally {
      setSavingKey(null);
    }
  };

  /**
   * Quita un alimento del plan (con confirmación). DELETE /planes/nutricional/
   * :idCiclo/detalle/:id_alimento enviando num_comida en el body.
   * @param {object} d - Alimento del detalle a quitar.
   */
  const quitar = async (d) => {
    const key = clave(d);
    if (!window.confirm(`¿Quitar "${d.nombre_alimento}" de la comida ${d.num_comida}?`)) return;
    setSavingKey(key);
    try {
      await authAxios.delete(`/planes/nutricional/${idCiclo}/detalle/${d.id_alimento}`, { data: { num_comida: Number(d.num_comida) } });
      showToast("Alimento eliminado del plan", "success");
      window.dispatchEvent(new Event("dieta-modificada"));
      if (onCambio) onCambio();
    } catch (err) {
      console.error("[DietasView] quitar detalle:", err);
      showToast(err.response?.data?.error || err.message || "Error al eliminar alimento", "danger");
    } finally {
      setSavingKey(null);
    }
  };

  return keys.map((key) => (
    <div key={key} className={s.infoCard} style={{ marginBottom:"0.5rem" }}>
      <div style={{ fontWeight:600, fontSize:"0.85rem", marginBottom:"0.25rem", color:"#e31c25" }}>
        🍽️ Comida #{key}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
        {grouped[key].map((d, i) => {
          const k = clave(d);
          const valor = Object.prototype.hasOwnProperty.call(edits, k) ? edits[k] : (d.cantidad_g ?? "");
          const guardando = savingKey === k;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.82rem", flexWrap:"wrap" }}>
              <span style={{ flex:1, minWidth:140 }}>{d.nombre_alimento || "Alimento"}</span>
              <input
                type="number" min={1} step="1" className={s.inlineInput} style={{ width:80 }}
                value={valor}
                onChange={(e) => setEdits((prev) => ({ ...prev, [k]: e.target.value }))}
              />
              <span style={{ color:"var(--mf-muted)" }}>g</span>
              <button type="button" className={s.btnConfirmarS} style={{ padding:"0.2rem 0.45rem", fontSize:"0.7rem" }} disabled={guardando || valor === ""} onClick={() => guardar(d)}>
                {guardando ? <span className="spinner-border spinner-border-sm" /> : "💾 Guardar"}
              </button>
              <button type="button" className={s.btnOutlineS} style={{ padding:"0.2rem 0.45rem", fontSize:"0.7rem" }} disabled={guardando} onClick={() => quitar(d)}>🗑️ Quitar</button>
            </div>
          );
        })}
      </div>
    </div>
  ));
}
