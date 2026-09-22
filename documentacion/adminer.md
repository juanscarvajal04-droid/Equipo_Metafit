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

## Conexión a la BD de producción — ⚠️ situación real

En Render **no existe un servicio de base de datos externo** ni una "Internal Database URL"
con formato `mysql://root:PASSWORD@HOST:3306/metafit`. Render no ofrece MySQL/MariaDB
administrado, y en este proyecto **MariaDB corre embebido dentro del contenedor del backend**:

- El `Dockerfile` raíz instala MariaDB dentro de la imagen (`apk add mariadb mariadb-client`).
- `backend/start.sh` levanta `mariadbd` escuchando **únicamente en un socket local**
  (`/run/mysqld/mysqld.sock`) y aplica los scripts SQL de `database/`; nunca escucha en
  `0.0.0.0:3306` hacia afuera.
- Env vars reales del backend en Render:

  | Variable | Valor |
  |---|---|
  | `DB_HOST` | `localhost` |
  | `DB_PORT` | `3306` |
  | `DB_USER` | `root` |
  | `DB_PASSWORD` | `ignored` (el arranque autentica por socket local, sin password) |
  | `DB_SOCKET` | `/run/mysqld/mysqld.sock` |
  | `DB_NAME` | `metafit` |

Como Render expone **un único puerto por Web Service**, la BD embebida no es alcanzable desde
Adminer (que corre en un servicio aparte).

### Opciones para ver la BD de producción con Adminer

1. **Mover la BD a un MySQL/MariaDB administrado** (p.ej. Railway, Aiven, PlanetScale, o un
   contenedor MariaDB con disco persistente en Render) y configurar el backend con `DB_HOST`,
   `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` apuntando a él. Luego Adminer conecta con la
   Internal Database URL correspondiente (formato `mysql://usuario:pass@host:3306/metafit`).
2. **Usar Adminer con la BD de desarrollo** (tabla de arriba), que ya funciona sin cambios.

---

## Despliegue del servicio

- **Repo**: `https://github.com/juanscarvajal04-droid/adminer` (rama `main`) — imagen Adminer oficial.
- **Tipo**: Web Service · Docker (`Dockerfile` del repo) · plan `free` · región `oregon`.
- **Auto-deploy**: activado.
- **Origen del repo**: el servicio apunta al **fork propio** del proyecto
  (`juanscarvajal04-droid/adminer`), creado desde `render-examples/adminer`.