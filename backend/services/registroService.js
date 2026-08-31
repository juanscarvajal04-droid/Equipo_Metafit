// backend/services/registroService.js
// FASE 1: registrar ejecución real de ejercicios y consumo real de alimentos,
// y mantener el resumen diario (PROGRESO_DIARIO) en la misma transacción.
'use strict';

const pool = require('../config/db');
const CicloModel = require('../models/cicloModel');
const RegistroEjercicioModel = require('../models/registroEjercicioModel');
const ConsumoAlimentoRealModel = require('../models/consumoAlimentoRealModel');
const ProgresoDiarioModel = require('../models/progresoDiarioModel');
const { normalizarFecha } = require('../utils/fechaUtils');

// Normaliza la fecha y traduce errores de formato a DATOS_INVALIDOS (HTTP 400).
function normalizarFechaSegura(fecha) {
  try {
    return normalizarFecha(fecha);
  } catch (e) {
    const err = new Error(e.message || 'Fecha inválida');
    err.code = 'DATOS_INVALIDOS';
    throw err;
  }
}

// Valida que el ciclo exista y pertenezca al usuario autenticado.
async function verificarCicloDe(idUsuario, idCiclo) {
  const ciclo = await CicloModel.findById(idCiclo);
  if (!ciclo) {
    const err = new Error('Ciclo no encontrado');
    err.code = 'CICLO_NO_ENCONTRADO';
    throw err;
  }
  if (ciclo.id_usuario !== idUsuario) {
    const err = new Error('Este ciclo no te pertenece');
    err.code = 'CICLO_AJENO';
    throw err;
  }
  return ciclo;
}

const RegistroService = {

  // ── REGISTRO_EJERCICIO (ejecución real: series/reps/peso) ─────
  registerEjercicio: async (idUsuario, datos) => {
    const { id_ciclo, id_rutina, orden, fecha, series, repeticiones, peso_utilizado_kg, notas } = datos;
    if (!id_ciclo || !id_rutina || orden == null || !fecha || series == null || repeticiones == null) {
      const err = new Error('id_ciclo, id_rutina, orden, fecha, series y repeticiones son requeridos');
      err.code = 'DATOS_INCOMPLETOS';
      throw err;
    }
    const fechaN = normalizarFechaSegura(fecha);
    await verificarCicloDe(idUsuario, id_ciclo);
    if (Number(series) < 1 || Number(repeticiones) < 1) {
      const err = new Error('series y repeticiones deben ser al menos 1');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const id_registro = await RegistroEjercicioModel.insertar(conn, {
        id_usuario: idUsuario, id_ciclo, id_rutina, orden, fecha: fechaN,
        series, repeticiones, peso_utilizado_kg, notas,
      });
      const resumen = await ProgresoDiarioModel.sincronizar(conn, idUsuario, fechaN);
      await conn.commit();
      return { message: 'Ejercicio registrado correctamente', id_registro, resumen };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // ── CONSUMO_ALIMENTO_REAL (lo que realmente consumió del plan) ─
  registerConsumoAlimento: async (idUsuario, datos) => {
    const { id_ciclo, num_comida, id_alimento, fecha, cantidad_g_consumida } = datos;
    if (!id_ciclo || num_comida == null || !id_alimento || !fecha || cantidad_g_consumida == null) {
      const err = new Error('id_ciclo, num_comida, id_alimento, fecha y cantidad_g_consumida son requeridos');
      err.code = 'DATOS_INCOMPLETOS';
      throw err;
    }
    const fechaN = normalizarFechaSegura(fecha);
    await verificarCicloDe(idUsuario, id_ciclo);
    if (Number(cantidad_g_consumida) <= 0) {
      const err = new Error('cantidad_g_consumida debe ser mayor a 0');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const { id_consumo, calorias_consumidas } = await ConsumoAlimentoRealModel.insertar(conn, {
        id_usuario: idUsuario, id_ciclo, num_comida, id_alimento, fecha: fechaN, cantidad_g_consumida,
      });
      const resumen = await ProgresoDiarioModel.sincronizar(conn, idUsuario, fechaN);
      await conn.commit();
      return { message: 'Consumo de alimento registrado correctamente', id_consumo, calorias_consumidas, resumen };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // ── Historiales ─────────────────────────────────────────────
  getHistorialEjercicios: async (idUsuario, query) => {
    return RegistroEjercicioModel.getHistorial(idUsuario, query);
  },

  getEvolucionEjercicio: async (idUsuario, idEjercicio, query) => {
    return RegistroEjercicioModel.getEvolucion(idUsuario, idEjercicio, query);
  },

  getHistorialConsumos: async (idUsuario, query) => {
    return ConsumoAlimentoRealModel.getHistorial(idUsuario, query);
  },
};

module.exports = RegistroService;