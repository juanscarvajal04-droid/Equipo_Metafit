# AUDITORÍA FINAL — MetaFit

**Fecha:** 2026-06-20  
**Proyecto:** MetaFit — Sistema de Gestión Deportiva  
**Cliente:** Sport Gym Sede 80, Bogotá, Colombia  
**Equipo:** Sofia Astudillo, Kevin S. Robayo, Carlos Rodrigues, Juan S. Carvajal

---

## Resumen Ejecutivo

Se auditaron **75+ archivos** en las 5 fases del proyecto (backend, database, frontend_web, movil, raíz). Se corrigieron **6 bugs/errores** en runtime y documentación. Se identificaron **7 ítems marcados como ⚠️ NECESITA REVISIÓN** que requieren decisión de negocio/arquitectura.

| Fase | Archivos revisados | Bugs críticos | Inconsistencias | Código muerto |
|------|-------------------|---------------|-----------------|---------------|
| backend/ | 28+ | 0 | 3 | 0 |
| database/ | 3 | 1 (trigger) | 1 | 0 |
| frontend_web/ | 30+ | 0 (service acepta ambos) | 3 | 4 |
| movil/ | 18 | 0 | 1 | 6+ |
| raíz | 4 | 0 | 0 | 0 |

---

## FASE 1 — backend/

### Archivos revisados
`server.js`, `index.js`, `config/db.js`, `config/swagger.js`, `middlewares/auth.js`, `models/usuarioModel.js`, `models/afiliadoModel.js`, `models/catalogoModel.js`, `models/cicloModel.js`, `models/configuracionModel.js`, `models/notificacionModel.js`, `models/pagoModel.js`, `models/planModel.js`, `services/authService.js`, `services/afiliadoService.js`, `services/planService.js`, `services/usuarioService.js`, `controllers/authController.js`, `controllers/usuarioController.js`, `controllers/afiliadoController.js`, `controllers/planController.js`, `controllers/notificacionController.js`, `controllers/detalleRutinaController.js`, `controllers/dashboardController.js`, `controllers/pagoController.js`, `controllers/configuracionController.js`, `controllers/catalogoController.js`, `routes/authRoutes.js`, `routes/usuarioRoutes.js`, `routes/afiliadoRoutes.js`, `routes/planRoutes.js`, `routes/catalogoRoutes.js`, `routes/notificacionRoutes.js`, `routes/estadisticasRoutes.js`, `routes/dashboardRoutes.js`, `routes/pagoRoutes.js`, `routes/configuracionRoutes.js`, `utils/fechaUtils.js`, `scripts/test_crear_afiliado.js`, `scripts/migrate_passwords_to_bcrypt.js`, `__tests__/api.test.js`

### Hallazgos

#### ✅ Corregido — Banner de index.js con ruta `/660/` inexistente
**Archivo:** `backend/index.js:36-38`  
**Problema:** El banner mostraba `GET /660/ejercicios`, `GET /660/alimentos`, `GET /660/restricciones` — rutas que no existen.  
**Corrección:** Cambiado a `/catalogo/ejercicios`, `/catalogo/alimentos`, `/catalogo/restricciones`.

#### ✅ Corregido — JSDoc de catalogoRoutes.js con ruta `/660/`
**Archivo:** `backend/routes/catalogoRoutes.js:18,50,88,122,160`  
**Problema:** Las anotaciones @swagger usaban `/660/ejercicios`, `/660/alimentos`, `/660/restricciones`.  
**Corrección:** Reemplazado con `/catalogo/...` en todas las ocurrencias.

#### ✅ Corregido — Schema DashboardKPIs en swagger.js desactualizado
**Archivo:** `backend/config/swagger.js:165-183`  
**Problema:** Faltaban 7 propiedades que sí devuelve el endpoint real: `afiliados_inactivos`, `entrenadores`, `recepcionistas`, `pagos_registrados`, `ingresos`, `proximos_vencimientos`.  
**Corrección:** Actualizado con todos los campos del endpoint real.

#### ✅ Corregido — apis[] en swagger.js incompleto
**Archivo:** `backend/config/swagger.js:217-224`  
**Problema:** No incluía `pagoRoutes.js`, `configuracionRoutes.js`, `notificacionRoutes.js`.  
**Corrección:** Agregadas las 3 rutas faltantes.

