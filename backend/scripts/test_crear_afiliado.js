// scripts/test_crear_afiliado.js
// ─── Prueba autónoma: crear afiliado "Usuario Prueba AI" ───────
// Uso: node scripts/test_crear_afiliado.js
// Requiere: backend corriendo en http://localhost:3001
'use strict';

const http = require('http');

// ── Helpers HTTP ───────────────────────────────────────────────
function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  MetaFit — Test Autónomo: Crear Afiliado');
  console.log('═══════════════════════════════════════════════════\n');

  // 1) Health check
  console.log('[1/3] Health check...');
  let health;
  try {
    health = await request('GET', '/health');
    console.log(`  ✅ Backend: ${health.body?.db || 'OK'} (HTTP ${health.status})`);
  } catch (e) {
    console.error('  ❌ Backend no responde:', e.message);
    process.exit(1);
  }

  // 2) Login para obtener token de admin
  // Credenciales del seed: carlos@metafit.com / Admin123!
  // (Administrador activo, id_usuario=1)
  console.log('\n[2/3] Autenticando como admin (carlos@metafit.com)...');
  const credenciales = [
    { email: 'carlos@metafit.com',  password: 'Admin123!'  },
    { email: 'maria@metafit.com',   password: 'Maria123!'  },
    { email: 'andres@metafit.com',  password: 'Andres123!' },
  ];

  let token = null;
  for (const cred of credenciales) {
    const loginRes = await request('POST', '/login', cred);
    // El controller devuelve { accessToken, user } — no `token`
    if (loginRes.status === 200 && loginRes.body?.accessToken) {
      token = loginRes.body.accessToken;
      console.log(`  ✅ Login OK como ${cred.email} (rol: ${loginRes.body.user?.role})`);
      break;
    }
    console.log(`  ⚠️  ${cred.email} → HTTP ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
  }

  if (!token) {
    console.error('\n  ❌ No se pudo autenticar. Verifica el seed y el JWT_SECRET.');
    process.exit(1);
  }

  // 3) POST /afiliados — crear "Usuario Prueba AI"
  // Usamos un documento único basado en timestamp para evitar duplicados
  const docUnico = String(Date.now()).slice(-8);  // últimos 8 dígitos del timestamp
  const correoUnico = `prueba.ai.${docUnico}@metafit-test.co`;

  const payload = {
    nombres:                     'Usuario Prueba',
    apellidos:                   'AI Test',
    correo:                      correoUnico,
    documento:                   docUnico,
    fecha_nacimiento:            '1990-06-15',         // YYYY-MM-DD estricto
    sexo:                        'Masculino',
    telefono:                    '3001234567',
    direccion:                   'Calle 80 # 50-30, Bogotá',
    estatura_cm:                 175.5,
    estado_afiliacion:           'Activo',
    objetivo_fisico:             'Aumento de masa',
    nivel_experiencia:           'Principiante',
    grupo_muscular_prioritario:  'Pecho',
    disponibilidad_semanal_dias: 3,
  };

  console.log('\n[3/3] POST /afiliados con payload:');
  console.log(JSON.stringify(payload, null, 2));

  const res = await request('POST', '/afiliados', payload, token);

  console.log(`\n── Respuesta HTTP ${res.status} ──────────────────────────`);
  console.log(JSON.stringify(res.body, null, 2));

  if (res.status === 201) {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ✅  PRUEBA EXITOSA — Código 201 OK               ║');
    console.log(`║  id_usuario generado: ${res.body.id}               `);
    console.log(`║  Contraseña temporal: MF_${docUnico}@2025         `);
    console.log('╚══════════════════════════════════════════════════╝');

    // Verificar que el afiliado aparece en el listado
    console.log('\n[Verificación] GET /afiliados?limit=5...');
    const listRes = await request('GET', `/afiliados/${res.body.id}`, null, token);
    if (listRes.status === 200) {
      const af = listRes.body;
      console.log(`  ✅ Afiliado encontrado en BD:`);
      console.log(`     - id_usuario: ${af.id_usuario}`);
      console.log(`     - nombres:    ${af.nombres} ${af.apellidos}`);
      console.log(`     - documento:  ${af.documento}`);
      console.log(`     - correo:     ${af.correo}`);
      console.log(`     - estado:     ${af.estado_afiliacion || af.estado_cuenta}`);
    } else {
      console.log(`  ⚠️  GET /afiliados/${res.body.id} → HTTP ${listRes.status}`);
      console.log(JSON.stringify(listRes.body, null, 2));
    }
  } else {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║  ❌  PRUEBA FALLIDA — Ver error arriba            ║');
    console.log('╚══════════════════════════════════════════════════╝');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n[FATAL]', err.message || err);
  process.exit(1);
});
