# Entregables — MetaFit

**Rama:** `feature/sofia-astudillo`  
**Fecha de alineación:** 2026-11-25  
**Arquitectura vigente:** AWS EC2 + Docker + MariaDB

---

## 1. Índice de entregables

| # | Documento | Tipo | Estado | Versión / fecha |
|---|---|---|---|---|
| 1 | `Plan_de_Instalacion_MetaFit.docx` | Plan | Alineado a AWS EC2 | 2026-11-25 |
| 2 | `Plan_de_Respaldo_Datos_MetaFit.docx` | Plan | Alineado a volumen Docker/EBS | 2026-11-25 |
| 3 | `Plan_de_Migracion_Carga_MetaFit.docx` | Plan | Alineado a entornos AWS | 2026-11-25 |
| 4 | `Plan_de_Capacitacion_MetaFit.docx` | Plan | Con cápsula técnica AWS | 2026-11-25 |
| 5 | `Manual_de_Instalacion_MetaFit.docx` | Manual | Instalación AWS/EAS | 2026-11-25 |
| 6 | `Manual_Tecnico_MetaFit.docx` | Manual | 134 tests, 91 endpoints, AWS | 2026-11-25 |
| 7 | `Manual_de_Usuario_MetaFit.docx` | Manual | Sin credenciales; entorno AWS/local | 2026-11-25 |
| 8 | `Informe - documentar tareas de prueba.docx` | Informe | Casos + evidencia | 2026-11-25 |
| 9 | `Diagrama_de_Despliegue_MetaFit.drawio` | Diagrama | 4 páginas (3 previas + AWS) | 2026-11-25 |
| 10 | `Auditoria_Despliegue_MetaFit_EC2.docx` | Auditoría | **Sensible: no compartir** | 2026-11-25 |

## 2. Fuentes de verdad

| Tema | Documento de referencia |
|---|---|
| Estrategia y casos de prueba | `documentacion/pruebas/PLAN_DE_PRUEBAS_METAFIT.md` |
| Casos y datos de prueba | `documentacion/pruebas/CASOS_DE_PRUEBA_METAFIT.md` |
| Trazabilidad | `documentacion/pruebas/MATRIZ_TRAZABILIDAD_PRUEBAS.md` |
| Evidencia de ejecución | `documentacion/pruebas/INFORME_EJECUCION_PRUEBAS_METAFIT.md` |
| Calidad ISO/IEC 25010 | `documentacion/MODELO_DE_CALIDAD_METAFIT.md` |
| Métricas | `documentacion/metricas_calidad_metafit.csv` |
| Arquitectura AWS | `documentacion/ARQUITECTURA_DESPLIEGUE_METAFIT.md` |
| Operación EC2 | `deploy/RUNBOOK_DESPLIEGUE_EC2.md` |
| Seguridad | `SECURITY.md` |
| Control de versiones | `documentacion/CONTROL_DE_VERSIONES_METAFIT.md` |

## 3. Advertencias

- El informe de auditoría contiene hallazgos sensibles; **no debe publicarse** ni adjuntarse en entregas abiertas.
- Los documentos no deben contener contraseñas, tokens ni claves. Usar marcadores `<CAMBIAR_...>`.
- Las cifras de pruebas y endpoints deben coincidir con `INFORME_EJECUCION_PRUEBAS_METAFIT.md` y `Manual_Tecnico_MetaFit.docx`.
- La IP de Learner Lab es dinámica; verificar antes de una demostración.
- Los casos manuales PN/RT solo se marcan como aprobados si existe evidencia de ejecución.

## 4. Checklist de entrega

- [ ] Los 10 archivos abren sin errores.
- [ ] No hay credenciales en texto, tablas, notas, cabeceras ni imágenes.
- [ ] Las cifras son coherentes entre manuales e informe.
- [ ] El diagrama incluye AWS EC2, Docker, MariaDB y app móvil.
- [ ] El informe de pruebas incluye fecha, entorno, resultados y limitaciones.
- [ ] El PDF/entrega final se genera desde la versión revisada.