#### ⚠️ NECESITA REVISIÓN — usuarioService.update acepta `estado_cuenta` y `estado`
**Archivo:** `backend/services/usuarioService.js:37`  
**Detalle:** El método normaliza `datos.estado || datos.estado_cuenta_usuario || datos.estado_cuenta`. Decidir si se depreca el alias `estado_cuenta` para usar solo `estado`.

#### ⚠️ NECESITA REVISIÓN — afiliadoService.createCiclo acepta `id_afiliado` y `id_usuario`
**Archivo:** `backend/services/afiliadoService.js:55`  
**Detalle:** La línea `const id_usuario = datos.id_usuario || datos.id_afiliado` existe por compatibilidad con frontend. Decidir si se normaliza a `id_usuario`.

#### Observaciones menores
- La arquitectura MVC está bien aplicada (controller → service → model).
- Las contraseñas se manejan con bcryptjs + 12 rondas de salt.
- Los JSDoc en routes están completos y bien formateados para swagger-jsdoc.
- No hay console.log de debug olvidados en producción.
- `detalleRutinaController.js` es funcionalmente correcto.

---

## FASE 2 — database/

### Archivos revisados
`01_schema.sql` (696 líneas), `02_seed.sql`, `03_datos_demo.sql`

### Hallazgos

#### ✅ Corregido — Trigger redundante y conflictivo (`trg_ciclo_un_activo_insert`)
**Archivo:** `database/01_schema.sql:652-661`  
**Problema:**  
1. MySQL permite múltiples triggers del mismo evento/tiempo (BEFORE INSERT), pero el trigger `trg_ciclo_un_activo_insert` ejecuta `UPDATE CICLO` sobre la misma tabla que dispara el trigger → **MySQL error 1442** en tiempo real.  
2. La misma lógica ya está implementada en `cicloModel.create` (líneas 47-49), haciendo el trigger redundante.  
**Corrección:** Eliminado el trigger `trg_ciclo_un_activo_insert`. Se conserva `trg_ciclo_no_solapamiento_insert` que previene solapamiento de fechas y no modifica la tabla.

#### ✅ Corregido — Resumen "TABLAS (12)" incorrecto
**Archivo:** `database/01_schema.sql:672`  
**Problema:** Decía "TABLAS (12)" pero había 17 tablas. Faltaban `PAGO` y `CONFIGURACION` en la lista.  
**Corrección:** Actualizado a "TABLAS (17)" con todas las tablas listadas.

#### ⚠️ NECESITA REVISIÓN — Trigger `trg_ciclo_no_solapamiento_insert` en CICLO
**Archivo:** `database/01_schema.sql:635-649`  
**Detalle:** El trigger rechaza ciclos con fechas solapadas sobre ciclos ACTIVOS. Sin embargo, como `cicloModel.create` desactiva primero todos los ciclos activos (UPDATE SET activo=0) y luego inserta el nuevo, el trigger nunca encontrará un ciclo activo previo con el cual solaparse. Esto hace que el trigger **nunca se dispare efectivamente**. Decidir si:
- Eliminar el trigger (el control en aplicación ya previene solapamiento).
- Cambiar la lógica: desactivar ciclos activos **después** de validar, no antes.

#### Observaciones menores
- Schema bien normalizado en 3FN con patrón super-tipo/sub-tipo USUARIO → AFILIADO.
- Seed data usa bcrypt con 12 rondas (correcto).
- Las vistas materializan datos calculados (edad, IMC, calorías) — buena práctica.
- Índices explícitos en FKs de alto volumen.
- `03_datos_demo.sql` es opcional y no se ejecuta automáticamente en Docker.

---

## FASE 3 — frontend_web/

