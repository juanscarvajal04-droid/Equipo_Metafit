# Modelo de calidad — MetaFit

**Proyecto:** MetaFit — Sistema de Gestión Deportiva  
**Rama:** `feature/sofia-astudillo`  
**Fecha:** 2026-11-25  
**Marco adoptado:** ISO/IEC 25010:2011 (calidad de producto) con apoyo en la familia ISO/IEC 25000 (SQuaRE), ISO/IEC 25040 (evaluación) e ISO/IEC 25022/25023 para métricas de calidad en uso y de producto.  
**Estado:** línea base de práctica académica; **no es una certificación**.

---

## 1. Propósito y alcance

Definir las características, subcaracterísticas, métricas, metas, fuentes de evidencia y método de evaluación de la calidad de MetaFit, para que el informe de QA y los manuales usen las mismas cifras y no se declaren cumplimientos sin medición.

El modelo cubre el producto (backend, panel web, app móvil y base de datos) y su operación en AWS EC2 con Docker. No certifica accesibilidad, seguridad ofensiva ni desempeño bajo carga.

## 2. Método de evaluación

1. **Seleccionar** las características y subcaracterísticas aplicables.
2. **Definir** una métrica, fórmula, unidad, meta y fuente por subcaracterística.
3. **Medir** con evidencia reproducible (pruebas, comandos, inspección, QA).
4. **Puntuar** cada característica en escala 1–5.
5. **Registrar** brechas y acciones en `documentacion/metricas_calidad_metafit.csv`.
6. **Repetir** la medición al cierre de cada iteración.

### Escala de puntuación

| Valor | Nivel | Criterio |
|---:|---|---|
| 5 | Excelente | Meta cumplida con evidencia automatizada y repetible |
| 4 | Bueno | Meta cumplida con evidencia parcial |
| 3 | Aceptable | Funciona, pero la evidencia es cualitativa o incompleta |
| 2 | Deficiente | Brecha relevante sin mitigación |
| 1 | Crítico | Riesgo alto o ausencia total de evidencia |

## 3. Características y subcaracterísticas ISO/IEC 25010

| Característica | Subcaracterísticas aplicables | Evidencia principal |
|---|---|---|
| Adecuación funcional | Completitud, corrección, pertinencia | 91 endpoints, 134 pruebas, QA manual |
| Eficiencia de desempeño | Comportamiento temporal, utilización de recursos, capacidad | Sin pruebas de carga; pool de conexiones |
| Compatibilidad | Coexistencia, interoperabilidad | CORS, Docker, web/móvil |
| Usabilidad | Reconocibilidad, aprendibilidad, operabilidad, protección contra errores, estética, accesibilidad | Manual de usuario, QA por roles, sin prueba SUS |
| Fiabilidad | Madurez, disponibilidad, tolerancia a fallos, recuperabilidad | `/health`, transacciones, 134 pruebas, respaldo |
| Seguridad | Confidencialidad, integridad, no repudio, responsabilidad, autenticidad | JWT, bcrypt, RBAC, rate limit; secretos históricos expuestos |
| Mantenibilidad | Modularidad, reusabilidad, analizabilidad, modificabilidad, capacidad de prueba | MVC, tests, lint y documentación |
| Portabilidad | Adaptabilidad, instalabilidad, reemplazabilidad | Docker, AWS EC2, EAS, Render legado |

## 4. Métricas, metas y línea base

