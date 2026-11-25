# Seguridad — MetaFit

**Rama de trabajo:** `feature/sofia-astudillo`  
**Fecha:** 2026-11-25  
**Alcance:** prácticas seguras del repositorio y del despliegue AWS EC2.

> Este documento no contiene credenciales. Los valores reales deben permanecer en el entorno seguro de la práctica.

---

## 1. Política de secretos

- No versionar `.env`, `.env.prod`, claves privadas, tokens ni capturas con credenciales.
- Usar `.env.example` y `deploy/.env.prod.example` con marcadores `<CAMBIAR_...>`.
- Mantener `.env` y `.env.prod` con permisos `600` en el servidor.
- No pegar secretos en issues, PRs, chats, capturas ni documentación.
- Rotar cualquier secreto que haya estado expuesto en un repositorio público o en un archivo compartido.

Variables sensibles principales:

- `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD`.
- `JWT_SECRET`.
- `BREVO_API_KEY`, `SMTP_PASS`.
- `CLOUDINARY_API_SECRET`.
- Credenciales de usuarios seed y cuentas administrativas.

## 2. Hallazgos históricos

La auditoría identificó archivos antiguos en ramas remotas e historial que contienen credenciales reales, incluido un informe de despliegue y un `.env` de una rama de integración. **No se reproducen valores en este documento.**

Acciones obligatorias, coordinadas con el equipo:

1. Rotar contraseña de base de datos y `JWT_SECRET`.
2. Rotar usuarios seed y cuentas administrativas de producción.
3. Retirar los archivos sensibles del tracking y purgar el historial con `git filter-repo` o BFG, con respaldo y coordinación.
4. Invalidar tokens emitidos antes de rotar `JWT_SECRET`.
5. Revisar forks, cachés y artefactos de GitHub; la rotación es la mitigación definitiva.

> La limpieza de historial no se ejecutó en esta rama. Requiere autorización explícita y coordinación del equipo.

## 3. Controles implementados

- JWT con expiración de 8 h.
- bcrypt con 12 rondas.
- RBAC por rol (`Administrador`, `Recepcionista`, `Entrenador`, `Afiliado`).
- Rate limiting en login.
- Helmet y límite de payload.
- Consultas SQL parametrizadas.
- CORS con whitelist y orígenes de desarrollo controlados.
- Recuperación de contraseña con token de un uso y expiración.
- Contenedor MariaDB sin puerto público en producción.

## 4. Controles pendientes

| Control | Estado | Acción |
|---|---|---|
| Escaneo de secretos en CI (gitleaks/trufflehog) | Pendiente | Añadir job al workflow |
| Dependabot / revisión de dependencias | Pendiente | Activar en GitHub |
| HTTPS en API | Pendiente | Proxy TLS o dominio con certificado |
| Auditoría de eventos de autenticación | Pendiente | Registro centralizado |
| Prueba CORS negativa automatizada | Pendiente | Descomentar/implementar caso 403 |
| Restore verificado | Pendiente | Ejecutar y anexar acta |
| Rotación periódica de secretos | Pendiente | Calendario y responsable |

## 5. Checklist antes de commit/push

- [ ] `git diff` no incluye `.env`, claves ni tokens.
- [ ] Los documentos nuevos usan marcadores, no credenciales.
- [ ] `README.md` no publica contraseñas.
- [ ] `.gitignore` cubre `.env*`, claves y respaldos.
- [ ] `npm test` pasa en backend, web y móvil.
- [ ] El cambio se limita a la rama actual.
- [ ] No se modificó `main` ni se reescribió el historial.
- [ ] No se alteró la configuración Oracle de `main`.

## 6. Reporte responsable

Para reportar una exposición:

1. No crear un issue público con el secreto.
2. Notificar al líder técnico por canal privado.
3. Rotar el secreto afectado.
4. Documentar el incidente sin incluir el valor.
5. Revisar si el secreto aparece en otras ramas, artefactos o documentación.

## 7. Referencias

- `SECURITY.md` (este documento)
- `CONTRIBUTING.md`
- `deploy/RUNBOOK_DESPLIEGUE_EC2.md`
- `documentacion/ARQUITECTURA_DESPLIEGUE_METAFIT.md`
- `documentacion/MODELO_DE_CALIDAD_METAFIT.md`
