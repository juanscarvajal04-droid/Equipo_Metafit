import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import StatsCard from "../components/common/StatsCard";
import ProgresoPesoChart from "../components/graficos/ProgresoPesoChart";
import ProgresoVolumenChart from "../components/graficos/ProgresoVolumenChart";
import { TIPO_ICONO } from "../services/restriccionService";
import { fetchAfiliado, ultimoRegistroFisico } from "../services/progresoService";
import s from "./ProgresoAfiliado.module.css";

const nombreCompleto = (a) => [a?.nombres, a?.apellidos].filter(Boolean).join(" ") || "Sin nombre";

export default function ProgresoAfiliado() {
  const { authAxios } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [estado, setEstado] = useState({ loading: true, error: "", afiliado: null, historial: [] });

  useEffect(() => {
    let activo = true;

    (async () => {
      try {
        const [perfil, progreso] = await Promise.all([
          fetchAfiliado(id),
          authAxios.get(`/afiliados/${id}/progreso`),
        ]);
        if (!activo) return;
        setEstado({
          loading: false,
          error: "",
          afiliado: perfil,
          historial: Array.isArray(progreso.data) ? progreso.data : [],
        });
      } catch (err) {
        if (!activo) return;
        setEstado((st) => ({
          ...st,
          loading: false,
          error: err.response?.data?.error || err.message || "Error al cargar el progreso",
        }));
      }
    })();

    return () => { activo = false; };
  }, [id, authAxios]);

  const { loading, error, afiliado, historial } = estado;
  const ul = ultimoRegistroFisico(historial);
  const ciclo = afiliado?.ciclo_activo || null;
  const restricciones = Array.isArray(afiliado?.restricciones) ? afiliado.restricciones : [];
  const nombre = nombreCompleto(afiliado);
  const diferenciaPeso = historial.length >= 2
    ? Number(historial[0].peso_kg) - Number(historial[historial.length - 1].peso_kg)
    : null;

  if (loading) {
    return (
      <AppLayout>
        <div className={s.loadingWrap}>Cargando progreso del afiliado...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={s.page}>
        <button type="button" className={s.linkBack} onClick={() => navigate("/afiliados")}>
          ← Volver a Afiliados
        </button>

        {error ? (
          <div className={s.emptyState}>{error}</div>
        ) : (
          <>
            <div className={s.headerRow}>
              <div>
                <h1 className={s.headerTitle}>📊 Progreso de {nombre}</h1>
                <p className={s.headerSub}>
                  {afiliado?.correo || ""} · {afiliado?.objetivo_fisico || "Sin objetivo"} · {afiliado?.nivel_experiencia || "—"}
                </p>
              </div>
            </div>

            <div className={s.kpiRow}>
              <StatsCard
                title="Peso actual"
                value={ul.peso != null ? `${ul.peso} kg` : "—"}
                icono="⚖️"
                color="primary"
                subtitle={
                  diferenciaPeso != null && !Number.isNaN(diferenciaPeso)
                    ? `${diferenciaPeso > 0 ? "+" : ""}${diferenciaPeso.toFixed(1)} kg vs inicio`
                    : ul.fecha ? `Último: ${new Date(ul.fecha).toLocaleDateString("es-CO")}` : ""
                }
              />
              <StatsCard
                title="IMC"
                value={ul.imc != null ? ul.imc : "—"}
                icono="📐"
                color="info"
                subtitle={afiliado?.estatura_cm ? `Estatura ${afiliado.estatura_cm} cm` : ""}
              />
              <StatsCard
                title="% grasa"
                value={ul.grasa != null ? `${ul.grasa}%` : "—"}
                icono="🥩"
                color="warning"
              />
              <StatsCard
                title="Registros físicos"
                value={historial.length}
                icono="📈"
                color="success"
              />
            </div>

            <div className={s.chartRow}>
              <div className={s.chartCard}>
                <h6 className={s.chartTitle}>⚖️ Evolución de Peso e IMC</h6>
                <ProgresoPesoChart historial={historial} />
              </div>
              <div className={s.chartCard}>
                <h6 className={s.chartTitle}>📏 Medidas corporales y % grasa</h6>
                <ProgresoVolumenChart historial={historial} />
              </div>
            </div>

            {(ciclo || restricciones.length > 0) && (
              <div className={s.infoCard}>
                <h6 className={s.sectionTitle}>ℹ️ Información del afiliado</h6>
                <div className={s.infoGrid}>
                  {ciclo && (
                    <div className={s.infoItem}>
                      <div className={s.infoLabel}>Ciclo activo</div>
                      <span className={s.cycleBadge}>🔄 Ciclo {ciclo.numero_ciclo || ""}</span>
                      <div className={s.infoValue} style={{ marginTop: 4 }}>
                        {new Date(ciclo.fecha_inicio).toLocaleDateString("es-CO")} →{" "}
                        {new Date(ciclo.fecha_fin).toLocaleDateString("es-CO")}
                      </div>
                      {ciclo.dias_restantes != null && (
                        <div style={{ fontSize: "0.78rem", color: "var(--mf-muted)" }}>
                          {ciclo.dias_restantes} días restantes
                        </div>
                      )}
                    </div>
                  )}
                  {afiliado?.disponibilidad_semanal_dias && (
                    <div className={s.infoItem}>
                      <div className={s.infoLabel}>Disponibilidad</div>
                      <div className={s.infoValue}>{afiliado.disponibilidad_semanal_dias} días/semana</div>
                    </div>
                  )}
                  {afiliado?.estado_afiliacion && (
                    <div className={s.infoItem}>
                      <div className={s.infoLabel}>Estado</div>
                      <div className={s.infoValue}>{afiliado.estado_afiliacion}</div>
                    </div>
                  )}
                </div>

                {restricciones.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div className={s.infoLabel} style={{ marginBottom: 8 }}>Restricciones médicas</div>
                    <div className={s.badgesWrap}>
                      {restricciones.map((r) => (
                        <span key={r.id_restriccion ?? r.id} className={s.badge}>
                          {TIPO_ICONO[r.tipo] || "📌"} {r.nombre_restriccion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}