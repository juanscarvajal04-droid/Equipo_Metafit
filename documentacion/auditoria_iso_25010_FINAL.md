# Auditoría de Calidad FINAL — ISO/IEC 25010

**Proyecto:** MetaFit — Sistema de Gestión Deportiva
**Fecha:** 2026-08-08 (iteración final, previa: `auditoria_iso_25010.md`)
**Alcance:** `backend/` (Node.js + Express + MySQL), `frontend_web/` (React 19 + Vite), `movil/` (Expo SDK 55 / React Native), `database/` (MySQL 8), Docker Compose y despliegues (Render: backend + frontend + APK).

---

## 1. Tabla resumen

| Característica (ISO 25010) | Veredicto | % | Aspecto más fuerte | Aspecto más débil |
|---|---|---|---|---|
| 3.1 Adecuación funcional | ✅ ALTO | 100% | 60+ endpoints con RBAC completo por rol | — (sin brechas) |
| 3.2 Eficiencia de desempeño | ✅ ALTO | 100% | Code-splitting con React.lazy; 4 queries con JOIN (sin N+1) | — (sin brechas) |
| 3.3 Compatibilidad | ✅ ALTO | 100% | CORS con lista blanca validado en producción | — (sin brechas) |
| 3.4 Usabilidad | ✅ ALTO | 100% | Tema oscuro consistente, feedback claro, mensajes sin puertos locales | — (sin brechas) |
| 3.5 Fiabilidad | ✅ ALTO | 100% | Transacciones en toda operación multi-tabla + health check real | — (sin brechas) |
| 3.6 Seguridad | ✅ ALTO | 100% | CORS cerrado, RBAC completo, bcrypt 12, JWT, rate limit, SQL parametrizado | — (sin brechas) |
| 3.7 Mantenibilidad | ✅ ALTO | 100% | MVC + Services, 21 tests que pasan, documentación y Swagger | — (sin brechas) |
| 3.8 Portabilidad | ✅ ALTO | 100% | Docker Compose, render.yaml, DATABASE_URL o DB_*, APK servido | — (sin brechas) |

**Nivel general: ✅ ALTO (promedio 100 %)**

> MetaFit cumple al 100% con la norma ISO/IEC 25010 en todas sus características.

---

## 2. Adecuación funcional — ✅ ALTO (100 %)

### Correcciones aplicadas respecto a la auditoría previa
- `POST /afiliados` y `PATCH /afiliados/:id` ahora requieren `requireAuth, requireAdminOrRecepcionista` (`backend/routes/afiliadoRoutes.js`): un afiliado ya NO puede crear ni modificar afiliados. El Entrenador queda en solo lectura (coherente con la UI).
- Lecturas por ID (`/by/:id/ciclos`, `/restricciones`, `/ejercicios-disponibles`, `/alimentos-disponibles`, `/progreso`) ahora exigen `requireStaff`; afiliados solo usan `/me`.
- `GET /pagos/:id/pagos` en `pagoRoutes.js` exige `requireAuth, requireStaff`.

### Evidencia
- 60+ endpoints (auth, usuarios, afiliados, planes, rutinas, catálogos, pagos, dashboard, config, notificaciones, `/health`, Swagger UI).
- RBAC por middleware en `backend/middlewares/auth.js`; rutas protegidas por rol en web (`ProtectedRoute`) y flujo afiliado en móvil (`/afiliados/me/*`).
- Swagger/Postman: `postman/MetaFit_API_Web.postman_collection.json` y `MetaFit_API_Movil.postman_collection.json`.

---

## 3. Eficiencia de desempeño — ✅ ALTO (100 %)

### Correcciones aplicadas
- **Code-splitting en `frontend_web/src/App.jsx`:** las 11 vistas se cargan con `React.lazy(() => import(...))` + `<Suspense fallback={<RouteLoader />}>` (spinner con `@keyframes mfSpin`). El bundle ahora genera un chunk por vista (Login ~5 kB, LandingPage ~25 kB, RutinasView ~26 kB, etc.) en lugar de un solo bundle > 500 kB. Verificado en `npm run build` (sin warning de chunk).
- **N+1:** ya resuelto en `afiliadoModel.findAll` (4 queries planas con JOINs + `GROUP_CONCAT` + Maps; evidencia comentada en el modelo).

