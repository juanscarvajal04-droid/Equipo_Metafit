// backend/models/usuarioModel.js
// ─── Consultas SQL de la tabla USUARIO (bcrypt) ───────────────
'use strict';

const pool                   = require('../config/db');
const { hashPassword }       = require('../middlewares/auth');

const UsuarioModel = {

  // Busca por correo y devuelve el hash para comparar en el controller
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

  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres, apellidos, correo,
              rol, estado, fecha_registro
       FROM USUARIO
       ORDER BY rol, nombres`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres, apellidos, correo,
              rol, estado, fecha_registro
       FROM USUARIO WHERE id_usuario = ?`,
      [id]
    );
    return rows[0] || null;
  },

  create: async ({ nombres, apellidos, correo, contrasena, rol, estado }) => {
    const hash = await hashPassword(contrasena);   // bcrypt, 12 rondas
    const [result] = await pool.query(
      `INSERT INTO USUARIO (nombres, apellidos, correo, contrasena, rol, estado)
       VALUES (?,?,?,?,?,?)`,
      [nombres, apellidos, correo, hash, rol, estado || 'Pendiente']
    );
    return result.insertId;
  },

  update: async (id, campos) => {
    const permitidos = ['nombres','apellidos','correo','rol','estado'];
    const sets = [];
    const vals = [];

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

  delete: async (id) => {
    const [result] = await pool.query(
      'DELETE FROM USUARIO WHERE id_usuario = ?', [id]
    );
    return result.affectedRows;
  },
};

module.exports = UsuarioModel;