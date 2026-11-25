# MetaFit — Informe canónico de calidad, QA e ISO/IEC 25010

**Proyecto:** MetaFit — Sistema de Gestión Deportiva  
**Fecha de verificación:** 2026-11-25  
**Rama:** `feature/sofia-astudillo`  
**HEAD:** `d12875c`  
**Alcance:** `backend/` (Node.js + Express + MariaDB 11), `frontend_web/` (React + Vite), `movil/` (Expo / React Native), `database/`, CI/CD y despliegue AWS EC2.  
**Fuente de verdad:** código del repositorio y ejecución de pruebas del 2026-11-25.

> Este documento sustituye las cifras anteriores de QA. La ejecución vigente es **134/134** pruebas automatizadas. La afirmación previa de 133/134 correspondía a una ejecución con un fallo intermitente que no se reprodujo en la línea base actual; el riesgo se mantiene documentado.

---

## 1. Cifras oficiales verificadas

| Métrica | Valor | Cómo se obtuvo |
|---|---:|---|
| Endpoints REST del backend | **91** | `backend/routes/*.js`, montados en `backend/server.js` |
| Archivos de rutas | 12 | `backend/routes/` |
| Vistas web | **14** | `frontend_web/src/views/` |
| Rutas web | 15 | `frontend_web/src/App.jsx` |
| Pantallas móviles | **10** | `movil/src/screens/` |
| Endpoints únicos consumidos por el móvil | **27** | `movil/src/services/api.js` |
| Tablas de base de datos | **25 declaradas + 1 en runtime** | `database/*.sql` + `PAGO_RECORDATORIO` |
| Vistas de base de datos | **5** | `database/01_estructura.sql` |
| Suites de pruebas | **16** | 6 backend + 5 web + 5 móvil |
| Pruebas automatizadas | **134** | 69 backend + 30 web + 35 móvil |
| Pruebas aprobadas en la línea base | **134/134** | Ejecución 2026-11-25 |
| Calidad global preliminar | **3,0/5** | `MODELO_DE_CALIDAD_METAFIT.md` |

## 2. Pruebas automatizadas

### 2.1 Backend — 69 pruebas / 6 suites

| Suite | Pruebas | Enfoque |
|---|---:|---|
| `backend/__tests__/faseA.test.js` | 15 | Flujos de negocio |
| `backend/__tests__/api.test.js` | 13 | API, CORS, RBAC, recuperación |
| `backend/__tests__/fase1.test.js` | 13 | Autenticación y usuarios |
| `backend/__tests__/afiliadoService.test.js` | 11 | Servicio de afiliados |
| `backend/__tests__/fase2.test.js` | 10 | Afiliados y planes |
| `backend/__tests__/objetivoUtils.test.js` | 7 | Utilidades de objetivos |

Comando: `npm test` en `backend/` → **69/69**, 37.9 s.

> **Salvedad:** `api.test.js` usa `jest.mock('../config/db')`; valida rutas, lógica y códigos con dobles, no persistencia real. La persistencia se verifica por humo y QA manual.

### 2.2 Frontend web — 30 pruebas / 5 suites

| Suite | Pruebas |
|---|---:|
| `helpers.test.js` | 12 |
| `api.test.js` | 6 |
| `AuthContext.test.jsx` | 5 |
| `RecuperarPassword.test.jsx` | 4 |
| `ErrorBoundary.test.jsx` | 3 |

Comando: `npm test` en `frontend_web/` (Vitest) → **30/30**, 29.4 s.

### 2.3 Móvil — 35 pruebas / 5 suites

| Suite | Pruebas |
|---|---:|
| `formateadores.test.js` | 14 |
| `api.test.js` | 8 |
| `RecuperarPasswordScreen.test.js` | 5 |
| `AuthContext.test.jsx` | 4 |
| `LoginScreen.test.js` | 4 |

Comando: `npm test` en `movil/` (Jest + RNTL) → **35/35**, 23.2 s.

## 3. Verificación manual por fases

| Fase | Módulo | Verificación |
|---|---|---|
| 1 | Autenticación | Login 200 en 4 roles; sin credenciales 400; credenciales incorrectas 401; pendiente 403; rate limit 429 |
| 2 | CRUD afiliados | Admin 200; Afiliado 403; existente 200; inexistente 404; alta 201; borrado solo Admin |
| 3 | Personal | `GET /usuarios` Admin 200; Afiliado 403 |
| 4 | Rutinas/ejercicios | Catálogos y plan de entrenamiento 200 |
| 5 | Dietas/alimentos | Catálogo, disponibles y plan nutricional 200 |
| 6 | Pagos | `GET /pagos`, por afiliado y métricas 200; sin prueba automatizada |
| 7 | Dashboard | `GET /dashboard/kpis` Admin 200; Entrenador/Afiliado 403 |
| 8 | Notificaciones | Admin y Afiliado 200 |
| 9 | Web/móvil | Render de login y flujos principales; sin E2E |
| 10 | Seed | 11 usuarios, 5 afiliados, 9 ciclos, 6 restricciones, 19 ejercicios, 20 alimentos, 27 rutinas, 9 planes, 42 pagos, 14 progresos |

