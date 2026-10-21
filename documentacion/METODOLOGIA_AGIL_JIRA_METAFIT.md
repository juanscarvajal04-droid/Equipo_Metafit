# Metodología Ágil y Historias de Usuario — MetaFit

**Fecha de elaboración:** 2026-10-08
**Rama de trabajo:** `feature/sofia-astudillo` (HEAD `763a088`)
**Fuentes:** la auditoría de coherencia HU↔código **consolidada en el Anexo B** de este documento (`auditoria_coherencia_hu.md`, retirado), `.github/workflows/ci.yml`, historial de `git` del repositorio y los informes del equipo sobre Jira, **consolidados en el Anexo A** (los informes originales `INFORME_JIRA_METAFIT.md` e `INFORME_AUDITORIA_JIRA_EXCEL_MOVIL.md` fueron unificados aquí y retirados para evitar redundancia).

> **Criterio de veracidad.** Todo dato marcado como **[git]** o **[archivo]** fue comprobado en esta sesión contra el repositorio. Todo dato marcado como **[informe]** proviene de documentos redactados por el equipo y **no** pudo re-comprobarse contra la instancia externa (Jira/Excel/Render) desde este repositorio. Lo no verificable se señala explícitamente en la sección 8.

---

## 1. Metodología aplicada

### 1.1 Marco declarado

Según el informe del equipo **[informe]** (ver Anexo A), el equipo organizó el trabajo bajo un esquema **Scrum con tablero Kanban** en Jira (proyecto `METAFIT`, tablero 67 "MetaFit Kanban", tipo scrum), con:

| Elemento | Valor declarado | Fuente |
|---|---|---|
| Épicas | 5 (METAFIT-1, -2, -3, -4, -96) | Anexo A **[informe]** |
| Historias de usuario | 29 (13 móviles en sprints + 16 web en Backlog) | Anexo A **[informe]** |
| Tareas / subtareas | 78 / 237 (349 incidencias totales) | Anexo A **[informe]** |
| Sprints | 5 (Sprint 0–4), 28/07/2026 → 01/09/2026 | Anexo A **[informe]** |
| Subtareas canónicas por HU móvil | 5: Backend, Frontend, Tabla de datos, Pruebas, Despliegue | Anexo A **[informe]** |

En una segunda fase, el informe del equipo **[informe]** (Anexo A.7) reporta **17 HUs móviles** auditadas (HU01, HU02, HU14, HU17, HU21, HU24, HU43, HU48, HU59–HU67) con sus claves Jira (`METAFIT-6`, `-267`, `-7`, `-269`, `-268`, `-10`, `-8`, `-9`, `-270` … `-368`).

### 1.2 Ciclo de trabajo observado

1. **Planeación (Sprint 0):** 13 tareas de configuración (Jira, GitHub, estrategia Git, entorno, Postman, BD, despliegue) con responsable por tarea — Anexo A.4 **[informe]**.
2. **Desarrollo por ramas `feature/<nombre>`** — una rama por integrante, verificado en `git branch -r` **[git]** (sección 3).
3. **Integración por fusiones directas y Pull Requests** — ver `git log --merges`: PRs `#1`, `#2`, `#6`, `#7`, `#8`, `#9` registrados **[git]**.
4. **Auditoría de coherencia HU↔código** (2026-08-27) — `Anexo B` **[archivo]**.
5. **Cierre de brechas** — commit `2ca91a8` (2026-08-29) "fix: cerrar brechas HU" modifica 14 archivos (backend + móvil + documentación) **[git]**.
6. **Verificación/CI** — `.github/workflows/ci.yml` **[archivo]** (sección 6).

### 1.3 Estimación y métricas ágiles

No existen **[git]** ni **[archivo]** story points, velocidades ni burndowns en el repositorio. Las únicas cifras de carga son las "carga final" por integrante registradas en el informe del equipo **[informe]** (Anexo A.5; Carvajal 98, Sofía 99, Carlos 53, Isabella 54, Robayo 45), cuyo origen es el conteo de incidencias de Jira y no un dato del repositorio. **No se reportan porcentajes de avance derivados de esas cifras por no ser verificables aquí.**

---

## 2. Roles del equipo

### 2.1 Roles funcionales del sistema (ENUM de la aplicación)

La columna `USUARIO.rol` admite `Administrador`, `Recepcionista`, `Entrenador`, `Afiliado` (verificado por los middlewares de `backend/routes/*.js` **[git]**: `requireAdmin`, `requireAdminOrRecepcionista`, `requireAdminOrEntrenador`, `requireStaff`, `requireAuth`).

### 2.2 Roles de las personas (equipo)

| Persona | Identidad en git | Rama propia | Módulo Jira | Fuente |
|---|---|---|---|---|
| Juan Sebastián Carvajal | `juanscarvajal04-droid`, `Sebas07$` (mismo correo) | `feature/juan-carvajal` | MOD1 — Gestión de Afiliados (METAFIT-1) | **[git]** `git shortlog`, **[informe]** Anexo A.5 |
| Sofía Astudillo | `Sofia`, `sofiaastudilo` (`sofiaastudillo458@gmail.com`) | `feature/sofia-astudillo` | MOD2 — Gestión de Rutinas (METAFIT-2) | **[git]**, **[informe]** Anexo A.5 |
| Isabella Caldas | `isabella198913` | `feature/isabella-caldas` | MOD4 — Gestión de Progreso (METAFIT-4) | **[git]**, **[informe]** Anexo A.5 |
| Carlos Rodríguez | `Carlos12-gif` | `feature/carlos-rodriguez` | MOD5 — Infraestructura (METAFIT-96) | **[git]**, **[informe]** Anexo A.5 |
| Sebastián Robayo | `sebastianrobayo1109-droid` | sin rama propia (usa `feature/kevin-garcia`) | MOD3 — Planes de Nutrición (METAFIT-3) | **[git]**, **[informe]** Anexo A.5 |

Roles de proceso asignados en Sprint 0 **[informe]** (Anexo A.4): configuración de Jira (Isabella), GitHub (Robayo), estrategia Git Flow (Carvajal), entorno de desarrollo (Sofía), Postman y Product Backlog (Carvajal), base de datos (Sofía), despliegue inicial (Robayo).

---

## 3. Organización del trabajo entre ramas de git

### 3.1 Ramas existentes **[git]**

| Rama | Último commit | Fecha | Autor principal (últimos 20) |
|---|---|---|---|
| `origin/main` | `e11916b` | 2026-09-29 | isabella198913 / juanscarvajal04-droid |
| `origin/develop` | `6da5263` | 2026-05-31 | juanscarvajal04-droid |
| `origin/feature/juan-carvajal` | `docs` | 2026-09-17 | juanscarvajal04-droid (170 commits) |
| `origin/feature/sofia-astudillo` (= HEAD local) | `763a088` | 2026-09-19 | Sofia / juanscarvajal04-droid |
| `origin/feature/isabella-caldas` | `Add files via upload` | 2026-09-22 | isabella198913 |
| `origin/feature/carlos-rodriguez` | `guía de estudio completa…` | 2026-09-08 | Sofia (168 de los commits son de juanscarvajal04-droid) |
| `origin/feature/kevin-garcia` | `no` | 2026-06-30 | juanscarvajal04-droid / sebastianrobayo1109-droid |
| `origin/feature/n8n-integration` | `Agregar n8n: Telegram…` | 2026-08-20 | juanscarvajal04-droid |
| `origin/juanscarvajal04-droid-patch-1` | `Create asynt storague` | 2026-07-15 | Sebas07$ |

### 3.2 Patrón de trabajo observado **[git]**

- Cada integrante concentra su trabajo en `feature/<nombre-apellido>`.
- La integración se hace con **fusiones de rama en rama**, no exclusivamente vía PR: `0ce019e`, `8d10b11`, `bcb4f5e`, `8733dce` fusionan `feature/juan-carvajal` hacia `feature/sofia-astudillo`; `a32ea1c` y `7bced8f` fusionan `origin/main` hacia `feature/juan-carvajal`.
- Los Pull Requests registrados en el historial son `#1`, `#2` (ramas patch de `sofiaastudilo`), `#6`, `#8`, `#9` (desde `feature/juan-carvajal`) y `#7` (desde `feature/sofia-astudillo`): **6 PRs visibles**; los números `#3`–`#5` no aparecen en el historial **[git]** (no verificable si fueron cerrados sin fusión).

