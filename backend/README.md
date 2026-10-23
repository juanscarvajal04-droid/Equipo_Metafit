# Backend MetaFit — API REST

Backend de MetaFit construido con **Node.js + Express + MySQL**. Expone la API que consumen la web de gestión y la app móvil de afiliados, con autenticación JWT, control de acceso por roles y documentación OpenAPI 3.0.

- **Producción:** https://metafit-backend-rr18.onrender.com
- **Swagger UI:** https://metafit-backend-rr18.onrender.com/api-docs
- **Health check:** https://metafit-backend-rr18.onrender.com/health

---

## Arquitectura MVC + Services

El backend sigue una separación por capas. Cada petición recorre este flujo:

```text
Cliente HTTP
    │
    ▼
routes/          Express Router + anotaciones @swagger + middlewares de rol
    │
    ▼
middlewares/     Validación de JWT, autorización por rol y carga de archivos
    │
    ▼
controllers/     Reciben la petición, validan datos de entrada y arman la respuesta HTTP
    │
    ▼
services/        Reglas de negocio, transacciones y coordinación entre modelos
    │
    ▼
models/          Consultas SQL parametrizadas y acceso a MySQL
    │
    ▼
MySQL 8 (producción) / MariaDB 11 (local)
```

### Responsabilidades por capa

| Carpeta | Responsabilidad |
|---|---|
| `routes/` | Define endpoints, documentación Swagger y middlewares por ruta |
| `controllers/` | Traduce HTTP ↔ casos de uso; valida parámetros y responde con códigos HTTP |
| `services/` | Lógica de negocio, cálculos, transacciones y llamadas a servicios externos |
| `models/` | Acceso a datos con `mysql2/promise` y consultas parametrizadas |
| `middlewares/` | `auth.js` (JWT + roles) y `uploadFoto.js` (Multer/Cloudinary) |
| `config/` | Conexión a BD, Cloudinary y generación dinámica de Swagger |
| `migrations/` | Migraciones idempotentes que se ejecutan al arrancar |
| `cron/` | Recordatorios automáticos de pagos por vencer |
| `templates/` | Plantillas de correo (bienvenida, recuperación, etc.) |
| `utils/` | Utilidades compartidas y runner de migraciones |
| `__tests__/` | Pruebas unitarias y de integración con Jest + Supertest |

### Estructura

```text
backend/
├── config/
│   ├── db.js                 Pool de MySQL
│   ├── cloudinary.js         Configuración de imágenes
│   └── swagger.js            Especificación OpenAPI 3.0
├── controllers/              Controladores HTTP
├── services/                 Reglas de negocio
├── models/                   Acceso a datos
├── routes/                   Endpoints + documentación Swagger
├── middlewares/              Autenticación, roles y subida de archivos
├── migrations/               Migraciones idempotentes de arranque
├── cron/                     Recordatorio de pagos
├── templates/                Correos transaccionales
├── utils/                    Utilidades y migrationRunner
├── __tests__/                Suite de pruebas
├── index.js                  Arranque: migraciones, cron y servidor
├── server.js                 Configuración de Express y rutas
├── start.sh                  Arranque alternativo con BD embebida
├── Dockerfile
└── package.json
```

---

## Requisitos

- Node.js 20 o 22
- npm 10+
- MySQL 8 o MariaDB 11
- Docker Desktop (recomendado para el entorno local completo)

---

## Configuración

### Opción A — Docker Compose (recomendado)

Desde la raíz del repositorio:

```bash
cp .env.example .env
docker compose up -d --build
```

Docker inyecta las variables al contenedor del backend. La API queda en `http://localhost:3001`.

### Opción B — Ejecución directa

El backend carga el archivo `backend/.env`:

```bash
cp .env.example backend/.env
```

Ajusta `DB_HOST` según corresponda:

- `DB_HOST=db` si el backend corre dentro de Docker Compose.
- `DB_HOST=127.0.0.1` si el backend corre en el host y la BD está publicada en el puerto 3306.

```bash
cd backend
npm ci
npm run dev
```

### Variables principales

| Variable | Uso |
|---|---|
| `PORT` | Puerto del servidor (por defecto `3001`) |
| `DATABASE_URL` | URL completa de conexión; alternativa a las variables `DB_*` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexión individual a MySQL |
| `DB_SSL` | `true` para habilitar SSL |
| `DB_SOCKET` | Socket Unix para el modo de BD embebida |
| `JWT_SECRET` | Secreto de firma de los tokens |
| `JWT_EXPIRES_IN` | Vigencia del token (por defecto `8h`) |
| `CORS_ORIGINS` | Orígenes permitidos, separados por coma |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Fotos de perfil en Cloudinary |
| `BREVO_API_KEY`, `SMTP_*` | Correo transaccional |
| `URL_APK` | Enlace de descarga incluido en correos |
| `N8N_WEBHOOK_URL` | Webhook opcional de automatizaciones |

