// index.js
// ─── Punto de entrada del servidor MetaFit ────────────────────
require('dotenv').config();
const { ejecutarMigracion } = require('./utils/migrationRunner');

// Migraciones idempotentes: no bloquean el arranque del servidor.
ejecutarMigracion(
  'Tabla PASSWORD_RESET verificada/creada',
  'PASSWORD_RESET',
  () => require('./models/passwordResetModel').ensureTable()
);
ejecutarMigracion(
  'Migración de fotos verificada',
  'MIGRACION-FOTOS',
  () => require('./migrations/migracionFotos').runMigraciones()
);
ejecutarMigracion(
  'Migración de push_token verificada',
  'MIGRACION-PUSH',
  () => require('./migrations/migracionPushToken').runMigraciones()
);
ejecutarMigracion(
  'Migración de foto de staff verificada',
  'MIGRACION-FOTO-USUARIO',
  () => require('./migrations/migracionFotoUsuario').runMigraciones()
);
ejecutarMigracion(
  'Migración de detalles de rutina verificada',
  'MIGRACION-RUTINA-DETALLES',
  () => require('./migrations/migracionRutinaDetalles').runMigraciones()
);
ejecutarMigracion(
  'Migración de nutrientes de consumo verificada',
  'MIGRACION-NUTRIENTES-CONSUMO',
  () => require('./migrations/migracionNutrientesConsumo').runMigraciones()
);
ejecutarMigracion(
  'Migración de NOTA_EJERCICIO verificada',
  'MIGRACION-NOTA-EJERCICIO',
  () => require('./migrations/migracionNotaEjercicio').runMigraciones()
);
ejecutarMigracion(
  'Migración de recomendación de agua verificada',
  'MIGRACION-RECOMENDACION-AGUA',
  () => require('./migrations/migracionRecomendacionAgua').runMigraciones()
);

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