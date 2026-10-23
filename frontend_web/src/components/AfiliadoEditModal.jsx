import { nombreCompleto } from "../utils/afiliadoHelpers";

const ESTADOS    = ["Activo", "Inactivo", "Pendiente"];
const PLANES     = ["Básico", "Premium", "VIP"];
const OBJETIVOS  = ["Pérdida de grasa", "Aumento de masa", "Mantenimiento"];
const NIVELES    = ["Principiante", "Intermedio", "Avanzado"];

export default function AfiliadoEditModal({
  editModal,
  formEdit,
  setFormEdit,
  savingEdit,
  editError,
  onSave,
  onCancel
}) {
  if (!editModal) return null;

  return (
    <div
      className="modal d-block"
      style={{ background: "rgba(0,0,0,0.55)", zIndex: 1050 }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal de edición de afiliado"
      onClick={(e) => { if (!savingEdit && e.target === e.currentTarget) onCancel(); }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === "Escape" || e.key === "Enter") && !savingEdit) onCancel();
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <div className="modal-header text-white border-0"
            style={{ background: "linear-gradient(135deg,#e94560,#c62a47)" }}>
            <h5 className="modal-title">✏️ Editar — {nombreCompleto(editModal)}</h5>
            <button type="button" className="btn-close btn-close-white"
              onClick={() => !savingEdit && onCancel()} />
          </div>
          <form onSubmit={onSave}>
            <div className="modal-body">
              {editError && <div className="alert alert-danger py-2"><small>⚠️ {editError}</small></div>}
              <div className="row g-3">
                {[
                  { label: "Nombres",   key: "nombres",   type: "text"   },
                  { label: "Apellidos", key: "apellidos", type: "text"   },
                  { label: "Correo",    key: "correo",    type: "email"  },
                  { label: "Teléfono", key: "telefono",   type: "text"   },
                  { label: "Documento", key: "documento", type: "text"   },
                ].map(({ label, key, type }) => (
                  <div key={key} className="col-md-6">
                    <label className="form-label small fw-semibold" htmlFor={`editar-afiliado-${key}`}>{label}</label>
                    <input id={`editar-afiliado-${key}`} type={type} className="form-control" value={formEdit[key]}
                      onChange={(e) => setFormEdit({ ...formEdit, [key]: e.target.value })} />
                  </div>
                ))}
                <div className="col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="editar-afiliado-estado">Estado</label>
                  <select id="editar-afiliado-estado" className="form-select" value={formEdit.estado}
                    onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}>
                    {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="editar-afiliado-plan">Plan membresía</label>
                  <select id="editar-afiliado-plan" className="form-select" value={formEdit.plan_membresia}
                    onChange={(e) => setFormEdit({ ...formEdit, plan_membresia: e.target.value })}>
                    {PLANES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="editar-afiliado-objetivo">Objetivo físico</label>
                  <select id="editar-afiliado-objetivo" className="form-select" value={formEdit.objetivo_fisico}
                    onChange={(e) => setFormEdit({ ...formEdit, objetivo_fisico: e.target.value })}>
                    {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold" htmlFor="editar-afiliado-nivel">Nivel</label>
                  <select id="editar-afiliado-nivel" className="form-select" value={formEdit.nivel_experiencia}
                    onChange={(e) => setFormEdit({ ...formEdit, nivel_experiencia: e.target.value })}>
                    {NIVELES.map((n) => <option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-outline-secondary btn-sm"
                onClick={onCancel} disabled={savingEdit}>
                Cancelar
              </button>
              <button id="btn-guardar-edicion" type="submit"
                className="btn btn-sm text-white fw-semibold px-4"
                style={{ background: "linear-gradient(135deg,#e94560,#c62a47)", border: "none" }}
                disabled={savingEdit}>
                {savingEdit ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : "💾 Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
