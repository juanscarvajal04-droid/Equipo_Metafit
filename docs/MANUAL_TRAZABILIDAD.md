# MANUAL DE TRAZABILIDAD TÉCNICA — Proyecto MetaFit

**Sistema de Gestión Deportiva — Sport Gym Sede 80 (Bogotá, Colombia)**
**Versionado:** repositorio `Equipo_Metafit`, rama `feature/juan-carvajal`
**Audiencia:** estudiantes/instructores que deben poder explicar el sistema entero, de la pantalla al MySQL, con los ojos cerrados.

> Regla de oro de este manual: **primero el PARA QUÉ, después el CÓMO**. Cada módulo
> va en este orden: qué problema resuelve → una analogía de la vida real → un
> diagrama en ASCII → el código REAL del proyecto → cómo encaja con el resto.

---

## Tabla de contenidos

- **PARTE 1 — Visión general del sistema** (diagrama, por qué 3 clientes, Docker, flujo en una frase)
- **PARTE 2 — Backend: Node.js + Express + MySQL** (arranque, MVC/Services, JWT/bcrypt, middlewares, base de datos, seguridad en capas)
- **PARTE 3 — Frontend web: React + Vite** (arranque, router + RBAC, AuthContext, axios, patrón de vista, flujo login → alta)
- **PARTE 4 — App móvil: Expo / React Native** (arranque, 3 estados, AuthContext async, tabs, MiRutinaScreen, /me, theme)
- **PARTE 5 — Comunicación entre capas** (flujo entrenador → afiliado, clientes iguales, CORS, JWT pasaporte)
- **PARTE 6 — Guía para el instructor** (12 preguntas con respuesta en primera persona)

---

## PARTE 1. VISIÓN GENERAL DEL SISTEMA

### 1.1 El diagrama completo: 3 clientes + 1 backend + 1 base de datos

El proyecto NO es "una página web". Son **tres aplicaciones distintas** que comparten **un único backend** y **una única base de datos MySQL**. Si entienden eso —que hay un solo cerebro (backend) y tres caras distintas para tres tipos de usuario—, ya entendieron el 90 % del sistema.

```text
                              ┌─────────────────────────────┐
                              │    MySQL / MariaDB          │
                              │    (database/01..05.sql)    │
                              │    hostname: "db" (Docker)  │
                              └──────────────┬──────────────┘
                                             │  TCP 3306
                                             │  (pool de conexiones)
                              ┌──────────────▼──────────────┐
                              │   BACKEND MetaFit API       │
                              │   Node.js + Express         │
                              │   /backend                  │
                              │   Puerto 3001               │
                              │   Swagger en /api-docs      │
                              │   /login /afiliados /planes │
                              │   JWT · bcrypt · Helmet     │
                              └───┬──────────────┬──────┬───┘
                                  │             │      │
                   HTTP/JSON     │             │      │    HTTP/JSON
              + Bearer token    │             │      │   + Bearer token
             ┌──────────────────▼──┐  ┌───────▼───┐  ┌▼───────────────────┐
             │  CLIENTE 1         │  │ CLIENTE 2 │  │ CLIENTE 3          │
             │  WEB (panel staff) │  │  CELULAR  │  │  API consumers     │
             │  React + Vite      │  │  Expo RN  │  │  curl / Postman /  │
             │  /frontend_web     │  │  /movil   │  │  Swagger UI        │
             │  Vite puerto 5173  │  │  (app     │  │                    │
             │  Sede: admin,      │  │  instalada│  │                    │
             │  recepción,        │  │  en el    │  │  Uso: pruebas,     │
             │  entrenadores      │  │  teléfono │  │  integraciones     │
             │                    │  │  del      │  │  (n8n, scripts)    │
             │  Rol: staff        │  │  afiliado │  │                    │
             └────────────────────┘  └───────────┘  └────────────────────┘
```

**Los protocolos:**

- Los 3 clientes hablan con el backend **únicamente por HTTP(S)** y mandan y reciben **JSON**.
- El único cliente que habla **directamente** con MySQL es el **backend** (por TCP 3306). Los clientes jamás tocan la base de datos.
- La autenticación viaja en el header `Authorization: Bearer <JWT>` — un **token firmado**, no una sesión en el servidor.

**Los puertos que hay que saber:**

| Componente          | Puerto / URL                                             |
|---------------------|----------------------------------------------------------|
| Backend API         | `3001` (producción: `https://metafit-backend-rr18.onrender.com`) |
| Swagger del backend | `http://localhost:3001/api-docs` o `/swagger`            |
| Frontend web (Vite) | `5173`                                                   |
| Expo metro bundler  | `8081`                                                   |
| MySQL / MariaDB     | `3306` (solo alcanzable por el backend)                  |
| phpMyAdmin (Docker) | `8080`                                                   |
| n8n (automatización)| `5678`                                                   |

### 1.2 ¿Por qué están separados los tres clientes?

Porque tienen **usuarios, objetivos y ciclos de vida diferentes**. Separarlos es una decisión de arquitectura (no un capricho):

**Cliente 1 — Web (panel staff).** Lo usan el Administrador, la Recepcionista y los Entrenadores, sentados en un computador de la sede. Es un sistema de gestión: crear afiliados, asignar ciclos, registrar pagos, ver dashboards y finanzas. Corre con React + Vite, como una SPA (Single Page Application). No necesita estar "instalada": se abre en el navegador.

**Cliente 2 — Móvil (app del afiliado).** La usa el **afiliado** desde su celular, en el gimnasio o desde su casa. Ve SU rutina del día, SU dieta, SU progreso, registra series, vasos de agua y notas. Corre con Expo/React Native y se distribuye como APK. Es "de un solo usuario", por eso todos sus endpoints son `/afiliados/me/*`.

**Cliente 3 — API (pruebas/integraciones).** Swagger UI, Postman, curl y herramientas de automatización (n8n). No es una pantalla; es la forma de consumir el mismo backend sin interfaz.

**¿Y por qué no una sola app web que use el afiliado?**
Porque el afiliado tiene que ver y registrar información todos los días, incluso entre sesiones, con notificaciones push y selectores nativos (foto, fecha). Eso se vive mejor en una app nativa que en una pestaña del navegador. Además, la lógica de rol es estricta: **la web rechaza a los afiliados** y **la app móvil solo es para afiliados**. Dos productos, dos experiencias, un solo backend.

### 1.3 Docker: los contenedores y el hostname "db"

El archivo `docker-compose.yml` de la raíz orquesta los servicios. El dato más importante para explicar: **adentro de la red Docker, la base de datos se llama `db` — no `localhost`**. Un contenedor no puede usar `localhost` para hablar con otro contenedor; `localhost` dentro de un contenedor ES el mismo contenedor. Por eso el backend configura `DB_HOST: db`.

Aunque el archivo define 5 servicios (el quinto, n8n, es automatización opcional), la **arquitectura núcleo son los 4 primeros**:

```yaml
services:
  db:                       # 1) MariaDB 11 — el "banco de datos"
    image: mariadb:11
    container_name: metafit_db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - ./database:/docker-entrypoint-initdb.d:ro   # ← los .sql se ejecutan solos
      - metafit_db_data:/var/lib/mysql
    healthcheck:
      test: [ "CMD", "mariadb-admin", "ping", "--skip-ssl", "-h", "127.0.0.1", "-u", "root", "-p${DB_PASSWORD}" ]

  backend:                  # 2) API Node.js
    build:
      context: ./backend
    environment:
      DB_HOST: db           # ← acá: "db", NO localhost
      DB_PORT: 3306
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-8h}
    ports:
      - "${PORT}:${PORT}"
    depends_on:
      db:
        condition: service_healthy   # espera a que MariaDB responda ping

  frontend:                 # 3) React/Vite
    build:
      context: ./frontend_web
    environment:
      - VITE_API_URL=http://localhost:${PORT}
    ports:
      - "5173:5173"

  phpmyadmin:               # 4) Auditoría visual de la BD
    image: phpmyadmin:latest
    environment:
      PMA_HOST: db          # ← apunta al servicio MySQL de la red
    ports:
      - "8080:80"
```

Tres detalles que el instructor va a preguntar:

1. **`./database` montado en `/docker-entrypoint-initdb.d`**: Docker ejecuta los `.sql` de esa carpeta **en orden lexicográfico** en el primer arranque. Esos archivos son `01_estructura.sql` → `02_migracion_movil.sql` → `03_mejoras_estructura.sql` → `04_datos_iniciales.sql` → `05_password_reset.sql`, y ese orden coincide con las dependencias (no se puede crear `02` sin `01`).
2. **Solo se ejecutan si el volumen está vacío.** Si ya existe `metafit_db_data`, no se re-ejecutan. Para re-inicializar de cero: `docker compose down -v && docker compose up --build`.
3. **El healthcheck**: el backend usa `depends_on: condition: service_healthy`, es decir, no arranca hasta que la BD "esté viva". Pero igual existe un mecanismo de espera EN el backend (lo veremos en la Parte 2) porque en `docker compose up` a veces las cosas no salen en orden perfecto.

### 1.4 El flujo punta a punta en una sola frase

> "Una recepcionista entra a la **web**, crea un **afiliado**; un **entrenador** le asigna un **ciclo** con plan de entrenamiento y nutricional; el **backend** lo guarda en **MySQL**; y cuando el afiliado abre su **app móvil**, el backend le devuelve su rutina y su dieta usando el **JWT** que recibió al hacer login — todo a través del **mismo backend**."

Si pueden decir esa frase con seguridad y señalar en un diagrama cada salto, ya tienen la Parte 1 dominada. Las Partes 2, 3, 4 y 5 desarman cada pedazo de esa frase.

---

### 1.5 Profundización: los archivos SQL que "crean el mundo"

**PARA QUÉ:** en proyectos artesanales la base de datos se llena "a mano" y cada desarrollador tiene una versión distinta. Acá la BD nace de **cinco scripts versionados** que Docker ejecuta en la primera inicialización. Explicarlos es explicar qué tablas existen y por qué.

**Las 5 piezas del rompecabezas:**

```text
01_estructura.sql        → el esqueleto: tablas maestro y sus FOREIGN KEY/CHECKs
02_migracion_movil.sql   → las tablas de la app móvil (agua, consumo, progreso diario)
03_mejoras_estructura.sql→ la "fase móvil avanzada": registro real + notas de ejercicio
04_datos_iniciales.sql   → los datos: personal, catálogos y afiliados demo (INSERT IGNORE)
05_password_reset.sql    → tabla PASSWORD_RESET para el flujo "olvidé mi contraseña"
                            (su migración también está en backend/index.js)
```

**El mapa de las tablas núcleo (extraído de `01_estructura.sql`), que conecta con todo lo demás del manual:**

```text
  USUARIO (cuentas de login)
    id_usuario (PK) · nombres · apellidos · correo · contrasena(bcrypt)
    rol ('Administrador'|'Entrenador'|'Recepcionista'|'Afiliado') · estado
          │ 1
          │
          ▼ 1
  AFILIADO (perfil deportivo — PK compartida con USUARIO)
    id_usuario (PK/FK) · documento · fecha_nacimiento · estatura_cm
    estado_afiliacion · foto · registrado_por (FK→USUARIO)
          │ 1
          ▼ n
  CICLO (períodos de entrenamiento)
    id_ciclo (PK) · id_usuario (FK) · fecha_inicio · fecha_fin · activo ·
    objetivo_fisico · nivel_experiencia · disponibilidad_dias · registrado_por
          │ 1
       ┌──┴────────────┬─────────────────┐
       ▼               ▼                 ▼
  PLAN_ENTRENAMIENTO   PLAN_NUTRICIONAL  PROGRESO_FISICO
       │                                   (peso_kg + IMC calculado)
       ▼
  RUTINA (dia_numero 1..7) → RUTINA_EJERCICIO (series, reps, peso, descanso)
                     → EJERCICIO (catálogo)

  Puentes de negocio: AFILIADO_RESTRICCION, EJERCICIO_RESTRICCION_EXCLUIDA,
                      ALIMENTO_RESTRICCION_EXCLUIDA (los catálogos filtrados
                      por restricción médica que usa el planificador)
```

**Dos modelos "de verdad" del script (código REAL de `01_estructura.sql`):**

```sql
CREATE TABLE IF NOT EXISTS `USUARIO` (
  `id_usuario`   INT          NOT NULL AUTO_INCREMENT,
  `nombres`      VARCHAR(100) NOT NULL,
  `apellidos`    VARCHAR(100) NOT NULL,
  `correo`       VARCHAR(255) NOT NULL UNIQUE,
  `contrasena`   VARCHAR(255) NOT NULL,        -- SIEMPRE hash bcrypt, jamás texto plano
  `rol`          ENUM('Administrador','Entrenador','Recepcionista','Afiliado') NOT NULL,
  `estado`       ENUM('Activo','Inactivo','Pendiente') NOT NULL DEFAULT 'Pendiente',
  PRIMARY KEY (`id_usuario`)
);
```

```sql
CREATE TABLE IF NOT EXISTS `CICLO` (
  `id_ciclo`       INT  NOT NULL AUTO_INCREMENT,
  `id_usuario`     INT  NOT NULL,
  `fecha_inicio`   DATE NOT NULL,
  `fecha_fin`      DATE NOT NULL,
  `activo`         TINYINT(1) NOT NULL DEFAULT 1 CHECK (`activo` IN (0, 1)),
  `disponibilidad_dias` TINYINT NOT NULL CHECK (`disponibilidad_dias` BETWEEN 1 AND 7),
  CONSTRAINT `chk_ciclo_fechas` CHECK (`fecha_fin` > `fecha_inicio`),
  FOREIGN KEY (`id_usuario`) REFERENCES `USUARIO` (`id_usuario`),
  FOREIGN KEY (`registrado_por`) REFERENCES `USUARIO` (`id_usuario`)
);
```

**El apunte de los `CHECK`:** la validación de negocio no vive solo en el backend — la BD misma se niega a guardar un ciclo con `fecha_fin <= fecha_inicio`, una disponibilidad fuera de 1–7 o un peso de 10 kg. Eso es **defensa en profundidad**: aunque un atacante escriba SQL directo en el phpMyAdmin, las constricciones lo bloquean.

**El seed (`04_datos_iniciales.sql`) — el detalle que enamora al instructor:** los INSERT son `INSERT IGNORE`, así el script es **idempotente** (se puede re-ejecutar sin duplicar), los ids están **mapeados por rangos** (1-9 personal, 100 demo, 200-202 nuevos) y —lo más importante— **nunca hay contraseña en texto plano**:

```sql
INSERT IGNORE INTO `USUARIO`
  (id_usuario, nombres, apellidos, correo, contrasena, rol, estado, fecha_registro)
VALUES
  (1, 'Carlos', 'Ramírez', 'carlos@metafit.com',
   '$2a$12$c3mF4PBqzZSAALCUeXknzecZFAMRqNZYosm321UorUZeYZJSx4s26',  -- hash de Admin123!
   'Administrador', 'Activo', '2024-01-01 08:00:00'),
  (4, 'María', 'López', 'maria@metafit.com',
   '$2a$12$5i/3x.d50ERZoiRdCzDWhufoMWekLpJClNDir5YC4xeUq6RVPynKy',   -- hash de Maria123!
   'Recepcionista', 'Activo', '2024-01-01 08:00:00');
```

> Para el examen: el comentario del propio archivo lo confirma — "Las contraseñas se almacenan como hashes bcrypt de 12 rondas generados con Node.js/bcryptjs. NUNCA se inserta texto plano."

---

### 1.6 Profundización: ¿dónde corre cada pieza? El mapa de puertos y dominios

**PARA QUÉ:** saber "qué puerto usa cada cosa" es la habilidad más práctica al levantar el proyecto. Este mapa sale de `docker-compose.yml` (código REAL) y de la configuración verificada de los despliegues.

**En local (con Docker Compose):**

| Pieza | Acceso | Puerto real | Servicio Docker |
|---|---|---|---|
| Backend API (Express) | `http://localhost:3001` | `${PORT}` (default 3001) | `backend` |
| Swagger / API Docs | `http://localhost:3001/api-docs` (alias `/swagger`) | 3001 | `backend` |
| Frontend web (Vite) | `http://localhost:5173` | 5173 | `frontend` |
| MariaDB | `localhost:3306` (el contenedor se llama `metafit_db`) | 3306 | `db` |
| phpMyAdmin | `http://localhost:8080` | 8080→80 | `phpmyadmin` |
| n8n (automatizaciones) | `http://localhost:5678` | 5678 | `n8n` |

**En producción (Render, URLs reales verificadas):**

```text
Backend : https://metafit-backend-rr18.onrender.com   (esta URL usa la app móvil)
Frontend: https://metafit-frontend-78x6.onrender.com   (la web del panel)
APK     : https://metafit-frontend-78x6.onrender.com/app/metafit.apk
```

**Las 3 reglas de oro de red (para anotar):**
1. **Dentro del contenedor, el nombre del servicio es la dirección.** El backend se conecta con `DB_HOST: db`, no con `localhost`. Igual en phpMyAdmin: `PMA_HOST: db`.
2. **`healthcheck` antes de arrancar:** el backend y phpMyAdmin usan `depends_on: db: condition: service_healthy` — esperan el `mariadb-admin ping` de MariaDB antes de iniciar. Eso evita la carrera clásica "el backend no levanta porque la BD aún no está lista".
3. **Los secretos no van en el archivo:** todo llega por variables de entorno (`${JWT_SECRET}`, `${DB_PASSWORD}`, `CORS_ORIGINS`…) con defaults sanos cuando aplica (`JWT_EXPIRES_IN:-8h`). Los valores reales viven en `.env`, fuera del repositorio.

---

### Resumen — Parte 1 (5 ideas que deben poder recitar rápido)

1. Son **tres clientes** (web staff, app móvil del afiliado, API/tests) contra **un backend** y **una BD**.
2. Los clientes hablan **HTTP + JSON**; el backend es el **único** que habla SQL.
3. En Docker la BD se llama **`db`**, nunca `localhost`, porque cada contenedor tiene su propio localhost.
4. Los `.sql` se ejecutan en **orden lexicográfico** (`01` a `05`), una sola vez, sobre el volumen de datos.
5. El **JWT** en el header `Authorization: Bearer` es lo que identifica a cada cliente; no hay sesión en el servidor.

### Cómo explicárselo al instructor en 2 minutos (Parte 1)

"Imaginen una empresa con tres mostradores y una sola bodega. El mostrador del computador (la web) lo atiende el personal; el mostrador del celular (la app) lo atiende cada cliente; y hay una puerta de servicio (la API) para los proveedores. Todos piden mercancía a la misma bodega (MySQL), pero nadie entra a la bodega directamente: hay un único encargado (el backend) que recibe el pedido, anota en su libreta y trae la mercancía. En Docker, esa bodega vive en el pasillo de al lado y por eso el encargado no la saluda por 'localhost' sino por el nombre con el que aparece en el directorio de la red: `db`."

---

---

## PARTE 2. EL BACKEND: NODE.JS + EXPRESS + MySQL

**La analogía que rige toda la Parte 2:** el backend es la **cocina central** de un restaurante. Los clientes (web, móvil, API) son los meseros y los comensales. Ellos NO entran a la despensa (MySQL) a agarrar los ingredientes: le pasan el pedido por la ventanilla y la cocina les devuelve el plato listo (JSON). Todo lo que los clientes piden pasa por la misma cocina, con el mismo proceso, y nadie salta la fila.

**La carpeta `backend/` en orden de lectura (de afuera hacia adentro):**

```text
backend/
├── index.js         → el "encendido": espera BD, migraciones, cron, arranca
├── server.js        → el "restaurante": middlewares, CORS, seguridad, rutas
├── config/
│   ├── db.js        → pool de conexiones MySQL (la flota de taxis)
│   ├── swagger.js   → documentación OpenAPI (auto-generada de @swagger)
│   └── cloudinary.js→ credenciales de fotos (opcional)
├── middlewares/
│   └── auth.js      → requireAuth, requireAdmin, requireStaff, requireOwnCiclo
├── controllers/     → capa HTTP: valida el pedido y responde
├── services/        → lógica de negocio y criptografía (authService)
├── models/          → SQL real (usuarioModel, afiliadoModel, cicloModel, …)
├── routes/          → mapa de URLs → controllers (con middlewares en cadena)
├── migrations/      → SQL idempotente que se asegura de columnas nuevas
├── cron/            → recordatorio de pagos cada hora
└── uploads/         → fotos servidas en /uploads (o Cloudinary)
```