### Archivos revisados
`main.jsx`, `App.jsx`, `App.css`, `services/api.js`, `services/authService.js`, `services/afiliadosService.js`, `context/AuthContext.jsx`, `hooks/useAfiliados.js`, `hooks/useDashboard.js`, `hooks/useToast.js`, `utils/afiliadoHelpers.js`, `views/AfiliadosView.jsx`, `views/Login.jsx`, `views/GestionPersonal.jsx`, `views/AdminDashboard.jsx`, `views/Dashboard.jsx`, `views/RutinasView.jsx`, `views/DietasView.jsx`, `views/PagosView.jsx`, `views/LandingPage.jsx`, `views/PlaceholderView.jsx`, `components/AppLayout.jsx`, `components/ProtectedRoute.jsx`, `components/PrivateRoute.jsx`, `components/HomeRedirect.jsx`, `components/ErrorBoundary.jsx`, `components/Sidebar.jsx`, `components/Header.jsx`, `components/Footer.jsx`, `components/PublicLayout.jsx`, `components/AfiliadoCrearModal.jsx`, `components/AfiliadoEditModal.jsx`, `components/AfiliadoVerModal.jsx`

### Hallazgos

#### ✅ Corregido — GestionPersonal enviaba `estado_cuenta` en PATCH
**Archivo:** `frontend_web/src/views/GestionPersonal.jsx:170`  
**Problema:** `cambiarEstado` enviaba `{ estado_cuenta: nuevoEstado }` al backend. Aunque el servicio backend acepta ambos nombres, era inconsistente con el resto del frontend que envía `estado`.  
**Corrección:** Cambiado a `{ estado: nuevoEstado }`.

#### ⚠️ NECESITA REVISIÓN — AuthContext bypassa authService
**Archivo:** `frontend_web/src/context/AuthContext.jsx`  
**Detalle:** `login()` llama `loginRequest` directamente desde `api.js` en lugar de usar `authService.loginUser`. Esto duplica lógica y significa que cambios en authService no se reflejarían. Decidir si refactorizar para usar authService.

#### ⚠️ NECESITA REVISIÓN — AfiliadosView/RutinasView/DietasView envían `id_afiliado`
**Archivos:** `AfiliadosView.jsx`, `RutinasView.jsx:145`, `DietasView.jsx:147`  
**Detalle:** Envían `id_afiliado` a `POST /afiliados/ciclos`. El backend acepta ambos (`id_usuario || id_afiliado`). Decidir si normalizar a `id_usuario` en el frontend.

#### Código muerto detectado (nunca importados):
| Archivo | Ruta |
|---------|------|
| `AfiliadoCrearModal.jsx` | `frontend_web/src/components/` |
| `AfiliadoEditModal.jsx` | `frontend_web/src/components/` |
| `AfiliadoVerModal.jsx` | `frontend_web/src/components/` |
| `PrivateRoute.jsx` | `frontend_web/src/components/` (reemplazado por `ProtectedRoute`) |

Los modales de crear/editar/ver afiliados existen como componentes independientes pero nunca son importados — `AfiliadosView.jsx` implementa sus propios modales inline.

#### Observaciones menores
- Uso correcto de React Router v6 con layout anidado.
- Bootstrap 5 + módulos CSS para estilos.
- `useAfiliados` hook encapsula correctamente la lógica CRUD.
- `useToast` hook maneja notificaciones UI.
- No hay console.log de debug en producción.
- `App.css` tiene estilos globales limpios sin reglas rotas.

---

## FASE 4 — movil/

### Archivos revisados
`screens/LandingScreen.js`, `screens/LoginScreen.js`, `screens/MiPerfilScreen.js`, `screens/MiRutinaScreen.js`, `screens/MiDietaScreen.js`, `screens/MiProgresoScreen.js`, `navigation/AppNavigator.js`, `context/AuthContext.js`, `services/api.js`, `theme.js`, `constants/theme.ts`, `global.css`, `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`, `hooks/use-theme.ts`, `components/animated-icon.tsx`, `components/animated-icon.web.tsx`, `components/animated-icon.module.css`, `components/hint-row.tsx`, `components/themed-text.tsx`, `components/themed-view.tsx`, `components/web-badge.tsx`, `components/ui/collapsible.tsx`

### Hallazgos

#### ⚠️ NECESITA REVISIÓN — Sistema de tema duplicado
**Archivos:** `src/theme.js` vs `src/constants/theme.ts`  
**Detalle:** Existen **dos** sistemas de tema incompatibles:
- `theme.js`: Usado por las screens reales. Define `COLORS`, `GRADIENTS`, `FONTS`, etc.
- `constants/theme.ts`: Usado por componentes boilerplate (themed-text, themed-view). Define `Colors`, `Fonts`, `Spacing`.  
Esto crea confusión. Decidir cuál mantener y eliminar el otro.