Los casos manuales completos están en `documentacion/pruebas/CASOS_DE_PRUEBA_METAFIT.md`. Los casos PN/RT solo se marcan como aprobados si existe evidencia en dispositivo.

## 4. Defectos y riesgos abiertos

| ID | Severidad | Ubicación | Descripción |
|---|---|---|---|
| DEF-001 | Media | `movil/src/screens/RecuperarPasswordScreen.test.js:39` | Prueba intermitente: aislada pasa 5/5; en la línea base 2026-11-25 pasó junto con la suite. Se mantiene como riesgo de flakiness. |
| DEF-002 | Baja | `movil/src/screens/MiPerfilScreen.js:335` | Hook condicional: `useTheme` se invoca fuera del nivel superior; funciona porque la condición no cambia, pero viola las reglas de hooks. |
| DEF-003 | Baja | ESLint de `movil/` | 176 avisos, de los cuales 159 son falsos positivos por `no-undef` en globals de Jest. Requiere configurar el entorno de lint. |
| SEC-001 | **Crítica** | Repositorio/historial | Credenciales reales en documentos y en una rama de integración. No se reproducen valores. Requiere rotación y purga coordinada. Ver `SECURITY.md`. |
| SEC-002 | Alta | Configuración de práctica | API sin HTTPS directo y `CORS_ORIGINS` dependiente de una IP dinámica. Mitigar con proxy TLS e IP elástica. |
| QUA-001 | Media | Cobertura | No se mide cobertura; no se puede afirmar porcentaje de líneas/ramas. |

## 5. Evaluación ISO/IEC 25010

Escala 1–5. La evaluación es académica y conservadora; **no es una certificación**.

| Característica | Puntuación | Evidencia | Brecha principal |
|---|---:|---|---|
| Adecuación funcional | 4,7 | 91 endpoints, RBAC, 134 pruebas, QA manual | Pagos y dashboard sin automatización |
| Eficiencia de desempeño | 2,0 | Pool de conexiones, carga diferida | Sin pruebas de carga ni latencia p95 |
| Compatibilidad | 3,0 | CORS con whitelist, Docker, web/móvil | Sin matriz formal de navegadores/dispositivos |
| Usabilidad | 2,3 | Manuales, mensajes en español, tema oscuro | Sin prueba con usuarios ni accesibilidad |
| Fiabilidad | 3,0 | Transacciones, `/health`, 134/134 | Sin restore verificado ni integración con BD real |
| Seguridad | 2,8 | JWT, bcrypt, RBAC, SQL parametrizado, helmet | Secretos históricos y falta de auditoría de eventos |
| Mantenibilidad | 3,0 | MVC, 16 suites, documentación | Sin cobertura; 176 avisos de lint móvil |
| Portabilidad | 3,7 | Docker, AWS EC2, Expo/EAS | Dependencias SaaS (Render legado, Brevo, Cloudinary) |
| **Global preliminar** | **3,0** | Promedio simple de 23 métricas | Evidencia insuficiente para un nivel alto global |

> No se declara "100 %" en ninguna característica. Cada puntuación se sustenta en `MODELO_DE_CALIDAD_METAFIT.md` y `metricas_calidad_metafit.csv`.

## 6. Integración continua y despliegue

- Workflow: `.github/workflows/ci.yml`, Node 20.
- CI en `push` a `main` y `feature/juan-carvajal`, y en PR hacia `main`.
- **La rama `feature/sofia-astudillo` no dispara CI en push**; sí al abrir PR hacia `main`.
- CD del repositorio: Render (legado), condicionado a `main`.
- Despliegue vigente de la práctica: AWS EC2 `t3.micro`, Amazon Linux 2023, Docker Compose, MariaDB 11, backend `:3001`.
- Salud verificada: `GET /health` → `200`, `db: MySQL conectado`.
- CORS: orígenes permitidos → 200; desconocidos → 403; sin `Origin` → permitido.
- La IP de Learner Lab es dinámica; actualizar `CORS_ORIGINS`, `EXPO_PUBLIC_API_URL` y documentación si cambia.

## 7. Conclusión

MetaFit es funcional y demostrable: 134/134 pruebas automatizadas, 91 endpoints, RBAC en cuatro roles, transacciones y un despliegue AWS reproducible. Las brechas principales son la ausencia de medición de desempeño/cobertura, la falta de E2E, el lint móvil, el restore no verificado y la exposición histórica de secretos. Ninguna brecha impide la demostración, pero **sí impide afirmar un cumplimiento ISO/IEC 25010 certificado o un 100 % de calidad**.

## 8. Documentos relacionados

- `documentacion/pruebas/PLAN_DE_PRUEBAS_METAFIT.md`
- `documentacion/pruebas/CASOS_DE_PRUEBA_METAFIT.md`
- `documentacion/pruebas/MATRIZ_TRAZABILIDAD_PRUEBAS.md`
- `documentacion/pruebas/INFORME_EJECUCION_PRUEBAS_METAFIT.md`
- `documentacion/MODELO_DE_CALIDAD_METAFIT.md`
- `documentacion/metricas_calidad_metafit.csv`
- `documentacion/ARQUITECTURA_DESPLIEGUE_METAFIT.md`
- `SECURITY.md`
