# Entornos — MetaFit

> Este documento define **cómo se separan los entornos LOCAL y PRODUCCIÓN**
> y cómo se audita la base de datos en cada uno.

---

## ⚠️ Regla fundamental

> **Los datos creados en LOCAL solo aparecen en phpMyAdmin (localhost:8080).**
> **Los datos creados en PRODUCCIÓN solo aparecen en Adminer (VPS Oracle).**
>
> **NUNCA mezclar las dos BDs.** Son bases de datos separadas, en servidores
> separados, con orígenes de datos separados.

| Entorno     | Base de datos               | Cómo se audita          | Dónde vive                          |
|-------------|-----------------------------|-------------------------|-------------------------------------|
| LOCAL       | MariaDB 11 (Docker)         | **phpMyAdmin**          | `http://localhost:8080`             |
| PRODUCCIÓN  | MySQL 8 (VPS Oracle 141.148.94.173) | **Adminer**      | `https://metafit-adminer.onrender.com` |

- **phpMyAdmin (LOCAL):** root / contraseña de `DB_PASSWORD` del `.env` (por defecto `Admin123!`), base `metafit`.
- **Adminer (PROD):** user `metafit` / `Admin123!` / base `metafit` — apunta al MySQL del VPS Oracle.

❌ **Nunca** conectes el backend local contra la BD de producción ni viceversa.
✅ El frontend web y la app móvil son **dos clientes del mismo backend**: todo lo
que se crea en la web queda disponible en la app y al revés.

---

## Variables de entorno por archivo

### 1. `.env` (raíz — lo consume `docker-compose.yml`)

| Variable                | Valor local (Docker)            | Valor producción (Render/VPS)      | Notas                                        |
|-------------------------|---------------------------------|------------------------------------|----------------------------------------------|
| `PORT`                  | `3001`                          | `3001`                            | Puerto del backend                           |
| `DB_HOST`               | `db` (nombre del servicio)      | `141.148.94.173`                  | **NO usar `localhost` en local**             |
| `DB_PORT`               | `3306`                          | `3306`                            |                                              |
| `DB_USER`               | `root`                          | `metafit`                         |                                              |
| `DB_PASSWORD`           | `Admin123!`                     | `Admin123!`                       |                                              |
| `DB_NAME`               | `metafit`                       | `metafit`                         |                                              |
| `DB_SSL`                | `false`                         | `false`                           |                                              |
| `JWT_SECRET`            | `metafit_jwt_secret_key_2024`   | (secreto de producción)           | **Nunca commitear el real**                  |
| `JWT_EXPIRES_IN`        | `8h`                            | `8h`                              |                                              |
| `CORS_ORIGINS`          | `http://localhost:5173,...`     | `https://metafit-frontend-78x6.onrender.com,...` | separados por coma           |
| `CLOUDINARY_CLOUD_NAME` | `llaq9vyl`                      | `llaq9vyl`                        | Fotos de perfil                              |
| `CLOUDINARY_API_KEY`    | (del `.env` real)               | (del `.env` real)                 | Sin valor → cae a disco local `uploads/`     |
| `CLOUDINARY_API_SECRET` | (del `.env` real)               | (del `.env` real)                 | **Nunca commitear**                          |
| `BREVO_API_KEY`         | (del `.env` real)               | (del `.env` real)                 | Correo de bienvenida                         |
| `SMTP_FROM`             | `metafit.sistema@gmail.com`     | `metafit.sistema@gmail.com`       | Remitente verificado en Brevo                |
| `URL_APK`               | `https://metafit-frontend-78x6.onrender.com/app/metafit.apk` | igual | Enlace de descarga del APK        |

### 2. `.env.example` (plantilla versionada, sin secretos)

Misma estructura que `.env` pero con valores de ejemplo y secretos vacíos.
Copiar a `.env` con: `cp .env.example .env`

### 3. `frontend_web/.env.development` (Vite)