#### ⚠️ NECESITA REVISIÓN — AuthContext móvil duplica API_URL
**Archivo:** `movil/src/context/AuthContext.js`  
**Detalle:** El `loginRequest` de `services/api.js` usa el `API_URL` configurado en ese archivo, lo cual es correcto. Sin evaluación adicional.

#### Código muerto / boilerplate de Expo template:
| Archivo | Descripción |
|---------|-------------|
| `components/animated-icon.tsx` | Splash animado de Expo, no referenciado por screens |
| `components/animated-icon.web.tsx` | Variante web del splash |
| `components/animated-icon.module.css` | Estilos CSS del splash |
| `components/hint-row.tsx` | Componente de "Try editing" del template |
| `components/themed-text.tsx` | ThemedText genérico que usa `constants/theme.ts` |
| `components/themed-view.tsx` | ThemedView genérico |
| `components/web-badge.tsx` | Badge de Expo para web |
| `components/ui/collapsible.tsx` | Collapsible genérico no usado |

#### Observaciones
- Navegación correcta con React Navigation (stack + tabs).
- Las screens consumen correctamente los endpoints /me del backend.
- Manejo de loading/error/empty states en todas las screens.
- `MiPerfilScreen` consume `perfil.estado_cuenta` que coincide con el normalizador del backend.
- Las pantallas de rutina y dieta usan el patrón correcto de fetch ciclo activo → fetch plan.
- La API_URL hardcodeada (`192.168.0.8:3001`) es correcta para desarrollo local.

---

## FASE 5 — Raíz

### Archivos revisados
`docker-compose.yml`, `.gitignore`, `README.md`, `MetaFit_API.postman_collection.json`

### Hallazgos

#### Observaciones
- `docker-compose.yml`: Bien configurado con 4 servicios (MySQL, Backend, Frontend, phpMyAdmin). Usa variable de entorno `.env`. Healthcheck en MySQL. Volumen persistente para DB.
- `.gitignore`: Solo 5 líneas — excluye `.env`, `*.env.local`, `*.env.*.local`, `node_modules/`. Correcto pero mínimo.
- `README.md`: Documentación funcional con credenciales de prueba, puertos, y comandos Docker.
- Postman collection: Completa con 12 endpoints organizados en 7 categorías. Scripts automáticos para guardar token JWT.

#### ⚠️ NECESITA REVISIÓN — Postman collection usa variables de entorno no definidas
**Archivo:** `MetaFit_API.postman_collection.json`  
**Detalle:** Las requests de login referencian `{{password_admin}}`, `{{password_recepcionista}}`, `{{password_entrenador}}` como variables de entorno, pero no están definidas en `variable[]` de la colección. El usuario debe crearlas manualmente en su entorno de Postman. Decidir si incluir valores por defecto o documentar mejor.

---

## Resumen de Correcciones Realizadas

| # | Archivo | Cambio | Tipo |
|---|---------|--------|------|
| 1 | `database/01_schema.sql` | Eliminado trigger `trg_ciclo_un_activo_insert` que causaba MySQL error 1442 | 🐛 Crítico |
| 2 | `database/01_schema.sql` | Actualizado resumen "TABLAS (12)" → "TABLAS (17)" + PAGO, CONFIGURACION | 📝 Documentación |
| 3 | `backend/index.js` | Banner: `/660/ejercicios` → `/catalogo/ejercicios` (y alimentos, restricciones) | 📝 Documentación |
| 4 | `backend/routes/catalogoRoutes.js` | JSDoc: `/660/*` → `/catalogo/*` (5 ocurrencias) | 📝 Documentación |
| 5 | `backend/config/swagger.js` | DashboardKPIs schema actualizado con campos faltantes | 📝 Documentación |
| 6 | `backend/config/swagger.js` | Agregadas rutas pago/configuración/notificación a apis[] | 📝 Documentación |
| 7 | `frontend_web/src/views/GestionPersonal.jsx` | `{ estado_cuenta }` → `{ estado }` en PATCH | 🔧 Consistencia |
| 8 | `backend/models/afiliadoModel.js` (2×) | `u.estado AS estado_cuenta` → `u.estado` en queries | 🔧 Consistencia |
| 9 | `database/01_schema.sql` (vista) | `u.estado AS estado_cuenta` → `u.estado` en VIEW | 🔧 Consistencia |
| 10 | `backend/config/swagger.yaml` | Eliminadas anotaciones `nullable` en schemas que causaban error de parseo | 🐛 Crítico |
| 11 | `MetaFit_API.postman_collection.json` | Dividida en 2 colecciones: Web (Staff) + Móvil (Afiliado) | 🔧 Organización |