### 2.1 Orden de arranque del servidor (¿quién prende a quién y por qué en ese orden?)

**PARA QUÉ:** si el servidor arrancara de una sola vez, un `docker compose up` en frío fallaría: MariaDB todavía se está inicializando y el backend intentaría ejecutar consultas contra una BD que no responde. El arranque está diseñado como una cadena de verificación.

**Diagrama del arranque (leer de arriba hacia abajo):**

```text
  1) index.js  ──►  importa pool (config/db.js)        crea la flota de taxi
        │
  2) esperarBaseDeDatos()   intenta "SELECT 1" hasta 30 veces,
        │                   cada 2 segundos (espera a que exista la BD)
        ▼
  3) migraciones idempotentes (solo si falta algo, no rompen nada):
        ├─ passwordResetModel.ensureTable()   → tabla PASSWORD_RESET
        ├─ migracionFotos      → columna AFILIADO.foto
        ├─ migracionPushToken  → columna USUARIO.push_token
        ├─ migracionRutinaDetalles → peso_kg + descanso_seg en RUTINA_EJERCICIO
        ├─ migracionNutrientesConsumo → macros en CONSUMO_ALIMENTO_REAL
        └─ migracionNotaEjercicio → tabla NOTA_EJERCICIO
        ▼
  4) iniciarCron()  → recordatorio de pagos por vencer (cada hora)
        ▼
  5) require('./server')  → configura Express (CORS, Helmet, rutas, errores)
        ▼
  6) app.listen(PORT)     → abre la puerta del restaurante (3001)
```

**El código REAL de la espera activa (`backend/index.js`):** fíjense en el detalle de que las migraciones son *idempotentes* (si la tabla/columna ya existe, no falla; simplemente lo confirma):

```js
async function esperarBaseDeDatos(intentos = 30, cadaMs = 2000) {
  for (let i = 1; i <= intentos; i += 1) {
    try {
      await pool.query('SELECT 1');                 // "¿estás viva?"
      console.log('[migraciones] Base de datos disponible');
      return;
    } catch (err) {
      if (i === intentos) throw err;                // 30 intentos fallidos = fatal
      console.log(`[migraciones] BD aún no lista (${i}/${intentos}), reintento en ${cadaMs}ms…`);
      await new Promise((r) => setTimeout(r, cadaMs));
    }
  }
}
```

> Pregunta típica del instructor: **"¿Por qué ejecutan la misma espera tantas veces y no una sola?** " Porque cada migración es independiente y asíncrona; encadenarlas con `.then()` re-verificando la BD reduce la posibilidad de que dos migraciones compitan por una conexión mientras la BD aún termina de levantarse.

**El arranque real (`backend/index.js`, final):**

```js
const app  = require('./server');
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║          MetaFit API — Backend MySQL                 ║');
  console.log(`║          http://localhost:${PORT}                        ║`);
  // ... todos los endpoints que expone, para que al prender se vea el mapa
  console.log('╚══════════════════════════════════════════════════════╝');
});
```

### 2.2 El patrón MVC + Services: el `POST /login` flecha por flecha

**PARA QUÉ:** separar capas para que cada una tenga UNA responsabilidad. Si algún día cambiamos de MySQL a otra base de datos, solo tocadmos los `models`. Si cambia el formato de respuesta del login, solo tocamos el `controller`. La criptografía (JWT y bcrypt) vive en un solo lugar: `services/authService.js`.

**El recorrido completo del `POST /login` (leer como un plano):**

```text
CLIENTE (web/móvil/curl)
  │   POST http://localhost:3001/login
  │   Content-Type: application/json
  │   Body: { "email": "recepcionista@sede80", "password": "…" }
  ▼
server.js  ─ PERAL: app.use('/login', loginLimiter)   → rate limit (máx 10 por 15 min)
  ▼
routes/authRoutes.js  → router.post('/', loginLimiter, AuthController.login)
  ▼
controllers/authController.js  → login():
     1) valida que existan email y password          (400 si faltan)
     2) valida formato de email con EMAIL_REGEX      (400 si está malo)
     3) valida ≤ 72 bytes en password                (400 si excede)
     4) UsuarioModel.findByEmail(correo)             → ¿existe el usuario?
     5) si user.estado !== 'Activo'                  → 403 "Cuenta no activa"
     6) comparePassword(plain, hash) con bcrypt      → 401 si no coincide
     7) signJWT({ sub, email, role })                → emite el pasaporte
     8) responde { accessToken, user }               → 200 OK
  ▼
models/usuarioModel.js  → findByEmail usa pool.query('SELECT … WHERE correo = ?')
  ▼
config/db.js (pool)  → una conexión concreta de la flota → MySQL → fila → vuelve hacia arriba
```

**El código REAL del corazón del login (extraído de `controllers/authController.js` 45-102):**

```js
login: async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Correo y contraseña requeridos' });

  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim()))
    return res.status(400).json({ error: 'Formato de correo inválido' });

  if (typeof password !== 'string' || Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES)
    return res.status(400).json({ error: `La contraseña no puede superar ${MAX_PASSWORD_BYTES} caracteres` });

  try {
    const user = await UsuarioModel.findByEmail(email.trim().toLowerCase());
    if (!user)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

    // BUG-002: verificar estado ANTES de bcrypt
    if (user.estado !== 'Activo')
      return res.status(403).json({ error: 'Cuenta no activa. Contacta al administrador.' });

    const match = await comparePassword(password, user.contrasena);
    if (!match)
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });

    const token = signJWT({ sub: user.id_usuario, email: user.correo, role: user.rol });

    return res.json({
      accessToken: token,
      user: { id: user.id_usuario, email: user.correo, role: user.rol,
              nombres: user.nombres, apellidos: user.apellidos },
    });
  } catch (err) {
    console.error('[authController.login]', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
},
```

Tres decisiones de seguridad que el instructor va a cazar:

1. **El estado se verifica ANTES del bcrypt (BUG-002).** Si se hiciera después, un atacante sabría que "la contraseña era correcta pero la cuenta está inactiva" por la diferencia entre un `403` y un `401`. Verificando antes, el 403 dice "cuenta inactiva" sin confirmar nada de la contraseña.
2. **El mensaje de error de credenciales es idéntico** para "correo no existe" y "contraseña incorrecta": `'Correo o contraseña incorrectos'`. Así no se puede enumerar usuarios.
3. **El `500` nunca filtra `err.message`** (BUG-010): el error real solo sale en la consola del servidor.

### 2.3 JWT + bcrypt: el pasaporte y la licuadora

**PARA QUÉ existen:** la contraseña no puede viajar con cada petición (riesgo de que se filtre). Entonces: primero se *comprueba* con bcrypt (una vez, en el login) y después el servidor entrega un **JWT**, que es como un **pasaporte plastificado**: lleva grabada la identidad (id, correo, rol), tiene una **firma** que no se puede falsificar y tiene una **fecha de vencimiento**.

```text
  LOGIN ────────────────────────────────────────────────► SERVIDOR
    1) usuario envía { email, password }
                    │
    2) servidor busca la fila en USUARIO  (patrón: SELECT … WHERE correo = ?)
                    │
    3) bcrypt.desenvuelve( hash )  ← la "licuadora" que tritura el password
                    │   (12 rondas ≈ 250–400 ms)
                    │   ¿coincide?  NO → 401 genérico
                    ▼   sí
    4) signJWT({ sub, email, role })  →  header.payload.firma
       "Diego firma a nombre de la Sede 80 que el rol es Recepcionista,
        vencimiento en 8 horas"
                    │
    5) responde { accessToken, user }   ◄── el pasaporte listo
                    │
  todas las peticiones siguientes ──► header: Authorization: Bearer <JWT>
                    │
    6) requireAuth TE LEE el pasaporte, NO necesita preguntarle a la BD
       cuál es tu rol (está firmado dentro del token) → decide al instante.
```

**El código REAL (extraído de `services/authService.js`):**

```js
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  // BUG-009: sin fallback inseguro
  throw new Error(
    '[FATAL] JWT_SECRET no está definido en las variables de entorno. ' +
    'Configura esta variable antes de iniciar el servidor.'
  );
}

const EXPIRES_IN  = process.env.JWT_EXPIRES_IN || '8h';
const SALT_ROUNDS = 12;
const MAX_PASSWORD_BYTES = 72;

signJWT: (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN }),

hashPassword: async (plain) => {
  if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
    throw new Error(`La contraseña no puede superar ${MAX_PASSWORD_BYTES} bytes.`);
  }
  return bcrypt.hash(plain, SALT_ROUNDS);
},

comparePassword: async (plain, hash) => {
  if (!plain || Buffer.byteLength(plain, 'utf8') > MAX_PASSWORD_BYTES) {
    return false;   // nunca comparar si input inválido
  }
  return bcrypt.compare(plain, hash);
}
```

**Las tres constantes que hay que saber explicar:**

- **`SALT_ROUNDS = 12`**: cada hash se calcula aplicando la función 2¹² veces. Esto ralentiza el *hash*, pero más importante: ralentiza los ataques de fuerza bruta. Como el servidor guarda cientos de contraseñas pero un atacante necesita probar millones, el costo de bcrypt golpea mucho más al atacante que al sistema.
- **`EXPIRES_IN = '8h'`**: el pasaporte dura una jornada laboral. Si se filtra, la ventana de riesgo es finita.
- **`MAX_PASSWORD_BYTES = 72`**: bcrypt (internamente) solo usa los primeros **72 bytes**. Si no lo validáramos, dos contraseñas distintas que compartieran ese prefijo darían el **mismo hash** — un error clásico de seguridad. Por eso se rechaza antes de hashear.

### 2.4 La cadena de middlewares: los guardias del corredor

**PARA QUÉ:** cada request que llega pasa por una **cadena de guardias** antes de llegar al controlador (la oficina). Expresarse en Express funciona exactamente así: `app.use(guardia)` o `router.get('/x', guardia1, guardia2, controlador)`.

```text
  SOLICITUD ──► [1] requireAuth        ¿viene con "Bearer <token>"?
                  │                        │ NO → 401 "Token requerido"
                  │                        │ SÍ → jwt.verify(firma, SECRET)
                  │                        │        │ firma inválida → 401 "Token inválido"
                  │                        │        │ expiró → 401 "Token expirado"
                  ▼                        ▼
                 req.user = { sub, email, role }   ← se adjunta para los siguientes guardias
                  │
   ┌──────────────┴─────────────┐
   │ [2] guardia de ROL         │  requireAdmin / requireAdminOrEntrenador /
   │   ¿req.user.role pasa?     │  requireAdminOrRecepcionista / requireStaff
   │     NO → 403              │
   └──────────────┬─────────────┘
                  ▼
   [3] guardia de PROPIEDAD    requireOwnCiclo  (solo rutas de ciclo/progreso)
       ¿el id_ciclo me pertenece?  NO → 403 "Este ciclo no te pertenece"  (IDOR)
                  ▼
   [4] CONTROLLER  (la oficina: hace el trabajo y responde)
```

**El código REAL de `requireAuth` (`middlewares/auth.js`) — fíjense en el detalle de que `SECRET` se importa del *servicio*, no de `process.env` (una sola fuente de verdad):**

```js
const requireAuth = (req, res, next) => {
  const header = req.headers['authorization'] || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    req.user = jwt.verify(token, SECRET);   // adjunta sub, email, role
    next();                                  // pasa al siguiente guardia
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    return res.status(401).json({ error: msg });
  }
};
```

**Y el guardia de rol más simple, `requireAdmin`:**

```js
const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ error: 'Acceso denegado: se requiere rol Administrador' });
  }
  next();
};
```

**OBSERVACIÓN IMPORTANTE de Express:** en las rutas de afiliados, las rutas con `/me` se declararon **ANTES** de `/:id`. Si estuvieran después, Express interpretaría la palabra "me" como el parámetro `:id` y nunca llegarían a su manejador. El orden de las rutas importa.

Otra observación: `requireOwnCiclo` consulta la BD porque **la propiedad de un recurso no viene en el token** (el token solo tiene identidad, no sabe qué ciclos te pertenecen). Ahí sí hay que preguntarle a MySQL.

### 2.5 La base de datos: pool, USUARIO → AFILIADO y sentencias preparadas

**El pool — la flota de taxis (`config/db.js`).**

**PARA QUÉ:** abrir una conexión TCP por cada query es carísimo. El pool mantiene **10 conexiones vivas** que se prestan y se devuelven, como una flota de taxis con 10 carros: si llegan 3 peticiones al mismo tiempo, cada una se sube a un carro; si llegan 12, 2 esperan en fila (`waitForConnections: true`, `queueLimit: 0`).

**El código REAL clave (`config/db.js`):**

```js
const poolConfig = {
  waitForConnections: true,      // no falla: espera en cola
  connectionLimit   : 10,        // máxima flota simultánea
  queueLimit        : 0,         // cola sin límite (preferible a un 500)
  enableKeepAlive   : true,      // evita "Connection lost" en quiet periods
  keepAliveInitialDelay: 10000,
  typeCast: function (field, next) {   // las columnas JSON llegan como string
    if (field.type === 'JSON') {
      const val = field.string('utf8');
      if (val != null) return val;
    }
    return next();
  },
};
```

Además de la flota, `db.js` soporta **tres formas de configuración**:
`DATABASE_URL` (tipo Railway: `mysql://user:pass@host:3306/db`), variables `DB_*` sueltas y `DB_SOCKET` (socket Unix). Si falta una variable crítica, el proceso hace `process.exit(1)` en vez de arrancar con datos vacíos.

**El patrón de las dos tablas que se dan la mano: `USUARIO` → `AFILIADO`.**

**PARA QUÉ:** un afiliado es "dos cosas": una **cuenta de login** (USUARIO: correo, contraseña hasheada, rol) y un **perfil deportivo** (AFILIADO: documento, fecha de nacimiento, estatura, foto…). Un usuario staff (Administrador/Entrenador/Recepcionista) vive SOLO en USUARIO. Un afiliado vive en AMBAS tablas, compartiendo el mismo `id_usuario` (relación 1 a 1). La clave compartida es `a.id_usuario = u.id_usuario`.

```text
USUARIO                            AFILIADO
id_usuario (PK)  ◄────────────►    id_usuario (PK, FK→USUARIO)
nombres                            documento, fecha_nacimiento, sexo
apellidos                          telefono, direccion, estatura_cm
correo (único)                     estado_afiliacion ('Activo'|'Inactivo'|'Pendiente')
contrasena (bcrypt)                foto, fecha_ultima_modificacion
rol ('Administrador'|'Entrenador'|'Recepcionista'|'Afiliado')   registrado_por (FK→USUARIO)
estado ('Activo'|'Inactivo'|'Pendiente')          fecha_registro
```

**La regla de hierro:** la columna `contrasena` NUNCA se devuelve en consultas de lectura; solo `findByEmail` la lee, y solo para compararla con bcrypt.

**Sentencias preparadas — la comanda en silencio.**

Todas las consultas pasan los valores con **`?` de marcador** y un arreglo de parámetros:

```js
findByEmail: async (correo) => {
  const [rows] = await pool.query(
    `SELECT id_usuario, nombres, apellidos, correo,
            contrasena, rol, estado
     FROM USUARIO
     WHERE correo = ?`,
    [correo]
  );
  return rows[0] || null;
},
```

Esto no es un detalle menor: es la defensa #1 contra **inyección SQL**. El valor del usuario entra a MySQL como *dato* (entre comillas automáticas), jamás como código SQL. Analogía del instructor: es un mozo que anota el pedido en una comanda con casillas fijas, en vez de dejar que el cliente escriba su pedido directamente en la libreta del chef.

**Transacción: un combo que todo-o-nada (`afiliadoModel.create`).**

Crear un afiliado toca DOS tablas (USUARIO y AFILIADO). Si el segundo `INSERT` fallara, quedaría un usuario "fantasma" sin perfil. Por eso todo va en **una transacción** (`beginTransaction` → `commit` o `rollback`):

```js
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  const [uRes] = await conn.query(
    `INSERT INTO USUARIO (nombres, apellidos, correo, contrasena, rol, estado)
     VALUES (?,?,?,?,'Afiliado','Activo')`,
    [nombres, apellidos, correo, hash]
  );
  const id_usuario = uRes.insertId;
  await conn.query(
    `INSERT INTO AFILIADO
       (id_usuario, documento, fecha_nacimiento, sexo,
        telefono, direccion, estatura_cm, estado_afiliacion, registrado_por)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [id_usuario, documento, fecha_nacimiento, sexo, telefono, direccion,
     estatura_cm, estado_afiliacion, registrado_por]
  );
  await conn.commit();
  return { id_usuario, password_temporal: rawPassword };
} catch (err) {
  await conn.rollback();   // si AFILIADO falló, se borra el USUARIO recién creado
  throw err;
} finally {
  conn.release();          // el taxi vuelve a la flota
}
```

**Nota de negocio (BUG-008):** si el frontend no manda contraseña se genera `MF_{documento}@2025` y se devuelve en `password_temporal` para el correo de bienvenida — antes existía un password fijo hardcodeado (vulnerabilidad).

**El anti-N+1 de `findAll` (la joya de esta base de datos).**

**PARA QUÉ:** listar 500 afiliados haciendo, por cada uno, 3 consultas (restricciones, ciclo, progreso) era *1 + 1500* queries. Con 500 afiliados la página tardaba segundos. La versión actual hace **4 queries planas** y reensambla en memoria:

```text
  Query 1: afiliados de la página  (JOIN USUARIO para login + registrado_por)
  Query 2: TODAS las restricciones de esos ids  →  WHERE ar.id_usuario IN (?)
  Query 3: TODOS los ciclos activos de esos ids + planes  →  WHERE c.id_usuario IN (?)
  Query 4: el ÚLTIMO progreso físico de esos ciclos (subconsulta MAX)
                                                                        │
      reensamblado en JS con Maps (O(n), sin bucles anidados)          │
                                                                        ▼
  Resultado: array de afiliados con restricciones[], ciclo_activo{…}, ultimo_progreso{…}