---

## 4. Historias de usuario (HU1–HU10)

Base: sección "PARTE 5 — AUDITORÍA HU POR HU" de `Anexo B`. Los **criterios de aceptación** provienen de la columna "Criterio" de ese documento; los **estados** se re-verificaron contra el código actual, porque la auditoría (2026-08-27, rama `feature/juan-carvajal`) quedó desactualizada por el commit `2ca91a8` (2026-08-29).

| ID | Título | Rol principal | Estado actual |
|---|---|---|---|
| HU1 | Login y Autenticación | Todos los roles | Implementada totalmente |
| HU2 | CRUD de Afiliados (web staff) | Administrador, Recepcionista | Implementada totalmente |
| HU3 | Gestión de Ciclos | Administrador, Entrenador | Implementada totalmente (ver nota) |
| HU4 | Plan de Entrenamiento | Entrenador | Implementada totalmente |
| HU5 | Plan Nutricional | Entrenador | Implementada totalmente |
| HU6 | Seguimiento Diario (app móvil) | Afiliado | Implementada (historiales añadidos tras la auditoría) |
| HU7 | Progreso Físico | Entrenador/Administrador (registro), Afiliado (consulta) | Implementada totalmente |
| HU8 | Pagos y Membresías | Administrador, Recepcionista | Implementada totalmente |
| HU9 | Dashboard y Notificaciones | Administrador | Implementada totalmente |
| HU10 | Catálogos (Ejercicios, Alimentos, Restricciones) | Entrenador, Administrador | Implementada (ver divergencia de permisos) |

### HU1 — Login y Autenticación

- **Rol:** Administrador, Recepcionista, Entrenador, Afiliado.
- **Criterios de aceptación** (`Anexo B`):
  - Login con correo y contraseña.
  - Token JWT con vigencia de 8 horas.
  - Los cuatro roles se distinguen por `USUARIO.rol` (ENUM).
  - Login funcional en la app móvil y en la web.
- **Estado real:** implementada totalmente **[archivo]/[git]**.
- **Evidencia:**
  - Endpoint: `POST /login` en `backend/routes/authRoutes.js:82`; recuperación en `backend/routes/authRoutes.js` (`/auth/recuperar-password`, `/auth/reset-password`).
  - Pantallas web: `frontend_web/src/views/Login.jsx`, `RecuperarPassword.jsx`, `ResetPassword.jsx` (registradas en `frontend_web/src/App.jsx:9-12`).
  - Pantallas móviles: `movil/src/screens/LoginScreen.js`, `RecuperarPasswordScreen.js`.

### HU2 — CRUD de Afiliados (web staff)

- **Rol:** Administrador y Recepcionista (creación/edición); Administrador (eliminación); cualquier staff en lectura.
- **Criterios de aceptación** (`Anexo B`):
  - Listar afiliados; crear; editar; eliminar.
  - Subir foto de perfil.
  - Consultar el perfil propio desde el móvil.
- **Estado real:** implementada totalmente **[git]**.
- **Evidencia:**
  - Endpoints: `GET /afiliados` (`backend/routes/afiliadoRoutes.js:60`, `requireStaff`), `POST /afiliados` (`:495`, `requireAdminOrRecepcionista`), `PATCH /afiliados/:id` (`:530`), `DELETE /afiliados/:id` (`:565`, `requireAdmin`), `POST /afiliados/:id/foto` (`:651`), `GET /afiliados/me` (`:85`), `PATCH /afiliados/me` (`:152`).
  - Vistas web: `AfiliadosView.jsx`, `GestionPersonal.jsx`.
  - Pantalla móvil: `MiPerfilScreen.js`.

### HU3 — Gestión de Ciclos

- **Rol:** Administrador y Entrenador (creación/cierre); Afiliado (consulta de sus ciclos).
- **Criterios de aceptación** (`Anexo B`):
  - Crear ciclo con objetivo y fechas.
  - Consultar ciclo activo y todos los ciclos del afiliado.
  - Cierre automático del ciclo anterior (`activo = 0`).
  - Validación de solapamiento de fechas.
  - Ver planes de ciclos anteriores desde el móvil.
- **Estado real:** implementada totalmente **[git]**.
  - **Nota de discrepancia:** la auditoría marcó "Ver planes de ciclos anteriores" como ❌ (`Anexo B`), pero el commit `2ca91a8` (2026-08-29) añadió el selector de ciclo a `MiRutinaScreen.js` y `MiDietaScreen.js`; el código actual lo confirma (`movil/src/screens/MiRutinaScreen.js:6,325`: "Incluye selector de ciclo si hay varios"). Ver sección 8.
- **Evidencia:**
  - Endpoints: `POST /afiliados/ciclos` (`backend/routes/afiliadoRoutes.js:764`, `requireAdminOrEntrenador`), `GET /afiliados/me/ciclos` (`:176`), `GET /afiliados/:id/ciclos` (`:682`), `PATCH /afiliados/ciclos/:id_ciclo`, `DELETE` (middlewares `requireAdminOrEntrenador` / `requireAdmin`).
  - Pantallas móviles: `MiRutinaScreen.js`, `MiPerfilScreen.js` (sección "Historial de Ciclos").

### HU4 — Plan de Entrenamiento

- **Rol:** Entrenador (y Administrador) en edición; Afiliado en consulta.
- **Criterios de aceptación** (`Anexo B`):
  - Crear plan de entrenamiento y rutinas por día.
  - Agregar ejercicios a una rutina con series, repeticiones y peso.
  - Consultar el plan desde el móvil.
  - Marcar ejercicios completados.
- **Estado real:** implementada totalmente **[git]**.
- **Evidencia:**
  - Endpoints: `POST /planes/entrenamiento` (`backend/routes/planRoutes.js:174`, `requireAdminOrEntrenador`), `POST /planes/rutinas`, `POST /planes/rutinas/:id/ejercicios`, `GET /planes/entrenamiento/:id_ciclo` (`planRoutes.js:77`, `requireOwnCiclo`), `GET /planes/entrenamiento/:id_ciclo/rutina/:dia_numero` (`:129`), `POST /afiliados/me/progreso-ejercicio` (`afiliadoRoutes.js`).
  - Vistas web: `RutinasView.jsx`.
  - Pantallas móviles: `MiRutinaScreen.js`, `RegistroEjercicioScreen.jsx`.

### HU5 — Plan Nutricional

- **Rol:** Entrenador (y Administrador) en edición; Afiliado en consulta.
- **Criterios de aceptación** (`Anexo B`):
  - Crear plan nutricional con calorías objetivo y número de comidas.
  - Agregar alimentos al detalle con macros.
  - Consultar el plan desde el móvil.
  - Marcar alimentos consumidos.
- **Estado real:** implementada totalmente; el bug crítico que borraba el detalle al actualizar (`planController.js:158`) fue corregido **[archivo]** (`Anexo B`).
- **Evidencia:**
  - Endpoints: `POST /planes/nutricional` (`backend/routes/planRoutes.js:468`), `POST /planes/nutricional/:id/detalle` (`:517`), `GET /planes/nutricional/:id_ciclo` (`:428`), `PATCH /planes/nutricional/:id`, `POST /afiliados/me/consumo-alimento` (`afiliadoRoutes.js`).
  - Vistas web: `DietasView.jsx`.
  - Pantallas móviles: `MiDietaScreen.js`, `RegistroConsumoScreen.jsx`.

### HU6 — Seguimiento Diario (app móvil)

- **Rol:** Afiliado.
- **Criterios de aceptación** (`Anexo B`):
  - Registrar y consultar consumo de agua.
  - Registrar y consultar progreso de ejercicios del día.
  - Registrar consumo de alimentos.
  - Historiales de agua y de consumo de alimentos (varios días).
