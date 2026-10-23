# MetaFit — Guía de desarrollo

Documentación técnica para trabajar en el repositorio. Para la presentación del proyecto y los enlaces de producción, consulta el [`README.md`](./README.md).

---

## 1. Requisitos

| Herramienta | Versión recomendada | Uso |
|---|---|---|
| Git | 2.40+ | Clonar y versionar el proyecto |
| Node.js | 20 LTS o 22 LTS | Backend, frontend web y app móvil |
| npm | 10+ | Instalación de dependencias |
| Docker Desktop | Última estable | Entorno local con MariaDB, backend, frontend y phpMyAdmin |
| Android Studio / SDK | Opcional | Compilar la app Android en local |
| Cuenta Expo / EAS | Opcional | Generar el APK en la nube con EAS Build |

> El pipeline de GitHub Actions usa Node 20. Los Dockerfiles del backend y frontend usan Node 22.

---

## 2. Clonar el repositorio

```bash
git clone https://github.com/juanscarvajal04-droid/Equipo_Metafit.git
cd Equipo_Metafit
```

Estructura general:

```text
Equipo_Metafit/
├── backend/                 API Node.js + Express
├── frontend_web/            Aplicación web React + Vite
├── movil/                   App Android con Expo / React Native
├── database/                Scripts SQL 01 → 05
├── postman/                 Colecciones Web y Móvil
├── documentacion/           Manuales, auditorías y diagramas
├── scripts/                 Utilidades de normalización de cobertura
├── .github/workflows/       CI/CD de GitHub Actions
├── docker-compose.yml       Entorno local completo
├── render.yaml              Referencia de despliegue del backend
├── .env.example             Plantilla de variables de entorno
├── README.md                Presentación / producción
└── README_DEV.md            Esta guía
```

---

## 3. Variables de entorno

### 3.1 Entorno Docker (raíz del proyecto)

Docker Compose lee automáticamente el archivo `.env` de la raíz:

```bash
cp .env.example .env
```

Variables principales:

| Variable | Valor local típico | Descripción |
|---|---|---|
| `PORT` | `3001` | Puerto del backend |
| `DB_HOST` | `db` | Nombre del servicio de BD dentro de Docker |
| `DB_PORT` | `3306` | Puerto de MySQL/MariaDB |
| `DB_USER` | `root` | Usuario local de la BD |
| `DB_PASSWORD` | `Admin123!` | Contraseña local de ejemplo; cámbiala si lo necesitas |
| `DB_NAME` | `metafit` | Nombre de la base de datos |
| `DB_SSL` | `false` | SSL de la conexión a BD |
| `JWT_SECRET` | cadena local | Secreto para firmar los JWT |
| `JWT_EXPIRES_IN` | `8h` | Vigencia del token |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Orígenes permitidos, separados por coma |
| `CLOUDINARY_CLOUD_NAME` | `llaq9vyl` | Cloud name de Cloudinary |
| `CLOUDINARY_API_KEY` | vacío | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | vacío | API secret de Cloudinary |
| `URL_APK` | URL pública del APK | Enlace usado en correos y respuestas |
| `N8N_WEBHOOK_URL` | `http://n8n:5678` | Webhook interno opcional de n8n |

Para correo opcional (Brevo/SMTP), agrega las variables `BREVO_API_KEY`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM` según lo definido en `docker-compose.yml`.

> **Nunca subas `.env` al repositorio.** Usa `.env.example` como plantilla y comparte los secretos por un canal privado.

### 3.2 Frontend web

`frontend_web/.env.development` ya apunta al backend local:

```env
VITE_API_URL=http://localhost:3001
```

En Render se configura `VITE_API_URL=https://metafit-backend-rr18.onrender.com`.

### 3.3 App móvil

La app decide la URL según la plataforma en `movil/src/services/api.js`:

| Ejecución | URL del backend |
|---|---|
| Expo web | `EXPO_PUBLIC_API_URL` o `http://localhost:3001` |
| Android (Expo Go o APK) | `https://metafit-backend-rr18.onrender.com` |

Para cambiar la URL de Expo web:

```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

El APK compilado usa el backend de producción; no cambies esa URL sin coordinar una nueva compilación.

---

## 4. Levantar el entorno local con Docker

Desde la raíz del repositorio:

```bash
docker compose up -d --build
```

Verificar el estado:

```bash
docker compose ps
```

Servicios disponibles:

| Servicio | URL local | Credenciales |
|---|---|---|
| Frontend web | http://localhost:5173 | Ver cuentas de prueba en el README principal |
| Backend / API | http://localhost:3001 | — |
| Swagger UI | http://localhost:3001/api-docs | — |
| Health check | http://localhost:3001/health | — |
| phpMyAdmin | http://localhost:8080 | `root` / valor de `DB_PASSWORD` |
| n8n | http://localhost:5678 | `admin` / `Admin123!` |
| MariaDB | localhost:3306 | `root` / valor de `DB_PASSWORD` |

La app móvil en modo web se levanta aparte, en el puerto **8081**:

```bash
cd movil
npm ci
npm run web
# http://localhost:8081
```

Comandos útiles:

```bash
# Logs de un servicio
docker compose logs -f backend

