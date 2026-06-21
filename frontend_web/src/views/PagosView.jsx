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
          className={`position-fixed bottom-0 end-0 m-4 alert shadow-lg py-3 px-4 ${s.toast}`}
          style={{ zIndex: 9999, minWidth: 320 }}
        >
          {toast.msg}
        </div>
      )}

      <div className={`container-fluid py-4 px-3 px-md-4 ${s.page}`}>

        {/* ── Encabezado ── */}
        <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
          <div>
            <h1 className={`h4 fw-bold mb-0 d-flex align-items-center gap-2 ${s.headerTitle}`}>
              <span className={`d-inline-flex align-items-center justify-content-center ${s.headerIcon}`}>💳</span>
              Gestión de Pagos
            </h1>
            <small className={s.headerSub}>
              Registro de mensualidades en efectivo · {new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}
            </small>
          </div>

          {/* KPIs */}
          <div className="d-flex gap-2 flex-wrap">
            {[
              {
                label: "Recaudado hoy (Efectivo)",
                valor: loading ? "—" : `$${kpis.recaudadoHoy.toLocaleString("es-CO")}`,
                color: "#4b9ecb", icono: "💵",
              },
              {
                label: "Por vencer (≤10 días)",
                valor: loading ? "—" : kpis.porVencer,
                color: "#eab308", icono: "⏳",
              },
              {
                label: "En mora",
                valor: loading ? "—" : kpis.mora,
                color: "#ef4444", icono: "🔴",
              },
            ].map((k) => (
              <div key={k.label} className={s.kpiCard}>
                <div className={s.kpiValor} style={{ color: k.color }}>
                  {k.icono} {k.valor}
                </div>
                <div className={s.kpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabla ── */}
        <div className={s.tableCard}>
          <div className={s.tableCardHeader}>
            <span style={{color:"#94a3b8",fontSize:"0.85rem",fontWeight:600}}>{filtrados.length} afiliados</span>
            <input
              id="busqueda-pagos"
              type="text"
              className={`form-control form-control-sm ${s.searchInput}`}
              placeholder="🔍 Nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div style={{borderRadius:"0 0 14px 14px"}}>
            {error   && <div className={s.alertDanger} style={{margin:"0.75rem",padding:"0.4rem 0.75rem"}}><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className={`spinner-border ${s.spinnerBrand}`} /></div>}

            {!loading && !error && (
              <div className={s.tableCard}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th style={{paddingLeft:"1.25rem"}}>#</th>
                      <th>Afiliado</th>
                      <th>Último pago</th>
                      <th>Vencimiento</th>
                      <th>Días restantes</th>
                      <th>Estado membresía</th>
                      <th>Acceso</th>
                      <th style={{textAlign:"center",paddingRight:"1rem"}}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className={`text-center py-5 ${s.emptyState}`}>
                          {busqueda ? `Sin resultados para "${busqueda}"` : "No hay afiliados."}
                        </td>
                      </tr>
                    ) : filtrados.map((a, idx) => {
                      const ult   = ultimoPago(a);
                      const dias  = diasRestantes(fechaVenc(a));
                      const est   = estadoMembresia(dias);
                      const vencido = dias !== null && dias < 0;

                      return (
                        <tr key={getId(a)}>
                          <td style={{paddingLeft:"1.25rem"}} className={s.emptyState}>{idx + 1}</td>

                          {/* Afiliado */}
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className={s.avatarTd}
                                style={{
                                  background: `hsl(${(getId(a) * 47) % 360},65%,55%)`,
                                }}
                              >
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small" style={{color:"#e0e0e0"}}>{nombreCompleto(a)}</div>
                                <div className={s.emailSm}>{a.correo || "—"}</div>
                              </div>
                            </div>
                          </td>

                          {/* Último pago */}
                          <td>
                            {ult ? (
                              <div>
                                <div className="small fw-semibold" style={{color:"#e0e0e0"}}>{ult.fecha_pago}</div>
                                <div className={s.pagoInfo}>
                                  💵 ${Number(ult.valor_pagado || 80000).toLocaleString("es-CO")}
                                </div>
                              </div>
                            ) : (
                              <span className={s.emptyState} style={{fontSize:"0.85rem"}}>Sin registro</span>
                            )}
                          </td>

                          {/* Vencimiento */}
                          <td>
                            {fechaVenc(a) ? (
                              <span className="small fw-semibold" style={{ color: est.color }}>
                                {fechaVenc(a)}
                              </span>
                            ) : (
                              <span className={s.emptyState} style={{fontSize:"0.85rem"}}>—</span>
                            )}
                          </td>

                          {/* Días restantes */}
                          <td>
                            {dias === null ? (
                              <span className={s.emptyState} style={{fontSize:"0.85rem"}}>—</span>
                            ) : (
                              <span className={`badge px-2 py-1 fw-bold ${s.diasBadge}`}
                                style={{
                                  background: est.bg,
                                  color: est.color,
                                }}
                              >
                                {dias < 0 ? `−${Math.abs(dias)}d` : `${dias}d`}
                              </span>
                            )}
                          </td>

                          {/* Estado membresía */}
                          <td>
                            <span className={`badge px-3 py-1 ${s.estadoBadge}`}
                              style={{ background: est.bg, color: est.color }}
                            >
                              {est.label === "Al día"          && "✅ "}
                              {est.label === "Por vencer"      && "⏳ "}
                              {est.label === "Vencido"         && "🔴 "}
                              {est.label === "Sin registro"    && "⚪ "}
                              {est.label}
                            </span>
                          </td>

                          {/* Acceso */}
                          <td>
                            {vencido ? (
                              <span className={`badge ${s.accesoBadge}`} style={{background:"rgba(239,68,68,0.15)",color:"#ef4444"}}>
                                🔒 Inactivo
                              </span>
                            ) : (
                              <span className={`badge ${s.accesoBadge}`} style={{background:"rgba(34,197,94,0.15)",color:"#22c55e"}}>
                                🟢 Activo
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="text-center" style={{paddingRight:"1rem"}}>
                            <div className="d-flex gap-1 justify-content-center">
                              {/* Historial */}
                              {pagosDeAfiliado(a).length > 0 && (
                                <button className={s.btnOutline}
                                  id={`btn-historial-${getId(a)}`}
                                  title="Ver historial de pagos"
                                  onClick={() => setHistModal(a)}
                                >
                                  🧾
                                </button>
                              )}
                              {/* Registrar pago */}
                              <button className={`btn btn-sm fw-semibold text-white ${s.btnPago}`}
                                id={`btn-pago-${getId(a)}`}
                                title="Registrar pago en efectivo"
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
              <div className={s.tableCardFooter}>
                <span>✅ Al día: <strong>{afiliados.filter((a) => { const d = diasRestantes(fechaVenc(a)); return d !== null && d > 10; }).length}</strong></span>
                <span className="ms-3">⏳ Por vencer: <strong>{kpis.porVencer}</strong></span>
                <span className="ms-3">🔴 En mora: <strong>{kpis.mora}</strong></span>
                <span className="ms-3">⚪ Sin registro: <strong>{afiliados.filter((a) => !fechaVenc(a)).length}</strong></span>
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
              <div className={`border-0 shadow-lg ${s.modalContent}`}>
                {/* Header */}
                <div className={`modal-header text-white border-0 ${s.modalHeaderAzul}`}>
                  <h5 className="modal-title">💵 Registrar Pago en Efectivo</h5>
                  <button
                    className="btn-close btn-close-white"
                    onClick={() => !saving && setPagoModal(null)}
                    disabled={saving}
                  />
                </div>

                <div className={`modal-body py-4 ${s.modalBody}`}>
                  {pagoError && (
                    <div className={s.alertDanger} style={{marginBottom:"0.75rem",padding:"0.4rem 0.75rem"}}>
                      <small>⚠️ {pagoError}</small>
                    </div>
                  )}

                  {/* Info afiliado */}
                  <div className={`rounded-3 p-3 mb-4 d-flex align-items-center gap-3 ${s.afiliadoBox}`}>
                    <div className={s.avatarModal}
                      style={{
                        background: `hsl(${(getId(pagoModal) * 47) % 360},65%,55%)`,
                      }}
                    >
                      {inicial(pagoModal)}
                    </div>
                    <div>
                      <div className="fw-bold" style={{color:"#e0e0e0"}}>{nombreCompleto(pagoModal)}</div>
                      <div className={s.headerSub} style={{fontSize:"0.85rem"}}>{pagoModal.correo || "—"}</div>
                    </div>
                  </div>

                  {/* Estado actual */}
                  <div className="row g-3 mb-4">
                    <div className="col-6">
                      <small className={`d-block text-uppercase fw-semibold ${s.dataLabel}`}>
                        Estado actual
                      </small>
                      <span className="badge px-2 py-1 mt-1" style={{ background: est.bg, color: est.color }}>
                        {est.label}
                        {dias !== null && ` (${dias < 0 ? `−${Math.abs(dias)}` : dias}d)`}
                      </span>
                    </div>
                    <div className="col-6">
                      <small className={`d-block text-uppercase fw-semibold ${s.dataLabel}`}>
                        Vencimiento actual
                      </small>
                      <div className={s.dataValue} style={{marginTop:"0.25rem"}}>{vencActual || "Sin registro"}</div>
                    </div>
                  </div>

                  {/* Confirmación */}
                  <div className={s.confirmBox}>
                    <div className="fs-4 mb-2">💵</div>
                    <p className="mb-2 fw-semibold" style={{color:"#e0e0e0"}}>
                      ¿Confirmas que el afiliado ha pagado la mensualidad en efectivo?
                    </p>
                    <p className={s.headerSub} style={{fontSize:"0.85rem",marginBottom:"0.75rem"}}>
                      Monto: <strong style={{color:"#a78bfa"}}>$80,000 COP</strong> · Método: <strong style={{color:"#a78bfa"}}>Efectivo</strong>
                    </p>
                    <div className="d-flex justify-content-center align-items-center gap-2">
                      <span className={s.headerSub} style={{fontSize:"0.85rem"}}>Nuevo vencimiento:</span>
                      <span className={`badge px-3 py-2 ${s.vencBadge}`}>
                        📅 {nuevaFecha}
                      </span>
                    </div>
                    {dias < 0 && (
                      <div className="mt-2">
                        <span className={s.moraBadge} style={{background:"rgba(234,179,8,0.15)",color:"#eab308",padding:"0.25rem 0.6rem",borderRadius:"6px"}}>
                          ⚠️ Afiliado en mora — se reactivará automáticamente
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`modal-footer pt-3 ${s.modalFooter}`}>
                  <button
                    type="button"
                    className={s.btnOutline}
                    onClick={() => setPagoModal(null)}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirmar-pago-efectivo"
                    type="button"
                    className={`btn btn-sm text-white fw-semibold px-4 ${s.btnConfirmar}`}
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
            <div className={`border-0 shadow-lg ${s.modalContent}`}>
              <div className={`modal-header text-white border-0 ${s.modalHeaderOscuro}`}>
                <h5 className="modal-title">
                  🧾 Historial de Pagos — {nombreCompleto(histModal)}
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setHistModal(null)} />
              </div>

              <div className={`modal-body p-0 ${s.modalBody}`}>
                {pagosDeAfiliado(histModal).length === 0 ? (
                  <div className={`text-center py-5 ${s.emptyState}`}>Sin pagos registrados.</div>
                ) : (
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th style={{paddingLeft:"1.25rem"}}>Fecha pago</th>
                        <th className="text-center">Estado</th>
                        <th className="text-center">Monto</th>
                        <th className="text-center" style={{paddingRight:"1rem"}}>Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagosDeAfiliado(histModal).map((p, i) => (
                        <tr key={i}>
                          <td style={{paddingLeft:"1.25rem",color:"#e0e0e0"}} className="small fw-semibold">{p.fecha_pago}</td>
                          <td className="text-center">
                            <span className={s.accesoBadge} style={{background:"rgba(34,197,94,0.15)",color:"#22c55e",padding:"0.25rem 0.6rem",borderRadius:"6px"}}>
                              💵 {p.estado || "Pagado"}
                            </span>
                          </td>
                          <td className="text-center small fw-semibold" style={{color:"#22c55e"}}>
                            ${Number(p.valor_pagado || 80000).toLocaleString("es-CO")}
                          </td>
                          <td className="text-center" style={{paddingRight:"1rem"}}>
                            <span className={s.headerSub} style={{fontSize:"0.7rem"}}>{p.fecha_vencimiento || "—"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className={`modal-footer ${s.modalFooter}`}>
                <div className={s.headerSub} style={{fontSize:"0.8rem"}}>
                  Total registros: <strong style={{color:"#e0e0e0"}}>{pagosDeAfiliado(histModal).length}</strong>
                  &nbsp;·&nbsp; Total recaudado:&nbsp;
                  <strong style={{color:"#22c55e"}}>
                    ${pagosDeAfiliado(histModal).reduce((s, p) => s + Number(p.valor_pagado || 80000), 0).toLocaleString("es-CO")} COP
                  </strong>
                </div>
                <button className={s.btnOutline} onClick={() => setHistModal(null)}>
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
