// backend/utils/fechaUtils.js
// Utilidades de normalización de fechas — sin dependencias externas.
// Extraído de afiliadoService para poder ser probado unitariamente sin BD.
'use strict';

/**
 * Normaliza una fecha al formato YYYY-MM-DD que exige MySQL.
 *
 * Formatos aceptados:
 *   - DD/MM/YYYY  →  "04/05/1987"  →  "1987-05-04"
 *   - YYYY-MM-DD  →  "1987-05-04"  →  "1987-05-04"  (sin cambios)
 *   - ISO 8601    →  "2000-05-20T00:00:00.000Z" → "2000-05-20"
 *   - null / undefined / cadena vacía → null
 *
 * @param {string|null|undefined} fecha
 * @returns {string|null} Fecha en formato YYYY-MM-DD o null
 * @throws {Error} Si la fecha no es reconocible o es inválida (ej. mes 13)
 */
function normalizarFecha(fecha) {
  if (!fecha) return null;
  fecha = String(fecha).trim();
  if (!fecha) return null;

  // DD/MM/YYYY → YYYY-MM-DD
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha)) {
    const [d, m, y] = fecha.split('/');
    const candidato = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    // Validar que la fecha resultante sea real (ej. 32/01/2024 daría inválida)
    if (isNaN(new Date(candidato).getTime())) {
      throw new Error(`Fecha inválida: "${fecha}"`);
    }
    return candidato;
  }

  // ISO 8601 completo o YYYY-MM-DD con hora → tomar solo la parte de fecha
  const soloFecha = fecha.split('T')[0].split(' ')[0];
  if (isNaN(new Date(soloFecha).getTime())) {
    throw new Error(`Fecha inválida: "${fecha}"`);
  }
  return soloFecha;
}

module.exports = { normalizarFecha };
