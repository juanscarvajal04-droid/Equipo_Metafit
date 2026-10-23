'use strict';

/**
 * Construye las asignaciones `columna=?` y sus valores para un UPDATE,
 * filtrando únicamente los campos permitidos y definidos.
 */
function construirSets(campos, permitidos) {
  const sets = [];
  const valores = [];
  for (const key of permitidos) {
    if (campos[key] !== undefined) {
      sets.push(`${key}=?`);
      valores.push(campos[key]);
    }
  }
  return { sets, valores };
}

module.exports = { construirSets };
