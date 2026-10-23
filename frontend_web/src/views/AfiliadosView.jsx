import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import useAutoRefresh from "../hooks/useAutoRefresh";
import { trackEvent } from "../utils/analytics";
import { API_BASE_URL } from "../services/api";
import RestriccionSelector from "../components/common/RestriccionSelector";
import s from "./AfiliadosView.module.css";

const ESTADOS = ["Activo", "Inactivo", "Suspendido"];
const NIVELES = ["Principiante", "Intermedio", "Avanzado"];
const OBJETIVOS = ["Pérdida de grasa", "Aumento de masa", "Mantenimiento"];
const SEXOS = ["Masculino", "Femenino", "Otro"];

const TABS_POR_ROL = {
  Administrador: ["Estado de Cuenta", "Progreso Físico", "Ciclo Activo"],
  Recepcionista: ["Estado de Cuenta"],
  Entrenador: ["Progreso Físico", "Ciclo Activo"],
};

const FORM_VACIO = {
  nombres: "",
  apellidos: "",
  correo: "",
  telefono: "",
  direccion: "",
  documento: "",
  fecha_nacimiento: "",
  sexo: "Masculino",
  estatura_cm: "",
  objetivo_fisico: "Pérdida de grasa",
  grupo_muscular_prioritario: "Pecho",
  nivel_experiencia: "Principiante",
  disponibilidad_semanal_dias: 3,
  estado: "Activo",
  restricciones_medicas: "",
};

const badgeEstado = (estado) => {
  const cls =
    estado === "Activo"
      ? s.badgeActivo
      : estado === "Inactivo"
      ? s.badgeInactivo
      : estado === "Suspendido"
      ? s.badgeSuspendido
      : s.badgeOutline;
  return <span className={cls}>{estado}</span>;
};

const avatarColor = (nombre) => {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 55%)`;
};

const fotoUrl = (foto) => {
  if (!foto || typeof foto !== "string") return null;
  return foto.startsWith("http") ? foto : `${API_BASE_URL}${foto}`;
};

const AvatarFoto = ({ nombre, foto, size = 32, style }) => {
  const safeNombre = nombre || "";
  const url = fotoUrl(foto);
  if (url) {
    return (
      <img
        src={url}
        alt={safeNombre}
        onError={(e) => { e.target.style.display = "none"; }}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style }}
      />
    );
  }
  const inicialLetra = safeNombre.trim()[0] || "?";
  return (
    <div className={s.avatarTd} style={{ background: avatarColor(safeNombre || "?"), ...style }}>
      {inicialLetra.toUpperCase()}
    </div>
  );
};

// Campos compartidos por los formularios de creación y edición de afiliados.
// El prefijo de id mantiene labels e inputs únicos en cada modal.
const CamposAfiliado = ({ idPrefix, form, setForm, nombreAvatar, fotoPreview, onFotoChange, documentoRequerido = false }) => (
  <>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <AvatarFoto nombre={nombreAvatar} foto={fotoPreview} size={56} />
      <div style={{ flex: 1 }}>
        <label className={s.labelText} htmlFor={`${idPrefix}-foto`}>Foto de perfil</label>
        <input
          id={`${idPrefix}-foto`}
          className={s.inputDark}
          type="file"
          accept="image/*"
          onChange={(e) => onFotoChange(e.target.files?.[0] || null)}
          style={{ padding: "0.35rem 0.5rem" }}
        />
        <small style={{ color: "var(--mf-muted)" }}>JPG, PNG, WEBP o GIF · máx 5 MB</small>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-nombres`}>Nombres</label>
        <input id={`${idPrefix}-nombres`} className={s.inputDark} value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} required />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-apellidos`}>Apellidos</label>
        <input id={`${idPrefix}-apellidos`} className={s.inputDark} value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} required />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-correo`}>Correo</label>
        <input id={`${idPrefix}-correo`} className={s.inputDark} type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-telefono`}>Teléfono</label>
        <input id={`${idPrefix}-telefono`} className={s.inputDark} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-documento`}>Documento</label>
        <input id={`${idPrefix}-documento`} className={s.inputDark} value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} required={documentoRequerido} />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-sexo`}>Sexo</label>
        <select id={`${idPrefix}-sexo`} className={s.selectDark} value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
          {SEXOS.map((sx) => <option key={sx} value={sx}>{sx}</option>)}
        </select>
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-nacimiento`}>Fecha Nacimiento</label>
        <input id={`${idPrefix}-nacimiento`} className={s.inputDark} type="date" value={form.fecha_nacimiento} onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })} />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-estatura`}>Estatura (cm)</label>
        <input id={`${idPrefix}-estatura`} className={s.inputDark} type="number" value={form.estatura_cm} onChange={(e) => setForm({ ...form, estatura_cm: e.target.value })} />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-direccion`}>Dirección</label>
        <input id={`${idPrefix}-direccion`} className={s.inputDark} value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-objetivo`}>Objetivo físico</label>
        <select id={`${idPrefix}-objetivo`} className={s.selectDark} value={form.objetivo_fisico} onChange={(e) => setForm({ ...form, objetivo_fisico: e.target.value })}>
          {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-nivel`}>Nivel experiencia</label>
        <select id={`${idPrefix}-nivel`} className={s.selectDark} value={form.nivel_experiencia} onChange={(e) => setForm({ ...form, nivel_experiencia: e.target.value })}>
          {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-dias`}>Días/semana</label>
        <input id={`${idPrefix}-dias`} className={s.inputDark} type="number" min={1} max={7} value={form.disponibilidad_semanal_dias} onChange={(e) => setForm({ ...form, disponibilidad_semanal_dias: e.target.value })} />
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-estado`}>Estado</label>
        <select id={`${idPrefix}-estado`} className={s.selectDark} value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
          {ESTADOS.map((es) => <option key={es} value={es}>{es}</option>)}
        </select>
      </div>
      <div>
        <label className={s.labelText} htmlFor={`${idPrefix}-musculo`}>Grupo muscular</label>
        <select id={`${idPrefix}-musculo`} className={s.selectDark} value={form.grupo_muscular_prioritario} onChange={(e) => setForm({ ...form, grupo_muscular_prioritario: e.target.value })}>
          {["Pecho", "Espalda", "Piernas", "Glúteos", "Hombros", "Bíceps", "Tríceps", "Abdomen"].map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
    </div>
  </>
);