- **Estado real:** implementada; los dos criterios de historial marcados ❌ en la auditoría fueron implementados después **[git]**:
  - `GET /afiliados/me/agua/historial`, `GET /afiliados/me/consumo/historial`, `GET /afiliados/me/progreso-ejercicio/historial` agregados en `backend/routes/afiliadoRoutes.js` por `2ca91a8`.
  - Además existen rutas de registro "real" con historial: `GET /me/registro-ejercicio/historial` (`afiliadoRoutes.js:347`) y `GET /me/consumo-alimento-real/historial` (`afiliadoRoutes.js:425`).
- **Evidencia:**
  - Endpoints: `POST /afiliados/me/agua`, `GET /afiliados/me/agua/:fecha`, `POST /afiliados/me/consumo-alimento`, `POST /afiliados/me/progreso-ejercicio`, `GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha`.
  - Pantallas móviles: `MiDietaScreen.js`, `MiRutinaScreen.js`, `MiProgresoScreen.js` (importa `getAguaHistorial`, `getConsumoHistorial`, `getProgresoEjercicioHistorial`, `movil/src/screens/MiProgresoScreen.js:30-31`).

### HU7 — Progreso Físico

- **Rol:** Entrenador/Administrador registra; Afiliado consulta.
- **Criterios de aceptación** (`Anexo B`):
  - Registrar medición desde el staff.
  - Ver historial desde el móvil.
  - IMC calculado en el backend.
- **Estado real:** implementada totalmente; bug de validación `peso` vs `peso_kg` corregido **[archivo]** (`Anexo B`).
- **Evidencia:**
  - Endpoints: `POST /afiliados/progreso` (`requireAdminOrEntrenador`), `GET /afiliados/me/progreso` (`afiliadoRoutes.js:194`), `GET /afiliados/:id/progreso` (`requireStaff`).
  - Vistas web: `ProgresoAfiliado.jsx`.
  - Pantalla móvil: `MiProgresoScreen.js`.

### HU8 — Pagos y Membresías

- **Rol:** Administrador y Recepcionista (registro); Administrador (métricas y configuración).
- **Criterios de aceptación** (`Anexo B`):
  - Registrar pago; ver historial de pagos del afiliado.
  - Métricas para administración.
  - Precio de membresía configurable.
  - Recordatorio automático de pagos vencidos.
- **Estado real:** implementada totalmente; el registro de `registrado_por` fue corregido en `2ca91a8` **[git]** (`pagoController.js`).
- **Evidencia:**
  - Endpoints: `POST /afiliados/:id/pagos` (`backend/routes/pagoRoutes.js:22`, `requireAdminOrRecepcionista`), `GET /afiliados/:id/pagos` (`:19`), `GET /pagos/metricas` (`pagoAdminRoutes.js:19`), `GET/PUT /configuracion/precio-membresia` (`configuracionRoutes.js:9-10`).
  - Cron: `backend/cron/recordatorioPagos.js` (citado en `Anexo B`).
  - Vistas web: `PagosView.jsx`, `FinanzasView.jsx`.

### HU9 — Dashboard y Notificaciones

- **Rol:** Administrador (KPIs); todos los roles reciben notificaciones.
- **Criterios de aceptación** (`Anexo B`):
  - KPIs del gimnasio.
  - Notificaciones según rol.
  - Gráficas de distribución calculadas en el frontend.
- **Estado real:** implementada totalmente **[git]**.
- **Evidencia:**
  - Endpoints: `GET /dashboard/kpis` (`backend/routes/dashboardRoutes.js:46`, `requireAdmin`), `GET /notificaciones` (`notificacionRoutes.js`, `requireAuth`).
  - Vistas web: `AdminDashboard.jsx`, `Dashboard.jsx` (este último marcado como legacy en `Anexo B`).

### HU10 — Catálogos (Ejercicios, Alimentos, Restricciones)

- **Rol:** Entrenador y Administrador (ejercicios y alimentos); Administrador (restricciones, según HEAD).
- **Criterios de aceptación** (`Anexo B`):
  - CRUD de ejercicios y de alimentos.
  - Catálogo de restricciones médicas.
  - Ejercicios y alimentos filtrados por las restricciones del afiliado.
- **Estado real:** implementada; **divergencia de permisos** entre ramas (sección 8).
- **Evidencia:**
  - Endpoints: `GET/POST/PUT/DELETE /catalogo/ejercicios` (`backend/routes/catalogoRoutes.js:54,94-96`, `requireAdminOrEntrenador`), `GET/POST/PUT/DELETE /catalogo/alimentos` (`:133,171-173`), `GET /catalogo/restricciones` (`:197`), escritura de restricciones `requireAdmin` (`:237,283,315`), `GET /afiliados/:id/ejercicios-disponibles` y `/alimentos-disponibles` (`afiliadoRoutes.js`).
  - Vistas web: `RestriccionesAdmin.jsx`, `RutinasView.jsx`, `DietasView.jsx`.
  - Pantalla móvil: `MiPerfilScreen.js` / consulta de restricciones.

---

## 5. Mapeo del trabajo a ramas git y a Jira

### 5.1 Módulo → Épica Jira → Rama → Responsable

| Módulo | Épica Jira | Responsable **[informe]** | Rama git **[git]** |
|---|---|---|---|
| MOD1 Gestión de Afiliados | METAFIT-1 | sebastian carvajal | `feature/juan-carvajal` |
| MOD2 Gestión de Rutinas | METAFIT-2 | Sofia Astudillo | `feature/sofia-astudillo` |
| MOD3 Planes de Nutrición | METAFIT-3 | Sebastian Robayo | sin rama propia |
| MOD4 Gestión de Progreso | METAFIT-4 | isabella caldas | `feature/isabella-caldas` |
| MOD5 Infraestructura | METAFIT-96 | CARLOS RODRIGUEZ | `feature/carlos-rodriguez` |

### 5.2 Dos numeraciones de HU coexistentes

| Numeración | Alcance | Fuente | Verificable en git |
|---|---|---|---|
| HU1–HU10 (funcionales) | 10 grupos funcionales web + móvil | `Anexo B` | Sí: cada HU se contrasta con endpoints y vistas **[git]** |
| `MOD0x-HUxx` (Jira) | 17 HUs móviles + 16 HUs web | Anexo A.3 y A.7 | No: las claves `METAFIT-nn` solo existen en el informe del equipo **[informe]** |

No existe en el repositorio un documento que cruce HU1–HU10 con las claves `METAFIT-nn`: ese vínculo **no es verificable** con la información disponible.

### 5.3 Evidencia de uso de Jira