| ID | Característica / subcaracterística | Métrica | Fórmula | Meta | Línea base | Puntuación |
|---|---|---|---|---|---:|---:|
| Q-FUN-01 | Adecuación funcional / completitud | Cobertura funcional de módulos con prueba | módulos con prueba / módulos evaluados × 100 | ≥ 80 % | 11/15 ≈ 73 % | 4 |
| Q-FUN-02 | Adecuación funcional / corrección | Tasa de pruebas automatizadas aprobadas | aprobadas / ejecutadas × 100 | ≥ 98 % | 134/134 = 100 % | 5 |
| Q-FUN-03 | Adecuación funcional / pertinencia | Endpoints documentados | endpoints en Swagger / endpoints reales × 100 | 100 % | 91/91 = 100 % | 5 |
| Q-PER-01 | Eficiencia / comportamiento temporal | Latencia p95 de endpoints críticos | percentil 95 de tiempos | ≤ 500 ms | No medido | 2 |
| Q-PER-02 | Eficiencia / capacidad | Throughput sostenido | requests/segundo | ≥ 50 rps | No medido | 2 |
| Q-COM-01 | Compatibilidad / interoperabilidad | Matriz CORS aprobada | orígenes permitidos / orígenes probados × 100 | 100 % de los definidos | 5/6 escenarios documentados | 4 |
| Q-COM-02 | Compatibilidad / coexistencia | Navegadores/dispositivos probados | combinaciones aprobadas / planificadas × 100 | ≥ 80 % | Sin matriz formal | 2 |
| Q-USA-01 | Usabilidad / aprendibilidad | Tasa de éxito en tareas guiadas | tareas completadas / tareas propuestas × 100 | ≥ 90 % | Sin prueba con usuarios | 2 |
| Q-USA-02 | Usabilidad / protección contra errores | Validaciones con mensaje claro | campos validados / campos críticos × 100 | 100 % | Validación backend/web/móvil | 4 |
| Q-USA-03 | Usabilidad / accesibilidad | Criterios WCAG verificados | criterios cumplidos / criterios evaluados × 100 | ≥ 70 % | No evaluado | 1 |
| Q-REL-01 | Fiabilidad / disponibilidad | Disponibilidad del backend en ventana | tiempo disponible / tiempo total × 100 | ≥ 99 % | `/health` 200 en la ventana de práctica | 4 |
| Q-REL-02 | Fiabilidad / madurez | Densidad de defectos abiertos | defectos abiertos / 1.000 líneas | ≤ 2 | 3 defectos conocidos; LOC no medido | 3 |
| Q-REL-03 | Fiabilidad / recuperabilidad | Restauración verificada | pruebas de restore exitosas / programadas × 100 | 100 % | Sin evidencia de restore | 2 |
| Q-SEC-01 | Seguridad / autenticidad | Rutas protegidas con JWT | rutas protegidas / rutas privadas × 100 | 100 % | 100 % según middleware | 4 |
| Q-SEC-02 | Seguridad / confidencialidad | Secretos versionados | secretos encontrados en el árbol actual | 0 | 0 en árbol local; hallazgos históricos remotos | 1 |
| Q-SEC-03 | Seguridad / integridad | Consultas parametrizadas | consultas parametrizadas / consultas totales × 100 | 100 % | 100 % declarado | 4 |
| Q-SEC-04 | Seguridad / responsabilidad | Eventos de autenticación registrados | eventos auditados / eventos críticos × 100 | ≥ 80 % | Sin auditoría centralizada | 2 |
| Q-MAN-01 | Mantenibilidad / modularidad | Módulos con separación controller/service/model | módulos separados / módulos × 100 | 100 % | Arquitectura MVC | 5 |
| Q-MAN-02 | Mantenibilidad / capacidad de prueba | Cobertura de líneas | líneas cubiertas / líneas ejecutables × 100 | ≥ 60 % | No medida | 1 |
| Q-MAN-03 | Mantenibilidad / analizabilidad | Advertencias de lint móvil | advertencias / 1.000 líneas | ≤ 20 | 176 avisos (159 falsos positivos) | 2 |
| Q-MAN-04 | Mantenibilidad / documentación | Entregables con versión y control | documentos actualizados / documentos evaluados × 100 | 100 % | 7 documentos alineados en esta iteración | 4 |
| Q-POR-01 | Portabilidad / instalabilidad | Despliegues reproducibles | despliegues exitosos / intentos × 100 | 100 % | Docker Compose en EC2 | 4 |
| Q-POR-02 | Portabilidad / adaptabilidad | Plataformas soportadas | plataformas con build | 3 | Web, Android, Docker | 4 |
| Q-POR-03 | Portabilidad / reemplazabilidad | Dependencias de proveedor críticas | servicios acoplados / servicios totales × 100 | ≤ 30 % | Render, Brevo, Cloudinary, Expo | 3 |

> Las métricas no medidas se puntúan de forma conservadora. La línea base es una fotografía de la práctica, no un resultado certificado.

## 5. Resultado global preliminar

Promedio simple de las 23 métricas: **3,04/5** (redondeado a 3,0).  
Lectura: el producto es funcional y demostrable, con buena modularidad y pruebas de regresión, pero la evidencia de desempeño, accesibilidad, cobertura, restauración y gestión de secretos es insuficiente para declarar un nivel alto global.

| Bloque | Puntuación | Interpretación |
|---|---:|---|
| Adecuación funcional | 4,7 | Sólida; faltan pagos/dashboard en automatización |
| Eficiencia | 2,0 | Sin medición |
| Compatibilidad | 3,0 | CORS y Docker; sin matriz formal de navegadores |
| Usabilidad | 2,3 | Manuales y validaciones; sin prueba de usuarios/accesibilidad |
| Fiabilidad | 3,0 | Salud y transacciones; sin restore verificado ni integración real |
| Seguridad | 2,8 | Controles presentes; secretos históricos y falta de auditoría |
| Mantenibilidad | 3,0 | MVC y 134 pruebas; lint y cobertura pendientes |
| Portabilidad | 3,7 | Docker/EC2/EAS; dependencias SaaS |

## 6. Brechas y acciones

| Brecha | Acción | Prioridad | Evidencia de cierre |
|---|---|---|---|
| Sin cobertura | Configurar `coverage` en Jest/Vitest y publicar reporte | Alta | `coverage/` o artefacto CI |
| Sin E2E | Añadir Playwright/Detox para login, perfil, rutina y dieta | Alta | Suite E2E en CI |
| Sin rendimiento | Prueba k6 de endpoints críticos | Media | p95 y throughput reportados |
| Sin restore verificado | Ejecutar restore en EC2 y anexar acta | Alta | `INFORME_RESTORE_*.md` |
| Secretos históricos | Rotar y purgar con coordinación | Crítica | `SECURITY.md` y auditoría |
| Lint móvil | Configurar entorno Jest en ESLint | Media | `npm run lint` sin falsos positivos |
| Accesibilidad | Revisión WCAG 2.1 AA parcial | Media | Checklist y capturas |
| QA manual PN/RT | Ejecutar en dispositivo y anexar evidencia | Alta | Capturas, fecha, APK |

## 7. Relación con otros documentos

- `documentacion/INFORME_CALIDAD_QA_ISO25010.md`: informe de QA y resultados.
- `documentacion/metricas_calidad_metafit.csv`: registro medible.
- `documentacion/pruebas/`: plan, casos, matriz y evidencia.
- `documentacion/entregables/Manual_Tecnico_MetaFit.docx`: §29 ISO/IEC 25010.
- `documentacion/ARQUITECTURA_DESPLIEGUE_METAFIT.md`: operación AWS EC2.
- `SECURITY.md`: tratamiento de secretos y rotación.

## 8. Declaración de honestidad

Este modelo **no** afirma cumplimiento certificado de ISO/IEC 25010. Presenta una evaluación académica con evidencia verificable y brechas explícitas. Cualquier afirmación de "100 %" debe sustituirse por la métrica y la fuente correspondientes.