```

El `IN (?)` con el arreglo `ids` es el truco: en vez de una consulta por afiliado, se trae **todos los relacionados de una sola vez**, y luego se indexan en `Map` por su llave natural:

```js
const restrMap    = new Map();   // id_usuario → [restricciones]
const cicloMap    = new Map();   // id_usuario → ciclo
const progresoMap = new Map();   // id_ciclo   → ultima_medicion
```

Con paginación (`page`/`limit`, máximo 200 por página) y el índice de los campos ordenados, la consulta es constante aunque haya 10.000 afiliados.

### 2.6 Seguridad en capas (el sistema como una cebolla)

**PARA QUÉ:** ninguna medida por sí sola es suficiente; la seguridad vive en que **cada capa defiende sola**. Si el JWT falla, está el CORS; si el CORS falla, está Helmet; si la inyección SQL intenta pasar, están los `?`; si un rol intenta más de lo que puede, está el guardia; etc.

**El mapa de las capas (todas con código real):**

| # | Capa | Dónde está | Qué defiende |
|---|------|-----------|--------------|
| 1 | **CORS whitelist** | `server.js` | Que solo entren orígenes conocidos (web 5173…, Render). Sin `Origin` (móvil/curl) siempre entra. |
| 2 | **Helmet** | `server.js` | Cabeceras HTTP seguras (X-Frame-Options, etc.). CSP desactivado para que Swagger funcione. |
| 3 | **Tamaño de body ≤ 50 kb** | `server.js` | Evita DoS por payloads gigantes. |
| 4 | **Content-Type JSON obligatorio** | `server.js` | Rechaza 415 los POST/PUT/PATCH sin JSON (y hace debuggable el error: antes fallaba en silencio). |
| 5 | **Rate limit en /login** | `server.js` | 10 intentos/15 min por IP; bcrypt es ~250-400 ms, sin límite un atacante satura el evento loop. |
| 6 | **JWT con expiración** | `services/authService.js` | Sesión de 8 h; reset tokens de 15 min con `tipo: 'password_reset'`. |
| 7 | **bcrypt 12 rondas + límite 72 B** | `authService.js` + `authController.js` | Almacenamiento resistente; rechazo de entradas que bcrypt truncaría. |
| 8 | **Mensajes genéricos / anti-enumeración** | `authController.js` | 401 idéntico para correo inexistente o password malo; 200 genérico en recuperar-password. |
| 9 | **Whitelists de columnas** | `usuarioModel.update`, `afiliadoModel.update/updateMe` | Imposible inyectar columnas arbitrarias en el `SET`. |
| 10 | **requireOwnCiclo (anti-IDOR)** | `middlewares/auth.js` | Un afiliado no accede a ciclos de terceros: verifica `ciclo.id_usuario !== req.user.sub`. |
| 11 | **Error handler global sin fugas** | `server.js` | Traduce CORS/JWT/JSON/multer a códigos correctos; NUNCA devuelve stack traces (BUG-010). |
| 12 | **`JWT_SECRET` sin fallback** | `authService.js` | Sin secreto el server no arranca: imposible forjar tokens con un valor predecible (BUG-009). |

**Dos de estas capas merecen código porque el instructor las va a cazar en el examen:**

```js
// server.js: el rate limiter de login (BUG-005)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,          // 15 minutos
  max: 10,                            // máx. 10 intentos por ventana
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.' },
  skipSuccessfulRequests: true,       // los logins exitosos no cuentan
});
app.use('/login', loginLimiter);      // SOLO en /login, no en todo el server
```

```js
// server.js: el manejador global de errores (nunca filtra trazas al cliente)
app.use((err, req, res, next) => {
  console.error('[ERROR GLOBAL]', err.stack || err.message);   // solo servidor
  if (err.message && err.message.startsWith('CORS'))
    return res.status(403).json({ error: err.message });
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')
    return res.status(401).json({ error: 'Token inválido o expirado' });
  if (err.type === 'entity.parse.failed')
    return res.status(400).json({ error: 'JSON malformado en el body' });
  return res.status(500).json({ error: 'Error interno del servidor' });
});
```

---

### 2.7 Profundización: el router más extenso de la API — `/afiliados` y los middlewares en cadena

**PARA QUÉ:** el manual ya mostró los middleware y el flujo de login. Ahora veamos **el router que concentra toda la lógica del afiliado** y cómo Express encadena funciones en una sola línea. Aquí se ve en acción el "desfile" de middlewares: primero `requireAuth` (¿quién es?), después un middleware de rol (`requireStaff`, `requireAdminOrRecepcionista`…), y al final el controlador.

**Cómo se ve el desfile en la línea de código (REAL de `routes/afiliadoRoutes.js:60,85`):**

```js
// GET /afiliados?page=&limit= — lectura de gestión: cualquier staff autenticado
router.get('/',        requireAuth, requireStaff, AfiliadoController.getAll);

// GET /afiliados/me    — el afiliado autenticado lee SU propio perfil
router.get('/me',      requireAuth, AfiliadoController.getMe);
```

Léanla de izquierda a derecha como una cadena de producción:
```
request entra → requireAuth (valida JWT) → requireStaff (valida rol)
             → AfiliadoController.getAll (capa HTTP) → AfiliadoService (lógica)
             → UsuarioModel/AfiliadoModel (SQL con ? placeholders)
             → response de vuelta
```

El encabezado del archivo lo resume mejor que nadie (comentario REAL):

```js
//   · requireStaff               → lecturas de gestión (lista, detalle, ciclos)
//   · requireAdminOrRecepcionista→ altas y actualizaciones de mostrador
//   · requireAdmin               → borrado físico (irreversible)
// Los endpoints /me operan sobre el ID del token (req.user.sub), por lo que un
// afiliado solo puede leer/modificar sus propios datos; los endpoints /:id son
// para el staff.
// ORDEN IMPORTANTE: las rutas /me (y '/ciclos', '/progreso') se declaran ANTES
// de '/:id' para que Express no las atrape como parámetro de ruta.
```

**El "truco" de la orden:** si declararan `router.get('/:id', ...)` antes que `router.get('/me', ...)`, la URL `/afiliados/me` interpretaría a `me` como un `id`. Por eso las rutas específicas van **primero** y las paramétricas **después**. Es un clásico del examen: "¿por qué 'me' no se confunde con ':id'?".

**Bonus: documentación Swagger viviente dentro del código.** Cada ruta lleva su `@swagger` para que `/api-docs` se genere solo:

```js
/**
 * @swagger
 * /afiliados/me:
 *   get:
 *     summary: Obtener mi perfil (afiliado autenticado)
 *     description: Usa automáticamente el id del token JWT. No requiere parámetro :id.
 *     tags: [Afiliados]
 *     security:
 *       - bearerAuth: []
 */
router.get('/me', requireAuth, AfiliadoController.getMe);
```

### 2.8 Profundización: `cicloModel` — transacciones, subconsultas y borrado en cascada "a mano"

**PARA QUÉ:** el ciclo es el corazón del plan (cumple con las historias de gestión de ciclos). `cicloModel.js` muestra tres superpoderes de SQL en contexto real: **transacciones** (todo o nada), **subconsultas correlacionadas** (numerar ciclos) y **borrado en cascada hecho a mano** (cuando la BD no puede por RESTRICT).

**Superpoder 1 — numerar ciclos con una subconsulta (REAL de `cicloModel.js:29-42`):**

```js
findByAfiliado: async (id_usuario) => {
  const [rows] = await pool.query(`
    SELECT c.*,
      (
        SELECT COUNT(*)
        FROM CICLO c2
        WHERE c2.id_usuario   = c.id_usuario
          AND c2.fecha_inicio <= c.fecha_inicio
      ) AS numero_ciclo
    FROM CICLO c
    WHERE c.id_usuario = ?
    ORDER BY c.fecha_inicio DESC
  `, [id_usuario]);
  return rows;
},
```

Así la app muestra "Ciclo 1", "Ciclo 2", "Ciclo 3" sin guardar un contador: el número se **calcula** contando cuántos ciclos anteriores existen. Menos columnas = menos estado que mantener.

**Superpoder 2 — la regla "un solo ciclo activo" como transacción atómica (REAL de `cicloModel.js:79-112`):**

```js
const conn = await pool.getConnection();
try {
  await conn.beginTransaction();
  // Cierra ciclos anteriores activos del mismo afiliado
  await conn.query(
    'UPDATE CICLO SET activo = 0 WHERE id_usuario = ? AND activo = 1',
    [id_usuario]
  );
  const [result] = await conn.query(
    `INSERT INTO CICLO
       (id_usuario, fecha_inicio, fecha_fin, activo,
        objetivo_fisico, nivel_experiencia, disponibilidad_dias,
        grupo_muscular_prioritario, observaciones, registrado_por)
     VALUES (?,?,?,1,?,?,?,?,?,?)`,
    [id_usuario, fecha_inicio, fecha_fin, objetivo_fisico,
     nivel_experiencia, disponibilidad_dias,
     grupo_muscular_prioritario, observaciones, registrado_por]
  );
  await conn.commit();
  return result.insertId;
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

Si el `INSERT` fallara, el `rollback` revierte el `UPDATE` que cerró el ciclo anterior → **o se cierra el viejo y se crea el nuevo, o no pasa nada**. Y el trigger `trg_ciclo_no_solapamiento_insert` del schema (visto en 1.5) es la segunda barrera: rechaza fechas que se crucen.

**Superpoder 3 — borrar en cascada "a mano" (REAL de `cicloModel.js:180-214`):** como las FKs hijas usan `ON DELETE RESTRICT` o son compuestas, un `DELETE FROM CICLO WHERE id_ciclo=?` simple fallaría. Por eso se borra en orden: primero los nietos y los registros que no tienen FK, luego las tablas con FK RESTRICT (RUTINA_EJERCICIO antes que RUTINA), y al final el padre:

```js
await conn.query('DELETE FROM REGISTRO_EJERCICIO WHERE id_ciclo = ?', [id_ciclo]);
await conn.query('DELETE FROM CONSUMO_ALIMENTO_REAL WHERE id_ciclo = ?', [id_ciclo]);
// …rutinas, planes, progreso, notas…
const [r] = await conn.query('DELETE FROM CICLO WHERE id_ciclo = ?', [id_ciclo]);
await conn.commit();
```

> Tesis para el instructor: "la BD protege la integridad con RESTRICT, así que el borrado lógico ordenado lo ejecuta el modelo en una transacción. No es redundancia: son dos capas del mismo diseño."

### 2.9 Profundización: el controlador que "dispara y olvida" — correo de bienvenida y webhook n8n

**PARA QUÉ:** el manual explicó que el POST /afiliados valida y crea. Ahora vean lo que ocurre **después del alta**: correo de bienvenida + notificación a n8n (que reenvía a Telegram y Google Sheets). Esto causa el **patrón fire-and-forget** (REAL de `controllers/afiliadoController.js:65-90`):

```js
create: async (req, res) => {
  try {
    const result = await AfiliadoService.create(req.body, req.user.sub);
    // Correo de bienvenida + webhook n8n (fire-and-forget: nunca bloquea la respuesta)
    if (result?.id) {
      const passwordTemporal = result.password_temporal
        || req.body.contrasena || req.body.password
        || 'MetaFit2025!';
      AfiliadoService.getById(result.id)
        .then((detalle) => {
          if (!detalle) return null;
          require('../services/bienvenidaService')
            .enviarCorreoBienvenida(detalle, passwordTemporal)
            .catch((err) => console.error('[afiliadoController] bienvenida:', err.message));
          require('../services/n8nWebhookService')
            .notificarNuevoAfiliado(detalle, passwordTemporal)
            .catch((err) => console.error('[afiliadoController] webhook n8n:', err.message));
          return null;
        })
        .catch((err) => console.error('[afiliadoController] post-creacion:', err.message));
    }
    return res.status(201).json(result);
  } catch (err) {
    // …500 con mensaje genérico
  }
}
```

**El patrón en tres ideas:**
1. **`create` responde `201` de inmediato** — el usuario no espera a que el correo se envíe.
2. **Nunca bloquea**: si el correo tarda o falla, nadie lo nota en pantalla (la promesa se ejecuta en paralelo y solo se loguea el error).
3. **Contraseña temporal legible**: si el frontend no envía `contrasena`, el backend usa `result.password_temporal` o el fallback `'MetaFit2025!'` — el mismo valor global que después van a cambiar los afiliados en su primer acceso.

---

### 2.10 Profundización: el service que orquesta modelos — PATCH /afiliados/me con validaciones reales

**PARA QUÉ:** las secciones 2.7–2.9 se centraron en rutas, middleware y modelos. El eslabón del medio, la **capa de servicios**, es donde viven las reglas de negocio; el afiliado que edita su propio perfil (`PATCH /afiliados/me`) lo demuestra de forma perfecta (código REAL de `services/afiliadoService.js:95-130`):

```js
updateMe: async (id, datos) => {
  // Acepta alias usados por los frontends (peso o peso_kg, talla/altura_cm/estatura_cm)
  const pesoKg     = datos.peso_kg !== undefined ? datos.peso_kg : datos.peso;
  const estaturaCm = datos.estatura_cm !== undefined
    ? datos.estatura_cm
    : (datos.altura_cm !== undefined ? datos.altura_cm : datos.talla);
  const telefono   = datos.telefono;
  const correo     = datos.correo;

  if (pesoKg === undefined && estaturaCm === undefined
      && telefono === undefined && correo === undefined) {
    const err = new Error('No hay campos para actualizar. Envía peso, talla, telefono o correo.');
    err.code = 'DATOS_INVALIDOS';
    throw err;
  }

  if (pesoKg !== undefined) {
    if (!Number.isFinite(Number(pesoKg)) || Number(pesoKg) < 20 || Number(pesoKg) > 300) {
      const err = new Error('El peso debe estar entre 20 y 300 kg');
      err.code = 'DATOS_INVALIDOS';
      throw err;
    }
  }
  // … (mismas validaciones para estatura 1-300, teléfono ≤ 20 caracteres, correo único)
```

**Las tres lecciones de arquitectura que se desprenden:**
1. **El controlador solo manda**, el service **valida** y el modelo **persiste**. Nada de validaciones pegadas en la ruta.
2. **Los códigos de error son compartibles**: `err.code = 'DATOS_INVALIDOS'` se propaga hasta el controlador para responder `400 { error, code }` — y el frontend puede decidir qué mostrar.
3. **Normalización de fechas**: `create` usa `normalizarFecha(datos.fecha_nacimiento)` (extraída a `utils/fechaUtils.js` para poder testearla sin BD — leer el comentario FIX 1.3 / ISO 25000). Es la prueba del propósito del codebase: código testeable es código razonador.

> Conexión con la parte 6.9: `getAll` del service simplemente delega en el modelo (`return AfiliadoModel.findAll({ page, limit })`), pero es `findAll` quien hace las **4 queries planas anti-N+1**. Así el service se convierte en un pasamanos limpio: reglas acá, SQL allá, y el controlador solo responde.

---

### Resumen — Parte 2 (5 ideas que deben poder recitar rápido)

1. El arranque es una **cadena**: esperar BD → migraciones idempotentes → cron → `server.js` → `listen` en `PORT || 3001`.
2. El `POST /login` recorre **validation → modelo → bcrypt → JWT**; el estado se valida ANTES de comparar la contraseña y los errores son genéricos.
3. **JWT = pasaporte firmado** (`sub`+`email`+`role`, 8 h); **bcrypt = licuadora** de 12 rondas con tope de 72 bytes; el secreto no tiene fallback.
4. Los **middlewares se encadenan**: `requireAuth` → guardia de rol → (según ruta) `requireOwnCiclo`; el rol se lee del token, la propiedad de un ciclo se consulta en la BD.
5. **Pool = flota de taxis** (10 conexiones), **USUARIO↔AFILIADO comparten id**, sentencias con `?` contra inyección SQL, transacciones todo-o-nada y `findAll` resuelto en 4 queries sin N+1.

### Cómo explicárselo al instructor en 2 minutos (Parte 2)

"El backend es la cocina central. Cuando alguien pide iniciar sesión, la comanda viaja así: la ventanilla (ruta `/login`) frena a los que no tienen carnet de acceso (rate limit), el primer cocinero revisa el formato del pedido, el segundo pregunta a la despensa si ese correo existe, el tercero desenvuelve la contraseña con la licuadora de bcrypt y —si todo cuadra— le entrega al cliente un pasaporte (JWT) válido por 8 horas. De ahí en adelante, cada plato que se pida solo muestra el pasaporte en la puerta: el guardia `requireAuth` lo lee, decide si tu rol puede entrar a esa receta, y hasta verifica que no cocines con los ingredientes de otro comensal (`requireOwnCiclo`). Y nada de esto filtraría jamás los secretos de la despensa, porque todas las consultas a MySQL entran por la comanda de marcadores `?`, nunca por texto libre."

---

---

## PARTE 3. EL FRONTEND WEB: REACT + VITE (el panel del staff)

**La analogía que rige la Parte 3:** la web es el **puesto de recepción y gerencia**. No hay reloj ni caja de seguridad aquí: todo el "dinero" (datos) está en el backend. La web es una pantalla con estantes que le piden servidos y los muestran; y como cualquiera puede abrir la URL, la web tiene su **propio guardia de recepción** (ProtectedRoute) que decide qué le deja ver a cada rol.

**La carpeta `frontend_web/src/` en orden de lectura:**

```text
frontend_web/src/
├── main.jsx                    → el punto de entrada: initTheme + createRoot
├── App.jsx                     → el Router completo con todas las rutas protegidas
├── index.css                   → tokens de color (--mf-*) y tema claro/oscuro
├── context/AuthContext.jsx     → sesión global + login/logout + authAxios
├── services/
│   ├── api.js                  → instancia axios + interceptores (token y 401)
│   └── authService.js          → login, persistencia en localStorage, helpers
├── components/
│   ├── ProtectedRoute.jsx      → guardia RBAC de rutas (el "portero")
│   ├── HomeRedirect.jsx        → redirige / → home del rol
│   ├── ErrorBoundary.jsx       → si algo truena, muestra un mensaje digno
│   └── AppLayout.jsx / PublicLayout.jsx → el cascarón visual
├── views/                      → una carpeta por pantalla (Login, AfiliadosView, …)
├── hooks/ (useApi, useToast, useMutation, useDashboard…)  → lógica reutilizable
└── utils/ (theme.js, analytics.js, afiliadoHelpers.js)    → funciones puras
```

### 3.1 Arranque: `index.html → main.jsx → App.jsx`

**PARA QUÉ:** en una SPA (Single Page Application) el navegador carga un **único HTML** (`index.html`) que define cual es el agujero donde todo se monta: `<div id="root">`. React desde entonces toma control total de la pantalla. No hay más recargas de página: el router cambia lo que se ve "en vivo".

**Los pasos reales** (`main.jsx`):

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initTheme } from './utils/theme.js'

// Aplica el tema persistido (claro/oscuro) ANTES del primer render
initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
```

**Detalles que el instructor espera que digan:**

1. **`initTheme()` corre ANTES del render.** Lee `localStorage` (`metafit_theme`, default oscuro) y aplica `data-theme` sobre `<html>` para que no haya "flash del tema equivocado".
2. **`StrictMode`** activa verificaciones de desarrollo de React (doble render intencional para cazar efectos sucios).
3. **`ErrorBoundary`** atrapa cualquier error de render y muestra una pantalla de error en vez de una página en blanco/rota.
4. **`HashRouter`** (en App.jsx) → las URLs web son del tipo `/#/afiliados`. El `#` hace que "navegar" no recargue el documento y que en servidores estáticos no haga falta ningún rewrite de ruta.

**El Router completo** (`App.jsx`) usa **code-splitting**: cada vista se descarga mediante `lazy(() => import(...))` solo cuando el usuario navega hacia ella. Eso hace que el primer `load` sea chiquito (solo Login/Landing) y el resto llegue "bajo demanda":

```jsx
const Login            = lazy(() => import("./views/Login"));
const AdminDashboard   = lazy(() => import("./views/AdminDashboard"));
const AfiliadosView    = lazy(() => import("./views/AfiliadosView"));
// … y así con todas las vistas
```

Y las rutas se agrupan por quién puede verlas, usando `ProtectedRoute` como layout padre:

```jsx
<Route element={<ProtectedRoute allowedRoles={ADMIN} />}>
  <Route path="/dashboard" element={<AdminDashboard />} />
  <Route path="/personal"  element={<GestionPersonal />} />   {/* solo Admin */}
  <Route path="/finanzas"  element={<FinanzasView />} />       {/* solo Admin */}
</Route>

<Route element={<ProtectedRoute allowedRoles={ADMIN_TRAIN} />}>
  <Route path="/rutinas" element={<RutinasView />} />
  <Route path="/dietas"  element={<DietasView />} />
</Route>

<Route element={<ProtectedRoute allowedRoles={ALL_ROLES} />}>
  <Route path="/afiliados" element={<AfiliadosView />} />
</Route>
```

### 3.2 El guardia de rutas: `ProtectedRoute` + RBAC (el portero)

**PARA QUÉ:** cualquiera puede escribir la URL de una ruta protegida en el navegador. El portero decide: **¿estás logueado? ¿tu rol puede estar acá? Si no, ¿a dónde te mando?**

**El esquema mental (y lo que el instructor va a preguntar):**

```text
Usuario pide:  /dashboard
                      │
ProtectedRoute allowedRoles=["Administrador"]
                      │
  FASE 1   isAuthReady === false ?  → spinner (el auth aún se resuelve)
                      │
  FASE 2   token  = ctxToken || localStorage("metafit_token")
           user   = ctxUser  || localStorage("metafit_user")   ← respaldo síncrono
                      │
  FASE 3   ¿no token ni user?      → Navigate /login
           ¿rol en allowedRoles?   → NO → Navigate a ROLE_HOME[rol]
           → SÍ → <Outlet /> (renders la ruta hija)
```

**La decisión real por rol (ROLE_HOME):**

```jsx
const ROLE_HOME = {
  Administrador: "/dashboard",
  Recepcionista: "/afiliados",
  Entrenador:    "/rutinas",   // ← su home real: módulo de entrenamiento
};
```

