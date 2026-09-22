# 🗄️ Adminer — Acceso gráfico a la base de datos

> Adminer es un cliente web ligero de bases de datos (tipo phpMyAdmin), desplegado en Render
> para revisar la base `metafit` desde el navegador sin instalar nada.

---

## URL de Adminer en Render

| Recurso | Valor |
|---|---|
| **Adminer (público)** | https://metafit-adminer.onrender.com |
| Dashboard Render | https://dashboard.render.com/web/srv-daotaabtqb8s73ehjs2g |
| Servicio | `metafit-adminer` (Web Service, Docker, plan `free`, región `oregon`) |

---

## Instrucciones para iniciar sesión

En la pantalla de login de Adminer completar estos campos:

| Campo | Valor |
|---|---|
| **Sistema** (driver) | `MySQL` (o `MariaDB` si el driver aparece disponible) |
| **Servidor** | el host de la BD (ver tablas de conexión abajo) |
| **Usuario** | `root` |
| **Contraseña** | según el entorno (ver tablas abajo) |
| **Base de datos** | `metafit` |

> Si se deja **Base de datos vacía** y se selecciona "Sin base de datos", Adminer lista las
> bases disponibles del servidor al que se conecte.

---

## Conexión a la BD de desarrollo (funciona ya)

La BD local (contenedor `metafit_db` del docker-compose, MariaDB) es la conexión más directa
para probar Adminer hoy:

| Campo | Valor |
|---|---|
| Sistema | `MySQL` |
| Servidor | `localhost` (o `metafit_db` si se accede desde la red interna del compose) |
| Puerto | `3306` |
| Usuario | `root` |
| Contraseña | `Admin123!` |
| Base de datos | `metafit` |

---

## Conexión a la BD de producción (VPS Oracle + Dokploy) — ✅ funciona

La BD de producción fue **migrada a MySQL 8** en el VPS de Oracle Cloud, administrado por
Dokploy. Desde Adminer se entra directo:

| Campo | Valor |
|---|---|
| Sistema | `MySQL` |
| Servidor | `141.148.94.173` |
| Puerto | `3306` |
| Usuario | `metafit` |
| Contraseña | `Admin123!` |
| Base de datos | `metafit` |

> ⚠️ El VPS debe permitir el tráfico entrante en el puerto 3306 (Security List de Oracle / UFW) —
> ya está habilitado y verificado con `SELECT 1`.

### Campo "Servidor" ya viene prefijado (verificado 22-sep-2026)

El servicio de Render tiene la variable de entorno **`ADMINER_DEFAULT_SERVER=141.148.94.173:3306`**
(seteada y desplegada — deploy `dep-daovmlmgekts73f8fu8g` live). Al abrir la pantalla de login,
el campo **Servidor** ya aparece con `141.148.94.173:3306`; solo se deben escribir usuario
(`metafit`), contraseña (`Admin123!`) y base (`metafit`).

### Nota histórica

Antes, la BD de producción corría **embebida dentro del contenedor del backend de Render**
(MariaDB escuchando solo por socket `/run/mysqld/mysqld.sock`, sin puerto externo), y por eso
Adminer no podía alcanzarla. Eso quedó resuelto con la migración al VPS.
Detalles en [`infraestructura_vps.md`](./infraestructura_vps.md).

---

## Despliegue del servicio

- **Repo**: `https://github.com/juanscarvajal04-droid/adminer` (rama `main`) — imagen Adminer oficial.
- **Tipo**: Web Service · Docker (`Dockerfile` del repo) · plan `free` · región `oregon`.
- **Auto-deploy**: activado.
- **Origen del repo**: el servicio apunta al **fork propio** del proyecto
  (`juanscarvajal04-droid/adminer`), creado desde `render-examples/adminer`.