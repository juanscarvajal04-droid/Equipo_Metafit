# Auditoría de Calidad — ISO/IEC 25010

**Proyecto:** MetaFit — Sistema de Gestión Deportiva
**Fecha:** 2026-08-08
**Alcance:** `backend/` (Node.js + Express + MySQL), `frontend_web/` (React 19 + Vite), `movil/` (Expo SDK 55 / React Native), `database/` (MySQL 8), Docker Compose y despliegues (Render, Docker).

---

## 1. Tabla resumen

| Característica (ISO 25010) | Veredicto | % Estimado | Aspecto más fuerte | Aspecto más débil |
|---|---|---|---|---|
| 3.1 Adecuación funcional | ✅ ALTO | 85% | 60+ endpoints con RBAC por rol | Creación/edición de afiliados sin restricción de rol en backend |
| 3.2 Eficiencia de desempeño | ✅ ALTO | 80% | Pool MySQL + queries parametrizadas sin N+1 | Sin code-splitting en la web; sin caché |
| 3.3 Compatibilidad | ⚠️ MEDIO | 70% | Web (React/Vite), móvil (Android) y Docker/Render | CORS abierto temporal `origin: '*'` |
| 3.4 Usabilidad | ✅ ALTO | 85% | Tema oscuro consistente, iconos, feedback claro | Mensajes de error con referencias a puertos locales obsoletos (corregido) |
| 3.5 Fiabilidad | ⚠️ MEDIO | 75% | Handler global de errores, health check real | Transacciones solo en new password reset; sin reintentos automáticos |
| 3.6 Seguridad | ✅ ALTO | 85% | bcrypt 12 rondas, JWT, helmet, rate limit, parámetros SQL | CORS abierto temporal; token de reseteo es JWT válido |
| 3.7 Mantenibilidad | ✅ ALTO | 80% | MVC + Services + modelos, documentación extensa | Código duplicado (ROLES en Login.jsx vs authService), CSS histérico |
| 3.8 Portabilidad | ✅ ALTO | 85% | Docker Compose, render.yaml, DATABASE_URL y DB_* | Dockerfile raíz con MariaDB embebido (empuja migración a Dockerizada) |

**Nivel general: ⚠️ MEDIO-ALTO (promedio ~80 %)**

---

## 2. Adecuación funcional — ✅ ALTO

### Evidencia
- **60+ endpoints** catalogados en `backend/routes/` cubriendo: autenticación (login, recuperación), usuarios (CRUD admin), afiliados (CRUD + ciclos + progreso + restricciones + ejercicios/alimentos disponibles), planes (entrenamiento, nutricional, rutinas), catálogos (ejercicios, alimentos, restricciones), pagos + métricas admin, dashboard KPI, configuración (precio membresía), notificaciones, `GET /health` y Swagger UI (`/api-docs`).
- **RBAC por middleware:** `requireAuth`, `requireAdmin`, `requireAdminOrEntrenador`, `requireAdminOrRecepcionista`, `requireStaff`, `requireOwnCiclo` (`backend/middlewares/auth.js`), aplicados en cada ruta (ver `usuarioRoutes.js`, `planRoutes.js`, `catalogoRoutes.js`, `afiliadoRoutes.js`).
- **Frontend web:** rutas protegidas por rol vía `ProtectedRoute` + `allowedRoles` (`frontend_web/src/App.jsx`).
- **App móvil:** flujo completo afiliado (perfil, rutina, dieta, progreso, agua, consumo de alimentos) contra `/afiliados/me/*`.
- **Especificado en Swagger/Postman:** se incluyen `postman/MetaFit_API_Web.postman_collection.json` y `MetaFit_API_Movil.postman_collection.json`.

### Brechas
- `POST /afiliados` y `PATCH /afiliados/:id` solo exigen `requireAuth` → un usuario con rol **Afiliado** podría crear/modificar afiliados (el web limita la UI por rol, pero el backend no lo hace). **C SE**guridad del módulo de pagos/finanzas está bien, pero el agujero de autorización de afiliados es un riesgo real (ver 3.6).
- Falta endpoint `DELETE /afiliados/:id` que sí exige Admin; inconsistencia interna.

### Sugerencias
- Añadir `requireAdminOrRecepcionista` a `POST /afiliados` y `PATCH /afiliados/:id` (permitir Admin/Recepcionista; Entrenador queda solo lectura como en la UI).
- Crear endpoints para generar el reporte navideño (hoy solo vivo en el móvil).
- Marcar el login por token/rol: el `rol` en la respuesta debería seguir respetando la lógica del backend (estado Activo) — verificado en `authController.js`.

---

## 3. Eficiencia de desempeño — ✅ ALTO