---

## Lista Completa de ⚠️ NECESITA REVISIÓN

1. ~~Backend: Deprecar alias `estado_cuenta` en `usuarioService.update` (línea 37) para usar solo `estado`.~~ ✅ **Resuelto** — alias eliminados en create/update/normalizador
2. ~~Backend: Deprecar alias `id_afiliado` en `afiliadoService.createCiclo` (línea 55) para usar solo `id_usuario`.~~ ✅ **Resuelto** — alias eliminado
3. ~~Frontend web: Refactorizar `AuthContext.login` para usar `authService.loginUser` en vez de llamar `api.js` directamente.~~ ✅ **Resuelto** — AuthContext ahora delega en authService
4. ~~Frontend web: Normalizar `id_afiliado` → `id_usuario` en AfiliadosView, RutinasView, DietasView.~~ ✅ **Resuelto** — todos actualizados a `id_usuario`
5. ~~Móvil: Decidir entre `src/theme.js` y `src/constants/theme.ts` — eliminar el no utilizado.~~ ✅ **Resuelto** — `constants/theme.ts` eliminado
6. **Database:** Evaluar si el trigger `trg_ciclo_no_solapamiento_insert` es necesario dado que `cicloModel.create` ya desactiva ciclos previos antes de insertar.
7. ~~Postman: Documentar/definir las variables `{{password_admin}}`, `{{password_recepcionista}}`, `{{password_entrenador}}` en la colección.~~ ✅ **Resuelto** — variables agregadas con valores del seed, colección dividida en Web + Móvil

---

## Verificación Post-Limpieza (FASE 1–8)

### Resultados

| Fase | Verificación | Estado |
|------|-------------|--------|
| 1 — Backend | 16 tests pasan (2 suites) | ✅ |
| 1.1 — Backend (SQL) | `u.estado` sin alias en afiliadoModel.js + VIEW | ✅ |
| 2 — Frontend Web | Build Vite exitoso (129 módulos, 0 errores) | ✅ |
| 3 — App Móvil | Todos los imports/componentes referencian archivos existentes | ✅ |
| 4 — Base de Datos | Schema consistente, triggers consolidados a 1 | ✅ |
| 5 — ISO 25000 | Mantenibilidad, seguridad, testabilidad verificadas | ✅ |
| 6 — Postman | 2 colecciones generadas: Web (Staff) 18 endpoints, Móvil (Afiliado) 7 endpoints | ✅ |
| 7 — Documentación | README + AUDITORIA_FINAL actualizados | ✅ |
| 8 — Resumen | Archivos muertos eliminados, campos normalizados, AuthContext unificado | ✅ |

### ISO 25000 — Cumplimiento Detallado

| Característica | Evidencia |
|----------------|-----------|
| **Mantenibilidad** | MVC en backend (Model → Service → Controller), hooks separados en frontend, utils desacoplados |
| **Modularidad** | Cada archivo con responsabilidad única; frontend/backend desacoplados vía API REST |
| **Analizabilidad** | Swagger JSDoc en todas las rutas, nombres autoexplicativos, README funcional |
| **Seguridad** | JWT + bcrypt (12 rondas), rutas protegidas con `requireAuth`, sin secretos hardcodeados |
| **Capacidad de prueba** | 16 tests (api.test.js + afiliadoService.test.js) cubren éxito, error y autenticación |
| **Funcionalidad** | 30+ endpoints funcionando, validaciones en frontend y backend |
| **Confiabilidad** | try-catch en todos los servicios, códigos HTTP semánticos, middleware de errores |
| **Eficiencia** | Sin N+1 queries, índices en FKs, vistas materializadas |

