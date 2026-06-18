import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto, inicial } from "../utils/afiliadoHelpers";
import { getPagos, createPago } from "../services/api";
import s from "./PagosView.module.css";

/** Calcula días restantes entre hoy y una fecha dada (puede ser negativo = vencido) */
const diasRestantes = (fechaStr) => {
  if (!fechaStr) return null;
  const hoy   = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaStr); vence.setHours(0, 0, 0, 0);
  return Math.round((vence - hoy) / (1000 * 60 * 60 * 24));
};

/** Suma N días a una fecha ISO y retorna la nueva fecha ISO (YYYY-MM-DD) */
const sumarDias = (fechaStr, dias) => {
  const base = fechaStr ? new Date(fechaStr) : new Date();
  base.setDate(base.getDate() + dias);
  return base.toISOString().split("T")[0];
};

const hoyISO = () => new Date().toISOString().split("T")[0];

/**
 * Calcula el estado de membresía en función de los días restantes.
 * @returns {{ label, color, bg, badge }}
 */
const estadoMembresia = (dias) => {
  if (dias === null) return { label: "Sin registro", color: "#94a3b8", bg: "#94a3b818", badge: "secondary" };
  if (dias < 0)      return { label: "Vencido",      color: "#e94560", bg: "#e9456018", badge: "danger"    };
  if (dias <= 10)    return { label: "Por vencer",   color: "#f59e0b", bg: "#f59e0b18", badge: "warning"   };
  return              { label: "Al día",            color: "#059669", bg: "#05966918", badge: "success"   };
};

// ── Componente principal ──────────────────────────────────────────────────────
import { useToast } from "../hooks/useToast";