### Evidencia
- **Queries optimizadas en `afiliadoModel.js`:** en `findAll` se evitan queries N+1 con `INNER JOIN`/`LEFT JOIN` agregando el ciclo y plan en una sola consulta, luego una segunda query para progreso y restricciones (evidencia FIX comentado en el modelo).
- **Pool de conexiones:** `config/db.js` usa `mysql2/promise` con `connectionLimit: 10`, keep-alive y validación al arranque.
- **Body limit 50kb** en Express → protege contra payloads grandes (DoS parcial).
- **Rate limiting en `/login` y `/auth/recuperar-password`**: bcrypt es costoso (12 rondas), el límite evita fuerza bruta/saturación del event loop.
- **Frontend:** bundé de Vite (JS/CSS minificado, hash en producción).
- **Health check:** responde con `SELECT 1` + timestamp, ~20 MB (GetDB).

### Brechas / evidencia de coste
- No hay `React.lazy`/`Suspense` para dividir el bundle web (todo en `App.jsx`).
- No hay caché HTTP (HTTP/2) en el backend más allá del health rápido.
- En el móvil, el login valida contraseña a 12 rounds (bcrypt) — innecesario en el client por fine.

### Sugerencias
- Code-splitting por ruta en `App.jsx` (`React.lazy` + `Suspense`).
- `Cache-Control` en respuestas `GET` de catálogos (inmutables).
- Prueba de carga simple con `artillery` para `/login` bajo el rate limit.

---

## 3. Compatibilidad — ⚠️ MEDIO

### Evidencia
- **Web:** React 19 + Vite 6 + Bootstrap 5 → navegadores modernos (Chrome/Edge/Firefox/Safari).
- **Móvil:** Expo SDK 55 / RN 0.83 → Android 7+ y iOS 16+ en development build y APK (`eas.json` → `preview` ⭐ buildType apk).
- **API/HTTP:** `cors()` instalado; durante pres toda la API es accesible desde cualquier origin (ver 3.6). Swagger UI con `tryItOutEnabled`.
- **Despliegue multi-ambiente probado:** Docker (compose), Railway (DATABASE_URL), Render (frontend estático + web service con fallback).

### Brechas
- CORS `origin: '*'` (temporal de despliegue — responde a acceso desde cualquier origen).
- No hay una suite de test de navegadores/emuladores (Selenium/E2E).
- La app web guarda `localStorage` para sesión, lo que es compatible con la mayoría de navegadores pero bloquea el multi-tab (opcional).

---

## 3. Usabilidad — ✅ ALTO

### Evidencia
- **Consistencia de tema oscuro:** paleta centralizada `movil/src/theme.js` (bg `#0a0a0f`, cards, rojo `#e31c25`) y constantes inline en los web (Login) + `Login.module.css`.
- **Navegación coherente:** mismas pantallas y mismos flujos en web y móvil (Landing → Login → Tabs), iconos de mano y feedback de carga (spinners).
- **Mensajes claros:** errores localizados en español, códigos de estado mappeados (401 → "Correo o contraseña incorrectos", 403 → cuenta no activa).
- **Accesibilidad básica:** etiquetas `label` en web, `aria-label` en botones del ojito (añadido hoy), placeholder con formato.

### Brechas
- Mensajes de error del móvil aún citaban `192.168.0.4:3001` → **corregido en esta entrega** (ahora mensaje genérico).
- En web, el error de conexión menciona «puerto 3001» — sugiere generalizar.

---

## 4. Fiabilidad — ⚠️ MEDIO

### Evidencia
- **Handler global de errores** (`server.js`): centraliza CORS, JWT malformados, JSON parse fallido y nunca expone stack traces.
- **Transacción en `/auth/reset-password`** (`authController.js`): `BEGIN`…`COMMIT`, con `rollback()` en cualquiera fallo (ya aplicado en este cambio).
- **Health check real:** `GET /health` ejecuta `SELECT 1` y responde `status:ok/degraded`.
- **Idempotencia** en migración de `PASSWORD_RESET` (CREATE TABLE IF NOT EXISTS) y en container bootstrap de DB.

### Brechas
- El resto de operaciones multi-tabla (crear ciclo + cerrar anterior) se hacen por queries separadas sin transacción.
- El servidor no implementa apagado ordenado (`SIGTERM` → pool.end()).
- La app móvil no persiste datos offline (sin cache de última sesión).
- Render free tier duerme el servicio tras inactividad (~30-60 s de latencia en el primer request) — documentado en manual.

### Sugerencias
- Envolver `CicloModel.create + cierre de ciclo` en transacción.
- Añadir listeners `process.on('SIGTERM')` para cerrar el pool.
- Mostrar en frontend un "banner de backend dormido" al recibir timeout > 30 s.

---

## 5. Seguridad — ✅ ALTO (con 1 brecha importante)