> **LA PREGUNTA DEL EXAMEN: "¿Qué pasa si una Recepcionista abre `/dashboard`?**
> La ruta `/dashboard` está dentro de `<ProtectedRoute allowedRoles={ADMIN}>`. La Recepcionista tiene token y usuario (pasa Fases 1 y 2), pero en la Fase 3 su rol `Recepcionista` **no está en `["Administrador"]`**, entonces `ROLE_HOME["Recepcionista"]` la manda a `/afiliados`. Importante aclarar: el **redirect es en el frontend**, pero si la Recepcionista intentara llamar `GET /dashboard/kpis` directamente con su token, el **backend** también la rechazaría con 403 (middleware `requireAdmin`). Doble candado.

**El código real de la Fase 3 (ProtectedRoute.jsx):**

```jsx
// 1. Sin autenticación → login
if (!token || !user) return <Navigate to="/login" replace />;

// 2. Rol no permitido → home del rol actual
if (allowedRoles && !allowedRoles.includes(user.role)) {
  const home = ROLE_HOME[user.role] || "/login";
  return <Navigate to={home} replace />;
}

// 3. Todo OK → renderiza la ruta hija
return <Outlet />;
```

**Por qué existe `isAuthReady`:** después de un login exitoso, React 18 agrupa (batching) los `setState`. Si `navigate()` ocurre antes de que el contexto propague, `ProtectedRoute` vería un frame donde `token` es `null` y mandaría al usuario a `/login` — el famoso bucle blanco. El proyecto lo resolvió con `flushSync` (lo vemos abajo) y con el **fallback a localStorage**: la sesión se guarda de forma síncrona, así el portero siempre tiene de dónde leer aunque el contexto React aún no llegue.

### 3.3 AuthContext: login, logout, persistencia y expiración

**PARA QUÉ:** muchos componentes necesitan saber "¿quién soy?" (el menú cambia por rol, una vista muestra botones solo para Admin, el header muestra el nombre). Un Contexto global evita pasar la sesión como prop por 15 niveles de componentes.

**El código real (AuthContext.jsx):**

```jsx
const [user,  setUser]  = useState(() => loadStoredUser());    // lectura síncrona
const [token, setToken] = useState(() => loadStoredToken() || null);
const [isAuthReady, setIsAuthReady] = useState(true);
```

**El login — y el uso de `flushSync` (la joya para la explicación):**

```jsx
const login = async ({ correo, contrasena }) => {
  const { accessToken, user: userData } = await loginUser({ correo, contrasena });

  // 1) Primero localStorage (respaldo síncrono)
  persistSession(accessToken, userData);

  // 2) flushSync: fuerza React a procesar los setState YA, de forma síncrona,
  //    antes de que login() retorne. Sin esto, Login.jsx llamaría navigate()
  //    con el Context todavía en null → ProtectedRoute mandaría a /login.
  flushSync(() => {
    setToken(accessToken);
    setUser(userData);
    setIsAuthReady(true);
  });

  return userData;
};
```

**Analogía para el instructor:** `flushSync` es avisar a los albañiles (React) que **terminen la pared ahora mismo** antes de que entre el visitante (navigate), en vez de dejar que la terminen "cuando tengan ganas".

**La persistencia (authService.js) — única autoridad sobre localStorage:**

```jsx
export const persistSession = (accessToken, userData) => {
  localStorage.setItem('metafit_token', accessToken);
  localStorage.setItem('metafit_user',  JSON.stringify(userData));
  localStorage.setItem('metafit_role',  userData?.role || '');
};

export const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem('metafit_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.role) { clearSession(); return null; }   // datos corruptos
    return parsed;
  } catch {
    clearSession();   // JSON malformado → limpia y vuelve null (seguro)
    return null;
  }
};
```

**¿Y la expiración?** La web no decide cuándo expira: el **backend** firmó el JWT con `expiresIn: '8h'`. Cuando el token vence, el backend devuelve `401`, y eso lo maneja el interceptor de axios (sección 3.4), no el AuthContext. La web solo "guarda y obedece".

### 3.4 `api.js`: la instancia axios y sus dos interceptores

**PARA QUÉ:** los 3 clientes repiten un 90 % del trabajo: pegarle al mismo backend, mandar el token, reaccionar si el token ya no sirve. Un **interceptor** (gancho) de axios centraliza eso para que ninguna vista tenga que construir un header a mano.

**El código REAL (api.js):**

```js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de REQUEST: adjunta el token automáticamente ─
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('metafit_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE: manejo global de 401 ─
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const is401      = error.response?.status === 401;
    const isLoginEndpoint = requestUrl.includes('/login');   // ⚠️ NO limpiar en /login

    if (is401 && !isLoginEndpoint) {
      localStorage.removeItem('metafit_token');
      localStorage.removeItem('metafit_user');
      localStorage.removeItem('metafit_role');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

**Analogía del instructor:** el interceptor de request es el **cargo de confianza que estampa tu DNI** en cada formulario antes de que salga la carta. El interceptor de response es el **guardia de la puerta de la embajada**: si el pasaporte venció (401), te escolta de vuelta al login.

**El caso trampa que hay que poder explicar:** un `401` en `/login` NO significa "token expirado", significa "credenciales incorrectas". Si el interceptor limpiara la sesión por ese 401, **borraría la sesión de otro usuario que estaba autenticado**. Por eso se excluye `isLoginEndpoint`.

### 3.5 La vista de Login: cómo el staff entra al sistema

**El flujo real (Login.jsx):**

1. El staff elige su rol en un `<select>` y escribe correo y contraseña (los campos ni se renderizan hasta 800 ms después para engañar al autocompletado del navegador, y hay dos *honeypots* ocultos).
2. `handleSubmit` llama `login({ correo, contrasena })` — **el cliente NO valida la credencial**; el backend decide. Aquí solo se mapean los errores a mensajes legibles.
3. Decisión de negocio clave:
   ```jsx
   if (role === "Afiliado") {
     logout();
     setError("Esta plataforma es solo para personal administrativo. Usa la app móvil.");
     return;
   }
   ```
4. `persistUserRole(role)` y `navigate(ROLE_MAP[role] || "/afiliados", { replace: true })` con el mapa.
5. Errores: `status 400/401` → "Correo o contraseña incorrectos"; cualquier otro → "Error de conexión con el servidor…". Nunca se muestra el detalle crudo del backend.

### 3.6 El patrón de una vista: `AfiliadosView` (la más compleja de la web)

**PARA QUÉ:** cada vista web sigue el mismo molde: **estado local (useState) → carga desde el backend (authAxios) → renderiza → muta → refresca y avisa al resto**. `AfiliadosView` es el caso completo porque combina CRUD, subida de foto, restricciones médicas y roles.

**1) Los catálogos UI y las pestañas que dependen del rol del token:**

```jsx
const ESTADOS  = ["Activo", "Inactivo", "Suspendido"];
const NIVELES  = ["Principiante", "Intermedio", "Avanzado"];
const OBJETIVOS = ["Pérdida de grasa", "Aumento de masa", "Mantenimiento"];

const TABS_POR_ROL = {
  Administrador: ["Estado de Cuenta", "Progreso Físico", "Ciclo Activo"],
  Recepcionista: ["Estado de Cuenta"],
  Entrenador: ["Progreso Físico", "Ciclo Activo"],
};
```

**2) La carga con patrón `loading → try/catch → finally` (todas las vistas lo repiten):**

```jsx
const fetchAfiliados = async () => {
  setLoading(true);
  try {
    const { data } = await authAxios.get("/afiliados");
    setAfiliados(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error("[AfiliadosView] fetchAfiliados:", err?.response?.data || err);
    setAfiliados([]);          // no romper la vista si el backend falla
  } finally {
    setLoading(false);
  }
};

useEffect(() => { fetchAfiliados(); }, []);
```

**3) Un detalle fino: el blob leaker de las fotos.** El preview de la foto nueva se genera con `URL.createObjectURL(file)`, que crea un `blob:` en memoria. Si no se revoca con `URL.revokeObjectURL`, cada foto seleccionada deja una fuga de memoria en el navegador. El código real lo limpia:

```jsx
useEffect(() => {
  return () => {
    if (fotoPreview && fotoPreview.startsWith("blob:")) {
      URL.revokeObjectURL(fotoPreview);   // el blob se libera al cambiar o desmontar
    }
  };
}, [fotoPreview]);
```

**4) Crear afiliado = el patrón "crear → asignar"** (el payload se normaliza antes de mandarlo: `estatura_cm` a float, `estado` se renombra a `estado_afiliacion` porque así lo llama el schema de la BD, y después de crear se sube la foto y se asignan las restricciones una por una):

```jsx
const payload = {
  ...formCrear,
  estatura_cm: parseFloat(formCrear.estatura_cm) || null,
  disponibilidad_semanal_dias: parseInt(formCrear.disponibilidad_semanal_dias) || 3,
  estado_afiliacion: formCrear.estado,
};
delete payload.estado;
const { data } = await authAxios.post("/afiliados", payload);

if (data?.id && restriccionesSeleccionadas.length > 0) {
  for (const r of restriccionesSeleccionadas) {
    const rid = r?.id_restriccion ?? r?.id;
    await authAxios.post(`/afiliados/${data.id}/restricciones`, { id_restriccion: rid });
  }
}
```

**5) El bus de eventos entre vistas:** tras crear/editar/eliminar, la vista hace:

```jsx
window.dispatchEvent(new CustomEvent("afiliado-modificado"));
```

`AdminDashboard` está **escuchando** ese evento (`window.addEventListener("afiliado-modificado", refresh)`) y refresca sus KPIs en vivo. Dos vistas de React que no comparten props se comunican a través del `window`; el instructor suele preguntarlo y la respuesta es esta línea.

**6) Los permisos por rol en la propia vista** (el backend también los valida, pero la UI se adapta):

```jsx
const puedeCrear = role === "Administrador" || role === "Recepcionista";
```

### 3.6 Flujo visual completo: login → crear afiliado (web)

Para cerrar la Parte 3, el recorrido completo con las capas que ya conocen:

```text
RECEPCIONISTA abre http://…/#/afiliados
  1. App.jsx resuelve la ruta → <ProtectedRoute allowedRoles={ALL_ROLES}>
  2. Fases 1-2-3: token OK, rol "Recepcionista" permitido → renderiza AfiliadosView
  3. AfiliadosView llama authAxios.get('/afiliados')
        → interceptor de request: le pega el Bearer token del localStorage
        → backend: requireAuth lee el JWT, requireStaff acepta rol "Recepcionista"
        → afiliadoModel.findAll (4 queries, sin N+1) → JSON
  4. La vista pinta la tabla. La recepcionista usa "Nuevo afiliado".
  5. handleCrear: POST /afiliados (payload normalizado) → transacción en el backend
     (USUARIO + AFILIADO), password temporal MF_{documento}@2025 si aplica.
        → si hay foto: POST /afiliados/:id/foto (multipart)
        → si hay restricciones: POST /afiliados/:id/restricciones (una a una)
  6. toast "Afiliado creado correctamente" + refresh de la lista
     + window.dispatchEvent('afiliado-modificado') → el Dashboard se entera.
```

---

### 3.7 Profundización: `HomeRedirect` y `ErrorBoundary` — los dos porteros invisibles

**PARA QUÉ:** la parte 3 explicó el router y las rutas protegidas. Faltan dos piezas que el usuario jamás ve pero que **deciden a dónde va cada quien** y **qué pasa si algo explota**: `HomeRedirect` (el "guardia de la entrada") y `ErrorBoundary` (el "botiquín").

**El guardia de la entrada — `HomeRedirect.jsx` (código REAL):**

```jsx
import { Navigate } from 'react-router-dom';
import { ROLES_ROUTE } from './RequireAuth';

export default function HomeRedirect() {
  const role = localStorage.getItem('metafit_role');   // ¿quién soy?
  const target = ROLES_ROUTE[role] || '/login';        // ¿a dónde va mi rol?
  return <Navigate to={target} replace />;
}
```

Este componente se monta en la raíz (`/`) y **no pinta nada**: su única misión es redirigir. Es la pieza que materializa la lógica de roles: `Administrador → /dashboard`, `Recepcionista → /afiliados`, `Entrenador → /rutinas`, y si no hay rol → `/login`. Fíjense que convive con la lógica de la parte 3.2 — por eso el panel sabe "por qué el entrenador cae en /rutinas".

**El botiquín — `ErrorBoundary.jsx` (código REAL, simplificado):**

```jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {            // 1) se entera del error
    return { hasError: true };
  }

  componentDidCatch(error, info) {               // 2) lo loguea
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  render() {
    if (this.state.hasError) {                   // 3) pantalla amable
      return <div>… algo salió mal · recargar página …</div>;
    }
    return this.props.children;                  // 4) si todo bien, pasa
  }
}

export default ErrorBoundary;
```

**POR QUÉ es un componente de clase y no una función:** los límites de error de React **solo existen como componentes de clase**; un componente funcional no puede atrapar errores de render de sus hijos. Es la única excepción lógica del proyecto, y vale la pena mencionarla: "en React, el único caso donde toca clase es un ErrorBoundary".

**Concepto para el examen (analogía):** el ErrorBoundary es como el **candado de seguridad de un edificio**: no evita que ocurra el incendio, pero evita que el incendio **se lleve todo el edificio**. Sin él, un solo componente que truena desmonta la aplicación completa en blanco.

### 3.8 Profundización: el "bus de eventos" — cuando las vistas del panel se chismean entre sí

**PARA QUÉ:** el panel Real tiene varias vistas (Afiliados, Pagos, Rutinas, Dietas, Personal) que modifican datos y otras que muestran resúmenes. ¿Cómo se enteran los tableros de que algo cambió? Con **eventos de `window`** — un minibús de mensajes dentro del navegador, sin servidor.

**Quién emite (elige unos, son REALES):**

```jsx
// AfiliadosView.jsx — tras crear/editar/estado de un afiliado:
window.dispatchEvent(new CustomEvent('afiliado-modificado'));

// PagosView.jsx — tras registrar un pago:
window.dispatchEvent(new CustomEvent('pago-registrado'));

// GestionPersonal.jsx — tras crear/editar/estado de un usuario staff:
window.dispatchEvent(new CustomEvent('personal-modificado'));

// RutinasView.jsx y DietasView.jsx también emiten
// "rutina-modificada" y "dieta-modificada"
```

**Quién escucha (REAL de `Dashboard.jsx:41-44` y `AdminDashboard.jsx:412-415`):**

```jsx
useEffect(() => {
  const refresh = () => { cargarDatos(); };
  window.addEventListener('pago-registrado', refresh);
  window.addEventListener('afiliado-modificado', refresh);
  window.addEventListener('personal-modificado', refresh);
  return () => {   // cleanup: desuscribirse al desmontar (evita fugas)
    window.removeEventListener('pago-registrado', refresh);
    window.removeEventListener('afiliado-modificado', refresh);
    window.removeEventListener('personal-modificado', refresh);
  };
}, []);
```

**El concepto (analogía del restaurante):** la caja registradora (PagosView) grita "¡pago registrado!" y las cocinas (Dashboard) refrescan su cuadro. No hay cable físico entre ellas: el **mensaje tiene alcance de página** (`window`) y el que le interesa se suscribe. Y noten el `cleanup` de `useEffect` — si un componente desmontado siguiera escuchando, sería un error de memoria (el clásico "memory leak" de React del examen).

**Las tres ideas parea anotar:**
1. `dispatchEvent` = publicar; `addEventListener` = suscribirse; ambos a nivel `window`.
2. El dato viaja "por onda": quien emite no sabe quién escucha (bajo acoplamiento).
3. Siempre hay que desuscribirse en el `cleanup` → los `return () => removeEventListener` son la prueba.

---

### 3.9 Profundización: dos detalles de UX que el panel cuida con esmero

**PARA QUÉ:** los desarrolladores fuertes defienden no solo "que funcione" sino "que se sienta vivo". El panel de Metafit tiene dos trucos que lo hacen sentir reactivo, y ambos son código REAL.

**Truco 1 — refrescar datos cuando la pestaña gana foco (`visibilitychange`).**

Si un recepcionista registra un pago en otra pestaña y vuelve al Dashboard, los totales se actualizan solos. Revisado en pantalla real de `Dashboard.jsx` y `FinanzasView.jsx`:

```jsx
useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      cargarDatos();   // al volver a la pestaña, refresca los totales
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);
  // cleanup
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

Es el mismo patrón de la parte 3.8 (el bus de eventos), pero con otro emisor: **el propio navegador** avisa "tamaño de pestaña visible de nuevo" y el componente responde. En un sistema de gimnasio donde varias personas trabajan con la misma cuenta staff, esto evita el clásico "pero yo ya cobré y no figura".

**Truco 2 — cerrar el menú al hacer clic fuera (`mousedown`).**

El `Header.jsx` usa `document.addEventListener('mousedown', handleClickOutside)`. El mismo patrón de "escuchar en `document`" de los eventos de ventana, pero para capturar un clic **fuera** del menú desplegable (avatar, notificaciones), y así cerrarlo. Si el clic ocurre fuera del contenedor del menú, `handleClickOutside` lo cierra; el `cleanup` lo desuscribe contra pérdidas.

**La lección transversal (se las regalamos para el examen):** desde el API, pasando por Express hasta el DOM, el código usa **un único estilo de eventos**: `addEventListener`/`dispatchEvent`, siempre con su `removeEventListener` en el `cleanup`. Ese es el hilo conductor que explica "cómo sabe el panel que algo cambió": peticiones al servidor cuando es necesario (recargas), y eventos en `document`/`window` cuando la noticia no necesita salir del navegador (cambios de otra vista, foco de pestaña, clic fuera).

---

### Resumen — Parte 3 (5 ideas que deben poder recitar rápido)

1. La web arranca `index.html → main.jsx` (`initTheme` antes del render) → `App.jsx` (`HashRouter` + `lazy`) → vista por vista bajo demanda.
2. **ProtectedRoute** es el portero por rol: sin token → `/login`; rol no permitido → **home del rol** (`ROLE_HOME`); todo OK → `<Outlet />`. El backend refuerza con 403.
3. **AuthContext** orquesta sesión + `flushSync` (sin él, el login causaría el bucle a `/login` por el batching de React 18); la persistencia vive SOLO en `authService.js` (claves `metafit_token/user/role`).
4. **api.js** intercepta: el request estampa el `Bearer` automático y el response maneja globalmente el 401 (excepto cuando el 401 es del propio `/login`).
5. Toda vista sigue el molde: catálogos UI → `useState` → `authAxios` → render → mutar → `fetch` → evento de `window` para avisar al dashboard. El patrón crear→asignar separa POST del recurso y luego sus sub-recursos.

### Cómo explicárselo al instructor en 2 minutos (Parte 3)

"La web es el puesto de recepción. No guarda ningún secreto — todo está en el backend—, así que su trabajo es pedir platos y mostrarlos lindo. Cuando alguien abre una URL, el portero `ProtectedRoute` hace tres preguntas en orden: ¿la cocina ya resolvió quién soy? (spinner), ¿tengo pasaporte guardado? (si no, a `/login`), y ¿mi cargo está autorizado para entrar a esta sala? (si no, al home de mi cargo: recepción va a afiliados, entrenador va a rutinas). Al entrar, cada petición al backend sale por la puerta con el DNI estampado automáticamente por el interceptor de axios; y si el pasaporte venció, el interceptor de respuesta nos escolta de vuelta al login. Toda vista repite el mismo baile: pedir, pintar, hacer la acción (crear, editar, borrar), avisar por altavoz (`window`) para que el resto del panel se entere y refresque."

---

---

## PARTE 4. LA APP MÓVIL: EXPO / REACT NATIVE (la app del afiliado)

**La analogía que rige la Parte 4:** la app móvil es el **carné digital del socio**. No es una página web: es un programa instalado en el celular que habla con el backend de producción (Render) por internet, como cualquier otra app. La gran diferencia técnica con la web es que **el celular no tiene "localStorage síncrono"**: su memoria local (AsyncStorage) es asíncrona, y eso obliga a un estado `loading` que la web no necesita. Todo lo demás (RUTA = URL, pantalla = vista, interceptor = portero) se repite con otros nombres.

**La carpeta `movil/` en orden de lectura:**

