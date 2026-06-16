import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { useToast } from "../hooks/useToast";

export default function Dashboard() {
  const { authAxios, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarKPIs = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await authAxios.get("/dashboard/kpis");
      setKpis(data);
    } catch (err) {
      console.error("[Dashboard] Error al cargar KPIs:", err);
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        logout();
        navigate("/login");
      } else {
        setError("No se pudieron cargar las estadísticas del sistema.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarKPIs();
  }, []);

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
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2 text-white"
                style={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  fontSize: "1.1rem",
                }}
              >
                📊
              </span>
              Dashboard General
            </h1>
            <small className="text-muted">
              Panel administrativo general · Métricas clave del negocio, personal e ingresos
            </small>
          </div>

          <button
            id="btn-refresh-dashboard"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3"
            style={{ fontSize: "0.8rem", fontWeight: 600 }}
            onClick={cargarKPIs}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12 }} />
            ) : (
              "🔄"
            )}
            Actualizar datos
          </button>
        </div>

        {error && (
          <div className="alert alert-danger py-2 mb-4">
            <small>⚠️ {error}</small>
          </div>
        )}

        {loading && !kpis ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
            <p className="text-muted mt-2 small">Cargando métricas de rendimiento...</p>
          </div>
        ) : (
          kpis && (
            <>
              {/* Sección 1: Métricas de Membresía e Ingresos */}
              <h5 className="fw-bold mb-3 text-muted small text-uppercase" style={{ letterSpacing: "0.06em" }}>
                💰 Rendimiento y Finanzas
              </h5>
              <div className="row g-3 mb-4">
                {[
                  {
                    label: "Ingresos Totales",
                    valor: `$${Number(kpis.ingresos).toLocaleString("es-CO")}`,
                    icono: "💵",
                    color: "#059669",
                    bg: "#05966915",
                    subtext: "Recaudo en efectivo",
                  },
                  {
                    label: "Pagos Registrados",
                    valor: kpis.pagos_registrados,
                    icono: "🧾",
                    color: "#2563eb",
                    bg: "#2563eb15",
                    subtext: "Transacciones realizadas",
                  },
                  {
                    label: "Próximos Vencimientos",
                    valor: kpis.proximos_vencimientos,
                    icono: "📅",
                    color: "#dc2626",
                    bg: "#dc262615",
                    subtext: "Membresías por expirar",
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="col-12 col-md-4">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body d-flex align-items-center gap-3">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fs-4"
                          style={{ width: 56, height: 56, background: kpi.bg, flexShrink: 0, color: kpi.color }}
                        >
                          {kpi.icono}
                        </div>
                        <div>
                          <div className="fw-bold fs-4 lh-1" style={{ color: kpi.color }}>
                            {kpi.valor}
                          </div>
                          <div className="fw-semibold text-dark small mt-1" style={{ fontSize: "0.8rem" }}>
                            {kpi.label}
                          </div>
                          <small className="text-muted" style={{ fontSize: "0.68rem" }}>
                            {kpi.subtext}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sección 2: Afiliados y Personal */}
              <h5 className="fw-bold mb-3 text-muted small text-uppercase" style={{ letterSpacing: "0.06em" }}>
                👥 Control de Afiliados y Staff
              </h5>
              <div className="row g-3 mb-4">
                {[
                  {
                    label: "Total Afiliados",
                    valor: kpis.total_afiliados,
                    icono: "👥",
                    color: "#7c3aed",
                    bg: "#7c3aed15",
                    sub: `${kpis.afiliados_activos} activos / ${kpis.afiliados_inactivos} inactivos`,
                  },
                  {
                    label: "Entrenadores",
                    valor: kpis.entrenadores,
                    icono: "🏆",
                    color: "#0891b2",
                    bg: "#0891b215",
                    sub: "Gestión de rutinas/dietas",
                  },
                  {
                    label: "Recepcionistas",
                    valor: kpis.recepcionistas,
                    icono: "🗂️",
                    color: "#4f46e5",
                    bg: "#4f46e515",
                    sub: "Gestión de caja y acceso",
                  },
                  {
                    label: "Ciclos Activos",
                    valor: kpis.ciclos_en_curso,
                    icono: "🔄",
                    color: "#ea580c",
                    bg: "#ea580c15",
                    sub: "Rutinas/dietas asignadas",
                  },
                  {
                    label: "Con Restricciones",
                    valor: kpis.con_restricciones,
                    icono: "⚠️",
                    color: "#ca8a04",
                    bg: "#ca8a0415",
                    sub: "Afiliados con cuidado especial",
                  },
                ].map((kpi) => (
                  <div key={kpi.label} className="col-6 col-md">
                    <div className="card border-0 shadow-sm h-100 text-center py-3">
                      <div className="card-body p-2 d-flex flex-column align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center mb-2 fs-5"
                          style={{ width: 44, height: 44, background: kpi.bg, color: kpi.color }}
                        >
                          {kpi.icono}
                        </div>
                        <div className="fw-bold fs-4 text-dark">{kpi.valor}</div>
                        <div className="fw-semibold text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                          {kpi.label}
                        </div>
                        <small className="text-muted mt-1" style={{ fontSize: "0.62rem" }}>
                          {kpi.sub}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sección 3: Distribución y Estado Operativo */}
              <div className="row g-3">
                {/* Distribución por objetivo */}
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 py-3">
                      <h6 className="fw-bold mb-0 text-muted small text-uppercase" style={{ letterSpacing: "0.06em" }}>
                        🎯 Distribución por Objetivo Físico (Ciclos Activos)
                      </h6>
                    </div>
                    <div className="card-body pt-0">
                      {kpis.por_objetivo?.length === 0 ? (
                        <p className="text-muted small text-center py-4">No hay ciclos de entrenamiento activos.</p>
                      ) : (
                        <div className="d-flex flex-column gap-3 mt-2">
                          {kpis.por_objetivo?.map((obj) => {
                            const total = kpis.ciclos_en_curso || 1;
                            const pct = Math.round((obj.cantidad * 100) / total);
                            const colors = {
                              "Pérdida de grasa": "#e94560",
                              "Aumento de masa": "#2563eb",
                              "Mantenimiento": "#059669",
                              "Rehabilitación": "#ea580c",
                            };
                            const col = colors[obj.objetivo] || "#7c3aed";
                            return (
                              <div key={obj.objetivo}>
                                <div className="d-flex justify-content-between small fw-semibold text-muted mb-1">
                                  <span>{obj.objetivo}</span>
                                  <span>
                                    {obj.cantidad} ({pct}%)
                                  </span>
                                </div>
                                <div className="progress" style={{ height: 6 }}>
                                  <div
                                    className="progress-bar rounded-pill"
                                    style={{ width: `${pct}%`, background: col }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resumen del Staff */}
                <div className="col-md-6">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-header bg-white border-0 py-3">
                      <h6 className="fw-bold mb-0 text-muted small text-uppercase" style={{ letterSpacing: "0.06em" }}>
                        ⚡ Estado Operativo del Staff
                      </h6>
                    </div>
                    <div className="card-body pt-0">
                      <div className="list-group list-group-flush">
                        <div className="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold small">Membresía General Única</div>
                            <small className="text-muted">Valor mensual estandarizado</small>
                          </div>
                          <span className="badge bg-success bg-opacity-10 text-success fw-bold fs-6">
                            $80.000 COP
                          </span>
                        </div>
                        <div className="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold small">Tipo de Pagos</div>
                            <small className="text-muted">Medio de recaudo autorizado</small>
                          </div>
                          <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                            Efectivo únicamente
                          </span>
                        </div>
                        <div className="list-group-item border-0 px-0 d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-semibold small">Capacidad Operativa</div>
                            <small className="text-muted">Total de empleados registrados</small>
                          </div>
                          <span className="badge bg-dark bg-opacity-10 text-dark fw-bold">
                            {Number(kpis.entrenadores) + Number(kpis.recepcionistas)} personas
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </AppLayout>
  );
}
