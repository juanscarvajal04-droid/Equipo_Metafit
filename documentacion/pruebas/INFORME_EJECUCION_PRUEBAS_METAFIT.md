# Informe de ejecución de pruebas — MetaFit

**Fecha de ejecución:** 2026-11-25  
**Rama:** `feature/sofia-astudillo`  
**HEAD:** `d12875c`  
**Entorno local:** Windows 11, Node.js `v24.14.1`  
**Entorno CI:** Node.js 20 (`.github/workflows/ci.yml`)  
**Alcance:** suites automatizadas de backend, panel web y app móvil; humo de despliegue AWS EC2.

---

## 1. Resultado global

| Suite | Archivos | Pruebas | Resultado | Tiempo aproximado |
|---|---:|---:|---|---:|
| Backend | 6 | 69 | **69/69** | 37.9 s |
| Frontend web | 5 | 30 | **30/30** | 29.4 s |
| App móvil | 5 | 35 | **35/35** | 23.2 s |
| **Total** | **16** | **134** | **134/134** | — |

**Conclusión:** la regresión automatizada completa pasa. Los resultados son reproducibles con los comandos de la sección 2.

## 2. Comandos ejecutados

### Backend

```bash
cd backend
npm test
# jest --runInBand --forceExit
```

Salida resumida:

```text
Test Suites: 6 passed, 6 total
Tests:       69 passed, 69 total
Time:        37.882 s
```

### Panel web

```bash
cd frontend_web
npm test
# vitest run
```

Salida resumida:

```text
Test Files  5 passed (5)
Tests       30 passed (30)
Duration    29.36s
```

### App móvil

```bash
cd movil
npm test
# jest
```

Salida resumida:

```text
Test Suites: 5 passed, 5 total
Tests:       35 passed, 35 total
Time:        23.247 s
```

## 3. Evidencia de despliegue

| Verificación | Comando / URL | Resultado |
|---|---|---|
| Salud backend EC2 | `GET http://<IP_PUBLICA_EC2>:3001/health` | `200`, `{"status":"ok","db":"MySQL conectado"}` |
| Contenedores | `docker compose -f docker-compose.prod.yml ps` | `metafit_db` healthy, `metafit_backend` activo |
| CORS origen permitido | `Origin: http://localhost:8081` | Permitido |
| CORS origen de producción | `Origin: http://<IP_PUBLICA_EC2>:5173` | Permitido si está en `CORS_ORIGINS` |
| CORS origen desconocido | `Origin: http://evil.example` | `403` |
| Request sin `Origin` | `curl`/Postman | Permitido |
| App móvil | `EXPO_PUBLIC_API_URL` | Apunta a `http://<IP_PUBLICA_EC2>:3001` |

La IP pública de AWS Academy Learner Lab puede cambiar al reiniciar la sesión. En la ejecución de referencia se usó la IP asignada en ese momento; no se versiona como valor fijo.

## 4. Advertencias observadas

- Backend: Jest forzó la salida con `--forceExit`; no se detectaron fallos, pero se recomienda revisar handles abiertos.
- Móvil: React Testing Library emitió advertencias `act(...)` durante la ejecución; no produjeron fallos.
- La suite móvil de recuperación de contraseña tiene historial de intermitencia (`DEF-001`); en esta ejecución pasó.
- Las pruebas de API usan dobles de la base de datos; no validan persistencia real.
- No se generó reporte de cobertura.

## 5. Limitaciones

| Limitación | Efecto en la evidencia |
|---|---|
| Sin E2E automatizado | No se prueba la navegación completa en navegador/dispositivo |
| Sin pruebas de carga | No hay latencia, throughput ni concurrencia medidas |
| Sin integración con MariaDB real en CI | La persistencia se valida por QA manual y humo |
| Sin cobertura | No se puede afirmar un porcentaje de líneas/ramas |
| Casos PN/RT sin ejecución en dispositivo | Evidencia manual pendiente; no se reportan como aprobados |

## 6. Reproducción

1. Instalar Node.js 20 o superior y dependencias con `npm ci` en cada componente.
2. Ejecutar `npm test` en `backend/`, `frontend_web/` y `movil/`.
3. Para el humo, verificar `/health` en la instancia EC2 y la matriz CORS.
4. Para QA manual, usar los cuatro roles seed y registrar fecha, usuario, versión de APK y captura.

## 7. Artefactos

- `documentacion/pruebas/PLAN_DE_PRUEBAS_METAFIT.md`
- `documentacion/pruebas/CASOS_DE_PRUEBA_METAFIT.md`
- `documentacion/pruebas/MATRIZ_TRAZABILIDAD_PRUEBAS.md`
- `documentacion/entregables/Informe - documentar tareas de prueba.docx`
- `documentacion/INFORME_CALIDAD_QA_ISO25010.md`

> Los logs completos de Jest/Vitest no se versionan para evitar ruido y datos de entorno; los comandos y resúmenes anteriores permiten reproducirlos.
