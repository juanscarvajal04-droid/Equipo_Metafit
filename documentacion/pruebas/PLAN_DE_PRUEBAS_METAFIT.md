# Plan de pruebas — MetaFit

**Proyecto:** MetaFit — Sistema de Gestión Deportiva  
**Rama:** `feature/sofia-astudillo`  
**HEAD de referencia:** `d12875c`  
**Fecha de actualización:** 2026-11-25  
**Alcance:** backend Node.js/Express, panel web React/Vite, app móvil Expo/React Native, base de datos MariaDB 11 y despliegue AWS EC2 con Docker.

> Este plan documenta las pruebas existentes y las brechas pendientes. No modifica la lógica de la API, la base de datos ni la app móvil.

---

## 1. Objetivo

Establecer la estrategia, los niveles, las técnicas, los casos, la matriz de trazabilidad y la evidencia de ejecución de las pruebas de MetaFit, de modo que los resultados sean reproducibles y sustentables ante la práctica académica.

## 2. Alcance

| Elemento | Incluido |
|---|---|
| Backend | Rutas REST, autenticación, RBAC, validaciones, recuperación de contraseña, CORS y lógica de servicios |
| Panel web | Helpers, cliente API, AuthContext, ErrorBoundary y recuperación de contraseña |
| App móvil | Helpers de formato, cliente API, AuthContext, Login y recuperación de contraseña |
| Base de datos | Esquema, scripts `01` a `05`, datos seed y vistas (verificación documental) |
| Despliegue | Salud del backend en AWS EC2, contenedores y CORS |
| QA manual | Flujos por rol y fases funcionales documentadas en `INFORME_CALIDAD_QA_ISO25010.md` |
| Fuera de alcance | Pruebas de carga formales, penetración, accesibilidad certificada y compatibilidad exhaustiva de dispositivos |

## 3. Referencias

- `documentacion/INFORME_CALIDAD_QA_ISO25010.md`
- `documentacion/CASOS_DE_PRUEBA_METAFIT.md`
- `documentacion/MATRIZ_TRAZABILIDAD_PRUEBAS.md`
- `documentacion/INFORME_EJECUCION_PRUEBAS_METAFIT.md`
- `documentacion/entregables/Informe - documentar tareas de prueba.docx`
- `backend/__tests__/`, `frontend_web/src/**/__tests__/`, `movil/src/**/__tests__/`
- `.github/workflows/ci.yml`

## 4. Estrategia

Se aplica una estrategia por niveles y por riesgo:

1. **Unitarias:** funciones puras, normalización de fechas, objetivos, formateadores y mapas de comida.
2. **Integración HTTP:** rutas con Supertest y dobles de la base de datos; se valida contrato, códigos HTTP, RBAC y errores.
3. **Componentes/UI:** renderizado y comportamiento de AuthContext, Login, recuperación y ErrorBoundary con Testing Library/RNTL.
4. **QA manual funcional:** flujos completos por rol (Administrador, Recepcionista, Entrenador y Afiliado), con evidencia documental.
5. **Humo de despliegue:** `/health`, conectividad externa y matriz CORS en AWS EC2.

La prioridad es cubrir primero autenticación, autorización, afiliados, planes, pagos y recuperación de contraseña, por ser los flujos de mayor impacto.

## 5. Niveles y técnicas

| Nivel | Técnica | Herramienta | Evidencia |
|---|---|---|---|
| Unitario | Caja blanca, particiones de equivalencia y valores límite | Jest, Vitest | 3 suites unitarias de backend; helpers/formateadores |
| Integración | Caja negra sobre HTTP, dobles de BD | Supertest + Jest | 5 suites de API/servicios |
| Componentes | Caja negra de UI, eventos y estados | React Testing Library / RNTL | 6 suites de UI |
| Manual funcional | Guiones por rol, datos de prueba y observación | Navegador, Expo/Android, Postman | QA en 10 fases |
| Despliegue | Humo, salud y CORS | `curl`/PowerShell, Docker | `/health` 200 y matriz CORS |
| Regresión | Ejecución completa antes de integrar | Jest/Vitest | 134/134 en la ejecución de referencia |

### Técnicas aún no implementadas

- **E2E automatizado:** no hay Detox, Maestro, Appium ni Playwright configurado.
- **Rendimiento/carga:** no hay k6, Artillery ni JMeter.
- **Integración con MariaDB real:** las pruebas de API simulan la base de datos.
- **Cobertura:** no hay reporte de cobertura ni umbral configurado.
- **Seguridad automatizada:** no hay escaneo de secretos/SAST en CI.

