// backend/models/notificacionModel.js
// Notificaciones contextuales por rol — queries contra tablas reales
'use strict';

const pool = require('../config/db');

const NotificacionModel = {

  getByRole: async (rol) => {
    switch (rol) {
      case 'Administrador':
        return NotificacionModel._admin();
      case 'Recepcionista':
        return NotificacionModel._recepcionista();
      case 'Entrenador':
        return NotificacionModel._entrenador();
      default:
        return [];
    }
  },

  _admin: async () => {
    const [[{ membresias }]] = await pool.query(`
      SELECT COUNT(*) AS membresias
      FROM PAGO
      WHERE estado = 'Pagado'
        AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);
    const [[{ nuevos }]] = await pool.query(`
      SELECT COUNT(*) AS nuevos
      FROM AFILIADO
      WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);
    const [[{ pendientes }]] = await pool.query(`
      SELECT COUNT(*) AS pendientes
      FROM USUARIO
      WHERE estado = 'Pendiente'
        AND rol != 'Afiliado'
    `);

    return [
      { tipo: 'membresias_por_vencer', mensaje: 'Membresías por vencer esta semana', cantidad: membresias, icono: '💳', ruta: '/pagos' },
      { tipo: 'nuevos_afiliados', mensaje: 'Nuevos afiliados en los últimos 30 días', cantidad: nuevos,     icono: '👤', ruta: '/afiliados' },
      { tipo: 'personal_pendiente', mensaje: 'Personal pendiente de activación',      cantidad: pendientes, icono: '🛡️', ruta: '/personal' },
    ];
  },

  _recepcionista: async () => {
    const [[{ pagosHoy }]] = await pool.query(`
      SELECT COUNT(*) AS pagosHoy
      FROM PAGO
      WHERE fecha_pago = CURDATE()
    `);
    const [[{ vencidos }]] = await pool.query(`
      SELECT COUNT(*) AS vencidos
      FROM PAGO
      WHERE estado = 'Vencido'
        OR (fecha_vencimiento < CURDATE() AND estado = 'Pendiente')
    `);
    const [[{ cumples }]] = await pool.query(`
      SELECT COUNT(*) AS cumples
      FROM AFILIADO
      WHERE MONTH(fecha_nacimiento) = MONTH(CURDATE())
    `);
    const [[{ nuevos }]] = await pool.query(`
      SELECT COUNT(*) AS nuevos
      FROM AFILIADO
      WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    return [
      { tipo: 'pagos_hoy',         mensaje: 'Pagos registrados hoy',                cantidad: pagosHoy, icono: '💵', ruta: '/pagos' },
      { tipo: 'pagos_vencidos',    mensaje: 'Pagos vencidos o pendientes',          cantidad: vencidos, icono: '🔴', ruta: '/pagos' },
      { tipo: 'cumpleaños_mes',    mensaje: 'Cumpleaños del mes',                   cantidad: cumples,  icono: '🎂', ruta: '/afiliados' },
      { tipo: 'bienvenida_nuevos', mensaje: 'Nuevos afiliados en los últimos 30 d', cantidad: nuevos,   icono: '👤', ruta: '/afiliados' },
    ];
  },

  _entrenador: async () => {
    const [[{ sin_plan }]] = await pool.query(`
      SELECT COUNT(DISTINCT a.id_usuario) AS sin_plan
      FROM AFILIADO a
      LEFT JOIN CICLO c ON c.id_usuario = a.id_usuario AND c.activo = 1
      LEFT JOIN PLAN_ENTRENAMIENTO pe ON pe.id_ciclo = c.id_ciclo
      WHERE a.estado_afiliacion = 'Activo'
        AND (c.id_ciclo IS NULL OR pe.id_ciclo IS NULL)
    `);

    const [[{ activos }]] = await pool.query(`
      SELECT COUNT(*) AS activos
      FROM CICLO
      WHERE activo = 1
    `);

    const [[{ con_restricciones }]] = await pool.query(`
      SELECT COUNT(DISTINCT id_usuario) AS con_restricciones
      FROM AFILIADO_RESTRICCION ar
      JOIN AFILIADO a ON ar.id_usuario = a.id_usuario
      WHERE a.estado_afiliacion = 'Activo'
    `);

    return [
      { tipo: 'sin_plan',          mensaje: 'Afiliados activos sin plan de entrenamiento',     cantidad: sin_plan,          icono: '⚠️', ruta: '/rutinas' },
      { tipo: 'ciclos_activos',    mensaje: 'Ciclos de entrenamiento activos',                  cantidad: activos,           icono: '🔄', ruta: '/afiliados' },
      { tipo: 'con_restricciones', mensaje: 'Afiliados activos con restricciones médicas',      cantidad: con_restricciones, icono: '🩺', ruta: '/afiliados' },
    ];
  },
};

module.exports = NotificacionModel;
