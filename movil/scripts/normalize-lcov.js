'use strict';

// Normaliza las rutas del LCOV móvil para que SonarQube las resuelva
// desde la raíz del repositorio (movil/src/... en lugar de src\...).
const fs = require('fs');
const path = require('path');

const lcovPath = path.join(__dirname, '..', 'coverage', 'lcov.info');

if (!fs.existsSync(lcovPath)) {
  console.warn('[lcov] No existe movil/coverage/lcov.info; ejecuta primero las pruebas con cobertura.');
  process.exit(0);
}

const contenido = fs
  .readFileSync(lcovPath, 'utf8')
  .replace(/^SF:src[\\/]/gm, 'SF:movil/src/')
  .replace(/\\/g, '/');

fs.writeFileSync(lcovPath, contenido);
console.log('[lcov] Rutas móviles normalizadas en coverage/lcov.info (movil/src/...)');
