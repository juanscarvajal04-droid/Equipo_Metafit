// backend/scripts/migrate_passwords_to_bcrypt.js
// ─────────────────────────────────────────────────────────────
// Script ONE-TIME: detecta contraseñas en SHA-256 (64 chars hex)
// y las re-hashea con bcrypt.
//
// Ejecutar UNA SOLA VEZ después de desplegar el nuevo código:
//   node backend/scripts/migrate_passwords_to_bcrypt.js
//
// ⚠️  Requiere: DB ya corriendo y variables de entorno cargadas.
//     En Docker: docker exec -it metafit_backend node scripts/migrate_passwords_to_bcrypt.js
// ─────────────────────────────────────────────────────────────
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool    = require('../config/db');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');

const SHA256_REGEX = /^[a-f0-9]{64}$/i;
const SALT_ROUNDS  = 12;

// Mapa de contraseñas originales conocidas (SHA-256 → texto plano)
// Solo necesario si tienes contraseñas de seed/datos de prueba.
// En producción real esta migración requiere reset de contraseñas.
// Añade aquí las de tus datos de prueba:
const KNOWN_PLAIN = {
  // 'sha256_hash': 'plain_text',
  // Ejemplo: hash de 'Admin123!' en sha256:
  // '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918': 'Admin123!',
};

async function migrate() {
  const [users] = await pool.query('SELECT id_usuario, correo, contrasena FROM USUARIO');

  let migrated = 0;
  let skipped  = 0;

  for (const user of users) {
    const pwd = user.contrasena;

    // Si ya es bcrypt ($2a$ o $2b$) → saltar
    if (pwd && (pwd.startsWith('$2a$') || pwd.startsWith('$2b$'))) {
      console.log(`✅ [SKIP]  id=${user.id_usuario} ${user.correo} — ya es bcrypt`);
      skipped++;
      continue;
    }

    // Si es SHA-256 y conocemos el texto plano → migrar
    if (SHA256_REGEX.test(pwd) && KNOWN_PLAIN[pwd]) {
      const hash = await bcrypt.hash(KNOWN_PLAIN[pwd], SALT_ROUNDS);
      await pool.query('UPDATE USUARIO SET contrasena = ? WHERE id_usuario = ?', [hash, user.id_usuario]);
      console.log(`🔄 [MIGRATED] id=${user.id_usuario} ${user.correo}`);
      migrated++;
      continue;
    }

    // SHA-256 sin texto plano conocido → no podemos migrar sin reset
    console.log(`⚠️  [MANUAL] id=${user.id_usuario} ${user.correo} — SHA-256 sin plain conocido. Requiere reset de contraseña.`);
    skipped++;
  }

  console.log(`\n─── Migración completada ───`);
  console.log(`  Migradas : ${migrated}`);
  console.log(`  Saltadas : ${skipped}`);
  await pool.end();
}

migrate().catch(err => {
  console.error('Error en migración:', err.message);
  process.exit(1);
});