Estas brechas se registran como deuda de calidad y no se presentan como pruebas ejecutadas.

## 6. Ambientes

| Ambiente | Backend | BD | Uso |
|---|---|---|---|
| Local sin Docker | `http://localhost:3001` | MariaDB local | Desarrollo |
| Local con Docker | `http://localhost:3001` | `metafit_db` (MariaDB 11) | Demo y QA local |
| AWS EC2 | `http://<IP_PUBLICA_EC2>:3001` | Contenedor `metafit_db` | Práctica actual |
| CI | Node 20, servicios simulados | Dobles de prueba | Regresión automatizada |

La IP pública es dinámica en AWS Academy Learner Lab. La documentación usa `<IP_PUBLICA_EC2>` como marcador y la app móvil toma la URL de `EXPO_PUBLIC_API_URL`.

## 7. Datos de prueba

- Las pruebas automatizadas usan datos controlados y mocks; no contienen credenciales reales.
- La base de datos de práctica se inicializa con `database/01_estructura.sql` a `05_password_reset.sql`.
- Las cuentas seed permiten validar los cuatro roles, pero sus contraseñas no se versionan en este plan.
- Para producción se deben rotar las cuentas seed y entregar credenciales por un canal seguro.

## 8. Criterios de entrada

- Código de la rama actual disponible y dependencias instaladas.
- `npm test` ejecutable en `backend/`, `frontend_web/` y `movil/`.
- Backend accesible en `/health` para pruebas de humo.
- Base de datos inicializada para pruebas manuales.
- Datos de prueba cargados.

## 9. Criterios de salida

- 100 % de las suites automatizadas en verde o defecto documentado.
- Evidencia de ejecución con fecha, entorno y comandos.
- Casos manuales críticos ejecutados o marcados explícitamente como pendientes.
- Defectos conocidos con severidad, ubicación y mitigación.
- Matriz de trazabilidad actualizada.

## 10. Roles y responsabilidades

| Rol | Responsabilidad |
|---|---|
| Líder técnico | Define alcance, aprueba criterios y revisa evidencias |
| Desarrollador backend | Mantiene pruebas de API y servicios |
| Desarrollador web | Mantiene pruebas de componentes y cliente API |
| Desarrollador móvil | Mantiene pruebas de pantallas y cliente API |
| QA / documentador | Ejecuta QA manual y consolida evidencia |
| Responsable de despliegue | Verifica `/health`, CORS y conectividad en EC2 |

## 11. Cronograma

| Actividad | Responsable | Momento |
|---|---|---|
| Pruebas unitarias e integración | Equipo de desarrollo | Cada cambio |
| Pruebas de componentes | Equipo web/móvil | Cada cambio de UI |
| Regresión completa | Líder técnico | Antes de PR/entrega |
| QA manual por roles | QA/documentador | Antes de la sustentación |
| Humo de despliegue y CORS | Responsable de despliegue | Después de cada despliegue |
| Actualización de evidencia | QA/documentador | Al cierre de cada iteración |

## 12. Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Pruebas de API con BD simulada | No detectan errores de persistencia | Documentar y ejecutar humo/QA con MariaDB real |
| Prueba móvil flaky (`RecuperarPasswordScreen`) | Falso negativo en CI | Reintento controlado o aislamiento; no ocultar el defecto |
| Falta de E2E | Regresiones de navegación | Priorizar Playwright/Detox en la siguiente iteración |
| Secretos en documentación histórica | Compromiso de credenciales | Rotar, sanear y no reproducir valores; ver `SECURITY.md` |
| IP pública dinámica | App móvil apunta a una IP vieja | Documentar actualización de IP/CORS y usar IP elástica si es posible |
| Falta de cobertura | Zonas sin prueba | Medir cobertura y fijar umbral incremental |

## 13. Métricas

- Pruebas automatizadas: **134** (69 backend + 30 web + 35 móvil).
- Suites: **16** (6 backend + 5 web + 5 móvil).
- Resultado de referencia: **134/134**.
- QA manual documentado: **51 casos** en 10 fases.
- Cobertura: **no medida**.
- E2E: **no implementado**.
- Rendimiento: **no medido**.

## 14. Entregables de prueba

1. Este plan.
2. Casos de prueba.
3. Matriz de trazabilidad.
4. Informe de ejecución.
5. Informe de pruebas funcionales (DOCX).
6. Evidencia de `/health` y CORS.
7. Registro de defectos conocidos.
