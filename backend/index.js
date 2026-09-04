// index.js
// ─── Punto de entrada del servidor MetaFit ────────────────────
require('dotenv').config();
require('./config/db');      // Inicia la conexión a MySQL al arrancar

// ── Migración automática idempotente: tabla PASSWORD_RESET ────
// Crea la tabla si no existe en cualquier entorno (local, Docker, Render)
// sin depender de ejecutar scripts SQL manualmente.
require('./models/passwordResetModel').ensureTable()
  .then(() => console.log('✅ Tabla PASSWORD_RESET verificada/creada'))
  .catch(err => console.error('[PASSWORD_RESET] error creando tabla:', err.message));

// ── Migración idempotente: columna AFILIADO.foto + limpieza de datos temporales ─
// Corre dentro del VM de Render (MySQL solo socket local, sin acceso externo).
const { runMigraciones } = require('./migrations/migracionFotos');
runMigraciones()
  .then(() => console.log('✅ Migración de fotos verificada'))
  .catch(err => console.error('[MIGRACION-FOTOS] error:', err.message));

// ── Migración idempotente: columna USUARIO.push_token (push notifications) ──
const { runMigraciones: runMigracionesPush } = require('./migrations/migracionPushToken');
runMigracionesPush()
  .then(() => console.log('✅ Migración de push_token verificada'))
  .catch(err => console.error('[MIGRACION-PUSH] error:', err.message));

// ── Migración idempotente: RUTINA_EJERCICIO.peso_kg + RUTINA_EJERCICIO.descanso_seg (HU43 CA2) ──
const { runMigraciones: runMigracionesRutinaDetalles } = require('./migrations/migracionRutinaDetalles');
runMigracionesRutinaDetalles()
  .then(() => console.log('✅ Migración de detalles de rutina verificada'))
  .catch(err => console.error('[MIGRACION-RUTINA-DETALLES] error:', err.message));

// ── Migración idempotente: macronutrientes en CONSUMO_ALIMENTO_REAL (FASE A.2) ──
const { runMigraciones: runMigracionesNutrientes } = require('./migrations/migracionNutrientesConsumo');
runMigracionesNutrientes()
  .then(() => console.log('✅ Migración de nutrientes de consumo verificada'))
  .catch(err => console.error('[MIGRACION-NUTRIENTES-CONSUMO] error:', err.message));

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