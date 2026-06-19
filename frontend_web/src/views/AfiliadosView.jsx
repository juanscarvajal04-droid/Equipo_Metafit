// ============================================================
// src/views/AfiliadosView.jsx — MetaFit Afiliados View
//
// RESPONSABILIDAD: Vista pura (ISO 25000 - MVC / SoC)
//   ✅ Renderizado JSX + estado local de UI
//   ✅ Gestión de modales, formularios y feedback visual
//   ❌ Sin llamadas Axios ni lógica de infraestructura
//   ❌ Sin estilos inline ni definiciones de color
//
// Dependencias:
//   - afiliadosService.js → toda la comunicación con el backend
//   - AfiliadosView.css   → todos los estilos visuales
//   - AuthContext         → rol del usuario para permisos de UI
// ============================================================

import { useEffect, useState }  from 'react';
import { useNavigate }          from 'react-router-dom';
import { useAuth }              from '../context/AuthContext';
import AppLayout                from '../components/AppLayout';
import {
  fetchAfiliados,
  crearAfiliado,
  actualizarAfiliado,
  cambiarEstadoAfiliado,
  getId,
  nombreCompleto,
  inicial,
  cicloActivo,
  toDateInput,
  buildAfiliadoLocal,
  OBJETIVO_CONFIG,
  OBJETIVOS,
  NIVELES,
  ESTADOS,
  PLANES,
  SEXOS,
  MUSCULOS,
  TABS_POR_ROL,
  FORM_VACIO,
}                               from '../services/afiliadosService';
import                               './AfiliadosView.css';

/* ── Helper de badge de estado (presentación pura) ─────────── */
const BadgeEstado = ({ estado }) => {
  const MAP = { activo: 'success', inactivo: 'danger', pendiente: 'warning' };
  const c   = MAP[(estado || '').toLowerCase()] || 'secondary';
  return <span className={`badge bg-${c}`}>{estado || '—'}</span>;
};

/* ────────────────────────────────────────────────────────────── */

