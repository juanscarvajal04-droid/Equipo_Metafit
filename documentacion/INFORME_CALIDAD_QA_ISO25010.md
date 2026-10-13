# MetaFit — Informe Canónico de Calidad, QA e ISO/IEC 25010

**Proyecto:** MetaFit — Sistema de Gestión Deportiva
**Fecha de verificación:** 2026-10-05
**Alcance:** `backend/` (Node.js + Express + MySQL), `frontend_web/` (React + Vite), `movil/` (Expo / React Native), `database/` (MariaDB), CI/CD y despliegue en Render.
**Fuente de verdad:** código del repositorio en la rama `feature/sofia-astudillo` (HEAD `763a088`).

> Este documento **sustituye y consolida** a los extintos `QA_REPORT.md` y `auditoria_iso_25010_FINAL.md`, cuyos defectos de configuración (rate limiter global, `GET /usuarios` sin control de rol,*CORS* permisivo) se conservan aquí como evidencia de corrección. Las cifras anteriores de esos documentos quedaron obsoletas y **no deben citarse**.

---

## 1. Cifras oficiales verificadas

Estas son las únicas cifras que deben usarse al sustentar. Cualquier documento del repositorio que difiera está desactualizado.

| Métrica | Valor verificado | Cómo se obtuvo |
|---|---|---|
| Endpoints REST del backend | **91** | Definidos en `backend/routes/*.js`, montados en `backend/server.js:143-154` |
| Archivos de rutas del backend | 12 | `backend/routes/` |
| Vistas web | **14** | `frontend_web/src/views/` |
| Rutas web | 15 | `frontend_web/src/App.jsx:82-140` |
| Pantallas móviles | **10** | `movil/src/screens/` |
| Endpoints REST únicos consumidos por el móvil | **27** | `movil/src/services/api.js` |
| Tablas de base de datos | **25 declaradas + 1 creada en runtime** | `database/*.sql` + `PAGO_RECORDATORIO` |
| Vistas de base de datos | **5** | `database/01_estructura.sql` |
| Suites de pruebas | 16 | 6 backend + 5 web + 5 móvil |
| **Pruebas declaradas en total** | **134** | 69 backend + 30 web + 35 móvil |
| Pruebas que pasan | **133/134** | Un fallo flaky, ver §4 |

---

## 2. Pruebas automatizadas

### 2.1 Backend — 69 pruebas / 6 suites

| Suite | Pruebas | Enfoque |
|---|---|---|
| `backend/__tests__/faseA.test.js` | 15 | Flujos de negocio |
| `backend/__tests__/api.test.js` | 13 | API, CORS, RBAC, recuperación de contraseña |
| `backend/__tests__/fase1.test.js` | 13 | Autenticación y usuarios |
| `backend/__tests__/afiliadoService.test.js` | 11 | Servicio de afiliados |
| `backend/__tests__/fase2.test.js` | 10 | Afiliados y planes |
| `backend/__tests__/objetivoUtils.test.js` | 7 | Utilidades de objetivos |

Comando: `npm test` en `backend/` → **69/69**.

> **Salvedad honesta:** estas pruebas **no tocan la base de datos real**. `api.test.js` aplica `jest.mock('../config/db')`, por lo que validan lógica, rutas y códigos de respuesta con dobles de prueba, no la persistencia real. La verificación de persistencia y de datos de seed se documenta por separado en `INFORME_ANALISIS_PERSISTENCIA_METAFIT.md`.

### 2.2 Frontend web — 30 pruebas / 5 suites

| Suite | Pruebas |
|---|---|
| `helpers.test.js` | 12 |
| `api.test.js` | 6 |
| `AuthContext.test.jsx` | 5 |
| `RecuperarPassword.test.jsx` | 4 |
| `ErrorBoundary.test.jsx` | 3 |

Comando: `npm test` en `frontend_web/` (Vitest) → **30/30**.

### 2.3 Móvil — 35 pruebas / 5 suites

| Suite | Pruebas |
|---|---|
| `formateadores.test.js` | 14 |
| `api.test.js` | 8 |
| `RecuperarPasswordScreen.test.js` | 5 |
| `AuthContext.test.jsx` | 4 |
| `LoginScreen.test.js` | 4 |

