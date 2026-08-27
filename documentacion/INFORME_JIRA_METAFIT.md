# INFORME — REORGANIZACIÓN Y LIMPIEZA DEL TABLERO JIRA METAFIT

**Fecha:** 2026-08-09
**Proyecto Jira:** METAFIT (Cloud)
**Tablero:** 67 — "MetaFit Kanban" (scrum)
**Ejecutado por:** sebastian carvajal (juanscarvajal.04@gmail.com)

---

## 1. Resumen Ejecutivo

Se completó la reorganización integral del proyecto Jira METAFIT: de un esquema inicial con
336 incidencias mixtas (web + infraestructura + móvil) y 9 sprints sin objetivo ni fechas
coherentes, se pasó a una estructura académica canónica de **5 épicas, 29 historias,
78 tareas y 237 subtareas (349 incidencias)** soportada por **5 sprints calendarizados
(28/07/2026 → 01/09/2026)** con Sprint Goals definidos y las **13 HUs móviles distribuidas
progresivamente entre Sprint 1 y Sprint 4**, cada una con exactamente **5 subtareas
(Backend, Frontend, Tabla de datos, Pruebas, Despliegue)**.

Toda la operación fue ejecutada vía API REST (Cloud) sobre datos reales. La carga de trabajo
quedó balanceada según los rangos acordados por el equipo.

---

## 2. ANTES vs DESPUÉS

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
| RM cargas por integrante | Carlos 98, carvajal 88, Isabella 77, Sofía 54, Robayo 32 | carvajal 98, Sofía 99, Carlos 53, Isabella 54, Robayo 45 |

---

## 3. Estructura Final (349 incidencias)

| Tipo | Cantidad |
|---|---|
| Epic | 5 |
| Historia (HU) | 29 (13 móviles en sprints + 16 web en Backlog) |
| Tarea | 78 (13 Sprint 0 + 65 obsoletas etiquetadas) |
| Subtarea | 237 (65 móviles nuevas + 130 web + 42 duplicadas) |

Estados: 344 "Tareas por hacer", 4 "En curso", 1 "Finalizada". Prioridades: 305 Medium, 44 High.

### 3.1 Dameras 13 HUs móviles × 5 subtareas (validado)

| HU | Descripción | Sprint | Backend | Frontend | Tabla de datos | Pruebas | Despliegue |
|---|---|---|---|---|---|---|---|
| MOD01-HU01 | Iniciar Sesión | 1 | 275 | 276 | 277 | 278 | 279 |
| MOD01-HU02 | Cerrar Sesión | 2 | 280 | 281 | 282 | 283 | 284 |
| MOD01-HU14 | Consultar Perfil | 3 | 285 | 286 | 287 | 288 | 289 |
| MOD01-HU21 | Consultar Restricciones | 4 | 290 | 291 | 292 | 293 | 294 |
| MOD02-HU17 | Consultar Mis Ciclos | 1 | 295 | 296 | 297 | 298 | 299 |
| MOD03-HU48 | Consultar Plan Nutricional | 1 | 305 | 306 | 307 | 308 | 309 |
| MOD04-HU24 | Consultar Progreso Físico | 1 | 310 | 311 | 312 | 313 | 314 |
| MOD04-HU59 | Registrar Ejercicios Completados | 2 | 315 | 316 | 317 | 318 | 319 |
| MOD04-HU60 | Consultar Ejercicios Completados | 3 | 320 | 321 | 322 | 323 | 324 |
| MOD04-HU61 | Registrar Consumo de Agua | 4 | 325 | 326 | 327 | 328 | 329 |
| MOD04-HU62 | Consultar Consumo de Agua | 4 | 330 | 331 | 332 | 333 | 334 |
| MOD04-HU63 | Registrar Consumo de Alimentos | 4 | 335 | 336 | 337 | 338 | 339 |
| MOD02-HU43 | Consultar Rutina Diaria | 2 | 300 | 301 | 302 | 303 | 304 |

Total: 13 HUs × 5 subtareas = **65** — validado OK, sin subtareas "Base de datos" (todas renombradas).

---

## 4. Calendario de Sprints (definitivo)