- El informe del equipo (2026-08-09) describe operaciones vía API REST con respuestas HTTP (200/204/403/404) y lista scripts de ejecución en `%TEMP%\opencode\` (`jira_final_audit.py`, etc.; Anexo A.6 y A.8). **Esos scripts y los snapshots `jira_preaudit.json` / `jira_current.json` no están en el repositorio: no verificables.**
- El informe del equipo (2026-09-02) reporta la edición de descripciones vía `PUT /rest/api/3/issue/{key}`. Los archivos Excel citados **sí** existen: `exceldoc/ESTRATEGIA DE REQUISITOS - METAFIT.xlsx` y `exceldoc/ESTRATEGIA REQUISITOS.xlsx` **[archivo]**, pero su contenido no fue verificado en esta sesión.
- Evidencia indirecta en git: commit `157b8de` "Correción Jira" (Sofia, 2026-08-10) **[git]**.
- **Conclusión de precisión:** el uso de Jira está documentado por los propios informes del equipo y por un commit con "Jira" en el mensaje; **no hay configuración, export ni token de Jira dentro del repositorio**, por lo que la afirmación "se usó Jira" se reporta como **histórica/informada, no verificable de forma independiente desde el repositorio**.

---

## 6. Planificación y despliegue: canalización CI/CD

Definida en `.github/workflows/ci.yml` (74 líneas) **[archivo]**, nombre `CI/CD`.

### 6.1 Disparadores (líneas 6-10)

| Evento | Ramas | Efecto |
|---|---|---|
| `push` | `main`, `feature/juan-carvajal` | Ejecuta job `ci` |
| `pull_request` | hacia `main` | Ejecuta job `ci` |
| `push` a cualquier otra rama (p. ej. `feature/sofia-astudillo`) | — | **No dispara nada** |

### 6.2 Job `ci` (líneas 13-46)

| Paso | Detalle |
|---|---|
| Checkout | `actions/checkout@v4` |
| Node | `actions/setup-node@v4`, Node **20**, caché npm con `cache-dependency-path` de `backend/`, `frontend_web/` y `movil/package-lock.json` (líneas 20-28) |
| Backend | `working-directory: backend` → `npm ci` + `npm test` (líneas 30-34); script `jest --runInBand --forceExit` (`backend/package.json:9`) |
| Frontend web | `working-directory: frontend_web` → `npm ci` + `npm test` + `npm run build` (líneas 36-41); script `vitest run` (`frontend_web/package.json:11`) |
| Móvil | `working-directory: movil` → `npm ci` + `npm test` (líneas 43-47); script `jest` (`movil/package.json:57`) |

### 6.3 Job `deploy` (CD, líneas 49-74)

- Condición: `if: github.ref == 'refs/heads/main'` (línea 51) y `needs: ci` (línea 52): solo tras pasar los tests y solo en `main`.
- Despliegue del **backend** a Render Web Service: `POST https://api.render.com/v1/services/srv-d9ieq2rtqb8s738q2180/deploys` con `Authorization: Bearer $RENDER_API_TOKEN` (líneas 58-65).
- Despliegue del **frontend** a Render Static Site: `POST .../services/srv-d9kbkdm1egvs7385ofu0/deploys` (líneas 67-74).
- Segreto requerido: `RENDER_API_TOKEN` (líneas 60, 69). Su existencia como secreto de GitHub **no es verificable** desde el repositorio.

### 6.4 Implicación para la planificación

La canalización obliga a que el flujo de entrega sea `feature/*` → (PR a `main`) → `main` → Render. Cualquier trabajo que no llegue a `main` **no se despliega**, y cualquier push a una rama distinta de `main` y `feature/juan-carvajal` **ni siquiera corre los tests**.

---

## 7. Indicadores de avance verificables

Todos medidos en esta sesión contra el árbol de trabajo actual **[git]**. No se reportan porcentajes.

| Indicador | Valor | Cómo se verificó |
|---|---|---|
| Archivos de prueba | **103** (backend 34, frontend_web 15, movil 54) | Conteo de `*.test.js`, `*.test.jsx`, `*.spec.js` en las tres carpetas |
| Scripts de test configurados | 3 de 3 paquetes (`backend/package.json:9`, `frontend_web/package.json:11`, `movil/package.json:57`) | Lectura de `package.json` |
| Acciones de ruta registradas en backend | **91** (`router.get/post/put/patch/delete`) en 12 archivos de `backend/routes/` | Conteo por expresión regular |
| Combinaciones método+ruta únicas | **84** | Conteo de `MÉTODO /path` únicos |
| Vistas web | **14** `.jsx` en `frontend_web/src/views/` | Conteo de archivos + registro en `frontend_web/src/App.jsx:9-21` |
| Pantallas móviles | **10** en `movil/src/screens/` | Conteo de archivos |
| Historias de usuario auditadas | **10/10** con estado definido | `Anexo B` + re-verificación de código |
| HU con todos los criterios marcados cumplidos tras la re-verificación | **10/10** (la auditoría original marcaba 8/10 parciales; HU3 y HU6 quedaron cerradas en `2ca91a8`) | Contraste auditoría vs. código actual |
| Commits totales | HEAD `feature/sofia-astudillo`: **254**; `origin/develop`: **65**; `origin/main`: **289** | `git rev-list --count` |
| Pull Requests fusionados visibles | **6** (`#1`, `#2`, `#6`, `#7`, `#8`, `#9`) | `git log --grep='Merge pull request'` |
| Commits que cierran brechas HU | `2ca91a8` (14 archivos, +462/-18) | `git show --stat` |
| Bug críticos corregidos reportados | 2 (`planController.js:158`, `afiliadoService.js:120`) | `Anexo B` **[archivo]** |

**No verificado en esta sesión:** la ejecución real de `npm test` en las tres carpetas (no se corrió la canalización); el estado de los despliegues en Render; el estado de las incidencias en Jira.

---

## 8. Discrepancias y límites de verificación

1. **Auditoría vs. código actual.** `Anexo B` (2026-08-27) reporta "Historial de ciclos anteriores ❌" (`:149`) e "Historial de agua/consumo ❌" (`:183-184`); el commit `2ca91a8` (2026-08-29) los implementó. **La auditoría quedó desactualizada.**
2. **Conteos de la auditoría vs. medición actual:** la auditoría declara 63 endpoints, 6 pantallas móviles y 9 vistas web (`Anexo B`); hoy hay 91 acciones de ruta (84 únicas), 10 pantallas móviles y 14 vistas. Ambas cifras son correctas **para su fecha**.
3. **Permisos de restricciones entre ramas:** en HEAD, `POST/PUT/DELETE /catalogo/restricciones` exige `requireAdmin` (`backend/routes/catalogoRoutes.js:237,283,315`); en `origin/main` el mismo camino usa `requireStaff` (commit `66c55de` "Restricciones: CRUD disponible para todo el staff"). Al fusiónar, prevalecerá una de las dos.
4. **Jira:** ver sólo por informes del equipo y por el commit `157b8de`; no hay artefactos de Jira en el repositorio (los scripts citados en el Anexo A.8 no están versionados).
5. **Story points y velocidades:** no existen en el repositorio; las "cargas" del informe son conteos de incidencias de Jira, no métricas de velocidad verificables.
6. **Identidades duplicadas:** `juanscarvajal04-droid` y `Sebas07$` comparten correo; el commit de "Kevin Garcia" usa el correo de `sebastianrobayo1109-droid`. La asignación persona↔rama se dedujo por autoría predominante, no por configuración del repositorio.
7. **Estado de las pruebas:** solo se contó que existen 103 archivos de prueba; **no se ejecutaron** en esta sesión, por lo que "los tests pasan" queda como no verificado.

---

## Anexo A — Detalle consolidado del tablero Jira (informado)

> **Origen:** este anexo unifica el contenido de los informes `INFORME_JIRA_METAFIT.md` (2026-08-09) e `INFORME_AUDITORIA_JIRA_EXCEL_MOVIL.md` (2026-09-02), retirados del repositorio para eliminar redundancia. Todo lo aquí contenido es **[informe]**: se re-comprobó contra el repositorio únicamente cuando se indica **[git]/[archivo]**.

### A.1 Reorganización del tablero (ANTES vs DESPUÉS, 2026-08-09)

| Dimensión | ANTES | DESPUÉS |
|---|---|---|
| Incidencias totales | 336 | 349 |
| Sprints | 9 (Sprint 0–8) sin fechas definitivas | 5 (Sprint 0–4), calendario semanal definido |
| Sprint Goals | Sin objetivos definidos | 5 objetivos redactados |
| 13 HUs móviles | Destempladas / sin responsable | Asignadas a Sprint 1–4 con responsable por módulo |
| Subtareas por HU móvil | Mezcladas (esquema antiguo + heredadas) | Exactamente 5 canónicas (Backend, Frontend, Tabla de datos, Pruebas, Despliegue) |
| "Base de datos" | 13 subtareas con nombre incorrecto | 13 renombradas a **"Tabla de datos"** |
| Incidencias duplicadas | 42 sin marcar (93, 94, 102–146, 205–219) | Etiquetadas `duplicada`, listas para borrado |
| Tareas del esquema anterior | 65 tareas obsoletas (26–92) sin clasificar | Etiquetadas `esquema-anterior`, listas para borrado |
| Incidencias web | Sin clasificar | 146 etiquetadas `web` (16 HUs + 130 subtareas), fuera de alcance en Backlog |
| Etiquetas de clasificación | 0 | `web` (146), `esquema-anterior` (237), `duplicada` (42) |

