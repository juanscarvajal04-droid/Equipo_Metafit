import { useCallback, useEffect, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import styles from "./FinanzasView.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels);

const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MAX_RECEP = 5;

const formatter = (n) => "$" + Number(n).toLocaleString("es-CO");

const ESTADO_CONFIG = {
  Pagado:    { icono: "✅", color: "#22c55e" },
  Pendiente: { icono: "⏳", color: "#eab308" },
  Vencido:   { icono: "❌", color: "#ef4444" },
};

const badgeEstado = (e) => {
  const cfg = ESTADO_CONFIG[e] || { icono: "❓", color: "#888" };
  return (
    <span style={{ color: cfg.color, fontWeight: 600, fontSize: "0.78rem" }}>
      {cfg.icono} {e}
    </span>
  );
};

const avatarColor = (nombre) => {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
};

const inicial = (n) => (n || "?").charAt(0).toUpperCase();

export default function FinanzasView() {
  const { authAxios } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recepcionistas, setRecepcionistas] = useState([]);
  const [filtros, setFiltros] = useState({ fecha_inicio: "", fecha_fin: "", id_recepcionista: "" });
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchMetricas = useCallback(async (f = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.fecha_inicio) params.set("fecha_inicio", f.fecha_inicio);
      if (f.fecha_fin) params.set("fecha_fin", f.fecha_fin);
      if (f.id_recepcionista) params.set("id_recepcionista", f.id_recepcionista);
      const qs = params.toString();
      const url = qs ? `/pagos/metricas?${qs}` : "/pagos/metricas";
      const { data: m } = await authAxios.get(url);
      setData(m);
    } catch (err) {
      console.error("[FinanzasView]", err);
    } finally {
      setLoading(false);
    }
  }, [authAxios]);

  useEffect(() => {
    (async () => {
      try {
        const { data: rec } = await authAxios.get("/usuarios/recepcionistas");
        setRecepcionistas(rec);
      } catch { /* ignore */ }
    })();
    fetchMetricas({});
  }, [fetchMetricas]);

  const handleFiltrar = () => {
    fetchMetricas(filtros);
  };

  const handleLimpiar = () => {
    setFiltros({ fecha_inicio: "", fecha_fin: "", id_recepcionista: "" });
    fetchMetricas({});
  };

  const exportPDF = async () => {
    if (!data) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      await import("jspdf-autotable");
      const doc = new jsPDF();
      const { ultimos_pagos, total_recaudado } = data;
      const periodo = filtros.fecha_inicio || filtros.fecha_fin
        ? `Periodo: ${filtros.fecha_inicio || "—"} a ${filtros.fecha_fin || "—"}`
        : "Periodo: Todo";
      const hoy = new Date().toLocaleDateString("es-CO");

      doc.setFontSize(16);
      doc.text("MetaFit – Reporte de Finanzas", 14, 20);
      doc.setFontSize(10);
      doc.text(periodo, 14, 28);
      doc.text(`Generado: ${hoy}`, 14, 34);

      const rows = ultimos_pagos.map((p) => [
        `${p.nombres_afiliado} ${p.apellidos_afiliado}`,
        new Date(p.fecha_pago).toLocaleDateString("es-CO"),
        formatter(p.valor_pagado),
        p.estado,
        p.nombres_recepcionista ? `${p.nombres_recepcionista} ${p.apellidos_recepcionista}` : "—",
      ]);

      doc.autoTable({
        head: [["Afiliado", "Fecha", "Valor", "Estado", "Recepcionista"]],
        body: rows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [124, 58, 237] },
      });

      const y = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.text(`Total recaudado: ${formatter(total_recaudado)}`, 14, y);
      doc.text(`Total de pagos: ${ultimos_pagos.length}`, 14, y + 7);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("MetaFit – Sistema de Gestion", 14, y + 16);

      const filename = `finanzas_metafit_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("[exportPDF]", err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <AppLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
          <div className={`spinner-border ${styles.spinnerTeal}`} />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
          <p className="text-muted fs-5">No se pudieron cargar las metricas financieras.</p>
        </div>
      </AppLayout>
    );
  }

  const { ingresos_por_mes, pagos_por_recepcionista, total_recaudado, ultimos_pagos } = data;

  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();
  const mesAnterior = mesActual === 1 ? 12 : mesActual - 1;
  const anioAnterior = mesActual === 1 ? anioActual - 1 : anioActual;

  const filaActual = ingresos_por_mes.find((r) => r.mes === mesActual && r.anio === anioActual);
  const filaAnterior = ingresos_por_mes.find((r) => r.mes === mesAnterior && r.anio === anioAnterior);
  const recaudadoEsteMes = filaActual ? Number(filaActual.total) : 0;
  const recaudadoMesAnterior = filaAnterior ? Number(filaAnterior.total) : 0;
  const promedioMensual = ingresos_por_mes.length > 0
    ? total_recaudado / ingresos_por_mes.length
    : 0;
  const mejorRecepcionista = pagos_por_recepcionista.length > 0
    ? pagos_por_recepcionista.reduce((a, b) =>
        Number(a.total_recaudado) > Number(b.total_recaudado) ? a : b
      )
    : null;

  // ── Bar chart: ultimos 6 meses ──
  const ultimos6 = ingresos_por_mes.slice().reverse().slice(-6);
  const etiquetasBar = ultimos6.map((r) => `${MONTHS[r.mes - 1]} ${r.anio}`);
  const valoresBar = ultimos6.map((r) => Number(r.total));
  const maxVal = Math.max(...valoresBar, 0);
  const bgColorsBar = valoresBar.map((v) => (v === maxVal && maxVal > 0 ? "#e94560" : "rgba(124, 58, 237, 0.65)"));
  const borderColorsBar = valoresBar.map((v) => (v === maxVal && maxVal > 0 ? "#e94560" : "#4b9ecb"));

  const barData = {
    labels: etiquetasBar,
    datasets: [
      {
        label: "Ingresos",
        data: valoresBar,
        backgroundColor: bgColorsBar,
        borderColor: borderColorsBar,
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1a1a2e",
        titleColor: "#ccc",
        bodyColor: "#fff",
        callbacks: {
          title: (items) => `Mes: ${items[0].label}`,
          label: (ctx) => `Recaudado: ${formatter(ctx.parsed.y)} COP`,
        },
      },
      datalabels: {
        anchor: "end",
        align: "end",
        color: "#ccc",
        font: { size: 9, weight: "bold" },
        formatter: (v) => (v > 0 ? formatter(v) : ""),
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "#252545" },
      },
      y: {
        ticks: {
          color: "#94a3b8",
          callback: (v) => formatter(v),
        },
        grid: { color: "#252545" },
      },
    },
  };

  // ── Doughnut chart: por recepcionista ──
  const coloresDoughnut = ["#4b9ecb", "#2563eb", "#059669", "#e94560", "#f59e0b", "#6366f1", "#ec4899", "#14b8a6"];
  let doughnutLabels = pagos_por_recepcionista.map((r) => `${r.nombres} ${r.apellidos}`);
  let doughnutValues = pagos_por_recepcionista.map((r) => Number(r.total_recaudado));
  let doughnutBg = coloresDoughnut.slice(0, doughnutValues.length);

  if (doughnutValues.length > MAX_RECEP) {
    const top = pagos_por_recepcionista.slice(0, MAX_RECEP - 1);
    const rest = pagos_por_recepcionista.slice(MAX_RECEP - 1);
    const otrosTotal = rest.reduce((s, r) => s + Number(r.total_recaudado), 0);
    top.push({ nombres: "Otros", apellidos: "", total_recaudado: otrosTotal, cantidad_pagos: rest.reduce((s, r) => s + Number(r.cantidad_pagos), 0) });
    doughnutLabels = top.map((r) => `${r.nombres} ${r.apellidos}`.trim());
    doughnutValues = top.map((r) => Number(r.total_recaudado));
    doughnutBg = coloresDoughnut.slice(0, doughnutLabels.length);
  }

  const doughnutTotal = doughnutValues.reduce((a, b) => a + b, 0);

  const doughnutData = {
    labels: doughnutLabels,
    datasets: [
      {
        data: doughnutValues,
        backgroundColor: doughnutBg,
        borderWidth: 2,
        borderColor: "#1a1a2e",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: { color: "#94a3b8", padding: 16, font: { size: 10 } },
      },
      tooltip: {
        backgroundColor: "#1a1a2e",
        titleColor: "#ccc",
        bodyColor: "#fff",
        callbacks: {
          title: (items) => `Recepcionista: ${items[0].label}`,
          label: (ctx) => {
            const val = ctx.parsed;
            const pct = doughnutTotal > 0 ? ((val / doughnutTotal) * 100).toFixed(1) : 0;
            return `Total: ${formatter(val)} COP (${pct}%)`;
          },
        },
      },
      datalabels: {
        color: "#fff",
        font: { size: 10, weight: "bold" },
        formatter: (v) => {
          if (doughnutTotal === 0) return "";
          const pct = ((v / doughnutTotal) * 100).toFixed(1);
          return pct > 5 ? `${pct}%` : "";
        },
      },
    },
  };

  const hayFiltrosActivos = filtros.fecha_inicio || filtros.fecha_fin || filtros.id_recepcionista;

  return (
    <AppLayout>
      <div className={`container-fluid py-4 px-3 px-md-4 ${styles.page}`}>
        {/* ── Cabecera ── */}
        <div className={`${styles.headerRow} d-flex flex-wrap justify-content-between align-items-center mb-4`}>
          <div>
            <h1 className={styles.headerTitle}>
              <span className={styles.headerIcon}>💰</span> Panel de Finanzas
            </h1>
            <p className={styles.headerSubtitle}>
              {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              <span className={styles.headerDot}> · </span>
              solo Administrador
            </p>
          </div>
          <button type="button"
            className={styles.pdfBtn}
            onClick={exportPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <><span className={styles.pdfIcon}>📄</span> Exportar a PDF</>
            )}
          </button>
        </div>

        {/* ── Barra de filtros ── */}
        <div className={styles.filterBar}>
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-3">
              <label className={styles.filterLabel}>Fecha inicio</label>
              <input
                type="date"
                className={styles.filterInput}
                value={filtros.fecha_inicio}
                onChange={(e) => setFiltros((f) => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className={styles.filterLabel}>Fecha fin</label>
              <input
                type="date"
                className={styles.filterInput}
                value={filtros.fecha_fin}
                onChange={(e) => setFiltros((f) => ({ ...f, fecha_fin: e.target.value }))}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className={styles.filterLabel}>Recepcionista</label>
              <select
                className={styles.filterInput}
                value={filtros.id_recepcionista}
                onChange={(e) => setFiltros((f) => ({ ...f, id_recepcionista: e.target.value }))}
              >
                <option value="">Todos</option>
                {recepcionistas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombres} {r.apellidos}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-6 col-md-3 d-flex gap-2">
              <button type="button" className={styles.filterBtn} onClick={handleFiltrar}>
                Filtrar
              </button>
              {hayFiltrosActivos && (
                <button type="button" className={styles.filterBtnClear} onClick={handleLimpiar}>
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className={styles.kpiGrid}>
          {[
            { icono: "💰", valor: formatter(total_recaudado), label: "Total recaudado", color: "#22c55e" },
            { icono: "📈", valor: formatter(recaudadoEsteMes), label: "Recaudado este mes", color: "#3b82f6" },
            { icono: "📅", valor: formatter(recaudadoMesAnterior), label: "Mes anterior", color: "#a855f7" },
            { icono: "📊", valor: formatter(Math.round(promedioMensual)), label: "Promedio mensual", color: "#f59e0b" },
            { icono: "🏆", valor: mejorRecepcionista ? `${mejorRecepcionista.nombres} ${mejorRecepcionista.apellidos}` : "—", label: "Mejor recepcionista", color: "#ec4899" },
          ].map((kpi) => (
            <div key={kpi.label} className={styles.kpiCard}>
              <div className={styles.kpiIconWrap} style={{ background: `${kpi.color}18` }}>
                <span className={styles.kpiIcon}>{kpi.icono}</span>
              </div>
              <div className={styles.kpiValue}>{kpi.valor}</div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="row g-4 mb-4">
          <div className="col-12 col-lg-8">
            <div className={styles.chartCard}>
              <h6 className={styles.chartTitle}>
                <span className={styles.chartIcon}>📊</span> Ingresos por mes (ultimos 6)
              </h6>
              <div style={{ height: 280 }}>
                {ultimos6.length > 0 ? (
                  <Bar data={barData} options={barOptions} />
                ) : (
                  <p className="text-muted text-center py-5">Sin datos de ingresos.</p>
                )}
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className={styles.chartCard}>
              <h6 className={styles.chartTitle}>
                <span className={styles.chartIcon}>🍩</span> Recaudacion por recepcionista
              </h6>
              <div style={{ height: 280 }}>
                {pagos_por_recepcionista.length > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <p className="text-muted text-center py-5">Sin datos de recepcionistas.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Cards: Ultimos pagos ── */}
        <div className={styles.pagosSection}>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0">
              <span className={styles.chartIcon}>🧾</span> Ultimos pagos registrados
            </h6>
            {ultimos_pagos.length > 0 && (
              <span className={styles.pagosCount}>{ultimos_pagos.length} pago(s)</span>
            )}
          </div>
          {ultimos_pagos.length > 0 ? (
            <div className={styles.pagosGrid}>
              {ultimos_pagos.map((p) => {
                const nombreCompleto = `${p.nombres_afiliado} ${p.apellidos_afiliado}`;
                return (
                  <div key={p.id_pago} className={styles.pagoCard}>
                    <div className={styles.pagoCardTop}>
                      <div
                        className={styles.pagoAvatar}
                        style={{ background: avatarColor(nombreCompleto) }}
                      >
                        {inicial(p.nombres_afiliado)}
                      </div>
                      <div className={styles.pagoInfo}>
                        <div className={styles.pagoNombre}>{nombreCompleto}</div>
                        <div className={styles.pagoFecha}>
                          {new Date(p.fecha_pago).toLocaleDateString("es-CO", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </div>
                      </div>
                      <div className={styles.pagoMonto}>{formatter(p.valor_pagado)}</div>
                    </div>
                    <div className={styles.pagoCardBottom}>
                      <div>{badgeEstado(p.estado)}</div>
                      <div className={styles.pagoRecepcionista}>
                        <span className={styles.pagoRecepcionistaIcon}>🧑‍💼</span>
                        {p.nombres_recepcionista
                          ? `${p.nombres_recepcionista} ${p.apellidos_recepcionista}`
                          : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted mb-1 fs-5">📭 No hay pagos registrados aun.</p>
              <small className="text-muted">Los pagos apareceran aqui cuando se registren desde el modulo de Pagos.</small>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
