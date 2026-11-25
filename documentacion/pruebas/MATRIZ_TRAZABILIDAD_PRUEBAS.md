# Matriz de trazabilidad de pruebas — MetaFit

**Fecha:** 2026-11-25  
**Rama:** `feature/sofia-astudillo`  
**Cobertura de referencia:** 134 pruebas automatizadas + 51 casos de QA manual documentados.

La matriz relaciona módulos funcionales, endpoints representativos, archivos de prueba y casos. No todos los endpoints tienen prueba automatizada; las celdas vacías identifican deuda de cobertura.

---

## 1. Trazabilidad por módulo

| Módulo / historia | Endpoints representativos | Prueba automatizada | Casos | QA manual | Estado |
|---|---|---|---|---|---|
| Autenticación | `POST /login` | `backend/__tests__/api.test.js` | CP-AUT-01, CP-AUT-02 | Fase 1 | Cubierto |
| RBAC / autorización | Rutas protegidas por rol | `api.test.js`, `fase1.test.js`, `fase2.test.js` | CP-AUT-02…05 | Fases 1–3 | Cubierto |
| Recuperación de contraseña | `POST /auth/recuperar-password`, `POST /auth/reset-password` | `api.test.js`, `RecuperarPassword.test.jsx`, `RecuperarPasswordScreen.test.js` | CP-AUT-06…08, CP-WEB-06, CP-MOV-06 | Fase 1 | Cubierto |
| Afiliados | `/afiliados`, `/afiliados/me`, `/afiliados/:id` | `api.test.js`, `faseA.test.js` | CP-AFI-01…07 | Fase 2 | Cubierto parcialmente |
| Catálogo de restricciones | `/catalogo/restricciones` | `fase2.test.js` | CP-CAT-01…04 | Fase 4 | Cubierto |
| Rutinas y ejercicios | `/rutina/:dia`, `/afiliados/me/ejercicios-disponibles`, `/planes/entrenamiento/:id` | `faseA.test.js`, `fase1.test.js` | CP-AFI-06 | Fase 4 | Cubierto parcialmente |
| Dietas y alimentos | `/catalogo/alimentos`, `/afiliados/me/alimentos-disponibles`, `/planes/nutricional/:id` | `fase1.test.js`, `faseA.test.js` | CP-AFI-05 | Fase 5 | Cubierto parcialmente |
| Pagos | `/pagos`, `/afiliados/:id/pagos`, `/pagos/metricas` | — | — | Fase 6 | Sin prueba automatizada |
| Dashboard | `/dashboard/kpis` | — | — | Fase 7 | Sin prueba automatizada |
| Notificaciones | `/notificaciones` | `api.test.js` | CP-AUT-02 | Fase 8 | Cubierto parcialmente |
| Progreso diario | `/progreso/resumen` | `fase1.test.js` | CP-PRO-01…03 | Fase 9 | Cubierto |
| Cliente web | `api.js`, `AuthContext`, `ErrorBoundary` | `frontend_web/src/**/__tests__/` | CP-WEB-01…06 | Fase 9 | Cubierto |
| Cliente móvil | `api.js`, `AuthContext`, Login, recuperación, formateadores | `movil/src/**/__tests__/` | CP-MOV-01…08 | Fase 9 | Cubierto |
| Base de datos / seed | Scripts `01`–`05` | Verificación documental | CP-DEP-02 | Fase 10 | Documentado |
| Despliegue y CORS | `/health`, CORS | Humo manual | CP-DEP-01…06 | — | Verificado |
| Servicios externos (Brevo, Cloudinary, n8n) | Integraciones | — | — | Documental | Sin prueba automatizada |

## 2. Trazabilidad por archivo de prueba

| Archivo | Módulos que cubre | Casos |
|---|---|---|
| `backend/__tests__/api.test.js` | Login, CORS, RBAC, afiliados, notificaciones, recuperación | CP-AUT-01…08, CP-AFI-01, CP-WEB-06 |
| `backend/__tests__/faseA.test.js` | Perfil propio, macros, rutina del día | CP-AFI-02…06 |
| `backend/__tests__/fase1.test.js` | Ejercicios/alimentos disponibles, registro diario, progreso | CP-AFI-07…08, CP-PRO-01…03 |
| `backend/__tests__/fase2.test.js` | CRUD de restricciones y RBAC admin | CP-CAT-01…04 |
| `backend/__tests__/afiliadoService.test.js` | Normalización de fechas | CP-UTI-01…02 |
| `backend/__tests__/objetivoUtils.test.js` | Normalización de objetivo/nivel | CP-UTI-03 |
| `frontend_web/src/utils/__tests__/helpers.test.js` | Helpers de presentación | CP-WEB-01…03 |
| `frontend_web/src/services/__tests__/api.test.js` | Cliente HTTP e interceptor 401 | CP-WEB-01…03 |
| `frontend_web/src/context/__tests__/AuthContext.test.jsx` | Sesión y logout | CP-WEB-04 |
| `frontend_web/src/views/__tests__/RecuperarPassword.test.jsx` | Recuperación web | CP-WEB-06 |
| `frontend_web/src/components/__tests__/ErrorBoundary.test.jsx` | Manejo de errores UI | CP-WEB-05 |
| `movil/src/utils/__tests__/formateadores.test.js` | Fechas, números, IMC | CP-MOV-07…08 |
| `movil/src/services/__tests__/api.test.js` | Cliente HTTP móvil | CP-MOV-03…04 |
| `movil/src/context/__tests__/AuthContext.test.jsx` | Sesión móvil | CP-MOV-01…02 |
| `movil/src/screens/__tests__/LoginScreen.test.js` | Login móvil | CP-MOV-05 |
| `movil/src/screens/__tests__/RecuperarPasswordScreen.test.js` | Recuperación y navegación | CP-MOV-06 |

## 3. Brechas de trazabilidad

| Brecha | Impacto | Acción propuesta |
|---|---|---|
| Pagos sin prueba automatizada | Regresiones en cálculo/registro | Añadir suite de pagos y métricas |
| Dashboard sin prueba automatizada | KPIs podrían romperse | Probar agregados y RBAC |
| Servicios externos sin dobles | Fallos de correo/Cloudinary no cubiertos | Añadir mocks y pruebas de fallback |
| Sin integración con MariaDB real | No se valida persistencia | Job de integración con contenedor MariaDB |
| Sin E2E de navegación | Flujos de UI no verificados de extremo a extremo | Playwright/Detox en próxima iteración |
| Sin cobertura medida | No se conoce el porcentaje real | Configurar `coverage` y umbral |
| Casos PN/RT sin ejecución en dispositivo | Evidencia manual incompleta | Ejecutar y anexar capturas/fecha/versión |

## 4. Convención de identificadores

- `CP-AUT-*`: autenticación, autorización y recuperación.
- `CP-AFI-*`: afiliados y rutinas.
- `CP-CAT-*`: catálogos y restricciones.
- `CP-PRO-*`: progreso diario.
- `CP-UTI-*`: utilidades y normalización.
- `CP-WEB-*`: panel web.
- `CP-MOV-*`: app móvil.
- `CP-DEP-*`: despliegue, salud y CORS.
- `AUT-*`: suite automatizada.
- `DEF-*`: defecto conocido.