| Variable        | Valor local  | Valor producción (Render)                     |
|-----------------|--------------|-----------------------------------------------|
| `VITE_API_URL`  | `http://localhost:3001` | `https://metafit-backend-rr18.onrender.com` |

> En Docker, `docker-compose.yml` inyecta `VITE_API_URL=http://localhost:3001`
> automáticamente al contenedor del frontend.

### 4. App móvil (Expo) — `movil/src/services/api.js`

| Variable               | Valor navegador (Expo web) | Valor APK compilado       |
|------------------------|-----------------------------|---------------------------|
| `EXPO_PUBLIC_API_URL`  | `http://localhost:3001`     | `https://metafit-backend-rr18.onrender.com` |

> La app decide con `Platform.OS === 'web'`: en navegador usa el backend local;
> en el APK real (android/ios) usa siempre el backend de producción.

---

## Cómo arrancar local

```bash
docker compose up -d --build
```

Esto levanta: **MariaDB 11 + Backend + Frontend web + phpMyAdmin + n8n**.

| Servicio   | Puerto | URL                        | Credenciales                    |
|------------|--------|----------------------------|---------------------------------|
| Frontend   | 5173   | http://localhost:5173      | ver README (Admin/Recepcionista/Entrenador/Afiliado) |
| Backend    | 3001   | http://localhost:3001/health | —                             |
| Swagger    | 3001   | http://localhost:3001/api-docs | —                            |
| phpMyAdmin | 8080   | http://localhost:8080      | root / `DB_PASSWORD`            |
| n8n        | 5678   | http://localhost:5678      | admin / Admin123!               |
| Expo web   | 8081   | http://localhost:8081      | afiliado (ej. `demo.sust@test.com`) |

Los `.sql` de `database/` se ejecutan **solo la primera vez** (volumen vacío), en
orden `01_estructura → 02_migracion_movil → 03_mejoras_estructura →
04_datos_iniciales → 05_password_reset`.

---

## Cómo resetear la BD local

```bash
docker compose down -v && docker compose up -d --build
```

⚠️ **`down -v` borra el volumen `metafit_db_data`**: se pierden TODOS los datos
locales. Al volver a levantar, MariaDB re-ejecuta el seed completo y la BD queda
como nueva en ~30 segundos. **No usar `-v` si querés conservar datos locales.**

> Si solo querés recargar código sin tocar datos: `docker compose up -d --build`.

---

## Troubleshooting

| # | Síntoma                                   | Causa probable                              | Solución |
|---|-------------------------------------------|---------------------------------------------|----------|
| 1 | `docker compose up` falla o backend no arranca | Backend esperando a la BD; healthcheck tarda | Esperar 30–60 s: `docker compose ps` y `docker logs metafit_db`. Si `db` está unhealthy, reiniciar: `docker compose restart db` |
| 2 | `mysql: command not found` / `unknown command` | La BD es **MariaDB 11**, el binario es `mariadb`, no `mysql` | Usar `docker exec -it metafit_db mariadb -uroot -p...` (nunca `mysql`) |
| 3 | La web no ve al backend / error CORS     | `CORS_ORIGINS` no incluye el origen actual o `DB_HOST=localhost` en vez de `db` | En local: `DB_HOST=db` y `CORS_ORIGINS` con `http://localhost:5173,http://localhost:8081`. Recrear backend tras cambiar `.env` |
| 4 | "No veo los datos que creé"               | Se está mirando la BD equivocada (mezcla LOCAL/PROD) | LOCAL → phpMyAdmin `localhost:8080`. PROD → Adminer `https://metafit-adminer.onrender.com`. **Son BDs separadas, nunca mezclar** |
| 5 | phpMyAdmin (8080) no carga o rechaza login | phpMyAdmin arrancó antes que la BD, o credencial distinta | Esperar a que `db` esté healthy, luego `docker compose restart phpmyadmin`. Usuario `root`, contraseña = `DB_PASSWORD` del `.env` |