```text
movil/
├── package.json         → declara Expo y el punto de entrada
├── app.json             → configuración de la app (nombre, icono, notifications)
├── App.js               → la raíz: ThemeProvider → AuthProvider → Root(StatusBar+AppNavigator)
└── src/
    ├── context/
    │   ├── AuthContext.js   → sesión del afiliado (async: loading/token/user)
    │   └── ThemeContext.jsx → modo claro/oscuro + swapPalette
    ├── services/
    │   └── api.js           → axios a Render + interceptores async + helpers /me
    ├── navigation/
    │   └── AppNavigator.js  → el "router": Loading → tabs (logueado) / public stack
    ├── theme.js             → la paleta de diseño (el espejo del web)
    ├── utils/               → seleccionarCicloActivo, formateadores, etc.
    └── screens/             → Landing, Login, MiPerfil, MiRutina, MiDieta,
                               MiProgreso, RegistroEjercicio, RegistroConsumo,
                               RecuperarPassword, EditarPerfil
```

### 4.1 Arranque: `package.json → AppEntry → App.js → 3 estados`

**PARA QUÉ:** en React Native no existe "index.html"; existe un **punto de entrada** que le dice a Expo qué JSX es la raíz. El archivo `movil/package.json` lo declara así:

```json
{
  "main": "node_modules/expo/AppEntry.js",
  "react-native": "0.83.10",
  "react": "19.2.0",
  "dependencies": {
    "react-native": "0.83.10",
    "expo": "~55.0.28",
    "@react-navigation/native": "…",
    "@react-navigation/bottom-tabs": "…",
    "@react-navigation/native-stack": "…",
    "@react-native-async-storage/async-storage": "2.2.0",
    "axios": "…",
    "expo-notifications": "…"
  }
}
```

**La raíz real (`App.js`) es un sándwich de proveedores — exactamente igual en concepto a `main.jsx`:**

```jsx
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

function Root() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </ThemeProvider>
  );
}
```

**Correspondencia web ↔ móvil que siempre hay que saber decir en voz alta:**

| Web (react + react-router)        | Móvil (expo + react-navigation)            |
|-----------------------------------|--------------------------------------------|
| `createRoot(...).render(<App/>)`  | `main: expo/AppEntry.js` → `export default App` |
| `<HashRouter>` + `<Routes>`       | `<NavigationContainer>` + `<Stack.Navigator>` + `<Tab.Navigator>` |
| `<Route path="/afiliados">`       | `<Tab.Screen name="Rutina">` / `<Stack.Screen name="Login">` |
| `localStorage` (síncrono)         | `AsyncStorage` (asíncrono)                 |
| `useNavigate()` → `navigate('/x')`| `useNavigation()` → `navigation.navigate('X')` |
| `ProtectedRoute` (portero de URL) | `if (loading)` / `if (token)` (portero de árbol) |

### 4.2 Los tres estados (y por qué el "flash of unauthenticated content" es imposible)

**PARA QUÉ:** el celular guarda la sesión en AsyncStorage, y **leer AsyncStorage toma tiempo**. Si la app dibujara los stacks antes de leer, un afiliado con sesión activa vería el Login (o la Landing) parpadear por un instante: el clásico **flash**. El AppNavigator lo resuelve poniendo la decisión en CADENA: primero `loading`, después se decide.

**El código REAL (`AppNavigator.js`) — la decisión en tres estados:**

```jsx
export default function AppNavigator() {
  const { token, loading } = useAuth();
  const { isDark } = useTheme();

  if (loading) {
    return <LoadingScreen />;        // ⏳ spinner mientras se lee AsyncStorage
  }

  return (
    <NavigationContainer key={isDark ? 'd' : 'l'}>
      {token ? (
        <RootStack />                // ✅ afiliado: tabs Perfil/Rutina/Dieta/Progreso
      ) : (
        <Stack.Navigator initialRouteName="Landing">
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RecuperarPassword" component={RecuperarPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
```

```
  ESTADO 0:  loading === true         →  spinner púrpura a pantalla completa
  ESTADO 1:  token === null           →  stack público (Landing → Login)
  ESTADO 2:  token === "JWT…"         →  RootStack + MainTabs (el afiliado operativo)
```

> **Pregunta de examen: "¿Por qué la app no muestra el Login directamente y ya?"**
> Porque si no hubiera un estado `loading`, un afiliado con sesión vería la pantalla de Login durante los ~50-200 ms que tarda AsyncStorage en responder, y después "saltaría" a sus tabs — un parpadeo feo y desorientador. El orden del `if` es la muralla: el árbol ni siquiera se construye hasta saber con qué stack arrancar; el loading hace de **telón bajado**.

**El detalle fino:** el `NavigationContainer` lleva una `key={isDark ? 'd' : 'l'}`. Cuando el usuario cambia el tema, esa key cambia, React **desmonta y remonta todo el árbol de navegación** y todas las pantallas releen la paleta ya aplicada por `ThemeContext` — sin manualmente invalidar estilos.

### 4.3 AuthContext móvil: async vs síncrono (el paraíso del instructor)

**El código REAL (`context/AuthContext.js`) — la restauración de sesión:**

```jsx
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        // multiGet: UNA sola consulta al storage nativo con ambas claves
        const [storedToken, storedUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
        if (storedToken[1] && storedUser[1]) {
          const parsed = JSON.parse(storedUser[1]);
          if (parsed?.role) {          // valida también que no sea basura corrupta
            setToken(storedToken[1]);
            setUser(parsed);
          }
        }
      } catch (_) {
      } finally {
        setLoading(false);             // pase lo que pase, libera el gate
      }
    };
    restoreSession();
  }, []);                              // deps vacías → se ejecuta UNA vez
```

**El login (`useCallback` memoizado para identidad estable):**

```jsx
const login = useCallback(async (correo, contrasena) => {
  const response = await loginRequest(correo, contrasena);
  const { accessToken, user: userData } = response.data;

  // multiSet: persiste token, user y role en UNA operación atómica
  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [USER_KEY, JSON.stringify(userData)],
    [ROLE_KEY, userData.role || ''],
  ]);

  setToken(accessToken);
  setUser(userData);
  return userData;
}, []);

const logout = useCallback(async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, ROLE_KEY]);
  setToken(null);
  setUser(null);           // → AppNavigator reacciona y vuelve a Landing/Login
}, []);
```

**Tabla de comparación web ↔ móvil (la pregunta estrella del instructor):**

| Aspecto | Web (AuthContext.jsx) | Móvil (AuthContext.js) |
|---------|----------------------|----------------------|
| Storage | `localStorage` **síncrono** | `AsyncStorage` **asíncrono** |
| ¿Necesita esperar para saber si hay sesión? | No → `isAuthReady` inicia en `true` | Sí → estado `loading` inicia en `true` y se libera en `finally` |
| Restauración | `useState(() => loadStoredUser())` (lectura directa) | `useEffect` + `restoreSession()` async |
| Inyección de token | Interceptor **síncrono** (lee localStorage directo) | Interceptor **async** (`await AsyncStorage.getItem`) |
| Detalle | `flushSync` para evitar el bucle de `/login` | El gate `loading` + `if (token)` hace el mismo trabajo |

### 4.4 Las bottom tabs: la barra del afiliado

**PARA QUÉ:** el afiliado vive adentro de 4 pestañas fijas en la parte de abajo: **Perfil, Rutina, Dieta, Progreso**. Como en la web los roles eligen vistas, aquí **TODOS los afiliados ven las mismas 4 pestañas** — la personalización está adentro (tu rutina, tu dieta), no en la navegación.

**El código REAL (`MainTabs` en AppNavigator.js):**

```jsx
const TAB_ICONS = {
  Perfil:   { focused: 'person',          unfocused: 'person-outline' },
  Rutina:   { focused: 'barbell',         unfocused: 'barbell-outline' },
  Dieta:    { focused: 'restaurant',      unfocused: 'restaurant-outline' },
  Progreso: { focused: 'stats-chart',     unfocused: 'stats-chart-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: COLORS.purpleLight,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.bgSecondary, … },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.focused : icons.unfocused} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Perfil" component={MiPerfilScreen} />
      <Tab.Screen name="Rutina" component={MiRutinaScreen} />
      <Tab.Screen name="Dieta" component={MiDietaScreen} />
      <Tab.Screen name="Progreso" component={MiProgresoScreen} />
    </Tab.Navigator>
  );
}
```

**Arriba de las tabs hay un `RootStack`** con pantallas full-screen que se abren **encima** de la barra: `RegistroEjercicio`, `RegistroConsumo` y `EditarPerfil`. Ese es el equivalente móvil de "una ruta anidada" en la web: la pestaña sigue viva abajo, pero la pantalla la cubre.

### 4.5 El patrón de pantalla: `MiRutinaScreen` (el afiliado viendo su plan)

**PARA QUÉ:** es la pantalla que "le da vida" a la arquitectura completa: el entrenador cargó una rutina desde la web → el backend la guardó → el afiliado la lee acá. Muestra cards-expandibles por día con la barra de progreso de completado, serie de ejercicios con datos técnicos, notas y un botón flotante de "Guardar Progreso".

**Qué endpoints consume (todo bajo `/me`, la garantía de que es SU rutina y no la de otro):**

```js
getMisCiclos()               → GET /afiliados/me/ciclos
getPlanEntrenamiento(id)     → GET /planes/entrenamiento/:id_ciclo
getPlanRutinaDia(ciclo, n)   → GET /afiliados/me/rutina-dia/:id_ciclo/:dia
getProgresoEjercicioHoy()    → GET /afiliados/me/progreso-ejercicio/:id_ciclo/:fecha
getMisNotasEjercicio(ciclo)  → GET /afiliados/me/notas-ejercicio
guardarProgresoEjercicio()   → POST /afiliados/me/progreso-ejercicio
guardarNotaEjercicio()       → POST /afiliados/me/notas-ejercicio
```

**El flujo de carga ("una pantalla = una mini-máquina de estados"):**

```text
  montaje de MiRutinaScreen
      │
      ▼
  1) getMisCiclos()          → lista de ciclos del afiliado
      │
      ▼
  2) seleccionarCicloActivo() → elige el ciclo activo (o el primero disponible)
      │
      ▼
  3) getPlanEntrenamiento(id_ciclo) → el plan con RUTINAS (días)
      │
      ▼
  4) getPlanRutinaDia(ciclo, diaNumero) → ejercicios del DÍA (grupo muscular)
      │
      ▼
  5) getProgresoEjercicioHoy + getMisNotasEjercicio → lo ya marcado/hoy y las notas
      │
      ▼
  render: cards por día + chips de grupo muscular + RefreshControl
```

```jsx
// El esqueleto REAL del estado de la pantalla
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [ciclos, setCiclos] = useState([]);
const [cicloActivo, setCicloActivo] = useState(null);
const [plansByCiclo, setPlansByCiclo] = useState({});   // {id: planEntrenamiento}
const [completados, setCompletados] = useState({});
```

**La card expandible con animación nativa (Animated.timing, 250 ms):**

```jsx
const anim = useRef(new Animated.Value(0)).current;
useEffect(() => {
  Animated.timing(anim, {
    toValue: expandido ? 1 : 0,
    duration: 250,
    useNativeDriver: false,
  }).start();
}, [expandido]);

// Altura calculada desde la lista real de ejercicios (se expande sin saltos)
const contentHeight = ejercicios.reduce(
  (h, ej) => h + EJERCICIO_ROW_H + (detalleEjercicio === ej.id_ejercicio ? INSTRUCCIONES_H : 0) + NOTA_H,
  0
);
```

**La barra de progreso del DÍA se calcula en el momento:** `completadosCount / total`. Esto quiere decir que la pantalla NO le pregunta al servidor "¿cuánto llevás realizado?" en cada toggle: **el estado vive en el celular** y se persiste con el botón "Guardar Progreso".

**Los tres estados de toda pantalla móvil (misma tríada que en la web):**
- `loading` → spinner púrpura centrado.
- `error` → "No tenés un ciclo asignado." / "Error al cargar la rutina." (con icono).
- `vacío` → "No hay ejercicios en tu plan actual."

### 4.6 Seguridad: los `/afiliados/me/*` y `req.user.sub`

**PARA QUÉ:** la app móvil JAMÁS pregunta "dame el afiliado con id 37" como hace la web (que pide `GET /afiliados/:id` con rol staff). El móvil siempre pide "**dame el MÍO**" con la palabra mágica `me`. Esa palabra la interpreta el backend sustituyéndola por el `sub` del JWT — el afiliado no puede elegir de quién pedir datos.

```text
  MÓVIL                                      BACKEND
  GET /afiliados/me            ────────►     requireAuth lee el JWT
                                              req.user = { sub: 42, role: 'Afiliado' }
       ◄──────────────────────  se resuelve "me" = 42 (el sub)
       JSON con SU perfil              y se consulta SOLO la fila 42
```

**Por qué esto elimina los IDOR:** en una API insegura, el afiliado podría probar `GET /afiliados/37`, `GET /afiliados/38`… y leer los perfiles de otros socios. Acá no hay a dónde apuntar: el path NO contiene ningún número, contiene la palabra `me`, y el parámetro real sale del token firmado, que no se puede alterar. Ciertas rutas del ciclo (p. ej. consultar un plan) van por id, pero el backend las protege con `requireOwnCiclo` (Parte 2.4): si el ciclo no es de tu `sub`, `403`.

**Comparativa de endpoints (vale la pena tenerla en el cuaderno):**

| Web (staff)                      | Móvil (afiliado)                   |
|----------------------------------|------------------------------------|
| `GET /afiliados` (lista completa) | `GET /afiliados/me` (solo mi perfil) |
| `GET /afiliados/:id/ciclos`      | `GET /afiliados/me/ciclos`          |
| `POST /afiliados/progreso`       | `POST /afiliados/me/progreso-ejercicio` |
| `PATCH /afiliados/:id`           | `PATCH /afiliados/me`               |

### 4.7 El interceptor móvil: async vs síncrono (el mismo portero, otro bolsillo)

**El código REAL (`services/api.js` móvil):** fíjense que el request interceptor es `async` porque **lee de AsyncStorage**, y que la URL base NO es localhost sino el backend desplegado, porque la app corre en un dispositivo físico:

```js
const TOKEN_KEY = 'metafit_token';
const USER_KEY  = 'metafit_user';
const ROLE_KEY  = 'metafit_role';

// Backend desplegado (Render) — el móvil NO usa localhost:
// la app corre en un dispositivo/emulador, no en el computador del backend.
const API_URL = 'https://metafit-backend-rr18.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor de REQUEST (async) ──
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (_) {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor de RESPONSE (401 global, salvo /login) ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || '';
    if (error.response?.status === 401 && !requestUrl.includes('/login')) {
      try { await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, ROLE_KEY]); } catch (_) {}
    }
    return Promise.reject(error);
  }
);
```

**La misma política que la web, traducida al mundo async:**
- Un `401` en rutas autenticadas → limpia la sesión local → `AppNavigator` ve `token === null` y **solo por eso** vuelve al Login (no hay `window.location.href`: no existe ventana).
- Un `401` en `/login` → **no limpia nada** (significa "credenciales incorrectas", no sesión vencida).
- Las **mismas claves** de sesión que en la web (`metafit_token/user/role`), guardadas en otro bolsillo: `AsyncStorage` en vez de `localStorage`.

### 4.8 `theme.js`: el espejo de la marca web

**PARA QUÉ:** el celular no comparte el CSS de la web (cada tecnología usa su propio lenguaje de estilos). Para que la marca se sienta identica, se mantuvo un archivo `theme.js` móvil cuyos tokens son **el espejo** de las variables CSS `--mf-*` de `frontend_web/src/index.css`.

**El código REAL (extracto de `movil/src/theme.js`):**

```js
export const COLORS = {
  bg: '#0a0a0f',                 // fondo general (igual al --mf-* oscuro web)
  bgSecondary: '#12121e',
  bgCard: '#1a1a2e',
  text: '#ffffff',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.08)',
  red: '#e31c25',                // el rojo de marca (logo, CTAs)
  redDark: '#b71c1c',
  redGlow: 'rgba(227,28,37,0.3)',
  purple: '#7c3aed',             // morado: identidad "admin/afiliado"
  purpleLight: '#a78bfa',
  check: '#10b981', waterLight: 'rgba(59,130,246,0.15)', // semáforos
};
```

**Y la magia del tema claro — `ThemeContext.jsx`:**

```jsx
export function swapPalette(isDark) {
  // Muta COLORS EN EL LUGAR: todos los consumidores comparten la misma
  // referencia y la leen en cada render. Oscuro → no cambia nada (default);
  // claro → Object.assign pisa solo las superficies/textos/bordes.
  Object.assign(COLORS, isDark ? {} : LIGHT_PALETTE);
}
```

**Correspondencia con la web (para decirlo en el examen):**

| Web                                | Móvil                              |
|------------------------------------|-------------------------------------|
| `:root[data-theme="dark"]` y variables `--mf-bg` en `index.css` |  `COLORS` en `src/theme.js` |
| `initTheme()` + `applyTheme()` en `utils/theme.js`, persiste con `metafit_theme` | `ThemeContext` + `swapPalette`, persiste con `metafit_theme_movil` |
| `localStorage` | `AsyncStorage` |
| Los CDN estilos se cargan vía CSS | Los estilos llegan por JS (StyleSheet / inline) |

---

### 4.9 Profundización: `cicloUtils` — el "cerebro" que decide cuál es TU ciclo

**PARA QUÉ:** un afiliado puede tener muchos ciclos (históricos y el activo). ¿Cómo sabe la app móvil cuál mostrar en "Mi Rutina", "Mi Dieta", "Mi Progreso"? Lo decide una utilidad compartida (`movil/src/utils/cicloUtils.js`, código REAL completo, 19 líneas):

```js
// Se espera el contrato real de GET /afiliados/me/ciclos:
//   array de ciclos con: id_ciclo, activo (0|1), objetivo_fisico,
//   disponibilidad_dias, fecha_inicio, fecha_fin, numero_ciclo, ...
export const seleccionarCicloActivo = (ciclos) => {
  if (!Array.isArray(ciclos) || ciclos.length === 0) return null;
  return ciclos.find((c) => Number(c.activo) === 1) || ciclos[0] || null;
};

export const esCicloActivo = (ciclo) => Number(ciclo?.activo) === 1;

export const formatearFecha = (fecha) =>
  fecha ? String(fecha).slice(0, 10) : '-';
```

**Las tres decisiones importantes:**
1. **No asume que `data[0]` es el activo** — busca explícitamente `activo === 1`. El comentario del archivo lo aclara: "No asume que data[0] es el activo". Eso evita el bug clásico de ordenar mal la respuesta.
2. **`Number(c.activo) === 1`** — el backend devuelve `activo` como `"1"` o `1`, y con `Number()` se compara siempre como número. Defensa contra tipos flotantes.
3. **`formatearFecha` recorta con `slice(0,10)`** — la fecha ISO `"2024-07-01T00:00:00.000Z"` se vuelve `"2024-07-01"` para las tarjetas (sin depender del `TimeZone` del teléfono).

**Dato de máster para el instructor:** esta función vive en `utils/` porque la usan **tres pantallas** (Rutina, Dieta y Progreso). Si estuviera copiada en cada una, arreglar un bug de selección de ciclo implicaría tocarla tres veces. **Una sola fuente de verdad** en código reutilizable.

### 4.10 Profundización: el mapa completo de contratos `/me` (lo que la app le pide al backend)

**PARA QUÉ:** con los endpoints verificados del proyecto, la parte 4.6 mostró el patrón. Ahora el inventario completo para que puedan responder "¿qué le pide la app y qué le responde la API?" de memoria.

| Servicio móvil | Endpoint REAL | Verbo | Qué hace |
|---|---|---|---|
| `services/api.js` interceptor | (base) | — | inyecta `Authorization: Bearer <token>` con axios |
| `perfilService.js` | `/afiliados/me` | GET | trae mi perfil completo |
| `perfilService.js` | `/afiliados/me` | PATCH | actualiza peso/talla/teléfono/correo; recalcula IMC |
| `perfilService.js` | `/afiliados/me/ciclos` | GET | lista mis ciclos (con `numero_ciclo`) |
| `perfilService.js` | `/afiliados/me/restricciones` | GET | mis restricciones médicas (para filtrar catálogos) |
| `registroService.js` | `/afiliados/me/registro-ejercicio` | POST | guarda ejercicio realizado (series, reps, peso) |
| `registroService.js` | `/afiliados/me/consumo-alimento-real` | POST | guarda alimento consumido y calorías |
| `registroService.js` | historial… | GET | trae el historial del día (agua, energía, comida) |
| `screens/MiRutinaScreen` | `/afiliados/me/ciclos` + rutina | GET | pinta la rutina del ciclo activo |

