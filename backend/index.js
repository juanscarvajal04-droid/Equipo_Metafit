// index.js
// ─── Punto de entrada del servidor MetaFit ────────────────────
require('dotenv').config();
const pool = require('./config/db');  // Inicia la conexión a MySQL al arrancar

// ── Espera activa: la BD puede estar aún inicializándose al levantar ──
// En Docker (`docker compose up`) MariaDB arranca en paralelo: si las
// migraciones corren sin esperar fallan con ECONNREFUSED y las columnas
// nuevas (p. ej. AFILIADO.foto) no se crean en un volumen recién recreado
// (`docker compose down -v`). Este helper reintenta hasta que `SELECT 1`
// responda, sin bloquear el arranque del servidor (es asíncrono).
async function esperarBaseDeDatos(intentos = 30, cadaMs = 2000) {
  for (let i = 1; i <= intentos; i += 1) {
    try {
      await pool.query('SELECT 1');
      console.log('[migraciones] Base de datos disponible');
      return;
    } catch (err) {
      if (i === intentos) throw err;
      console.log(`[migraciones] BD aún no lista (${i}/${intentos}), reintento en ${cadaMs}ms…`);
      await new Promise((r) => setTimeout(r, cadaMs));
    }
  }
}

// ── Migración automática idempotente: tabla PASSWORD_RESET ────
// Crea la tabla si no existe en cualquier entorno (local, Docker, Render)
// sin depender de ejecutar scripts SQL manualmente.
esperarBaseDeDatos()
  .then(() => require('./models/passwordResetModel').ensureTable())
  .then(() => console.log('✅ Tabla PASSWORD_RESET verificada/creada'))
  .catch(err => console.error('[PASSWORD_RESET] error creando tabla:', err.message));

// ── Migración idempotente: columna AFILIADO.foto + limpieza de datos temporales ─
// Corre dentro del VM de Render (MySQL solo socket local, sin acceso externo).
esperarBaseDeDatos()
  .then(() => require('./migrations/migracionFotos').runMigraciones())
  .then(() => console.log('✅ Migración de fotos verificada'))
  .catch(err => console.error('[MIGRACION-FOTOS] error:', err.message));

// ── Migración idempotente: columna USUARIO.push_token (push notifications) ──
esperarBaseDeDatos()
  .then(() => require('./migrations/migracionPushToken').runMigraciones())
  .then(() => console.log('✅ Migración de push_token verificada'))
  .catch(err => console.error('[MIGRACION-PUSH] error:', err.message));

// ── Migración idempotente: RUTINA_EJERCICIO.peso_kg + RUTINA_EJERCICIO.descanso_seg (HU43 CA2) ──
esperarBaseDeDatos()
  .then(() => require('./migrations/migracionRutinaDetalles').runMigraciones())
  .then(() => console.log('✅ Migración de detalles de rutina verificada'))
  .catch(err => console.error('[MIGRACION-RUTINA-DETALLES] error:', err.message));

// ── Migración idempotente: macronutrientes en CONSUMO_ALIMENTO_REAL (FASE A.2) ──
esperarBaseDeDatos()
  .then(() => require('./migrations/migracionNutrientesConsumo').runMigraciones())
  .then(() => console.log('✅ Migración de nutrientes de consumo verificada'))
  .catch(err => console.error('[MIGRACION-NUTRIENTES-CONSUMO] error:', err.message));

// ── Migración idempotente: tabla NOTA_EJERCICIO (Parte 3) ──
esperarBaseDeDatos()
  .then(() => require('./migrations/migracionNotaEjercicio').runMigraciones())
  .then(() => console.log('✅ Migración de NOTA_EJERCICIO verificada'))
  .catch(err => console.error('[MIGRACION-NOTA-EJERCICIO] error:', err.message));

// ── Cron: recordatorio de pagos por vencer (cada hora) ──
const { iniciarCron } = require('./cron/recordatorioPagos');
iniciarCron();

const app  = require('./server');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║          MetaFit API — Backend MySQL                 ║');
  console.log(`║          http://localhost:${PORT}                        ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  POST    /login                                      ║');
  console.log('║  GET     /usuarios                                   ║');
  console.log('║  POST    /usuarios              (Admin)              ║');
  console.log('║  PATCH   /usuarios/:id          (Admin)              ║');
  console.log('║  DELETE  /usuarios/:id          (Admin)              ║');
  console.log('║  GET     /afiliados                                  ║');
  console.log('║  POST    /afiliados                                  ║');
  console.log('║  PATCH   /afiliados/:id                              ║');
  console.log('║  DELETE  /afiliados/:id         (Admin)              ║');
  console.log('║  GET     /afiliados/:id/ciclos                       ║');
  console.log('║  POST    /afiliados/ciclos                           ║');
  console.log('║  GET     /afiliados/:id/restricciones                ║');
  console.log('║  GET     /afiliados/:id/ejercicios-disponibles       ║');
  console.log('║  GET     /afiliados/:id/alimentos-disponibles        ║');
  console.log('║  GET     /afiliados/:id/progreso                     ║');
  console.log('║  POST    /afiliados/progreso                         ║');
  console.log('║  GET     /planes/entrenamiento/:id_ciclo             ║');
  console.log('║  POST    /planes/entrenamiento                       ║');
  console.log('║  POST    /planes/rutinas                             ║');
  console.log('║  GET     /planes/nutricional/:id_ciclo               ║');
  console.log('║  POST    /planes/nutricional                         ║');
  console.log('║  GET     /catalogo/ejercicios                        ║');
  console.log('║  GET     /catalogo/alimentos                         ║');
  console.log('║  GET     /catalogo/restricciones                     ║');
  console.log('║  GET|PUT /configuracion/precio-membresia (Admin)    ║');
  console.log('║  GET     /notificaciones                             ║');
    console.log('║  GET     /dashboard/kpis        (Admin)              ║');
  console.log('║  GET     /pagos                 (Admin)              ║');
  console.log('║  GET     /pagos/metricas        (Admin)              ║');
  console.log('║  GET     /health                                     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});