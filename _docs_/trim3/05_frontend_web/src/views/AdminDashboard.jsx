import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getId          = (doc) => doc._id ?? doc.id;
const nombreCompleto = (a)   => [a.nombres, a.apellidos].filter(Boolean).join(" ") || "Sin nombre";
const inicial        = (a)   => (a.nombres || a.correo || "?")[0].toUpperCase();
const cicloActivo    = (a)   => a.ciclos?.find((c) => c.activo) || null;
const numRestr       = (a)   => a.restricciones?.length || 0;

const OBJETIVO_CONFIG = {
  "Pérdida de grasa": { icono: "🔥", color: "#e94560", bg: "#e9456022" },
  "Aumento de masa":  { icono: "💪", color: "#0d6efd", bg: "#0d6efd22" },
  "Mantenimiento":    { icono: "⚖️", color: "#198754", bg: "#19875422" },
};

const OBJETIVOS = Object.keys(OBJETIVO_CONFIG);

const badgeEstado = (e) => {
  const map = { activo: "success", inactivo: "danger", pendiente: "warning" };
  const c   = map[(e || "").toLowerCase()] || "secondary";
  return <span className={`badge bg-${c}`}>{e || "—"}</span>;
};
const badgeNivel = (n) => {
  const map = { principiante: "info", intermedio: "primary", avanzado: "dark" };
  const c   = map[(n || "").toLowerCase()] || "secondary";
  return <span className={`badge bg-${c} bg-opacity-75`}>{n || "—"}</span>;
};

export default function AdminDashboard() {
  const { logout, authAxios } = useAuth();
  const navigate = useNavigate();

  const [afiliados, setAfiliados] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [busqueda,  setBusqueda]  = useState("");

  useEffect(() => {
    authAxios.get("/660/afiliados")
      .then(({ data }) => setAfiliados(data))
      .catch((err) => {
        if (err?.response?.status === 401) { logout(); navigate("/login"); }
        else setError("No se pudieron cargar los afiliados.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtrados        = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return nombreCompleto(a).toLowerCase().includes(t) ||
           (a.correo || "").toLowerCase().includes(t)  ||
           (a.objetivo_fisico || "").toLowerCase().includes(t);
  });
  const totalActivos     = afiliados.filter((a) => a.estado?.toLowerCase() === "activo").length;
  const conCicloActivo   = afiliados.filter((a) => cicloActivo(a)).length;
  const conRestricciones = afiliados.filter((a) => numRestr(a) > 0).length;
  const conteoPorObj     = OBJETIVOS.map((obj) => ({
    objetivo: obj, cantidad: afiliados.filter((a) => a.objetivo_fisico === obj).length,
    ...OBJETIVO_CONFIG[obj],
  }));

  return (
    <AppLayout>
      <div className="container-fluid py-4 px-3 px-md-4">

        {/* Título */}
        <div className="mb-4">
          <h1 className="h4 fw-bold mb-0">📊 Dashboard General</h1>
          <small className="text-muted">Vista completa · solo Administrador</small>
        </div>

        {/* KPIs */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Afiliados",   valor: afiliados.length,   icono: "👥", color: "#0d6efd" },
            { label: "Activos",           valor: totalActivos,        icono: "✅", color: "#198754" },
            { label: "Ciclos en curso",   valor: conCicloActivo,      icono: "🔄", color: "#6f42c1" },
            { label: "Con restricciones", valor: conRestricciones,    icono: "⚠️", color: "#fd7e14" },
          ].map((kpi) => (
            <div key={kpi.label} className="col-6 col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="rounded-circle d-flex align-items-center justify-content-center fs-4"
                    style={{ width: 52, height: 52, background: kpi.color + "22", flexShrink: 0 }}>
                    {kpi.icono}
                  </div>
                  <div>
                    <div className="fw-bold fs-3 lh-1" style={{ color: kpi.color }}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : kpi.valor}
                    </div>
                    <small className="text-muted">{kpi.label}</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Distribución por objetivo */}
        <h2 className="h5 fw-bold mb-3">🎯 Distribución por Objetivo Físico</h2>
        <div className="row g-3 mb-4">
          {conteoPorObj.map((obj) => (
            <div key={obj.objetivo} className="col-12 col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `5px solid ${obj.color}` }}>
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fs-1">{obj.icono}</span>
                    <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold fs-3"
                      style={{ width: 60, height: 60, background: obj.bg, color: obj.color }}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : obj.cantidad}
                    </div>
                  </div>
                  <h3 className="h6 fw-bold mb-1" style={{ color: obj.color }}>{obj.objetivo}</h3>
                  <div className="progress mt-2" style={{ height: 6 }}>
                    <div className="progress-bar"
                      style={{ width: afiliados.length > 0 ? `${(obj.cantidad / afiliados.length) * 100}%` : "0%", background: obj.color }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-0">
            <h2 className="h5 fw-bold mb-0">👥 Afiliados</h2>
            <input type="text" id="busqueda-dashboard" className="form-control form-control-sm"
              style={{ maxWidth: 280 }} placeholder="🔍 Buscar..."
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="card-body p-0">
            {error && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}
            {!loading && !error && (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4">#</th>
                      <th>Afiliado</th>
                      <th>Objetivo</th>
                      <th>Nivel</th>
                      <th className="text-center">Ciclo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted py-5">Sin resultados.</td></tr>
                    ) : filtrados.map((a, i) => {
                      const ciclo = cicloActivo(a);
                      return (
                        <tr key={getId(a)}>
                          <td className="ps-4 text-muted small">{i + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                style={{ width: 36, height: 36, flexShrink: 0, fontSize: "0.8rem",
                                  background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className="text-muted" style={{ fontSize: "0.72rem" }}>{a.correo}</div>
                              </div>
                            </div>
                          </td>
                          <td><small>{OBJETIVO_CONFIG[a.objetivo_fisico]?.icono} {a.objetivo_fisico || "—"}</small></td>
                          <td>{badgeNivel(a.nivel_experiencia)}</td>
                          <td className="text-center">
                            {ciclo
                              ? <span className="badge bg-primary bg-opacity-10 text-primary">Ciclo {ciclo.numero_ciclo}</span>
                              : <span className="text-muted small">—</span>}
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
              <div className="card-footer bg-white text-muted small py-2 px-4 border-0">
                {filtrados.length} de {afiliados.length} afiliados
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