export default function AfiliadosView() {
  const { user, authAxios } = useAuth();
  const navigate = useNavigate();
  const { toast, showToast } = useToast();

  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [detalleAfiliado, setDetalleAfiliado] = useState(null);
  const [editandoAfiliado, setEditandoAfiliado] = useState(null);
  const [creandoAbierto, setCreandoAbierto] = useState(false);

  const [tabActivo, setTabActivo] = useState(0);
  const [formEdit, setFormEdit] = useState(FORM_VACIO);
  const [formCrear, setFormCrear] = useState(FORM_VACIO);
  const [restriccionesSeleccionadas, setRestriccionesSeleccionadas] = useState([]);

  const role = user?.role || "Recepcionista";
  const tabsDisponibles = TABS_POR_ROL[role] || TABS_POR_ROL.Recepcionista;

  const fetchAfiliados = async (opts = {}) => {
    if (!opts.silent) setLoading(true);
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[AfiliadosView] fetchAfiliados:", err?.response?.data || err);
      setAfiliados([]);
    } finally {
      if (!opts.silent) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAfiliados();
  }, []);

  // Sincronización tiempo real: polling 10s + refetch al recobrar foco/visibilidad
  useAutoRefresh(() => fetchAfiliados({ silent: true }), 10000);

  useEffect(() => {
    return () => {
      if (fotoPreview && fotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  const afiliadosFiltrados = afiliados.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const nombre = nombreCompleto(a).toLowerCase();
    const email = (a.correo || a.email || "").toLowerCase();
    const doc = (a.documento || "").toLowerCase();
    return nombre.includes(q) || email.includes(q) || doc.includes(q);
  });

  const abrirDetalle = async (a) => {
    try {
      const id = getId(a);
      if (!id) {
        showToast("Error: no se pudo identificar el afiliado", "danger");
        return;
      }
      const { data } = await authAxios.get(`/afiliados/${id}`);
      setDetalleAfiliado(data);
      setTabActivo(0);
    } catch (err) {
      console.error("[AfiliadosView] detalle:", err?.response?.data || err);
      showToast("Error al cargar detalle del afiliado", "danger");
    }
  };

  const abrirEdicion = (a) => {
    setEditandoAfiliado(a);
    setFotoFile(null);
    setFotoPreview(null);
    setFormEdit({
      nombres: a.nombres || "",
      apellidos: a.apellidos || "",
      correo: a.correo || a.email || "",
      telefono: a.telefono || "",
      direccion: a.direccion || "",
      documento: a.documento || "",
      fecha_nacimiento: a.fecha_nacimiento ? a.fecha_nacimiento.split("T")[0] : "",
      sexo: a.sexo || "Masculino",
      estatura_cm: a.estatura_cm || "",
      objetivo_fisico: a.objetivo_fisico || "Pérdida de grasa",
      grupo_muscular_prioritario: a.grupo_muscular_prioritario || "Pecho",
      nivel_experiencia: a.nivel_experiencia || "Principiante",
      disponibilidad_semanal_dias: a.disponibilidad_semanal_dias || 3,
      estado: a.estado || "Activo",
      restricciones_medicas: a.restricciones_medicas || "",
    });
  };

  const subirFoto = async (id, file) => {
    const fd = new FormData();
    fd.append("foto", file);
    await authAxios.post(`/afiliados/${id}/foto`, fd);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const id = getId(editandoAfiliado);
      if (!id) {
        showToast("Error: no se pudo identificar el afiliado", "danger");
        return;
      }
      await authAxios.patch(`/afiliados/${id}`, formEdit);
      if (fotoFile) {
        try {
          await subirFoto(id, fotoFile);
        } catch (fotoErr) {
          console.error("[AfiliadosView] subirFoto edicion:", fotoErr);
        }
      }
      showToast("Afiliado actualizado correctamente", "success");
      setEditandoAfiliado(null);
      setFotoFile(null);
      setFotoPreview(null);
      await fetchAfiliados();
      window.dispatchEvent(new CustomEvent("afiliado-modificado"));
    } catch (err) {
      console.error("[AfiliadosView] edicion:", err?.response?.data || err);
      const msg = err?.response?.data?.error || "Error al actualizar afiliado";
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...formCrear,
        estatura_cm: Number.parseFloat(formCrear.estatura_cm) || null,
        disponibilidad_semanal_dias: Number.parseInt(formCrear.disponibilidad_semanal_dias) || 3,
        estado_afiliacion: formCrear.estado,
      };
      delete payload.estado;
      const { data } = await authAxios.post("/afiliados", payload);
      if (fotoFile && data?.id) {
        try {
          await subirFoto(data.id, fotoFile);
        } catch (fotoErr) {
          console.error("[AfiliadosView] subirFoto:", fotoErr);
        }
      }
      // Asignar restricciones seleccionadas en el registro (crear → asignar)
      if (data?.id && restriccionesSeleccionadas.length > 0) {
        for (const r of restriccionesSeleccionadas) {
          const rid = r?.id_restriccion ?? r?.id;
          if (rid == null) continue;
          try {
            await authAxios.post(`/afiliados/${data.id}/restricciones`, { id_restriccion: rid });
          } catch (restrErr) {
            // No abortar la creación: el afiliado ya existe; loguear y seguir.
            console.error(`[AfiliadosView] asignar restricción ${rid}:`, restrErr?.response?.data || restrErr);
          }
        }
      }
      showToast("Afiliado creado correctamente", "success");
      trackEvent("metaFit_afiliado_creado", { rol_creador: role, restricciones: restriccionesSeleccionadas.length });
      setCreandoAbierto(false);
      setFormCrear(FORM_VACIO);
      setFotoFile(null);
      setFotoPreview(null);
      setRestriccionesSeleccionadas([]);
      await fetchAfiliados();
      window.dispatchEvent(new CustomEvent("afiliado-modificado"));
    } catch (err) {
      console.error("[AfiliadosView] crear:", err?.response?.data || err);
      const msg = err?.response?.data?.error || "Error al crear afiliado";
      showToast(msg, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (a) => {
    const nombre = nombreCompleto(a);
    if (!window.confirm(`¿Eliminar a ${nombre}?`)) return;
    try {
      const id = getId(a);
      if (!id) {
        showToast("Error: no se pudo identificar el afiliado", "danger");
        return;
      }
      await authAxios.delete(`/afiliados/${id}`);
      showToast("Afiliado eliminado", "success");
      await fetchAfiliados();
      window.dispatchEvent(new CustomEvent("afiliado-modificado"));
    } catch (err) {
      console.error("[AfiliadosView] eliminar:", err?.response?.data || err);
      const msg = err?.response?.data?.error || "Error al eliminar afiliado";
      showToast(msg, "danger");
    }
  };

  const puedeCrear = role === "Administrador" || role === "Recepcionista";

  // ── Restricciones médicas durante el REGISTRO (estado local) ────────────
  // La Recepcionista selecciona del catálogo al crear el afiliado; las
  // restricciones se asignan en el backend tras crear (POST /afiliados → id).
  const handleAddRestriccionTemporal = (restriccion) => {
    const rid = restriccion?.id_restriccion ?? restriccion?.id;
    setRestriccionesSeleccionadas((prev) =>
      prev.some((r) => (r?.id_restriccion ?? r?.id) === rid)
        ? prev
        : [...prev, restriccion]
    );
  };

  const handleRemoveRestriccionTemporal = (restriccionId) => {
    setRestriccionesSeleccionadas((prev) =>
      prev.filter((r) => (r?.id_restriccion ?? r?.id) !== restriccionId)
    );
  };

  const handleFotoChange = (f) => {
    setFotoFile(f);
    setFotoPreview(f ? URL.createObjectURL(f) : null);
  };

  const abrirNuevo = () => {
    setFormCrear(FORM_VACIO);
    setFotoFile(null);
    setFotoPreview(null);
    setRestriccionesSeleccionadas([]);
    setCreandoAbierto(true);
  };

  const cerrarNuevo = () => {
    if (saving) return;
    setCreandoAbierto(false);
    setRestriccionesSeleccionadas([]);
  };

  // ── Restricciones médicas (catálogo por afiliado) ────────────────────────
  // Permisos: el backend acepta rol staff (Admin, Entrenador, Recepcionista).
  // En el modal de detalle se mantiene readOnly para Recepcionista (solo ve);
  // la Recepcionista edita restricciones ÚNICAMENTE en el flujo de nuevo registro.
  const puedeEditarRestricciones =
    role === "Administrador" || role === "Entrenador";

  const handleAddRestriccion = async (restriccionId) => {
    try {
      const id = getId(detalleAfiliado);
      await authAxios.post(`/afiliados/${id}/restricciones`, {
        id_restriccion: restriccionId,
      });
      showToast("Restricción asignada correctamente", "success");
      trackEvent("metaFit_restriccion_asignada", { afiliado: id, restriccion: restriccionId });
      await abrirDetalleAFresco(id);
    } catch (err) {
      console.error("[AfiliadosView] asignar restricción:", err);
      showToast("Error al asignar restricción", "danger");
    }
  };

  const handleRemoveRestriccion = async (restriccionId) => {
    try {
      const id = getId(detalleAfiliado);
      await authAxios.delete(`/afiliados/${id}/restricciones/${restriccionId}`);
      showToast("Restricción removida correctamente", "success");
      trackEvent("metaFit_restriccion_removida", { afiliado: id, restriccion: restriccionId });
      await abrirDetalleAFresco(id);
    } catch (err) {
      console.error("[AfiliadosView] remover restricción:", err);
      showToast("Error al remover restricción", "danger");
    }
  };

  // Recarga el detalle SIN cerrar el modal (refresca los badges tras add/remove)
  const abrirDetalleAFresco = async (id) => {
    try {
      const { data } = await authAxios.get(`/afiliados/${id}`);
      setDetalleAfiliado(data);
    } catch (err) {
      console.error("[AfiliadosView] refrescar detalle:", err);
    }
  };

  return (
    <AppLayout>
      {toast.msg && (
        <div className={toast.type === "danger" ? s.alertDanger : s.alertSuccess}
          style={{ position: "fixed", top: 16, right: 16, zIndex: 9999, padding: "0.5rem 1rem", borderRadius: 8 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className={s.headerTitle} style={{ fontSize: "1.35rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              👥 Afiliados
            </h1>
            <p className={s.headerSub} style={{ margin: "2px 0 0 0" }}>
              {role === "Administrador"
                ? "Gestión completa de afiliados · Crear, editar, suspender"
                : role === "Recepcionista"
                ? "Registro y consulta de afiliados"
                : "Seguimiento de afiliados asignados"}
            </p>
          </div>
          {puedeCrear && (
            <button type="button" className={s.btnPrimary} onClick={abrirNuevo}>
              ➕ Nuevo afiliado
            </button>
          )}
        </div>

        <input
          type="text"
          className={s.searchInput}
          placeholder="Buscar por nombre, correo o documento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: 400, padding: "0.5rem 0.75rem", marginBottom: 20 }}
        />

        <div className={s.tableCard}>
          {loading ? (
            <div style={{ padding: "3rem 0", textAlign: "center", color: "var(--mf-muted)" }}>Cargando afiliados...</div>
          ) : afiliadosFiltrados.length === 0 ? (
            <div style={{ padding: "3rem 0", textAlign: "center" }}>
              <p className={s.emptyState}>No se encontraron afiliados.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Afiliado</th>
                    <th>Objetivo</th>
                    <th>Nivel</th>
                    <th>Días/sem</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {afiliadosFiltrados.map((a, idx) => {
                    const nombre = nombreCompleto(a);
                    const email = a.correo || a.email || "";
                    return (
                      <tr key={getId(a)}>
                        <td style={{ color: "var(--mf-muted)", fontSize: "0.78rem" }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <AvatarFoto nombre={nombre} foto={a.foto} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{nombre}</div>
                              <div className={s.emailSm}>{email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{a.objetivo_fisico || "—"}</td>
                        <td>{a.nivel_experiencia || "—"}</td>
                        <td>{a.disponibilidad_semanal_dias || "—"}</td>
                        <td>{badgeEstado(a.estado)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <button type="button" className={s.btnIcon} title="Ver" onClick={() => abrirDetalle(a)}>👁</button>
                            <button type="button" className={s.btnIcon} title="Editar" onClick={() => abrirEdicion(a)}>✏️</button>
                            {(role === "Administrador" || role === "Entrenador") && (
                              <button type="button" className={s.btnIcon} title="Progreso" onClick={() => navigate(`/progreso/${getId(a)}`)}>📊</button>
                            )}
                            {role === "Administrador" && (
                              <button type="button" className={s.btnIcon} title="Eliminar" onClick={() => handleEliminar(a)}>🗑️</button>
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

      {detalleAfiliado && (
        <div
          className={s.modalOverlay}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal"
          onClick={(e) => {
            if (!saving && e.target === e.currentTarget) setDetalleAfiliado(null);
          }}
          onKeyDown={(e) => {
            if ((e.key === "Escape" || e.key === "Enter") && !saving) setDetalleAfiliado(null);
          }}
        >
          <div className={s.modalContent} style={{ maxWidth: 650 }}>
            <div className={s.modalHeader}>
              <h5 className={s.modalTitle} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <AvatarFoto nombre={nombreCompleto(detalleAfiliado)} foto={detalleAfiliado.foto} size={38} />
                <span>👁 {nombreCompleto(detalleAfiliado)}</span>
              </h5>
              <button type="button" className={s.btnOutline} onClick={() => !saving && setDetalleAfiliado(null)}>✕</button>
            </div>
            <div className={s.modalBody}>
              <div className={s.detailGrid}>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Correo</div>
                  <div className={s.detailValue}>{detalleAfiliado.correo || detalleAfiliado.email || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Teléfono</div>
                  <div className={s.detailValue}>{detalleAfiliado.telefono || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Documento</div>
                  <div className={s.detailValue}>{detalleAfiliado.documento || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Sexo</div>
                  <div className={s.detailValue}>{detalleAfiliado.sexo || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Fecha Nac.</div>
                  <div className={s.detailValue}>
                    {detalleAfiliado.fecha_nacimiento
                      ? new Date(detalleAfiliado.fecha_nacimiento).toLocaleDateString("es-CO")
                      : "—"}
                  </div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Estatura</div>
                  <div className={s.detailValue}>{detalleAfiliado.estatura_cm ? `${detalleAfiliado.estatura_cm} cm` : "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Dirección</div>
                  <div className={s.detailValue}>{detalleAfiliado.direccion || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Objetivo</div>
                  <div className={s.detailValue}>{detalleAfiliado.objetivo_fisico || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Grupo Muscular</div>
                  <div className={s.detailValue}>{detalleAfiliado.grupo_muscular_prioritario || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Nivel</div>
                  <div className={s.detailValue}>{detalleAfiliado.nivel_experiencia || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Días/semana</div>
                  <div className={s.detailValue}>{detalleAfiliado.disponibilidad_semanal_dias || "—"}</div>
                </div>
                <div className={s.detailItem}>
                  <div className={s.detailLabel}>Estado</div>
                  <div className={s.detailValue}>{badgeEstado(detalleAfiliado.estado)}</div>
                </div>
              </div>

              <div className={s.detailRestricciones}>
                  <div className={s.detailLabel}>Restricciones médicas</div>
                  <RestriccionSelector
                    restriccionesAsignadas={detalleAfiliado.restricciones || []}
                    onAdd={puedeEditarRestricciones ? handleAddRestriccion : undefined}
                    onRemove={puedeEditarRestricciones ? handleRemoveRestriccion : undefined}
                    readOnly={!puedeEditarRestricciones}
                  />
                </div>

              <div className={s.detailTabsBar}>
                {tabsDisponibles.map((tab, i) => (
                  <button
                    key={tab}
                    type="button"
                    className={`${s.navTab} ${i === tabActivo ? s.navTabActive : ""}`}
                    onClick={() => setTabActivo(i)}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className={s.detailTabsContent}>
                {tabsDisponibles[tabActivo] === "Estado de Cuenta" && (
                  <div>
                    {detalleAfiliado.ultimo_pago ? (
                      <div className={s.kpiCard} style={{ textAlign: "left" }}>
                        <div className={s.kpiLabel}>Último pago</div>
                        <div className={s.kpiValue} style={{ fontSize: "1rem" }}>
                          ${Number(detalleAfiliado.ultimo_pago.valor_pagado || 0).toLocaleString("es-CO")}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--mf-muted)", marginTop: 4 }}>
                          {new Date(detalleAfiliado.ultimo_pago.fecha_pago).toLocaleDateString("es-CO")}
                        </div>
                      </div>
                    ) : (
                      <p className={s.emptyState}>No hay información de pagos disponible.</p>
                    )}
                  </div>
                )}
                {tabsDisponibles[tabActivo] === "Progreso Físico" && (
                  <div>
                    {detalleAfiliado.progreso_fisico && detalleAfiliado.progreso_fisico.length > 0 ? (
                      detalleAfiliado.progreso_fisico.map((p, i) => (
                        <div key={i} className={s.kpiCard} style={{ textAlign: "left", marginBottom: 8 }}>
                          <div className={s.kpiLabel}>{new Date(p.fecha_registro).toLocaleDateString("es-CO")}</div>
                          <div className={s.detailValue}>Peso: {p.peso_kg || "—"} kg</div>
                        </div>
                      ))
                    ) : (
                      <p className={s.emptyState}>No hay registros de progreso físico.</p>
                    )}
                  </div>
                )}
                {tabsDisponibles[tabActivo] === "Ciclo Activo" && (
                  <div>
                    {detalleAfiliado.ciclo_activo ? (
                      <div>
                        <span className={s.cycleBadge}>Ciclo activo</span>
                        <div style={{ marginTop: 8 }}>
                          <div className={s.detailItem}>
                            <div className={s.detailLabel}>Inicio</div>
                            <div className={s.detailValue}>
                              {new Date(detalleAfiliado.ciclo_activo.fecha_inicio).toLocaleDateString("es-CO")}
                            </div>
                          </div>
                          <div className={s.detailItem} style={{ marginTop: 8 }}>
                            <div className={s.detailLabel}>Fin estimado</div>
                            <div className={s.detailValue}>
                              {new Date(detalleAfiliado.ciclo_activo.fecha_fin).toLocaleDateString("es-CO")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className={s.emptyState}>No tiene un ciclo activo actualmente.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={s.modalFooter}>
              <button type="button" className={s.btnOutline} onClick={() => setDetalleAfiliado(null)} disabled={saving}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {editandoAfiliado && (
        <div
          className={s.modalOverlay}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal"
          onClick={(e) => {
            if (!saving && e.target === e.currentTarget) setEditandoAfiliado(null);
          }}
          onKeyDown={(e) => {
            if ((e.key === "Escape" || e.key === "Enter") && !saving) setEditandoAfiliado(null);
          }}
        >
          <div className={s.modalContent} style={{ maxWidth: 650 }}>
            <form onSubmit={guardarEdicion}>
              <div className={s.modalHeader}>
                <h5 className={s.modalTitle}>✏️ Editar: {nombreCompleto(editandoAfiliado)}</h5>
                <button type="button" className={s.btnOutline} onClick={() => !saving && setEditandoAfiliado(null)}>✕</button>
              </div>
              <div className={s.modalBody}>
                <CamposAfiliado
                  idPrefix="editar-afiliado"
                  form={formEdit}
                  setForm={setFormEdit}
                  nombreAvatar={nombreCompleto(editandoAfiliado)}
                  fotoPreview={fotoPreview || editandoAfiliado.foto}
                  onFotoChange={handleFotoChange}
                />
                <div style={{ marginTop: 12 }}>
                  <label className={s.labelText} htmlFor="editar-afiliado-restricciones">Restricciones médicas</label>
                  <textarea id="editar-afiliado-restricciones" className={s.inputDark} rows={2} value={formEdit.restricciones_medicas} onChange={(e) => setFormEdit({ ...formEdit, restricciones_medicas: e.target.value })} />
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={() => setEditandoAfiliado(null)} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className={s.btnPrimary} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {creandoAbierto && (
        <div
          className={s.modalOverlay}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal"
          onClick={(e) => { if (e.target === e.currentTarget) cerrarNuevo(); }}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter") cerrarNuevo();
          }}
        >
          <div className={s.modalContent} style={{ maxWidth: 650 }}>
            <form onSubmit={handleCrear}>
              <div className={s.modalHeader}>
                <h5 className={s.modalTitle}>➕ Nuevo afiliado</h5>
                <button type="button" className={s.btnOutline} onClick={cerrarNuevo}>✕</button>
              </div>
              <div className={s.modalBody}>
                <CamposAfiliado
                  idPrefix="crear-afiliado"
                  form={formCrear}
                  setForm={setFormCrear}
                  nombreAvatar={formCrear.nombres || "?"}
                  fotoPreview={fotoPreview}
                  onFotoChange={handleFotoChange}
                  documentoRequerido
                />
                <div style={{ marginTop: 12 }}>
                  <span className={s.labelText}>Restricciones médicas (catálogo)</span>
                  <RestriccionSelector
                    restriccionesAsignadas={restriccionesSeleccionadas}
                    onAdd={handleAddRestriccionTemporal}
                    onRemove={handleRemoveRestriccionTemporal}
                    isRegistration
                  />
                </div>
                <div style={{ marginTop: 8 }}>
                  <label className={s.labelText} htmlFor="afiliado-antecedentes">Otros antecedentes (texto libre)</label>
                  <textarea id="afiliado-antecedentes" className={s.inputDark} rows={2} value={formCrear.restricciones_medicas} onChange={(e) => setFormCrear({ ...formCrear, restricciones_medicas: e.target.value })} />
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={cerrarNuevo} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className={s.btnPrimary} disabled={saving}>
                  {saving ? "Creando..." : "Crear afiliado"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