**Cómo se ve la llamada real del PATCH de perfil (contrato de `perfilService`):**

```js
// PATCH /afiliados/me  → body: { peso, talla, telefono, correo }
// El backend válida rangos: peso 20–300 kg y estatura 1–300 cm
async function actualizarPerfil(datos) {
  return api.patch('/afiliados/me', datos);
}
```

**Cómo se relacionan con lo ya visto:**
- **`req.user.sub`** (parte 4.6) hace que `/afiliados/me` sepa **de quién** habla sin mandar un id: el token manda.
- **`/afiliados/me/ciclos`** alimenta a `cicloUtils.seleccionarCicloActivo` (parte 4.9).
- La **clave `metafit_token`** en AsyncStorage es la que el interceptor lee para armar el `Bearer`.

### 4.11 Profundización: dónde "viven" estos registros en la base de datos

**PARA QUÉ:** cuando el afiliado marca que bebió agua o completó su entrenamiento, ¿adónde va a parar? A las tablas nuevas de la fase móvil, creadas en `02_migracion_movil.sql` y `03_mejoras_estructura.sql` (esquema REAL):

```sql
-- 02_migracion_movil.sql: la "hoja de vida" diaria simple
CREATE TABLE IF NOT EXISTS PROGRESO_EJERCICIO_DIARIO (
  id_progreso INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL,
  id_ciclo    INT NULL,
  id_ejercicio INT NOT NULL,
  fecha       DATE NOT NULL,
  FOREIGN KEY (id_usuario)  REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS REGISTRO_AGUA (
  id_registro INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL,
  fecha       DATE NOT NULL,
  vasos       TINYINT NOT NULL DEFAULT 0 CHECK (vasos BETWEEN 0 AND 50),
  FOREIGN KEY (id_usuario) REFERENCES USUARIO(id_usuario) ON DELETE CASCADE
);
```

```sql
-- 03_mejoras_estructura.sql: registro "técnico" real del entrenamiento
CREATE TABLE IF NOT EXISTS REGISTRO_EJERCICIO (
  id_registro        INT AUTO_INCREMENT PRIMARY KEY,
  serie              TINYINT NOT NULL DEFAULT 1,
  repeticiones       INT          NULL CHECK (repeticiones >= 1),
  peso_utilizado_kg  DECIMAL(5,2) NULL CHECK (peso_utilizado_kg IS NULL OR peso_utilizado_kg > 0),
  fecha_registro     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario)  REFERENCES USUARIO(id_usuario),
  FOREIGN KEY (id_ciclo)    REFERENCES CICLO(id_ciclo),
  FOREIGN KEY (id_rutina, orden) REFERENCES RUTINA(id_rutina),  -- (otra FK aparte)
  FOREIGN KEY (id_ejercicio) REFERENCES EJERCICIO(id_ejercicio)
);
```

**Por qué dos familias de tablas:** la fase web/seed usaba `PROGRESO_EJERCICIO_DIARIO` (resumen diario) y la fase móvil sumó `REGISTRO_EJERCICIO` (detalle por serie con peso efectivo). Es el puente histórico del proyecto: **cada cliente aportó sus tablas y la migración las unificó** — y en el examen pueden marcar el dato de que `03_mejoras_estructura.sql` también agrega las columnas nuevas de `AFILIADO` (`objetivo_fisico`, `nivel_experiencia`, `disponibilidad_semanal_dias`) con `ALTER TABLE … ADD COLUMN … AFTER`.

---

### 4.12 Profundización: el mapa completo de pantallas de la app (screens reales)

**PARA QUÉ:** para responder "¿cuántas pantallas tiene la app y qué hace cada una?" basta con el inventario real de `movil/src/screens/` — cada archivo es una pantalla, y su conversación con la API ya la mapeamos en la parte 4.10.

```text
movil/src/screens/
├── LandingScreen.js          # pantalla de bienvenida (sin sesión) — "explora la app"
├── LoginScreen.js            # ingreso con correo + contraseña → POST /auth/login
├── RecuperarPasswordScreen.js# "olvidé mi contraseña" → POST /auth/recuperar-password
├── MiPerfilScreen.js         # mis datos + PATCH /afiliados/me (peso, talla, correo)
├── MiRutinaScreen.js         # la rutina del ciclo activo (parte 4.5)
├── MiDietaScreen.js          # plan nutricional + filtrado por restricciones
└── MiProgresoScreen.js       # progreso físico y evolución (peso, IMC)
```

**Cómo se enlaza cada pantalla con lo demás del manual:**

| Pantalla | Autenticación | Datos que pide | Mecanismo clave |
|---|---|---|---|
| Landing | No | — (estática) | se muestra cuando no hay token en `AppNavigator` |
| Login | No | correo + contraseña | guarda el trio `metafit_token/user/role` en AsyncStorage |
| RecuperarPassword | No | correo | `recuperarLimiter` en el backend (parte 2.4) |
| MiPerfil | token | `GET /afiliados/me`, `PATCH /afiliados/me` | el IMC lo recalcula el backend |
| MiRutina | token | `GET /afiliados/me/ciclos` + plan | `seleccionarCicloActivo` (4.9) |
| MiDieta | token | plan nutricional + `alimentos-disponibles` | filtros por `restricciones` |
| MiProgreso | token | historial de progreso | tabla `PROGRESO_FISICO` (1.5) |

**El detalle que demuestra el diseño en espejo:** la pantalla de Perfil muestra el correo que también edita la web; la pantalla de Rutina muestra exactamente lo que `RutinasView` creó en el panel. Ambos clientes **leen y escriben la misma base**, por eso el flujo de la parte 5 funciona: no hay duplicado de datos, hay **una sola fuente de verdad** (MySQL) y dos interfaces para hablarle.

---

### Resumen — Parte 4 (5 ideas que deben poder recitar rápido)

1. La app es **Expo/React Native** con entrada en `package.json` → `App.js` (sándwich de `ThemeProvider` → `AuthProvider` → `Root`); no existe HTML.
2. Tiene **3 estados de navegación**: `loading` (spinner, evita el flash) → `token` (tabs) → sin token (Landing/Login). La condición `if (loading)` es el portero.
3. **AuthContext es async** (`AsyncStorage.multiGet` y estado `loading`) porque el storage móvil no es síncrono — la diferencia conceptual con la web que más le gusta preguntar al instructor.
4. **Todas las rutas son `/afiliados/me/*`**: el `me` se resuelve contra el `sub` del JWT; no hay IDs a mano para probar (anti-IDOR de diseño), y las rutas por id de ciclo llevan `requireOwnCiclo`.
5. **`theme.js` es el espejo de la marca web**, y `swapPalette` muta `COLORS` en el lugar para aplicar el modo claro sin invalidar estilos.

### Cómo explicárselo al instructor en 2 minutos (Parte 4)

"La app es el carné del socio y corre en el celular, no en el navegador. Al abrirla, baja la cortina (loading) mientras lee la memoria local del teléfono — que es asíncrona, como preguntarle a un cajero que tarda medio segundo —. Recién cuando el cajero responde decide: si dice 'tenés carné' monta las 4 pestañas (Perfil, Rutina, Dieta, Progreso); si dice 'no tenés', monta la puerta de entrada (Login). Esa cortina evita que un socio con carné vea parpadear la pantalla de Login. Después, cada pantalla —como MiRutina— sigue el mismo baile de la web: pedir al servidor (siempre con la palabra 'me', que el backend convierte en 'el dueño del token'), pintar en tres estados (cargando/error/vacío), y guardar lo que haga el socio. Y la marca se ve idéntica a la web porque el celular se copió los colores de la web en un archivo espejo."

---

---

## PARTE 5. LA COMUNICACIÓN ENTRE CAPAS

**La analogía que rige la Parte 5:** todo el sistema es un **maletín único con tres mensajeros**. Los tres mensajeros (web staff, app del afiliado, scripts/Postman) no se conocen entre sí; cada uno le entrega su sobre al único destinatario (el backend), que lee el sobre, consulta la bodega (MySQL) y devuelve otro sobre. En esta parte vemos el sobre: **qué dice exactamente, quién lo firma y cómo viaja**.

### 5.1 El flujo completo del negocio: el entrenador asigna una rutina → el afiliado la ve

Este es el flujo que "resume el proyecto entero" y el que más le va a gustar dibujar al instructor. Vamos a seguirlo de punta a punta con los endpoints REALES:

```text
 ┌─── WEB (Entrenador) ──────────────────────────────────────────────────┐
 │  1. RutinasView carga: authAxios.get("/afiliados")                    │
 │        → elige un afiliado y arma el ciclo + plan                      │
 │  2. crea el ciclo:               POST /afiliados/ciclos   (CICLO)      │
 │  3. crea el plan entrenamiento:  POST /planes/entrenamiento           │
 │  4. crea cada rutina del día:    POST /planes/rutinas   (RUTINA +     │
 │                                   RUTINA_EJERCICIO: ejercicios,       │
 │                                   series, reps, descanso)             │
 └──────────────┬────────────────────────────────────────────────────────┘
                ▼
        BACKEND (cada POST pasa por requireAuth + requireAdminOrEntrenador)
                ▼
        MySQL: CICLO (activo=1) → PLAN_ENTRENAMIENTO → RUTINA (dia 1..n)
        ────────────────────────→ RUTINA_EJERCICIO → EJERCICIO (catálogo)
                ▼
 ┌─── MÓVIL (Afiliado) ──────────────────────────────────────────────────┐
 │  5. MiRutinaScreen (tab Rutina) hace:                                 │
 │        getMisCiclos()          → GET  /afiliados/me/ciclos            │
 │        getPlanEntrenamiento(c) → GET  /planes/entrenamiento/:id_ciclo │
 │        → arma las cards por día (RUTINA.dia_numero + ejercicios)      │
 │  6. el afiliado marca completado y pulsa "Guardar Progreso":          │
 │        POST /afiliados/me/progreso-ejercicio                          │
 │        (id_ciclo, fecha, ejercicios)  → tras el login requireAuth      │
 └────────────────────────────────────────────────────────────────────────┘
```

**Los dos momentos clave que hay que saber explicar:**

1. **El "qué" y el "quién" se separan.** La estructura de la rutina (días, ejercicios, series) la escribe el staff; el dato personal (qué marcó el afiliado cada día) lo escribe el afiliado. La BD guarda ambos, y la pantalla móvil une: por un lado el plan (cols `series/repeticiones/dia_numero`) y por el otro el registro del día (`PROGRESO_EJERCICIO`).
2. **La autenticación es invisible en el móvil**: el interceptor async adjunta el token desde AsyncStorage sin que `MiRutinaScreen` sepa siquiera que existe. Y por el lado de la web, el interceptor sincrono lo extrae del `localStorage`. Los dos sobres llegan **firmados** pero por mensajeros distintos.

### 5.2 Los clientes son iguales: todos son HTTP + JSON

**PARA QUÉ:** el instructor suele pensar "el sistema son dos apps", pero bajo el capó las tres caras consumen la **misma API**. Lo que cambia es la interfaz (React pinta tablas; React Native pinta cards; Postman pinta JSON crudo). La prueba: la misma llamada funciona con un `curl`:

```bash
# El MINSMO POST /login que usan la web y el móvil
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sede80.com","password":"su-clave"}'
# → responde { "accessToken": "eyJ…", "user": { "id": 1, "role": "Administrador", … } }
```

```bash
# Con ese accessToken, "mi perfil" sirve igual en el móvil y en curl:
curl http://localhost:3001/afiliados/me \
  -H "Authorization: Bearer eyJ…"
```

**Consecuencia elegante:** si un cliente nuevo aparece mañana (una app de escritorio, un kiosco, un bot de WhatsApp), se conecta a la MISMA API y obtiene los MISMO datos. No se toca el backend, solo se escriben pantallas nuevas contra el mismo contrato (la spec se auto-documenta en `/api-docs` vía Swagger, con `persistAuthorization: true` para probar endpoints autenticados sin re-login).

### 5.3 CORS: por qué existe (y por qué el móvil no lo sufre)

**PARA QUÉ:** el navegador impone una regla llamada **mismo origen**: una página servida en `http://localhost:5173` NO puede leer la respuesta de `http://localhost:3001` a menos que el servidor de destino lo permita explícitamente. Esa regla evita que un sitio malicioso use tu navegador para golpear a otros servidores con tu sesión. El permiso se negocia con el **control CORS**.

```text
  NAVEGADOR (web staff)                                   BACKEND Express
  página en localhost:5173
      │  GET /afiliados (Origin: http://localhost:5173)
      ▼
      │  ─────────────►  CORS middleware pregunta:
      │                  ¿"origin" está en la whitelist?  → sí (5173) → agrega el
      │                  header Access-Control-Allow-Origin y deja pasar.
      │  ◄─────────────
```

**El código REAL de `server.js` (la lista de invitados):**

```js
const DEFAULT_CORS_ORIGIN = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:8081',   // Expo (dev)
  'http://localhost:3001',
  'https://metafit-frontend-78x6.onrender.com',   // producción
].join(',');

app.use(cors({
  origin(origin, callback) {
    // Requests SIN Origin → siempre pasan (móvil, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = corsOrigins();
    if (allowed.includes('*') || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS no permitido para este origen'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

**Por qué el móvil no sufre CORS:** CORS es una regla del **navegador**, no del servidor. React Native no tiene navegador: hace sus peticiones HTTP directas con axios y por eso **no envía el header `Origin`**. El propio código lo contempla: `if (!origin) return callback(null, true);`. De hecho, ni siquiera habría preflight `OPTIONS` porque no hay navegador interceptando. La app móvil y Postman son "mensajeros sin navegador": no les aplica la regla de mismo origen.

### 5.4 El JWT: el pasaporte que funciona en los tres clientes

**PARA QUÉ:** con 3 clientes y state-less, el servidor necesita confirmar la identidad sin guardar sesiones en memoria. La solución es que el **cliente** lleve encima un documento firmado por el servidor (el JWT) en cada petición.

```text
                  ┌──────────── EMAIL+GLOBAL = JWT ────────────┐
                  │                                            │
  WEB (staff) ────┤   header  │  payload  │  firma            ├──► BACKEND
  MÓVIL (afiliado)├── Authorization: Bearer eyJ.eyJ.sig ─────▶│   requireAuth:
  curl / Postman ─┤                                            │   jwt.verify(sig)
                  └────────────────────────────────────────────┘
                                                                    │
      · sub (id_usuario) · email · role · iat · exp (8h)           │
      · firma = HMAC con JWT_SECRET (sin fallback: BUG-009)        │
                                                                    ▼
      requireAuth adjunta req.user → requireStaff/requireAdmin/… deciden el rol
      sin consultar la BD; requireOwnCiclo consulta SOLO la propiedad del recurso
```

**Propiedades que hay que poder nombrar (todo ya visto en la Parte 2):**

1. **State-less**: el servidor no guarda nada de sesión; cada request se verifica solo con la firma → balancea y escala horizontal.
2. **Expira**: `8h`; si filtras un token, la ventana de daño es acotada.
3. **Está firmado, no cifrado**: cualquier cliente puede *leer* el payload (no lleven secretos ahí), pero nadie puede *alterarlo* sin conocer `JWT_SECRET`.
4. **El rol viaja adentro**: multiplica de velocidad porque los guardias de rol no hacen SQL por request.
5. **La propiedad no viaja adentro**: de ahí el `requireOwnCiclo`, que sí consulta la BD.

**El contrato entre los 3 clientes (una línea para el cuaderno):**

> "Todos los clientes hablan **HTTP + JSON**, se identifican con `Authorization: Bearer <JWT>` y entienden los mismos códigos de error: `401` = mi token no sirve (o credenciales inválidas), `403` = mi rol no tiene permiso, `400` = envié datos mal formados, `415` = olvidé poner `Content-Type: application/json`."

---

### 5.5 Profundización: trazabilidad punta a punta — un request "vuelto realidad"

**PARA QUÉ:** toda la teoría (JWT, middlewares, controladores, modelos) se entiende al 100% cuando reproducen la ruta completa a mano. Aquí tienen el guion real para simularlo con `curl` o con la pestaña de pruebas del panel (o Swagger en `/api-docs`).

**Paso 1 — login (el post que ya conocen del 2.2):**

```bash
curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"correo":"maria@metafit.com","contrasena":"Maria123!"}'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "usuario": { "id_usuario": 4, "nombres": "María", "rol": "Recepcionista" }
}
```

**Paso 2 — ¿qué contiene ese token? (decodifíquenlo en jwt.io):**

```json
{
  "sub": 4,
  "rol": "Recepcionista",
  "iat": 1750000000,
  "exp": 1750028800
}
```
Reconocen: el `sub` (quién soy), el `rol` (cómo me autorizan) y `exp` (8 horas después). El frontend guarda `metafit_token`.

**Paso 3 — usar el token como pasaporte:**

```bash
curl -X GET http://localhost:3001/api/afiliados?page=1&limit=50 \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

Ahí ocurrió: `requireAuth` decodifica el JWT → `requireStaff` confirma `Recepcionista` (staff) → `AfiliadoController.getAll` → `AfiliadoService.getAll({page, limit})` → 4 queries planas (sin N+1) → 200 con el arreglo.

**Paso 4 — si el rol no tiene permiso (prueba con el token de un afiliado):**

```json
{ "error": "Permiso denegado" }
```
`requireStaff` lo devolvió antes de tocar el controlador → **401/403 al inicio de la cadena, cero consultas desperdiciadas**.

**El "mapa mental" para el examen:** cada request pasa por la misma secuencia de 4 puertas — puerta 1 `requireAuth`, puerta 2 middleware de rol, puerta 3 controlador (HTTP), puerta 4 modelo (SQL). Ese patrón se repite en las ~40 rutas de la API.

### 5.6 Profundización: los efectos asíncronos que desacoplan el sistema

**PARA QUÉ:** el sistema no solo responde requests; también dispara trabajos que **no deben retrasar la respuesta** (correo de bienvenida, notificaciones, webhooks). Ese desacople es una decisión de arquitectura rápida de defender.

**El mapa completo de "chispas" asíncronas:**

```text
   ALTA DE AFILIADO (POST /afiliados)
        │
        ├─(async, no bloquea)──> bienvenidaService.enviarCorreoBienvenida(detalle, pass)
        │                              (correo de bienvenida al afiliado)
        └─(async, no bloquea)──> n8nWebhookService.notificarNuevoAfiliado(detalle, pass)
                                       │
                                       ├─> Telegram (grupo del equipo)
                                       └─> Google Sheets (hoja de registro)
```

**Por qué es importante que sé qué sí y qué no:**
- **NO bloquea:** el `create` responde `201` apenas inserta. Verificado en 2.9 (código REAL).
- **SI loguea:** cada `.catch((err) => console.error(...))` registra el fallo sin romper la respuesta.
- **Reintentos:** si el correo falla, existe el flujo de recordatorio de bienvenida (los servicios de correo se reintentan con pequeñas pausas), así el afiliado nunca se queda "sin aviso".

**Conexión con Docker (parte 1.3):** el contenedor `n8n` es literalmente el trabajador de estas "chispas". La app le dispara a su webhook; la automatización reenvía a Telegram/Sheets. Es el porqué de que `docker-compose.yml` tenga a n8n en el mapa.

---

### Resumen — Parte 5 (5 ideas que deben poder recitar rápido)

1. El flujo rey del negocio: **web del entrenador crea CICLO → PLAN → RUTINAS** ; **móvil del afiliado lee** `GET /afiliados/me/ciclos` y `GET /planes/entrenamiento/:id`; y el registro del día vuelve con `POST /afiliados/me/progreso-ejercicio`.
2. Los 3 clientes son **funcionalmente idénticos** (HTTP + JSON contra la misma API); `curl` lo demuestra con dos llamadas.
3. **CORS** es una regla de navegadores: solo la web sufre preflight/Origin; el móvil y curl pasan por el atajo `if (!origin)`.
4. El **JWT** viaja igual en los 3 clientes; su rol vive en el payload (rápido), su propiedad de recursos se consulta en la BD (seguro).
5. Los códigos HTTP (`400/401/403/415/500`) son el "idioma" común del contrato cliente ↔ servidor.

---

## PARTE 6. GUÍA PARA EL INSTRUCTOR: 12 PREGUNTAS CON RESPUESTA

