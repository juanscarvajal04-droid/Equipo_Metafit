import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getId, nombreCompleto } from "../utils/afiliadoHelpers";
import { useToast } from "../hooks/useToast";
import { API_BASE_URL } from "../services/api";
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

const fotoUrl = (foto) =>
  foto ? (foto.startsWith("http") ? foto : `${API_BASE_URL}${foto}`) : null;

const AvatarFoto = ({ nombre, foto, size = 32, style }) => {
  const url = fotoUrl(foto);
  if (url) {
    return (
      <img
        src={url}
        alt={nombre}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, ...style }}
      />
    );
  }
  const inicialLetra = nombre ? (nombre.trim()[0] || "?").toUpperCase() : "?";
  return (
    <div className={s.avatarTd} style={{ background: avatarColor(nombre), ...style }}>
      {inicialLetra}
    </div>
  );
};

export default function AfiliadosView() {
  const { user, authAxios } = useAuth();
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

  const role = user?.role || "Recepcionista";
  const tabsDisponibles = TABS_POR_ROL[role] || TABS_POR_ROL.Recepcionista;

  const fetchAfiliados = async () => {
    setLoading(true);
    try {
      const { data } = await authAxios.get("/afiliados");
      setAfiliados(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[AfiliadosView]", err);
      showToast("Error al cargar afiliados", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAfiliados();
  }, []);

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
      const { data } = await authAxios.get(`/afiliados/${id}`);
      setDetalleAfiliado(data);
      setTabActivo(0);
    } catch (err) {
      console.error("[AfiliadosView] detalle:", err);
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
    await authAxios.post(`/afiliados/${id}/foto`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const id = getId(editandoAfiliado);
      await authAxios.patch(`/afiliados/${id}`, formEdit);
      if (fotoFile) await subirFoto(id, fotoFile);
      showToast("Afiliado actualizado correctamente", "success");
      setEditandoAfiliado(null);
      setFotoFile(null);
      setFotoPreview(null);
      fetchAfiliados();
      window.dispatchEvent(new CustomEvent("afiliado-modificado"));
    } catch (err) {
      console.error("[AfiliadosView] edicion:", err);
      showToast("Error al actualizar afiliado", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formCrear,
        estatura_cm: parseFloat(formCrear.estatura_cm) || null,
        disponibilidad_semanal_dias: parseInt(formCrear.disponibilidad_semanal_dias) || 3,
        estado_afiliacion: formCrear.estado,
      };
      delete payload.estado;
      const { data } = await authAxios.post("/afiliados", payload);
      if (fotoFile && data?.id) await subirFoto(data.id, fotoFile);
      showToast("Afiliado creado correctamente", "success");
      setCreandoAbierto(false);
      setFormCrear(FORM_VACIO);
      setFotoFile(null);
      setFotoPreview(null);
      fetchAfiliados();
      window.dispatchEvent(new CustomEvent("afiliado-modificado"));
    } catch (err) {
      console.error("[AfiliadosView] crear:", err);
      showToast("Error al crear afiliado", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (a) => {
    if (!window.confirm(`¿Eliminar a ${nombreCompleto(a)}?`)) return;
    try {
      const id = getId(a);
      await authAxios.delete(`/afiliados/${id}`);
      showToast("Afiliado eliminado", "success");
      fetchAfiliados();
      window.dispatchEvent(new CustomEvent("afiliado-modificado"));
    } catch (err) {
      console.error("[AfiliadosView] eliminar:", err);
      showToast("Error al eliminar afiliado", "danger");
    }
  };

  const puedeCrear = role === "Administrador" || role === "Recepcionista";

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
            <button type="button" className={s.btnPrimary} onClick={() => { setCreandoAbierto(true); setFotoFile(null); setFotoPreview(null); }}>
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
            <div style={{ padding: "3rem 0", textAlign: "center", color: "#94a3b8" }}>Cargando afiliados...</div>
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
                        <td style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{idx + 1}</td>
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
        <div className={s.modalOverlay} onClick={() => !saving && setDetalleAfiliado(null)}>
          <div className={s.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
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

              {detalleAfiliado.restricciones_medicas && (
                <div style={{ marginTop: 12 }}>
                  <div className={s.detailLabel}>Restricciones médicas</div>
                  <div className={s.detailValue}>{detalleAfiliado.restricciones_medicas}</div>
                </div>
              )}

              <div style={{ display: "flex", gap: 4, marginTop: 20, borderBottom: "1px solid #252545" }}>
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

              <div style={{ marginTop: 16, minHeight: 80 }}>
                {tabsDisponibles[tabActivo] === "Estado de Cuenta" && (
                  <div>
                    {detalleAfiliado.ultimo_pago ? (
                      <div className={s.kpiCard} style={{ textAlign: "left" }}>
                        <div className={s.kpiLabel}>Último pago</div>
                        <div className={s.kpiValue} style={{ fontSize: "1rem" }}>
                          ${Number(detalleAfiliado.ultimo_pago.valor_pagado || 0).toLocaleString("es-CO")}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 4 }}>
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
        <div className={s.modalOverlay} onClick={() => !saving && setEditandoAfiliado(null)}>
          <div className={s.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <form onSubmit={guardarEdicion}>
              <div className={s.modalHeader}>
                <h5 className={s.modalTitle}>✏️ Editar: {nombreCompleto(editandoAfiliado)}</h5>
                <button type="button" className={s.btnOutline} onClick={() => !saving && setEditandoAfiliado(null)}>✕</button>
              </div>
              <div className={s.modalBody}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <AvatarFoto nombre={nombreCompleto(editandoAfiliado)} foto={fotoPreview || editandoAfiliado.foto} size={56} />
                  <div style={{ flex: 1 }}>
                    <label className={s.labelText}>Foto de perfil</label>
                    <input
                      className={s.inputDark}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFotoFile(f);
                        setFotoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                      style={{ padding: "0.35rem 0.5rem" }}
                    />
                    <small style={{ color: "#94a3b8" }}>JPG, PNG, WEBP o GIF · máx 5 MB</small>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className={s.labelText}>Nombres</label>
                    <input className={s.inputDark} value={formEdit.nombres} onChange={(e) => setFormEdit({ ...formEdit, nombres: e.target.value })} required />
                  </div>
                  <div>
                    <label className={s.labelText}>Apellidos</label>
                    <input className={s.inputDark} value={formEdit.apellidos} onChange={(e) => setFormEdit({ ...formEdit, apellidos: e.target.value })} required />
                  </div>
                  <div>
                    <label className={s.labelText}>Correo</label>
                    <input className={s.inputDark} type="email" value={formEdit.correo} onChange={(e) => setFormEdit({ ...formEdit, correo: e.target.value })} required />
                  </div>
                  <div>
                    <label className={s.labelText}>Teléfono</label>
                    <input className={s.inputDark} value={formEdit.telefono} onChange={(e) => setFormEdit({ ...formEdit, telefono: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Documento</label>
                    <input className={s.inputDark} value={formEdit.documento} onChange={(e) => setFormEdit({ ...formEdit, documento: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Sexo</label>
                    <select className={s.selectDark} value={formEdit.sexo} onChange={(e) => setFormEdit({ ...formEdit, sexo: e.target.value })}>
                      {SEXOS.map((sx) => <option key={sx} value={sx}>{sx}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Fecha Nacimiento</label>
                    <input className={s.inputDark} type="date" value={formEdit.fecha_nacimiento} onChange={(e) => setFormEdit({ ...formEdit, fecha_nacimiento: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Estatura (cm)</label>
                    <input className={s.inputDark} type="number" value={formEdit.estatura_cm} onChange={(e) => setFormEdit({ ...formEdit, estatura_cm: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Dirección</label>
                    <input className={s.inputDark} value={formEdit.direccion} onChange={(e) => setFormEdit({ ...formEdit, direccion: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Objetivo físico</label>
                    <select className={s.selectDark} value={formEdit.objetivo_fisico} onChange={(e) => setFormEdit({ ...formEdit, objetivo_fisico: e.target.value })}>
                      {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Nivel experiencia</label>
                    <select className={s.selectDark} value={formEdit.nivel_experiencia} onChange={(e) => setFormEdit({ ...formEdit, nivel_experiencia: e.target.value })}>
                      {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Días/semana</label>
                    <input className={s.inputDark} type="number" min={1} max={7} value={formEdit.disponibilidad_semanal_dias} onChange={(e) => setFormEdit({ ...formEdit, disponibilidad_semanal_dias: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Estado</label>
                    <select className={s.selectDark} value={formEdit.estado} onChange={(e) => setFormEdit({ ...formEdit, estado: e.target.value })}>
                      {ESTADOS.map((es) => <option key={es} value={es}>{es}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Grupo muscular</label>
                    <select className={s.selectDark} value={formEdit.grupo_muscular_prioritario} onChange={(e) => setFormEdit({ ...formEdit, grupo_muscular_prioritario: e.target.value })}>
                      {["Pecho", "Espalda", "Piernas", "Glúteos", "Hombros", "Bíceps", "Tríceps", "Abdomen"].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className={s.labelText}>Restricciones médicas</label>
                  <textarea className={s.inputDark} rows={2} value={formEdit.restricciones_medicas} onChange={(e) => setFormEdit({ ...formEdit, restricciones_medicas: e.target.value })} />
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
        <div className={s.modalOverlay} onClick={() => !saving && setCreandoAbierto(null)}>
          <div className={s.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <form onSubmit={handleCrear}>
              <div className={s.modalHeader}>
                <h5 className={s.modalTitle}>➕ Nuevo afiliado</h5>
                <button type="button" className={s.btnOutline} onClick={() => !saving && setCreandoAbierto(null)}>✕</button>
              </div>
              <div className={s.modalBody}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <AvatarFoto nombre={formCrear.nombres || "?"} foto={fotoPreview} size={56} />
                  <div style={{ flex: 1 }}>
                    <label className={s.labelText}>Foto de perfil</label>
                    <input
                      className={s.inputDark}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFotoFile(f);
                        setFotoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                      style={{ padding: "0.35rem 0.5rem" }}
                    />
                    <small style={{ color: "#94a3b8" }}>JPG, PNG, WEBP o GIF · máx 5 MB</small>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className={s.labelText}>Nombres</label>
                    <input className={s.inputDark} value={formCrear.nombres} onChange={(e) => setFormCrear({ ...formCrear, nombres: e.target.value })} required />
                  </div>
                  <div>
                    <label className={s.labelText}>Apellidos</label>
                    <input className={s.inputDark} value={formCrear.apellidos} onChange={(e) => setFormCrear({ ...formCrear, apellidos: e.target.value })} required />
                  </div>
                  <div>
                    <label className={s.labelText}>Correo</label>
                    <input className={s.inputDark} type="email" value={formCrear.correo} onChange={(e) => setFormCrear({ ...formCrear, correo: e.target.value })} required />
                  </div>
                  <div>
                    <label className={s.labelText}>Teléfono</label>
                    <input className={s.inputDark} value={formCrear.telefono} onChange={(e) => setFormCrear({ ...formCrear, telefono: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Documento</label>
                    <input className={s.inputDark} value={formCrear.documento} onChange={(e) => setFormCrear({ ...formCrear, documento: e.target.value })} required />
                  </div>
                  <div>
                    <label className={s.labelText}>Sexo</label>
                    <select className={s.selectDark} value={formCrear.sexo} onChange={(e) => setFormCrear({ ...formCrear, sexo: e.target.value })}>
                      {SEXOS.map((sx) => <option key={sx} value={sx}>{sx}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Fecha Nacimiento</label>
                    <input className={s.inputDark} type="date" value={formCrear.fecha_nacimiento} onChange={(e) => setFormCrear({ ...formCrear, fecha_nacimiento: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Estatura (cm)</label>
                    <input className={s.inputDark} type="number" value={formCrear.estatura_cm} onChange={(e) => setFormCrear({ ...formCrear, estatura_cm: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Dirección</label>
                    <input className={s.inputDark} value={formCrear.direccion} onChange={(e) => setFormCrear({ ...formCrear, direccion: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Objetivo físico</label>
                    <select className={s.selectDark} value={formCrear.objetivo_fisico} onChange={(e) => setFormCrear({ ...formCrear, objetivo_fisico: e.target.value })}>
                      {OBJETIVOS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Nivel experiencia</label>
                    <select className={s.selectDark} value={formCrear.nivel_experiencia} onChange={(e) => setFormCrear({ ...formCrear, nivel_experiencia: e.target.value })}>
                      {NIVELES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Días/semana</label>
                    <input className={s.inputDark} type="number" min={1} max={7} value={formCrear.disponibilidad_semanal_dias} onChange={(e) => setFormCrear({ ...formCrear, disponibilidad_semanal_dias: e.target.value })} />
                  </div>
                  <div>
                    <label className={s.labelText}>Estado</label>
                    <select className={s.selectDark} value={formCrear.estado} onChange={(e) => setFormCrear({ ...formCrear, estado: e.target.value })}>
                      {ESTADOS.map((es) => <option key={es} value={es}>{es}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={s.labelText}>Grupo muscular</label>
                    <select className={s.selectDark} value={formCrear.grupo_muscular_prioritario} onChange={(e) => setFormCrear({ ...formCrear, grupo_muscular_prioritario: e.target.value })}>
                      {["Pecho", "Espalda", "Piernas", "Glúteos", "Hombros", "Bíceps", "Tríceps", "Abdomen"].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label className={s.labelText}>Restricciones médicas</label>
                  <textarea className={s.inputDark} rows={2} value={formCrear.restricciones_medicas} onChange={(e) => setFormCrear({ ...formCrear, restricciones_medicas: e.target.value })} />
                </div>
              </div>
              <div className={s.modalFooter}>
                <button type="button" className={s.btnOutline} onClick={() => setCreandoAbierto(null)} disabled={saving}>
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
