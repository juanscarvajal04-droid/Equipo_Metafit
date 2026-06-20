// ============================================================
// src/services/afiliadosService.js — MetaFit Afiliados Service
//
// RESPONSABILIDAD ÚNICA (ISO 25000 - SoC):
// Punto de contacto EXCLUSIVO con la API para el recurso
// /afiliados. Ningún componente .jsx ni Contexto debe realizar
// llamadas Axios directas a estos endpoints.
//
// Agrupa:
//   1. Datos de dominio (catálogos, configuraciones)
//   2. Helpers de transformación de datos (puros, sin side-effects)
//   3. Operaciones CRUD contra el backend
// ============================================================

import api from './api';

// ── 1. DATOS DE DOMINIO ──────────────────────────────────────

export const OBJETIVO_CONFIG = {
  'Pérdida de grasa': { icono: '🔥', color: '#e94560' },
  'Aumento de masa':  { icono: '💪', color: '#0d6efd' },
  'Mantenimiento':    { icono: '⚖️', color: '#198754' },
};

export const OBJETIVOS = Object.keys(OBJETIVO_CONFIG);
export const NIVELES   = ['Principiante', 'Intermedio', 'Avanzado'];
export const ESTADOS   = ['Activo', 'Inactivo', 'Pendiente'];
export const SEXOS     = ['Masculino', 'Femenino', 'Otro'];
export const MUSCULOS  = ['Pecho', 'Espalda', 'Piernas', 'Glúteos', 'Hombros', 'Bíceps', 'Tríceps', 'Abdomen'];

/** Pestañas disponibles según el rol del usuario autenticado. */
export const TABS_POR_ROL = {
  Recepcionista: ['Estado de Cuenta'],
  Entrenador:    ['Progreso Físico', 'Ciclo Activo'],
  Administrador: ['Estado de Cuenta', 'Progreso Físico', 'Ciclo Activo'],
};

/** Estado inicial del formulario de creación/edición. */
export const FORM_VACIO = {
  nombres: '', apellidos: '', correo: '', telefono: '', direccion: '',
  documento: '', fecha_nacimiento: '', sexo: 'Masculino',
  estatura_cm: '', objetivo_fisico: 'Pérdida de grasa',
  grupo_muscular_prioritario: 'Pecho', nivel_experiencia: 'Principiante',
  disponibilidad_semanal_dias: 3, estado: 'Activo',
  restricciones_medicas: '',
};

// ── 2. HELPERS DE TRANSFORMACIÓN (funciones puras) ───────────

/**
 * Resuelve el id de un afiliado independientemente del campo
 * que use el backend (MySQL: id_usuario / legacy: _id / id).
 */
export const getId = (doc) => doc.id_usuario ?? doc._id ?? doc.id;

/** Construye el nombre completo o retorna 'Sin nombre' como fallback. */
export const nombreCompleto = (a) =>
  [a.nombres, a.apellidos].filter(Boolean).join(' ') || 'Sin nombre';

/** Obtiene la inicial del nombre o correo para el avatar. */
export const inicial = (a) =>
  (a.nombres || a.correo || '?')[0].toUpperCase();

/** Retorna el ciclo activo del afiliado o null. */
export const cicloActivo = (a) => a.ciclo_activo || null;

/**
 * Convierte una fecha ISO (MySQL: '2000-01-30T00:00:00.000Z')
 * al formato 'YYYY-MM-DD' requerido por <input type="date">.
 * Retorna cadena vacía si el valor es nulo o inválido.
 */
export const toDateInput = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v.split('T')[0].split(' ')[0];
  if (v instanceof Date)     return v.toISOString().split('T')[0];
  return '';
};

/**
 * Construye el payload limpio para crear un afiliado.
 * Mapea los nombres del formulario a los campos exactos del schema MySQL.
 * La contraseña es generada automáticamente en el backend: MF_{documento}@2025
 *
 * @param {object} form - Estado del formulario de creación.
 * @returns {object} payload listo para enviar al backend.
 */
export const buildCrearPayload = (form) => ({
  nombres:             form.nombres,
  apellidos:           form.apellidos,
  correo:              form.correo,
  telefono:            form.telefono || '',
  direccion:           form.direccion || '',
  documento:           form.documento,
  fecha_nacimiento:    form.fecha_nacimiento
    ? String(form.fecha_nacimiento).split('T')[0].split(' ')[0]
    : null,
  sexo:                        form.sexo,
  estatura_cm:                 parseFloat(form.estatura_cm) || null,
  estado_afiliacion:           form.estado || 'Activo',
  objetivo_fisico:             form.objetivo_fisico,
  grupo_muscular_prioritario:  form.grupo_muscular_prioritario,
  nivel_experiencia:           form.nivel_experiencia,
  disponibilidad_semanal_dias: parseInt(form.disponibilidad_semanal_dias) || 3,
});

/**
 * Construye el objeto de afiliado optimista para actualizar
 * el estado local inmediatamente tras la creación, sin esperar
 * a recargar la lista desde el backend.
 *
 * @param {object} payload - Payload enviado al backend.
 * @param {number|string} idRetornado - ID retornado por el backend.
 * @returns {object} Afiliado normalizado para el estado local.
 */
export const buildAfiliadoLocal = (payload, idRetornado) => ({
  ...payload,
  id_usuario:    idRetornado,
  estado: payload.estado_afiliacion,
  restricciones: [],
  ciclo_activo:  null,
});

// ── 3. OPERACIONES CRUD ──────────────────────────────────────

/**
 * Obtiene la lista completa de afiliados.
 * Todos los roles (Admin, Entrenador, Recepcionista) tienen acceso.
 *
 * @returns {Promise<Array>} Lista de afiliados.
 */
export const fetchAfiliados = async () => {
  const { data } = await api.get('/afiliados');
  return data;
};

/**
 * Crea un nuevo afiliado en el sistema.
 *
 * @param {object} form - Estado del formulario de creación.
 * @returns {Promise<{ payload: object, idRetornado: number }>}
 *   Incluye el payload enviado y el id asignado por el backend.
 */
export const crearAfiliado = async (form) => {
  const payload       = buildCrearPayload(form);
  const { data }      = await api.post('/afiliados', payload);
  return { payload, idRetornado: data.id };
};

/**
 * Actualiza parcialmente un afiliado existente.
 * El backend devuelve { message }, NO el objeto actualizado,
 * por eso el merge se realiza en la Vista con los datos del formulario.
 *
 * @param {number|string} id   - ID del afiliado.
 * @param {object}        data - Campos a actualizar.
 * @returns {Promise<void>}
 */
export const actualizarAfiliado = async (id, data) => {
  await api.patch(`/afiliados/${id}`, data);
};

/**
 * Cambia únicamente el estado de afiliación (Activo/Inactivo/Pendiente).
 * Acción rápida disponible para Recepcionistas desde la tabla.
 *
 * @param {number|string} id          - ID del afiliado.
 * @param {string}        nuevoEstado - Nuevo valor del estado.
 * @returns {Promise<object>} Objeto afiliado actualizado retornado por el backend.
 */
export const cambiarEstadoAfiliado = async (id, nuevoEstado) => {
  const { data } = await api.patch(`/afiliados/${id}`, { estado: nuevoEstado });
  return data;
};