Cada respuesta está escrita **en primera persona**, como la diría un estudiante que de verdad entendió el sistema. Son 3 a 5 oraciones: alcanzan para contestar la pregunta central y mostrar que se sabe el porqué.

---

### 6.1 — "¿Qué pasa exactamente dentro del backend cuando alguien inicia sesión?"

"El pedido entra por la ruta `/login`, que primero pasa el rate limiter (10 intentos por IP cada 15 minutos). El controller valida que el correo tenga formato válido y que la contraseña no supere los 72 bytes que bcrypt puede procesar. Después busca al usuario por correo; si no existe o la contraseña no coincide, responde el mismo 401 genérico para no facilitar enumeración. Si la cuenta está Activa, compara la contraseña con bcrypt y, si coincide, firma un JWT con `{sub, email, role}` válido por 8 horas y lo devuelve junto con los datos del usuario. Ese JWT es lo que la web o la app guardan y reenvían en cada petición."

### 6.2 — "¿Por qué no se puede 'desencriptar' una contraseña guardada?"

"Porque no está encriptada: está **hasheada**, y un hash es una operación de un solo sentido — como una licuadora, no como una caja con llave. Además, con bcrypt, cada hash usa una sal aleatoria y se calcula 2¹² veces (12 rondas), así que dos afiliados con la misma contraseña tienen hashes distintos y un atacante con GPU no puede acelerar la prueba. Por eso cuando un usuario olvida la contraseña no se le 'devuelve' la original: se le genera un token de 15 minutos para elegir una nueva, que se guarda hasheada de nuevo. Y por eso rechazamos contraseñas de más de 72 bytes antes de hashearlas, porque bcrypt trunca y dos contraseñas distintas compartirían el hash."

### 6.3 — "¿Cómo sabe el servidor quién soy en cada petición sin preguntarle a la base de datos?"

"El servidor no guarda sesiones en memoria: me confirma con el **JWT** que yo llevo en el header `Authorization: Bearer`. Ese token está firmado con el secreto del sistema; cuando `requireAuth` lo verifica, extrae de su payload mi id, mi correo y mi rol. Como el rol viaja firmado dentro del token, los guardias de autorización (`requireStaff`, `requireAdmin`, etc.) deciden sin consultar MySQL. La excepción es la propiedad de un recurso, como un ciclo: ahí sí se consulta la base de datos, porque el hecho de que un ciclo me pertenezca no está en el token, y lo comprueba `requireOwnCiclo`."

### 6.4 — "¿Qué pasa si un Entrenador abre `/dashboard`? ¿Y si una Recepcionista abre `/rutinas`?"

"En ambos casos la web los intercepta con `ProtectedRoute`. Esa ruta tiene una lista de roles permitidos: `/dashboard` solo deja pasar a `Administrador`, y `/rutinas` solo a `Administrador` y `Entrenador`. Si el Entrenador llega a `/dashboard`, pasa las fases de sesión pero en la fase de rol el `ROLE_HOME["Entrenador"]` lo redirige a su home, `/rutinas`. Igual con una recepcionista en `/rutinas`: fuera, a su home `/afiliados`. Y aunque alguien forzara la navegación o llamara a la API directamente, el backend tiene el mismo control con los middlewares por rol y respondería 403, porque la seguridad real está en el servidor y la web solo es una copia de la misma política."

### 6.5 — "El `home` de cada rol en la web y la app móvil se deciden distinto, ¿por qué?"

"Porque una usa urls y la otra usa stacks. La web decide con un guardia de rutas: `ProtectedRoute` evalúa el token, el usuario y el rol sobre el camino `/…` que se escribió, igual que un portero que lee la invitación. La app móvil decide con un condicional de árbol en `AppNavigator`: primero espera el `loading` (para no mostrar Login por un instante), y recién después, si hay token monta las 4 pestañas, y si no, monta la Landing/Login. Son las dos caras del mismo portero: en la web, la decisión depende del *path*; en el móvil, del *árbol de pantallas*."

### 6.6 — "¿Qué es el pool de conexiones y por qué no tenemos una sola conexión a MySQL?"

"Porque Express atiende muchas peticiones al mismo tiempo y una sola conexión las serializaría: cada query tendría que esperar a la anterior. El pool es una flota de 10 conexiones vivas que se prestan y se devuelven; mysql2 reutiliza las libres y crea nuevas si hace falta. Si llegan más pedidos que taxis, `waitForConnections: true` y `queueLimit: 0` los ponen en cola en vez de responder 500. Además, tener un número acotado (10) evita que MySQL se llene de conexiones inactivas consumiendo memoria."

### 6.7 — "¿Por qué la web necesita CORS y la app móvil no?"

"Porque CORS es una regla de los **navegadores**, no del servidor. El navegador, al ver una página de `localhost:5173` llamando a `localhost:3001`, exige que el backend declare ese origen como permitido; el middleware lo hace contra una whitelist. Una app React Native no pasa por un navegador: sus requests van directo por HTTP sin el header `Origin`, y por eso el propio código del backend acepta los pedidos sin Origin con `if (!origin) return callback(null, true)`. El costo de esa decisión es que la whitelist tiene que listar los orígenes web conocidos (los puertos de Vite en dev y el dominio Render en producción)."

### 6.8 — "¿Dónde se usan transacciones y qué pasaría si no existieran?"

"En toda operación que toca más de una tabla y debe ser todo-o-nada. Tres casos del proyecto: crear un afiliado (inserta en `USUARIO` y `AFILIADO`), cambiar la contraseña con token de recuperación (UPDATE de `USUARIO` + marcar el token como usado) y borrar un afiliado (borra `AFILIADO` y luego `USUARIO`). Sin transmisión de transacción, si el segundo insert fallara quedaría un usuario huérfano sin perfil, o un token que se marcó como usado aunque la contraseña no cambió. El patrón es siempre el mismo: `beginTransaction`, las queries, `commit`, y en el `catch` `rollback` para deshacer todo; en el `finally`, `release` para devolver la conexión al pool."

### 6.9 — "¿Cómo evitamos el problema N+1 en el listado de afiliados?"

"Antes, `findAll` hacía una consulta por afiliado más tres por cada uno (restricciones, ciclo y planes), y con muchos afiliados la página tardaba segundos. Ahora hace **4 queries planas**: los afiliados de la página, todas sus restricciones con `IN (?)`, todos sus ciclos activos con `IN (?)`, y el último progreso de esos ciclos con el patrón `MAX(fecha_registro)`. Después reensambla los resultados en JavaScript usando `Map` por llave natural, en un solo recorrido. El resultado es que el tiempo de respuesta deja de depender de la cantidad total de afiliados, porque las 4 consultas usan los ids de la página (paginación con `LIMIT/OFFSET`)."

### 6.10 — "¿Cómo impediría el sistema que un afiliado lea la rutina de otro?"

"De dos maneras que se complementan. Primero, por diseño: la app móvil nunca pide un id ajeno, siempre pregunta por `/afiliados/me/*`, y el backend resuelve el `me` con el `sub` del JWT, que no se puede forjar. No hay un 'número' en la URL para manipular y probar. Segundo, cuando una ruta recibe un id (como el `id_ciclo` del plan o el progreso), el middleware `requireOwnCiclo` verifica contra la base de datos que ese ciclo le pertenezca al `sub` del token; si no, responde 403 'Este ciclo no te pertenece'. Ese par de controles neutraliza la vulnerabilidad IDOR de acceso horizontal."

### 6.11 — "¿Por qué la sesión se guarda en el navegador/celular y qué pasa cuando vence?"

"Porque el backend es *state-less*: no guarda sesiones, y el modelo más simple es que cada cliente conserve el JWT y lo reenvíe. En la web se persiste en `localStorage` (claves `metafit_token/user/role`) y en el móvil en `AsyncStorage` con las mismas claves. El JWT vence a las 8 horas porque así lo firmó el servidor. Cuando vence, el backend responde `401`, y el interceptor de axios lo detecta: en la web limpia el `localStorage` y redirige a `/login`; en el móvil borra el `AsyncStorage` y `AppNavigator`, al ver el token en null, vuelve solo al Login. El 401 del propio `/login` se excluye siempre, porque allí significa 'credenciales incorrectas', no 'sesión vencida'."

### 6.12 — "Recorré completo el flujo de una rutina: la asigna el entrenador y la ve el afiliado."

"El entrenador, en la web, abre `RutinasView`, que carga los afiliados con `GET /afiliados`. Elige uno y crea primero el ciclo (`POST /afiliados/ciclos`), luego el plan de entrenamiento (`POST /planes/entrenamiento`) y por último cada rutina del día (`POST /planes/rutinas`), todo pasando por los middlewares de rol `requireAdminOrEntrenador`. El backend lo persiste en MySQL: `CICLO`, `PLAN_ENTRENAMIENTO`, `RUTINA` y `RUTINA_EJERCICIO`. Cuando el afiliado abre su app, `MiRutinaScreen` pide `GET /afiliados/me/ciclos`, elige el ciclo activo con `seleccionarCicloActivo` y trae `GET /planes/entrenamiento/:id_ciclo`, que devuelve las rutinas con sus ejercicios. La pantalla arma una card expandible por día y, cuando el socio marca ejercicios y pulsa 'Guardar Progreso', guarda con `POST /afiliados/me/progreso-ejercicio`. O sea: el staff escribe la estructura, el afiliado escribe su registro, y el backend une ambas partes."

---

### Bonus — 4 preguntas de refuerzo para el instructor (material extra, no obligatorio)

### B.1 — "¿Qué pasa si dos personas del staff editan al mismo afiliado a la vez?"

"Con la arquitectura actual, la última escritura gana. No hay un candado de bloqueo físico de fila para este caso porque el panel priorizó la simplicidad: cada PATCH trae solo los campos que la vista tuvo abiertos, y el backend los valida contra el CHECK de la base de datos (por ejemplo, `peso_kg` entre 20 y 300). Donde la atomicidad sí es crítica es en las transacciones de varias tablas, que vimos en `cicloModel` y en el alta de afiliados. Es una decisión documentada: consistencia fuerte en las operaciones que tocan varias tablas, última-escritura en las ediciones simples de perfil."

### B.2 — "¿Cómo hace la app móvil para verse igual aunque cambie el tema del sistema?"

"El proyecto lleva un sistema de tokens compartido con la web: `movil/src/theme.js` define los colores y los consulta vía `ThemeContext`. Cuando el usuario alterna el modo oscuro, el contexto cambia el estado `isDark` y el `NavigationContainer` recibe una `key` distinta (`'d'` o `'l'`), lo que obliga a React Navigation a remontar el árbol — así cada pantalla se re-renderiza con los nuevos tokens. Es el patrón de 'tema como state global', igual que `AuthProvider`. Los valores son los mismos que la web: fondo `#0a0a0f`, tarjetas `#1a1a2e`, acento rojo `#e31c25` y púrpura de admin `#7c3aed`."

### B.3 — "¿Para qué sirve que el sistema genere la contraseña 'MetaFit2025!'?"

"Es la contraseña inicial de los afiliados que se registran por mostrador: el backend la guarda con un hash bcrypt de 12 rondas (jamás texto plano) y la devuelve como `password_temporal` para que el correo de bienvenida se la cuente al afiliado. En el `seed` (parte 1.5), el hash está bien identificado en los comentarios, y en `afiliadoController.create` (parte 2.9) es el fallback final si el frontend no envía contraseña. La idea de negocio es simple: el afiliado entra con esa primera contraseña y debe cambiarla en su primer acceso — así nadie del staff conoce la contraseña final."

### B.4 — "¿De dónde salen los datos del Dashboard y por qué cambian al registrar un pago?"

"El Dashboard pide los totales al backend con `GET /dashboard/resumen` y al obtenerlos guarda las cifras en un estado local. Si otro staff registra un pago, `PagosView` emite el evento de ventana `pago-registrado` (parte 3.8); el Dashboard captura ese evento y vuelve a pedir los resúmenes. Además, cuando volvés a la pestaña, el evento `visibilitychange` dispara el refresco (parte 3.9). Es la combinación de dos mecanismos que ya conocemos: origen de datos en una API y notificación interna por eventos. La web nunca mantiene dobles fuentes de verdad para los totales."

---

## APÉNDICE A — Mapa completo de rutas de la API (inventario real)

Las tablas siguientes fueron extraídas directamente de `backend/routes/*.js` y del montaje en `backend/server.js`. El formato de cada fila es: **método + ruta → protecciones → acción**. Sirve como "chuleta" de repaso antes del examen.

### A.1 — Autenticación (`authRoutes.js`, montado en `/` y `/auth`)

| Método | Ruta | Protecciones | Acción |
|---|---|---|---|
| POST | `/login` | `loginLimiter` (rate limit) | `AuthController.login` |
| POST | `/auth/recuperar-password` | `recuperarLimiter` | envía token de recuperación |
| POST | `/auth/reset-password` | — | cambia la contraseña con token |

### A.2 — Afiliados (`afiliadoRoutes.js`, montado en `/afiliados`) — el más extenso

| Método | Ruta | Protecciones | Acción |
|---|---|---|---|
| GET | `/afiliados` | `requireAuth` + `requireStaff` | `getAll` (paginado, anti-N+1) |
| POST | `/afiliados` | `requireAuth` + `requireAdminOrRecepcionista` | `create` (alta + bienvenida) |
| GET | `/afiliados/me` | `requireAuth` | `getMe` (perfil propio, por `sub`) |
| PATCH | `/afiliados/me` | `requireAuth` | `updateMe` (peso/talla/correo, recalcula IMC) |
| GET | `/afiliados/me/ciclos` | `requireAuth` | `getMisCiclos` (con `numero_ciclo`) |
| GET | `/afiliados/me/progreso` | `requireAuth` | `getMiProgreso` |
| GET | `/afiliados/me/restricciones` | `requireAuth` | `getMisRestricciones` |
| GET | `/afiliados/me/ejercicios-disponibles` | `requireAuth` | catálogo filtrado |
| GET | `/afiliados/me/alimentos-disponibles` | `requireAuth` | catálogo filtrado |
| POST | `/afiliados/me/registro-ejercicio` | `requireAuth` | `RegistroController.registerEjercicio` |
| GET | `/afiliados/me/registro-ejercicio/historial` | `requireAuth` | historial de series |
| POST | `/afiliados/me/consumo-alimento-real` | `requireAuth` | `RegistroController.registerConsumoAlimento` |
| GET | `/afiliados/me/consumo-alimento-real/historial` | `requireAuth` | historial de consumos |
| POST | `/afiliados/me/notas-ejercicio` | `requireAuth` | crear nota de ejercicio |
| GET | `/afiliados/me/notas-ejercicio` | `requireAuth` | mis notas |
| PATCH | `/afiliados/me/notas-ejercicio/:id_nota` | `requireAuth` | actualizar nota |
| DELETE | `/afiliados/me/notas-ejercicio/:id_nota` | `requireAuth` | eliminar nota |
| POST | `/afiliados/me/foto` | `requireAuth` + `uploadFoto` | subir foto propia |
| POST | `/afiliados/me/progreso-ejercicio` | `requireAuth` | `saveProgresoEjercicio` |
| GET | `/afiliados/me/progreso-ejercicio/:idCiclo/:fecha` | `requireAuth` | progreso de un día |
| POST | `/afiliados/me/agua` | `requireAuth` | `saveAgua` |
| GET | `/afiliados/me/agua/:fecha` | `requireAuth` | vasos de un día |
| GET | `/afiliados/me/agua/historial` | `requireAuth` | historial de agua |
| POST | `/afiliados/me/consumo-alimento` | `requireAuth` | consumo diario |
| GET | `/afiliados/me/consumo/historial` | `requireAuth` | historial de consumo |
| GET | `/afiliados/me/progreso-ejercicio/historial` | `requireAuth` | historial de progreso |
| GET | `/afiliados/:id` | `requireAuth` + `requireStaff` | `getById` (detalle enriquecido) |
| PATCH | `/afiliados/:id` | `requireAuth` + `requireAdminOrRecepcionista` | `update` |
| DELETE | `/afiliados/:id` | `requireAuth` + `requireAdmin` | `delete` (físico, en cascada) |
| POST | `/afiliados/:id/foto` | `requireAuth` + `requireAdminOrRecepcionista` + `uploadFoto` | foto por staff |
| GET | `/afiliados/:id/ciclos` | `requireAuth` + `requireStaff` | ciclos de un afiliado |
| GET | `/afiliados/:id/notas-ejercicio` | `requireAuth` + `requireStaff` | notas vistas por staff |
| GET | `/afiliados/:id/restricciones` | `requireAuth` + `requireStaff` | restricciones |
| POST | `/afiliados/:id/restricciones` | `requireAuth` + `requireStaff` | agregar restricción |
| DELETE | `/afiliados/:id/restricciones/:id_restriccion` | `requireAuth` + `requireStaff` | quitar restricción |
| GET | `/afiliados/:id/ejercicios-disponibles` | `requireAuth` + `requireStaff` | ejercicios sobre sus restricciones |
| GET | `/afiliados/:id/alimentos-disponibles` | `requireAuth` + `requireStaff` | alimentos sobre sus restricciones |
| GET | `/afiliados/:id/progreso` | `requireAuth` + `requireStaff` | progreso del afiliado |
| POST | `/afiliados/progreso` | `requireAuth` + `requireAdminOrEntrenador` | crear registro de progreso |
| POST | `/afiliados/ciclos` | `requireAuth` + `requireAdminOrEntrenador` | crear ciclo (regla "uno activo") |
| GET | `/afiliados/:id/pagos` | `requireAuth` + `requireStaff` | pagos del afiliado |
| POST | `/afiliados/:id/pagos` | `requireAuth` + `requireAdminOrRecepcionista` | registrar pago |

### A.3 — Usuarios staff (`usuarioRoutes.js`, solo Admin)

| Método | Ruta | Protecciones | Acción |
|---|---|---|---|
| GET | `/usuarios` | `requireAuth` + `requireAdmin` | `getAll` |
| GET | `/usuarios/recepcionistas` | `requireAuth` + `requireAdmin` | filtro para combos |
| GET | `/usuarios/:id` | `requireAuth` + `requireAdmin` | detalle |
| POST | `/usuarios` | `requireAuth` + `requireAdmin` | crear staff |
| PATCH | `/usuarios/:id` | `requireAuth` + `requireAdmin` | actualizar |
| DELETE | `/usuarios/:id` | `requireAuth` + `requireAdmin` | eliminar/baja |
| PUT | `/usuarios/me/push-token` | `requireAuth` | guardar token de notificaciones push |

### A.4 — Planes (`planRoutes.js`, entrenamiento y nutricional)

| Método | Ruta | Protecciones | Acción |
|---|---|---|---|
| GET | `/planes/entrenamiento/:id_ciclo` | `requireAuth` + `requireOwnCiclo` | plan de entrenamiento del ciclo |
| GET | `/planes/entrenamiento/:id_ciclo/rutina/:dia_numero` | `requireAuth` + `requireOwnCiclo` | rutina de un día |
| POST | `/planes/entrenamiento` | `requireAuth` + `requireAdminOrEntrenador` | crear plan |
| PATCH | `/planes/entrenamiento/:id` | idem | editar plan |
| POST | `/planes/rutinas` | idem | crear rutina |
| POST | `/planes/rutinas/:id_rutina/ejercicios` | idem | agregar ejercicio |
| DELETE | `/planes/rutinas/:id_rutina/ejercicios/:id_ejercicio` | idem | quitar ejercicio |
| PATCH | `/planes/rutinas/:id_rutina/ejercicios/:id_ejercicio` | idem | editar ejercicio |
| DELETE | `/planes/rutinas/:id_rutina` | idem | eliminar rutina |
| GET | `/planes/nutricional/:id_ciclo` | `requireAuth` + `requireOwnCiclo` | plan nutricional |
| POST | `/planes/nutricional` | staff entrenador | crear plan nutricional |
| PATCH | `/planes/nutricional/:id` | idem | editar |
| POST | `/planes/nutricional/:id_plan/detalle` | idem | agregar alimento |
| PATCH | `/planes/nutricional/:id_plan/detalle/:id_detalle` | idem | editar alimento |
| DELETE | `/planes/nutricional/:id_plan/detalle/:id_detalle` | idem | quitar alimento |

