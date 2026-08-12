import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto, inicial } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import s from "./PagosView.module.css";

const diasRestantes = (fechaStr) => {
  if (!fechaStr) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const vence = new Date(fechaStr); vence.setHours(0, 0, 0, 0);
  return Math.round((vence - hoy) / (1000 * 60 * 60 * 24));
};

const sumarDias = (fechaStr, dias) => {
  const base = fechaStr ? new Date(fechaStr) : new Date();
  base.setDate(base.getDate() + dias);
  return base.toISOString().split("T")[0];
};

const hoyISO = () => new Date().toISOString().split("T")[0];

const estadoMembresia = (dias) => {
  if (dias === null) return { label: "Sin registro", color: "var(--mf-muted)", bg: "#94a3b818" };
  if (dias < 0) return { label: "Vencido", color: "#e94560", bg: "#e9456018" };
  if (dias <= 10) return { label: "Por vencer", color: "#f59e0b", bg: "#f59e0b18" };
  return { label: "Al d\u00eda", color: "#059669", bg: "#05966918" };
};

const fechaVenc = (a) => a?.fecha_vencimiento || a?.ultimo_vencimiento || null;

const avatarColor = (nombre) => {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
};

export default function PagosView() {
  const { authAxios } = useAuth();
  const { showToast } = useToast();
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagoModal, setPagoModal] = useState(null);
  const [histModal, setHistModal] = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await authAxios.get("/afiliados");
        setAfiliados(data);
      } catch (err) {
        console.error("[PagosView]", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authAxios]);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return afiliados;
    const q = searchTerm.toLowerCase();
    return afiliados.filter((a) => nombreCompleto(a).toLowerCase().includes(q));
  }, [afiliados, searchTerm]);

  const kpiCounts = useMemo(() => {
    let alDia = 0, porVencer = 0, vencido = 0, sinRegistro = 0;
    afiliados.forEach((a) => {
      const fv = fechaVenc(a);
      const dias = diasRestantes(fv);
      if (dias === null) sinRegistro++;
      else if (dias < 0) vencido++;
      else if (dias <= 10) porVencer++;
      else alDia++;
    });
    return { total: afiliados.length, alDia, porVencer, vencido, sinRegistro };
  }, [afiliados]);

  const handlePago = async () => {
    if (!pagoModal) return;
    setSaving(true);
    try {
      const id = getId(pagoModal);
      await authAxios.post(`/afiliados/${id}/pagos`, { valor: 80000 });
      showToast("Pago registrado exitosamente", "success");
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(data);
      setPagoModal(null);
      window.dispatchEvent(new CustomEvent("pago-registrado"));
    } catch (err) {
      console.error("[handlePago]", err);
      showToast(err.response?.data?.message || "Error al registrar pago", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleHistorial = async (afiliado) => {
    try {
      const id = getId(afiliado);
      const { data } = await authAxios.get(`/afiliados/${id}/pagos`);
      setHistorialPagos(data);
      setHistModal(afiliado);
    } catch (err) {
      console.error("[handleHistorial]", err);
      showToast("Error al cargar historial", "error");
    }
  };

  const renderBadge = (dias) => {
    const e = estadoMembresia(dias);
    if (e.label === "Al d\u00eda") return <span className={s.badgePagado}>{e.label}</span>;
    if (e.label === "Por vencer") return <span className={s.badgePendiente}>{e.label}</span>;
    if (e.label === "Vencido") return <span className={s.badgeVencido}>{e.label}</span>;
    return <span className={s.badgePendiente}>{e.label}</span>;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className={s.page}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "70vh" }}>
            <div style={{ width: 32, height: 32, border: "3px solid var(--mf-border)", borderTopColor: "#e31c25", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={s.page}>
        <div style={{ padding: "1.5rem 1rem", maxWidth: 1200, margin: "0 auto" }}>
          <h1 className={s.headerTitle}>{'\uD83D\uDCB0'} Pagos</h1>
          <p className={s.headerSub}>Registro de pagos de afiliados</p>

          <div style={{ margin: "1rem 0" }}>
            <input
              type="text"
              className={s.searchInput}
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", maxWidth: 400, padding: "0.5rem 0.75rem" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "var(--mf-surface)", border: "1px solid var(--mf-border)", borderRadius: 12, padding: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--mf-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Total</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--mf-text)" }}>{kpiCounts.total}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--mf-muted)" }}>Afiliados</div>
            </div>
            <div style={{ background: "var(--mf-surface)", border: "1px solid var(--mf-border)", borderRadius: 12, padding: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--mf-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Al d\u00eda</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#22c55e" }}>{kpiCounts.alDia}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--mf-muted)" }}>Membres\u00eda activa</div>
            </div>
            <div style={{ background: "var(--mf-surface)", border: "1px solid var(--mf-border)", borderRadius: 12, padding: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--mf-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Por vencer</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b" }}>{kpiCounts.porVencer}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--mf-muted)" }}>{'\u2264'} 10 d\u00edas</div>
            </div>
            <div style={{ background: "var(--mf-surface)", border: "1px solid var(--mf-border)", borderRadius: 12, padding: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "var(--mf-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Vencidos</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ef4444" }}>{kpiCounts.vencido}</div>
              <div style={{ fontSize: "0.72rem", color: "var(--mf-muted)" }}>Sin membres\u00eda</div>
            </div>
          </div>

          <div className={s.tableCard}>
            <div className={s.tableCardHeader}>
              <span style={{ fontWeight: 600, color: "var(--mf-text)", fontSize: "0.9rem" }}>{'\uD83E\uDDFE'} Afiliados</span>
              <span style={{ color: "var(--mf-muted)", fontSize: "0.78rem" }}>{filtered.length} registro(s)</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Afiliado</th>
                    <th>Estado membres\u00eda</th>
                    <th>\u00DAltimo pago</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                        <span className={s.emptyState}>No se encontraron afiliados</span>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a, i) => {
                      const fv = fechaVenc(a);
                      const dias = diasRestantes(fv);
                      const ultimoPago = a.pagos?.length > 0 ? a.pagos[a.pagos.length - 1] : a.ultimo_pago || null;
                      const nombre = nombreCompleto(a);
                      const ac = avatarColor(nombre);
                      return (
                        <tr key={getId(a)}>
                          <td style={{ color: "var(--mf-muted)", fontWeight: 500 }}>{i + 1}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{inicial(a)}</div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{nombre}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--mf-muted)" }}>{a.email || a.correo || ""}</div>
                              </div>
                            </div>
                          </td>
                          <td>{renderBadge(dias)}</td>
                          <td>
                            {ultimoPago ? (
                              <div>
                                <div style={{ fontSize: "0.78rem" }}>{new Date(ultimoPago.fecha_pago).toLocaleDateString("es-CO")}</div>
                                <div style={{ fontSize: "0.72rem", color: "var(--mf-muted)" }}>${Number(ultimoPago.valor_pagado || 0).toLocaleString("es-CO")}</div>
                              </div>
                            ) : (
                              <span style={{ color: "var(--mf-muted)", fontSize: "0.78rem" }}>{'\u2014'}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.35rem" }}>
                              <button type="button" className={s.btnOutline} onClick={() => handleHistorial(a)} title="Ver historial">{'\uD83E\uDDFE'}</button>
                              <button type="button" className={s.btnPrimary} onClick={() => setPagoModal(a)} title="Registrar pago">{'\uD83D\uDCB5'}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {pagoModal && (
          <div className={s.modalOverlay} onClick={() => !saving && setPagoModal(null)}>
            <div className={s.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={s.modalHeader}>
                <h5 className={s.modalTitle}>Registrar Pago en Efectivo</h5>
                <button type="button" className={s.btnOutline} onClick={() => setPagoModal(null)}>{'\u2715'}</button>
              </div>
              <div className={s.modalBody}>
                <div className={s.afiliadoBox} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div className={s.avatarModal} style={{ background: avatarColor(nombreCompleto(pagoModal)) }}>{inicial(pagoModal)}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{nombreCompleto(pagoModal)}</div>
                    <div className={s.pagoInfo}>ID: {getId(pagoModal)}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div>
                    <div className={s.dataLabel}>Estado membres\u00eda</div>
                    <div className={s.dataValue}>{renderBadge(diasRestantes(fechaVenc(pagoModal)))}</div>
                  </div>
                  <div>
                    <div className={s.dataLabel}>Vence</div>
                    <div className={s.dataValue}>
                      {fechaVenc(pagoModal) ? new Date(fechaVenc(pagoModal)).toLocaleDateString("es-CO") : "Sin registro"}
                    </div>
                  </div>
                </div>
                <div className={s.confirmBox}>
                  <div style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>{'\u00BF'}Registrar pago por valor de</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#22c55e" }}>$80,000 COP</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--mf-muted)", marginTop: "0.5rem" }}>
                    Nueva fecha de vencimiento:{' '}
                    <strong style={{ color: "var(--mf-text)" }}>
                      {new Date(sumarDias(fechaVenc(pagoModal), 30)).toLocaleDateString("es-CO")}
                    </strong>
                  </div>
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={() => setPagoModal(null)} disabled={saving}>Cancelar</button>
                <button type="button" className={s.btnConfirmar} onClick={handlePago} disabled={saving}>
                  {saving ? "Registrando..." : "\u2705 \u00A1Confirmar Pago!"}
                </button>
              </div>
            </div>
          </div>
        )}

        {histModal && (
          <div className={s.modalOverlay} onClick={() => setHistModal(null)}>
            <div className={s.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
              <div className={s.modalHeader}>
                <h5 className={s.modalTitle}>Historial de pagos</h5>
                <button type="button" className={s.btnOutline} onClick={() => setHistModal(null)}>{'\u2715'}</button>
              </div>
              <div className={s.modalBody}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                  <div className={s.avatarModal} style={{ background: avatarColor(nombreCompleto(histModal)) }}>{inicial(histModal)}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{nombreCompleto(histModal)}</div>
                    <div className={s.pagoInfo}>{historialPagos.length} pago(s) registrados</div>
                  </div>
                </div>
                {historialPagos.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2rem", color: "var(--mf-muted)" }}>
                    Este afiliado no tiene pagos registrados.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className={s.table}>
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Estado</th>
                          <th>Valor</th>
                          <th>Recepcionista</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historialPagos.map((p) => (
                          <tr key={p.id_pago || p.id}>
                            <td>{new Date(p.fecha_pago).toLocaleDateString("es-CO")}</td>
                            <td>
                              {p.estado === "Pagado" ? (
                                <span className={s.badgePagado}>Pagado</span>
                              ) : p.estado === "Pendiente" ? (
                                <span className={s.badgePendiente}>Pendiente</span>
                              ) : (
                                <span className={s.badgeVencido}>{p.estado || "Pagado"}</span>
                              )}
                            </td>
                            <td style={{ fontWeight: 600 }}>${Number(p.valor_pagado || 0).toLocaleString("es-CO")}</td>
                            <td style={{ color: "var(--mf-muted)", fontSize: "0.78rem" }}>
                              {p.nombres_recepcionista ? `${p.nombres_recepcionista} ${p.apellidos_recepcionista || ""}` : "\u2014"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={() => setHistModal(null)}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
