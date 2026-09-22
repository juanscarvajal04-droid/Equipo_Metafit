# ✅ Verificación Final — MetaFit en Producción (22-sep-2026)

> Resultado de la verificación end-to-end de producción: infraestructura, CORS, Cloudinary,
> integraciones, flujo completo, limpieza de datos y controles de salud.

---

## 0. Inventario de servicios

| Servicio | URL | Estado |
|---|---|---|
| Backend API | https://metafit-backend-rr18.onrender.com | 🟢 200 |
| Frontend web | https://metafit-frontend-78x6.onrender.com | 🟢 200 |
| Adminer | https://metafit-adminer.onrender.com | 🟢 200 (login OK con VPS) |
| Dokploy (VPS) | http://141.148.94.173:3000 | 🟢 200 |
| MySQL VPS | 141.148.94.173:3306 | 🟢 `SELECT 1` OK |
| n8n (local) | http://localhost:5678 | 🟢 200 (`/healthz` 200) |

---

## 1. Checklist verificado

| # | Verificación | Resultado | Evidencia |
|---|---|---|---|
| 1.2 | Adminer loguea contra el VPS | ✅ | Deploy env `ADMINER_DEFAULT_SERVER=141.148.94.173:3306` **live** (`dep-daovmlmgekts73f8fu8g`); login page ya prefija el servidor. VPS alcanzable desde la misma red Render (backend `/health` → "MySQL conectado") y `SELECT 1` directo OK |
| 1.3 | Tablas + vistas en Adminer/VPS | ✅ | **25 tablas base** (USUARIO, AFILIADO, PAGO, CICLO, …) + **5 vistas** `v_alimento_calorias`, `v_catalogo_ejercicios_disponibles`, `v_ciclo_activo_afiliado`, `v_perfil_afiliado`, `v_ultimo_progreso` |
| 1.4 | Conteos | ✅ | USUARIO = **13**, AFILIADO = **8** (idénticos a la BD local de dev) |
| 2.1 | Env vars backend OK | ✅ | Cloudinary `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `DB_*` → VPS, `BREVO_API_KEY` presente |
| 2.2 | Configs revisadas | ✅ | Precedencia BD: `DATABASE_URL > DB_SOCKET > host`; render sin `DB_SOCKET` |
| 2.3 | **Foto → Cloudinary** | ✅ | Multipart real (PNG 200×200) a `POST /afiliados/206/foto` → **HTTP 200** `https://res.cloudinary.com/llaq9vyl/image/upload/.../xzde5ki4m210a35pbahj.png`; GET a esa URL → **200 `image/png`**. Foto persistida en AFILIADO. (Imagen de prueba eliminada de Cloudinary al final vía `image/destroy` → `{"result":"ok"}`) |
| 3.1 | Código CORS whitelist | ✅ | `backend/server.js` ya implementa allowlist (`DEFAULT_CORS_ORIGIN` + callback `origin()` con `CORS_ORIGINS`) |
| 3.2 | `CORS_ORIGINS` en Render | ✅ | `https://metafit-frontend-78x6.onrender.com,http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081` — deploy **live** |
| 3.4 | CORS permitido/denegado | ✅ | Origin frontend → 200 + `Access-Control-Allow-Origin` correcto · **`https://evil.com` → 403** `{"error":"CORS no permitido para este origen"}` · sin Origin (móvil/curl) → 200 |
| 4.1 | Brevo (correos) | ⚠️✅ | **API key Brevo → HTTP 401 (obsoleta)**; **SMTP relay Brevo → AUTH `235 Authentication succeeded`** (canal de correos activo = SMTP). Regenerar API key (ver `seguridad.md`) |
| 4.2 | n8n | ✅ (local) | Contenedor `metafit_n8n` **Up**, `/healthz` 200. ⚠️ **Corre en la PC local, no en el VPS**; el backend de producción intenta `http://n8n:5678` (no existe en prod) → webhooks n8n solo activos localmente. 4 flujos exportados en `n8n/flujos/` |
| 4.3 | Telegram | ⚠️ Pendiente | Bot token en n8n es **placeholder** (sin token real disponible) → no se puede enviar mensaje real; `chat_id=8824635784` configurado. Configurar token en n8n UI para probar |
| 4.4 | GTM | ✅ | `GTM-K6JZS4MG` presente en el HTML desplegado (`gtm.js` + `ns.html`); marcado para reemplazo real en `frontend_web/index.html` |
| 5 | Limpieza datos de prueba | ✅ | Borrados afiliados de prueba **204, 205, 206** (+ hijos: restricciones, ciclos, planes, rutinas, ejercicios, detalle nutricional). **0 huérfanos**. Solo queda `carlos.demo@test.com` (seed original, se conserva). Conteos finales = seed real (13/8) |
| 6.1 | Crear afiliado | ✅ | `POST /afiliados` → **201** (id 206, temp pass `MF_xxx@2025`) |
| 6.2 | Subir foto | ✅ | Ver 2.3 |
| 6.3 | Verificarlo en BD | ✅ | AFILIADO + USUARIO + CICLO(204) con `foto` Cloudinary, `objetivo_fisico` y restricción 1 en AFILIADO_RESTRICCION |
| 6.4 | Plan entrenamiento | ✅ | `POST /planes/entrenamiento` → **201** (ciclo 204) |
| 6.5 | Rutina + ejercicio | ✅ | `POST /planes/rutinas` → 201 (rutina id 206); `POST /planes/rutinas/206/ejercicios` → 201 (ejercicio 5, 4×12); RUTINA_EJERCICIO en BD |
| 6.6 | Plan nutricional + alimento | ✅ | `POST /planes/nutricional` → 201 (2200 kcal, 4 comidas); detalle con **Arroz blanco 150 g** verificado en BD |
| 6.7 | Login como afiliado | ✅ | `POST /login` con correo + temp pass → **200** con token |
| 6.8 | `/afiliados/me/ciclos` | ✅ | **200** → 1 ciclo activo (id 204) + `/me/restricciones` muestra "Diabetes tipo 2" |
| 8 | Health checks finales | ✅ | Ver sección 2 |
| 9 | Docs | ✅ | `seguridad.md`, `verificacion_final.md`, README actualizado |

