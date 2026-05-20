// models/usuarioModel.js
// ─── Consultas SQL de la tabla USUARIO ───────────────────────
const pool = require('../config/db');
const crypto = require('crypto');

const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

const UsuarioModel = {

  findByCredentials: async (email, password) => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres_usuario, apellidos_usuario,
              correo_usuario, rol_usuario, estado_cuenta_usuario
       FROM USUARIO
       WHERE correo_usuario = ? AND contrasena_usuario = ?`,
      [email, sha256(password)]
    );
    return rows[0] || null;
  },

  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres_usuario, apellidos_usuario,
              correo_usuario, rol_usuario, estado_cuenta_usuario, fecha_registro
       FROM USUARIO
       ORDER BY rol_usuario, nombres_usuario`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT id_usuario, nombres_usuario, apellidos_usuario,
              correo_usuario, rol_usuario, estado_cuenta_usuario, fecha_registro
       FROM USUARIO WHERE id_usuario = ?`,
      [id]
    );
    return rows[0] || null;
  },

  create: async ({ nombres_usuario, apellidos_usuario, correo_usuario, contrasena_usuario, rol_usuario, estado_cuenta_usuario }) => {
    const [result] = await pool.query(
      `INSERT INTO USUARIO
         (nombres_usuario, apellidos_usuario, correo_usuario,
          contrasena_usuario, rol_usuario, estado_cuenta_usuario)
       VALUES (?,?,?,?,?,?)`,
      [nombres_usuario, apellidos_usuario, correo_usuario,
       sha256(contrasena_usuario), rol_usuario, estado_cuenta_usuario || 'Activo']
    );
    return result.insertId;
  },

  update: async (id, campos) => {
    const permitidos = ['nombres_usuario','apellidos_usuario','correo_usuario',
                        'rol_usuario','estado_cuenta_usuario'];
    const sets = [];
    const vals = [];

    for (const key of permitidos) {
      if (campos[key] !== undefined) {
        sets.push(`${key} = ?`);
        vals.push(campos[key]);
      }
    }
    if (campos.contrasena_usuario) {
      sets.push('contrasena_usuario = ?');
      vals.push(sha256(campos.contrasena_usuario));
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