Comando: `npm test` en `movil/` (Jest + RNTL) → **34/35**, ver §4.

---

## 3. Verificación manual por fases (QA funcional)

Corresponde a las 10 fases del histórico `QA_REPORT.md`, revalidadas contra el código actual. Los códigos son los que devuelve la API.

### Fase 1 — Autenticación

| Prueba | Resultado |
|---|---|
| Login Admin / Entrenador / Recepcionista / Afiliado | 200 en los 4 roles |
| Login sin credenciales | 400 |
| Login con credenciales incorrectas | 401 |
| Cuenta en estado Pendiente | 403 |
| Rate limiter tras 10+ intentos fallidos | 429 |

### Fase 2 — CRUD de afiliados

| Prueba | Resultado |
|---|---|
| `GET /afiliados` como Admin | 200 |
| `GET /afiliados` como Afiliado | 403 |
| `GET /afiliados/:id` existente / inexistente | 200 / 404 |
| `POST /afiliados` (Admin o Recepcionista) | 201 |
| `DELETE /afiliados/:id` como Admin | 200 |
| `DELETE /afiliados/:id` como Recepcionista o Entrenador | 403 |

### Fases 3 a 9 — Módulos

| Fase | Módulo | Verificación |
|---|---|---|
| 3 | Gestión de personal | `GET /usuarios` Admin 200, Afiliado 403 |
| 4 | Rutinas y ejercicios | `GET /catalogo/ejercicios`, `GET /catalogo/restricciones`, `GET /afiliados/:id/ejercicios-disponibles`, `GET /planes/entrenamiento/:id` → 200 |
| 5 | Dietas y alimentos | `GET /catalogo/alimentos`, `GET /afiliados/:id/alimentos-disponibles`, `GET /planes/nutricional/:id` → 200 |
| 6 | Pagos | `GET /afiliados/:id/pagos`, `GET /pagos`, `GET /pagos/metricas` → 200 |
| 7 | Dashboard | `GET /dashboard/kpis` Admin 200, Entrenador y Afiliado 403 |
| 8 | Notificaciones | `GET /notificaciones` Admin y Afiliado 200 |
| 9 | Frontend web | Carga de la página principal 200; `Login.jsx` renderiza |

### Fase 10 — Datos de prueba (seed)

| Tabla | Registros |
|---|---|
| `USUARIO` | 11 |
| `AFILIADO` | 5 |
| `CICLO` | 9 |
| `RESTRICCION` | 6 |
| `EJERCICIO` | 19 |
| `ALIMENTO` | 20 |
| `RUTINA` | 27 |
| `PLAN_ENTRENAMIENTO` | 9 |
| `PLAN_NUTRICIONAL` | 9 |
| `PAGO` | 42 |
| `PROGRESO_FISICO` | 14 |

---

## 4. Defectos abiertos

Esta sección sustituye las afirmaciones previas de "100 % en todas las características". MetaFit **no** cumple al 100 %; hay tres brechas conocidas y verificables.

| ID | Severidad | Ubicación | Descripción |
|---|---|---|---|
| DEF-001 | Media | `movil/src/screens/RecuperarPasswordScreen.test.js:39` | **Prueba flaky.** Al ejecutar las 5 suites móviles juntas, `waitFor` agota el tiempo y el caso falla. Aislada pasa 5/5. Es un defecto de la prueba, no de la aplicación: el código funciona. Mitigación: ejecutar esa suite por separado en la demostración. |
| DEF-002 | Baja | `movil/src/screens/MiPerfilScreen.js:335` | **Hook condicional.** `useTheme` se invoca fuera del nivel superior del componente. Funciona en ejecución porque la condición no cambia entre renders, pero viola las reglas de hooks. |
| DEF-003 | Baja | Configuración de ESLint en `movil/` | `expo lint` reporta 176 problemas, de los cuales **159 son falsos positivos**: `no-undef` aplicado a globals de Jest (`describe`, `it`, `expect`) porque el entorno `jest` no está declarado en la configuración de ESLint. Arreglarlo requiere tocar la configuración de lint, no el código de aplicación. |

> Al sustentar, citar **133/134 pruebas** y mencionar estas tres brechas. Una evaluación del 100 % sin ellas es inexacta y se contradice con la salida real de las herramientas.