export default function PagosView() {
  const { user, authAxios } = useAuth();

  const [afiliados, setAfiliados] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [busqueda,  setBusqueda]  = useState("");
  const { toast, showToast }      = useToast();

  // Modal registrar pago
  const [pagoModal,  setPagoModal]  = useState(null);  // afiliado seleccionado
  const [saving,     setSaving]     = useState(false);
  const [pagoError,  setPagoError]  = useState("");

  // Modal historial de pagos
  const [histModal, setHistModal] = useState(null);

  // ── Helpers para leer pagos del estado local ───────────────────────────────

  /** Array de pagos del afiliado (adjuntos como a.pagos = [...]) */
  const pagosDeAfiliado = (a) => a.pagos || [];

  /** Último pago (el más reciente, pues vienen ORDER BY fecha_pago DESC) */
  const ultimoPago = (a) => pagosDeAfiliado(a)[0] || null;

  /** fecha_vencimiento del último pago */
  const fechaVenc = (a) => ultimoPago(a)?.fecha_vencimiento || null;

  // ── Carga inicial: afiliados + sus pagos ────────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: lista } = await authAxios.get("/afiliados");

        // Para cada afiliado, intentar cargar su historial de pagos.
        // Si falla una llamada individual no rompemos la vista completa.
        const conPagos = await Promise.all(
          lista.map(async (a) => {
            try {
              const { data: pagos } = await getPagos(getId(a));
              return { ...a, pagos };
            } catch {
              return { ...a, pagos: [] };
            }
          })
        );
        setAfiliados(conPagos);
      } catch (err) {
        if (err?.response?.status === 401) { /* interceptor global lo maneja */ }
        else setError("No se pudieron cargar los afiliados.");
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // ── KPIs calculados en vivo ────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const hoy = hoyISO();
    const recaudadoHoy = afiliados.reduce((acc, a) => {
      const pagoHoy = pagosDeAfiliado(a).find((p) => p.fecha_pago === hoy);
      return acc + (pagoHoy ? Number(pagoHoy.valor_pagado || 80000) : 0);
    }, 0);

    const porVencer = afiliados.filter((a) => {
      const d = diasRestantes(fechaVenc(a));
      return d !== null && d >= 0 && d <= 10;
    }).length;

    const mora = afiliados.filter((a) => {
      const d = diasRestantes(fechaVenc(a));
      return d !== null && d < 0;
    }).length;

    return { recaudadoHoy, porVencer, mora };
  }, [afiliados]);

  // ── Filtrado ───────────────────────────────────────────────────────────────
  const filtrados = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return (
      nombreCompleto(a).toLowerCase().includes(t) ||
      (a.correo || "").toLowerCase().includes(t)
    );
  });

  // ── Registrar pago en efectivo ─────────────────────────────────────────────
  const handlePago = async () => {
    setSaving(true); setPagoError("");
    try {
      const a          = pagoModal;
      const id         = getId(a);
      const vencActual = fechaVenc(a);
      const baseCalculo = vencActual && diasRestantes(vencActual) > 0 ? vencActual : hoyISO();
      const nuevaFecha  = sumarDias(baseCalculo, 30);

      // FIX 5: usar createPago (POST /afiliados/:id/pagos) en lugar de PATCH
      await createPago(id, {
        fecha_pago:        hoyISO(),
        valor_pagado:      80000,
        estado:            "Pagado",
        fecha_vencimiento: nuevaFecha,
      });

      // Actualizar estado local: prepend del nuevo pago al array del afiliado
      const nuevoPagoLocal = {
        fecha_pago:        hoyISO(),
        valor_pagado:      80000,
        estado:            "Pagado",
        fecha_vencimiento: nuevaFecha,
      };
      setAfiliados((prev) =>
        prev.map((af) =>
          getId(af) === id
            ? { ...af, pagos: [nuevoPagoLocal, ...pagosDeAfiliado(af)] }
            : af
        )
      );
      setPagoModal(null);
      showToast(`✅ ¡Pago registrado! Nuevo vencimiento: ${nuevaFecha}`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || "Error desconocido";
      console.error("[PagosView.handlePago]", err);
      setPagoError(`Error al guardar el pago: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      {/* Toast */}
      {toast.msg && (
        <div
          className="position-fixed bottom-0 end-0 m-4 alert alert-dark shadow-lg py-3 px-4"
          style={{ zIndex: 9999, minWidth: 320, borderLeft: "4px solid #059669" }}
        >
          {toast.msg}
        </div>
      )}

      <div className="container-fluid py-4 px-3 px-md-4">

        {/* ── Encabezado ── */}
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
          <div>
            <h1 className="h4 fw-bold mb-0 d-flex align-items-center gap-2">
              <span
                className="d-inline-flex align-items-center justify-content-center rounded-2 text-white"
                style={{ width: 36, height: 36, background: "linear-gradient(135deg,#2563eb,#7c3aed)", fontSize: "1.1rem" }}
              >
                💳
              </span>
              Gestión de Pagos
            </h1>
            <small className="text-muted">
              Registro de mensualidades en efectivo · {new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}
            </small>
          </div>

          {/* KPIs */}
          <div className="d-flex gap-2 flex-wrap">
            {[
              {
                label: "Recaudado hoy (Efectivo)",
                valor: loading ? "—" : `$${kpis.recaudadoHoy.toLocaleString("es-CO")}`,
                color: "#2563eb", icono: "💵",
              },
              {
                label: "Por vencer (≤10 días)",
                valor: loading ? "—" : kpis.porVencer,
                color: "#f59e0b", icono: "⏳",
              },
              {
                label: "En mora",
                valor: loading ? "—" : kpis.mora,
                color: "#e94560", icono: "🔴",
              },
            ].map((k) => (
              <div
                key={k.label}
                className="card border-0 shadow-sm px-3 py-2 text-center"
                style={{ minWidth: 150 }}
              >
                <div className="fw-bold fs-5" style={{ color: k.color }}>
                  {k.icono} {k.valor}
                </div>
                <div className="text-muted" style={{ fontSize: "0.65rem" }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabla ── */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0 flex-wrap gap-2">
            <span className="fw-semibold text-muted small">{filtrados.length} afiliados</span>
            <input
              id="busqueda-pagos"
              type="text"
              className="form-control form-control-sm"
              style={{ maxWidth: 260 }}
              placeholder="🔍 Nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="card-body p-0">
            {error   && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className="spinner-border" style={{ color: "#2563eb" }} /></div>}

            {!loading && !error && (
              <div className="mf-table-wrap">
                <table className="table table-hover align-middle mb-0 mf-table">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">#</th>
                      <th className="col-nombre">Afiliado</th>
                      <th className="col-fecha">Último pago</th>
                      <th className="col-fecha">Vencimiento</th>
                      <th className="col-dias">Días restantes</th>
                      <th className="col-estado">Estado membresía</th>
                      <th className="col-acceso">Acceso</th>
                      <th className="col-acciones pe-3">Acciones</th>
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
                      const ult   = ultimoPago(a);
                      const dias  = diasRestantes(fechaVenc(a));
                      const est   = estadoMembresia(dias);
                      const vencido = dias !== null && dias < 0;

                      return (
                        <tr
                          key={getId(a)}
                          style={{
                            background: vencido ? "#fff5f5" : dias !== null && dias <= 10 ? "#fffbeb" : "transparent",
                          }}
                        >
                          <td className="ps-3 text-muted small">{idx + 1}</td>

                          {/* Afiliado */}
                          <td className="col-nombre">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                                style={{
                                  width: 36, height: 36, fontSize: "0.85rem",
                                  background: `hsl(${(getId(a) * 47) % 360},65%,55%)`,
                                }}
                              >
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>{a.correo || "—"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Último pago */}
                          <td className="col-fecha">
                            {ult ? (
                              <div>
                                <div className="small fw-semibold">{ult.fecha_pago}</div>
                                <div className="text-muted" style={{ fontSize: "0.7rem" }}>
                                  💵 ${Number(ult.valor_pagado || 80000).toLocaleString("es-CO")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted small">Sin registro</span>
                            )}
                          </td>

                          {/* Vencimiento */}
                          <td className="col-fecha">
                            {fechaVenc(a) ? (
                              <span
                                className="small fw-semibold"
                                style={{ color: est.color }}
                              >
                                {fechaVenc(a)}
                              </span>
                            ) : (
                              <span className="text-muted small">—</span>
                            )}
                          </td>

                          {/* Días restantes */}
                          <td className="col-dias">
                            {dias === null ? (
                              <span className="text-muted small">—</span>
                            ) : (
                              <span
                                className="badge px-2 py-1 fw-bold"
                                style={{
                                  background: est.bg,
                                  color:      est.color,
                                  fontSize:   "0.75rem",
                                  minWidth:   48,
                                }}
                              >
                                {dias < 0 ? `−${Math.abs(dias)}d` : `${dias}d`}
                              </span>
                            )}
                          </td>

                          {/* Estado membresía */}
                          <td className="col-estado">
                            <span
                              className="badge px-3 py-1"
                              style={{ background: est.bg, color: est.color, fontSize: "0.72rem" }}
                            >
                              {est.label === "Al día"          && "✅ "}
                              {est.label === "Por vencer"      && "⏳ "}
                              {est.label === "Vencido"         && "🔴 "}
                              {est.label === "Sin registro"    && "⚪ "}
                              {est.label}
                            </span>
                          </td>

                          {/* Acceso */}
                          <td className="col-acceso">
                            {vencido ? (
                              <span className="badge bg-danger bg-opacity-15 text-danger" style={{ fontSize: "0.7rem" }}>
                                🔒 Inactivo
                              </span>
                            ) : (
                              <span className="badge bg-success bg-opacity-15 text-success" style={{ fontSize: "0.7rem" }}>
                                🟢 Activo
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="col-acciones pe-3">
                            <div className="d-flex gap-1 justify-content-center">
                              {/* Historial */}
                              {pagosDeAfiliado(a).length > 0 && (
                                <button
                                  className="btn btn-outline-secondary btn-sm"
                                  id={`btn-historial-${getId(a)}`}
                                  title="Ver historial de pagos"
                                  onClick={() => setHistModal(a)}
                                >
                                  🧾
                                </button>
                              )}
                              {/* Registrar pago */}
                              <button
                                className="btn btn-sm fw-semibold text-white"
                                id={`btn-pago-${getId(a)}`}
                                title="Registrar pago en efectivo"
                                style={{
                                  background: "linear-gradient(135deg,#2563eb,#7c3aed)",
                                  border: "none",
                                  fontSize: "0.78rem",
                                }}
                                onClick={() => { setPagoModal(a); setPagoError(""); }}
                              >
                                💵 Registrar pago
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

            {!loading && !error && (
              <div className="card-footer bg-white border-0 text-muted small py-2 px-4 d-flex gap-4">
                <span>✅ Al día: <strong>{afiliados.filter((a) => { const d = diasRestantes(fechaVenc(a)); return d !== null && d > 10; }).length}</strong></span>
                <span>⏳ Por vencer: <strong>{kpis.porVencer}</strong></span>
                <span>🔴 En mora: <strong>{kpis.mora}</strong></span>
                <span>⚪ Sin registro: <strong>{afiliados.filter((a) => !fechaVenc(a)).length}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CONFIRMAR PAGO EN EFECTIVO
      ═══════════════════════════════════════════════════════════════════════ */}
      {pagoModal && (() => {
        const dias       = diasRestantes(fechaVenc(pagoModal));
        const est        = estadoMembresia(dias);
        const vencActual = fechaVenc(pagoModal);
        const base       = vencActual && dias > 0 ? vencActual : hoyISO();
        const nuevaFecha = sumarDias(base, 30);

        return (
          <div
            className={`modal d-block ${s.modalOverlay}`}
            onClick={() => !saving && setPagoModal(null)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content border-0 shadow-lg">
                {/* Header */}
                <div
                  className="modal-header text-white border-0"
                  style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}
                >
                  <h5 className="modal-title">💵 Registrar Pago en Efectivo</h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => !saving && setPagoModal(null)}
                    disabled={saving}
                  />
                </div>

                <div className="modal-body py-4">
                  {pagoError && (
                    <div className="alert alert-danger py-2 mb-3">
                      <small>⚠️ {pagoError}</small>
                    </div>
                  )}

                  {/* Info afiliado */}
                  <div
                    className="rounded-3 p-3 mb-4 d-flex align-items-center gap-3"
                    style={{ background: "#f0f4ff", border: "1px solid #c7d2fe" }}
                  >
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                      style={{
                        width: 48, height: 48, fontSize: "1.1rem",
                        background: `hsl(${(getId(pagoModal) * 47) % 360},65%,55%)`,
                      }}
                    >
                      {inicial(pagoModal)}
                    </div>
                    <div>
                      <div className="fw-bold">{nombreCompleto(pagoModal)}</div>
                      <div className="text-muted small">{pagoModal.correo || "—"}</div>
                    </div>
                  </div>

                  {/* Estado actual */}
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                        Estado actual
                      </small>
                      <span className="badge px-2 py-1 mt-1" style={{ background: est.bg, color: est.color }}>
                        {est.label}
                        {dias !== null && ` (${dias < 0 ? `−${Math.abs(dias)}` : dias}d)`}
                      </span>
                    </div>
                    <div className="col-6">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.65rem" }}>
                        Vencimiento actual
                      </small>
                      <div className="fw-semibold small mt-1">{vencActual || "Sin registro"}</div>
                    </div>
                  </div>

                  {/* Confirmación */}
                  <div
                    className="rounded-3 p-3 text-center"
                    style={{ background: "#f0fdf4", border: "2px solid #86efac" }}
                  >
                    <div className="fs-4 mb-2">💵</div>
                    <p className="mb-2 fw-semibold">
                      ¿Confirmas que el afiliado ha pagado la mensualidad en efectivo?
                    </p>
                    <p className="text-muted small mb-3">
                      Monto: <strong>$80,000 COP</strong> · Método: <strong>Efectivo</strong>
                    </p>
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      <span className="text-muted small">Nuevo vencimiento:</span>
                      <span className="badge px-3 py-2" style={{ background: "#05966918", color: "#059669", fontSize: "0.85rem" }}>
                        📅 {nuevaFecha}
                      </span>
                    </div>
                    {dias < 0 && (
                      <div className="mt-2">
                        <span className="badge bg-warning text-dark" style={{ fontSize: "0.7rem" }}>
                          ⚠️ Afiliado en mora — se reactivará automáticamente
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm px-4"
                    onClick={() => setPagoModal(null)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirmar-pago-efectivo"
                    type="button"
                    className="btn btn-sm text-white fw-semibold px-4"
                    style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none" }}
                    disabled={saving}
                    onClick={handlePago}
                  >
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2" />Registrando...</>
                      : "✅ ¡Confirmar Pago!"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: HISTORIAL DE PAGOS
      ═══════════════════════════════════════════════════════════════════════ */}
      {histModal && (
        <div
          className={`modal d-block ${s.modalOverlay}`}
          onClick={() => setHistModal(null)}
        >
          <div
            className="modal-dialog modal-dialog-scrollable"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0 shadow-lg">
              <div
                className="modal-header text-white border-0"
                style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}
              >
                <h5 className="modal-title">
                  🧾 Historial de Pagos — {nombreCompleto(histModal)}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setHistModal(null)} />
              </div>

              <div className="modal-body p-0">
                {pagosDeAfiliado(histModal).length === 0 ? (
                  <div className="text-center text-muted py-5">Sin pagos registrados.</div>
                ) : (
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="ps-4">Fecha pago</th>
                        <th className="text-center">Estado</th>
                        <th className="text-center">Monto</th>
                        <th className="text-center pe-4">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosDeAfiliado(histModal).map((p, i) => (
                        <tr key={i}>
                          <td className="ps-4 small fw-semibold">{p.fecha_pago}</td>
                          <td className="text-center">
                            <span className="badge bg-success bg-opacity-15 text-success" style={{ fontSize: "0.7rem" }}>
                              💵 {p.estado || "Pagado"}
                            </span>
                          </td>
                          <td className="text-center small fw-semibold text-success">
                            ${Number(p.valor_pagado || 80000).toLocaleString("es-CO")}
                          </td>
                          <td className="text-center text-muted pe-4" style={{ fontSize: "0.7rem" }}>
                            {p.fecha_vencimiento || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-footer border-0">
                <div className="text-muted small">
                  Total registros: <strong>{pagosDeAfiliado(histModal).length}</strong>
                  &nbsp;·&nbsp; Total recaudado:&nbsp;
                  <strong className="text-success">
                    ${pagosDeAfiliado(histModal).reduce((s, p) => s + Number(p.valor_pagado || 80000), 0).toLocaleString("es-CO")} COP
                  </strong>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={() => setHistModal(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