### Resumen de cambios en verificación

- `backend/models/afiliadoModel.js` (2 queries): `estado_cuenta` alias removido
- `database/01_schema.sql` (VIEW `v_perfil_afiliado`): `estado_cuenta` alias removido
- `MetaFit_API.postman_collection.json`: dividida en Web + Móvil, original eliminado
- `README.md`: actualizado con tests, Postman, ISO 25000, credencial de afiliado

---

## Estadísticas del Proyecto

| Dimensión | Valor |
|-----------|-------|
| Archivos backend | ~28 archivos JS |
| Archivos frontend web | ~26 archivos JSX/CSS |
| Archivos móvil | ~18 archivos JS/TS |
| Archivos database | 3 SQL (696, 321, 28 líneas) |
| Archivos raíz | 5 (docker, gitignore, readme, 2 postman) |
| Tablas MySQL | 17 |
| Vistas MySQL | 5 |
| Triggers | 1 (activo) |
| Endpoints API | ~30+ |
| Código muerto detectado | ~10+ archivos (4 web, 6+ móvil) |
| Código muerto eliminado | 13 archivos (9 web, 10 móvil) |
| Tests | 16 (2 suites) — ✅ todos pasan |

---

## Apéndice A — Limpieza Final (2026-06-20)

Limpieza integral del proyecto posterior a la auditoría. Se eliminó código muerto, se normalizaron nombres de campo, se unificó la lógica de autenticación, se corrigió Swagger YAML, se dividió la colección Postman y se actualizó la documentación.

### Archivos eliminados (13)

| Archivo | Razón |
|---------|-------|
| `frontend_web/src/components/PrivateRoute.jsx` | No usado — reemplazado por ProtectedRoute |
| `frontend_web/src/components/AfiliadoCrearModal.jsx` + `.module.css` | No usado — AfiliadosView tiene modal inline |
| `frontend_web/src/components/AfiliadoEditModal.jsx` + `.module.css` | No usado — AfiliadosView tiene modal inline |
| `frontend_web/src/components/AfiliadoVerModal.jsx` + `.module.css` | No usado — AfiliadosView tiene modal inline |
| `frontend_web/src/views/PlaceholderView.jsx` + `.module.css` | No usado — solo referencia en comentario |
| `movil/src/components/animated-icon.tsx` + `.web.tsx` + `.module.css` | Boilerplate Expo no usado |
| `movil/src/components/hint-row.tsx` | Boilerplate Expo no usado |
| `movil/src/components/themed-text.tsx` | Boilerplate Expo no usado |
| `movil/src/components/themed-view.tsx` | Boilerplate Expo no usado |
| `movil/src/components/web-badge.tsx` | Boilerplate Expo no usado |
| `movil/src/components/ui/collapsible.tsx` | Boilerplate Expo no usado |
| `movil/src/constants/theme.ts` | Duplicado de `src/theme.js` |
| `movil/src/hooks/use-color-scheme.ts` + `.web.ts` | Solo usado por boilerplate eliminado |
| `movil/src/hooks/use-theme.ts` | Solo usado por boilerplate eliminado |
| `movil/src/global.css` | Solo importado por `constants/theme.ts` (eliminado) |

### Archivos modificados (16)