> Sin credenciales de Cloudinary, las fotos se guardan en `backend/uploads/` como fallback local.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm start` | Inicia el servidor en modo producción (`node index.js`) |
| `npm run dev` | Inicia con recarga automática (`nodemon index.js`) |
| `npm test` | Ejecuta Jest con cobertura y normaliza `coverage/lcov.info` |
| `npm run tunnel` | Expone el backend local con localtunnel (útil para pruebas móviles) |

---

## Base de datos y migraciones

### Scripts SQL de inicialización

Los scripts viven en [`../database/`](../database) y se ejecutan en este orden:

```text
01_estructura.sql
02_migracion_movil.sql
03_mejoras_estructura.sql
04_datos_iniciales.sql
05_password_reset.sql
```

En Docker se ejecutan automáticamente la primera vez que se crea el volumen de MariaDB. Para reinicializar:

```bash
# Desde la raíz del repositorio
docker compose down -v
docker compose up -d --build
```

### Migraciones de arranque

`index.js` ejecuta migraciones idempotentes mediante `utils/migrationRunner.js`. Estas verifican el estado de la BD antes de aplicar cambios:

- columna `AFILIADO.foto`
- columna de foto de staff
- `push_token`
- detalles de rutina
- nutrientes de consumo
- tabla `NOTA_EJERCICIO`
- recomendación de agua
- tabla `PASSWORD_RESET`

No hay un comando separado de migraciones: **se ejecutan al iniciar el servidor** y no bloquean el arranque si la BD aún está inicializando.

### Ejecución manual de SQL

En Git Bash / WSL / macOS / Linux:

```bash
docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit' < database/01_estructura.sql
```

En PowerShell:

```powershell
Get-Content database/01_estructura.sql -Raw | docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit'
```

Repite el proceso con los archivos `02` a `05` en orden. No ejecutes los datos de demostración contra producción.

---

## API y Swagger

La API tiene **93 operaciones documentadas** en **71 rutas** OpenAPI:

| Recurso | URL local | URL de producción |
|---|---|---|
| Swagger UI | http://localhost:3001/api-docs | https://metafit-backend-rr18.onrender.com/api-docs |
| JSON OpenAPI | http://localhost:3001/api-docs.json | https://metafit-backend-rr18.onrender.com/api-docs.json |
| Health check | http://localhost:3001/health | https://metafit-backend-rr18.onrender.com/health |

### Autenticación

1. Ejecuta `POST /login` con un correo y contraseña válidos.
2. Copia el `accessToken` de la respuesta.
3. En Swagger, pulsa **Authorize** e ingresa `Bearer <token>`.
4. El token se mantiene entre peticiones gracias a `persistAuthorization`.

### Grupos de endpoints

- Autenticación y recuperación de contraseña
- Usuarios (personal del gimnasio)
- Afiliados, ciclos, restricciones y progreso
- Planes de entrenamiento y nutrición
- Pagos y métricas financieras
- Dashboard
- Notificaciones
- Catálogos de ejercicios, alimentos y restricciones
- Configuración del sistema
- Progreso diario e historial

Los permisos por rol se aplican en los middlewares y en las rutas. Los roles disponibles son **Administrador**, **Recepcionista**, **Entrenador** y **Afiliado**.

---

## Pruebas

```bash
cd backend
npm ci
npm test
```

- Framework: **Jest**
- Pruebas HTTP: **Supertest**
- Cobertura actual: **100% de líneas** (2474/2474)
- El comando genera `coverage/lcov.info`, usado por SonarQube.

La suite cubre controladores, servicios, modelos, middlewares, configuración de BD, cron, correo, Cloudinary, Swagger y hardening del servidor.

---

## Seguridad

| Medida | Implementación |
|---|---|
| Contraseñas | Hash bcrypt con 12 rondas |
| Sesiones | JWT firmado, vigencia de 8 horas |
| Autorización | Middleware de roles por ruta |
| Cabeceras HTTP | Helmet con CSP |
| CORS | Lista blanca configurable con `CORS_ORIGINS` |
| Fuerza bruta | Rate limit en `/login` (10 intentos / 15 min) |
| Recuperación de contraseña | Rate limit (5 solicitudes / 15 min) |
| Payloads | Límite de 50 KB y validación de `Content-Type` |
| Archivos | Multer con límite de 5 MB y validación de tipo |
| SQL | Consultas parametrizadas con placeholders |
| Errores | Handler global sin exponer stack traces al cliente |

---

## Despliegue

El backend se despliega en **Render** como Web Service con Docker:

- Dockerfile: `backend/Dockerfile`
- Health check: `/health`
- Base de datos: MySQL 8 en Oracle Cloud VPS (externa)
- Variables sensibles: configuradas en el dashboard de Render, nunca en el repositorio

El pipeline de GitHub Actions ejecuta los tests y, al fusionar en `main`, solicita el deploy a Render.

---

## Documentación relacionada

- [`../README.md`](../README.md) — presentación del proyecto y enlaces de producción.
- [`../README_DEV.md`](../README_DEV.md) — entorno local completo y flujo de trabajo.
- [`../database/README.md`](../database/README.md) — detalle de los scripts SQL.
- [`../documentacion/MANUAL_TECNICO.md`](../documentacion/MANUAL_TECNICO.md) — manual técnico general.