# Detener sin borrar datos
docker compose down

# Detener y borrar la base de datos local
docker compose down -v

# Reconstruir después de cambios de configuración
docker compose up -d --build
```

> La primera ejecución tarda más porque MariaDB inicializa el volumen y ejecuta los scripts SQL.

---

## 5. Ejecutar sin Docker

Si prefieres correr los procesos por separado:

### 5.1 Base de datos

Puedes usar solo el contenedor de MariaDB:

```bash
docker compose up -d db
```

### 5.2 Backend

El backend carga `backend/.env`, no el `.env` de la raíz. Crea una copia y ajusta el host:

```bash
cp .env.example backend/.env
```

En `backend/.env`, cambia:

```env
DB_HOST=127.0.0.1
```

Luego:

```bash
cd backend
npm ci
npm run dev
```

### 5.3 Frontend web

```bash
cd frontend_web
npm ci
npm run dev
# http://localhost:5173
```

### 5.4 App móvil

```bash
cd movil
npm ci
npm run web
# http://localhost:8081
```

La app en web usa el backend local; en Android (Expo Go o APK) usa el backend de producción definido en `movil/src/services/api.js`.

---

## 6. Ejecutar los tests

Cada proyecto tiene su propia suite. Ejecuta los comandos desde la carpeta correspondiente.

### Backend

```bash
cd backend
npm ci
npm test
```

- Framework: **Jest + Supertest**
- Incluye cobertura y normalización del archivo `lcov.info`.
- Cobertura actual: **100% de líneas**.

### Frontend web

```bash
cd frontend_web
npm ci
npm test
```

- Framework: **Vitest + Testing Library + jsdom**
- Cobertura actual: **99.45% de líneas**.
- Para desarrollo de tests:

```bash
npm run test:watch
```

### App móvil

```bash
cd movil
npm ci
npm test
```

- Framework: **Jest + jest-expo + React Native Testing Library**
- Cobertura actual: **99.37% de líneas**.
- Para generar el reporte de cobertura:

```bash
npm run test:coverage
```

### Verificación completa antes de un push

```bash
npm --prefix backend test
npm --prefix frontend_web test
npm --prefix frontend_web run build
npm --prefix movil test
```

El workflow [`ci.yml`](./.github/workflows/ci.yml) ejecuta exactamente estas validaciones en cada push y pull request.

---

## 7. Base de datos y migraciones

### 7.1 Scripts SQL de inicialización

La carpeta [`database/`](./database) contiene los scripts que crean el esquema y cargan los datos de demostración:

| Orden | Archivo | Contenido |
|---|---|---|
| 01 | `01_estructura.sql` | Tablas base, relaciones y vistas |
| 02 | `02_migracion_movil.sql` | Tablas de la app móvil |
| 03 | `03_mejoras_estructura.sql` | Columnas y tablas adicionales |
| 04 | `04_datos_iniciales.sql` | Datos de prueba, catálogos y usuarios |
| 05 | `05_password_reset.sql` | Tabla de recuperación de contraseña |

Docker ejecuta estos archivos **automáticamente** la primera vez que se crea el volumen de MariaDB. El orden lexicográfico coincide con el orden de dependencias.

Para reinicializar la base local desde cero:

```bash
docker compose down -v
docker compose up -d --build
```

### 7.2 Migraciones de arranque del backend

Además de los scripts SQL, el backend ejecuta migraciones idempotentes al iniciar. Están en `backend/migrations/` y se coordinan desde `backend/utils/migrationRunner.js`:

- `migracionFotos.js`
- `migracionFotoUsuario.js`
- `migracionNotaEjercicio.js`
- `migracionNutrientesConsumo.js`
- `migracionPushToken.js`
- `migracionRecomendacionAgua.js`
- `migracionRutinaDetalles.js`

No requieren un comando manual: se ejecutan al arrancar el servidor y verifican si el cambio ya existe antes de aplicarlo.

### 7.3 Ejecución manual de los scripts SQL

Si necesitas aplicarlos manualmente en el contenedor local:

**Git Bash / WSL / macOS / Linux:**

```bash
docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit' < database/01_estructura.sql
docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit' < database/02_migracion_movil.sql
docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit' < database/03_mejoras_estructura.sql
docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit' < database/04_datos_iniciales.sql
docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit' < database/05_password_reset.sql
```

**PowerShell:**

```powershell
Get-Content database/01_estructura.sql -Raw | docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit'
Get-Content database/02_migracion_movil.sql -Raw | docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit'
Get-Content database/03_mejoras_estructura.sql -Raw | docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit'
Get-Content database/04_datos_iniciales.sql -Raw | docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit'
Get-Content database/05_password_reset.sql -Raw | docker compose exec -T db sh -c 'mariadb -uroot -p"$MYSQL_ROOT_PASSWORD" metafit'
```

> No ejecutes los seeds de demostración contra la base de datos de producción. Los cambios de esquema en producción deben coordinarse con la persona responsable de la infraestructura y respaldarse antes de aplicarse.

---

## 8. App móvil: Expo y APK

### 8.1 Ejecutar en web

```bash
cd movil
npm ci
npm run web
```

Abre **http://localhost:8081**. La app usa `EXPO_PUBLIC_API_URL` en este modo.

### 8.2 Ejecutar con Expo Go o emulador

```bash
cd movil
npm start
```

Expo muestra un código QR y las opciones para abrir la app en Expo Go, un emulador Android o un development build. Algunas funciones nativas pueden requerir un development build en lugar de Expo Go.

Para compilar y ejecutar en un emulador/dispositivo con Android Studio:

```bash
npm run android
```

### 8.3 Generar el APK con EAS Build

El perfil `preview` de `movil/eas.json` genera un APK instalable:

```bash
cd movil
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

