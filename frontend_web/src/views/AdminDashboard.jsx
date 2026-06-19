import { useCallback, useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../hooks/useDashboard";
import { useAfiliados } from "../hooks/useAfiliados";
import { useToast } from "../hooks/useToast";
import styles from "./AdminDashboard.module.css";

const getId          = (doc) => doc.id_usuario ?? doc._id ?? doc.id;
const nombreCompleto = (a)   => [a.nombres, a.apellidos].filter(Boolean).join(" ") || "Sin nombre";
const inicial        = (a)   => (a.nombres || a.correo || "?")[0].toUpperCase();
const cicloActivo    = (a)   => a.ciclo_activo || null;

const OBJETIVO_CONFIG = {
  "Perdida de grasa": { icono: "🔥", color: "#e94560", bg: "#e9456022" },
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
  const { authAxios } = useAuth();
  const { kpis, loading: loadingKpis, error: errorKpis, fetchKpis } = useDashboard();
  const { afiliados, loading: loadingAfil, error: errorAfil, fetchAfiliados } = useAfiliados();
  const { toast, showToast } = useToast();

  const loading = loadingKpis || loadingAfil;
  const error   = errorKpis   || errorAfil;

  const [busqueda, setBusqueda] = useState("");

  // Precio membresia
  const [precio, setPrecio] = useState(80000);
  const [editPrecio, setEditPrecio] = useState(false);
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetchKpis();
    fetchAfiliados();
  }, []);

  // Cargar precio desde backend
  const cargarPrecio = useCallback(async () => {
    try {
      const { data } = await authAxios.get("/configuracion/precio-membresia");
      if (data.valor) setPrecio(Number(data.valor));
    } catch (err) {
      console.error("[AdminDashboard] Error al cargar precio:", err);
    }
  }, [authAxios]);

  useEffect(() => {
    cargarPrecio();
  }, [cargarPrecio]);

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

  const filtrados = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return nombreCompleto(a).toLowerCase().includes(t) ||
           (a.correo || "").toLowerCase().includes(t)  ||
           (a.objetivo_fisico || "").toLowerCase().includes(t);
  });

  const totalAfiliados   = kpis?.total_afiliados   ?? afiliados.length;
  const totalActivos     = kpis?.afiliados_activos  ?? 0;
  const conCicloActivo   = kpis?.ciclos_en_curso    ?? 0;
  const conRestricciones = kpis?.con_restricciones  ?? 0;
  const ingresos         = kpis?.ingresos           ?? 0;
  const pagosRegistrados = kpis?.pagos_registrados  ?? 0;

  const precioFormateado = `$${precio.toLocaleString("es-CO")}`;
  const ingresosFormateado = `$${Number(ingresos).toLocaleString("es-CO")}`;

  const conteoPorObj = OBJETIVOS.map((obj) => ({
    objetivo: obj, cantidad: afiliados.filter((a) => a.objetivo_fisico === obj).length,
    ...OBJETIVO_CONFIG[obj],
  }));

  return (
    <AppLayout>
      {toast.msg && (
        <div className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type === "danger" ? "danger" : "dark"} shadow-lg py-2 px-3`}
          style={{ zIndex: 9999, minWidth: 300 }}>
          {toast.msg}
        </div>
      )}

      <div className="container-fluid py-4 px-3 px-md-4">

        {/* Título */}
        <div className="mb-4">
          <h1 className="h4 fw-bold mb-0">📊 Dashboard General</h1>
          <small className="text-muted">Vista completa · solo Administrador</small>
        </div>

        {/* KPIs */}
        <div className="row g-3 mb-4">
          {[
            { label: "Total Afiliados",   valor: totalAfiliados,  icono: "👥", color: "#0d6efd" },
            { label: "Activos",           valor: totalActivos,    icono: "✅",    color: "#198754" },
            { label: "Ciclos en curso",   valor: conCicloActivo,  icono: "🔄",    color: "#6f42c1" },
            { label: "Con restricciones", valor: conRestricciones,icono: "⚠️",   color: "#fd7e14" },
            { label: "Ingresos",          valor: ingresosFormateado, icono: "💰", color: "#e94560" },
            { label: "Pagos registrados", valor: pagosRegistrados, icono: "🧾", color: "#0891b2" },
          ].map((kpi) => (
            <div key={kpi.label} className="col-6 col-md-4 col-lg-2">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className={styles.kpiIconWrap} style={{ background: kpi.color + "22" }}>
                    {kpi.icono}
                  </div>
                  <div>
                    <div className="fw-bold lh-1" style={{ color: kpi.color, fontSize: kpi.label === "Ingresos" ? "1rem" : "1.5rem" }}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : kpi.valor}
                    </div>
                    <small className="text-muted">{kpi.label}</small>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Configuracion: Precio de Membresia ── */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold mb-0">💳 Precio de Membresía</h6>
                  {!editPrecio && (
                    <button className="btn btn-outline-primary btn-sm" onClick={() => { setNuevoPrecio(String(precio)); setEditPrecio(true); }}>
                      ✏️ Editar
                    </button>
                  )}
                </div>
                {editPrecio ? (
                  <div className="d-flex gap-2 align-items-center">
                    <div className="input-group input-group-sm" style={{ maxWidth: 220 }}>
                      <span className="input-group-text">$</span>
                      <input type="number" className="form-control" min={1000} step={1000}
                        value={nuevoPrecio}
                        onChange={(e) => setNuevoPrecio(e.target.value)} />
                      <span className="input-group-text">COP</span>
                    </div>
                    <button className="btn btn-success btn-sm" onClick={handleGuardarPrecio} disabled={guardando}>
                      {guardando ? <span className="spinner-border spinner-border-sm" /> : "💾 Guardar"}
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditPrecio(false)} disabled={guardando}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div>
                    <span className="fw-bold fs-4" style={{ color: "#0d6efd" }}>
                      {loading ? <span className="spinner-border spinner-border-sm" /> : precioFormateado}
                    </span>
                    <small className="text-muted ms-2">COP / mes</small>
                    <div className="text-muted small mt-1">
                      {totalActivos} afiliados activos × {precioFormateado} = <strong>${(totalActivos * precio).toLocaleString("es-CO")} COP</strong> / mes
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Distribución por objetivo */}
          <div className="col-12 col-md-6">
            <h6 className="fw-bold mb-3">🎯 Distribución por Objetivo Físico</h6>
            <div className="row g-2">
              {conteoPorObj.map((obj) => (
                <div key={obj.objetivo} className="col-12 col-sm-4">
                  <div className="card border-0 shadow-sm h-100" style={{ borderLeft: `5px solid ${obj.color}` }}>
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="fs-1">{obj.icono}</span>
                        <div className={styles.objCountWrap} style={{ background: obj.bg, color: obj.color }}>
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
          </div>
        </div>

        {/* Tabla */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2 border-0">
            <h2 className="h5 fw-bold mb-0">👥 Afiliados</h2>
            <input type="text" id="busqueda-dashboard" className={`form-control form-control-sm ${styles.searchInput}`}
              placeholder="🔍 Buscar..."
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
                              <div className={styles.avatarTd}
                                style={{ background: `hsl(${(getId(a) * 47) % 360},65%,55%)` }}>
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className={styles.emailSm}>{a.correo}</div>
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
                          <td>{badgeEstado(a.estado_cuenta)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && (
              <div className="card-footer bg-white text-muted small py-2 px-4 border-0">
                  {filtrados.length} de {totalAfiliados} afiliados
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
