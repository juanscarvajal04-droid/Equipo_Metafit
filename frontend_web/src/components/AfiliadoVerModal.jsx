import { useState } from "react";
import { nombreCompleto, inicial, cicloActivo } from "../utils/afiliadoHelpers";

const TABS_RECEPCIONISTA = ["Estado de Cuenta"];
const TABS_ENTRENADOR    = ["Progreso Físico", "Ciclo Activo"];
const TABS_ADMIN         = ["Estado de Cuenta", "Progreso Físico", "Ciclo Activo"];

const badgeEstado = (e) => {
  const map = { activo: "success", inactivo: "danger", pendiente: "warning" };
  const c   = map[(e || "").toLowerCase()] || "secondary";
  return <span className={`badge bg-${c}`}>{e || "—"}</span>;
};

export default function AfiliadoVerModal({ afiliado, role, onClose, onEdit }) {
  const [verTab, setVerTab] = useState(0);

  if (!afiliado) return null;

  const tabs = role === "Recepcionista" ? TABS_RECEPCIONISTA
             : role === "Entrenador"    ? TABS_ENTRENADOR
             :                           TABS_ADMIN;

  return (
    <div className="modal d-block" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1050 }} onClick={onClose}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className="modal-header text-white border-0"
            style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)" }}>
            <h5 className="modal-title">👤 {nombreCompleto(afiliado)}</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Datos básicos */}
            <div className="row g-2 mb-3">
              {[
                { label: "Correo",     v: afiliado.correo },
                { label: "Teléfono",   v: afiliado.telefono },
                { label: "Documento",  v: afiliado.documento },
                { label: "Sexo",       v: afiliado.sexo },
                { label: "Nacimiento", v: afiliado.fecha_nacimiento ? new Date(afiliado.fecha_nacimiento).toLocaleDateString("es-CO") : "—" },
                { label: "Estatura",   v: afiliado.estatura_cm ? `${afiliado.estatura_cm} cm` : "—" },
                { label: "Objetivo",   v: afiliado.objetivo_fisico },
                { label: "Nivel",      v: afiliado.nivel_experiencia },
                { label: "Días/sem",   v: afiliado.disponibilidad_semanal_dias },
                { label: "Plan",       v: afiliado.plan_membresia || "Básico" },
              ].map((f) => (
                <div key={f.label} className="col-6 col-md-4">
                  <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.68rem" }}>{f.label}</small>
                  <span className="small fw-semibold">{f.v || "—"}</span>
                </div>
              ))}
            </div>

            {/* Pestañas por rol */}
            <ul className="nav nav-tabs mb-3">
              {tabs.map((tab, i) => (
                <li key={tab} className="nav-item">
                  <button className={`nav-link ${verTab === i ? "active" : ""}`} onClick={() => setVerTab(i)}>
                    {tab}
                  </button>
                </li>
              ))}
            </ul>

            {/* TAB: Estado de Cuenta */}
            {tabs[verTab] === "Estado de Cuenta" && (
              <div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="card border-0 bg-light text-center p-3">
                      <div className="small text-muted text-uppercase fw-semibold mb-1">Estado actual</div>
                      {badgeEstado(afiliado.estado || afiliado.estado_afiliacion)}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 bg-light text-center p-3">
                      <div className="small text-muted text-uppercase fw-semibold mb-1">Plan</div>
                      <strong>{afiliado.plan_membresia || "Básico"}</strong>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 bg-light text-center p-3">
                      <div className="small text-muted text-uppercase fw-semibold mb-1">Desde</div>
                      <strong>{afiliado.fecha_registro ? new Date(afiliado.fecha_registro).toLocaleDateString("es-CO") : "—"}</strong>
                    </div>
                  </div>
                </div>
                {afiliado.restricciones?.length > 0 && (
                  <div className="mt-3">
                    <h6 className="fw-bold">⚠️ Restricciones médicas</h6>
                    {afiliado.restricciones.map((r) => (
                      <div key={r.id_restriccion} className="alert alert-warning py-2 mb-2">
                        <strong>{r.nombre}</strong>
                        <span className="badge bg-warning text-dark ms-2">{r.tipo}</span>
                        {r.efecto_relevante && <div className="small mt-1 text-muted">{r.efecto_relevante}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: Progreso Físico */}
            {tabs[verTab] === "Progreso Físico" && (() => {
              const ciclo = cicloActivo(afiliado);
              const progresos = ciclo?.progreso_fisico || [];
              return progresos.length === 0
                ? <p className="text-muted text-center py-3">Sin registros de progreso en el ciclo activo.</p>
                : progresos.map((p, i) => (
                  <div key={i} className="border rounded p-3 mb-2">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <strong className="small">{p.fecha_registro}</strong>
                      <span className="badge bg-primary bg-opacity-10 text-primary">{p.peso_kg} kg</span>
                    </div>
                    <div className="row g-2 text-center">
                      {[
                        { label: "% Grasa", v: `${p.porcentaje_grasa}%` },
                        { label: "Cintura",  v: `${p.medidas_cm?.cintura} cm` },
                        { label: "Brazo",    v: `${p.medidas_cm?.brazo} cm` },
                        { label: "Pierna",   v: `${p.medidas_cm?.pierna} cm` },
                      ].map((f) => (
                        <div key={f.label} className="col-3">
                          <small className="text-muted d-block" style={{ fontSize: "0.68rem" }}>{f.label}</small>
                          <strong className="small">{f.v || "—"}</strong>
                        </div>
                      ))}
                    </div>
                    {p.observaciones && <small className="text-muted mt-1 d-block">📝 {p.observaciones}</small>}
                  </div>
                ));
            })()}

            {/* TAB: Ciclo Activo */}
            {tabs[verTab] === "Ciclo Activo" && (() => {
              const ciclo = cicloActivo(afiliado);
              if (!ciclo) return <p className="text-muted text-center py-3">Sin ciclo activo.</p>;
              return (
                <div>
                  <div className="d-flex gap-2 mb-3 flex-wrap">
                    <span className="badge bg-primary">Ciclo {ciclo.numero_ciclo}</span>
                    <small className="text-muted">{ciclo.fecha_inicio} → {ciclo.fecha_fin}</small>
                  </div>
                  {ciclo.plan_nutricional && (
                    <div className="mb-3">
                      <h6 className="fw-bold mb-2">🥗 Plan Nutricional</h6>
                      <p className="small text-muted mb-2">
                        {ciclo.plan_nutricional.calorias_estimadas} kcal · {ciclo.plan_nutricional.num_comidas_diarias} comidas/día
                      </p>
                    </div>
                  )}
                  {ciclo.plan_entrenamiento?.rutinas?.length > 0 && (
                    <div>
                      <h6 className="fw-bold mb-2">🏋️ Rutinas</h6>
                      {ciclo.plan_entrenamiento.rutinas.map((r) => (
                        <div key={r.dia_numero} className="border rounded p-2 mb-2">
                          <div className="fw-semibold small mb-1">{r.nombre}</div>
                          {r.ejercicios?.map((ej, i) => (
                            <div key={i} className="d-flex justify-content-between small text-muted">
                              <span>{ej.nombre}</span>
                              <span>{ej.series}×{ej.repeticiones}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          <div className="modal-footer border-0">
            {role !== "Entrenador" && (
              <button className="btn btn-outline-warning btn-sm"
                onClick={() => { onClose(); onEdit(afiliado); }}>✏️ Editar</button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
