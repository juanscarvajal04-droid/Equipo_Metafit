# Casos de prueba — MetaFit

**Fecha:** 2026-11-25  
**Rama:** `feature/sofia-astudillo`  
**Referencia:** `d12875c`  
**Resultado automatizado de referencia:** 134/134 pruebas en verde.

> Los casos manuales no se marcan como aprobados si no fueron ejecutados en esta sesión. La columna **Estado** distingue evidencia automatizada, documental y pendiente.

---

## 1. Inventario de suites automatizadas

| ID | Suite | Nivel / técnica | Casos | Resultado |
|---|---|---|---:|---|
| AUT-BE-01 | `backend/__tests__/api.test.js` | Integración HTTP / caja negra | 13 | 13/13 |
| AUT-BE-02 | `backend/__tests__/fase1.test.js` | Integración HTTP / caja negra | 13 | 13/13 |
| AUT-BE-03 | `backend/__tests__/fase2.test.js` | Integración HTTP / caja negra | 10 | 10/10 |
| AUT-BE-04 | `backend/__tests__/faseA.test.js` | Integración HTTP / caja negra | 15 | 15/15 |
| AUT-BE-05 | `backend/__tests__/afiliadoService.test.js` | Unitaria / caja blanca | 11 | 11/11 |
| AUT-BE-06 | `backend/__tests__/objetivoUtils.test.js` | Unitaria / caja blanca | 7 | 7/7 |
| AUT-WEB-01 | `frontend_web/src/utils/__tests__/helpers.test.js` | Unitaria | 12 | 12/12 |
| AUT-WEB-02 | `frontend_web/src/services/__tests__/api.test.js` | Unitaria de cliente HTTP | 6 | 6/6 |
| AUT-WEB-03 | `frontend_web/src/context/__tests__/AuthContext.test.jsx` | Componente | 5 | 5/5 |
| AUT-WEB-04 | `frontend_web/src/views/__tests__/RecuperarPassword.test.jsx` | Componente | 4 | 4/4 |
| AUT-WEB-05 | `frontend_web/src/components/__tests__/ErrorBoundary.test.jsx` | Componente | 3 | 3/3 |
| AUT-MOV-01 | `movil/src/utils/__tests__/formateadores.test.js` | Unitaria | 14 | 14/14 |
| AUT-MOV-02 | `movil/src/services/__tests__/api.test.js` | Unitaria de cliente HTTP | 8 | 8/8 |
| AUT-MOV-03 | `movil/src/screens/__tests__/RecuperarPasswordScreen.test.js` | Componente / navegación | 5 | 5/5 |
| AUT-MOV-04 | `movil/src/context/__tests__/AuthContext.test.jsx` | Componente | 4 | 4/4 |
| AUT-MOV-05 | `movil/src/screens/__tests__/LoginScreen.test.js` | Componente | 4 | 4/4 |
| **Total** | **16 suites** | — | **134** | **134/134** |

## 2. Casos automatizados representativos