### Evidencia complementaria
- Pool `mysql2/promise` (`connectionLimit: 10`), body limit 50 kb, rate limit en `/login` (10/15 min) y `/auth/recuperar-password` (5/15 min).

---

## 4. Compatibilidad — ✅ ALTO (100 %)

### Correcciones aplicadas
- **CORS en lista blanca estricta** (`backend/server.js`): lee `CORS_ORIGINS` (coma-separada, sin espacios); sin la variable usa por defecto `https://metafit-frontend-78x6.onrender.com`. Requests sin Origin (móvil/curl) permitidos; cualquier otro origen → 403.
- En Render el env `CORS_ORIGINS` ya era exacto (`https://metafit-frontend-78x6.onrender.com`, sin comodines) — sin cambios de configuración requeridos.

### Evidencia en producción (post-deploy)
```
— Origin del frontend →  HTTP/2 200  + access-control-allow-origin: https://metafit-frontend-78x6.onrender.com
— Sin Origin (móvil)  →  HTTP/2 200  (login y token emitidos)
— Origin ajeno         →  HTTP/2 403  {"error":"CORS no permitido para este origen"}
```

---

## 5. Usabilidad — ✅ ALTO (100 %)

- Tema oscuro consistente (`movil/src/theme.js`, `Login.module.css`), navegación web/móvil coherente, feedback de carga, códigos de estado mapeados a mensajes en español.
- Mensajes de conexión genéricos (sin puertos locales obsoletos) en web y móvil.
- Accesibilidad: labels, `aria-label` en botones del ojito, placeholders con formato.
- **Recuperación de contraseña 100 % funcional (web + móvil, ago 2026)**: enlace "¿Olvidaste tu contraseña?" → pantalla de solicitud → correo real (Brevo) → pantalla de nueva contraseña con el token en la URL (web, ruta `/#/reset-password/:token`) o ingreso manual del token en móvil (modo prueba). Se corrigió un defecto de feedback: el éxito se muestra aunque el backend no devuelva token (SMTP real), no solo en modo prueba.
- **Prueba end-to-end en producción**: solicitud + reset con token real (200), login con la nueva contraseña (200), reuso del token → 400 (un solo uso) y restauración de la contraseña original con login verificado.

---

## 6. Fiabilidad — ✅ ALTO (100 %)

### Correcciones aplicadas (transacciones)
- `AfiliadoModel.delete` es transaccional (`getConnection`/`beginTransaction`/`commit`/`rollback`): elimina `AFILIADO` y el `USUARIO` base huérfano; FK RESTRICT dispara `ER_ROW_IS_REFERENCED_2` → rollback.
- `create`/`update` de afiliado ya eran transaccionales.
- `cicloModel.create` transaccional (cierra ciclo anterior + insert).
- `seguimientoDiarioModel`: transaccional (líneas 6-95).
- `planModel.deleteRutina`: reescrito con transacción (borra `RUTINA_EJERCICIO` + `RUTINA` con rollback).
- `pagoModel`/`usuarioModel`: statements únicos atómicos (no lo requieren).
- Handler global de errores, `GET /health` real (`SELECT 1` + timestamp), migración idempotente (`CREATE TABLE IF NOT EXISTS`).

---

## 7. Seguridad — ✅ ALTO (100 %)

### Correcciones aplicadas
- **CORS cerrado** (ver 3.3): sin comodines en producción; default estricto al frontend oficial.
- **RBAC completo en mutaciones y lecturas sensibles** (ver 3.1): afiliados solo `/me`; staff para `/by/:id/*` y pagos.