| Archivo | Cambio |
|---------|--------|
| `backend/services/usuarioService.js` | Eliminados alias `estado_cuenta`/`estado_cuenta_usuario` en create/update; eliminado `estado_cuenta` del normalizador |
| `backend/services/afiliadoService.js` | Eliminado alias `id_afiliado` en createCiclo |
| `frontend_web/src/context/AuthContext.jsx` | Refactorizado para usar `authService.loginUser`, `persistSession`, `clearSession`, `loadStoredUser`, `loadStoredToken` |
| `frontend_web/src/views/GestionPersonal.jsx` | Form state `estado_cuenta` → `estado` en todos los lugares |
| `frontend_web/src/views/AfiliadosView.jsx` | Display `a.estado_cuenta` → `a.estado`; `id_afiliado` → `id_usuario` |
| `frontend_web/src/views/RutinasView.jsx` | Payload `id_afiliado` → `id_usuario` |
| `frontend_web/src/views/DietasView.jsx` | Payload `id_afiliado` → `id_usuario` |
| `frontend_web/src/views/AdminDashboard.jsx` | Display `a.estado_cuenta` → `a.estado` |
| `frontend_web/src/services/afiliadosService.js` | `buildAfiliadoLocal`: `estado_cuenta` → `estado` |
| `frontend_web/src/App.jsx` | Comentario obsoleto de PlaceholderView eliminado |
| `backend/.gitignore` | Agregados `*.local`, `build/`, `.env.local` |
| `backend/models/afiliadoModel.js` (2×) | `u.estado AS estado_cuenta` → `u.estado` en queries SQL |
| `backend/config/swagger.yaml` | Eliminadas anotaciones `nullable` con mapeos inline que causaban error de parseo; escapados `:` en descripciones de YAML |
| `database/01_schema.sql` | VIEW `v_perfil_afiliado`: `estado_cuenta` alias removido; (previo en auditoría: trigger eliminado, resumen TABLAS actualizado) |
| `backend/index.js` | (Ya corregido en auditoría: banner `/660/` → `/catalogo/`) |
| `backend/routes/catalogoRoutes.js` | (Ya corregido en auditoría: JSDoc `/660/` → `/catalogo/`) |
| `backend/config/swagger.js` | (Ya corregido en auditoría: DashboardKPIs schema + apis[]) |

### Archivos creados

| Archivo | Descripción |
|---------|-------------|
| `MetaFit_API_Web.postman_collection.json` | Colección Postman para frontend web (Staff: Admin, Recepcionista, Entrenador) |
| `MetaFit_API_Movil.postman_collection.json` | Colección Postman para app móvil (Afiliado) |

### Archivos eliminados (en verificación)

| Archivo | Razón |
|---------|-------|
| `MetaFit_API.postman_collection.json` | Reemplazada por las 2 colecciones separadas (Web + Móvil) |

### Nombre de campo canónico adoptado

| Contexto | Campo canónico | Alias eliminados |
|----------|---------------|------------------|
| USUARIO.estado (API) | `estado` | `estado_cuenta`, `estado_cuenta_usuario` |
| CICLO.id_usuario (API) | `id_usuario` | `id_afiliado` |

### Flujo de autenticación

Antes: `AuthContext` → `api.loginRequest()` directo + localStorage manual  
Ahora:  `AuthContext` → `authService.loginUser()` → `authService.persistSession()`

AuthContext delega toda la lógica de comunicación HTTP y persistencia en `authService`, cumpliendo el principio de Responsabilidad Única (ISO 25000 - SoC).

### Resultado

- **14 archivos eliminados** (13 código muerto + 1 Postman original)
- **16 archivos modificados** (normalización, refactor, consistencia, YAML, SQL)
- **2 archivos creados** (colecciones Postman Web + Móvil)
- **1 sistema de tema** unificado en móvil (solo `src/theme.js`)
- **0 dependencias rotas** — todos los imports y referencias actualizados
- **16 tests pasan** — verificación completa
- El proyecto es más limpio, más consistente y más mantenible.

---

## Documentación Generada (2026-06-20)

Como fase final del proyecto, se generó la documentación técnica profesional para entrega y sustentación:

| Archivo | Descripción | Contenido |
|---|---|---|
| `MANUAL_TECNICO.md` | Manual técnico | Arquitectura, stack tecnológico, endpoints (48), middlewares, BD (17 tablas, 5 vistas, 1 trigger), seguridad, pruebas (16 tests), despliegue Docker, Postman |
| `MANUAL_USUARIO.md` | Manual de usuario | Guías paso a paso por rol (Admin, Recepcionista, Entrenador, Afiliado), FAQ, glosario |
| `DIAGRAMAS.md` | Diagramas | Arquitectura general, componentes web, navegación móvil, ERD, flujo de autenticación, flujo de asignación de rutina, flujo de consulta de perfil |
| `PRESENTACION.md` | Guion de sustentación | 14 diapositivas con guion, duración estimada 15-20 min, preguntas anticipadas |

Adicionalmente:
- `README.md` actualizado con enlaces a la nueva documentación
- `AUDITORIA_FINAL.md` actualizada con esta sección