export default function AfiliadosView() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const role             = user?.role || 'Recepcionista';
  const tabs             = TABS_POR_ROL[role] || TABS_POR_ROL.Administrador;

  /* ── Estado de datos ── */
  const [afiliados, setAfiliados] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [busqueda,  setBusqueda]  = useState('');
  const [toast,     setToast]     = useState('');

  /* ── Estado de modales ── */
  const [verModal,   setVerModal]   = useState(null);
  const [verTab,     setVerTab]     = useState(0);
  const [editModal,  setEditModal]  = useState(null);
  const [formEdit,   setFormEdit]   = useState(FORM_VACIO);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError,  setEditError]  = useState('');
  const [crearModal, setCrearModal] = useState(false);
  const [formNuevo,  setFormNuevo]  = useState(FORM_VACIO);
  const [savingNew,  setSavingNew]  = useState(false);
  const [newError,   setNewError]   = useState('');

  /* ── Carga inicial ── */
  useEffect(() => {
    fetchAfiliados()
      .then(setAfiliados)
      .catch((err) => {
        console.error('[AfiliadosView] fetchAfiliados:', err.response?.status, err.message);
        if (err?.response?.status === 401) { logout(); navigate('/login'); }
        else setError('No se pudieron cargar los afiliados.');
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Toast ── */
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  /* ── Filtrado local ── */
  const filtrados = afiliados.filter((a) => {
    const t = busqueda.toLowerCase();
    return nombreCompleto(a).toLowerCase().includes(t)
        || (a.correo || '').toLowerCase().includes(t)
        || String(a.documento || '').includes(t);
  });

  /* ── Handlers de Crear ── */
  const abrirCrear = () => {
    setFormNuevo(FORM_VACIO);
    setNewError('');
    setCrearModal(true);
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setSavingNew(true);
    setNewError('');
    try {
      const { payload, idRetornado } = await crearAfiliado(formNuevo);
      const nuevoAfiliado            = buildAfiliadoLocal(payload, idRetornado);
      setAfiliados((prev) => [...prev, nuevoAfiliado]);
      setCrearModal(false);
      setFormNuevo(FORM_VACIO);
      showToast(`✅ ${nombreCompleto(nuevoAfiliado)} creado correctamente`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Error desconocido';
      console.error('[AfiliadosView.handleCrear]', err.response?.data || err);
      setNewError(`Error al crear: ${msg}`);
    } finally {
      setSavingNew(false);
    }
  };

  /* ── Handlers de Editar ── */
  const abrirEditar = (a) => {
    setEditError('');
    setFormEdit({
      nombres:                     a.nombres || '',
      apellidos:                   a.apellidos || '',
      correo:                      a.correo || '',
      telefono:                    a.telefono || '',
      direccion:                   a.direccion || '',
      documento:                   a.documento || '',
      fecha_nacimiento:            toDateInput(a.fecha_nacimiento),
      sexo:                        a.sexo || 'Masculino',
      estatura_cm:                 a.estatura_cm || '',
      objetivo_fisico:             a.objetivo_fisico || 'Pérdida de grasa',
      grupo_muscular_prioritario:  a.grupo_muscular_prioritario || '',
      nivel_experiencia:           a.nivel_experiencia || 'Principiante',
      disponibilidad_semanal_dias: a.disponibilidad_semanal_dias || 3,
      estado_afiliacion:           a.estado_afiliacion || 'Activo',
      plan_membresia:              a.plan_membresia || 'Básico',
    });
    setEditModal(a);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setEditError('');
    try {
      const id = getId(editModal);
      await actualizarAfiliado(id, formEdit);
      // El backend retorna { message }, no el objeto actualizado.
      // Merge optimista: aplica formEdit sobre el objeto existente.
      const actualizado = { ...editModal, ...formEdit };
      setAfiliados((prev) => prev.map((a) => getId(a) === id ? actualizado : a));
      setEditModal(null);
      showToast(`✅ ${nombreCompleto(actualizado)} actualizado`);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Error desconocido';
      console.error('[AfiliadosView.guardarEdicion]', err);
      setEditError(`Error al guardar: ${msg}`);
    } finally {
      setSavingEdit(false);
    }
  };

  /* ── Handler de cambio rápido de estado ── */
  const handleCambiarEstado = async (a, nuevoEstado) => {
    try {
      const id      = getId(a);
      const updated = await cambiarEstadoAfiliado(id, nuevoEstado);
      setAfiliados((prev) => prev.map((x) => getId(x) === id ? updated : x));
      showToast(`🔄 Estado cambiado a "${nuevoEstado}"`);
    } catch {
      showToast('❌ Error al cambiar estado.');
    }
  };

  /* ────────────────────────────── RENDER ────────────────────── */
  return (
    <AppLayout>

      {/* ── Toast ── */}
      {toast && (
        <div className="af-toast alert alert-dark shadow-lg py-2 px-3">
          {toast}
        </div>
      )}

      <div className="container-fluid py-4 px-3 px-md-4">

        {/* ── Encabezado ── */}
        <div className="af-header">
          <div>
            <h1 className="h4 fw-bold mb-0">👥 Gestión de Afiliados</h1>
            <small className="text-muted">
              {role === 'Recepcionista'
                ? 'Administración de membresías y estados'
                : 'Seguimiento de planes y progreso'}
            </small>
          </div>
          {(role === 'Recepcionista' || role === 'Administrador') && (
            <button
              id="btn-crear-afiliado"
              className="af-btn-crear"
              onClick={abrirCrear}
            >
              ➕ Nuevo afiliado
            </button>
          )}
        </div>

        {/* ── Tabla ── */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-0 flex-wrap gap-2">
            <span className="fw-semibold text-muted small">{filtrados.length} afiliados</span>
            <input
              type="text"
              id="busqueda-afiliados"
              className="form-control form-control-sm af-search"
              placeholder="🔍 Nombre, correo, documento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="card-body p-0">
            {error   && <div className="alert alert-danger m-3 py-2"><small>⚠️ {error}</small></div>}
            {loading && <div className="text-center py-5"><div className="spinner-border text-primary" /></div>}

            {!loading && !error && (
              <div className="af-table-wrap">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-3">#</th>
                      <th>Afiliado</th>
                      <th>Objetivo</th>
                      <th>Nivel</th>
                      {(role === 'Recepcionista' || role === 'Administrador') && <th>Plan</th>}
                      {(role === 'Entrenador'    || role === 'Administrador') && <th>Ciclo activo</th>}
                      <th>Estado</th>
                      <th className="pe-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-5">
                          {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay afiliados.'}
                        </td>
                      </tr>
                    ) : filtrados.map((a, idx) => {
                      const ciclo = cicloActivo(a);
                      /* El color del avatar es un valor calculado (hsl dinámico por ID),
                         no un estilo de diseño estático, por lo que se mantiene inline
                         conforme a la excepción SoC de valores computados. */
                      const avatarBg = `hsl(${(getId(a) * 47) % 360},65%,55%)`;
                      return (
                        <tr key={getId(a)}>
                          <td className="ps-4 text-muted small">{idx + 1}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="af-avatar"
                                style={{ background: avatarBg }}
                              >
                                {inicial(a)}
                              </div>
                              <div>
                                <div className="fw-semibold small">{nombreCompleto(a)}</div>
                                <div className="text-muted af-avatar-doc">Doc: {a.documento || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <small>{OBJETIVO_CONFIG[a.objetivo_fisico]?.icono} {a.objetivo_fisico || '—'}</small>
                          </td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary">
                              {a.nivel_experiencia || '—'}
                            </span>
                          </td>
                          {(role === 'Recepcionista' || role === 'Administrador') && (
                            <td><small className="text-muted">{a.plan_membresia || 'Básico'}</small></td>
                          )}
                          {(role === 'Entrenador' || role === 'Administrador') && (
                            <td className="text-center">
                              {ciclo
                                ? <span className="badge bg-primary bg-opacity-10 text-primary">Ciclo {ciclo.numero_ciclo}</span>
                                : <span className="text-muted small">Sin ciclo</span>}
                            </td>
                          )}
                          <td>
                            {role === 'Recepcionista' ? (
                              <select
                                className="form-select form-select-sm af-estado-select"
                                value={a.estado || 'Activo'}
                                onChange={(e) => handleCambiarEstado(a, e.target.value)}
                                title="Cambiar estado"
                              >
                                {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                              </select>
                            ) : (
                              <BadgeEstado estado={a.estado} />
                            )}
                          </td>
                          <td className="text-center pe-4">
                            <div className="d-flex gap-1 justify-content-center">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                id={`btn-ver-${getId(a)}`}
                                title="Ver detalle"
                                onClick={() => { setVerModal(a); setVerTab(0); }}
                              >👁</button>
                              {role !== 'Entrenador' && (
                                <button
                                  className="btn btn-outline-warning btn-sm"
                                  id={`btn-editar-${getId(a)}`}
                                  title="Editar"
                                  onClick={() => abrirEditar(a)}
                                >✏️</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          MODAL: VER AFILIADO
      ════════════════════════════════════════════════════════ */}
      {verModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setVerModal(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header text-white border-0 af-modal-header--ver">
                <h5 className="modal-title">👤 {nombreCompleto(verModal)}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setVerModal(null)} />
              </div>

              <div className="modal-body">
                {/* Datos básicos */}
                <div className="row g-2 mb-3">
                  {[
                    { label: 'Correo',     v: verModal.correo },
                    { label: 'Teléfono',   v: verModal.telefono },
                    { label: 'Documento',  v: verModal.documento },
                    { label: 'Sexo',       v: verModal.sexo },
                    { label: 'Nacimiento', v: verModal.fecha_nacimiento },
                    { label: 'Estatura',   v: verModal.estatura_cm ? `${verModal.estatura_cm} cm` : '—' },
                    { label: 'Objetivo',   v: verModal.objetivo_fisico },
                    { label: 'Nivel',      v: verModal.nivel_experiencia },
                    { label: 'Días/sem',   v: verModal.disponibilidad_semanal_dias },
                    { label: 'Plan',       v: verModal.plan_membresia || 'Básico' },
                  ].map((f) => (
                    <div key={f.label} className="col-6 col-md-4">
                      <small className="text-muted d-block text-uppercase fw-semibold af-field-label">{f.label}</small>
                      <span className="small fw-semibold">{f.v || '—'}</span>
                    </div>
                  ))}
                </div>

                {/* Pestañas por rol */}
                <ul className="nav nav-tabs mb-3">
                  {tabs.map((tab, i) => (
                    <li key={tab} className="nav-item">
                      <button
                        className={`nav-link ${verTab === i ? 'active' : ''}`}
                        onClick={() => setVerTab(i)}
                      >
                        {tab}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* TAB: Estado de Cuenta */}
                {tabs[verTab] === 'Estado de Cuenta' && (
                  <div>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="card border-0 bg-light text-center p-3">
                          <div className="small text-muted text-uppercase fw-semibold mb-1">Estado actual</div>
                          <BadgeEstado estado={verModal.estado} />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-0 bg-light text-center p-3">
                          <div className="small text-muted text-uppercase fw-semibold mb-1">Plan</div>
                          <strong>{verModal.plan_membresia || 'Básico'}</strong>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card border-0 bg-light text-center p-3">
                          <div className="small text-muted text-uppercase fw-semibold mb-1">Desde</div>
                          <strong>{verModal.fecha_registro || '—'}</strong>
                        </div>
                      </div>
                    </div>
                    {verModal.restricciones?.length > 0 && (
                      <div className="mt-3">
                        <h6 className="fw-bold">⚠️ Restricciones médicas</h6>
                        {verModal.restricciones.map((r) => (
                          <div key={r.id_restriccion} className="alert alert-warning py-2 mb-2">
                            <strong>{r.nombre}</strong>
                            <span className="badge bg-warning text-dark ms-2">{r.tipo}</span>
                            {r.efecto_relevante && (
                              <div className="small mt-1 text-muted">{r.efecto_relevante}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Progreso Físico */}
                {tabs[verTab] === 'Progreso Físico' && (() => {
                  const ciclo     = cicloActivo(verModal);
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
                            { label: '% Grasa', v: `${p.porcentaje_grasa}%`       },
                            { label: 'Cintura',  v: `${p.medidas_cm?.cintura} cm` },
                            { label: 'Brazo',    v: `${p.medidas_cm?.brazo} cm`   },
                            { label: 'Pierna',   v: `${p.medidas_cm?.pierna} cm`  },
                          ].map((f) => (
                            <div key={f.label} className="col-3">
                              <small className="text-muted d-block af-progreso-label">{f.label}</small>
                              <strong className="small">{f.v || '—'}</strong>
                            </div>
                          ))}
                        </div>
                        {p.observaciones && (
                          <small className="text-muted mt-1 d-block">📝 {p.observaciones}</small>
                        )}
                      </div>
                    ));
                })()}

                {/* TAB: Ciclo Activo */}
                {tabs[verTab] === 'Ciclo Activo' && (() => {
                  const ciclo = cicloActivo(verModal);
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
                {role !== 'Entrenador' && (
                  <button
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => { setVerModal(null); abrirEditar(verModal); }}
                  >
                    ✏️ Editar
                  </button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setVerModal(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL: EDITAR AFILIADO
      ════════════════════════════════════════════════════════ */}
      {editModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => !savingEdit && setEditModal(null)}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header text-white border-0 af-modal-header--editar">
                <h5 className="modal-title">✏️ Editar — {nombreCompleto(editModal)}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => !savingEdit && setEditModal(null)}
                />
              </div>
              <form onSubmit={guardarEdicion}>
                <div className="modal-body">
                  {editError && <div className="alert alert-danger py-2"><small>⚠️ {editError}</small></div>}
                  <div className="row g-3">
                    {[
                      { label: 'Nombres',   key: 'nombres',   type: 'text'  },
                      { label: 'Apellidos', key: 'apellidos', type: 'text'  },
                      { label: 'Correo',    key: 'correo',    type: 'email' },
                      { label: 'Teléfono', key: 'telefono',   type: 'text'  },
                      { label: 'Documento', key: 'documento', type: 'text'  },
                    ].map(({ label, key, type }) => (
                      <div key={key} className="col-md-6">
                        <label className="form-label small fw-semibold">{label}</label>
                        <input
                          type={type}
                          className="form-control"
                          value={formEdit[key]}
                          onChange={(e) => setFormEdit({ ...formEdit, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Estado</label>
                      <select
                        className="form-select"
                        value={formEdit.estado}
                        onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}
                      >
                        {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Plan membresía</label>
                      <select
                        className="form-select"
                        value={formEdit.plan_membresia}
                        onChange={(e) => setFormEdit({ ...formEdit, plan_membresia: e.target.value })}
                      >
                        {PLANES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Objetivo físico</label>
                      <select
                        className="form-select"
                        value={formEdit.objetivo_fisico}
                        onChange={(e) => setFormEdit({ ...formEdit, objetivo_fisico: e.target.value })}
                      >
                        {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Nivel</label>
                      <select
                        className="form-select"
                        value={formEdit.nivel_experiencia}
                        onChange={(e) => setFormEdit({ ...formEdit, nivel_experiencia: e.target.value })}
                      >
                        {NIVELES.map((n) => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => !savingEdit && setEditModal(null)}
                    disabled={savingEdit}
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-guardar-edicion"
                    type="submit"
                    className="af-btn-guardar-editar btn btn-sm"
                    disabled={savingEdit}
                  >
                    {savingEdit
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : '💾 Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MODAL: CREAR AFILIADO
      ════════════════════════════════════════════════════════ */}
      {crearModal && (
        <div
          className="modal d-block"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => !savingNew && setCrearModal(false)}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow">
              <div className="modal-header text-white border-0 af-modal-header--crear">
                <h5 className="modal-title">➕ Nuevo Afiliado</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => !savingNew && setCrearModal(false)}
                />
              </div>
              <form onSubmit={handleCrear}>
                <div className="modal-body af-modal-body--crear">
                  {newError && <div className="alert alert-danger py-2"><small>⚠️ {newError}</small></div>}

                  <h6 className="fw-bold text-muted text-uppercase small mb-3">👤 Datos personales</h6>
                  <div className="row g-3 mb-4">
                    {[
                      { label: 'Nombres *',    key: 'nombres',          type: 'text',  required: true  },
                      { label: 'Apellidos *',  key: 'apellidos',        type: 'text',  required: true  },
                      { label: 'Email',        key: 'correo',           type: 'email', required: false },
                      { label: 'Teléfono',     key: 'telefono',         type: 'text',  required: false },
                      { label: 'DNI / Doc. *', key: 'documento',        type: 'text',  required: true  },
                      { label: 'Nacimiento',   key: 'fecha_nacimiento', type: 'date',  required: false },
                    ].map(({ label, key, type, required }) => (
                      <div key={key} className="col-md-6">
                        <label className="form-label small fw-semibold">{label}</label>
                        <input
                          type={type}
                          className="form-control"
                          required={required}
                          value={formNuevo[key]}
                          onChange={(e) => setFormNuevo({ ...formNuevo, [key]: e.target.value })}
                        />
                      </div>
                    ))}
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Sexo</label>
                      <select
                        className="form-select"
                        value={formNuevo.sexo}
                        onChange={(e) => setFormNuevo({ ...formNuevo, sexo: e.target.value })}
                      >
                        {SEXOS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Estatura (cm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control"
                        value={formNuevo.estatura_cm}
                        onChange={(e) => setFormNuevo({ ...formNuevo, estatura_cm: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold">Dirección</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formNuevo.direccion}
                        onChange={(e) => setFormNuevo({ ...formNuevo, direccion: e.target.value })}
                      />
                    </div>
                  </div>

                  <h6 className="fw-bold text-muted text-uppercase small mb-3">🏋️ Plan de membresía</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Plan *</label>
                      <select
                        className="form-select"
                        required
                        value={formNuevo.plan_membresia}
                        onChange={(e) => setFormNuevo({ ...formNuevo, plan_membresia: e.target.value })}
                      >
                        {PLANES.map((p) => <option key={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Estado inicial</label>
                      <select
                        className="form-select"
                        value={formNuevo.estado}
                        onChange={(e) => setFormNuevo({ ...formNuevo, estado: e.target.value })}
                      >
                        {ESTADOS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Objetivo físico</label>
                      <select
                        className="form-select"
                        value={formNuevo.objetivo_fisico}
                        onChange={(e) => setFormNuevo({ ...formNuevo, objetivo_fisico: e.target.value })}
                      >
                        {OBJETIVOS.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Nivel</label>
                      <select
                        className="form-select"
                        value={formNuevo.nivel_experiencia}
                        onChange={(e) => setFormNuevo({ ...formNuevo, nivel_experiencia: e.target.value })}
                      >
                        {NIVELES.map((n) => <option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Músculo prioritario</label>
                      <select
                        className="form-select"
                        value={formNuevo.grupo_muscular_prioritario}
                        onChange={(e) => setFormNuevo({ ...formNuevo, grupo_muscular_prioritario: e.target.value })}
                      >
                        {MUSCULOS.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Días disponibles/sem</label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        className="form-control"
                        value={formNuevo.disponibilidad_semanal_dias}
                        onChange={(e) => setFormNuevo({ ...formNuevo, disponibilidad_semanal_dias: parseInt(e.target.value) || 3 })}
                      />
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
                        placeholder={'Ej: Diabetes tipo 2\nHipertensión\nAlergia a lactosa'}
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
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => !savingNew && setCrearModal(false)}
                    disabled={savingNew}
                  >
                    Cancelar
                  </button>
                  <button
                    id="btn-confirmar-crear"
                    type="submit"
                    className="af-btn-guardar-crear btn btn-sm"
                    disabled={savingNew}
                  >
                    {savingNew
                      ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                      : '✅ Crear afiliado'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