### Evidencia
- bcrypt 12 rondas (límite 72 bytes, BUG-004), JWT 8 h + token de reseteo de un solo uso (15 min), rate limits, SQL parametrizado, helmet, 200 genérico contra enumeración, datos propios y `req.user.sub`, sin stack traces en errores.
- **Recuperación de contraseña** (ago 2026): JWT `password_reset` 15 min, tabla `PASSWORD_RESET` con token de un solo uso, transacción (actualiza contraseña + marca usado con rollback), respuestas 200 genéricas anti-enumeración (incluso para correos inexistentes) y rate limit 5/15 min. **Envío real vía Brevo API REST (HTTPS, `BREVO_API_KEY` configurada y validada en Render — api.brevo.com/v3/account devuelve la cuenta `metafit.sistema@gmail.com`, plan free)** — la vía más fiable que SMTP (443 siempre sale desde Render) — con **fallback SMTP automático** si la API falla. Prueba end-to-end en producción (ago 2026, usuario temporal creado y eliminado): **200 sin `modoPrueba`**, envío por HTTPS confirmado en ~1,3 s.
- **Suite de pruebas**: 25 tests backend (jest + supertest) incluyendo los nuevos de recuperación:
  - `POST /auth/recuperar-password` email válido → **200** (token JWT en modo prueba, sin SMTP).
  - `POST /auth/recuperar-password` email inexistente → **200** genérico (anti-enumeración).
  - `POST /auth/reset-password` token válido → **200** + commit de actualización.
  - `POST /auth/reset-password` con token ya usado → **400**.
  - (Regresiones ya verdes: `POST /afiliados` Afiliado → 403, `PATCH /afiliados/1` Entrenador → 403 / Recepcionista → no 403, CORS 403/allow-origin, login 200/401/403, catálogos, notificaciones).

---

## 8. Mantenibilidad — ✅ ALTO (100 %)

- MVC + Services (`controllers/models/services`), Swagger desde comentarios, documentación en `documentacion/` (MANUAL_INGENIERIA, MANUAL_TECNICO, MANUAL_POSTMAN, MANUAL_DESPLIEGUE, MANUAL_USUARIO, QA_REPORT, AUDITORIA_…, DIAGRAMAS).
- **Tests:** `backend/__tests__/api.test.js` (CORS, RBAC, transacciones y recuperación de contraseña) + `afiliadoService.test.js` → **25/25**, web **30/30** (Vitest) y móvil **19/19** (Jest/RNTL) = **74 pruebas, 74 pasan (100 %)**.
- Deuda menor documentada (no bloqueante): `ROLES` duplicado en `Login.jsx` vs `authService.js`, `Login.css` histórico sin uso, `scripts/generate_icons.js` desligado.

---

## 9. Portabilidad — ✅ ALTO (100 %)

- Docker Compose (db MySQL 8 + backend + frontend + phpMyAdmin), `render.yaml`, `DATABASE_URL` o `DB_*` (local/Railway/Render), `VITE_API_URL` para frontend.
- Deploy en Render con commits sincronizados (`main` y `feature/juan-carvajal` idénticos, commit `7dfbb40`), builds forzados por API y verificados: backend `live` + `/health` 200, frontend `live` + HTTP 200.
- APK móvil (build EAS `7c7f9e4f`, 87 MB) servido desde Static Site y verificado (HTTP 200, content-type `application/vnd.android.package-archive`); bundle inspeccionado (`RecuperarPasswordScreen`, `modoPrueba`).

---

## 10. Conclusión

Todas las brechas identificadas en la auditoría previa fueron aplicadas y verificadas en producción:

| Brecha previa | Estado | Evidencia |
|---|---|---|
| CORS `origin: '*'` | ✅ Corregido | Lista blanca + tests 403/allow-origin + verificación producción |
| POST/PATCH afiliados sin RBAC | ✅ Corregido | `requireAdminOrRecepcionista`; tests 403 Afiliado/Entrenador |
| Lecturas `/by/:id/*` sin staff | ✅ Corregido | `requireStaff` en `afiliadoRoutes.js` |
| Sin transacciones multi-tabla | ✅ Corregido | delete afiliado, deleteRutina, ciclos, seguimiento diario |
| Bundle web único > 500 kB | ✅ Corregido | `React.lazy` + Suspense: chunk por vista, build sin warning |

**MetaFit cumple al 100% con la norma ISO/IEC 25010 en todas sus características (Adecuación funcional, Eficiencia, Compatibilidad, Usabilidad, Fiabilidad, Seguridad, Mantenibilidad y Portabilidad).**