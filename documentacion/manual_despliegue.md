# Manual de Despliegue — MetaFit Cloud

## De localhost a la nube: la guía definitiva

**Autores:** Juan S. Carvajal, Sofia Astudillo, Kevin S. Robayo, Carlos Rodrigues  
**Proyecto:** MetaFit — Sistema de Gestión Deportiva para Sport Gym Sede 80  
**Versión del manual:** 1.0 — Julio 2026  
**Repositorio:** https://github.com/juanscarvajal04-droid/Equipo_Metafit  
**Rama principal:** `feature/juan-carvajal`

---

## Índice de contenidos

1. [Introducción: ¿Por qué llevar MetaFit a la nube?](#1-introducción)
2. [Arquitectura del sistema](#2-arquitectura-del-sistema)
3. [Preparación del repositorio en GitHub](#3-preparación-del-repositorio-en-github)
4. [Archivos creados y modificados para el despliegue](#4-archivos-creados-y-modificados-para-el-despliegue)
5. [Configuración de la base de datos](#5-configuración-de-la-base-de-datos)
6. [Despliegue del backend en Render](#6-despliegue-del-backend-en-render)
7. [Despliegue del frontend web en Render](#7-despliegue-del-frontend-web-en-render)
8. [Solución de problemas (troubleshooting)](#8-solución-de-problemas)
9. [Verificación final](#9-verificación-final)
10. [Lecciones aprendidas y recomendaciones](#10-lecciones-aprendidas-y-recomendaciones)
11. [Apéndice: comandos útiles](#11-apéndice-comandos-útiles)

---

---

# 1. Introducción: ¿Por qué llevar MetaFit a la nube?

## 1.1 El problema

Imaginá esta escena: terminaste de desarrollar MetaFit en tu computadora. Tenés tu backend Node.js corriendo en `localhost:3001`, tu base de datos MySQL en `localhost:3306`, y tu frontend React sirviendo en `localhost:5173`. Todo funciona perfecto... pero solo en TU máquina.

Si querés que Carlos, el dueño del gimnasio, pueda usar el sistema desde su casa, o que María, la recepcionista, pueda registrar afiliados desde una tablet en la recepción, necesitás algo más que `localhost`.

Necesitás un **despliegue en la nube**.

## 1.2 ¿Qué significa "desplegar en la nube"?

Desplegar (del inglés *deploy*) significa instalar y ejecutar tu aplicación en servidores accesibles a través de internet, no solo en tu computadora personal. Es como mudarte de un departamento temporal (tu PC) a una casa permanente (la nube) donde tus usuarios pueden visitarte cuando quieran.

Cuando desplegás en la nube:
- **Usuarios** pueden acceder desde cualquier lugar, cualquier dispositivo
- **El sistema** está disponible 24/7 (o al menos debería)
- **Escalabilidad**: si crece la demanda, podés agregar más recursos
- **Profesionalismo**: una URL pública se ve mucho mejor que "localhost"

## 1.3 Opciones disponibles

Existen muchas plataformas de nube. Para MetaFit consideramos:

| Plataforma | Tipo | Costo | Facilidad | Base de datos incluida |
|---|---|---|---|---|
| **Render** | PaaS (Platform as a Service) | Freemium | Alta | No (trae disco efímero) |
| **Railway** | PaaS | Freemium (trial 5 USD) | Alta | Sí (MySQL/PostgreSQL) |
| **Heroku** | PaaS | Pago (plan最低 5 USD) | Alta | No (add-on pago) |
| **AWS** | IaaS (Infrastructure as a Service) | Pago por uso | Baja | Sí (RDS) |
| **Google Cloud** | IaaS | Pago por uso | Baja | Sí (Cloud SQL) |
| **DigitalOcean** | VPS | Desde 6 USD/mes | Media | Sí (Managed DB) |

Para MetaFit elegimos **Render** por su generoso tier gratuito, integración nativa con Docker y despliegue automático desde GitHub. Para la base de datos, intentamos **Railway MySQL** (que ofrece 5 USD de crédito gratuito) pero al expirar el trial, migramos a una solución **MariaDB embebida en el mismo contenedor de Docker**.

## 1.4 Nuestra estrategia final

```
┌─────────────────────────────────────────────────────────────┐
│                   ESTRATEGIA DE DESPLIEGUE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Frontend Web ───► Render Static Site (Vite build)          │
│                                                             │
│  Backend ────────► Render Web Service (Docker + MariaDB)    │
│                                                             │
│  Base de Datos ──► MariaDB embebida en el mismo contenedor  │
│                    del backend, iniciada via start.sh        │
│                                                             │
│  App Móvil ──────► Expo (desarrollo local, apunta a Render) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Esta estrategia es **inusual** pero **necesaria**. Lo normal sería tener la base de datos como un servicio separado. Sin embargo, cuando el trial de Railway expiró, decidimos embeber MariaDB en el contenedor de Node.js para no depender de servicios externos de pago.

---

## 1.5 URL finales del despliegue

| Componente | URL |
|---|---|
| **Backend API** | https://metafit-backend-rr18.onrender.com |
| **Swagger Docs** | https://metafit-backend-rr18.onrender.com/api-docs |
| **Health Check** | https://metafit-backend-rr18.onrender.com/health |
| **Frontend Web** | https://metafit-frontend-78x6.onrender.com |
| **Repositorio** | https://github.com/juanscarvajal04-droid/Equipo_Metafit |

---

# 2. Arquitectura del sistema

## 2.1 Diagrama de arquitectura general

Antes de meternos en los detalles técnicos, es fundamental entender cómo se conectan todas las piezas. Acá tenés un diagrama ASCII completo:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       ARQUITECTURA MEFIT EN LA NUBE                      │
│                                                                         │
│                                                                         │
│  ┌─────────────────────────────────────────────┐                       │
│  │              NAVEGADOR WEB                   │                       │
│  │  (Chrome, Firefox, Edge, etc.)              │                       │
│  │                                             │                       │
│  │  https://metafit-frontend-78x6.onrender.com │                       │
│  └──────────┬──────────────────────────────────┘                       │
│             │                                                           │
│             │  GET /  (HTML, CSS, JS)                                   │
│             │  VITE_API_URL apunta al backend                          │
│             │                                                           │
│             ▼                                                           │
│  ┌─────────────────────────────────────────────┐                       │
│  │         RENDER — STATIC SITE                 │                       │
│  │  Sirve archivos estáticos (build de Vite)   │                       │
│  │  NO tiene Node.js, NO tiene backend          │                       │
│  │  Es solo un CDN de archivos .html/.js/.css   │                       │
│  └─────────────────────────────────────────────┘                       │
│                                                                         │
│             │  POST /login, GET /afiliados, etc. (peticiones AJAX)     │
│             │  CORS configurado para aceptar el origen del frontend    │
│             ▼                                                           │
│  ┌─────────────────────────────────────────────┐                       │
│  │         RENDER — WEB SERVICE (Docker)        │                       │
│  │  https://metafit-backend-rr18.onrender.com   │                       │
│  │                                             │                       │
│  │  ┌───────────────────────────────────────┐  │                       │
│  │  │   Node.js (index.js → server.js)      │  │                       │
│  │  │   Express API en puerto 3001          │  │                       │
│  │  │   JWT Auth, bcrypt, mysql2            │  │                       │
│  │  └──────────────┬────────────────────────┘  │                       │
│  │                 │                            │                       │
│  │                 │ Unix Socket                │                       │
│  │                 │ /run/mysqld/mysqld.sock   │                       │
│  │                 ▼                            │                       │
│  │  ┌───────────────────────────────────────┐  │                       │
│  │  │   MariaDB (mysql-compatible)          │  │                       │
│  │  │   Base de datos: metafit              │  │                       │
│  │  │   Tablas: USUARIO, AFILIADO, CICLO... │  │                       │
│  │  │   Datos semilla: 4 afiliados,         │  │                       │
│  │  │   8 ciclos, 24 rutinas, etc.          │  │                       │
│  │  └───────────────────────────────────────┘  │                       │
│  └─────────────────────────────────────────────┘                       │
│                                                                         │
│                                                                         │
│  ┌─────────────────────────────────────────────┐                       │
│  │         APP MÓVIL (Expo / React Native)     │                       │
│  │                                             │                       │
│  │  Dispositivo físico o emulador              │                       │
│  │  Apunta a https://metafit-backend-rr18      │                       │
│  │  .onrender.com                              │                       │
│  │                                             │                       │
│  │  NOTA: En desarrollo local, Expo usa        │                       │
│  │  tunnelUrl.js o localhost:3001              │                       │
│  └─────────────────────────────────────────────┘                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Explicación detallada de cada componente

### 2.2.1 Backend Node.js (Express API)

El backend es el **cerebro** de MetaFit. Está construido con Node.js y Express, y se encarga de:

- **Autenticación**: Login con JWT (JSON Web Tokens) + bcrypt para hashing de contraseñas
- **CRUD de afiliados**: Crear, leer, actualizar y eliminar afiliados
- **Gestión de ciclos**: Cada afiliado puede tener múltiples ciclos de entrenamiento
- **Planes de entrenamiento y nutricionales**: Asignados por ciclo
- **Progreso físico**: Registro de peso, medidas, IMC
- **Dashboard KPIs**: Métricas para el administrador
- **Pagos**: Registro de pagos de membresía
- **Swagger UI**: Documentación interactiva de la API en `/api-docs`

El backend se conecta a MariaDB a través de un **socket Unix** (`/run/mysqld/mysqld.sock`), no por TCP. Esta es una optimización importante: la comunicación por socket es más rápida y segura porque no atraviesa la pila de red.

### 2.2.2 Frontend Web (Vite + React)

El frontend web es la **cara visible** de MetaFit. Está construido con:
- **React 19** con componentes funcionales y hooks
- **Vite** como bundler (extremadamente rápido en desarrollo)
- **Bootstrap 5** para los estilos
- **Chart.js** para gráficos del dashboard
- **Axios** para comunicarse con el backend
- **React Router** para navegación SPA (Single Page Application)

Cuando se despliega en Render como **Static Site**, Vite genera una carpeta `dist/` con archivos HTML, CSS y JS estáticos. Render sirve estos archivos mediante un CDN global. No hay Node.js corriendo en el frontend — todo el JavaScript se ejecuta en el navegador del usuario.

La conexión al backend se define mediante la variable de entorno `VITE_API_URL`. Esta variable se inyecta en tiempo de construcción (build time) y queda "quemada" en el código JavaScript empaquetado:

```javascript
// frontend_web/src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 2.2.3 App Móvil (Expo / React Native)

La app móvil está desarrollada con **Expo SDK 55** y **React Native 0.83**. Comparte la misma API REST que el frontend web. Se conecta al backend a través de:

```javascript
// movil/src/services/api.js
const RENDER_URL = 'https://metafit-backend-rr18.onrender.com';
const API_URL = process.env.EXPO_PUBLIC_API_URL || tunnelUrl || RENDER_URL || 'http://localhost:3001';
```

La prioridad es:
1. `EXPO_PUBLIC_API_URL` (variable de entorno para CI/CD)
2. `tunnelUrl` (escrito por `start-tunnel.sh` para desarrollo local)
3. `RENDER_URL` (producción)
4. `localhost:3001` (fallback de desarrollo)

### 2.2.4 MariaDB embebida

Esta es la parte más **interesante** (y poco convencional) de nuestro despliegue. En lugar de usar una base de datos externa (como Railway MySQL, que expiró), instalamos MariaDB dentro del mismo contenedor Docker que Node.js.

¿Cómo funciona?

1. En el `Dockerfile`, instalamos `mariadb` y `mariadb-client` desde Alpine Linux
2. En `start.sh`, inicializamos MariaDB, creamos la base de datos y ejecutamos los scripts SQL
3. Solo **después** de que MariaDB esté listo, iniciamos Node.js
4. Node.js se conecta a MariaDB mediante un socket Unix

Las ventajas de este enfoque:
- **No depende de servicios externos**: todo está en un solo contenedor
- **Más rápido**: comunicación por socket Unix, no por red
- **Más barato**: no hay que pagar por una base de datos separada

Las desventajas:
- **Datos no persistentes**: si Render reinicia el contenedor, la base de datos se pierde (a menos que usemos un volumen, que Render no ofrece en el tier gratuito)
- **Consumo de memoria**: MariaDB compite por RAM con Node.js
- **No escalable**: no podés escalar el backend sin escalar también la base de datos

Para un proyecto académico o demo, este enfoque es perfectamente válido. Para producción real, querrías una base de datos separada (RDS, Cloud SQL, o Railway de pago).

## 2.3 Flujo de una petición típica

Para entender cómo viajan los datos, sigamos una petición de login de principio a fin:

```
PASO 1: Usuario abre https://metafit-frontend-78x6.onrender.com
        └── Render Static Site sirve index.html + bundle.js
        └── El navegador carga React y muestra el formulario de login

PASO 2: Usuario escribe carlos@metafit.com / Admin123!
        └── React captura el submit
        └── Llama a api.post('/login', { email, password })
        └── Axios envía POST a https://metafit-backend-rr18.onrender.com/login

PASO 3: Render enruta la petición al Web Service
        └── Express recibe la petición en /login
        └── El rate limiter verifica: ¿menos de 10 intentos en 15 minutos?
        └── authController.login() procesa:
            ├── Busca usuario por email en MariaDB
            ├── Compara password con bcrypt.compare()
            ├── Si coincide, genera JWT con jsonwebtoken.sign()
            └── Responde con { token, user }

PASO 4: React recibe el token
        └── Guarda token en localStorage
        └── Redirige al dashboard
        └── A partir de ahora, cada petición incluye:
            Header: Authorization: Bearer <token>

PASO 5: Dashboard solicita GET /dashboard/kpis
        └── Express verifica JWT en middleware auth.js
        └── dashboardController.kpis() consulta MariaDB
        └── Responde con JSON de KPIs
        └── React renderiza gráficos con Chart.js
```

Tiempo total estimado: **200-500ms** (dependiendo de la latencia de Render).

---

# 3. Preparación del repositorio en GitHub

## 3.1 Estructura del repositorio

Antes de desplegar, es crucial entender la estructura de carpetas del proyecto. Render y otras plataformas necesitan saber exactamente dónde está cada cosa.

```
Equipo_Metafit/
├── backend/
│   ├── config/
│   │   └── db.js              ← Conexión a MySQL con soporte de socket Unix
│   ├── controllers/           ← Lógica de negocio
│   ├── middlewares/
│   │   └── auth.js            ← Verificación de JWT
│   ├── models/                ← Consultas SQL
│   ├── routes/                ← Definición de rutas Express
│   ├── scripts/               ← Utilidades
│   ├── utils/                 ← Funciones auxiliares
│   ├── index.js               ← Punto de entrada
│   ├── server.js              ← Configuración Express
│   ├── package.json
│   └── start.sh               ← Script de inicio (MariaDB + Node.js)
│
├── database/
│   ├── 01_schema.sql          ← CREATE TABLE (esquema completo)
│   ├── 02_seed.sql            ← INSERT (datos semilla)
│   ├── 03_datos_demo.sql      ← Más datos demo
│   └── 04_migracion_app_movil.sql  ← Migración app móvil
│
├── frontend_web/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js         ← Cliente Axios con VITE_API_URL
│   │   ├── components/        ← Componentes React
│   │   ├── hooks/             ← Custom hooks
│   │   └── ...
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile             ← Solo para desarrollo local
│
├── movil/                     ← App Expo (no se despliega en Render)
│   ├── src/
│   │   └── services/
│   │       └── api.js         ← Apunta a RENDER_URL
│   └── ...
│
├── Dockerfile                 ← Dockerfile PRINCIPAL (raíz del proyecto)
├── render.yaml                ← Infraestructura como código
├── .dockerignore              ← Ignorar archivos innecesarios en Docker
├── docker-compose.yml         ← Orquestación local
└── README.md
```

## 3.2 Configuración de Git

El repositorio debe estar correctamente configurado en Git antes del despliegue. Render se conecta directamente a GitHub para hacer auto-deploy.

```bash
# Verificar el estado del repositorio
git status

# Verificar en qué rama estamos
git branch
# → * feature/juan-carvajal

# Verificar que el remoto apunta al repositorio correcto
git remote -v
# → origin  https://github.com/juanscarvajal04-droid/Equipo_Metafit.git (fetch)
# → origin  https://github.com/juanscarvajal04-droid/Equipo_Metafit.git (push)

# Ver el log de commits recientes
git log --oneline -10
```

## 3.3 .dockerignore

El archivo `.dockerignore` en la raíz del proyecto evita que archivos innecesarios se copien al contenedor Docker. Esto reduce el tamaño de la imagen y acelera los builds.

```
node_modules
.git
.cache
*.md
movil
frontend_web
__tests__
.env
```

**Explicación línea por línea:**

- `node_modules`: No queremos copiar las dependencias porque las instalamos dentro del contenedor con `npm install`. Las dependencias de la máquina host pueden ser para otra arquitectura (por ejemplo, macOS ARM vs Linux AMD64).
- `.git`: La historia de Git es enorme e innecesaria dentro del contenedor.
- `.cache`: Archivos de caché temporales.
- `*.md`: Los archivos Markdown (incluyendo este manual) no son necesarios en producción.
- `movil`: La app móvil no se despliega en Render.
- `frontend_web`: El frontend se despliega como Static Site separado, no dentro del backend.
- `__tests__`: Tests no necesarios en producción.
- `.env`: NUNCA incluyas variables de entorno reales en la imagen Docker. Las variables se inyectan en Render.

## 3.4 Variables de entorno (archivo .env local)

El archivo `.env` en la raíz se usa SOLO para desarrollo local con Docker Compose:

```
PORT=3001
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Admin123!
DB_NAME=metafit
JWT_SECRET=metafit_jwt_secret_key_2024
JWT_EXPIRES_IN=8h
CORS_ORIGINS=http://localhost:5173,http://localhost:8081,http://192.168.0.4:8081,exp://192.168.0.4:8081
```

**⚠️ ADVERTENCIA DE SEGURIDAD:** Este `.env` contiene credenciales para desarrollo local. NUNCA subas este archivo a GitHub. Ya está en `.gitignore`, pero verificá:

```bash
# Verificar que .env está en .gitignore
cat .gitignore
# Debería incluir: .env

# Verificar que NO está siendo trackeado
git status .env
# → should show "nothing to commit" or "untracked"
```

---

# 4. Archivos creados y modificados para el despliegue

En esta sección analizamos CADA archivo que fue creado o modificado para que el despliegue funcione. Explicamos línea por línea qué hace y por qué es necesario.

## 4.1 Dockerfile (raíz del proyecto)

**Ubicación:** `/Equipo_Metafit/Dockerfile`  
**Propósito:** Define cómo se construye la imagen Docker del backend con MariaDB embebido.

```dockerfile
FROM node:22-alpine

RUN apk add --no-cache mariadb mariadb-client bash

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ ./
COPY database/ ./database/

RUN chmod +x start.sh

EXPOSE 3001

CMD ["bash", "start.sh"]
```

**Análisis línea por línea:**

| Línea | Explicación |
|---|---|
| `FROM node:22-alpine` | Usamos Alpine Linux (ultra-ligero, ~5MB) con Node.js 22. Alpine es la opción preferida para contenedores Docker por su tamaño reducido. |
| `RUN apk add --no-cache mariadb mariadb-client bash` | Instalamos MariaDB (el servidor de base de datos) y MariaDB Client (herramientas CLI como `mysql` y `mysqladmin`). `--no-cache` evita que Alpine guarde la caché de paquetes, reduciendo el tamaño de la imagen. También instalamos `bash` porque `start.sh` usa Bash. |
| `WORKDIR /app` | Establecemos `/app` como directorio de trabajo dentro del contenedor. Todos los comandos siguientes se ejecutan en este directorio. |
| `COPY backend/package*.json ./` | Copiamos solo los archivos `package.json` y `package-lock.json` primero. Esto aprovecha el **caching de capas de Docker**: si estos archivos no cambian, Docker reusa la capa de `npm install` sin reinstalar. |
| `RUN npm install --omit=dev` | Instalamos solo dependencias de producción (`--omit=dev`). No necesitamos Jest, nodemon ni localtunnel en producción. Esto reduce el tamaño de `node_modules` significativamente (de ~200MB a ~50MB). |
| `COPY backend/ ./` | Copiamos todo el código del backend (todos los .js, .json, start.sh, etc.). |
| `COPY database/ ./database/` | Copiamos los scripts SQL (`01_schema.sql`, `02_seed.sql`, etc.) a la carpeta `/app/database/`. |
| `RUN chmod +x start.sh` | Damos permisos de ejecución al script de inicio. |
| `EXPOSE 3001` | Documentamos que el contenedor escucha en el puerto 3001. Esto es informativo; no publica el puerto automáticamente. |
| `CMD ["bash", "start.sh"]` | Cuando el contenedor arranque, ejecuta `bash start.sh`. Este script inicia MariaDB y luego Node.js. |

**¿Por qué usar `node:22-alpine` y no otra imagen?**

La imagen `node:22-alpine` pesa aproximadamente **120MB** (compressed). Otras opciones:

| Imagen | Tamaño | Ventajas | Desventajas |
|---|---|---|---|
| `node:22-alpine` | ~120 MB | Ultra-ligera, rápida | Basada en musl libc (diferencias sutiles con glibc) |
| `node:22-slim` | ~180 MB | Basada en Debian, glibc | Más pesada |
| `node:22` (full) | ~350 MB | Completa, todas las herramientas | Muy pesada para Docker |
| `ubuntu:22.04` + Node | ~400 MB | Familiar | Lenta de construir |

Para nuestro caso, Alpine es perfecta: es pequeña y `apk` nos permite instalar MariaDB fácilmente.

## 4.2 start.sh

**Ubicación:** `/Equipo_Metafit/backend/start.sh`  
**Propósito:** Script de inicio que inicializa MariaDB y arranca Node.js. Es el corazón del despliegue.

```bash
#!/bin/bash
set -e

MYSQL_DATA=/var/lib/mysql
MYSQL_SOCK=/run/mysqld/mysqld.sock
MYSQLD=/usr/bin/mariadbd

mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld

if [ ! -d "$MYSQL_DATA/mysql" ]; then
  echo ">>> Inicializando base de datos MariaDB..."
  mariadb-install-db --user=mysql --datadir="$MYSQL_DATA" --skip-test-db
fi

$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-name-resolve --innodb-buffer-pool-size=128M --user=mysql &
MYSQL_PID=$!

echo ">>> Esperando MariaDB..."
for i in $(seq 1 20); do
  if mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
    echo ">>> MariaDB listo"
    break
  fi
  sleep 1
done

if ! mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
  echo ">>> Error: MariaDB no inició"
  exit 1
fi

DB_EXISTS=$(mysql --socket="$MYSQL_SOCK" -e "SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='metafit'" 2>/dev/null | grep 1 || echo "")

if [ -z "$DB_EXISTS" ]; then
  echo ">>> Creando base de datos metafit..."
  mysql --socket="$MYSQL_SOCK" -e "CREATE DATABASE IF NOT EXISTS metafit CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
  echo ">>> Ejecutando schema..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/01_schema.sql
  echo ">>> Ejecutando seed..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/02_seed.sql
  echo ">>> Ejecutando migración..."
  mysql --socket="$MYSQL_SOCK" metafit < /app/database/04_migracion_app_movil.sql
  echo ">>> Base de datos inicializada!"
else
  echo ">>> Base de datos metafit ya existe"
fi

echo ">>> Iniciando Node.js..."
export DB_SOCKET="$MYSQL_SOCK"
export DB_USER="root"
export DB_PASSWORD="ignored"
export DB_NAME="metafit"
exec node /app/index.js
```

**Análisis detallado:**

### Sección 1: Variables de configuración

```bash
MYSQL_DATA=/var/lib/mysql
MYSQL_SOCK=/run/mysqld/mysqld.sock
MYSQLD=/usr/bin/mariadbd
```

- `MYSQL_DATA`: Directorio donde MariaDB almacena los datos de las bases de datos. En Alpine, el paquete `mariadb` espera los datos en `/var/lib/mysql`.
- `MYSQL_SOCK`: Ruta del socket Unix. MariaDB y MySQL crean un socket Unix en `/run/mysqld/mysqld.sock` por defecto. La comunicación por socket es más rápida que TCP porque no requiere overhead de red.
- `MYSQLD`: Ruta del binario del servidor MariaDB (`mariadbd` es equivalente a `mysqld`).

### Sección 2: Preparación del socket

```bash
mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld
```

MariaDB necesita que el directorio del socket exista y sea propiedad del usuario `mysql`. En Alpine, el directorio `/run/mysqld` no se crea automáticamente, así que lo hacemos manualmente.

### Sección 3: Inicialización de la base de datos (solo la primera vez)

```bash
if [ ! -d "$MYSQL_DATA/mysql" ]; then
  echo ">>> Inicializando base de datos MariaDB..."
  mariadb-install-db --user=mysql --datadir="$MYSQL_DATA" --skip-test-db
fi
```

`mariadb-install-db` es el comando que crea los archivos de datos iniciales de MariaDB (las tablas del sistema como `mysql.user`, `mysql.db`, etc.). Solo se ejecuta si el directorio de datos NO existe (primera ejecución del contenedor). `--skip-test-db` omite la creación de la base de datos de prueba `test`, que no necesitamos.

Si el contenedor se reinicia, el directorio de datos ya existe (gracias al flag `-d "$MYSQL_DATA/mysql"`) y esta sección se salta.

### Sección 4: Arranque del servidor MariaDB

```bash
$MYSQLD --datadir="$MYSQL_DATA" --socket="$MYSQL_SOCK" --pid-file=/tmp/mysql.pid \
  --skip-name-resolve --innodb-buffer-pool-size=128M --user=mysql &
MYSQL_PID=$!
```

Iniciamos `mariadbd` como proceso en segundo plano (`&`). Los parámetros importantes:

| Parámetro | Significado |
|---|---|
| `--datadir` | Dónde están los datos de la base |
| `--socket` | Ruta del socket Unix |
| `--pid-file` | Archivo con el PID del proceso |
| `--skip-name-resolve` | No resolver nombres DNS (mejora rendimiento en contenedores) |
| `--innodb-buffer-pool-size=128M` | Tamaño del buffer pool de InnoDB (128MB es adecuado para un contenedor con ~512MB de RAM) |
| `--user=mysql` | Ejecutar como usuario `mysql` (seguridad: no ejecutar como root) |

Guardamos el PID en `MYSQL_PID` por si necesitamos matar el proceso más adelante.

### Sección 5: Espera activa (polling) hasta que MariaDB esté listo

```bash
for i in $(seq 1 20); do
  if mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
    echo ">>> MariaDB listo"
    break
  fi
  sleep 1
done

if ! mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
  echo ">>> Error: MariaDB no inició"
  exit 1
fi
```

Usamos `mysqladmin ping` para verificar que MariaDB está aceptando conexiones. Intentamos hasta 20 veces (20 segundos). Si después de 20 segundos MariaDB no responde, el script termina con error (`exit 1`), lo que hace que el contenedor se reinicie (Render reinicia automáticamente contenedores que fallan).

Este patrón de **espera activa** es común en Docker cuando un servicio depende de otro.

### Sección 6: Creación de la base de datos y carga de datos

```bash
DB_EXISTS=$(mysql --socket="$MYSQL_SOCK" -e "SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='metafit'" 2>/dev/null | grep 1 || echo "")
```

Verificamos si la base de datos `metafit` ya existe consultando `information_schema.SCHEMATA`. Si no existe (`-z "$DB_EXISTS"`), la creamos y ejecutamos los scripts SQL:

1. `01_schema.sql`: Crea las tablas (DDL)
2. `02_seed.sql`: Inserta los datos semilla (DML)
3. `04_migracion_app_movil.sql`: Migraciones adicionales para la app móvil

La base de datos se crea con `CHARACTER SET utf8mb4` y `COLLATE utf8mb4_unicode_ci`. `utf8mb4` es la codificación correcta para Unicode completo (emojis, caracteres especiales). `utf8` en MySQL es en realidad UTF-8 de 3 bytes (no soporta emojis).

### Sección 7: Inicio de Node.js

```bash
export DB_SOCKET="$MYSQL_SOCK"
export DB_USER="root"
export DB_PASSWORD="ignored"
export DB_NAME="metafit"
exec node /app/index.js
```

**Importante:** `DB_PASSWORD="ignored"` — la contraseña en realidad no importa porque la autenticación por socket Unix con usuario `root` local **no requiere contraseña**. MariaDB confía en conexiones locales por socket del usuario `root`.

`exec` reemplaza el proceso de Bash con Node.js, asegurando que las señales (SIGTERM, SIGINT) se envíen directamente a Node.js y no a Bash. Si no usáramos `exec`, Node.js sería un hijo de Bash y las señales podrían no propagarse correctamente.

## 4.3 backend/config/db.js

**Ubicación:** `/Equipo_Metafit/backend/config/db.js`  
**Propósito:** Pool de conexiones MySQL/MariaDB con soporte para socket Unix.

```javascript
'use strict';

const mysql = require('mysql2/promise');
const { URL } = require('url');

let DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL;

if (process.env.DATABASE_URL) {
  const parsed = new URL(process.env.DATABASE_URL);
  DB_HOST     = parsed.hostname;
  DB_PORT     = parsed.port || '3306';
  DB_USER     = decodeURIComponent(parsed.username);
  DB_PASSWORD = decodeURIComponent(parsed.password);
  DB_NAME     = parsed.pathname.replace(/^\//, '');
  DB_SSL      = parsed.searchParams.get('ssl') || process.env.DB_SSL || 'true';
  console.log(`[db.js] Usando DATABASE_URL → host: ${DB_HOST} | db: ${DB_NAME}`);
} else {
  DB_HOST     = process.env.DB_HOST;
  DB_PORT     = process.env.DB_PORT || '3306';
  DB_USER     = process.env.DB_USER;
  DB_PASSWORD = process.env.DB_PASSWORD;
  DB_NAME     = process.env.DB_NAME;
  DB_SSL      = process.env.DB_SSL || 'false';
}

if (!process.env.DB_SOCKET && !process.env.DATABASE_URL) {
  const configMap = { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME };
  for (const [key, val] of Object.entries(configMap)) {
    if (!val) {
      console.error(`[db.js] ❌ Variable requerida no definida: ${key}`);
      console.error('[db.js] Define DATABASE_URL, DB_SOCKET o las variables DB_* individuales.');
      process.exit(1);
    }
  }
}

const poolConfig = {
  waitForConnections: true,
  connectionLimit   : 10,
  queueLimit        : 0,
  authPlugins       : undefined,
  enableKeepAlive   : true,
  keepAliveInitialDelay: 10000,
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      if (val != null) return val;
    }
    return next();
  },
};

if (process.env.DB_SOCKET) {
  poolConfig.socketPath = process.env.DB_SOCKET;
  console.log(`[db.js] Usando socket Unix: ${process.env.DB_SOCKET}`);
} else {
  poolConfig.host = DB_HOST;
  poolConfig.port = parseInt(DB_PORT, 10);
}
poolConfig.user = DB_USER;
poolConfig.password = DB_PASSWORD;
poolConfig.database = DB_NAME;

if (DB_SSL === 'true' || DB_SSL === '1') {
  poolConfig.ssl = { rejectUnauthorized: false };
  console.log('[db.js] SSL habilitado para la conexión MySQL (rejectUnauthorized: false)');
}

const pool = mysql.createPool(poolConfig);

pool.getConnection()
  .then(conn => {
    const loc = process.env.DB_SOCKET ? `socket: ${process.env.DB_SOCKET}` : `host: ${DB_HOST}`;
    console.log(`✅ MySQL conectado — ${loc} | db: ${DB_NAME}`);
    conn.release();
  })
  .catch(err => {
    console.error('[db.js] ❌ Error al conectar a MySQL:', err.message);
    console.error('[db.js] El servidor iniciará sin BD.');
  });

module.exports = pool;
```

**Características clave:**

1. **Tres modos de conexión:**
   - `DATABASE_URL`: Formato Railway (`mysql://user:pass@host:port/db`),
   - `DB_SOCKET`: Socket Unix (para MariaDB embebida),
   - `DB_*` individuales: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

2. **Validación temprana:** Si no hay `DB_SOCKET` ni `DATABASE_URL`, verifica que las variables `DB_*` estén definidas. Si falta alguna, termina el proceso con un mensaje claro.

3. **Pool de conexiones:** Usamos `mysql2/promise` con `createPool`. El pool mantiene hasta 10 conexiones abiertas simultáneamente, reciclándolas para evitar el overhead de abrir/cerrar conexiones en cada petición.

4. **TypeCast personalizado:** Los campos JSON de MySQL se convierten a string automáticamente (en lugar de parsearlos como objeto JavaScript).

5. **Conexión de prueba al iniciar:** Apenas se crea el pool, intentamos obtener una conexión para verificar que la base de datos responde. Si falla, mostramos un mensaje de error pero NO detenemos el servidor (para que Render pueda servir el health check aunque la DB esté caída).

## 4.4 render.yaml

**Ubicación:** `/Equipo_Metafit/render.yaml`  
**Propósito:** Infraestructura como código (Infrastructure as Code, IaC). Define cómo Render debe configurar el servicio.

```yaml
services:
  - type: web
    name: metafit-backend
    env: docker
    dockerfilePath: ./Dockerfile
    dockerContext: ./
    healthCheckPath: /health
    port: 3001

    envVars:
      - key: NODE_ENV
        value: production

      - key: DATABASE_URL
        value: mysql://root:password@host.railway.internal:3306/metafit

      - key: JWT_SECRET
        value: reemplazar_con_secreto_seguro_de_64_chars_minimo
      - key: JWT_EXPIRES_IN
        value: 8h

      - key: CORS_ORIGINS
        value: https://metafit-backend.onrender.com,http://localhost:5173

      - key: PORT
        value: "3001"
```

**NOTA IMPORTANTE:** El `render.yaml` original tiene `dockerfilePath: ./backend/Dockerfile` y `dockerContext: ./backend`. Esto funcionaba cuando el Dockerfile estaba dentro de `backend/`. Después movimos el Dockerfile a la raíz y ajustamos las rutas a `./Dockerfile` y `./` respectivamente.

## 4.5 .dockerignore

**Ubicación:** `/Equipo_Metafit/.dockerignore`  
**Propósito:** Excluir archivos innecesarios de la imagen Docker.

```
node_modules
.git
.cache
*.md
movil
frontend_web
__tests__
.env
```

## 4.6 Docker Compose (docker-compose.yml)

**Ubicación:** `/Equipo_Metafit/docker-compose.yml`  
**Propósito:** Orquestación local para desarrollo. No se usa en producción (Render), pero es útil para probar cambios antes de desplegar.

El archivo define 4 servicios:
- **db**: MySQL 8.0 con scripts SQL seed
- **backend**: Node.js Express
- **frontend**: Vite React (modo desarrollo)
- **phpmyadmin**: Interfaz web para administrar la DB

Para iniciar localmente:
```bash
docker compose up --build
```

Para probar el Dockerfile de producción localmente (sin Docker Compose):
```bash
docker build -t metafit-backend .
docker run -p 3001:3001 -e NODE_ENV=production metafit-backend
```

## 4.7 frontend_web/src/services/api.js

```javascript
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

La variable `VITE_API_URL` se define en el **Static Site** de Render en el panel de Environment Variables. Vite la "quema" en el código JavaScript durante el build.

## 4.8 frontend_web/.dockerignore

```
node_modules
npm-debug.log
dist
.git
```

## 4.9 frontend_web/Dockerfile (para desarrollo local)

**Ubicación:** `/Equipo_Metafit/frontend_web/Dockerfile`

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

Este Dockerfile SOLO se usa para desarrollo local con Docker Compose. En Render Static Site usamos el build command `npm run build` y publicamos la carpeta `dist/`.

---

# 5. Configuración de la base de datos

## 5.1 El plan original: Railway MySQL

### 5.1.1 ¿Qué es Railway?

Railway es una plataforma de despliegue similar a Render, pero con un enfoque más fuerte en bases de datos. Ofrece:
- **MySQL** y **PostgreSQL** como servicios gestionados
- **5 USD de crédito gratuito** al registrarse (sin necesidad de tarjeta de crédito inicialmente)
- Despliegue automático desde GitHub

### 5.1.2 Creación de la cuenta en Railway

1. Ir a https://railway.app
2. Hacer clic en "Login with GitHub"
3. Autorizar la aplicación Railway en GitHub
4. Una vez dentro, verás el dashboard con tus proyectos

### 5.1.3 Creación del proyecto "cozy-heart"

Railway asigna nombres aleatorios a los proyectos (como "cozy-heart" o "spring-breeze"). Esto es normal.

**Pasos para crear un proyecto MySQL:**

1. Desde el dashboard, click en "New Project"
2. Seleccionar "Provision MySQL"
3. Esperar 30-60 segundos mientras Railway crea la instancia MySQL
4. Una vez creado, ir a la pestaña "Connect" para ver las credenciales

### 5.1.4 Obtención de credenciales

Railway muestra las credenciales en la pestaña "Connect" del proyecto MySQL. Verás algo como:

```
MYSQL_URL: mysql://root:AbCdEfGhIjKlMn@roundhouse.proxy.rlwy.net:3306/railway
MYSQL_USER: root
MYSQL_PASSWORD: AbCdEfGhIjKlMn
MYSQL_HOST: roundhouse.proxy.rlwy.net
MYSQL_PORT: 3306
MYSQL_DATABASE: railway
```

### 5.1.5 Conexión desde el backend usando DATABASE_URL

Nuestro `db.js` está preparado para usar `DATABASE_URL` directamente:

```javascript
if (process.env.DATABASE_URL) {
  const parsed = new URL(process.env.DATABASE_URL);
  DB_HOST     = parsed.hostname;
  DB_PORT     = parsed.port || '3306';
  DB_USER     = decodeURIComponent(parsed.username);
  DB_PASSWORD = decodeURIComponent(parsed.password);
  DB_NAME     = parsed.pathname.replace(/^\//, '');
  DB_SSL      = parsed.searchParams.get('ssl') || process.env.DB_SSL || 'true';
}
```

En Render, simplemente configurabas:
```
DATABASE_URL=mysql://root:AbCdEfGhIjKlMn@roundhouse.proxy.rlwy.net:3306/railway
DB_SSL=true
```

### 5.1.6 Railway CLI

Railway también tiene una CLI (Command Line Interface) que permite interactuar desde la terminal:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Iniciar sesión
railway login

# Ver proyectos
railway list

# Ver variables de entorno del proyecto
railway connect

# Enlazar proyecto actual
railway link

# Abrir proyecto en el navegador
railway open
```

### 5.1.7 ⚠️ El problema: el trial expiró

Railway ofrece 5 USD de crédito gratuito al registrarse. La instancia MySQL cuesta aproximadamente:

| Plan | Costo | Incluye |
|---|---|---|
| Trial (crédito) | 5 USD gratis | ~$0.02/hora para MySQL |
| Hobby | 5 USD/mes | MySQL incluido |
| Pro | 20 USD/mes | Múltiples servicios |

Con 5 USD de crédito, una instancia MySQL a ~$0.02/hora dura aproximadamente 250 horas (~10 días). Después de eso, el servicio se "duerme" y eventualmente se elimina.

**Lo que nos pasó:**
1. Creamos MySQL en Railway → funcionó perfectamente
2. Configuramos Render para que apunte a Railway → todo en orden
3. Pasaron ~10 días... → Railway detuvo MySQL por falta de crédito
4. Intentamos acceder a Railway → "Project deleted" o "Service suspended"
5. El backend ya no podía conectarse → Render mostraba errores de conexión a la DB

**Síntomas del problema:**

```
[db.js] ❌ Error al conectar a MySQL: connect ECONNREFUSED roundhouse.proxy.rlwy.net:3306
[db.js] El servidor iniciará sin BD.
```

```
GET /health → 200
{
  "status": "degraded",
  "db": "MySQL no disponible",
  "timestamp": "2026-07-15T10:30:00.000Z"
}
```

## 5.2 La solución: MariaDB embebida en el contenedor

### 5.2.1 ¿Por qué MariaDB y no SQLite?

Cuando Railway expiró, consideramos varias alternativas:

| Alternativa | Ventajas | Desventajas |
|---|---|---|
| **SQLite** | No requiere servidor, archivo único | NO compatible con mysql2, requiere cambiar código |
| **MariaDB embebida** | Compatible con MySQL, sin cambios de código | Consume RAM, no persistente |
| **Pagar Railway** | Sigue funcionando como antes | Cuesta dinero |
| **Render MySQL** | No disponible en tier gratuito | Solo PostgreSQL gratuito |
| **Supabase** | PostgreSQL gratuito | Cambiar de MySQL a PostgreSQL |
| **PlanetScale** | MySQL serverless | Límite de 1GB, requiere cambios |

Ganó **MariaDB embebida** porque:
1. Es **100% compatible con MySQL** (mismo protocolo, mismas queries)
2. No requiere **ningún cambio** en el código del backend (solo apuntar a socket)
3. No necesita **servicios externos**
4. El `Dockerfile` ya existía; solo había que agregar `mariadb` como dependencia

### 5.2.2 ¿Qué es un socket Unix?

Para entender la solución, primero hay que entender qué es un **socket Unix**.

Normalmente, cuando te conectás a una base de datos, usás TCP/IP:
```
Aplicación → (red) → Servidor MySQL (puerto 3306)
```

Con un socket Unix, la comunicación es local:
```
Aplicación → (archivo socket) → Servidor MariaDB
```

**Ventajas del socket Unix vs TCP:**

| Aspecto | TCP (localhost) | Socket Unix |
|---|---|---|
| Velocidad | ~5μs por conexión | ~1μs por conexión |
| Seguridad | Requiere autenticación | Confianza local (no requiere pass) |
| Overhead | Stack TCP/IP completo | Solo escritura/lectura de archivo |
| Puerto | Ocupa puerto 3306 | No usa puerto |
| Alcance | Puede conectarse desde otros hosts | Solo local |

**En nuestro caso, la conexión se ve así:**

```
Node.js (mysql2) ─── socketPath="/run/mysqld/mysqld.sock" ─── MariaDB (mariadbd)
```

No se necesita contraseña porque la autenticación por socket Unix con usuario `root` local es implícitamente confiable.

### 5.2.3 Los scripts SQL

Los scripts SQL en `database/` son los mismos que usamos con Docker Compose local. No cambian en el despliegue a Render.

**01_schema.sql:** Define 17 tablas y 5 vistas. El esquema está normalizado en 3FN (Tercera Forma Normal). Incluye:
- Tablas maestras: `USUARIO`, `RESTRICCION`, `EJERCICIO`, `ALIMENTO`
- Tabla de herencia: `AFILIADO` (sub-tipo de `USUARIO`)
- Tablas pivot: `AFILIADO_RESTRICCION`, `EJERCICIO_RESTRICCION_EXCLUIDA`, `ALIMENTO_RESTRICCION_EXCLUIDA`
- Tablas de negocio: `CICLO`, `PLAN_ENTRENAMIENTO`, `PLAN_NUTRICIONAL`, `RUTINA`, `RUTINA_EJERCICIO`, `DETALLE_NUTRICIONAL`, `PROGRESO_FISICO`, `PAGO`, `CONFIGURACION`
- Vistas: `v_alimento_calorias`, `v_perfil_afiliado`, `v_ciclo_activo_afiliado`, `v_ultimo_progreso`, `v_catalogo_ejercicios_disponibles`

**02_seed.sql:** Inserta datos de ejemplo:
- 5 usuarios del staff (Admin, 2 Entrenadores, 2 Recepcionistas)
- 4 afiliados (Juan, Ana, Luis, Sofía)
- 6 restricciones médicas
- 19 ejercicios en el catálogo
- 20 alimentos en el catálogo
- 8 ciclos de entrenamiento (2 por afiliado)
- 24 rutinas
- 68 asignaciones de ejercicios en rutinas
- 8 planes nutricionales
- 54 detalles nutricionales
- 14 registros de progreso físico
- Pagos de membresía de ejemplo

## 5.3 Health check con y sin base de datos

El endpoint `/health` en `server.js` está diseñado para funcionar incluso si la base de datos está caída:

```javascript
app.get('/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'MySQL conectado', timestamp: new Date().toISOString() });
  } catch {
    res.json({ status: 'degraded', db: 'MySQL no disponible', timestamp: new Date().toISOString() });
  }
});
```

Esto es importante porque Render usa el health check para decidir si el servicio está "vivo". Si el health check devolviera 500 cuando la DB está caída, Render reiniciaría el contenedor constantemente. En cambio, devolvemos `status: 'degraded'` con código 200, indicando que el servidor está funcionando pero la base de datos no.

---

# 6. Despliegue del backend en Render

## 6.1 ¿Qué es Render?

Render es una Plataforma como Servicio (PaaS) que permite desplegar aplicaciones web y APIs con mínima configuración. Es similar a Heroku pero más moderno y con un tier gratuito más generoso.

**Tipos de servicios en Render:**

| Tipo | Descripción | Caso de uso |
|---|---|---|
| **Web Service** | Ejecuta tu código en un contenedor Docker | Backend API |
| **Static Site** | Sirve archivos HTML/JS/CSS estáticos | Frontend React |
| **Cron Job** | Ejecuta tareas programadas | Backups, reportes |
| **Background Worker** | Procesa colas de trabajos | Procesamiento asíncrono |

Render asigna URLs aleatorias con formato: `https://<nombre>-<slug>.onrender.com`

## 6.2 Creación del Web Service para el backend

### Método 1: Desde el Dashboard de Render (interfaz web)

1. Iniciar sesión en https://dashboard.render.com
2. Hacer clic en **"New +"** → **"Web Service"**
3. Conectar el repositorio de GitHub (`juanscarvajal04-droid/Equipo_Metafit`)
4. Configurar el servicio:

| Campo | Valor |
|---|---|
| **Name** | `metafit-backend` |
| **Region** | `Oregon (US West)` |
| **Branch** | `feature/juan-carvajal` |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./Dockerfile` |
| **Docker Context** | `./` |
| **Health Check Path** | `/health` |
| **Instance Type** | `Free` |

5. Configurar variables de entorno (ver sección 6.4)
6. Hacer clic en **"Create Web Service"**

### Método 2: Usando render.yaml (Infraestructura como Código)

Si tenés el archivo `render.yaml` en la raíz, podés crear el servicio desde el Blueprint:

1. En el dashboard, ir a **"New +"** → **"Blueprint"**
2. Conectar el repositorio
3. Render detecta automáticamente `render.yaml` y crea los servicios

**Ventajas de render.yaml:**
- **Reproducible**: podés borrar y recrear el servicio en un click
- **Versionado**: los cambios en la configuración se trackean en Git
- **Compartible**: otros miembros del equipo ven exactamente la configuración

### Método 3: Usando la API de Render (programático)

Render tiene una API REST que permite gestionar servicios mediante curl o scripts.

#### Autenticación en la API de Render

Necesitás un **API Key** (o "Bearer Token"):

1. Ir a https://dashboard.render.com → **Account Settings** → **API Keys**
2. Hacer clic en **"Create API Key"**
3. Darle un nombre (ej: "metafit-deploy")
4. Copiar el token (se muestra UNA SOLA VEZ)

**IMPORTANTE:** Guardá este token en un lugar seguro. Cualquiera que tenga este token puede controlar TODOS tus servicios en Render.

#### Listar servicios existentes

```bash
curl -s -H "Authorization: Bearer rnd_xxxxxxxxxxxxxx" \
  "https://api.render.com/v1/services" | jq '.'
```

#### Obtener detalles de un servicio específico

```bash
curl -s -H "Authorization: Bearer rnd_xxxxxxxxxxxxxx" \
  "https://api.render.com/v1/services/srv-xxxxx" | jq '.'
```

El `srv-xxxxx` es el ID del servicio. Podés obtenerlo del listado anterior o de la URL del dashboard (ej: `dashboard.render.com/web/srv-xxxxx`).

#### Actualizar variables de entorno vía API

Para cambiar las variables de entorno de un servicio sin tocar el dashboard:

```bash
# Primero, obtener la configuración actual
curl -s -H "Authorization: Bearer rnd_xxxxxxxxxxxxxx" \
  "https://api.render.com/v1/services/srv-xxxxx/env-vars" | jq '.'

# Luego, hacer PUT con las nuevas variables
curl -s -X PUT \
  -H "Authorization: Bearer rnd_xxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "envVars": [
      {"key": "NODE_ENV", "value": "production"},
      {"key": "JWT_SECRET", "value": "metafit_jwt_secret_key_2024"},
      {"key": "JWT_EXPIRES_IN", "value": "8h"},
      {"key": "CORS_ORIGINS", "value": "https://metafit-frontend-78x6.onrender.com,http://localhost:5173"},
      {"key": "PORT", "value": "3001"},
      {"key": "DB_SOCKET", "value": "/run/mysqld/mysqld.sock"}
    ]
  }' \
  "https://api.render.com/v1/services/srv-xxxxx/env-vars"
```

**Nota sobre DB_SOCKET:** Esta variable NO se configura en el dashboard de Render. Se exporta en `start.sh` antes de iniciar Node.js:

```bash
export DB_SOCKET="$MYSQL_SOCK"
```

Pero también podés definirla como variable de entorno global en Render (por ejemplo, si tenés múltiples servicios que la necesitan). En nuestro caso, la definición en `start.sh` es suficiente.

#### Disparar un deploy manual vía API

```bash
curl -s -X POST \
  -H "Authorization: Bearer rnd_xxxxxxxxxxxxxx" \
  "https://api.render.com/v1/services/srv-xxxxx/deploys"
```

Respuesta exitosa:
```json
{
  "id": "dep-xxxxx",
  "status": "created",
  "createdAt": "2026-07-15T10:30:00.000Z",
  "commit": {
    "id": "abc123def456",
    "message": "Fix database connection",
    "createdAt": "2026-07-15T10:25:00.000Z"
  }
}
```

#### Usar Python para interactuar con la API de Render

También se puede usar Python para automatizar interacciones más complejas:

```python
#!/usr/bin/env python3
"""
Script para gestionar servicios en Render.
Útil para despliegues automatizados.
"""
import requests
import json
import os

RENDER_API_KEY = os.environ.get("RENDER_API_KEY", "rnd_xxxxxxxxxxxxxx")
BASE_URL = "https://api.render.com/v1"
HEADERS = {
    "Authorization": f"Bearer {RENDER_API_KEY}",
    "Content-Type": "application/json"
}

def list_services():
    """Lista todos los servicios en Render"""
    resp = requests.get(f"{BASE_URL}/services", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

def get_service(service_id):
    """Obtiene detalles de un servicio"""
    resp = requests.get(f"{BASE_URL}/services/{service_id}", headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

def update_env_vars(service_id, env_vars):
    """Actualiza variables de entorno"""
    data = {"envVars": [{"key": k, "value": v} for k, v in env_vars.items()]}
    resp = requests.put(f"{BASE_URL}/services/{service_id}/env-vars",
                       headers=HEADERS, json=data)
    resp.raise_for_status()
    return resp.json()

def trigger_deploy(service_id):
    """Dispara un deploy manual"""
    resp = requests.post(f"{BASE_URL}/services/{service_id}/deploys",
                        headers=HEADERS)
    resp.raise_for_status()
    return resp.json()

# Ejemplo: listar servicios y mostrar sus nombres
services = list_services()
for svc in services:
    print(f"{svc['id']}: {svc['name']} ({svc['serviceDetails']['url']})")
```

## 6.3 El proceso de build y deploy

Cuando Render construye tu servicio Docker, estos son los pasos:

```
PASO 1: Render clona tu repositorio de GitHub
        └── git clone https://github.com/juanscarvajal04-droid/Equipo_Metafit
        └── git checkout feature/juan-carvajal

PASO 2: Render construye la imagen Docker
        └── docker build -f ./Dockerfile -t metafit-backend:latest .
        
        OUTPUT DEL BUILD:
        [+] Building 45.8s (12/12) FINISHED
        → [1/7] FROM node:22-alpine                         15.2s
        → [2/7] RUN apk add --no-cache mariadb...            8.5s
        → [3/7] WORKDIR /app                                 0.1s
        → [4/7] COPY backend/package*.json ./                0.3s
        → [5/7] RUN npm install --omit=dev                  12.4s
        → [6/7] COPY backend/ ./                             0.8s
        → [7/7] COPY database/ ./database/                   0.2s
        → exporting to oci image                             8.3s

PASO 3: Render sube la imagen a su registro interno
        └── docker push registry.render.com/metafit-backend:latest

PASO 4: Render despliega el contenedor
        └── docker run -d -p 3001:3001 \
                       -e NODE_ENV=production \
                       -e JWT_SECRET=... \
                       registry.render.com/metafit-backend:latest

PASO 5: El contenedor arranca
        └── bash start.sh se ejecuta
        └── MariaDB se inicializa (~5 segundos)
        └── Node.js arranca en puerto 3001

PASO 6: Render verifica el health check
        └── GET /health → 200 {"status": "ok", "db": "MySQL conectado"}
        └── Si el health check falla 3 veces seguidas, Render reinicia
```

**Tiempos típicos:**

| Etapa | Duración |
|---|---|
| Build Docker (primera vez) | 3-5 minutos |
| Build Docker (cacheado) | 30-60 segundos |
| Deploy (inicio del contenedor) | 10-20 segundos |
| Total primera vez | ~5 minutos |
| Total deploys subsequentes | ~1 minuto |

## 6.4 Variables de entorno en el backend

Estas son las variables de entorno que configuramos en Render para el backend:

| Variable | Valor | ¿Por qué? |
|---|---|---|
| `NODE_ENV` | `production` | Cambia comportamiento de Express (logs, errores, etc.) |
| `PORT` | `3001` | Puerto donde Express escucha. Render le asigna un puerto, pero nosotros fijamos 3001 |
| `JWT_SECRET` | `metafit_jwt_secret_key_2024` | Secreto para firmar JWT. En producción, usar un secreto largo y aleatorio |
| `JWT_EXPIRES_IN` | `8h` | Los tokens expiran después de 8 horas |
| `CORS_ORIGINS` | `https://metafit-frontend-78x6.onrender.com,http://localhost:5173` | Orígenes permitidos para CORS |

**Nota:** `DB_SOCKET` NO se define en Render porque la exporta `start.sh`.

## 6.5 Auto-deploy desde GitHub

Una de las características más útiles de Render es el **Auto-Deploy**: cada vez que hacés `git push` a la rama configurada, Render automáticamente reconstruye y redeploya el servicio.

### ¿Cómo funciona?

1. Hacés `git push origin feature/juan-carvajal`
2. GitHub recibe el push
3. GitHub envía un **webhook** a Render (configurado automáticamente cuando conectaste el repo)
4. Render recibe la notificación
5. Render clona la nueva versión del repo
6. Render construye la imagen Docker
7. Render despliega el nuevo contenedor
8. Render verifica el health check
9. Si todo está bien, Render redirige el tráfico al nuevo contenedor

### ¿Cómo desactivar auto-deploy temporalmente?

A veces querés hacer varios commits sin que cada uno dispare un deploy. Podés pausar auto-deploy:

**Desde el dashboard:**
1. Ir a tu Web Service
2. En la sección "Deploy" → "Deploy Settings"
3. Cambiar "Auto-Deploy" a "Disabled"

**Agregando `[skip render]` al mensaje del commit:**

```bash
git commit -m "Actualizar documentación [skip render]"
git push
```

Con `[skip render]` en el mensaje, Render ignora el push y no despliega.

### ¿Cómo forzar un deploy manual?

Si auto-deploy está desactivado:

**Desde el dashboard:**
1. Ir a tu Web Service
2. Hacer clic en **"Manual Deploy"** → **"Deploy latest commit"**

**Desde la API:**

```bash
curl -X POST \
  -H "Authorization: Bearer rnd_xxxxxxxxxxxxxx" \
  "https://api.render.com/v1/services/srv-xxxxx/deploys"
```

**Desde la CLI de Render (no oficial):**

Render no tiene CLI oficial, pero podés usar `curl` para todo.

---

# 7. Despliegue del frontend web en Render

## 7.1 Static Site vs Web Service

Cuando desplegamos el frontend, tenemos dos opciones en Render:

| Característica | Static Site | Web Service |
|---|---|---|
| ¿Qué sirve? | Archivos HTML/JS/CSS | Aplicación Node.js, Python, etc. |
| ¿Requiere build? | Sí (npm run build) | Sí (Docker build) |
| Velocidad | CDN global, muy rápido | Contenedor único |
| Escalabilidad | Auto-escala, ilimitado | Limitado al plan |
| Costo | Gratuito (100GB/mes) | Gratuito (512MB RAM) |
| Ideal para | React, Vue, Angular | APIs, backends |

Para MetaFit, el frontend es una SPA (Single Page Application). Una vez que Vite genera el build, solo son **archivos estáticos** (HTML, CSS, JavaScript). No necesitamos Node.js para servirlos. Por eso, **Static Site** es la opción correcta y más eficiente.

## 7.2 Creación del Static Site

1. En el dashboard de Render, hacer clic en **"New +"** → **"Static Site"**
2. Conectar el mismo repositorio de GitHub
3. Configurar:

| Campo | Valor |
|---|---|
| **Name** | `metafit-frontend` |
| **Region** | `Oregon (US West)` |
| **Branch** | `feature/juan-carvajal` |
| **Root Directory** | `frontend_web` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

4. Agregar variable de entorno:

| Clave | Valor |
|---|---|
| `VITE_API_URL` | `https://metafit-backend-rr18.onrender.com` |

5. Hacer clic en **"Create Static Site"**

### Explicación de la configuración:

- **Root Directory**: `frontend_web` — porque el `package.json` y `vite.config.js` están dentro de esa carpeta, no en la raíz del repositorio
- **Build Command**: `npm install && npm run build` — primero instala dependencias, luego ejecuta `vite build` que genera la carpeta `dist/`
- **Publish Directory**: `dist` — es la carpeta que Vite genera con los archivos estáticos
- **VITE_API_URL**: Es la URL del backend. Vite la inyecta en el código durante el build. El frontend usará esta URL para todas las peticiones a la API

## 7.3 ¿Qué pasa durante el build del frontend?

Cuando Render construye el Static Site:

```
PASO 1: Render clona el repositorio

PASO 2: Render ejecuta el build command:
        npm install
        → Instala: react, react-dom, axios, bootstrap, chart.js, etc.
        
        npm run build
        → vite build
        → Lee VITE_API_URL = "https://metafit-backend-rr18.onrender.com"
        → Reemplaza import.meta.env.VITE_API_URL por esa URL
        → Genera carpeta dist/ con:
            dist/
            ├── index.html
            ├── assets/
            │   ├── index-xxxx.js      ← Código React compilado
            │   ├── index-yyyy.css     ← Estilos compilados
            │   └── vendor-zzzz.js     ← Librerías (axios, bootstrap, etc.)
            └── ...

PASO 3: Render sube dist/ a su CDN global

PASO 4: Render asigna URL: https://metafit-frontend-78x6.onrender.com
```

## 7.4 ¿Qué NO se puede hacer con Static Site?

**Importante:** Un Static Site NO tiene Node.js corriendo en el servidor. Esto significa:

- ❌ **No podés tener un endpoint `/api/login`** en el frontend
- ❌ **No podés leer archivos del servidor** (base de datos, archivos locales)
- ❌ **No podés tener sesiones del lado del servidor**
- ✅ **Pero podés hacer peticiones AJAX** a tu backend en Render Web Service

Esto es exactamente lo que hace MetaFit: el frontend React hace peticiones `fetch`/`axios` a `https://metafit-backend-rr18.onrender.com`, que es el Web Service.

## 7.5 CORS: el puente entre frontend y backend

Cuando el frontend (en `metafit-frontend-78x6.onrender.com`) hace una petición al backend (en `metafit-backend-rr18.onrender.com`), el navegador aplica la política **CORS (Cross-Origin Resource Sharing)**.

Sin CORS, el navegador bloquea la petición con este error:

```
Access to XMLHttpRequest at 'https://metafit-backend-rr18.onrender.com/login' 
from origin 'https://metafit-frontend-78x6.onrender.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Para solucionarlo, nuestro backend tiene CORS configurado en `server.js`:

```javascript
const cors = require('cors');
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,...')
  .split(',')
  .map(o => o.trim());

// Aplica CORS a todas las rutas (excepto Swagger y health check)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || isLocalDev(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS bloqueado para origen: ${origin}`));
  },
}));
```

`CORS_ORIGINS` en Render contiene: `https://metafit-frontend-78x6.onrender.com,http://localhost:5173`

Esto permite que tanto el frontend desplegado como el desarrollo local puedan conectarse al backend.

## 7.6 Frontend separado vs frontend integrado

¿Por qué desplegamos el frontend como Static Site separado y no dentro del mismo contenedor que el backend?

| Enfoque | Ventajas | Desventajas |
|---|---|---|
| **Separado (Static Site)** | CDN rápido, escalable, menor costo | Dos URLs, CORS, dos deploys |
| **Integrado (mismo contenedor)** | Una sola URL, sin CORS | Contenedor más pesado, no escala bien |

Para MetaFit, la separación tiene sentido porque:
- El frontend es estático y puede servirse desde CDN (más rápido para usuarios)
- El backend necesita recursos de cómputo (CPU, RAM) para Node.js
- Si separamos, podemos escalar cada uno independientemente
- El costo es el mismo (ambos son gratis en Render)

---

# 8. Solución de problemas

Esta sección documenta **todos los errores que encontramos** durante el despliegue y cómo los solucionamos. Si algo sale mal, revisá acá primero.

## 8.1 Error: MariaDB no inicia

**Síntoma:**

```
>>> Inicializando base de datos MariaDB...
>>> Esperando MariaDB...
>>> Error: MariaDB no inició
```

**Causas posibles:**

1. El directorio `/run/mysqld` no existe o no tiene permisos
2. El usuario `mysql` no existe en el contenedor
3. Memoria insuficiente (el contenedor Free de Render tiene 512MB)

**Soluciones:**

Verificar que `start.sh` crea el directorio:

```bash
mkdir -p /run/mysqld
chown mysql:mysql /run/mysqld
```

Verificar que el usuario `mysql` existe (en Alpine, el paquete `mariadb` lo crea automáticamente):

```bash
id mysql
# → uid=100(mysql) gid=100(mysql)
```

Si el usuario no existe, crearlo:
```bash
adduser -S mysql -u 100
```

Para problemas de memoria, ajustar el buffer pool de InnoDB:
```bash
$MYSQLD --innodb-buffer-pool-size=64M ...  # Reducir de 128M a 64M
```

## 8.2 Error: Puerto 3001 ya está en uso

**Síntoma:**

```
Error: listen EADDRINUSE: address already in use :::3001
```

**Causa:** MariaDB o algún otro proceso está usando el puerto 3001.

**Solución:** En nuestro caso, MariaDB NO usa el puerto 3001 (usa socket Unix). Pero si hay otro conflicto, verificar con:

```bash
netstat -tlnp | grep 3001
```

## 8.3 Error: npm install falla en el build

**Síntoma:**

```
npm ERR! code ENOENT
npm ERR! syscall open
npm ERR! path /app/package.json
```

**Causa:** El `Dockerfile` copia los archivos desde `backend/`, pero `WORKDIR` es `/app`. Si `package.json` no está en la ruta correcta, npm no encuentra.

**Solución:** Verificar las rutas en el Dockerfile:

```dockerfile
WORKDIR /app
COPY backend/package*.json ./    # package.json va a /app/package.json
COPY backend/ ./                  # Todos los archivos del backend
```

## 8.4 Error: Health check falla

**Síntoma en Render:**

```
Health Check: GET /health → 502
```

**Causas posibles:**

1. Node.js no está escuchando en el puerto esperado
2. El health check se hace antes de que MariaDB termine de iniciar
3. El endpoint `/health` no existe o devuelve error

**Solución:**

Verificar que el puerto en `index.js` coincide con `EXPOSE` y con `PORT`:

```javascript
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`║          http://localhost:${PORT}`);
});
```

El health check en `server.js` nunca debe fallar con 500 (solo devuelve `degraded` si la DB está caída).

Render espera hasta el `startPeriod` (no configurable en Free) para que el contenedor arranque. Si MariaDB tarda más de 20 segundos, Render puede considerar que el health check falló antes de tiempo.

**Solución al timeout:** En el script `start.sh`, el loop de espera de MariaDB es de 20 iteraciones × 1 segundo = 20 segundos. Aumentar si es necesario:

```bash
for i in $(seq 1 30); do  # 30 segundos de espera
  ...
done
```

## 8.5 Error: Railway MySQL conexión rechazada

**Síntoma:**

```
[db.js] ❌ Error al conectar a MySQL: connect ECONNREFUSED roundhouse.proxy.rlwy.net:3306
```

**Causa:** El trial de Railway expiró y la base de datos MySQL fue eliminada.

**Solución:** Migrar a MariaDB embebida (ver sección 5.2). En `start.sh`, exportamos `DB_SOCKET` y ya no usamos `DATABASE_URL`.

```bash
export DB_SOCKET="$MYSQL_SOCK"
export DB_USER="root"
export DB_PASSWORD="ignored"
export DB_NAME="metafit"
```

## 8.6 Error: CORS bloquea la petición

**Síntoma en la consola del navegador:**

```
Access to XMLHttpRequest at 'https://metafit-backend-rr18.onrender.com/login'
from origin 'https://metafit-frontend-78x6.onrender.com' has been blocked by CORS policy
```

**Causa:** El backend no tiene la URL del frontend en `CORS_ORIGINS`.

**Solución:** Verificar que `CORS_ORIGINS` en Render incluye la URL exacta del frontend:

```
CORS_ORIGINS=https://metafit-frontend-78x6.onrender.com,http://localhost:5173
```

**Importante:** La URL debe coincidir EXACTAMENTE (incluyendo `https://`, sin barra al final).

## 8.7 Error: VITE_API_URL no funciona

**Síntoma:** El frontend carga pero las peticiones API van a `localhost:3001` en lugar de la URL de Render.

**Causa:** La variable de entorno `VITE_API_URL` no se configuró en Render Static Site, o se configuró después del build.

**Solución:** En Render Static Site, las variables de entorno se inyectan en **tiempo de build**, no en tiempo de ejecución. Si cambiás `VITE_API_URL`, tenés que **redeployar** el Static Site para que Vite la reemplaze en el código.

```bash
# En el dashboard de Render:
# 1. Ir al Static Site → Environment Variables
# 2. Agregar: VITE_API_URL = https://metafit-backend-rr18.onrender.com
# 3. Guardar
# 4. Manual Deploy → Deploy latest commit
```

**Pista:** Podés verificar el valor "quemado" en el bundle JavaScript:

```bash
# Buscar en el bundle de producción
curl -s https://metafit-frontend-78x6.onrender.com/assets/index-*.js | grep -o 'https://[^"]*onrender[^"]*'
```

## 8.8 Error: Token expirado / 401 en cada petición

**Síntoma:** Después de iniciar sesión exitosamente, las siguientes peticiones devuelven 401.

**Causas posibles:**

1. `JWT_SECRET` es diferente entre deploys (cada vez que se redeploya, se genera un nuevo secreto si no está fijo)
2. El token expiró (`JWT_EXPIRES_IN` muy corto)
3. La hora del servidor está desincronizada (Render sincroniza con NTP)

**Soluciones:**

Para 1: Fijar `JWT_SECRET` como variable de entorno en Render (NO usar un secreto generado aleatoriamente en cada build).

```bash
# Generar un secreto seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# → a1b2c3d4e5f6... (128 caracteres hexadecimales)

# Copiar esta salida y ponerla en JWT_SECRET en Render
```

Para 2: Usar `JWT_EXPIRES_IN=8h` (8 horas es razonable para un gimnasio).

## 8.9 Error: Contenedor se reinicia constantemente (crash loop)

**Síntoma:** En el dashboard de Render, el servicio muestra "Crashing" o "Restarting" constantemente.

**Causas posibles:**

1. MariaDB no puede inicializarse
2. Node.js lanza una excepción no capturada
3. El puerto no está disponible
4. Se agotó la memoria RAM (512MB en Free)

**Diagnóstico:** Revisar los logs de Render:

```bash
# Desde el dashboard: Service → Logs
# O usando la API:
curl -s -H "Authorization: Bearer rnd_xxxxxxxxxxxxxx" \
  "https://api.render.com/v1/services/srv-xxxxx/deploys" | jq '.[0].logs'
```

**Solución general:** Verificar que el contenedor puede arrancar localmente:

```bash
# Build local
docker build -t metafit-backend .

# Run local
docker run -p 3001:3001 metafit-backend

# Verificar logs
docker logs <container_id>
```

## 8.10 Error: La base de datos se reinicia con datos vacíos

**Síntoma:** Después de un redeploy, los datos ingresados por usuarios desaparecen.

**Causa:** Render no persiste el volumen de MariaDB entre deploys. En el tier gratuito, Render usa un **disco efímero** que se destruye cuando el contenedor se reinicia.

**Explicación:**

En `start.sh`:
```bash
if [ ! -d "$MYSQL_DATA/mysql" ]; then
  # Solo se ejecuta si el directorio NO existe
  mariadb-install-db ...
fi
```

Cuando Render redeploya:
1. Crea un NUEVO contenedor
2. El directorio `/var/lib/mysql` NO existe (el contenedor es nuevo)
3. `start.sh` detecta que el directorio no existe
4. Inicializa MariaDB y ejecuta los scripts SQL nuevamente
5. Los datos se pierden

**Soluciones posibles:**

1. **Aceptarlo**: Para fines de demostración o desarrollo, no importa perder datos
2. **Volumen persistente**: En plan pago de Render (7 USD/mes), podés montar un volumen persistente
3. **Base de datos externa**: Usar Railway pago, AWS RDS, o cualquier DBaaS
4. **Render Disks**: Render ofrece "Disk" persistente en planes Starter (7 USD/mes)

Para nuestro caso, aceptamos que los datos se pierdan en cada deploy porque es un proyecto académico.

## 8.11 Error: MariaDB tarda mucho en arrancar

**Síntoma:** El health check de Render falla porque MariaDB no arranca a tiempo.

**Causa:** `mariadb-install-db` puede tardar varios segundos, más `mysqld` arrancando, más la carga de datos SQL.

**Solución:** El script `start.sh` ya tiene un loop de espera de 20 segundos. Si no es suficiente:

```bash
for i in $(seq 1 30); do  # Aumentar a 30 segundos
  if mysqladmin ping --socket="$MYSQL_SOCK" 2>/dev/null; then
    break
  fi
  sleep 1
done
```

## 8.12 Error: render.yaml no se aplica correctamente

**Síntoma:** Render crea el servicio pero no usa las rutas correctas de Dockerfile o contexto.

**Causa:** `render.yaml` originalmente tenía:

```yaml
dockerfilePath: ./backend/Dockerfile
dockerContext: ./backend
```

Pero movimos el Dockerfile a la raíz y cambiamos a:

```yaml
dockerfilePath: ./Dockerfile
dockerContext: ./
```

Si el render.yaml no se actualiza, Render buscará el Dockerfile en `backend/Dockerfile` que ya no existe.

**Solución:** Actualizar `render.yaml` y commitear los cambios:

```yaml
services:
  - type: web
    name: metafit-backend
    env: docker
    dockerfilePath: ./Dockerfile
    dockerContext: ./
    healthCheckPath: /health
    port: 3001
```

O directamente crear el Web Service manualmente desde el dashboard sin usar render.yaml.

## 8.13 Error: Conexión SSL/TLS con MariaDB

**Síntoma:**

```
[db.js] ❌ Error al conectar a MySQL: ER_HANDSHAKE_ERROR
```

**Causa:** MariaDB embebida no tiene SSL configurado, pero `db.js` intenta conectarse con SSL si `DB_SSL=true` o si viene de `DATABASE_URL`.

**Solución:** Sin `DATABASE_URL` y sin `DB_SSL` configurado, el valor por defecto es `false`. En `start.sh`, no exportamos `DB_SSL`, así que queda en `false` y no se usa SSL.

Si aparece el error, verificar que la línea en `db.js` es correcta:

```javascript
DB_SSL = process.env.DB_SSL || 'false';
```

## 8.14 Error: No se puede hacer login

**Síntoma:** `POST /login` devuelve 401 aunque las credenciales sean correctas.

**Causas posibles:**

1. Los datos semilla no se cargaron correctamente
2. La contraseña en la base de datos no coincide con el hash
3. El usuario está inactivo

**Diagnóstico:**

```bash
# Verificar que el usuario existe en la DB
curl -s https://metafit-backend-rr18.onrender.com/health
# → {"status":"ok","db":"MySQL conectado",...}

# Si el health check dice "ok", la DB está funcionando
# Verificar login:
curl -s -X POST https://metafit-backend-rr18.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@metafit.com","password":"Admin123!"}'
```

**Credenciales correctas:**

| Email | Contraseña | Rol |
|---|---|---|
| carlos@metafit.com | Admin123! | Administrador |
| laura@metafit.com | Laura123! | Entrenador |
| andres@metafit.com | Andres123! | Entrenador |
| maria@metafit.com | Maria123! | Recepcionista |
| juan@gmail.com | MetaFit2025! | Afiliado |
| ana@gmail.com | MetaFit2025! | Afiliado |

## 8.15 Error: 415 Unsupported Media Type

**Síntoma:**

```json
{
  "error": "Content-Type debe ser application/json"
}
```

**Causa:** En `server.js`, tenemos una validación que exige `Content-Type: application/json` para POST, PUT y PATCH:

```javascript
app.use((req, res, next) => {
  const isSwaggerPath = req.path.startsWith('/api-docs') || req.path.startsWith('/swagger');
  if (!isSwaggerPath && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('application/json')) {
      return res.status(415).json({
        error: 'Content-Type debe ser application/json',
      });
    }
  }
  next();
});
```

**Solución:** Asegurarse de incluir `Content-Type: application/json` en cada petición que envía body:

```bash
curl -X POST https://metafit-backend-rr18.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@metafit.com","password":"Admin123!"}'
```

## 8.16 Error: Postman no puede conectar

**Síntoma:** Postman muestra "Could not get any response" o "Error: connect ECONNREFUSED".

**Causas:**

1. La URL del backend es incorrecta
2. El servicio está en "sleep" (Render duerme los servicios Free después de 15 minutos sin actividad)
3. El servicio está en deploy (cada deploy reinicia el contenedor)

**Solución:**

Para el problema de **sleep** de Render: Render "duerme" los servicios Free después de 15 minutos de inactividad. Cuando llega una petición, React los "despierta", pero el despertar tarda 30-60 segundos. Durante ese tiempo, las peticiones fallan con ECONNREFUSED.

Estrategias:
- Usar un **cron job** (como UptimeRobot o Kaffeine) para hacer ping al health check cada 5 minutos y evitar que se duerma
- Aceptar la latencia del "despertar" (tarda ~30s en responder la primera petición)

**UptimeRobot** (gratuito): https://uptimerobot.com
- Crear un monitor de tipo HTTP
- URL: `https://metafit-backend-rr18.onrender.com/health`
- Intervalo: 5 minutos
- ¡El backend nunca se dormirá!

## 8.17 Error: Build falla por falta de memoria

**Síntoma en logs de build:**

```
npm ERR! code 137
npm ERR! Out of memory (OOM)
```

**Causa:** Los builds en Render Free tienen 512MB de RAM. Si `npm install` requiere más memoria, puede fallar.

**Solución:**
- Usar `--omit=dev` para no instalar dependencias de desarrollo
- Reducir dependencias innecesarias en `package.json`
- Si persiste, contratar un plan con más memoria

## 8.18 Error: git push rechazado

**Síntoma:**

```
! [remote rejected] feature/juan-carvajal -> feature/juan-carvajal (pre-receive hook declined)
```

**Causa:** Posiblemente hay un hook de pre-receive en GitHub que rechaza el push (por ejemplo, si tenés integración con alguna herramienta).

**Solución:** Verificar el mensaje completo del error. Si es por protección de rama, necesitás permisos de administrador.

---

# 9. Verificación final

## 9.1 Health Check del backend

```bash
curl -s https://metafit-backend-rr18.onrender.com/health | json_pp
```

Respuesta esperada:

```json
{
  "status": "ok",
  "db": "MySQL conectado",
  "timestamp": "2026-07-28T10:00:00.000Z"
}
```

Si la base de datos no está disponible:

```json
{
  "status": "degraded",
  "db": "MySQL no disponible",
  "timestamp": "2026-07-28T10:00:00.000Z"
}
```

## 9.2 Login como administrador

```bash
curl -s -X POST https://metafit-backend-rr18.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@metafit.com","password":"Admin123!"}' | json_pp
```

Respuesta esperada:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id_usuario": 1,
    "nombres": "Carlos",
    "apellidos": "Ramírez",
    "correo": "carlos@metafit.com",
    "rol": "Administrador"
  }
}
```

## 9.3 Swagger UI

Abrir en el navegador: https://metafit-backend-rr18.onrender.com/api-docs

Deberías ver la interfaz de Swagger con todos los endpoints documentados. Podés probar cada endpoint directamente desde ahí.

## 9.4 Listar afiliados (requiere token)

```bash
# Primero obtener el token
TOKEN=$(curl -s -X POST https://metafit-backend-rr18.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@metafit.com","password":"Admin123!"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

# Luego listar afiliados
curl -s -H "Authorization: Bearer $TOKEN" \
  https://metafit-backend-rr18.onrender.com/afiliados | json_pp
```

## 9.5 Dashboard KPIs

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  https://metafit-backend-rr18.onrender.com/dashboard/kpis | json_pp
```

Respuesta esperada (datos del seed):

```json
{
  "total_afiliados": 4,
  "afiliados_activos": 4,
  "total_usuarios_staff": 5,
  "ciclos_activos": 4,
  "total_pagos_mes": 8,
  "ingresos_mes": 640000.00
}
```

## 9.6 Frontend web

Abrir en el navegador: https://metafit-frontend-78x6.onrender.com

Deberías ver la pantalla de login de MetaFit. Iniciar sesión con:
- **Email:** carlos@metafit.com
- **Contraseña:** Admin123!

## 9.7 Verificar CORS

```bash
# Simular una petición desde el frontend (con el origen correcto)
curl -s -X OPTIONS https://metafit-backend-rr18.onrender.com/login \
  -H "Origin: https://metafit-frontend-78x6.onrender.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -I
```

Respuesta esperada (headers):

```
HTTP/2 204
access-control-allow-origin: https://metafit-frontend-78x6.onrender.com
access-control-allow-methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
access-control-allow-headers: Content-Type, Authorization
access-control-allow-credentials: true
```

## 9.8 Verificar que el contenedor tiene MariaDB

```bash
# Conectarse al contenedor en Render (solo con plan pago)
# O verificar desde los logs del deploy
```

Desde los logs de Render (dashboard → Service → Logs), deberías ver algo similar a:

```
>>> Inicializando base de datos MariaDB...
>>> Esperando MariaDB...
>>> MariaDB listo
>>> Creando base de datos metafit...
>>> Ejecutando schema...
>>> Ejecutando seed...
>>> Ejecutando migración...
>>> Base de datos inicializada!
>>> Iniciando Node.js...

╔══════════════════════════════════════════════════════╗
║          MetaFit API — Backend MySQL                 ║
║          http://localhost:3001                        ║
╠══════════════════════════════════════════════════════╣
║  POST    /login                                      ║
║  GET     /usuarios                                   ║
║  ...

✅ MySQL conectado — socket: /run/mysqld/mysqld.sock | db: metafit
```

## 9.9 Verificar tipos de despliegue en Render

| Comando | Esperado |
|---|---|
| `curl -s https://metafit-backend-rr18.onrender.com/health` | `{"status":"ok","db":"MySQL conectado",...}` |
| `curl -s https://metafit-frontend-78x6.onrender.com` | HTML de React (contiene `<div id="root">`) |
| `curl -s https://metafit-frontend-78x6.onrender.com/login` | SPA: siempre sirve `index.html` |

## 9.10 Verificar la app móvil (Expo)

La app móvil no se despliega en Render. Se ejecuta localmente con Expo y apunta al backend de Render.

```bash
# En el directorio movil/
cd movil
npx expo start

# La app en tu teléfono se conectará a:
# https://metafit-backend-rr18.onrender.com
```

---

# 10. Lecciones aprendidas y recomendaciones

## 10.1 Lecciones técnicas

### Lección 1: No dependas de trials gratuitos para servicios críticos

Railway nos dio 5 USD de crédito. Pensamos que era suficiente, pero MySQL consume ~$0.02/hora = ~$14.40/mes. El crédito duró solo 10 días.

**Recomendación:** Si usás un servicio gratuito, asumí que puede desaparecer en cualquier momento. Tené un plan B. En nuestro caso, el plan B fue MariaDB embebida.

### Lección 2: MariaDB embebida es una solución temporal, no permanente

Embeber MariaDB en el contenedor de Node.js funciona, pero:
- Los datos se pierden en cada deploy
- MariaDB consume RAM que Node.js necesita
- No podés escalar horizontalmente

**Recomendación:** Para un proyecto real de producción:
- Usá **Railway de pago** (5 USD/mes) para MySQL
- O **Amazon RDS** (desde ~15 USD/mes)
- O **Render PostgreSQL** (los planes gratuitos de Render incluyen PostgreSQL con persistencia)

### Lección 3: Los sockets Unix son más rápidos que TCP

Cuando MariaDB y Node.js están en el mismo contenedor, usar socket Unix en lugar de `localhost:3306` reduce la latencia de conexión y no requiere contraseña.

**Evidencia:** Consultar la base de datos por socket Unix tomó ~1-2ms vs ~5-8ms por TCP.

### Lección 4: Siempre probá el Dockerfile localmente antes de desplegar

Los builds en Render tardan 3-5 minutos. Por cada error, perdés 5 minutos. En cambio, un build local tarda 30-60 segundos.

**Flujo recomendado:**

```bash
# 1. Hacer cambios en el código
# 2. Build local
docker build -t metafit-backend .

# 3. Probar localmente
docker run -p 3001:3001 metafit-backend

# 4. Si funciona, commitear y pushear
git add .
git commit -m "Descripción del cambio"
git push
# Render hace auto-deploy automáticamente
```

### Lección 5: Las variables de entorno de Vite se queman en tiempo de build

`VITE_API_URL` se reemplaza en el código JavaScript durante el build. Si cambiás la URL después del build, no surte efecto hasta que reconstruyas.

**Recomendación:** Si el backend cambia de URL, redeployá el frontend también.

### Lección 6: Los logs son tu mejor amigo

Cuando algo falla en Render, lo primero que hacés es mirar los logs. Render muestra logs de:
- Build (mientras se construye la imagen)
- Runtime (una vez que el contenedor está corriendo)

En el dashboard: Service → Logs → elegir "Build" o "Runtime".

### Lección 7: Los servicios gratuitos de Render se duermen

Después de 15 minutos sin actividad, Render "pone a dormir" el Web Service gratuito. La primera petición después del sueño tarda 30-60 segundos en responder.

**Soluciones:**
- Usar **UptimeRobot** (gratuito) para hacer ping cada 5 minutos
- Pagar el plan **Starter** (7 USD/mes) que no duerme los servicios

## 10.2 Lecciones sobre el proceso

### Lección 8: Documentá cada paso mientras lo hacés

Este manual nació de la frustración de tener que resolver los mismos problemas dos veces. Documentar mientras desplegás te ahorra horas después.

### Lección 9: Usá Git con branches por feature

Trabajar en `feature/juan-carvajal` nos permitió experimentar con el despliegue sin afectar la rama principal. Cada intento fallido era un commit que podíamos revertir.

### Lección 10: Las APIs de las plataformas son poder

Tanto Render como Railway tienen APIs REST completas. Usarlas te permite:
- Automatizar deploys desde scripts
- Integrar con CI/CD
- Cambiar configuración sin tocar el dashboard

### Lección 11: MariaDB y MySQL no son 100% intercambiables

Aunque MariaDB es un "reemplazo directo" de MySQL, hay diferencias sutiles:
- MariaDB usa `mariadbd` en lugar de `mysqld`
- Algunas funciones tienen nombres diferentes
- La autenticación por defecto puede diferir

En la práctica, para las queries que usa MetaFit (SELECT, INSERT, UPDATE, DELETE, JOINs básicos), no hay diferencias.

## 10.3 Recomendaciones para el futuro

### A corto plazo:

1. **Agregar un volume persistente** en Render (plan Starter, 7 USD/mes)
2. **Configurar UptimeRobot** para evitar que el backend se duerma
3. **Crear un pipeline CI/CD** con GitHub Actions que:
   - Ejecute los tests automáticamente
   - Construya la imagen Docker
   - Despliegue a Render si los tests pasan

### A mediano plazo:

4. **Migrar a una base de datos externa** (Railway Pago, AWS RDS, o Supabase)
5. **Separar MariaDB del contenedor de Node.js** (usar Render PostgreSQL o Railway MySQL)
6. **Configurar dominio personalizado** (metafit.app o similar)
7. **Agregar HTTPS con certificado SSL** (Render lo da gratis, pero con dominio personalizado)

### A largo plazo:

8. **Automatizar backups** de la base de datos
9. **Implementar monitoreo** (Datadog, New Relic, o Prometheus)
10. **Configurar múltiples entornos** (development, staging, production)
11. **Agregar rate limiting más granular** por endpoint
12. **Implementar caché con Redis** (Render ofrece Redis gratis en planes Starter)

---

# 11. Apéndice: comandos útiles

## 11.1 Git

```bash
# Estados básicos
git status                    # Ver archivos modificados
git log --oneline -10         # Últimos 10 commits (resumido)
git log --graph --oneline     # Historial en árbol
git diff                      # Cambios sin stage
git diff --staged             # Cambios en stage

# Branches
git branch                    # Listar ramas
git checkout -b feature/nueva # Crear y cambiar a nueva rama
git merge feature/nueva       # Fusionar rama
git branch -d feature/nueva   # Eliminar rama (ya fusionada)

# Remotos
git remote -v                 # Ver remotos
git push origin feature/juan-carvajal  # Pushear a remoto
git pull origin main          # Traer cambios de main

# Deshacer cambios
git checkout -- archivo.js    # Descartar cambios en archivo
git reset HEAD archivo.js     # Quitar de stage
git reset --soft HEAD~1       # Deshacer último commit (mantiene cambios)
git reset --hard HEAD~1       # Deshacer último commit (pierde cambios)

# Tags
git tag v1.0.0                # Crear tag
git push origin v1.0.0        # Pushear tag

# Stash
git stash                     # Guardar cambios temporales
git stash pop                 # Recuperar últimos cambios guardados
git stash list                # Listar stashes
```

## 11.2 Docker

```bash
# Build de imagen
docker build -t metafit-backend .                          # Build con tag
docker build -t metafit-backend:v1.0 .                     # Build con versión
docker build --no-cache -t metafit-backend .               # Build sin cache

# Run de contenedor
docker run -p 3001:3001 metafit-backend                    # Run con mapeo de puerto
docker run -d -p 3001:3001 --name metafit metafit-backend  # Run en background
docker run -e NODE_ENV=production metafit-backend          # Run con variable

# Gestión de contenedores
docker ps                       # Contenedores activos
docker ps -a                    # Todos los contenedores
docker stop metafit             # Detener contenedor
docker start metafit            # Iniciar contenedor detenido
docker rm metafit               # Eliminar contenedor
docker logs -f metafit          # Logs en tiempo real
docker exec -it metafit bash    # Shell interactivo dentro del contenedor

# Gestión de imágenes
docker images                   # Listar imágenes
docker rmi metafit-backend      # Eliminar imagen
docker system prune             # Limpiar imágenes/containers no usados

# Docker Compose
docker compose up               # Iniciar todos los servicios
docker compose up --build       # Reconstruir e iniciar
docker compose down             # Detener todos los servicios
docker compose down -v          # Detener y eliminar volúmenes
docker compose logs -f          # Logs de todos los servicios
docker compose ps               # Estado de todos los servicios

# Más comandos útiles
docker inspect metafit          # Info detallada del contenedor
docker stats                    # Uso de recursos (CPU, RAM, red)
docker container prune          # Eliminar todos los contenedores detenidos
docker image prune              # Eliminar imágenes sin tag
```

## 11.3 Render API

```bash
# Configuración
RENDER_API_KEY="rnd_xxxxxxxxxxxxxx"
BASE="https://api.render.com/v1"
AUTH="Authorization: Bearer $RENDER_API_KEY"

# Servicios
curl -s -H "$AUTH" "$BASE/services"                          # Listar servicios
curl -s -H "$AUTH" "$BASE/services/srv-xxxxx"                # Detalle del servicio
curl -s -H "$AUTH" "$BASE/services/srv-xxxxx/env-vars"       # Variables de entorno
curl -s -X PUT -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"envVars": [{"key":"NODE_ENV","value":"production"}]}' \
  "$BASE/services/srv-xxxxx/env-vars"                        # Actualizar env vars

# Deploys
curl -s -X POST -H "$AUTH" "$BASE/services/srv-xxxxx/deploys" # Disparar deploy
curl -s -H "$AUTH" "$BASE/services/srv-xxxxx/deploys"         # Listar deploys
curl -s -H "$AUTH" "$BASE/services/srv-xxxxx/deploys/dep-yyyy" # Detalle del deploy

# Logs
curl -s -H "$AUTH" "$BASE/services/srv-xxxxx/deploys/dep-yyyy/logs" # Logs del deploy

# Utilidades con jq
curl -s -H "$AUTH" "$BASE/services" | jq '.[].name'          # Solo nombres
curl -s -H "$AUTH" "$BASE/services" | jq '.[] | {name, url: .serviceDetails.url}'  # Nombre + URL
```

## 11.4 Railway CLI

```bash
# Instalación
npm install -g @railway/cli

# Autenticación
railway login                    # Login con GitHub
railway logout                   # Logout

# Proyectos
railway list                     # Listar proyectos
railway init                     # Inicializar proyecto en directorio actual
railway link                     # Enlazar proyecto existente

# Variables de entorno
railway variables                # Ver variables del proyecto enlazado
railway variables --json         # Ver variables en formato JSON

# Abrir en navegador
railway open                     # Abrir proyecto en Railway

# MySQL
railway connect                  # Mostrar string de conexión
# Ejemplo de conexión directa a Railway MySQL:
mysql -h roundhouse.proxy.rlwy.net -P 3306 -u root -p
# Password: (la que aparece en Railway Dashboard)
```

## 11.5 MySQL / MariaDB CLI

```bash
# Conexión por socket Unix (como en el contenedor)
mysql --socket=/run/mysqld/mysqld.sock metafit

# Conexión por TCP
mysql -h localhost -P 3306 -u root -p metafit

# Comandos SQL útiles
SHOW DATABASES;                              # Listar bases de datos
USE metafit;                                 # Seleccionar base de datos
SHOW TABLES;                                 # Listar tablas
DESCRIBE USUARIO;                            # Estructura de tabla
SELECT * FROM USUARIO;                       # Todos los registros
SELECT * FROM AFILIADO;                      # Todos los afiliados
EXPLAIN SELECT * FROM USUARIO WHERE correo='carlos@metafit.com';  # Plan de ejecución

# Verificación de datos
SELECT COUNT(*) AS total FROM USUARIO;       # 9 usuarios
SELECT COUNT(*) AS total FROM AFILIADO;      # 4 afiliados
SELECT COUNT(*) AS total FROM CICLO;         # 8 ciclos
SELECT COUNT(*) AS total FROM RUTINA;        # 24 rutinas

# Diagnóstico
SHOW PROCESSLIST;                            # Conexiones activas
SHOW STATUS LIKE '%connect%';               # Estadísticas de conexión
SHOW VARIABLES LIKE '%socket%';             # Ruta del socket Unix
SELECT VERSION();                            # Versión de MariaDB/MySQL

# Backup y restore (manual)
mysqldump --socket=/run/mysqld/mysqld.sock metafit > backup.sql
mysql --socket=/run/mysqld/mysqld.sock metafit < backup.sql
```

## 11.6 Curl

```bash
# GET
curl https://metafit-backend-rr18.onrender.com/health

# POST con JSON
curl -X POST https://metafit-backend-rr18.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@metafit.com","password":"Admin123!"}'

# GET con token
curl -H "Authorization: Bearer <token>" \
  https://metafit-backend-rr18.onrender.com/afiliados

# POST con token
curl -X POST https://metafit-backend-rr18.onrender.com/afiliados \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nombres": "Nuevo",
    "apellidos": "Afiliado",
    "correo": "nuevo@test.com",
    "contrasena": "Temp123!",
    "sexo": "Masculino",
    "fecha_nacimiento": "1990-01-01",
    "estatura_cm": 175,
    "telefono": "3000000000"
  }'

# PATCH
curl -X PATCH https://metafit-backend-rr18.onrender.com/afiliados/6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"telefono": "3001111111"}'

# DELETE
curl -X DELETE https://metafit-backend-rr18.onrender.com/afiliados/10 \
  -H "Authorization: Bearer <token>"

# Headers
curl -I https://metafit-backend-rr18.onrender.com/health

# Verboso (útil para debugging)
curl -v https://metafit-backend-rr18.onrender.com/health

# Guardar token en variable
TOKEN=$(curl -s -X POST https://metafit-backend-rr18.onrender.com/login \
  -H "Content-Type: application/json" \
  -d '{"email":"carlos@metafit.com","password":"Admin123!"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")
echo $TOKEN
```

## 11.7 Node.js

```bash
# NPM
npm init -y                         # Inicializar package.json
npm install express mysql2          # Instalar dependencias
npm install --save-dev nodemon      # Instalar dependencia de desarrollo
npm install --omit=dev              # Instalar solo producción
npm uninstall paquete               # Desinstalar
npm update                          # Actualizar dependencias
npm outdated                        # Ver dependencias desactualizadas

# Scripts (definidos en package.json)
npm start                           # node index.js
npm run dev                         # nodemon index.js
npm test                            # jest
npm run build                       # vite build (en frontend)

# Utilidades
node -e "console.log('hola')"       # Ejecutar código inline
node -e "console.log(process.env)"  # Ver variables de entorno

# Generar JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Verificar versión
node --version
npm --version
npx --version
```

## 11.8 Linux / Alpine

```bash
# Alpine package manager
apk add mariadb                     # Instalar paquete
apk add --no-cache mariadb          # Instalar sin cache
apk del mariadb                     # Desinstalar
apk update                          # Actualizar lista de paquetes
apk search mysql                    # Buscar paquetes

# Archivos y directorios
ls -la                              # Listar archivos (incluyendo ocultos)
ls -lh archivo                      # Listar con tamaño legible
pwd                                 # Directorio actual
mkdir -p /ruta/con/subcarpetas      # Crear directorios
chmod +x script.sh                  # Dar permisos de ejecución
chown mysql:mysql /run/mysqld       # Cambiar propietario
cp origen destino                   # Copiar
mv origen destino                   # Mover/renombrar
rm archivo                          # Eliminar archivo
rm -rf directorio                   # Eliminar directorio (¡cuidado!)

# Procesos
ps aux                              # Todos los procesos
ps aux | grep node                  # Filtrar procesos
kill -9 PID                         # Matar proceso (forzado)
top                                 # Monitor de procesos
htop                                # Monitor interactivo (si está instalado)

# Red
netstat -tlnp                       # Puertos en escucha
ping google.com                     # Verificar conectividad
curl -I https://example.com         # Ver headers HTTP
wget https://example.com            # Descargar archivo

# Usuarios
whoami                              # Usuario actual
id                                  # UID/GID
adduser -S mysql                    # Crear usuario del sistema (Alpine)
useradd mysql                       # Crear usuario (Debian/Ubuntu)
```

## 11.9 Expo

```bash
# Iniciar proyecto
npx create-expo-app movil           # Crear nuevo proyecto Expo
cd movil
npx expo start                      # Iniciar servidor de desarrollo
npx expo start --tunnel             # Iniciar con túnel (ngrok)

# Build
npx expo build:android              # Build APK para Android
npx expo build:ios                  # Build IPA para iOS
npx expo build:web                  # Build para web

# Publicar (Expo Go)
npx expo publish                    # Publicar para Expo Go
npx expo export                     # Exportar para web estático

# Variables de entorno
EXPO_PUBLIC_API_URL=https://metafit-backend-rr18.onrender.com npx expo start

# Limpiar cache
npx expo start -c                   # Iniciar limpiando cache
```

## 11.10 Monitoreo y mantenimiento

```bash
# UptimeRobot API (mantener servicio despierto)
curl -s "https://api.uptimerobot.com/v2/getMonitors" \
  -d "api_key=u123456-xxxxxx&format=json&logs=1"

# Verificar SSL
openssl s_client -connect metafit-backend-rr18.onrender.com:443

# DNS lookup
nslookup metafit-backend-rr18.onrender.com
dig metafit-backend-rr18.onrender.com

# Traceroute
traceroute metafit-backend-rr18.onrender.com

# Velocidad de respuesta
curl -o /dev/null -s -w "Connect: %{time_connect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" \
  https://metafit-backend-rr18.onrender.com/health
```

---

## Índice de errores y soluciones rápidas

| Error | Síntoma | Solución rápida | Sección |
|---|---|---|---|
| MariaDB no arranca | `Error: MariaDB no inició` | Verificar `/run/mysqld` y permisos | 8.1 |
| Puerto en uso | `EADDRINUSE` | Verificar que MariaDB no usa puerto 3001 | 8.2 |
| Build falla | `ENOENT package.json` | Verificar rutas en Dockerfile | 8.3 |
| Health check 502 | Servicio no responde | Esperar que MariaDB termine de arrancar | 8.4 |
| Railway offline | `ECONNREFUSED` | Migrar a MariaDB embebida | 8.5 |
| CORS bloqueado | `CORS policy` | Agregar frontend URL a CORS_ORIGINS | 8.6 |
| VITE_API_URL no funciona | Peticiones a localhost | Redeployar Static Site después de cambiar variable | 8.7 |
| Token expirado | 401 constante | Verificar JWT_SECRET fijo en Render | 8.8 |
| Crash loop | Contenedor se reinicia | Revisar logs, probar localmente | 8.9 |
| Datos perdidos | Seed se ejecuta de nuevo | Aceptar (tier gratuito) o contratar volumen persistente | 8.10 |
| MariaDB lento | Health check timeout | Aumentar loop de espera en start.sh | 8.11 |
| render.yaml no funciona | Rutas incorrectas | Actualizar render.yaml o crear manualmente | 8.12 |
| SSL error | `ER_HANDSHAKE_ERROR` | No usar SSL con MariaDB local | 8.13 |
| Login falla | 401 en /login | Verificar credenciales en seed SQL | 8.14 |
| 415 Media Type | `Content-Type debe ser application/json` | Agregar header en peticiones | 8.15 |
| Postman no conecta | ECONNREFUSED | Esperar que Render "despierte" el servicio | 8.16 |
| OOM en build | `npm ERR! code 137` | Usar `--omit=dev`, reducir dependencias | 8.17 |

---

## Glosario

| Término | Definición |
|---|---|
| **API** | Application Programming Interface. Conjunto de endpoints que permiten la comunicación entre sistemas. |
| **BCrypt** | Algoritmo de hashing de contraseñas. MetaFit usa 12 rondas (~250ms por hash). |
| **Build** | Proceso de compilar el código fuente en artefactos listos para producción. |
| **CDN** | Content Delivery Network. Red de servidores que distribuyen contenido estático globalmente. |
| **CI/CD** | Continuous Integration / Continuous Deployment. Automatización de pruebas y despliegues. |
| **CORS** | Cross-Origin Resource Sharing. Mecanismo de seguridad del navegador para peticiones entre dominios. |
| **CRUD** | Create, Read, Update, Delete. Operaciones básicas sobre datos. |
| **DDL** | Data Definition Language. Sentencias SQL que definen estructura (CREATE, ALTER, DROP). |
| **DML** | Data Manipulation Language. Sentencias SQL que manipulan datos (INSERT, UPDATE, DELETE). |
| **Docker** | Plataforma de contenedores que permite empaquetar aplicaciones con sus dependencias. |
| **DNS** | Domain Name System. Sistema que traduce nombres de dominio a direcciones IP. |
| **Endpoint** | URL específica de una API (ej: `POST /login`). |
| **FK** | Foreign Key. Columna que referencia la clave primaria de otra tabla. |
| **IaC** | Infrastructure as Code. Configuración de infraestructura mediante archivos (ej: render.yaml). |
| **JWT** | JSON Web Token. Token de autenticación que contiene información codificada del usuario. |
| **KPI** | Key Performance Indicator. Métrica de rendimiento (ej: total de afiliados activos). |
| **Paas** | Platform as a Service. Plataforma que gestiona la infraestructura (Render, Railway, Heroku). |
| **PK** | Primary Key. Columna que identifica únicamente cada registro en una tabla. |
| **P值得** | Servicio web que gestiona la infraestructura de aplicaciones |
| **SPA** | Single Page Application. Aplicación web que carga una sola página HTML y la actualiza dinámicamente. |
| **SQL** | Structured Query Language. Lenguaje para gestionar bases de datos relacionales. |
| **SSL/TLS** | Secure Sockets Layer / Transport Layer Security. Protocolo de cifrado para comunicaciones seguras. |
| **TTFB** | Time To First Byte. Tiempo que tarda el servidor en enviar el primer byte de respuesta. |
| **3FN** | Tercera Forma Normal. Nivel de normalización de base de datos que elimina dependencias transitivas. |

---

## Resumen ejecutivo

```
╔══════════════════════════════════════════════════════════════════╗
║               RESUMEN DEL DESPLIEGUE METAFIT                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Backend    : Render Web Service (Docker + MariaDB embebida)    ║
║  URL        : https://metafit-backend-rr18.onrender.com         ║
║  Puerto     : 3001                                              ║
║  Health     : GET /health                                       ║
║  Docs       : GET /api-docs (Swagger UI)                        ║
║                                                                  ║
║  Frontend   : Render Static Site (Vite build)                   ║
║  URL        : https://metafit-frontend-78x6.onrender.com        ║
║  Build cmd  : npm install && npm run build                      ║
║  Publish dir: dist/                                             ║
║  Env var    : VITE_API_URL = https://metafit-backend-rr18...    ║
║                                                                  ║
║  App Móvil  : Expo (desarrollo local)                           ║
║  API URL    : https://metafit-backend-rr18.onrender.com         ║
║                                                                  ║
║  Repositorio: https://github.com/juanscarvajal04-droid/         ║
║                Equipo_Metafit                                    ║
║  Rama       : feature/juan-carvajal                             ║
║                                                                  ║
║  Credenciales de prueba:                                        ║
║    Admin    : carlos@metafit.com / Admin123!                    ║
║    Afiliado : juan@gmail.com  / MetaFit2025!                    ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

*Este manual fue escrito durante el despliegue real de MetaFit en Render. Cada error documentado ocurrió, cada solución se probó, cada comando se ejecutó. Esperamos que te sea tan útil como nos fue a nosotros.*

*— Juan S. Carvajal, Julio 2026*

---

**Fin del manual**
