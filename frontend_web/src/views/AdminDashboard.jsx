// frontend_web/src/views/AdminDashboard.jsx
// ─── Vista Dashboard General (rol Administrador) ─────────────
// Panel principal de la web staff. Muestra los KPIs del gimnasio (afiliados,
// ciclos, restricciones, ingresos, pagos), la configuración del precio de
// membresía, gráficas Chart.js (objetivos, evolución, restricciones, niveles)
// y una tabla de afiliados con búsqueda.
//
// Qué rol lo usa: SOLO Administrador (la ruta está protegida con requireAdmin
// en el frontend; el backend la refuerza con requireAdmin).
// API calls (vía authAxios):
//   · fetchKpis()        → GET /dashboard/kpis            (useDashboard)
//   · fetchAfiliados()   → GET /afiliados                 (useAfiliados)
//   · cargarPrecio()     → GET /configuracion/precio-membresia
//   · handleGuardarPrecio() → PUT /configuracion/precio-membresia
//
// Estado que maneja: kpis, lista de afiliados, búsqueda de la tabla, y el
// bloque de precio (precio, editPrecio, nuevoPrecio, guardando).
import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { useAfiliados } from "../hooks/useAfiliados";
import { useToast } from "../hooks/useToast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import styles from "./AdminDashboard.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

/** Lee el valor de una variable CSS del :root (--mf-*) para darle color a los
 *  gráficos (texto, bordes, fondos de tooltips) sin repetir colores hardcode. */
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
// Aplica a TODOS los gráficos de la app el color de texto/borde del tema.
ChartJS.defaults.color = cssVar("--mf-muted");
ChartJS.defaults.borderColor = cssVar("--mf-border");

// Helper de identidad de un afiliado: acepta los distintos nombres de id que
// puede devolver el backend (id_usuario / _id / id).
const getId          = (doc) => doc.id_usuario ?? doc._id ?? doc.id;
/** Concatena nombres+apellidos con fallback si faltan. */
const nombreCompleto = (a)   => [a.nombres, a.apellidos].filter(Boolean).join(" ") || "Sin nombre";
/** Primera letra del nombre (o del correo) para el avatar por inicial. */
const inicial        = (a)   => (a.nombres || a.correo || "?")[0].toUpperCase();
/** Ciclo activo del afiliado (o null si no tiene) tal como lo arma el backend. */
const cicloActivo    = (a)   => a.ciclo_activo || null;

/** Config visual de cada objetivo físico (ícono + color + fondo) para las
 *  tarjetas de distribución. Es la paleta de consistencia del dashboard. */
const OBJETIVO_CONFIG = {
  "Perdida de grasa": { icono: "🔥", color: "#e94560", bg: "#e9456022" },
  "Aumento de masa":  { icono: "💪", color: "#0d6efd", bg: "#0d6efd22" },
  "Mantenimiento":    { icono: "⚖️", color: "#198754", bg: "#19875422" },
};

/** Nombres de los objetivos (las claves de OBJETIVO_CONFIG), usados para
 *  recorrerlos en los gráficos y en el conteo por objetivo. */
const OBJETIVOS = Object.keys(OBJETIVO_CONFIG);

/**
 * Píldora de estado del afiliado (Activo/Inactivo/Pendiente) con colores por
 * estado. Renderiza solo presentación; no dispara llamadas a la API.
 * @param {string} e - Estado textual (se normaliza a minúsculas para el lookup).
 * @returns {JSX.Element} Badge con el color semántico del estado.
 */