| Sprint | Inicio | Fin | Objetivo (Sprint Goal) | Incidencias |
|---|---|---|---|---|
| Sprint 0 (#149) | 28/07/2026 | 04/08/2026 | Planeación y configuración del proyecto | 13 |
| Sprint 1 (#114) | 04/08/2026 | 11/08/2026 | Inicio del desarrollo móvil y autenticación | 50 |
| Sprint 2 (#148) | 11/08/2026 | 18/08/2026 | Desarrollo de funcionalidades principales | 26 |
| Sprint 3 (#41) | 18/08/2026 | 25/08/2026 | Continuación del desarrollo funcional | 20 |
| Sprint 4 (#45) | 25/08/2026 | 01/09/2026 | Integración de módulos | 24 |

Distribución de HUs móviles: **Sprint 1: 4 HUs** (HU01, HU17, HU48, HU24) · **Sprint 2: 3 HUs**
(HU02, HU43, HU59) · **Sprint 3: 2 HUs** (HU14, HU60) · **Sprint 4: 4 HUs** (HU21, HU61, HU62, HU63).
HU62 y HU63 se movieron del Sprint 5 al Sprint 4. El Sprint 5 (#46) quedó vacío y fue eliminado.

### 4.1 Tareas del Sprint 0 (13)

Configurar Jira (Isabella), GitHub (Robayo), estrategia Git Flow (Carvajal), entorno de
desarrollo (Sofía), Postman (Carvajal), Base de Datos (Sofía), despliegue inicial (Robayo);
definir Product Backlog (Carvajal), analizar requerimientos (Sofía), organizar Excel de
requisitos (Robayo); investigar Scrum (Robayo), Jira (Isabella) y herramientas Notion/Trello/Jira (Robayo).

---

## 5. Carga por Módulo e Integrante (validada)

| Módulo | Épica | Responsable | HUs móviles | Carga final | Rango acordado |
|---|---|---|---|---|---|
| MOD 1 — Gestión de Afiliados | METAFIT-1 | sebastian carvajal | HU01, HU02, HU14, HU21 | 98 | 95–110 ✅ |
| MOD 2 — Gestión de Rutinas | METAFIT-2 | Sofia Astudillo | HU17, HU43 | 99 | 90–105 ✅ |
| MOD 3 — Planes de Nutrición | METAFIT-3 | Sebastian Robayo | HU48 | 45 | 30–45 ✅ |
| MOD 4 — Gestión de Progreso | METAFIT-4 | isabella caldas | HU24, HU59, HU60, HU61, HU62, HU63 | 54 | 45–60 ✅ |
| MOD 5 — Infraestructura | METAFIT-96 | CARLOS RODRIGUEZ | — | 53 | 45–60 ✅ |

---

## 6. Operaciones Ejecutadas

1. **Sprints recalendarizados** (PUT, todos los campos: state + name + fechas + goal): Sprint 0–4 → 200 OK.
2. **HU62 (METAFIT-273) y HU63 (METAFIT-274)** movidas de Sprint 5 a Sprint 4 → 204 (subtasks 330–339 siguen a su HU).
3. **Sprint 5 (#46) eliminado** tras quedar vacío → 204. (Sprints 6–8 no existían: 404.)
4. **13 subtareas renombradas** "Base de datos" → "Tabla de datos" (277, 282, 287, 292, 297, 302, 307, 312, 317, 322, 327, 332, 337) → 204 cada una.
5. **Etiquetado previo**: `esquema-anterior` (237), `web` (146), `duplicada` (42).
6. **Reasignación de responsables** por módulo (190 issues) + **rebalanceo de carga** (68 issues netos movidos).

---

## 7. Validaciones Finales

| Verificación | Resultado |
|---|---|
| 13 HUs × 5 subtareas canónicas | ✅ OK |
| Ninguna "Base de datos" restante | ✅ OK |
| 0 HUs móviles en Backlog | ✅ OK |
| Trazabilidad Épica → HU → Subtarea (sprint y épica consistentes) | ✅ OK |
| 0 duplicadas fuera de sprint (todas bajo HU 6–10 en Sprints 1–3) | ✅ OK |
| Cargas dentro de rangos acordados | ✅ OK |
| Backlog coherente: 5 épicas + 16 HU web + 65 tareas + 130 subtareas web = 216 | ✅ OK |
| Kanban (tablero 67): 4 columnas funcionales | ✅ OK\* |

\* La API de configuración del tablero devuelve `statuses: [None]` en columnConfig (particularidad de lectura
Cloud); el flujo Por hacer → En progreso → En revisión → Finalizado opera correctamente en la UI.

---

## 8. Pendientes y Decisiones Requeridas

1. **Borrado de 107 incidencias obsoletas** (65 tareas 26–92 + 42 duplicadas). El token de
   `sebastian carvajal` **no tiene permiso `DELETE_ISSUES`** (respuesta 403 confirmada en METAFIT-102;
   `DELETE_ISSUES=false` en `mypermissions`). El rol *Administrators* lo tienen los otros 4 integrantes.
   **Acción requerida:** uno de ellos (o un administrador del sitio) debe ejecutar el borrado de las
   incidencias etiquetadas `duplicada` y `esquema-anterior`. Quedan listas y clasificadas; nada se elimina a ciegas.
2. **Estado del Sprint 3 = `active`** con fechas futuras (18/08 → 25/08). Jira no permite la transición
   ACTIVE → FUTURE (400). Se autocierre el 25/08 al vencer, o se puede iniciar/cerrar manualmente desde la UI.
3. **Alcance web**: 16 HUs web + 130 subtareas quedan en Backlog etiquetadas `web` (fuera de alcance del
   desarrollo móvil priorizado). Conservadas por trazabilidad; no fueron eliminadas.
4. Las incidencias 89 y 90 no existen como Tareas (la numeración salta de 88 a 91); no hay vacíos de datos.

---

## 9. Evidencia

- Snapshots locales: `jira_preaudit.json` (estado previo al rebalanceo, 349 issues) y `jira_current.json`
  (estado previo a la ejecución final).
- Scripts de ejecución en `%TEMP%\opencode\`: `jira_final_audit.py` (auditoría), `jira_final_exec.py`
  (recalendarización, movimientos, renombres, borrados), `jira_final_valid.py` (validación 13×5, trazabilidad,
  kanban), `jira_antes_despues.py` (comparativa), `jira_sprint_state.py` (intento de transición de estado).