### Evidencia
- **Contraseñas:** bcrypt con 12 rondas (`authService.js`), límite de 72 bytes (BUG-004), sin texto plano en BD (schema).
- **JWT:** firmado con `JWT_SECRET` obligatorio (Fatal si falta), `expiresIn 8h`, y **token de reseteo de un solo uso** con 15 min (`signResetToken`), verificado firma + usabilidad en BD.
- **Rate limit** en `/login` (10/15 min) y nuevo en `/auth/recuperar-password` (5/15 min).
- **SQL parametrizado** (query con `?` en todos los modelos).
- **Helmet** con CSP off solo para Swagger UI.
- **Contra enumeración de usuarios:** `/auth/recuperar-password` responde 200 genérico cuando no existe.
- **Datos propios:** `/afiliados/me*` usa `req.user.sub` — un afiliado no lee datos ajenos (énfasis del paso 3.1 del usuario ✓).
- **XSS:** React escapa strings; el backend no refleja `req.path` en respuestas 404.

### Brechas (importantes)
1. **CORS `origin: '*'` activo** en `server.js` (temporal, pendiente de pasar a lista blanca en producción). ※ crítico
2. Crawlers de sesión `localStorage` → expuesto a XSS stored; sin token de refresh (los 8h son longíos).
3. `JWT_SECRET` de ejemplo en `.env` de `backend/` (documentado como dev/postna; NO enviar a git — verificado en `.gitignore`).
4. No hay `helmet` CSP total (deshabilitada por Swagger) — acceptable.

### Sugerencias
- Restaurar CORS con lista blanca `[FRONTEND_URL]` en `/` acceso.
- Elegir ApiKey rotación o refresh token (opcional).
- Auditoría de dependencias (`npm audit`) en CI.

---

## 6. Mantenibilidad — ✅ ALTO

### Evidencia
- **Modularización MVC + Servicios:** `controllers/` + `models/` + `services/` (authService, afiliadoService, usuarioService) en `frontend_web` + `movil` con carpetas `views/screens` + `services` + `context` + `hooks`.
- **Nombres claros** (métodos con responsabilidad única (srp) y comentados).
- **Documentación extensa** en `documentacion/`: MANUAL_INGENIERIA_COMPLETO, MANUAL_TECNICO, MANUAL_POSTMAN, MANUAL_DESPLIEGUE, MANUAL_USUARIO, QA_REPORT, AUDITORIA_FINAL, DIAGRAMAS.
- **Swagger UI** automatizado a partir de comentarios (`config/swagger.js`).
- **Test SDKs:** jest + supertest (`backend/__tests__/api.test.js`, `afiliadoService.test.js`).

### Deuda técnica detectada
- `ROLES`/`ROLE_MAP` duplicado en `Login.jsx` vs `authService.js` (`AVAILABLE_ROLES`).
- `Login.css` clásico sin uso directo (usa CSS modules `Login.module.css`).
- `scripts/generate_icons.js` desligado de la generación actual de iconos.
- Funcionalidades de demostración comentadas en el código de `afiliadoRoutes` (PASSWORD_RESET etc.).

### Sugerencias
- Centralizar catálogos de roles en un solo módulo compartido.
- Borrar `Login.css` y unificar en un `global.css` de tema oscuro.
- Subir la cobertura de tests (hoy ~15% de endpoints).

---

## 7. Portabilidad — ✅ ALTO

### Evidencia
- **Docker Compose** 4 servicios (db MySQL 8, backend, frontend Vite, phpMyAdmin) con healthchecks, volúmenes y migración SQL automática en orden lexicográfico.
- **render.yaml** declarativo para Render (web service tipo Docker, healthcheck `/health`, envVars documentadas).
- **DATABASE_URL o DB_*** indiferente (compatible Railway/Render/local).
- **Frontend con `.env` de VITE_API_URL** para apuntar a cualquier backend.
- **APK móvil** servido desde el Static Site (monitoreado por `scripts/monitorear_apk.sh`).

### Brechas
- El `Dockerfile` de la raíz incluye MariaDB embebido (start.sh levanta y crea una BD en el contenedor) — útil para Render, pero implica dos entornos de BD a mantener (MySQL del compose + MariaDB embebido).
- No hay `.env.example` para frontend (vistas `VITE_API_URL`).

---

## 8. Conclusiones y plan de acción (formato tabla)

| Prioridad | Acción | Característica | Impacto |
|---|---|---|---|
| P1 | Restringir CORS (permitir sólo el origin del frontend Render) | 3.6/3.3 | Seguridad |
| P1 | `requireAdminOrRecepcionista` en POST/PATCH afiliados | 3.1/3.6 | RBAC correcto |
| P2 | Transacciones en altas de ciclos + cierre del anterior | 3.5 | Consistencia BD |
| P2 | `React.lazy` y `Cache-Control` en web | 3.2 | Performance |
| P2 | Re-tests de scripts y base de datos en CI (Acciones) | 3.7/3.5 | Regresión |
| P3 | Unificar catálogos de roles y temas; eliminar CSS huérfano | 3.7 | Mantenibilidad |
| P3 | Pruebas E2E (Playwright) sobre web y APK (vía EAS QA) | 3.3 | Calidad |

> Nota: CORS `*` es un estado transitorio mientras se terminaba el despliegue automatizado; debe volver a lista blanca en la próxima iteración (véase 3.6).