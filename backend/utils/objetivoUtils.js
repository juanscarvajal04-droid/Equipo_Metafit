// backend/utils/objetivoUtils.js
// Normalización de ENUMs textuales de MetaFit (objetivo_fisico, nivel_experiencia).
// Sin dependencias externas: se puede probar unitariamente sin BD.
'use strict';

// Elimina tildes/diacríticos: "Pérdida de grasa" → "Perdida de grasa".
function quitarTildes(texto) {
  if (typeof texto !== 'string') return texto;
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Valores ENUM reales de la tabla CICLO (sin tildes).
const OBJETIVOS_VALIDOS = ['Perdida de grasa', 'Aumento de masa', 'Mantenimiento', 'Rehabilitacion'];
const NIVELES_VALIDOS   = ['Principiante', 'Intermedio', 'Avanzado'];

/**
 * Normaliza un objetivo físico al valor ENUM canónico (sin tildes).
 * "Pérdida de grasa" (con tilde) → "Perdida de grasa" (valor ENUM).
 * "Perdida de grasa" (ya correcto) → se devuelve intacto.
 * Cualquier otro valor se devuelve tal cual (la validación posterior lo rechaza).
 */
function normalizarObjetivoFisico(valor) {
  const limpio = quitarTildes(valor);
  const coincide = OBJETIVOS_VALIDOS.find(
    o => o.toLowerCase().replace(/\s+/g, ' ') === String(limpio).toLowerCase().replace(/\s+/g, ' ')
  );
  return coincide || limpio;
}

/**
 * Normaliza un nivel de experiencia quitando tildes a la vez que respeta
 * el valor ENUM canónico. Incluido por simetría con objetivo_fisico.
 */
function normalizarNivelExperiencia(valor) {
  const limpio = quitarTildes(valor);
  const coincide = NIVELES_VALIDOS.find(
    n => n.toLowerCase() === String(limpio).toLowerCase()
  );
  return coincide || limpio;
}

module.exports = {
  quitarTildes,
  normalizarObjetivoFisico,
  normalizarNivelExperiencia,
  OBJETIVOS_VALIDOS,
  NIVELES_VALIDOS,
};