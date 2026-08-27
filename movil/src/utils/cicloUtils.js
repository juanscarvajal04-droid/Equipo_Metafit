// movil/src/utils/cicloUtils.js
// Utilidades compartidas para el manejo de ciclos (HU17 / HU43).
// Contrato real del backend (GET /afiliados/me/ciclos):
//   array de ciclos con: id_ciclo, activo (0|1), objetivo_fisico,
//   disponibilidad_dias, fecha_inicio, fecha_fin, numero_ciclo, ...

// Selecciona el ciclo activo del afiliado de forma explícita.
// No asume que data[0] es el activo: busca activo === 1 y solo
// como respaldo (datos sin marcar) toma el más reciente.
export const seleccionarCicloActivo = (ciclos) => {
  if (!Array.isArray(ciclos) || ciclos.length === 0) return null;
  return ciclos.find((c) => Number(c.activo) === 1) || ciclos[0] || null;
};

export const esCicloActivo = (ciclo) => Number(ciclo?.activo) === 1;

// Normaliza una fecha del backend ("2024-07-01T00:00:00.000Z") a "2024-07-01".
export const formatearFecha = (fecha) =>
  fecha ? String(fecha).slice(0, 10) : '-';