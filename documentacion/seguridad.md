# 🔐 Seguridad — Rotación de credenciales y medidas vigentes

> MetaFit usa credenciales activas que **deben rotarse de forma periódica** (y con urgencia si
> este repo se hace público o se comparte fuera del equipo). Este documento lista qué rotar,
> cómo hacerlo y qué está protegido hoy.

---

## 1. Estado actual de las credenciales (22-sep-2026)

| # | Credencial | Estado | Dónde se usa |
|---|---|---|---|
| 1 | **Render API token** (`rnd_...`) | 🟥 Activa — **rotar** | API de Render (deploys/env vars) |
| 2 | **GitHub token** (`ghp_...`) | 🟥 Activa — **rotar** | Push/automation, CI |
| 3 | **Dokploy API key / acceso** | 🟥 Activa — **rotar** | Administración del VPS |
| 4 | **SSH key del VPS Oracle** | ⚪ No disponible localmente | No se guarda en el repo |
| 5 | **Cloudinary API secret** | 🟥 Activa — **rotar** | Subida/gestión de fotos (`llaq9vyl`) |
| 6 | **MySQL VPS** (`metafit` / `Admin123!`) | 🟡 En uso — considerar `mysql_native_password` + host restringido | Backend Render + Adminer |
| 7 | **JWT_SECRET** (backend Render) | 🟡 Activo | Firma de tokens JWT |
| 8 | **BREVO_API_KEY** | 🟥 **Inválida (HTTP 401)** — regenerar | API de Brevo (emails) |
| 9 | **BREVO SMTP relay** (`smtp-relay.sendinblue.com`, user `b4e3d9001@smtp-brevo.com`) | 🟢 **Válida** (AUTH `235`) | Fallback de correos = canal actual |
| 10 | **Bot token de Telegram (n8n)** | 🟥 **Placeholder / no configurado** | Flujo n8n Telegram (local) |
| 11 | **Adminer** (`metafit` / `Admin123!`) | 🟡 En uso | Adminer público en Render |

> 🟢 verificada · 🟡 en uso (recomendable rotar) · 🟥 rotar o regenerar pendiente.

---

## 2. Procedimientos de rotación

### 2.1 Render API token
1. Abrir → `https://dashboard.render.com/account/api-keys`
2. Crear un nuevo token con los mismos permisos, copiarlo, y **revocar el anterior**.
3. Actualizar cualquier flujo que lo consuma (scripts, CI).

### 2.2 GitHub token (PAT)
1. Settings → *Developer settings → Personal access tokens → Tokens (classic)*.
2. Generar uno nuevo (solo los scopes necesarios: `repo`), usar el nuevo y **revocar el viejo**.

### 2.3 Dokploy API key (VPS)
1. En el dashboard de Dokploy del VPS (`http://141.148.94.173:3000`) → *Settings → API Keys*.
2. Generar y revocar la anterior.

### 2.4 SSH del VPS Oracle
- Regenerar el par de llaves en el panel de Oracle Cloud (Console → Compute → Instances → Keys) y
  actualizar `~/.ssh/authorized_keys`. No se almacena ninguna llave en el repo.

### 2.5 Cloudinary API secret
1. Console Cloudinary → *Dashboard → Settings → API Keys* → regenerar `api_secret`.
2. Actualizar la env `CLOUDINARY_API_SECRET` en Render y **redeployar** (`API_KEY` y `CLOUD_NAME` no cambian).

### 2.6 MySQL del VPS
1. `ALTER USER 'metafit'@'%' IDENTIFIED BY '<nueva_fuerte>';`
2. Actualizar `DB_PASSWORD` en las envs del backend de Render y del Adminer, y el `docker-compose` de la doc.
3. Aplicar si conviene: restringir host a la IP de Render y habilitar autenticación fuerte.

### 2.7 JWT_SECRET
1. Generar: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. Actualizar env `JWT_SECRET` en Render → redeploy → **todos los tokens existentes quedan inválidos**
   (pedir re-login). Hacerlo en ventana de bajo uso.

### 2.8 Brevo
1. **Regenerar `BREVO_API_KEY`** (Dashboard Brevo → SMTP & API → API Keys) — la actual responde **401**.
2. Mantener el relay SMTP (funciona) o, si se regenera, actualizar `SMTP_PASS`.

### 2.9 Telegram bot
1. En @BotFather crear/re-construir el bot y copiar el token en el nodo *MetaFit Telegram Bot* de n8n
   (UI: `http://localhost:5678` → Credentials). Actualmente el token es **placeholder** — el mensaje real
   de Telegram no se puede verificar hasta configurarlo.

---

## 3. Medidas vigentes (ya activas)

- ✅ **CORS whitelist** en producción (`CORS_ORIGINS` en Render). Origen no permitido → **403**.
- ✅ **JWT** con bcrypt (12 rondas) y rutas protegidas por rol.
- ✅ **Sin secretos en el código**: las credenciales viven solo en env vars de Render / n8n / Dokploy.
- ✅ `metafit_backup*.sql` **no se versiona** (verificado en el repo).
- ⚠️ **No subir al repo**: `documentacion/brain/.obsidian/`, `*.sql` de backup ni `.env`.

---

## 4. Acceso local rápido (desarrollo)

| Recursor | Acceso |
|---|---|
| phpMyAdmin | `http://localhost:8080` (root / `Admin123!`) |
| n8n | `http://localhost:5678` (admin / `Admin123!`) |
| BD local | `localhost:3306` (root / `Admin123!`, db `metafit`) |
| BD producción | `141.148.94.173:3306` (metafit / `Admin123!`, db `metafit`) |