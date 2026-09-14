// backend/models/usuarioModel.js
// ─── Consultas SQL de la tabla USUARIO (bcrypt) ───────────────
// Capa de acceso a datos de la tabla USUARIO: representa cuentas de login de
// todos los roles (Administrador, Entrenador, Recepcionista y Afiliado).
// Los afiliados tienen un perfil extendido en AFILIADO (ver afiliadoModel.js).
// Regla: la contraseña NUNCA se devuelve en las consultas de lectura; solo se
// lee para compararla contra bcrypt en el flujo de login.
'use strict';

const pool                   = require('../config/db');
const { hashPassword }       = require('../services/authService');

const UsuarioModel = {

  /**
   * Busca un usuario por correo electrónico. Devuelve también el hash de
   * contraseña (única consulta que lo incluye) para poder compararlo con
   * bcrypt en el flujo de login y de recuperación de contraseña.
   *
   * @param {string} correo - Correo electrónico del usuario (sin normalizar)
   * @returns {Promise<Object|null>} Fila de USUARIO (incluye contrasena) o
   *                                 null si no existe.
   */
  findByEmail: async (correo) => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres, apellidos, correo,
              contrasena, rol, estado
       FROM USUARIO
       WHERE correo = ?`,
      [correo]
    );
    return rows[0] || null;
  },

  /**
   * Lista todos los usuarios que NO son afiliados (staff interno del
   * gimnasio), ordenados por rol y nombre. Usado por la vista de Gestión de
   * Personal del panel web.
   *
   * @returns {Promise<Array<Object>>} Lista de usuarios staff (sin contraseña).
   */
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres, apellidos, correo,
              rol, estado, fecha_registro
       FROM USUARIO
       WHERE rol != 'Afiliado'
       ORDER BY rol, nombres`
    );
    return rows;
  },

  /**
   * Lista las recepcionistas activas únicamente. Se usa para los selectores
   * "¿Quién registró?" / asignación de personal en mostrador, donde solo
   * tienen sentido las cuentas habilitadas.
   *
   * @returns {Promise<Array<Object>>} Lista de recepcionistas con estado Activo.
   */
  findRecepcionistas: async () => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres, apellidos, correo,
              rol, estado, fecha_registro
       FROM USUARIO
       WHERE rol = 'Recepcionista' AND estado = 'Activo'
       ORDER BY nombres`
    );
    return rows;
  },

  /**
   * Busca un usuario por su ID, sin incluir la contraseña (nunca se debe
   * exponer a cliente).
   *
   * @param {number} id - ID del usuario (PK de USUARIO)
   * @returns {Promise<Object|null>} Fila de USUARIO o null si no existe.
   */
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres, apellidos, correo,
              rol, estado, fecha_registro
       FROM USUARIO WHERE id_usuario = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Crea un usuario nuevo en USUARIO. La contraseña se hashea ANTES de
   * insertarla (el hash se pasa como parámetro, nunca la contraseña en
   * texto plano). El estado por defecto es 'Pendiente' si no se indica.
   *
   * @param {Object} datos - Datos del usuario:
   *   @param {string} datos.nombres
   *   @param {string} datos.apellidos
   *   @param {string} datos.correo
   *   @param {string} datos.contrasena - Contraseña en texto plano (se hashea)
   *   @param {string} datos.rol
   *   @param {string} [datos.estado] - 'Activo' | 'Inactivo' | 'Pendiente'
   * @returns {Promise<number>} ID (insertId) del usuario creado.
   * @throws {Error} Si la contraseña es vacía o supera 72 bytes (de authService).
   */
  create: async ({ nombres, apellidos, correo, contrasena, rol, estado }) => {
    const hash = await hashPassword(contrasena);   // bcrypt, 12 rondas
    const [result] = await pool.query(
      `INSERT INTO USUARIO (nombres, apellidos, correo, contrasena, rol, estado)
       VALUES (?,?,?,?,?,?)`,
      [nombres, apellidos, correo, hash, rol, estado || 'Pendiente']
    );
    return result.insertId;
  },

  /**
   * Actualiza parcialmente un usuario (PATCH). Solo actualiza los campos
   * permitidos enviados en `campos`; también puede actualizar la contraseña,
   * que se hashea con bcrypt antes de escribirla.
   *
   * REGLA DE NEGOCIO: los campos editables están en una whitelist explícita
   * ('nombres','apellidos','correo','rol','estado') para impedir que se
   * inyecten columnas arbitrarias vía la interpolación del SET.
   *
   * @param {number} id - ID del usuario a actualizar
   * @param {Object} campos - Campos permitidos a actualizar
   * @returns {Promise<number>} Número de filas afectadas (0 si no cambió nada).
   */
  update: async (id, campos) => {
    const permitidos = ['nombres','apellidos','correo','rol','estado'];
    const sets = [];
    const vals = [];

    // Construye dinámicamente "columna = ?" solo para los campos presentes.
    for (const key of permitidos) {
      if (campos[key] !== undefined) {
        sets.push(`${key} = ?`);
        vals.push(campos[key]);
      }
    }
    // Si viene nueva contraseña, hashearla con bcrypt
    if (campos.contrasena) {
      sets.push('contrasena = ?');
      vals.push(await hashPassword(campos.contrasena));
    }
    if (!sets.length) return 0;
    vals.push(id);
    const [result] = await pool.query(
      `UPDATE USUARIO SET ${sets.join(', ')} WHERE id_usuario = ?`, vals
    );
    return result.affectedRows;
  },

  /**
   * Elimina un usuario de USUARIO por ID (borrado físico).
   *
   * @param {number} id - ID del usuario a eliminar
   * @returns {Promise<number>} Número de filas eliminadas (0 si no existía).
   */
  delete: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM USUARIO WHERE id_usuario = ?', [id]
    );
    return result.affectedRows;
  },
};

module.exports = UsuarioModel;