const badgeEstado = (e) => {
  const map = { activo: {bg:"rgba(34,197,94,0.15)",color:"#22c55e"}, inactivo: {bg:"rgba(239,68,68,0.15)",color:"#ef4444"}, pendiente: {bg:"rgba(234,179,8,0.15)",color:"#eab308"} };
  const c   = map[(e || "").toLowerCase()] || {bg:"rgba(148,163,184,0.15)",color:cssVar("--mf-muted")};
  return <span className={`${styles.badgeEstado}`} style={{background:c.bg,color:c.color,padding:"0.25rem 0.6rem",borderRadius:"6px"}}>{e || "—"}</span>;
};
/** Píldora de nivel del afiliado (Principiante/Intermedio/Avanzado). Solo UI. */
const badgeNivel = (n) => {
  const map = { principiante: {bg:"rgba(227, 28, 37, 0.15)",color:cssVar("--mf-accent")}, intermedio: {bg:"rgba(59,130,246,0.15)",color:"#60a5fa"}, avanzado: {bg:"rgba(239,68,68,0.15)",color:"#f87171"} };
  const c   = map[(n || "").toLowerCase()] || {bg:"rgba(148,163,184,0.15)",color:cssVar("--mf-muted")};
  return <span className={`${styles.badgeEstado}`} style={{background:c.bg,color:c.color,padding:"0.25rem 0.6rem",borderRadius:"6px"}}>{n || "—"}</span>;
};

/**
 * AdminDashboard — Vista principal del panel del Administrador.
 *
 * Renderiza: KPIs globales, tarjetas de distribución por objetivo, editor del
 * precio de membresía, 4 gráficas Chart.js y la tabla de afiliados filtrable.
 *
 * Estado que maneja: usa los hooks useDashboard (kpis/loading/error),
 * useAfiliados (lista/loading/error), useToast (notificaciones) y estado local
 * para la búsqueda y el bloque de precio.
 *
 * API calls: fetchKpis (GET /dashboard/kpis), fetchAfiliados (GET /afiliados),
 * cargarPrecio (GET /configuracion/precio-membresia), handleGuardarPrecio
 * (PUT /configuracion/precio-membresia). Además refresca los KPIs y la lista
 * escuchando eventos window ("pago-registrado", "afiliado-modificado",
 * "personal-modificado") para que el dashboard se actualice en vivo cuando
 * otras vistas del staff cambian datos.
 *
 * @param {Object} _props - Componente de ruta sin props externas.
 * @returns {JSX.Element} El layout de la app con el contenido del dashboard.
 */
