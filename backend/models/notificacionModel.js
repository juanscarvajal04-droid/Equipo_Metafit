// backend/models/notificacionModel.js
// Notificaciones contextuales por rol — queries contra tablas reales
// FASE NOTIFICACIONES: queries corregidas + campo ruta en todas + progreso_estancado
// Las notificaciones NO se guardan en una tabla: se calculan en vivo contra las
// tablas de negocio (PAGO, AFILIADO, USUARIO, CICLO, PROGRESO_FISICO) según el rol
// del usuario. Cada una devuelve { tipo, mensaje, cantidad, icono, ruta } donde
// `ruta` es la URL del frontend a la que redirige al hacer clic.
'use strict';

const pool = require('../config/db');

const NotificacionModel = {

  /**
   * Despacha la construcción de notificaciones según el rol del usuario.
   * Cada rol ve indicadores distintos (Admin → operación general, Recepcionista
   * → pagos y cumpleaños, Entrenador → casos médicos y de progreso). Los roles
   * sin lógica específica no reciben notificaciones.
   *
   * @param {string} rol - Rol del usuario (Administrador | Recepcionista | Entrenador)
   * @returns {Promise<Array<Object>>} Lista de notificaciones para ese rol
   *                                   (vacía si el rol no tiene definición).
   */
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

  /**
   * Notificaciones del rol Administrador: membresías por vencer en los
   * próximos 7 días, afiliados registrados en la última semana y personal
   * aún en estado 'Pendiente' sin activar. Cada una cuenta una fila con su
   * query dedicada (tres roundtrips pequeños en vez de un JOIN gigante).
   *
   * @returns {Promise<Array<Object>>} 3 notificaciones de gestión administrativa.
   */
  _admin: async () => {
    // Membresías cuyo pago está vigente y vence dentro de los próximos 7 días.
    const [[{ membresias }]] = await pool.query(`
      SELECT COUNT(*) AS membresias
      FROM PAGO
      WHERE estado = 'Pagado'
        AND fecha_vencimiento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    `);
    // Altas nuevas de afiliados en la última semana (ventana móvil de 7 días).
    const [[{ nuevos }]] = await pool.query(`
      SELECT COUNT(*) AS nuevos
      FROM AFILIADO
      WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `);
    // Personal (todo rol excepto Afiliado) que aún espera activación.
    const [[{ pendientes }]] = await pool.query(`
      SELECT COUNT(*) AS pendientes
      FROM USUARIO
      WHERE estado = 'Pendiente'
        AND rol != 'Afiliado'
    `);

    return [
      { tipo: 'membresias_por_vencer', mensaje: 'Membresías por vencer esta semana', cantidad: membresias, icono: '💳', ruta: '/pagos' },
      { tipo: 'nuevos_afiliados',      mensaje: 'Nuevos afiliados esta semana',       cantidad: nuevos,     icono: '👤', ruta: '/afiliados' },
      { tipo: 'personal_pendiente',    mensaje: 'Personal pendiente de activación',   cantidad: pendientes, icono: '🛡️', ruta: '/personal' },
    ];
  },

  /**
   * Notificaciones del rol Recepcionista: pagos registrados hoy, cobros
   * vencidos o pendientes, cumpleaños del mes (el filtro ignora el año a
   * propósito) y afiliados nuevos de la semana. Reflejan la operación diaria
   * de caja y recepción.
   *
   * @returns {Promise<Array<Object>>} 4 notificaciones operativas de recepción.
   */
  _recepcionista: async () => {
    // Cobros hechos en el día (para el cierre de caja).
    const [[{ pagosHoy }]] = await pool.query(`
      SELECT COUNT(*) AS pagosHoy
      FROM PAGO
      WHERE fecha_pago = CURDATE()
    `);
    // Vencidos por estado 'Vencido' O pendientes con fecha ya superada.
    const [[{ vencidos }]] = await pool.query(`
      SELECT COUNT(*) AS vencidos
      FROM PAGO
      WHERE estado = 'Vencido'
        OR (fecha_vencimiento < CURDATE() AND estado = 'Pendiente')
    `);
    // Cumpleaños del mes: MONTH(X)=MONTH(CURDATE()) ignora el año y cuenta
    // solo el mes. Nota: repite cumpleaños si el afiliado no se borra año a año.
    const [[{ cumples }]] = await pool.query(`
      SELECT COUNT(*) AS cumples
      FROM AFILIADO
      WHERE MONTH(fecha_nacimiento) = MONTH(CURDATE())
    `);
    // Altas nuevas de afiliados en la última semana.
    const [[{ nuevos }]] = await pool.query(`
      SELECT COUNT(*) AS nuevos
      FROM AFILIADO
      WHERE fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    `);

    return [
      { tipo: 'pagos_hoy',         mensaje: 'Pagos registrados hoy',                cantidad: pagosHoy, icono: '💵', ruta: '/pagos' },
      { tipo: 'pagos_vencidos',    mensaje: 'Pagos vencidos o pendientes',          cantidad: vencidos, icono: '🔴', ruta: '/pagos' },
      { tipo: 'cumpleaños_mes',    mensaje: 'Cumpleaños del mes',                   cantidad: cumples,  icono: '🎂', ruta: '/afiliados' },
      { tipo: 'bienvenida_nuevos', mensaje: 'Nuevos afiliados esta semana',         cantidad: nuevos,   icono: '👤', ruta: '/afiliados' },
    ];
  },

  /**
   * Notificaciones del rol Entrenador, enfocadas en afiliados con
   * restricciones sin plan, progreso estancado, ciclos activos y cantidad de
   * personas con restricciones. Regla especial de la primera: un afiliado se
   * considera "sin plan" solo si tiene alguna restricción registrada (se une
   * contra AFILIADO_RESTRICCION) y le falta ciclo activo o plan alimentario.
   *
   * @returns {Promise<Array<Object>>} 4 notificaciones del entrenador.
   */
  _entrenador: async () => {
    // Afiliados activos CON restricciones pero sin ciclo activo o sin plan de
    // entrenamiento (LEFT JOIN a CICLO/PLAN_ENTRENAMIENTO → fila null).
    const [[{ sin_plan }]] = await pool.query(`
      SELECT COUNT(DISTINCT a.id_usuario) AS sin_plan
      FROM AFILIADO a
      JOIN AFILIADO_RESTRICCION ar ON ar.id_usuario = a.id_usuario
      LEFT JOIN CICLO c ON c.id_usuario = a.id_usuario AND c.activo = 1
      LEFT JOIN PLAN_ENTRENAMIENTO pe ON pe.id_ciclo = c.id_ciclo
      WHERE a.estado_afiliacion = 'Activo'
        AND (c.id_ciclo IS NULL OR pe.id_ciclo IS NULL)
    `);

    // Afiliados con ciclo activo que no registraron progreso físico en los
    // últimos 15 días (LEFT JOIN filtrado por fecha dentro del join).
    const [[{ estancados }]] = await pool.query(`
      SELECT COUNT(DISTINCT c.id_usuario) AS estancados
      FROM CICLO c
      LEFT JOIN PROGRESO_FISICO pf ON pf.id_ciclo = c.id_ciclo
        AND pf.fecha_registro >= DATE_SUB(CURDATE(), INTERVAL 15 DAY)
      WHERE c.activo = 1
        AND pf.id_ciclo IS NULL
    `);

    // Total de ciclos de entrenamiento en curso (carga de trabajo).
    const [[{ activos }]] = await pool.query(`
      SELECT COUNT(*) AS activos
      FROM CICLO
      WHERE activo = 1
    `);

    // Afiliados activos con al menos una restricción médica registrada.
    const [[{ con_restricciones }]] = await pool.query(`
      SELECT COUNT(DISTINCT ar.id_usuario) AS con_restricciones
      FROM AFILIADO_RESTRICCION ar
      JOIN AFILIADO a ON ar.id_usuario = a.id_usuario
      WHERE a.estado_afiliacion = 'Activo'
    `);

    return [
      { tipo: 'sin_plan',            mensaje: 'Afiliados con restricciones sin plan',   cantidad: sin_plan,     icono: '⚠️', ruta: '/rutinas' },
      { tipo: 'progreso_estancado',  mensaje: 'Sin registro de progreso (+15 días)',   cantidad: estancados,   icono: '📉', ruta: '/rutinas' },
      { tipo: 'ciclos_activos',      mensaje: 'Ciclos de entrenamiento activos',        cantidad: activos,      icono: '🔄', ruta: '/rutinas' },
      { tipo: 'con_restricciones',   mensaje: 'Afiliados activos con restricciones',    cantidad: con_restricciones, icono: '🩺', ruta: '/afiliados' },
    ];
  },
};

module.exports = NotificacionModel;