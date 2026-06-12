// index.js
// ─── Punto de entrada del servidor MetaFit ────────────────────
require('dotenv').config();
require('./config/db');      // Inicia la conexión a MySQL al arrancar

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
  console.log('║  GET     /afiliados/:id/progreso                     ║');
  console.log('║  POST    /afiliados/progreso                         ║');
  console.log('║  GET     /planes/entrenamiento/:id_ciclo             ║');
  console.log('║  POST    /planes/entrenamiento                       ║');
  console.log('║  POST    /planes/rutinas                             ║');
  console.log('║  GET     /planes/nutricional/:id_ciclo               ║');
  console.log('║  POST    /planes/nutricional                         ║');
  console.log('║  GET     /660/ejercicios                             ║');
  console.log('║  GET     /660/alimentos                              ║');
  console.log('║  GET     /660/restricciones                          ║');
  console.log('║  GET     /dashboard/kpis        (Admin)              ║');
  console.log('║  GET     /health                                     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});