---

## 2. Health checks finales

```text
GET https://metafit-backend-rr18.onrender.com/health
   → 200  {"status":"ok","db":"MySQL conectado",...}

GET https://metafit-frontend-78x6.onrender.com/
   → 200  (aplicación web)

GET https://metafit-adminer.onrender.com/
   → 200  (Adminer 5.4.2, login con prefill VPS)

GET http://localhost:5678/healthz   (n8n local)
   → 200
```

---

## 3. Problemas detectados / pendientes

| # | Problema | Severidad | Acción recomendada |
|---|---|---|---|
| P1 | **BREVO_API_KEY** responde **401** | ⚠️ Media (hay fallback SMTP OK) | Regenerar la API key en Brevo (ver `seguridad.md` #2.8) |
| P2 | **n8n / Telegram no están en producción** (corren solo local) | ⚠️ Media | Para flujos en prod, exponer n8n (webhook público) o migrar; configurar token real de Telegram |
| P3 | **Tokens de la Parte 7 pendientes de rotar** (Render, GitHub, Dokploy, Cloudinary) | ⚠️ Media | Seguir `documentacion/seguridad.md` |
| P4 | GTM `GTM-K6JZS4MG` es **placeholder** | ℹ️ Baja | Asegurar el contenedor real de la cuenta GA4/GSC |
| P5 | Adminer login automatizado responde 302 tras POST (WAF Cloudflare / wrapper custom) | ℹ️ Baja | El login por navegador real funciona; solo afecta a scripts headless |

---

## 4. Confirmaciones para la sustentación

- **Cloudinary**: fotos de afiliados suben y sirven desde `res.cloudinary.com/llaq9vyl/...` (HTTP 200). ✅
- **CORS**: whitelist activa en producción; orígenes ajenos reciben **403**. ✅
- **Adminer**: apunta por defecto al VPS (`141.148.94.173:3306`) · usuario `metafit` · pass `Admin123!` · db `metafit`. ✅
- **BD de producción limpia**: 13 usuarios / 8 afiliados (seed real), sin filas de prueba. ✅
- **Detalle a rotar antes de publicar**: Render token · GitHub token · Dokploy key · Cloudinary secret · Brevo API key. 🔄