Al finalizar, EAS entrega un enlace de descarga. Copia el archivo al directorio que sirve la landing web:

```bash
cp <ruta-del-apk-descargado>.apk ../frontend_web/public/app/metafit.apk
```

En PowerShell:

```powershell
Copy-Item <ruta-del-apk-descargado>.apk ..\frontend_web\public\app\metafit.apk
```

La URL pública queda disponible en:

```text
https://metafit-frontend-78x6.onrender.com/app/metafit.apk
```

> El manual detallado de compilación, firma e instalación está en [`documentacion/manual_apk_movil.md`](./documentacion/manual_apk_movil.md).

---

## 9. Flujo de trabajo del equipo

1. Actualiza `main` y crea una rama:

```bash
git switch main
git pull origin main
git switch -c feature/mi-cambio
```

2. Desarrolla y ejecuta las pruebas de la carpeta afectada.
3. Verifica que no se suban archivos locales:

```bash
git status
```

4. Haz commit con un mensaje descriptivo:

```bash
git add .
git commit -m "feat: descripción corta del cambio"
git push -u origin feature/mi-cambio
```

5. Abre un Pull Request hacia `main`. El CI debe quedar en verde antes de fusionar.
6. Al fusionar en `main`, GitHub Actions despliega backend y frontend en Render.

**No subir:** `.env`, `node_modules/`, `coverage/`, `dist/` ni credenciales reales.

---

## 10. Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `db` aparece unhealthy | MariaDB todavía inicializa o el volumen quedó inconsistente | Esperar, revisar `docker compose logs db` y reiniciar con `docker compose restart db` |
| El backend no conecta a la BD en Docker | `DB_HOST` no es `db` | Usar `DB_HOST=db` en el `.env` de la raíz y recrear el backend |
| El backend no conecta sin Docker | `backend/.env` apunta al host de Docker | Cambiar `DB_HOST=127.0.0.1` |
| Error de CORS en el navegador | El origen no está en `CORS_ORIGINS` | Agregar `http://localhost:5173` y `http://localhost:8081`, y reiniciar el backend |
| El puerto 5173, 3001 u 8080 está ocupado | Otro proceso lo está usando | Detener el proceso o cambiar el puerto en `.env` |
| Expo web no refleja cambios | Caché del bundler | Ejecutar `npx expo start -c` |
| El APK no se instala | Firma distinta o “orígenes desconocidos” desactivado | Desinstalar la versión anterior y permitir la instalación |
| Render tarda en responder | Servicio gratuito en reposo | Esperar unos segundos y volver a intentar |

---

## 11. Enlaces útiles

| Recurso | URL |
|---|---|
| Web de producción | https://metafit-frontend-78x6.onrender.com |
| Swagger / OpenAPI | https://metafit-backend-rr18.onrender.com/api-docs |
| Health check | https://metafit-backend-rr18.onrender.com/health |
| Adminer | https://metafit-adminer.onrender.com |
| APK Android | https://metafit-frontend-78x6.onrender.com/app/metafit.apk |
| Repositorio | https://github.com/juanscarvajal04-droid/Equipo_Metafit |

Documentación relacionada:

- [`README.md`](./README.md) — presentación, arquitectura y credenciales de prueba.
- [`backend/README.md`](./backend/README.md) — arquitectura MVC + Services.
- [`frontend_web/README.md`](./frontend_web/README.md) — stack y estructura del frontend.
- [`movil/README.md`](./movil/README.md) — Expo, web y APK.
- [`database/README.md`](./database/README.md) — scripts SQL y convenciones.
- [`documentacion/entornos.md`](./documentacion/entornos.md) — separación local/producción.