export default function AdminDashboard() {
  const { authAxios } = useAuth();
  const { kpis, loading: loadingKpis, error: errorKpis, fetchKpis } = useDashboard();
  const { afiliados, loading: loadingAfil, error: errorAfil, fetchAfiliados } = useAfiliados();
  const { toast, showToast } = useToast();

  const loading = loadingKpis || loadingAfil;
  const error   = errorKpis   || errorAfil;

  const [busqueda, setBusqueda] = useState("");

  // KPIs con fallback a la lista de afiliados cuando el endpoint aún no llegó
  // (así las tarjetas no quedan en 0 un frame al montar).
  const totalAfiliados   = kpis?.total_afiliados   ?? afiliados.length;
  const totalActivos     = kpis?.afiliados_activos  ?? 0;
  const conCicloActivo   = kpis?.ciclos_en_curso    ?? 0;
  const conRestricciones = kpis?.con_restricciones  ?? 0;
  const ingresos         = kpis?.ingresos           ?? 0;
  const pagosRegistrados = kpis?.pagos_registrados  ?? 0;

  // ── Chart data computations ──────────────────────────────────────────

  // Colores del gráfico de barras por objetivo (amplía OBJETIVO_CONFIG con
  // sinónimos que puede devolver el backend: "Perder peso", "Ganar masa muscular").
  const objetivoColors = {
    "Perdida de grasa": "#e94560",
    "Perder peso": "#e94560",
    "Aumento de masa": "#4b9ecb",
    "Ganar masa muscular": "#4b9ecb",
    Mantenimiento: "#22c55e",
  };

  /**
   * Datos del gráfico de distribución por objetivo. Si el backend devolvió
   * kpis.por_objetivo (agrupación oficial en SQL) se usa esa; si no, se calcula
   * en cliente contando afiliados por objetivo. useMemo: recalcula solo cuando
   * cambian kpis o la lista de afiliados, no en cada render.
   */
  const porObjetivo = useMemo(() => {
    if (kpis?.por_objetivo?.length) return kpis.por_objetivo;
    return OBJETIVOS.map((obj) => ({
      objetivo: obj,
      cantidad: afiliados.filter((a) => a.objetivo_fisico === obj).length,
    }));
  }, [kpis, afiliados]);

  /** Config de dataset del <Bar> de objetivos; derivada de porObjetivo. */
  const barObjetivoData = useMemo(() => ({
    labels: porObjetivo.map((o) => o.objetivo),
    datasets: [{
      label: "Afiliados",
      data: porObjetivo.map((o) => o.cantidad),
      backgroundColor: porObjetivo.map((o) => objetivoColors[o.objetivo] || "#4b9ecb"),
      borderRadius: 6,
      borderSkipped: false,
    }],
  }), [porObjetivo]);

  const barObjetivoOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: cssVar("--mf-surface"),
        titleColor: cssVar("--mf-text"),
        bodyColor: cssVar("--mf-muted"),
        borderColor: cssVar("--mf-border"),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: cssVar("--mf-border") },
        ticks: { color: cssVar("--mf-muted"), font: { size: 11 } },
      },
      y: {
        grid: { color: cssVar("--mf-border") },
        ticks: { color: cssVar("--mf-muted"), font: { size: 11 }, stepSize: 1 },
      },
    },
  };

  /**
   * Serie temporal de afiliados por mes para el gráfico de línea: genera los
   * últimos 6 meses (enero→dic) y cuenta cuántos afiliados se registraron en
   * cada uno según fecha_registro. useMemo: dependencia [afiliados], se
   * recalcula solo cuando cambia la lista.
   */
  const evolucion = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: d.toLocaleDateString("es-CO", { month: "short", year: "2-digit" }),
      });
    }
    return months.map((m) => ({
      label: m.label,
      count: afiliados.filter((a) => {
        if (!a.fecha_registro) return false;
        const reg = new Date(a.fecha_registro);
        return reg.getFullYear() === m.year && reg.getMonth() === m.month;
      }).length,
    }));
  }, [afiliados]);

  /** Config del dataset del <Line> de evolución; derivada de `evolucion`. */
  const lineData = useMemo(() => ({
    labels: evolucion.map((e) => e.label),
    datasets: [{
      label: "Activos",
      data: evolucion.map((e) => e.count),
      borderColor: "#4b9ecb",
      backgroundColor: "rgba(75,158,203,0.1)",
      fill: true,
      tension: 0.4,
      pointBackgroundColor: "#4b9ecb",
      pointBorderColor: cssVar("--mf-bg"),
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 7,
    }],
  }), [evolucion]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: cssVar("--mf-surface"),
        titleColor: cssVar("--mf-text"),
        bodyColor: cssVar("--mf-muted"),
        borderColor: cssVar("--mf-border"),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: cssVar("--mf-muted"), font: { size: 11 } },
      },
      y: {
        grid: { color: cssVar("--mf-border") },
        ticks: { color: cssVar("--mf-muted"), font: { size: 11 }, stepSize: 1 },
        beginAtZero: true,
      },
    },
  };

  const sinRestricciones = totalAfiliados - conRestricciones;
  /** Dataset del <Doughnut> de restricciones (verde con / amarillo sin). */
  const doughnutData = useMemo(() => ({
    labels: ["Sin restricciones", "Con restricciones"],
    datasets: [{
      data: [sinRestricciones, conRestricciones],
      backgroundColor: ["#22c55e", "#eab308"],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }), [sinRestricciones, conRestricciones]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: cssVar("--mf-muted"), padding: 16, usePointStyle: true, font: { size: 11 } },
      },
      tooltip: {
        backgroundColor: cssVar("--mf-surface"),
        titleColor: cssVar("--mf-text"),
        bodyColor: cssVar("--mf-muted"),
        borderColor: cssVar("--mf-border"),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  /** Plugin local de Chart.js: dibuja el NÚMERO TOTAL en el centro del donut
   *  (beforeDraw) con el texto "Total" debajo. Las opciones del gráfico están
   *  hardcodeadas aquí y no en ChartJS.plugins para no contaminar otros canvas. */
  const centerTextPlugin = {
    id: "centerText",
    beforeDraw(chart) {
      const { width, height, ctx } = chart;
      ctx.save();
      const total = chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = cssVar("--mf-text");
      ctx.fillText(total, width / 2, height / 2 - 8);
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillStyle = cssVar("--mf-muted");
      ctx.fillText("Total", width / 2, height / 2 + 16);
      ctx.restore();
    },
  };

  const niveles = ["Principiante", "Intermedio", "Avanzado"];
  const nivelColors = { Principiante: "#22c55e", Intermedio: "#4b9ecb", Avanzado: "#e31c25" };
  /**
   * Conteo de afiliados por nivel de experiencia (barra horizontal "Ciclos
   * Activos por Nivel"). Se normaliza a minúsculas para el lookup porque el
   * backend puede devolver variantes de mayúsculas. useMemo dependiente de
   * [afiliados].
   */
  const ciclosPorNivel = useMemo(() => {
    const counts = { Principiante: 0, Intermedio: 0, Avanzado: 0 };
    afiliados.forEach((a) => {
      const key = (a.nivel_experiencia || "").toLowerCase();
      if (key === "principiante") counts.Principiante++;
      else if (key === "intermedio") counts.Intermedio++;
      else if (key === "avanzado") counts.Avanzado++;
    });
    return niveles.map((n) => counts[n]);
  }, [afiliados]);

  /** Dataset + opciones de la barra horizontal de niveles (indexAxis: 'y'). */
  const hBarData = useMemo(() => ({
    labels: niveles,
    datasets: [{
      label: "Ciclos activos",
      data: ciclosPorNivel,
      backgroundColor: niveles.map((n) => nivelColors[n]),
      borderRadius: 6,
      borderSkipped: false,
    }],
  }), [ciclosPorNivel]);

  const hBarOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: cssVar("--mf-surface"),
        titleColor: cssVar("--mf-text"),
        bodyColor: cssVar("--mf-muted"),
        borderColor: cssVar("--mf-border"),
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: cssVar("--mf-border") },
        ticks: { color: cssVar("--mf-muted"), font: { size: 11 }, stepSize: 1 },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { color: cssVar("--mf-text"), font: { size: 12, weight: "600" } },
      },
    },
  };

  // ── Precio de membresía ──────────────────────────────────────────
  // Estado del bloque de configuración: valor actual mostrado, modo edición,
  // input del nuevo precio y bandera de "guardando" para deshabilitar botones.
  const [precio, setPrecio] = useState(80000);
  const [editPrecio, setEditPrecio] = useState(false);
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);

  /**
   * Carga inicial del dashboard: trae KPIs y la lista de afiliados al montar.
   * Dependencias [fetchKpis, fetchAfiliados]: ambos callbacks vienen envueltos
   * en useCallback dentro de sus hooks, así que son estables y el efecto NO se
   * re-dispara en cada render.
   */
  useEffect(() => {
    fetchKpis();
    fetchAfiliados();
  }, [fetchKpis, fetchAfiliados]);

  /**
   * Suscripción a eventos de actualización en vivo del dashboard:
   *   · window "pago-registrado" / "afiliado-modificado" / "personal-modificado"
   *     → refresca KPIs y afiliados (otras vistas del staff los emiten).
   *   · document "visibilitychange" → al volver a la pestaña se refresca para
   *     no mostrar datos viejos.
   * El cleanup remueve los listeners al desmontar (evita leaks en SPA).
   */
  useEffect(() => {
    const refresh = () => { fetchKpis(); fetchAfiliados(); };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("pago-registrado", refresh);
    window.addEventListener("afiliado-modificado", refresh);
    window.addEventListener("personal-modificado", refresh);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pago-registrado", refresh);
      window.removeEventListener("afiliado-modificado", refresh);
      window.removeEventListener("personal-modificado", refresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchKpis, fetchAfiliados]);

  /**
   * Carga el precio de membresía configurado en el backend.
   * GET /configuracion/precio-membresia (solo Admin) → si responde con
   * { valor } actualiza el estado local. Un error no bloquea la vista: se loguea
   * y se mantiene el valor por defecto (80.000). useCallback por [authAxios]
   * (instancia estable) para poder usarlo en el useEffect de abajo.
   */
  const cargarPrecio = useCallback(async () => {
    try {
      const { data } = await authAxios.get("/configuracion/precio-membresia");
      if (data.valor) setPrecio(Number(data.valor));
    } catch (err) {
      console.error("[AdminDashboard] Error al cargar precio:", err);
    }
  }, [authAxios]);

  /** Al montar, carga el precio desde el backend (una sola vez). */
  useEffect(() => {
    cargarPrecio();
  }, [cargarPrecio]);

  /**
   * Guarda el nuevo precio de membresía.
   * Flujo completo: 1) valida que sea un entero > 0 (si no, toast de danger);
   * 2) PUT /configuracion/precio-membresia { valor } con bandera guardando
   * activa; 3) si OK, actualiza el precio local, cierra el modo edición, muestra
   * el toast de éxito y refresca los KPIs (el precio incide en las proyecciones);
   * 4) en error muestra el mensaje del backend (o uno genérico). Siempre limpia
   * guardando en finally.
   */
  const handleGuardarPrecio = async () => {
    const val = parseInt(nuevoPrecio, 10);
    if (isNaN(val) || val <= 0) {
      showToast("Ingresa un precio valido", "danger");
      return;
    }
    setGuardando(true);
    try {
      await authAxios.put("/configuracion/precio-membresia", { valor: val });
      setPrecio(val);
      setEditPrecio(false);
      showToast(`Precio de membresia actualizado a $${val.toLocaleString("es-CO")} COP`);
      fetchKpis();
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al guardar";
      showToast(msg, "danger");
    } finally {
      setGuardando(false);
    }
  };

  /** Filtro de la tabla por nombre, correo u objetivo, según la búsqueda escrita. */
  const filtrados = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return nombreCompleto(a).toLowerCase().includes(t) ||
           (a.correo || "").toLowerCase().includes(t)  ||
           (a.objetivo_fisico || "").toLowerCase().includes(t);
  });

  const precioFormateado = `$${precio.toLocaleString("es-CO")}`;
  const ingresosFormateado = `$${Number(ingresos).toLocaleString("es-CO")}`;

  /** Conteo por objetivo con ícono/color, para las tarjetas de la derecha. */
  const conteoPorObj = OBJETIVOS.map((obj) => ({
    objetivo: obj, cantidad: afiliados.filter((a) => a.objetivo_fisico === obj).length,
    ...OBJETIVO_CONFIG[obj],
  }));

  return (
    <AppLayout>
      {toast.msg && (
        <div className={`position-fixed bottom-0 end-0 m-4 alert shadow-lg py-2 px-3 ${styles.toast}`}
          style={{ borderLeft: toast.type === "danger" ? "4px solid #ef4444" : "4px solid #4b9ecb", background: cssVar("--mf-surface"), color: cssVar("--mf-text"), borderColor: cssVar("--mf-border") }}>
          {toast.msg}
        </div>
      )}

      <div className={`container-fluid py-4 px-3 px-md-4 ${styles.page}`}>

        {/* Título */}
        <div className="mb-4">
          <h1 className={`h4 fw-bold mb-0 d-flex align-items-center gap-2 ${styles.sectionTitle}`}>
            <span className={`d-inline-flex align-items-center justify-content-center ${styles.headerIcon}`}>📊</span>
            Dashboard General
          </h1>
          <small className={styles.headerSub}>Vista completa · solo Administrador</small>
        </div>

        {/* KPIs */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Afiliados",   valor: totalAfiliados,  icono: "👥", color: "#4b9ecb" },
            { label: "Activos",           valor: totalActivos,    icono: "✅",    color: "#22c55e" },
            { label: "Ciclos en curso",   valor: conCicloActivo,  icono: "🔄",    color: "#7ab7d9" },
            { label: "Con restricciones", valor: conRestricciones,icono: "⚠️",   color: "#eab308" },
            { label: "Ingresos",          valor: ingresosFormateado, icono: "💰", color: "#ef4444" },
            { label: "Pagos registrados", valor: pagosRegistrados, icono: "🧾", color: "#22d3ee" },
          ].map((kpi) => (
            <div key={kpi.label} className="col-6 col-md-4 col-lg-2">
              <div className={`h-100 ${styles.kpiCard}`}>
                <div className={`d-flex align-items-center gap-3 ${styles.kpiCardBody}`}>
                  <div className={styles.kpiIconWrap} style={{ background: kpi.color + "22" }}>
                    {kpi.icono}
                  </div>
                  <div>
                    <div className={styles.kpiValor} style={{ color: kpi.color, fontSize: kpi.label === "Ingresos" ? "1rem" : "1.5rem" }}>
                      {loading ? <span className={`spinner-border spinner-border-sm ${styles.spinnerBrand}`} /> : kpi.valor}
                    </div>
                    <small className={styles.kpiLabel}>{kpi.label}</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Configuracion: Precio de Membresia ── */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className={`h-100 ${styles.cardDark}`}>
              <div className={styles.cardDarkBody}>
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className={`fw-bold mb-0 ${styles.sectionTitle}`}>💳 Precio de Membresía</h6>
                  {!editPrecio && (
                    <button type="button" className={`${styles.btnOutline}`} onClick={() => { setNuevoPrecio(String(precio)); setEditPrecio(true); }}>
                      ✏️ Editar
                    </button>
                  )}
                </div>
                {editPrecio ? (
                  <div className="d-flex gap-2 align-items-center">
                    <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
                      <span className={`input-group-text ${styles.inputGroupText}`}>$</span>
                      <input type="number" className={`form-control ${styles.inputDark}`} min={1000} step={1000}
                        value={nuevoPrecio}
                        onChange={(e) => setNuevoPrecio(e.target.value)} />
                      <span className={`input-group-text ${styles.inputGroupText}`}>COP</span>
                    </div>
                    <button type="button" className={`${styles.btnPrimary}`} onClick={handleGuardarPrecio} disabled={guardando} style={{fontSize:"0.78rem"}}>
                      {guardando ? <span className="spinner-border spinner-border-sm" /> : "💾 Guardar"}
                    </button>
                    <button type="button" className={`${styles.btnOutline}`} onClick={() => setEditPrecio(false)} disabled={guardando}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className={styles.precioValor}>
                      {loading ? <span className={`spinner-border spinner-border-sm ${styles.spinnerBrand}`} /> : precioFormateado}
                    </span>
                    <small className={styles.precioInfo}> COP / mes</small>
                    <div className={styles.precioInfo} style={{marginTop:"0.25rem"}}>
                      {totalActivos} afiliados activos × {precioFormateado} = <strong style={{color:cssVar("--mf-accent")}}>${(totalActivos * precio).toLocaleString("es-CO")} COP</strong> / mes
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Distribución por objetivo */}
          <div className="col-12 col-md-6">
            <h6 className={`fw-bold mb-3 ${styles.sectionTitle}`}>🎯 Distribución por Objetivo Físico</h6>
            <div className="row g-2">
              {conteoPorObj.map((obj) => (
                <div key={obj.objetivo} className="col-12 col-sm-4">
                  <div className={`h-100 ${styles.objCard}`} style={{ borderLeft: `4px solid ${obj.color}` }}>
                    <div className={styles.objCardBody}>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fs-1">{obj.icono}</span>
                        <div className={styles.objCountWrap} style={{ background: obj.bg, color: obj.color }}>
                          {loading ? <span className={`spinner-border spinner-border-sm ${styles.spinnerBrand}`} /> : obj.cantidad}
                        </div>
                      </div>
                      <div className={styles.objTitle} style={{ color: obj.color }}>{obj.objetivo}</div>
                      <div className={`mt-2 ${styles.progressTrack}`}>
                        <div className={styles.progressBar}
                          style={{ width: afiliados.length > 0 ? `${(obj.cantidad / afiliados.length) * 100}%` : "0%", background: obj.color }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 📊 Gráficas */}
        {loading || !kpis || !afiliados.length ? (
          <div className="row g-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="col-12 col-md-6">
                <div className={styles.chartCard}>
                  <div className="text-center py-5">
                    <div className={`spinner-border ${styles.spinnerBrand}`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6">
              <div className={styles.chartCard}>
                <h6 className={styles.chartTitle}>📊 Distribución por Objetivo</h6>
                <Bar key={JSON.stringify(barObjetivoData.datasets[0].data)} data={barObjetivoData} options={barObjetivoOptions} />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className={styles.chartCard}>
                <h6 className={styles.chartTitle}>📈 Evolución de Afiliados</h6>
                <Line key={JSON.stringify(lineData.datasets[0].data)} data={lineData} options={lineOptions} />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className={styles.chartCard}>
                <h6 className={styles.chartTitle}>⚠️ Afiliados con Restricciones</h6>
                <div className={styles.doughnutWrapper}>
                <Doughnut key={doughnutData.datasets[0].data.join(",")} data={doughnutData} options={doughnutOptions} plugins={[centerTextPlugin]} />
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className={styles.chartCard}>
              <h6 className={styles.chartTitle}>🔄 Ciclos Activos por Nivel</h6>
              <Bar key={JSON.stringify(hBarData.datasets[0].data)} data={hBarData} options={hBarOptions} />
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h2 className={`h5 fw-bold mb-0 ${styles.sectionTitle}`}>👥 Afiliados</h2>
            <input type="text" id="busqueda-dashboard" className={`form-control form-control-sm ${styles.searchInput}`}
              placeholder="🔍 Buscar..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className={styles.tableWrap}>
            {error && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
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
                      <th className="text-center">Ciclo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr><td colSpan={6} className={`text-center py-5 ${styles.emptyState}`}>Sin resultados.</td></tr>
                    ) : filtrados.map((a, i) => {
                      const ciclo = cicloActivo(a);
                      return (
                        <tr key={getId(a)}>
                          <td style={{paddingLeft:"1.25rem"}} className={styles.emptyState}>{i + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={styles.avatarTd}
                                style={{ background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small" style={{color:cssVar("--mf-text")}}>{nombreCompleto(a)}</div>
                                <div className={styles.emailSm}>{a.correo}</div>
                              </div>
                            </div>
                          </td>
                          <td><small style={{color:cssVar("--mf-muted")}}>{OBJETIVO_CONFIG[a.objetivo_fisico]?.icono} {a.objetivo_fisico || "—"}</small></td>
                          <td>{badgeNivel(a.nivel_experiencia)}</td>
                          <td className="text-center">
                            {ciclo
                              ? <span className={styles.badgeCiclo} style={{padding:"0.25rem 0.6rem",borderRadius:"6px",fontSize:"0.72rem"}}>Ciclo {ciclo.numero_ciclo}</span>
                              : <span className={styles.emptyState} style={{fontSize:"0.85rem"}}>—</span>}
                          </td>
                          <td>{badgeEstado(a.estado)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && (
              <div className={styles.tableCardFooter}>
                  {filtrados.length} de {totalAfiliados} afiliados
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