### A.2 Estructura final (349 incidencias)

| Tipo | Cantidad |
|---|---|
| Epic | 5 |
| Historia (HU) | 29 (13 móviles en sprints + 16 web en Backlog) |
| Tarea | 78 (13 Sprint 0 + 65 obsoletas etiquetadas) |
| Subtarea | 237 (65 móviles nuevas + 130 web + 42 duplicadas) |

Estados: 344 "Tareas por hacer", 4 "En curso", 1 "Finalizada". Prioridades: 305 Medium, 44 High.

### A.3 13 HUs móviles × 5 subtareas (validado en Jira)

| HU | Descripción | Sprint | Backend | Frontend | Tabla de datos | Pruebas | Despliegue |
|---|---|---|---|---|---|---|---|
| MOD01-HU01 | Iniciar Sesión | 1 | 275 | 276 | 277 | 278 | 279 |
| MOD01-HU02 | Cerrar Sesión | 2 | 280 | 281 | 282 | 283 | 284 |
| MOD01-HU14 | Consultar Perfil | 3 | 285 | 286 | 287 | 288 | 289 |
| MOD01-HU21 | Consultar Restricciones | 4 | 290 | 291 | 292 | 293 | 294 |
| MOD02-HU17 | Consultar Mis Ciclos | 1 | 295 | 296 | 297 | 298 | 299 |
| MOD02-HU43 | Consultar Rutina Diaria | 2 | 300 | 301 | 302 | 303 | 304 |
| MOD03-HU48 | Consultar Plan Nutricional | 1 | 305 | 306 | 307 | 308 | 309 |
| MOD04-HU24 | Consultar Progreso Físico | 1 | 310 | 311 | 312 | 313 | 314 |
| MOD04-HU59 | Registrar Ejercicios Completados | 2 | 315 | 316 | 317 | 318 | 319 |
| MOD04-HU60 | Consultar Ejercicios Completados | 3 | 320 | 321 | 322 | 323 | 324 |
| MOD04-HU61 | Registrar Consumo de Agua | 4 | 325 | 326 | 327 | 328 | 329 |
| MOD04-HU62 | Consultar Consumo de Agua | 4 | 330 | 331 | 332 | 333 | 334 |
| MOD04-HU63 | Registrar Consumo de Alimentos | 4 | 335 | 336 | 337 | 338 | 339 |

Total: 13 HUs × 5 subtareas = **65** — sin subtareas "Base de datos" (todas renombradas).

### A.4 Calendario de Sprints y tareas del Sprint 0

