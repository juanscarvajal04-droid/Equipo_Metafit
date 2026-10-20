#!/usr/bin/env node
// Normaliza las rutas SF de un reporte LCOV para que SonarQube las resuelva
// desde la raíz del proyecto, incluso cuando el scanner corre en Linux/Docker.
'use strict';

const fs = require('fs');
const path = require('path');

const [, , reportPath, prefix] = process.argv;

if (!reportPath || !prefix) {
  console.error('Uso: node scripts/normalize-lcov.js <lcov.info> <prefijo>');
  process.exit(1);
}

const absoluteReport = path.resolve(reportPath);
if (!fs.existsSync(absoluteReport)) {
  console.error(`No existe el reporte LCOV: ${absoluteReport}`);
  process.exit(1);
}

const normalizedPrefix = prefix.replace(/\\/g, '/').replace(/\/+$/, '');
const content = fs.readFileSync(absoluteReport, 'utf8');

const output = content
  .split(/\r?\n/)
  .map((line) => {
    if (!line.startsWith('SF:')) return line;

    const original = line.slice(3).trim();
    const normalized = original.replace(/\\/g, '/').replace(/^\.?\//, '');
    const withPrefix = normalized.startsWith(`${normalizedPrefix}/`)
      ? normalized
      : `${normalizedPrefix}/${normalized}`;

    return `SF:${withPrefix}`;
  })
  .join('\n');

fs.writeFileSync(absoluteReport, output);
console.log(`[lcov] Rutas normalizadas en ${reportPath} (${normalizedPrefix}/...)`);