### A.5 — Catálogos, dashboard, finanzas, misceláneos

| Método | Ruta | Protecciones | Acción |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/catalogo/ejercicios…` | staff entrenador (borrado → admin) | CRUD catálogo |
| GET/POST/PUT/DELETE | `/catalogo/alimentos…` | staff entrenador (borrado → admin) | CRUD catálogo |
| GET/POST/PUT/DELETE | `/catalogo/restricciones…` | admin | CRUD restricciones |
| GET | `/pagos` / `/pagos/metricas` | `requireAuth` + `requireAdmin` | finanzas globales |
| GET | `/dashboard/kpis` | `requireAuth` + `requireAdmin` | KPIs del panel |
| GET/PUT | `/configuracion/precio-membresia` | `requireAuth` + `requireAdmin` | precio de membresía |
| GET | `/notificaciones` | `requireAuth` | notificaciones |
| GET/PUT | `/progreso/resumen` | `requireAuth` | resumen del progreso |
| GET | `/progreso/historial` | `requireAuth` | historial |
| GET | `/progreso/ejercicio/:idEjercicio/evolucion` | `requireAuth` | evolución de un ejercicio |
| PATCH | `/ciclos/:id_ciclo` | `requireAuth` + `requireAdminOrEntrenador` | editar ciclo |
| DELETE | `/ciclos/:id_ciclo` | `requireAuth` + `requireAdmin` | eliminar ciclo (cascada) |

> **Regla que se ve en toda la tabla:** los endpoints `/me/*` solo piden `requireAuth` (el quien es su propio dato del token); los de gestión piden `requireStaff`; los de escritura de mostrador, `requireAdminOrRecepcionista`/`requireAdminOrEntrenador`; y los destructivos, `requireAdmin`.

## APÉNDICE B — El detalle fino del `docker-compose.yml`

**PARA QUÉ:** para defender "¿cómo levanta el sistema?" con precisión, conviene tener a mano las piezas reales del orquestador.

**Los 5 servicios y lo que define cada uno (del archivo real):**

| Servicio | Imagen/build | Puerto expuesto | Particularidad |
|---|---|---|---|
| `db` | `mariadb:11`, contenedor `metafit_db` | 3306 | monta `./database` en `/docker-entrypoint-initdb.d:ro` + volumen `metafit_db_data`; `healthcheck` con `mariadb-admin ping` |
| `backend` | build `./backend/Dockerfile` | `${PORT}` | `DB_HOST: db`, hereda `JWT_SECRET`, `CORS_ORIGINS` (Vite + Expo), `URL_APK`; `depends_on: db: condition: service_healthy` |
| `frontend` | build `./frontend_web/Dockerfile` | 5173→5173 | `VITE_API_URL=http://localhost:${PORT}`; volumen bind + `chokidar` polling (hot reload en Windows) |
| `phpmyadmin` | `phpmyadmin:latest` (`metafit_phpmyadmin`) | 8080→80 | `PMA_HOST: db`; también `depends_on: condition: service_healthy` |
| `n8n` | `n8nio/n8n` (`metafit_n8n`) | 5678 | auth básica `admin`/`Admin123!`, timezone `America/Bogota`, volumen `n8n_data` |

**Fragmento real del service `db` (para citarlo textual):**

```yaml
db:
  image: mariadb:11
  container_name: metafit_db
  restart: unless-stopped
  environment:
    MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
    MYSQL_DATABASE: ${DB_NAME}
    MYSQL_INITDB_SKIP_TZINFO: "true"
  ports:
    - "3306:3306"
  volumes:
    - ./database:/docker-entrypoint-initdb.d:ro   # los .sql corren en orden LEXICOGRÁFICO
    - metafit_db_data:/var/lib/mysql              # persistencia entre reinicios
  healthcheck:
    test: ["CMD", "mariadb-admin", "ping", "--skip-ssl", "-h", "127.0.0.1", "-u", "root", "-p${DB_PASSWORD}"]
    interval: 10s
    timeout: 5s
    retries: 10
    start_period: 40s
```

**El fragmento real del `backend` que demuestra el desacople:**

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  environment:
    NODE_ENV: production
    PORT: ${PORT}
    DB_HOST: db            # <- nombre del servicio Docker, NO localhost
    DB_PORT: 3306
    JWT_SECRET: ${JWT_SECRET}
    JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-8h}
    CORS_ORIGINS: ${CORS_ORIGINS:-http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081,http://127.0.0.1:8081}
  depends_on:
    db:
      condition: service_healthy   # arranca solo cuando MySQL responde ping
```

**Comandos que el instructor puede pedir de memoria:**
```bash
docker compose up --build          # levanta todo en orden
docker compose down -v             # baja TODO y borra el volumen (re-inicializa la BD)
docker compose ps                  # estado de los 5 contenedores
docker compose logs -f backend     # seguimiento de logs en vivo
```
Y las URLs que cierra el propio archivo: Swagger en `http://localhost:3001/swagger` y `/api-docs`, web en `http://localhost:5173`, phpMyAdmin en `http://localhost:8080` (usuario `root`, contraseña `DB_PASSWORD` del `.env`).

## APÉNDICE C — La vía sin Docker: `backend/start.sh` (producción real)

**PARA QUÉ:** en el repo existe un segundo arranque (`backend/start.sh`) que es el que usa Render en producción. Vale la pena poder contrastarlo con el Docker: "mismo orden de scripts, otra máquina".

**Secuencia real del script (59 líneas):**
1. Crear el socket de MariaDB y arrancar `mariadbd` con `--skip-name-resolve` e `innodb-buffer-pool-size=128M`.
2. Esperar con un loop de hasta 20 intentos de `mysqladmin ping`.
3. Si la base `metafit` **no existe**, crearla con `utf8mb4`/`utf8mb4_unicode_ci` y ejecutar los 5 scripts en el **mismo orden** que Docker:

```bash
mysql --socket="$MYSQL_SOCK" metafit < /app/database/01_estructura.sql
mysql --socket="$MYSQL_SOCK" metafit < /app/database/02_migracion_movil.sql
mysql --socket="$MYSQL_SOCK" metafit < /app/database/03_mejoras_estructura.sql
mysql --socket="$MYSQL_SOCK" metafit < /app/database/04_datos_iniciales.sql
mysql --socket="$MYSQL_SOCK" metafit < /app/database/05_password_reset.sql
```

4. Si la base **ya existe**, no tocar nada (es el mismo `INSERT IGNORE` idempotente del seed).
5. Exportar `DB_SOCKET`, `DB_USER=root`, `DB_PASSWORD=ignored`, `DB_NAME=metafit` y lanzar `exec node /app/index.js`.

**La lección de arquitectura:** Docs y producción **comparten un mismo origen**: el orden lexicográfico de `database/`. Docker lo logra autónomamente (el mapper ejecuta el folder completo); `start.sh` lo hace explícito, script por script. Por eso la BD local y la de Render son idénticas — "database/ es la única fuente de verdad del esquema".

## APÉNDICE D — Mapa de archivos del proyecto

**PARA QUÉ:** si el instructor pide "muéstrame dónde vive X", este árbol responde sin dudar.

```text
Equipo_Metafit/
├── backend/                        # API Node.js + Express + mysql2 pool
│   ├── index.js                    # arranque (carga migraciones y levanta server.js)
│   ├── server.js                   # Express: middlewares, rutas, swagger, errores
│   ├── config/db.js                # pool de conexiones (10, waitForConnections)
│   ├── middleware/auth.js          # requireAuth, requireStaff, requireAdmin…, requireOwnCiclo
│   ├── middleware/uploadFoto.js    # multer para fotos de perfil
│   ├── routes/                     # auth, afiliados, pagos, planes, catalogo, usuarios…
│   ├── controllers/                # capa HTTP (no tocan la BD)
│   ├── services/                   # reglas de negocio (afiliado, auth, pagos, push, bienvenida…)
│   ├── models/                     # SQL con parámetros (usuario, afiliado, ciclo, plan…)
│   ├── utils/                      # fechaUtils, password, mailer, i18n…
│   ├── database/                   # los mismos 5 scripts (copiables en Docker)
│   └── start.sh                    # arranque de producción (Render) sin Docker
├── frontend_web/                   # React + Vite (el panel del staff)
│   └── src/
│       ├── main.jsx                # bootstrap: React + AuthProvider + Router
│       ├── App.jsx                 # HashRouter, rutas públicas/protegidas, lazy
│       ├── context/AuthContext.jsx # sesión global (token + rol + flushSync)
│       ├── services/api.js         # axios + interceptor Bearer + 401 → logout
│       ├── components/             # ProtectedRoute, RequireAuth, HomeRedirect,
│       │                           # ErrorBoundary, AppLayout, Header…
│       └── views/                  # Login, Afiliados, Rutinas, Dietas, Pagos,
│                                   # Dashboard, AdminDashboard, GestionPersonal…
├── movil/                          # Expo / React Native (la app del afiliado)
│   └── src/
│       ├── App.js                  # ThemeProvider → AuthProvider → Root
│       ├── navigation/AppNavigator.js  # loading / Landing / MainTabs / Login
│       ├── context/AuthContext.js      # sesión en AsyncStorage (metafit_token…)
│       ├── theme.js                    # tokens de color espejo de la web
│       ├── services/                   # api.js (interceptor), perfilService, registroService
│       ├── screens/                    # las 7 pantallas de la parte 4.12
│       └── utils/cicloUtils.js         # seleccionarCicloActivo, formatearFecha
├── database/                       # scripts SQL de inicialización (01→05)
├── docker-compose.yml              # orquestación de los 5 servicios
└── docs/                           # este manual de trazabilidad
```

## APÉNDICE E — Glosario técnico (en palabras del equipo)

- **API REST** — acuerdo de comunicación sobre HTTP: URLs que representan recursos (`/afiliados`, `/planes/…`) y verbos que dicen qué hacer (GET lee, POST crea, PATCH edita, DELETE borra).
- **JWT (JSON Web Token)** — "pasaporte" firmado con el `JWT_SECRET`. El backend lo emite al loguear; cada cliente lo reenvía en `Authorization: Bearer …` sin que el servidor guarde sesión. Contiene `sub` (id) y `rol`.
- **bcrypt** — función de hash con sal automática y 12 rondas: la misma contraseña jamás produce el mismo hash dos veces; verificar cuesta ~100 ms por diseño.
- **CORS** — regla de los navegadores: el backend declara qué orígenes (`Origin`) tienen permitido llamarlo. La app móvil no pasa por navegador y no lo necesita.
- **MVC / capas** — separación: pasa la petición por ruta → controlador (HTTP) → service (reglas) → modelo (SQL). Cada capa sabe solo lo suyo.
- **Query parametrizada / prepared statement** — SQL con `?` y valores aparte; por eso una inyección SQL no puede colar código en el query.
- **Connection pool** — flota de conexiones a la BD reutilizables (10), en vez de abrir/cerrar conectores a cada rato.
- **Transacción** — bloque todo-o-nada: `beginTransaction` → queries → `commit`; en el `catch`, `rollback`. Garantiza consistencia entre tablas.
- **N+1** — anti-patrón de hacer 1 consulta + N consultas por fila. Se evita con pocas queries masivas y reensamble en memoria con `Map`.
- **IDOR** — vulnerabilidad "acceso directo inseguro a objetos": usar ids ajenos en la URL. Se bloquea con `/me`, `requireOwnCiclo` y propietario desde el JWT.
- **IMC** — índice de masa corporal = peso (kg) / estatura² (m). Lo recalcula el backend tras cada PATCH de perfil.
- **SPA / CSR** — la web es una Single Page Application que renderiza en el cliente (React) y solo pide datos JSON; el servidor no manda HTML.
- **HashRouter** — router de React que usa `#` en la URL; funciona en hosting estáticos sin configuración de redirecciones.
- **localStorage vs AsyncStorage** — persistencia del lado del cliente: en el navegador web (localStorage) y en el dispositivo móvil (AsyncStorage). Mismas claves `metafit_token/user/role`.
- **Rate limiting** — límite de intentos por minuto para `/login` y recuperación, contra fuerza bruta.
- **Webhook / fire-and-forget** — aviso HTTP que se dispara sin esperar: correo de bienvenida y notificación n8n tras un alta. Si falla, solo se loguea.
- **Healthcheck** — prueba de vida que define Docker (`mariadb-admin ping`) para que otros servicios esperen a la BD lista.
- **Volumen** — carpeta de persistencia de Docker (`metafit_db_data`, `n8n_data`) que sobrevive a los reinicios de contenedores.

## APÉNDICE F — Guía relámpago para la defensa (repaso de 10 minutos)

**PARA QUÉ:** antes de la sustentación, hagan un repaso en voz alta de estas 12 preguntas-puerta (son las que más aparecen en defensas técnicas). La respuesta en una línea y el enlace a dónde está profundizado.

| # | Pregunta-puerta | Respuesta corta | Enlace |
|---|---|---|---|
| 1 | ¿Cómo autenticás? | Correo + contraseña → hash bcrypt verificado → JWT firmado con `JWT_SECRET` | Parte 2.2 y 2.3 |
| 2 | ¿Cuántos clientes hay y para quién es cada uno? | 3: panel web (staff), app móvil (afiliados), y APIs/automaciones (n8n) | Parte 1.2 |
| 3 | ¿Qué es un middleware y por qué tantos en una ruta? | Función entre el request y el controlador; cada uno suma un chequeo (auth → rol → controlador) | Parte 2.4 y 2.7 |
| 4 | ¿Cómo sabés que un afiliado solo ve su data? | Rutas `/me` + `req.user.sub` del JWT y `requireOwnCiclo` para ids | Parte 4.6 y 6.10 |
| 5 | ¿Por qué MySQL y no un JSON? | Integridad (FK, CHECKs), consultas relacionales y transacciones | Parte 1.5 |
| 6 | ¿Qué pasa con la contraseña en la BD? | Solo hash bcrypt de 12 rondas; el seed jamás inserta texto plano | Parte 1.5 |
| 7 | ¿Cómo evitas N+1? | 4 queries planas con `IN (?)` y `MAX()`, reensamble con `Map` | Parte 6.9 |
| 8 | ¿Por qué la web pide CORS y la móvil no? | CORS es regla del navegador; React Native no la aplica | Parte 5.3 |
| 9 | ¿Qué pasa si la sesión vence? | 401 → el interceptor limpia el token → redirección o vuelta al Login | Parte 6.11 |
| 10 | ¿Cómo levanta el sistema? | `docker compose up --build`; los 5 `.sql` corren en orden en el primer arranque | Parte 1.3, 1.6, Apéndice B |
| 11 | ¿Cuál es el flujo de un alta de afiliado? | POST /afiliados → service valida → modelo inserta en 2 tablas (transacción) → correo + webhook n8n | Parte 2.9 |
| 12 | ¿Cómo se sincronizan web y móvil? | Leen y escriben la misma BD; el token viaja en el header; los eventos `window` actualizan el panel | Parte 3.8, Parte 5 |

## APÉNDICE G — Errores frecuentes en la puesta en marcha (y su diagnóstico)

**PARA QUÉ:** los instructores suelen preguntar por problemas reales. Estos diagnósticos nacen de la lógica del propio proyecto (no de adivinanzas), así que se pueden defender con el código a la mano.

### G.1 — "El backend no arranca y dice algo del `JWT_SECRET`"
En `services/authService.js`, si falta la variable de entorno, la firma de `JWT_SECRET` se lanza en el arranque (`throw`) — es un cierre deliberado (fail-fast): mejor no levantar el servidor que levantar uno que firma tokens con un secreto vacío.

### G.2 — "`docker compose up` queda esperando en MySQL"
El backend y phpMyAdmin no arrancan hasta que el healthcheck (`mariadb-admin ping`) responda. Si el `start_period` fue insuficiente o el `DB_PASSWORD` no coincide, el contenedor `db` queda en estado `unhealthy`. Diagnóstico: `docker compose ps` (columna STATUS) y `docker compose logs db`.

### G.3 — "La web dice error de CORS"
Sucede cuando se llama al backend desde un origen no listado en `CORS_ORIGINS`. El middleware acepta si `!origin` (móvil y peticiones sin navegador) pero rechaza orígenes web desconocidos. Revisar la variable de entorno y, en desarrollo, que el puerto de Vite esté en la whitelist.

### G.4 — "El afiliado no guarda el peso: los rangos no cuadran"
`PATCH /afiliados/me` valida en el service y el `CHECK` de la BD valida de nuevo: `peso_kg` entre 20 y 300, `estatura_cm` entre 1 y 300. Un error de tipo `ER_CHECK_CONSTRAINT_VIOLATED` delata que el número pasó de largo — hay barreras en todos los niveles.

### G.5 — "Se elimina un ciclo y da error de integridad"
Es el diseño por `ON DELETE RESTRICT`: las tablas hijas bloquean el borrado directo. La vía correcta es `DELETE /ciclos/:id_ciclo`, que recorre el borrado en cascada explícito en orden (parte 2.8). El error es la prueba de que la BD protege la integridad.

### G.6 — "El móvil no conecta al backend local"
La app fija `API_URL = https://metafit-backend-rr18.onrender.com`. Conectarse a un backend de desarrollo exige cambiar esa constante (o apuntar al dominio público). En el teléfono físico, además, `localhost` es el teléfono, no la PC — hay que usar la IP de la máquina.

### G.7 — "Tras una operación de gestor, el dashboard no se actualiza"
El panel se refresca con el bus de eventos (`afiliado-modificado`, `pago-registrado`, `personal-modificado`). Si no se ve el cambio, revisar que la vista que modificó **disparó** el evento (con `dispatchEvent`) y que el Dashboard lo **escucha** (parte 3.8); recargar la pestaña siempre sirve de comprobación.

### G.8 — "El seed tira duplicados si lo corro dos veces"
No puede: los INSERT usan `INSERT IGNORE` y los ids están fijos por rango (parte 1.5). La única forma de re-ejecutarlo limpiamente es `docker compose down -v` (borra el volumen) y volver a levantar.

---

## CIERRE — REPORTE FINAL DE TRAZABILIDAD

Este documento nació para responder, con código real y en lenguaje claro, todas las preguntas que un instructor puede hacer sobre el proyecto Metafit. A manera de cierre, dejamos la ficha técnica del entregable:

| Campo | Valor |
|---|---|
| Ruta absoluta del archivo | `C:\Users\erika\OneDrive\ERIKA HEBALIFE 2.25\Escritorio\Equipo_Metafit\docs\MANUAL_TRAZABILIDAD.md` |
| Formato | Markdown (CommonMark) |
| Nº total de líneas | **2713** |
| Partes desarrolladas | PARTE 1 (visión general), PARTE 2 (backend), PARTE 3 (web), PARTE 4 (móvil), PARTE 5 (comunicación entre capas), PARTE 6 (12 preguntas del instructor) + bonus · Apéndices A–G (rutas, docker-compose, start.sh, mapa de archivos, glosario, guía de defensa y errores frecuentes) |
| Contenido | 100 % código y datos reales del repositorio (backend, frontend_web, movil, database, docker-compose) |

**Las 5 preguntas del instructor que este manual cubre mejor:**

1. **"¿Cómo funciona el login del backend?"** — PARTE 2.2 (MVC + SERVICE, `POST /auth/login`) y PARTE 2.3 (JWT + bcrypt) reproducen el flujo completo con código real.
2. **"¿Por qué la web y la móvil deciden el 'home' de forma distinta?"** — PARTE 3.2 (router + `ProtectedRoute`), PARTE 3.7 (`HomeRedirect`, `ROLES_ROUTE`) y PARTE 5: es la misma autorización, distinta ejecución.
3. **"¿Por qué la web necesita CORS y la app móvil no?"** — PARTE 5.3 con el diagrama ASCII del middleware y la explicación del `if (!origin) return callback(null, true)`.
4. **"¿Cómo se evita el problema N+1 en el listado de afiliados?"** — PARTE 2.10 y PARTE 6.9 con las 4 queries planas, `IN (?)`, `MAX(fecha_registro)` y el reensamble con `Map`.
5. **"¿Cómo se impide que un afiliado lea la rutina de otro?"** — PARTE 2.7 (endpoints `/me` que no reciben id), PARTE 4.6 (`req.user.sub`) y PARTE 6.10 (IDOR + `requireOwnCiclo`).

*Fin del manual de trazabilidad técnica de Metafit.*