| Sprint | Inicio | Fin | Sprint Goal | Incidencias |
|---|---|---|---|---|
| Sprint 0 (#149) | 28/07/2026 | 04/08/2026 | Planeación y configuración del proyecto | 13 |
| Sprint 1 (#114) | 04/08/2026 | 11/08/2026 | Inicio del desarrollo móvil y autenticación | 50 |
| Sprint 2 (#148) | 11/08/2026 | 18/08/2026 | Desarrollo de funcionalidades principales | 26 |
| Sprint 3 (#41) | 18/08/2026 | 25/08/2026 | Continuación del desarrollo funcional | 20 |
| Sprint 4 (#45) | 25/08/2026 | 01/09/2026 | Integración de módulos | 24 |

Distribución de HUs móviles: **Sprint 1:** HU01, HU17, HU48, HU24 · **Sprint 2:** HU02, HU43, HU59 · **Sprint 3:** HU14, HU60 · **Sprint 4:** HU21, HU61, HU62, HU63. HU62 y HU63 se movieron del Sprint 5 al Sprint 4. El Sprint 5 (#46) quedó vacío y fue eliminado.

**Tareas del Sprint 0 (13):** configurar Jira (Isabella), GitHub (Robayo), estrategia Git Flow (Carvajal), entorno de desarrollo (Sofía), Postman (Carvajal), Base de Datos (Sofía), despliegue inicial (Robayo); definir Product Backlog (Carvajal), analizar requerimientos (Sofía), organizar Excel de requisitos (Robayo); investigar Scrum (Robayo), Jira (Isabella) y herramientas Notion/Trello/Jira (Robayo).

### A.5 Carga por módulo e integrante (validada)

| Módulo | Épica | Responsable | HUs móviles | Carga final | Rango acordado |
|---|---|---|---|---|---|
| MOD 1 — Gestión de Afiliados | METAFIT-1 | sebastian carvajal | HU01, HU02, HU14, HU21 | 98 | 95–110 ✅ |
| MOD 2 — Gestión de Rutinas | METAFIT-2 | Sofia Astudillo | HU17, HU43 | 99 | 90–105 ✅ |
| MOD 3 — Planes de Nutrición | METAFIT-3 | Sebastian Robayo | HU48 | 45 | 30–45 ✅ |
| MOD 4 — Gestión de Progreso | METAFIT-4 | isabella caldas | HU24, HU59, HU60, HU61, HU62, HU63 | 54 | 45–60 ✅ |
| MOD 5 — Infraestructura | METAFIT-96 | CARLOS RODRIGUEZ | — | 53 | 45–60 ✅ |

### A.6 Operaciones ejecutadas y validaciones

1. Sprints recalendarizados (Sprint 0–4 → 200 OK).
2. HU62 (METAFIT-273) y HU63 (METAFIT-274) movidas del Sprint 5 al Sprint 4 → 204.
3. Sprint 5 (#46) eliminado tras quedar vacío → 204.
4. 13 subtareas renombradas "Base de datos" → "Tabla de datos" (277, 282, 287, 292, 297, 302, 307, 312, 317, 322, 327, 332, 337) → 204 cada una.
5. Etiquetado: `esquema-anterior` (237), `web` (146), `duplicada` (42).
6. Reasignación de responsables por módulo (190 issues) + rebalanceo de carga.

Validaciones finales: 13 HUs × 5 subtareas ✅ · ninguna "Base de datos" restante ✅ · 0 HUs móviles en Backlog ✅ · trazabilidad Épica → HU → Subtarea ✅ · cargas dentro de rangos ✅ · Backlog coherente (5 épicas + 16 HU web + 65 tareas + 130 subtareas web = 216) ✅.

**Pendiente:** borrado de 107 incidencias obsoletas (65 tareas 26–92 + 42 duplicadas). El token de `sebastian carvajal` no tenía permiso `DELETE_ISSUES` (403; `DELETE_ISSUES=false` en `mypermissions`); el rol *Administrators* lo tienen los otros 4 integrantes, por lo que el borrado quedó a su cargo (incidencias ya etiquetadas y clasificadas).

### A.7 Segunda fase — auditoría móvil (2026-09-02)

Se auditaron y actualizaron **17 HUs móviles** en Jira (HU01, HU02, HU14, HU17, HU21, HU24, HU43, HU48, HU59–HU67) mediante `PUT /rest/api/3/issue/{key}`. Claves Jira reportadas: `METAFIT-6`, `-267`, `-7`, `-269`, `-268`, `-10`, `-8`, `-9`, `-270` … `-368`. Los archivos Excel asociados **existen** en el repositorio: `exceldoc/ESTRATEGIA DE REQUISITOS - METAFIT.xlsx` y `exceldoc/ESTRATEGIA REQUISITOS.xlsx` **[archivo]** (contenido no verificado en esta sesión).

### A.8 Evidencia (no versionada)

Snapshots locales citados por el informe: `jira_preaudit.json` y `jira_current.json`. Scripts de ejecución en `%TEMP%\opencode\`: `jira_final_audit.py`, `jira_final_exec.py`, `jira_final_valid.py`, `jira_antes_despues.py`, `jira_sprint_state.py`. **Ninguno de estos artefactos está en el repositorio: no verificables de forma independiente.**


---

## Anexo B — Auditoría de coherencia HU↔código (2026-08-27, consolidada)

> **Origen:** este anexo incorpora el contenido íntegro de `auditoria_coherencia_hu.md`, retirado del repositorio para eliminar redundancia. Es un documento **histórico** (rama `feature/juan-carvajal`, 2026-08-27); las partes superadas por el commit `2ca91a8` (2026-08-29) se señalan en la sección 8 y en las notas HU de la sección 4. Las referencias a "Anexo B" en este documento apuntan aquí.

### Estado (nota de vigencia)

La auditoría original reportaba 21 tablas / 63 endpoints / 6 pantallas móviles / 9 vistas web y 8⁄10 HU completas. Los conteos actuales son 26 tablas, 91 acciones de ruta (84 únicas), 10 pantallas móviles, 14 vistas web y 10⁄10 HU (ver sección 7 y sección 8).

**Fecha:** 2026-08-27  
**Alcance:** Frontend web (React/Vite), App móvil (React Native/Express), Backend (Node.js/Express), BD (MariaDB 11), Postman  
**Rama:** `feature/juan-carvajal`

---

### Resumen Ejecutivo

| Aspecto | Resultado |
|---|---|
| Total tablas BD | 21 (17 core + 4 móviles) |
| Total endpoints backend | 63 API |
| Total pantallas móvil | 6 (Login, Recuperar, Perfil, Rutina, Dieta, Progreso) |
| Total vistas web | 9 (Landing, Login, Dashboard, Afiliados, Rutinas, Dietas, Pagos, Finanzas, Personal) |
| Bugs críticos corregidos | 2 |
| Bugs menores detectados | 4 |
| HU con cumplimiento total | 8/10 |
| HU con cumplimiento parcial | 2/10 |

---

### PARTE 1 — AUDITAR CICLO ACTIVO Y PLAN DE ENTRENAMIENTO

#### 1.1 Pantalla "Mi Rutina" (app móvil)

| Criterio | Estado | Evidencia |
|---|---|---|
| Ciclo activo con fechas de inicio/fin y días restantes | ✅ | `MiRutinaScreen.js:21` usa `seleccionarCicloActivo()` → `GET /afiliados/me/ciclos` → `cicloUtils.js` filtra `activo===1`. Fechas se muestran en header. |
| Plan de entrenamiento con rutinas por día | ✅ | `GET /planes/entrenamiento/{idCiclo}` → `planController.getEntrenamiento` → SQL con `JSON_ARRAYAGG` agrupado por `dia_numero`. Chips horizontales Lunes-Domingo. |
| Ejercicios con series, repeticiones y descripciones | ✅ | `MiRutinaScreen.js:155-161` muestra `series × reps · peso kg · descanso`. Instrucciones vía botón info (`ej.instrucciones`). |
| Checkboxes para marcar ejercicios completados | ✅ | `MiRutinaScreen.js:126` toggle local `completados[id_ejercicio]`, guardado vía `POST /afiliados/me/progreso-ejercicio`. |

#### 1.2 Guardado de progreso diario

| Criterio | Estado | Evidencia |
|---|---|---|
| POST al backend al guardar | ✅ | `guardarProgresoEjercicio(idCiclo, fecha, ejercicios)` → `POST /afiliados/me/progreso-ejercicio` |
| Guardado en tabla de BD | ✅ | `PROGRESO_EJERCICIO_DIARIO` (tabla del migración `04_migracion_app_movil.sql`). SQL: `INSERT ... ON DUPLICATE KEY UPDATE completado`. |
| Reflejado en "Mi Progreso" | ⚠️ | `MiProgresoScreen` muestra solo progreso físico (peso/IMC/grasa). NO muestra ejercicios completados por día. El endpoint `GET /afiliados/me/progreso` solo retorna `PROGRESO_FISICO`, no `PROGRESO_EJERCICIO_DIARIO`. |

#### 1.3 Sin plan asignado

| Criterio | Estado | Evidencia |
|---|---|---|
| Mensaje amigable | ✅ | `MiRutinaScreen.js` línea ~230: `"No tenés un ciclo asignado."` / `MiPerfilScreen.js:304`: `"No tienes un ciclo asignado. Consulta con tu entrenador."` |

---

### PARTE 2 — AUDITAR PLAN NUTRICIONAL Y COMIDAS

#### 2.1 Pantalla "Mi Dieta" (app móvil)

| Criterio | Estado | Evidencia |
|---|---|---|
| Calorías objetivo y número de comidas | ✅ | `GET /planes/nutricional/{idCiclo}` → `planController.getNutricional` → `calorias_objetivo`, `num_comidas`. |
| Lista de comidas agrupadas | ✅ | `MiDietaScreen.js:40` `ComidaCard` agrupa por `num_comida`. Cada card muestra progreso. |
| Alimentos con cantidades y macros | ✅ | Backend retorna `nombre_alimento, cantidad_g, calorias_por_100g, proteinas, carbohidratos, grasas`. UI muestra gramos y kcal. |
| Checkboxes para alimentos consumidos | ✅ | Toggle local `consumidos[id_alimento]`, guardado vía `POST /afiliados/me/consumo-alimento`. |
| Registro de vasos de agua | ✅ | 8 vasos interactivos. Guardado inmediato vía `POST /afiliados/me/agua`. `GET /afiliados/me/agua/{fecha}` carga estado. |

#### 2.2 Guardado de progreso nutricional

| Criterio | Estado | Evidencia |
|---|---|---|
| POST al backend | ✅ | `guardarConsumoAlimento(idCiclo, fecha, alimentos)` → `POST /afiliados/me/consumo-alimento` |
| Guardado en BD | ✅ | `CONSUMO_ALIMENTO_DIARIO` (tabla migración `04_migracion_app_movil.sql`). SQL: `INSERT ... ON DUPLICATE KEY UPDATE consumido`. |
| Agua en BD | ✅ | `REGISTRO_AGUA` (tabla migración). SQL: `INSERT ... ON DUPLICATE KEY UPDATE vasos`. |

---

### PARTE 3 — AUDITAR CICLOS ANTERIORES

#### 3.1 Visualización de ciclos anteriores

| Criterio | Estado | Evidencia |
|---|---|---|
| Ciclos anteriores visibles | ✅ | `MiPerfilScreen.js:310-325` sección "Historial de Ciclos" muestra todos los no-activos. |
| Planes de ciclos pasados | ❌ | **No hay navegación para ver planes históricos.** `MiRutinaScreen` y `MiDietaScreen` usan `seleccionarCicloActivo()` que solo selecciona el ciclo `activo===1`. No hay selector de ciclo. |
| Diferenciación visual activo/inactivo | ✅ | `MiPerfilScreen.js:300` muestra `"Activo"` o `"Inactivo"`. Ciclos historial se listan aparte con fecha rango. |

#### 3.2 Endpoint /afiliados/me/ciclos

| Criterio | Estado | Evidencia |
|---|---|---|
| Devuelve todos los ciclos | ✅ | `cicloModel.findByAfiliado`: `SELECT c.* ... WHERE c.id_usuario = ? ORDER BY c.fecha_inicio DESC` — sin filtro de `activo`. Retorna todos. |

#### 3.3 Selector de ciclo en rutina/dieta

| Criterio | Estado | Evidencia |
|---|---|---|
| Seleccionar ciclo anterior | ❌ | **No implementado.** `MiRutinaScreen.js:21` y `MiDietaScreen.js:22` importan `seleccionarCicloActivo` que filtra por `activo===1`. No hay UI para seleccionar otro ciclo. |

---

### PARTE 4 — AUDITAR PROGRESO DEL AFILIADO

#### 4.1 Pantalla "Mi Progreso" (app móvil)

| Criterio | Estado | Evidencia |
|---|---|---|
| Historial de mediciones (peso, % grasa, medidas, IMC) | ✅ | `MiProgresoScreen.js:48-60` `ProgresoItem` muestra peso, IMC, grasa_corporal, masa_muscular, cintura. Cards resumen con peso actual, cambio, registros. |
| Ejercicios completados por día | ❌ | **No se muestra.** `MiProgresoScreen` solo llama `GET /afiliados/me/progreso` (PROGRESO_FISICO). No llama `GET /afiliados/me/progreso-ejercicio/{id}/{fecha}`. |
| Alimentos consumidos | ❌ | **No se muestra.** No hay endpoint GET para historial de consumo de alimentos. Solo existe `POST /afiliados/me/consumo-alimento` (escritura). |
| Vasos de agua | ❌ | **No se muestra.** Solo existe `GET /afiliados/me/agua/{fecha}` (un día específico). No hay endpoint de historial de agua. |

#### 4.2 Datos del backend

| Criterio | Estado | Evidencia |
|---|---|---|
| Datos reales (no mockeados) | ✅ | Todos los endpoints retornan queries SQL reales contra tablas `PROGRESO_FISICO`, `PROGRESO_EJERCICIO_DIARIO`, `REGISTRO_AGUA`, `CONSUMO_ALIMENTO_DIARIO`. |
| Tablas con datos de prueba | ⚠️ | `PROGRESO_FISICO`: 14 registros de seed. `PROGRESO_EJERCICIO_DIARIO`, `REGISTRO_AGUA`, `CONSUMO_ALIMENTO_DIARIO`: 0 registros (tablas vacías, solo schema). |

---

### PARTE 5 — AUDITORÍA HU POR HU

#### HU1: Login y Autenticación

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Login con email/password | `POST /login` | USUARIO | ✅ |
| JWT de 8h | `authController.login` | — | ✅ |
| Roles: Admin, Recepcionista, Entrenador, Afiliado | `USUARIO.rol` ENUM | USUARIO | ✅ |
| Login móvil | `POST /login` (api.js) | USUARIO | ✅ |
| Login web | `POST /login` (api.js) | USUARIO | ✅ |

#### HU2: CRUD de Afiliados (web staff)

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Listar afiliados | `GET /afiliados` | AFILIADO + USUARIO | ✅ |
| Crear afiliado | `POST /afiliados` | USUARIO + AFILIADO | ✅ |
| Editar afiliado | `PATCH /afiliados/:id` | AFILIADO + USUARIO | ✅ |
| Eliminar afiliado | `DELETE /afiliados/:id` | AFILIADO + USUARIO | ✅ |
| Subir foto | `POST /afiliados/:id/foto` | AFILIADO.foto | ✅ |
| Perfil propio (móvil) | `GET /afiliados/me` | AFILIADO + USUARIO | ✅ |

#### HU3: Gestión de Ciclos

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Crear ciclo | `POST /afiliados/ciclos` | CICLO | ✅ |
| Ciclo activo por afiliado | `GET /afiliados/me/ciclos` | CICLO | ✅ |
| Todos los ciclos | `GET /afiliados/me/ciclos` | CICLO | ✅ |
| Cerrar ciclo anterior automáticamente | `cicloModel.create` (UPDATE activo=0) | CICLO | ✅ |
| Validar solapamiento de fechas | `cicloModel.create` | CICLO | ✅ |
| Ver planes de ciclos anteriores (móvil) | `GET /afiliados/me/ciclos` | CICLO | ✅ |

#### HU4: Plan de Entrenamiento

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Crear plan | `POST /planes/entrenamiento` | PLAN_ENTRENAMIENTO | ✅ |
| Crear rutina | `POST /planes/rutinas` | RUTINA | ✅ |
| Agregar ejercicio a rutina | `POST /planes/rutinas/:id/ejercicios` | RUTINA_EJERCICIO | ✅ |
| Ver plan (móvil) | `GET /planes/entrenamiento/:id_ciclo` | RUTINA + RUTINA_EJERCICIO | ✅ |
| Ejercicios con series/reps/peso | `RUTINA_EJERCICIO` | RUTINA_EJERCICIO | ✅ |
| Marcar ejercicio completado | `POST /afiliados/me/progreso-ejercicio` | PROGRESO_EJERCICIO_DIARIO | ✅ |

#### HU5: Plan Nutricional

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Crear plan | `POST /planes/nutricional` | PLAN_NUTRICIONAL | ✅ |
| Agregar alimentos | `POST /planes/nutricional/:id/detalle` | DETALLE_NUTRICIONAL | ✅ |
| Ver plan (móvil) | `GET /planes/nutricional/:id_ciclo` | DETALLE_NUTRICIONAL + ALIMENTO | ✅ |
| Calorías objetivo | `PLAN_NUTRICIONAL.calorias_objetivo` | PLAN_NUTRICIONAL | ✅ |
| Macros por alimento | `v_alimento_calorias` (VIEW) | ALIMENTO | ✅ |
| Marcar alimento consumido | `POST /afiliados/me/consumo-alimento` | CONSUMO_ALIMENTO_DIARIO | ✅ |
| **⚠️ BUG: updateNutricional borra detalle** | `planController.updateNutricional` | DETALLE_NUTRICIONAL | ✅ CORREGIDO |

#### HU6: Seguimiento Diario (app móvil)

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Registro de agua | `POST /afiliados/me/agua` | REGISTRO_AGUA | ✅ |
| Consulta de agua | `GET /afiliados/me/agua/:fecha` | REGISTRO_AGUA | ✅ |
| Progreso de ejercicios | `POST /afiliados/me/progreso-ejercicio` | PROGRESO_EJERCICIO_DIARIO | ✅ |
| Consulta progreso ejercicios | `GET /afiliados/me/progreso-ejercicio/:id/:fecha` | PROGRESO_EJERCICIO_DIARIO | ✅ |
| Consumo de alimentos | `POST /afiliados/me/consumo-alimento` | CONSUMO_ALIMENTO_DIARIO | ✅ |
| Historial de agua (múltiples días) | `GET /afiliados/me/agua/historial` | REGISTRO_AGUA | ✅ |
| Historial de consumo alimentos | `GET /afiliados/me/consumo/historial` | CONSUMO_ALIMENTO_DIARIO | ✅ |

#### HU7: Progreso Físico

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Registrar medición (staff) | `POST /afiliados/progreso` | PROGRESO_FISICO | ✅ |
| Ver historial (móvil) | `GET /afiliados/me/progreso` | PROGRESO_FISICO | ✅ |
| IMC calculado | `ROUND(peso_kg / POW(estatura/100, 2), 2)` | PROGRESO_FISICO | ✅ |
| **⚠️ BUG: validación peso vs peso_kg** | `afiliadoService.createProgreso` | — | ✅ CORREGIDO |

#### HU8: Pagos y Membresías

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| Registrar pago (admin/recep) | `POST /afiliados/:id/pagos` | PAGO | ✅ |
| Historial de pagos | `GET /afiliados/:id/pagos` | PAGO | ✅ |
| Métricas admin | `GET /pagos/metricas` | PAGO | ✅ |
| Precio membresía configurable | `GET/PUT /configuracion/precio-membresia` | CONFIGURACION | ✅ |
| Recordatorio de pagos vencidos | `cron/recordatorioPagos.js` | PAGO_RECORDATORIO | ✅ |

#### HU9: Dashboard y Notificaciones

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| KPIs del gimnasio | `GET /dashboard/kpis` | Múltiples tablas | ✅ |
| Notificaciones por rol | `GET /notificaciones` | Compute dinámico | ✅ |
| Gráficas de distribución | Frontend calcula | — | ✅ |

#### HU10: Catálogos (Ejercicios, Alimentos, Restricciones)

| Criterio | Endpoint | Tabla | Estado |
|---|---|---|---|
| CRUD ejercicios | `GET/POST/PUT/DELETE /catalogo/ejercicios` | EJERCICIO | ✅ |
| CRUD alimentos | `GET/POST/PUT/DELETE /catalogo/alimentos` | ALIMENTO | ✅ |
| Restricciones médicas | `GET /catalogo/restricciones` | RESTRICCION | ✅ |
| Ejercicios filtrados por restricción | `GET /afiliados/:id/ejercicios-disponibles` | EJERCICIO_RESTRICCION_EXCLUIDA | ✅ |
| Alimentos filtrados por restricción | `GET /afiliados/:id/alimentos-disponibles` | ALIMENTO_RESTRICCION_EXCLUIDA | ✅ |

---

### PROBLEMAS ENCONTRADOS Y CORREGIDOS

#### Bugs Críticos Corregidos

| # | Problema | Archivo | Línea | Corrección |
|---|---|---|---|---|
| 1 | `updateNutricional` borraba todo el detalle de alimentos al actualizar solo calorias/comidas | `backend/controllers/planController.js` | 158 | Eliminada llamada a `PlanModel.clearDetalleNutricional()` |
| 2 | `createProgreso` validaba `datos.peso` pero el frontend envía `peso_kg` | `backend/services/afiliadoService.js` | 120 | Validación cambiada a `!datos.peso_kg && !datos.peso` |

#### Bugs Menores Detectados (sin corrección automática)

| # | Problema | Archivo | Impacto |
|---|---|---|---|
| 3 | `getRecepcionistas` carga TODOS los usuarios y filtra en JS | `usuarioController.js:13` | Rendimiento innecesario |
| 4 | `pagoController.create` no pasa `req.user.sub` como `registrado_por` | `pagoController.js:54` | Pago se registra sin saber quién lo creó |
| 5 | Sin validación server-side de `dia_numero` (1-7) en `createRutina` | `planController.js` | Dato inválido podría llegar a la BD |
| 6 | `MiProgresoScreen` no muestra ejercicios completados ni alimentos consumidos | `MiProgresoScreen.js` | UX incompleta |

#### Gaps Funcionales (sin implementar)

| # | Funcionalidad | Dónde aplicaría | Estado |
|---|---|---|---|
| 7 | Selector de ciclo en "Mi Rutina" para ver planes históricos | `MiRutinaScreen.js` | No implementado |
| 8 | Selector de ciclo en "Mi Dieta" para ver planes históricos | `MiDietaScreen.js` | No implementado |
| 9 | Endpoint GET de historial de agua (múltiples días) | Backend nuevo | No existe |
| 10 | Endpoint GET de historial de consumo de alimentos | Backend nuevo | No existe |
| 11 | Mostrar progreso de ejercicios completados en "Mi Progreso" | `MiProgresoScreen.js` | No implementado |

---

### PRUEBAS DE TRAZABILIDAD

#### Trazabilidad: Ciclo Activo → Plan → Ejercicios

**Query SQL (ciclo activo):**
```sql
SELECT c.*, (SELECT COUNT(*)+1 FROM CICLO c2 WHERE c2.id_usuario=c.id_usuario AND c2.fecha_inicio<c.fecha_inicio) AS numero_ciclo
FROM CICLO c WHERE c.id_usuario=6 AND c.activo=1;
```
**Ejemplo respuesta endpoint `GET /afiliados/me/ciclos`:**
```json
[{ "id_ciclo": 2, "activo": 1, "objetivo_fisico": "Perdida de grasa", "numero_ciclo": 2, "fecha_inicio": "2024-04-04", "fecha_fin": "2024-05-31" }]
```

**Query SQL (plan de entrenamiento):**
```sql
SELECT r.id_rutina, r.nombre_rutina, r.dia_numero,
  JSON_ARRAYAGG(JSON_OBJECT('nombre_ejercicio', e.nombre_ejercicio, 'series', re.series, 'repeticiones', re.repeticiones))
FROM RUTINA r
LEFT JOIN RUTINA_EJERCICIO re ON r.id_rutina = re.id_rutina
LEFT JOIN EJERCICIO e ON re.id_ejercicio = e.id_ejercicio
WHERE r.id_ciclo = 2 GROUP BY r.id_rutina ORDER BY r.dia_numero;
```

#### Trazabilidad: Progreso de Ejercicios

**Query SQL:**
```sql
INSERT INTO PROGRESO_EJERCICIO_DIARIO (id_usuario, id_ciclo, id_ejercicio, fecha, completado)
VALUES (6, 2, 1, '2026-08-27', 1)
ON DUPLICATE KEY UPDATE completado=1, updated_at=NOW();
```

**Lectura:**
```sql
SELECT id_ejercicio, completado FROM PROGRESO_EJERCICIO_DIARIO
WHERE id_usuario=6 AND id_ciclo=2 AND fecha='2026-08-27';
```

#### Trazabilidad: Consumo de Alimentos

**Query SQL:**
```sql
INSERT INTO CONSUMO_ALIMENTO_DIARIO (id_usuario, id_ciclo, id_alimento, num_comida, fecha, consumido)
VALUES (6, 2, 1, 1, '2026-08-27', 1)
ON DUPLICATE KEY UPDATE consumido=1, updated_at=NOW();
```

---

### RECOMENDACIONES FINALES

#### Prioridad Alta
1. ~~**Implementar selector de ciclo en MiRutinaScreen y MiDietaScreen**~~ ✅ `MiRutinaScreen.js` y `MiDietaScreen.js` ahora muestran picker de ciclo cuando hay más de 1 ciclo.
2. ~~**Crear endpoints de historial**~~ ✅ `GET /afiliados/me/agua/historial`, `GET /afiliados/me/consumo/historial`, `GET /afiliados/me/progreso-ejercicio/historial` — implementados en backend + service + controller + routes.
3. ~~**Mostrar progreso de ejercicios en MiProgresoScreen**~~ ✅ `MiProgresoScreen.js` ahora muestra ejercicios completados por día, consumo de agua y consumo de alimentos desde los endpoints de historial.

#### Prioridad Media
4. ~~**Fix `pagoController.create`**~~ ✅ `pagoController.js:32` ahora pasa `req.user.sub` como `registrado_por`.
5. ~~**Fix `getRecepcionistas`**~~ ✅ `usuarioModel.js` ahora tiene `findRecepcionistas()` con `WHERE rol = 'Recepcionista'` en SQL.
6. ~~**Validar `dia_numero` 1-7**~~ ✅ `planController.js:createRutina` ahora valida `dia_numero >= 1 && <= 7`.
7. ~~**Agregar datos de prueba**~~ ✅ `02_seed.sql` ya contiene 2 ciclos + 6 rutinas + planes nutricionales + 4 registros de progreso para Juan (id=6).

#### Prioridad Baja
8. **Optimizar `pagoModel.getMetricas`** — Unificar las 4 queries en una sola con subconsultas.
9. **Dashboard.jsx (legacy)** — Eliminar o redirigir, ya que `AdminDashboard.jsx` lo reemplazó.
10. **Documentar API en Postman** — Las colecciones Postman ya están sincronizadas con los endpoints reales (verificar tras este cambio).

---

### ARCHIVOS MODIFICADOS EN ESTA AUDITORÍA

| Archivo | Cambio |
|---|---|
| `backend/controllers/planController.js:158` | Eliminada línea `await PlanModel.clearDetalleNutricional(req.params.id)` |
| `backend/services/afiliadoService.js:120` | Corregida validación: `!datos.peso` → `!datos.peso_kg && !datos.peso` |
| `backend/controllers/usuarioController.js` | `getRecepcionistas` ahora llama `UsuarioService.getRecepcionistas()` en lugar de filtrar en JS |
| `backend/services/usuarioService.js` | Agregado método `getRecepcionistas()` |
| `backend/models/usuarioModel.js` | Agregado método `findRecepcionistas()` con SQL `WHERE rol='Recepcionista'` |
| `backend/controllers/pagoController.js` | `create` ahora incluye `registrado_por: req.user.sub` |
| `backend/controllers/planController.js` | `createRutina` valida `dia_numero` entre 1 y 7 |
| `backend/models/seguimientoDiarioModel.js` | Agregados métodos `getAguaHistorial`, `getConsumoHistorial`, `getProgresoEjercicioHistorial` |
| `backend/services/afiliadoService.js` | Agregados métodos de historial |
| `backend/controllers/afiliadoController.js` | Agregados controllers de historial |
| `backend/routes/afiliadoRoutes.js` | Agregadas 3 rutas de historial (GET) |
| `movil/src/services/api.js` | Agregadas funciones `getAguaHistorial`, `getConsumoHistorial`, `getProgresoEjercicioHistorial` |
| `movil/src/screens/MiRutinaScreen.js` | Agregado selector de ciclo con picker |
| `movil/src/screens/MiDietaScreen.js` | Agregado selector de ciclo con picker |
| `movil/src/screens/MiProgresoScreen.js` | Agregadas secciones de historial: ejercicios, agua y alimentos |