| ID | Módulo | Caso | Resultado esperado | Evidencia | Estado |
|---|---|---|---|---|---|
| CP-AUT-01 | Autenticación | Login con credenciales válidas | 200 + token | `api.test.js` | Aprobado |
| CP-AUT-02 | Autenticación | Login sin token en ruta protegida | 401 | `api.test.js`, `fase1.test.js` | Aprobado |
| CP-AUT-03 | Autorización | Afiliado intenta crear afiliado | 403 | `api.test.js` | Aprobado |
| CP-AUT-04 | Autorización | Entrenador intenta editar afiliado | 403 | `api.test.js` | Aprobado |
| CP-AUT-05 | Autorización | Recepcionista pasa RBAC de edición | No 403 | `api.test.js` | Aprobado |
| CP-AUT-06 | Recuperación | Email válido solicita token | 200 + token en modo prueba | `api.test.js` | Aprobado |
| CP-AUT-07 | Recuperación | Email inexistente no revela existencia | 200 genérico | `api.test.js` | Aprobado |
| CP-AUT-08 | Recuperación | Token usado no se reutiliza | 400 | `api.test.js` | Aprobado |
| CP-AFI-01 | Afiliados | Consulta de ejercicios disponibles | 200 + array | `api.test.js` | Aprobado |
| CP-AFI-02 | Afiliados | Actualización de perfil propio | 200 + IMC | `faseA.test.js` | Aprobado |
| CP-AFI-03 | Afiliados | Correo duplicado | 409 | `faseA.test.js` | Aprobado |
| CP-AFI-04 | Afiliados | Peso fuera de rango | 400 | `faseA.test.js` | Aprobado |
| CP-AFI-05 | Afiliados | Consumo de alimento calcula macros Atwater | Valores coherentes | `faseA.test.js` | Aprobado |
| CP-AFI-06 | Afiliados | Rutina del día filtra por grupo muscular | Solo grupo del día | `faseA.test.js` | Aprobado |
| CP-AFI-07 | Afiliados | Ciclo ajeno en registro de ejercicio | 403 | `fase1.test.js` | Aprobado |
| CP-AFI-08 | Afiliados | Registro de ejercicio sin datos | 400 | `fase1.test.js` | Aprobado |
| CP-CAT-01 | Catálogos | Crear restricción como Admin | 201/200 + id | `fase2.test.js` | Aprobado |
| CP-CAT-02 | Catálogos | Restricción duplicada | 400 | `fase2.test.js` | Aprobado |
| CP-CAT-03 | Catálogos | Eliminar restricción referenciada | 409 | `fase2.test.js` | Aprobado |
| CP-CAT-04 | Catálogos | Actualizar restricción inexistente | 404 | `fase2.test.js` | Aprobado |
| CP-PRO-01 | Progreso | Resumen diario sin token | 401 | `fase1.test.js` | Aprobado |
| CP-PRO-02 | Progreso | Actualizar energía y ánimo | 200 | `fase1.test.js` | Aprobado |
| CP-PRO-03 | Progreso | Actualizar sin fecha | 400 | `fase1.test.js` | Aprobado |
| CP-UTI-01 | Utilidades | Fecha `DD/MM/YYYY` a ISO | `YYYY-MM-DD` | `afiliadoService.test.js` | Aprobado |
| CP-UTI-02 | Utilidades | Fecha inválida | Error controlado | `afiliadoService.test.js` | Aprobado |
| CP-UTI-03 | Utilidades | Objetivo con tilde | ENUM canónico | `objetivoUtils.test.js` | Aprobado |
| CP-WEB-01 | Web | Token en localStorage se adjunta | Header Bearer | `api.test.js` | Aprobado |
| CP-WEB-02 | Web | 401 en ruta protegida limpia sesión | Redirección a login | `api.test.js` | Aprobado |
| CP-WEB-03 | Web | 401 en login no limpia sesión | Sesión intacta | `api.test.js` | Aprobado |
| CP-WEB-04 | Web | AuthProvider restaura sesión | Estado recuperado | `AuthContext.test.jsx` | Aprobado |
| CP-WEB-05 | Web | ErrorBoundary captura excepción | Mensaje de error | `ErrorBoundary.test.jsx` | Aprobado |
| CP-WEB-06 | Web | Recuperación muestra token de prueba | Token visible | `RecuperarPassword.test.jsx` | Aprobado |
| CP-MOV-01 | Móvil | Login válido persiste token | Estado + AsyncStorage | `AuthContext.test.jsx` | Aprobado |
| CP-MOV-02 | Móvil | Login inválido no persiste sesión | Error propagado | `AuthContext.test.jsx` | Aprobado |
| CP-MOV-03 | Móvil | 401 fuera de login limpia claves | Limpieza | `api.test.js` | Aprobado |
| CP-MOV-04 | Móvil | 401 en login no limpia sesión | Sesión intacta | `api.test.js` | Aprobado |
| CP-MOV-05 | Móvil | Validación de campos vacíos | Mensaje de validación | `LoginScreen.test.js` | Aprobado |
| CP-MOV-06 | Móvil | Navegación a recuperación | Pantalla destino | `RecuperarPasswordScreen.test.js` | Aprobado |
| CP-MOV-07 | Móvil | Formato de fecha sin desfase | `DD/MM/YYYY` | `formateadores.test.js` | Aprobado |
| CP-MOV-08 | Móvil | Cálculo de IMC coherente | Mismo resultado del backend | `formateadores.test.js` | Aprobado |

