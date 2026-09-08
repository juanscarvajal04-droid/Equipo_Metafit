// backend/migrations/migracionNotaEjercicio.js
// Migración idempotente ejecutada al arrancar el servidor (ver index.js):
//   Crea la tabla NOTA_EJERCICIO (Parte 3) si no existe, con FKs a
//   USUARIO/EJERCICIO/CICLO ON DELETE CASCADE. Sirve para entornos runtime
//   (Render: MySQL solo socket local) sin depender de SQL manual.
// La DDL equivalente vive en database/01_estructura.sql para instalaciones frescas.
'use strict';

const pool = require('../config/db');

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS NOTA_EJERCICIO (
      id_nota      INT          NOT NULL AUTO_INCREMENT,
      id_usuario   INT          NOT NULL,
      id_ejercicio INT          NOT NULL,
      id_ciclo     INT          NOT NULL,
      nota         TEXT         NULL,
      fecha_nota   DATE         NOT NULL,

      PRIMARY KEY (id_nota),
      UNIQUE INDEX uq_nota_ejercicio_dia (id_usuario, id_ejercicio, id_ciclo, fecha_nota),
      INDEX idx_nota_usuario   (id_usuario),
      INDEX idx_nota_ejercicio (id_ejercicio),
      INDEX idx_nota_ciclo     (id_ciclo),

      CONSTRAINT fk_nota_usuario
        FOREIGN KEY (id_usuario) REFERENCES USUARIO (id_usuario)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_nota_ejercicio
        FOREIGN KEY (id_ejercicio) REFERENCES EJERCICIO (id_ejercicio)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_nota_ciclo
        FOREIGN KEY (id_ciclo) REFERENCES CICLO (id_ciclo)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE = InnoDB
      COMMENT = 'Nota del afiliado sobre un ejercicio de su plan (feedback para el entrenador).'
  `);
}

async function runMigraciones() {
  // Aquí podrían agregarse ALTERs futuros sobre NOTA_EJERCICIO
  await ensureTable();
  console.log('[migracion] Tabla NOTA_EJERCICIO verificada/creada');
}

module.exports = { runMigraciones, ensureTable };