---

## 5. Evaluación ISO/IEC 25010

Veredictos corregidos respecto al documento anterior, con honestidad sobre las brechas de §4.

| Característica | Veredicto | Evidencia | Brecha |
|---|---|---|---|
| **Adecuación funcional** | ALTO | 91 endpoints con RBAC por middleware en `backend/middlewares/auth.js`; cobertura de afiliado, personal, planes, catálogos, pagos, dashboard y notificaciones | Sin brecha funcional abierta |
| **Eficiencia de desempeño** | ALTO | Carga diferida por vista con `React.lazy` + `Suspense` en `App.jsx`; pool `mysql2/promise` con `connectionLimit: 10`; sin patrón N+1 en `afiliadoModel.findAll` (4 consultas con `JOIN` + `GROUP_CONCAT`) | Sin brecha |
| **Compatibilidad** | ALTO | CORS con lista blanca estricta desde `CORS_ORIGINS`, sin comodines; origen por defecto `https://metafit-frontend-78x6.onrender.com`; peticiones sin `Origin` (móvil, curl) permitidas | Sin brecha |
| **Usabilidad** | ALTO | Tema oscuro consistente, navegación coherente entre web y móvil, códigos de estado traducidos a mensajes en español, recuperación de contraseña funcional en ambas plataformas | Sin brecha |
| **Fiabilidad** | ALTO | Transacciones con `beginTransaction`/`commit`/`rollback` en toda operación multi-tabla (alta y baja de afiliado, ciclos, seguimiento diario, borrado de rutina); `GET /health` con `SELECT 1`; migraciones idempotentes | DEF-001 (flaky) |
| **Seguridad** | ALTO | bcrypt con 12 rondas y límite de 72 bytes; JWT de 8 h; token de reseteo de un solo uso con 15 min de vigencia y tabla `PASSWORD_RESET`; respuestas genéricas contra enumeración de usuarios; SQL parametrizado; `helmet`; rate limiting | Sin brecha |
| **Mantenibilidad** | MEDIO | Arquitectura MVC con `controllers`/`models`/`services`; Swagger generado desde comentarios; 134 pruebas en 16 suites; documentación en `documentacion/` | **DEF-003**: 176 avisos de lint móvil, 159 por configuración |
| **Portabilidad** | ALTO | Docker Compose; `render.yaml`; configuración por `DATABASE_URL` o variables `DB_*`; APK distribuida desde Static Site | Sin brecha |

**Nivel general: ALTO**, con la salvedad de que la característica **mantenibilidad** queda en MEDIO por la deuda de lint y hay una prueba flaky en fiabilidad.

---

## 6. Integración continua y despliegue

Existe CI/CD real en `.github/workflows/ci.yml` (workflow `CI/CD`, 74 líneas) con dos trabajos:

- **CI** — en `push` a `main` y `feature/juan-carvajal`, y en `pull_request` hacia `main`: instala Node 20 con caché de npm y ejecuta `npm ci && npm test` en `backend/`, `npm ci && npm test && npm run build` en `frontend_web/`, y `npm ci && npm test` en `movil/`.
- **CD** — condicionado a `if: github.ref == 'refs/heads/main'`: dispara el despliegue del backend (Web Service `srv-d9ieq2rtqb8s738q2180`) y del frontend (Static Site `srv-d9kbkdm1egvs7385ofu0`) mediante la API de Render, usando el secreto `RENDER_API_TOKEN`.

> **Advertencia importante:** un `push` directo a `feature/sofia-astudillo` **no** dispara el pipeline, porque esa rama no figura en el disparador de `push`. El pipeline sí correría al abrir un `pull_request` hacia `main`.

---

## 7. Conclusión

MetaFit tiene cobertura de pruebas real y trazable (**134 pruebas declaradas, 133 pasan**), control de acceso por rol verificado en los cuatro roles, transacciones en las operaciones multi-tabla y una canalización de integración continua configurada. Las brechas pendientes son tres y todas están identificadas arriba con su ubicación exacta: una prueba flaky, un hook condicional y la configuración de lint del proyecto móvil. Ninguna impide la demostración funcional del sistema.