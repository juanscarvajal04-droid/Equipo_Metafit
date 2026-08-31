// ============================================================
// src/services/progresoService.js — MetaFit Progreso Service
//
// RESPONSABILIDAD ÚNICA (ISO 25000 - SoC):
// Punto de contacto EXCLUSIVO con la API para consultar el
// progreso físico y el detalle de un afiliado desde el rol
// Admin/Entrenador (dashboard de seguimiento).
//
// NOTA IMPORTANTE:
// Los endpoints /progreso/* resolvieron para el usuario AUTENTICADO
// (req.user.sub, es decir el propio afiliado desde su app). Para que
// Admin/Entrenador consulten a OTRO afiliado se usan:
//   GET /afiliados/:id            → perfil + ciclo_activo + progreso_fisico
//   GET /afiliados/:id/progreso   → historial de PROGRESO_FISICO (peso, IMC, medidas)
//   GET /afiliados/:id/ejercicios-disponibles → catálogo filtrado por restricciones
// ============================================================

import api from "./api";

/**
 * Obtiene el perfil completo de un afiliado (incluye ciclo_activo,
 * restricciones y progreso_fisico).
 * @param {number|string} afiliadoId
 * @returns {Promise<object>}
 */
export const fetchAfiliado = async (afiliadoId) => {
  const { data } = await api.get(`/afiliados/${afiliadoId}`);
  return data;
};

/**
 * Obtiene el historial físico (PROGRESO_FISICO) de un afiliado:
 * peso_kg, imc, porcentaje_grasa y medidas por fecha de registro.
 * @param {number|string} afiliadoId
 * @returns {Promise<Array>}
 */
export const fetchHistorialFisico = async (afiliadoId) => {
  const { data } = await api.get(`/afiliados/${afiliadoId}/progreso`);
  return data;
};

/**
 * Ejercicios disponibles para el afiliado (excluye los prohibidos
 * por sus restricciones médicas). Se usa para el selector en el
 * dashboard de progreso del entrenador.
 * @param {number|string} afiliadoId
 * @returns {Promise<Array>}
 */
export const fetchEjerciciosDisponibles = async (afiliadoId) => {
  const { data } = await api.get(`/afiliados/${afiliadoId}/ejercicios-disponibles`);
  return data;
};

/**
 * Calcula la evolución de peso e IMC a partir del historial físico.
 * Devuelve arrays ordenados cronológicamente (ascendente) listos
 * para graficar con react-chartjs-2.
 *
 * @param {Array} historial Registros de PROGRESO_FISICO (orden de BD: DESC).
 * @returns {{ etiquetas: string[], pesos: number[], imcs: number[], grasa: number[] }}
 */
export const calcularEvolucion = (historial = []) => {
  const ordenado = [...historial]
    .filter((p) => p && p.fecha_registro)
    .sort((a, b) => new Date(a.fecha_registro) - new Date(b.fecha_registro));

  const etiquetas = ordenado.map((p) =>
    new Date(p.fecha_registro).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    })
  );
  const pesos = ordenado.map((p) => (p.peso_kg != null ? Number(p.peso_kg) : null));
  const imcs = ordenado.map((p) => (p.imc != null ? Number(p.imc) : null));
  const grasa = ordenado.map((p) =>
    p.porcentaje_grasa != null ? Number(p.porcentaje_grasa) : null
  );

  return { etiquetas, pesos, imcs, grasa };
};

/**
 * Extrae las métricas resumidas del último registro físico.
 * @param {Array} historial
 * @returns {{ peso: number|null, imc: number|null, grasa: number|null, fecha: string|null }}
 */
export const ultimoRegistroFisico = (historial = []) => {
  if (!historial.length) return { peso: null, imc: null, grasa: null, fecha: null };
  const ultimo = historial[0];
  return {
    peso: ultimo.peso_kg != null ? Number(ultimo.peso_kg) : null,
    imc: ultimo.imc != null ? Number(ultimo.imc) : null,
    grasa: ultimo.porcentaje_grasa != null ? Number(ultimo.porcentaje_grasa) : null,
    fecha: ultimo.fecha_registro || null,
  };
};