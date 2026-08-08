// backend/models/passwordResetModel.js
// ─── Consultas SQL de la tabla PASSWORD_RESET (recuperación de contraseña) ─
// Tokens JWT de un solo uso, 15 minutos de expiración.
'use strict';

const pool = require('../config/db');

const PasswordResetModel = {

  /**
   * Crea la tabla si no existe (idempotente).
   * Se ejecuta al arrancar el servidor para entornos nuevos (local, Docker, Render).
   */
  ensureTable: async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS PASSWORD_RESET (
        id          INT          NOT NULL AUTO_INCREMENT,
        usuario_id  INT          NOT NULL,
        token       VARCHAR(512) NOT NULL,
        expiracion  DATETIME     NOT NULL,
        usado       TINYINT(1)   NOT NULL DEFAULT 0,
        creado      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_reset_token (token),
        CONSTRAINT fk_reset_usuario FOREIGN KEY (usuario_id)
          REFERENCES USUARIO (id_usuario) ON DELETE CASCADE
      ) ENGINE = InnoDB
        COMMENT = 'Tokens JWT de un solo uso para recuperación de contraseña (15 min)';
    `);
  },

  /** Inserta un nuevo token de reseteo */
  create: async ({ usuario_id, token, expiracion }) => {
    const [result] = await pool.query(
      `INSERT INTO PASSWORD_RESET (usuario_id, token, expiracion)
       VALUES (?, ?, ?)`,
      [usuario_id, token, expiracion]
    );
    return result.insertId;
  },

  /** Invalida los tokens previos no usados del usuario (regeneración de token) */
  invalidarAnteriores: async (usuario_id) => {
    const [result] = await pool.query(
      `UPDATE PASSWORD_RESET SET usado = 1 WHERE usuario_id = ? AND usado = 0`,
      [usuario_id]
    );
    return result.affectedRows;
  },

  /** Busca un token vigente (no usado y no expirado) */
  findVigente: async (token) => {
    const [rows] = await pool.query(
      `SELECT id, usuario_id, token, expiracion, usado
       FROM PASSWORD_RESET
       WHERE token = ? AND usado = 0 AND expiracion > NOW()`,
      [token]
    );
    return rows[0] || null;
  },

  /** Marca un token como usado */
  marcarUsado: async (id) => {
    const [result] = await pool.query(
      `UPDATE PASSWORD_RESET SET usado = 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = PasswordResetModel;