## 3. QA manual por fases

Estos 51 casos provienen del informe canónico de QA. Se documentan como evidencia funcional; no todos se reejecutaron en esta sesión.

| Fase | Módulo | Casos | Resultado documentado |
|---|---|---:|---|
| 1 | Autenticación | 6 | 6/6 documentados |
| 2 | CRUD de afiliados | 7 | 7/7 documentados |
| 3 | Gestión de personal | 5 | 5/5 documentados |
| 4 | Rutinas y ejercicios | 6 | 6/6 documentados |
| 5 | Dietas y alimentos | 5 | 5/5 documentados |
| 6 | Pagos | 4 | 4/4 documentados |
| 7 | Dashboard | 3 | 3/3 documentados |
| 8 | Notificaciones | 3 | 3/3 documentados |
| 9 | Frontend web | 7 | 7/7 documentados |
| 10 | Base de datos / seed | 5 | 5/5 documentados |
| **Total** | — | **51** | **51 casos documentados** |

## 4. Casos manuales pendientes de dispositivo

El informe `Informe - documentar tareas de prueba.docx` conserva los casos del Sprint 1 para los flujos de plan nutricional y rutina.

| ID | Caso | Resultado esperado | Estado |
|---|---|---|---|
| PN-01 | Acceso al plan nutricional | Se muestra el plan asignado | Pendiente en dispositivo; API cubierta por pruebas de `/me` |
| PN-02 | Navegación entre días | Información del día seleccionado | Pendiente en dispositivo |
| PN-03 | Expandir comidas | Alimentos de la comida | Pendiente en dispositivo |
| PN-04 | Resumen de macronutrientes | Macros correctos | Pendiente en dispositivo; cálculo cubierto por backend |
| RT-01 | Acceso a la rutina | Rutina correspondiente | Pendiente en dispositivo |
| RT-02 | Navegación entre días | Ejercicios del día | Pendiente en dispositivo |
| RT-03 | Expandir ejercicios | Información del ejercicio | Pendiente en dispositivo |
| RT-04 | Marcar ejercicio completado | Registro visual | Pendiente en dispositivo; endpoint cubierto por API |

> No se inventan resultados. La validación manual en emulador/dispositivo debe anexarse con captura, fecha, usuario y versión del APK.

## 5. Casos de despliegue

| ID | Verificación | Comando / URL | Resultado esperado | Estado |
|---|---|---|---|---|
| CP-DEP-01 | Salud del backend EC2 | `GET http://<IP_PUBLICA_EC2>:3001/health` | `status: ok` y MySQL conectado | Verificado 2026-11-25 |
| CP-DEP-02 | Contenedores activos | `docker compose -f docker-compose.prod.yml ps` | `metafit_db` healthy y `metafit_backend` up | Verificado en despliegue |
| CP-DEP-03 | CORS origen permitido | `Origin: http://localhost:8081` | 200 | Verificado |
| CP-DEP-04 | CORS origen desconocido | `Origin: http://evil.example` | 403 | Verificado |
| CP-DEP-05 | Request sin Origin | `curl`/Postman | Permitido | Verificado |
| CP-DEP-06 | App móvil apunta a EC2 | `EXPO_PUBLIC_API_URL` | URL de EC2 | Verificado en `.env` local |

## 6. Defectos conocidos

| ID | Severidad | Ubicación | Descripción | Estado |
|---|---|---|---|---|
| DEF-001 | Media | `movil/src/screens/RecuperarPasswordScreen.test.js` | Prueba flaky al ejecutar la suite completa; en la última ejecución pasó 5/5 | Abierto como riesgo |
| DEF-002 | Baja | `movil/src/screens/MiPerfilScreen.js` | Hook condicional; funciona pero viola reglas de hooks | Abierto |
| DEF-003 | Baja | Configuración ESLint móvil | 176 avisos, mayoría falsos positivos por globals Jest | Abierto |
| DEF-004 | Alta | Documentación/repositorio histórico | Credenciales expuestas en archivos antiguos; no se reproducen aquí | Requiere rotación y saneamiento |
