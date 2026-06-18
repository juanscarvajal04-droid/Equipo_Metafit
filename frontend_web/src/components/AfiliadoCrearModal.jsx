import styles from "./AfiliadoCrearModal.module.css";

const ESTADOS    = ["Activo", "Inactivo", "Suspendido"];
const PLANES     = ["Básico", "Premium", "VIP"];

const OBJETIVOS  = ["Pérdida de grasa", "Aumento de masa", "Mantenimiento"];
const NIVELES    = ["Principiante", "Intermedio", "Avanzado"];
const SEXOS      = ["Masculino", "Femenino", "Otro"];
const MUSCULOS   = ["Pecho", "Espalda", "Piernas", "Glúteos", "Hombros", "Bíceps", "Tríceps", "Abdomen"];

export default function AfiliadoCrearModal({
  crearModal,
  formNuevo,
  setFormNuevo,
  savingNew,
  newError,
  onSubmit,
  onCancel
}) {
  if (!crearModal) return null;

  return (
    <div className={`modal d-block ${styles.overlay}`}
      onClick={() => !savingNew && onCancel()}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow">
          <div className={`modal-header text-white border-0 ${styles.modalHeader}`}>
            <h5 className="modal-title">➕ Nuevo Afiliado</h5>
            <button type="button" className="btn-close btn-close-white"
              onClick={() => !savingNew && onCancel()} />
          </div>
          <form onSubmit={onSubmit}>
            <div className={`modal-body ${styles.modalBody}`}>
              {newError && <div className="alert alert-danger py-2"><small>⚠️ {newError}</small></div>}

              <h6 className="fw-bold text-muted text-uppercase small mb-3">👤 Datos personales</h6>
              <div className="row g-3 mb-4">
                {[
                  { label: "Nombres *",    key: "nombres",    type: "text",  required: true  },
                  { label: "Apellidos *",  key: "apellidos",  type: "text",  required: true  },
                  { label: "Email",        key: "correo",     type: "email", required: false },
                  { label: "Teléfono",     key: "telefono",   type: "text",  required: false },
                  { label: "DNI / Doc. *", key: "documento",  type: "text",  required: true  },
                  { label: "Nacimiento",   key: "fecha_nacimiento", type: "date", required: false },
                ].map(({ label, key, type, required }) => (
                  <div key={key} className="col-md-6">
                    <label className="form-label small fw-semibold">{label}</label>
                    <input type={type} className="form-control" required={required}
                      value={formNuevo[key]}
                      onChange={(e) => setFormNuevo({ ...formNuevo, [key]: e.target.value })} />
                  </div>
                ))}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Sexo</label>
                  <select className="form-select" value={formNuevo.sexo}
                    onChange={(e) => setFormNuevo({ ...formNuevo, sexo: e.target.value })}>
                    {SEXOS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold">Estatura (cm)</label>
                  <input type="number" step="0.1" className="form-control" value={formNuevo.estatura_cm}
                    onChange={(e) => setFormNuevo({ ...formNuevo, estatura_cm: e.target.value })} />
                </div>
                <div className="col-12">
                  <label className="form-label small fw-semibold">Dirección</label>
                  <input type="text" className="form-control" value={formNuevo.direccion}
                    onChange={(e) => setFormNuevo({ ...formNuevo, direccion: e.target.value })} />
                </div>
              </div>

              <h6 className="fw-bold text-muted text-uppercase small mb-3">🏋️ Plan de membresía</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Plan *</label>
                  <select className="form-select" required value={formNuevo.plan_membresia}
                    onChange={(e) => setFormNuevo({ ...formNuevo, plan_membresia: e.target.value })}>
                    {PLANES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Estado inicial</label>
                  <select className="form-select" value={formNuevo.estado}
                    onChange={(e) => setFormNuevo({ ...formNuevo, estado: e.target.value })}>
                    {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Objetivo físico</label>
                  <select className="form-select" value={formNuevo.objective_fisico || formNuevo.objetivo_fisico}
                    onChange={(e) => setFormNuevo({ ...formNuevo, objetivo_fisico: e.target.value })}>
                    {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Nivel</label>
                  <select className="form-select" value={formNuevo.nivel_experiencia}
                    onChange={(e) => setFormNuevo({ ...formNuevo, nivel_experiencia: e.target.value })}>
                    {NIVELES.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Músculo prioritario</label>
                  <select className="form-select" value={formNuevo.grupo_muscular_prioritario}
                    onChange={(e) => setFormNuevo({ ...formNuevo, grupo_muscular_prioritario: e.target.value })}>
                    {MUSCULOS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label small fw-semibold">Días disponibles/sem</label>
                  <input type="number" min="1" max="7" className="form-control"
                    value={formNuevo.disponibilidad_semanal_dias}
                    onChange={(e) => setFormNuevo({ ...formNuevo, disponibilidad_semanal_dias: parseInt(e.target.value) || 3 })} />
                </div>
              </div>

              <h6 className="fw-bold text-muted text-uppercase small mb-3 mt-4">⚠️ Restricciones Médicas</h6>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label small fw-semibold">
                    Restricciones médicas / condiciones
                    <span className="text-muted fw-normal ms-2">(una por línea, opcional)</span>
                  </label>
                  <textarea
                    id="restricciones-medicas-afiliado"
                    className="form-control"
                    rows={3}
                    placeholder="Ej: Diabetes tipo 2&#10;Hipertensión&#10;Alergia a lactosa"
                    value={formNuevo.restricciones_medicas}
                    onChange={(e) => setFormNuevo({ ...formNuevo, restricciones_medicas: e.target.value })}
                  />
                  <div className="form-text">
                    💡 Escribe cada condición en una línea separada. Se registrarán como alertas médicas del afiliado.
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline-secondary btn-sm"
                onClick={onCancel} disabled={savingNew}>
                Cancelar
              </button>
              <button id="btn-confirmar-crear" type="submit"
                className={`btn btn-sm text-white fw-semibold px-4 ${styles.btnConfirmar}`}
                disabled={savingNew}>
                {savingNew ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : "✅ Crear afiliado"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
