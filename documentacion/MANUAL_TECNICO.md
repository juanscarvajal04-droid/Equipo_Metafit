# MANUAL TÉCNICO — MetaFit

| Campo | Valor |
|-------|-------|
| **Proyecto** | MetaFit — Sistema de Gestión Deportiva |
| **Versión** | 2.0.0 |
| **Fecha** | Junio 2026 |
| **Equipo** | Sofia Astudillo, Kevin S. Robayo, Carlos Rodrigues, Juan S. Carvajal |
| **Cliente** | Sport Gym Sede 80 — Bogotá, Colombia |

---

## 1.2 Arquitectura del Sistema

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                      USUARIOS                                   │
  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
  │  │ Administrador│  │ Recepcionista│  │  Entrenador  │          │
  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
  │         └─────────────────┼─────────────────┘                  │
  │                    Frontend Web (Vite)                          │
  │              localhost:5173 / React + Bootstrap                 │
  └──────────────────────────┬──────────────────────────────────────┘
                             │ HTTP (REST)
                             ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │                     API Gateway (Express)                        │
  │              localhost:3001 / Node.js + JWT                      │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
  │  │  Auth    │ │ Usuarios │ │Afiliados │ │  Planes  │            │
  │  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │            │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
  │  │ Catálogo │ │Dashboard │ │  Pagos   │ │  Config  │            │
  │  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │            │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
  │  ┌──────────┐                                                   │
  │  │Notificaci│                                                   │
  │  │  Routes  │                                                   │
  │  └──────────┘                                                   │
  │                                                                  │
  │  Middlewares: requireAuth | requireAdmin | requireStaff |        │
  │              requireOwnCiclo | rateLimit | helmet                │
  └──────────────────────────┬───────────────────────────────────────┘
                             │ SQL
                             ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │               MySQL 8.0 — metafit (17 tablas)                   │
  │  localhost:3306                                                 │
  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
  │  │ USUARIO   │ │ AFILIADO  │ │  CICLO    │ │  PAGO     │       │
  │  ├───────────┤ ├───────────┤ ├───────────┤ ├───────────┤       │
  │  │ RESTRICC. │ │ EJERCICIO │ │ ALIMENTO  │ │ RUTINA    │       │
  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘       │
  │  ┌───────────┐ ┌───────────┐ ┌───────────┐                     │
  │  │ CONFIGUR. │ │NOTIFICAC. │ │ PROGRESO  │                     │
  │  └───────────┘ └───────────┘ └───────────┘                     │
  │                                                                  │
  │  5 Vistas · 1 Trigger · 15 Índices · 18 FK (RESTRICT/CASCADE)  │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │           App Móvil (React Native / Expo SDK 55)                │
  │  Dispositivo físico o emulador                                  │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
  │  │ Landing  │ │MiPerfil  │ │MiRutina  │ │ MiDieta  │            │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
  │  ┌──────────┐                                                   │
  │  │MiProgreso│                                                   │
  │  └──────────┘                                                   │
  │  Navegación: Stack (Landing → Login) → Bottom Tabs (App)       │
  └─────────────────────────────────────────────────────────────────┘
```

### Capas del sistema

1. **Frontend Web (React + Vite + Bootstrap 5)** — Interfaz de escritorio para Administración, Recepción y Entrenadores. Consume la API REST via axios. Renderizado del lado del cliente con React Router v7. Incluye Header con notificaciones en tiempo real.
2. **Backend API (Node.js + Express)** — API REST con patrón MVC. Procesa peticiones, aplica middlewares de seguridad, orquesta lógica de negocio y accede a la base de datos.
3. **Base de Datos (MySQL 8.0)** — Almacenamiento relacional normalizado en 3FN. 17 tablas, 5 vistas, 1 trigger.
4. **App Móvil (React Native + Expo SDK 55)** — Aplicación nativa para afiliados. Landing page informativa, consulta de perfil, rutinas, dietas y progreso. Autenticación con JWT + AsyncStorage.

### Stack Tecnológico Completo

| Componente | Tecnología | Versión |
|---|---|---|
| **Frontend Web** | React | 19.2.4 |
| | Vite | 6.4.3 |
| | React Router | 7.14.0 |
| | Bootstrap | 5.3.8 |
| | Chart.js | 4.5.1 |
| | chartjs-plugin-datalabels | 2.2.0 |
| | jsPDF + jspdf-autotable | 4.2.1 / 5.0.8 |
| | Axios | 1.14.0 |
| | Lucide React | 0.511.0 |
| **Backend API** | Node.js | 22+ |
| | Express | 4.18.2 |
| | MySQL2 | 3.9.7 |
| | JSON Web Token | 9.0.2 |
| | bcryptjs | 2.4.3 |
| | Swagger JSDoc | 6.2.8 |
| | Helmet | 8.2.0 |
| | express-rate-limit | 7.5.1 |
| | cors | 2.8.5 |
| **App Móvil** | React Native | 0.83.6 |
| | Expo | ~55.0.0 |
| | React Navigation | 7.x |
| | Axios | 1.18.0 |
| | AsyncStorage | 2.2.0 |
| **Base de Datos** | MySQL | 8.0 |
| **Infraestructura** | Docker | Compose V2 |
| | phpMyAdmin | latest |
| **Pruebas** | Jest | 30.4.2 |
| | Supertest | 7.2.2 |

---

## 1.3 Estructura del Proyecto

```
Equipo_Metafit/
├── backend/                          # API REST (Node.js + Express)
│   ├── config/                       # Configuración (DB, Swagger)
│   ├── controllers/                  # Controladores (lógica de rutas)
│   ├── middlewares/                  # Middlewares (auth, validación)
│   ├── models/                       # Modelos (queries SQL)
│   ├── services/                     # Servicios (lógica de negocio)
│   ├── routes/                       # Definiciones de rutas + JSDoc
│   ├── utils/                        # Utilidades (fechas)
│   ├── scripts/                      # Scripts auxiliares
│   ├── __tests__/                    # Tests (Jest + Supertest)
│   ├── server.js                     # Configuración Express
│   ├── index.js                      # Punto de entrada
│   └── .env.example                  # Variables de entorno
│
├── frontend_web/                     # Frontend Web (React + Vite)
│   ├── src/
│   │   ├── components/               # Componentes reutilizables
│   │   ├── context/                  # Contextos (AuthContext)
│   │   ├── hooks/                    # Custom hooks
│   │   ├── services/                 # Servicios API (axios)
│   │   ├── utils/                    # Utilidades
│   │   ├── views/                    # Páginas/vistas
│   │   ├── App.jsx                   # Router principal
│   │   └── main.jsx                  # Entry point
│   ├── public/                       # Assets estáticos
│   └── vite.config.js                # Configuración Vite
│
├── movil/                            # App Móvil (React Native + Expo)
│   ├── src/
│   │   ├── screens/                  # Pantallas
│   │   ├── navigation/               # Navegación (Stack + Tabs)
│   │   ├── context/                  # AuthContext móvil
│   │   ├── services/                 # API service (axios)
│   │   └── theme.js                  # Sistema de temas
│   ├── assets/                       # Imágenes, fuentes
│   ├── app.json                      # Configuración Expo
│   └── package.json
│
├── database/                         # Base de Datos (MySQL)
│   ├── 01_schema.sql                 # Schema completo (17 tablas)
│   ├── 02_seed.sql                   # Datos de seed
│   └── 03_datos_demo.sql             # Datos demo opcionales
│
├── documentacion/                    # Documentación técnica
│   ├── MANUAL_TECNICO.md             # ← Este archivo
│   ├── MANUAL_USUARIO.md             # Manual de usuario
│   ├── AUDITORIA_FINAL.md            # Auditoría completa
│   ├── DIAGRAMAS.md                  # Diagramas
│   ├── QA_REPORT.md                  # Reporte QA (51 pruebas)
│   ├── PRESENTACION.md               # Guion de sustentación
│   └── MANUAL_POSTMAN.md             # Uso de colecciones Postman
│
├── docker-compose.yml                # Orquestación Docker
├── .env                              # Variables de entorno
├── README.md                         # Documentación general
├── MetaFit_API_Web.postman_collection.json
├── MetaFit_API_Movil.postman_collection.json
└── .gitignore
```

**Responsabilidad de cada directorio:**

| Directorio | Responsabilidad |
|---|---|
| `backend/` | API REST completa con MVC, middlewares de seguridad, Swagger |
| `backend/routes/` | Endpoints con JSDoc para generación automática de Swagger |
| `backend/services/` | Lógica de negocio pura, desacoplada de Express |
| `backend/models/` | Queries SQL a la base de datos |
| `frontend_web/` | Interfaz web responsive con roles RBAC |
| `movil/` | App nativa para afiliados con Landing + 4 tabs |
| `database/` | Schema SQL, seed data, datos demo |
| `documentacion/` | Manuales técnico, usuario, QA, postman, diagramas |
| `docker-compose.yml` | Orquestación de 4 servicios |

---

## 1.4 Backend

### Patrón de Diseño MVC + Services

```
  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
  │  Routes  │────▶│Controller│────▶│ Service  │────▶│  Model   │
  └──────────┘     └──────────┘     └──────────┘     └──────────┘
       │                │                │                │
   Define rutas     Recibe req       Lógica de        Queries SQL
   + JSDoc         y res           negocio pura      a la BD
   Middlewares     Coordina                           Devuelve
   de auth         servicios                          resultados
```

### Middlewares Implementados

| Middleware | Archivo | Función |
|---|---|---|
| `requireAuth` | `middlewares/auth.js` | Verifica token JWT Bearer en header Authorization. Fallo → 401 |
| `requireAdmin` | `middlewares/auth.js` | Requiere rol `Administrador`. Fallo → 403 |
| `requireAdminOrEntrenador` | `middlewares/auth.js` | Requiere Admin o Entrenador. Fallo → 403 |
| `requireAdminOrRecepcionista` | `middlewares/auth.js` | Requiere Admin o Recepcionista. Fallo → 403 |
| `requireStaff` | `middlewares/auth.js` | Requiere Admin, Entrenador o Recepcionista (excluye Afiliado). Fallo → 403 |
| `requireOwnCiclo` | `middlewares/auth.js` | Verifica que el ciclo pertenezca al afiliado autenticado o que el rol sea staff. Fallo → 403 |
| `loginLimiter` | `server.js` (rateLimit) | 10 intentos por ventana de 15 min en `/login`. Solo cuenta intentos fallidos |
| `helmet()` | `server.js` | Headers de seguridad HTTP (CSP desactivado para Swagger UI) |
| `cors()` | `server.js` | CORS configurable por origen, abierto para Swagger y health |
| Content-Type validator | `server.js` | Rechaza POST/PUT/PATCH sin `application/json` → 415 |
| Error handler global | `server.js` | Captura errores no manejados, responde 500 con `{ error }`. También maneja CORS (403), JWT (401), JSON malformado (400) |
| 404 handler | `server.js` | Captura rutas no registradas, responde 404 |

### Lista Completa de Endpoints

| # | Método | Ruta | Descripción | Rol Requerido |
|---|---|---|---|---|
| 1 | POST | `/login` | Iniciar sesión, devuelve JWT (8h) | Público |
| 2 | GET | `/usuarios` | Listar personal (staff no afiliados) | Cualquier auth |
| 3 | GET | `/usuarios/:id` | Obtener usuario por ID | Cualquier auth |
| 4 | POST | `/usuarios` | Crear nuevo empleado | Admin |
| 5 | PATCH | `/usuarios/:id` | Actualizar empleado | Admin |
| 6 | DELETE | `/usuarios/:id` | Eliminar empleado | Admin |
| 7 | GET | `/afiliados` | Listar afiliados (paginado) | Staff (Admin, Recepcionista, Entrenador) |
| 8 | GET | `/afiliados/me` | Perfil del afiliado autenticado | Cualquier auth |
| 9 | GET | `/afiliados/me/ciclos` | Ciclos del afiliado autenticado | Cualquier auth |
| 10 | GET | `/afiliados/me/progreso` | Progreso del afiliado autenticado | Cualquier auth |
| 11 | GET | `/afiliados/me/restricciones` | Restricciones del afiliado auth | Cualquier auth |
| 12 | GET | `/afiliados/:id` | Obtener afiliado por ID | Staff |
| 13 | POST | `/afiliados` | Registrar nuevo afiliado | Staff |
| 14 | PATCH | `/afiliados/:id` | Actualizar afiliado | Staff |
| 15 | DELETE | `/afiliados/:id` | Eliminar afiliado | Admin |
| 16 | GET | `/afiliados/:id/ciclos` | Ciclos de un afiliado | Cualquier auth |
| 17 | POST | `/afiliados/ciclos` | Crear ciclo (asignar plan) | Admin o Entrenador |
| 18 | GET | `/afiliados/:id/restricciones` | Restricciones de un afiliado | Cualquier auth |
| 19 | POST | `/afiliados/:id/restricciones` | Asignar restricción médica | Admin o Entrenador |
| 20 | DELETE | `/afiliados/:id/restricciones/:idR` | Remover restricción | Admin o Entrenador |
| 21 | GET | `/afiliados/:id/ejercicios-disponibles` | Ejercicios filtrados por restricciones | Cualquier auth |
| 22 | GET | `/afiliados/:id/alimentos-disponibles` | Alimentos filtrados por restricciones | Cualquier auth |
| 23 | GET | `/afiliados/:id/progreso` | Historial de progreso físico | Cualquier auth |
| 24 | POST | `/afiliados/progreso` | Registrar medición de progreso | Admin o Entrenador |
| 25 | GET | `/afiliados/:id/pagos` | Historial de pagos del afiliado | Cualquier auth |
| 26 | POST | `/afiliados/:id/pagos` | Registrar pago | Admin o Recepcionista |
| 27 | GET | `/pagos` | Todos los pagos (con filtros: fecha, recepcionista) | Admin |
| 28 | GET | `/pagos/metricas` | Métricas financieras agregadas (ingresos por mes, por recepcionista, total, últimos 10 pagos) | Admin |
| 29 | GET | `/planes/entrenamiento/:id_ciclo` | Plan de entrenamiento | Propietario o Staff |
| 30 | POST | `/planes/entrenamiento` | Crear plan de entrenamiento | Admin o Entrenador |
| 31 | PATCH | `/planes/entrenamiento/:id` | Actualizar plan | Admin o Entrenador |
| 32 | POST | `/planes/rutinas` | Crear rutina en plan | Admin o Entrenador |
| 33 | POST | `/planes/rutinas/:id_rutina/ejercicios` | Agregar ejercicio a rutina | Admin o Entrenador |
| 34 | DELETE | `/planes/rutinas/:id_rutina/ejercicios/:id_ej` | Quitar ejercicio de rutina | Admin o Entrenador |
| 35 | GET | `/planes/nutricional/:id_ciclo` | Plan nutricional | Propietario o Staff |
| 36 | POST | `/planes/nutricional` | Crear plan nutricional | Admin o Entrenador |
| 37 | POST | `/planes/nutricional/:id_plan/detalle` | Agregar alimento a plan | Admin o Entrenador |
| 38 | GET | `/catalogo/ejercicios` | Listar ejercicios del catálogo | Cualquier auth |
| 39 | POST | `/catalogo/ejercicios` | Crear ejercicio en catálogo | Admin o Entrenador |
| 40 | PATCH | `/catalogo/ejercicios/:id` | Actualizar ejercicio | Admin o Entrenador |
| 41 | DELETE | `/catalogo/ejercicios/:id` | Eliminar ejercicio (con detección de conflictos FK) | Admin o Entrenador |
| 42 | GET | `/catalogo/alimentos` | Listar alimentos del catálogo | Cualquier auth |
| 43 | POST | `/catalogo/alimentos` | Crear alimento en catálogo | Admin o Entrenador |
| 44 | PATCH | `/catalogo/alimentos/:id` | Actualizar alimento | Admin o Entrenador |
| 45 | DELETE | `/catalogo/alimentos/:id` | Eliminar alimento (con detección de conflictos FK) | Admin o Entrenador |
| 46 | GET | `/catalogo/restricciones` | Listar restricciones médicas | Cualquier auth |
| 47 | GET | `/dashboard/kpis` | KPIs del gimnasio (totales, distribución, ingresos, personal) | Admin |
| 48 | GET | `/configuracion/precio-membresia` | Obtener precio de membresía | Admin |
| 49 | PUT | `/configuracion/precio-membresia` | Actualizar precio de membresía | Admin |
| 50 | GET | `/notificaciones` | Obtener notificaciones según el rol del usuario | Cualquier auth |
| 51 | GET | `/api-docs` | Swagger UI | Público |
| 52 | GET | `/swagger` | Swagger UI (alias) | Público |
| 53 | GET | `/api-docs.json` | OpenAPI spec JSON | Público |
| 54 | GET | `/health` | Health check del servidor | Público |

---

### 1.4.1 Módulo de Notificaciones Inteligentes

El sistema de notificaciones permite a cada rol recibir alertas contextuales sobre eventos relevantes del gimnasio.

#### Endpoint

```
GET /notificaciones
Auth: requireAuth (cualquier rol autenticado)
```

#### Lógica por Rol

| Rol | Notificaciones que recibe |
|---|---|
| **Administrador** | Afiliados con pago vencido, afiliados sin ciclo activo, afiliados sin plan asignado |
| **Recepcionista** | Afiliados con pago vencido, afiliados sin ciclo activo |
| **Entrenador** | Afiliados sin ciclo activo, afiliados sin plan asignado |

#### Formato de Respuesta

```json
[
  {
    "tipo": "pago_vencido",
    "cantidad": 3,
    "mensaje": "3 afiliados tienen pago vencido",
    "ruta": "/pagos"
  },
  {
    "tipo": "sin_ciclo",
    "cantidad": 2,
    "mensaje": "2 afiliados sin ciclo activo",
    "ruta": "/rutinas"
  }
]
```

#### Frontend (Header.jsx)

- **Polling** cada 60 segundos al endpoint `/notificaciones`
- **Badge** numérico rojo sobre el icono de campana
- **Dropdown** con lista de notificaciones clickeables
- **Redirección** a la ruta correspondiente al hacer clic
- **Auto-cancelación** del polling al recibir 401

---

### 1.4.2 Módulo de Finanzas y Pagos

#### Endpoints de Pagos (Admin)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pagos` | Lista completa de pagos. Filtros opcionales: `fecha_inicio`, `fecha_fin`, `id_recepcionista` |
| GET | `/pagos/metricas` | Métricas agregadas: ingresos por mes, pagos por recepcionista, total recaudado, últimos 10 pagos |

#### Endpoints de Pagos (Afiliado)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/afiliados/:id/pagos` | Historial de pagos del afiliado |
| POST | `/afiliados/:id/pagos` | Registrar pago. Calcula automáticamente `fecha_vencimiento` (+30 días) |

#### Modelo de Datos (PAGO)

| Columna | Tipo | Descripción |
|---|---|---|
| id_pago | INT (PK, AUTO_INCREMENT) | Identificador único |
| id_usuario | INT (FK → USUARIO) | Afiliado que paga |
| fecha_pago | DATE | Fecha del pago |
| valor_pagado | DECIMAL(10,2) | Monto pagado |
| estado | ENUM('Pagado','Vencido','Pendiente') | Estado del pago |
| fecha_vencimiento | DATE | Próximo vencimiento calculado |
| id_recepcionista | INT (FK → USUARIO) | Quien registró el pago |

---

### 1.4.3 Precio de Membresía Configurable

#### Endpoints

| Método | Ruta | Auth |
|---|---|---|
| GET | `/configuracion/precio-membresia` | Admin |
| PUT | `/configuracion/precio-membresia` | Admin |

#### Funcionamiento

- Almacenado en la tabla `CONFIGURACION` con clave `precio_membresia`
- Valor por defecto en seed: `80000` COP
- El Admin puede editarlo inline desde el Dashboard
- Al cambiar, el Dashboard recalcula automáticamente: `ingreso_proyectado = precio × afiliados_activos`

---

### 1.4.4 Catálogos con CRUD Completo

#### Ejercicios

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/catalogo/ejercicios` | Listar todos los ejercicios |
| POST | `/catalogo/ejercicios` | Crear ejercicio (nombre, grupo muscular, nivel mínimo, descripción) |
| PATCH | `/catalogo/ejercicios/:id` | Actualizar ejercicio |
| DELETE | `/catalogo/ejercicios/:id` | Eliminar ejercicio. Retorna 409 si está referenciado en rutinas activas |

#### Alimentos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/catalogo/alimentos` | Listar todos los alimentos con macros |
| POST | `/catalogo/alimentos` | Crear alimento (nombre, proteinas, carbohidratos, grasas) |
| PATCH | `/catalogo/alimentos/:id` | Actualizar alimento |
| DELETE | `/catalogo/alimentos/:id` | Eliminar alimento. Retorna 409 si está referenciado en planes activos |

#### Catálogos Filtrados por Restricciones

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/afiliados/:id/ejercicios-disponibles` | Ejercicios permitidos para el afiliado (excluye los prohibidos por sus restricciones) |
| GET | `/afiliados/:id/alimentos-disponibles` | Alimentos permitidos para el afiliado (excluye los prohibidos por sus restricciones) |

---

### Variables de Entorno

Crear archivo `.env` en `backend/`:

```env
# Puerto del servidor (por defecto 3001)
PORT=3001

# Entorno (development | production)
NODE_ENV=development

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=metafit

# JWT
JWT_SECRET=mi_secreto_super_seguro_123
JWT_EXPIRES_IN=8h

# CORS (orígenes permitidos separados por coma)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# URL base para Swagger
API_BASE_URL=http://localhost:3001

# SMTP (envío real de correos de recuperación de contraseña)
# En producción se usan SMTP_HOST/PORT/USER/PASS de Brevo (ver § Correo de recuperación)
SMTP_HOST=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USER=tu_login_smtp
SMTP_PASS=tu_clave_smtp
SMTP_FROM=remitente@verificado.com
FRONTEND_URL=http://localhost:5173
```

### Correo de recuperación de contraseña (SMTP / API Brevo)

El endpoint `POST /auth/recuperar-password` genera un JWT de reset (15 min) y envía el enlace por correo de verdad. Sin SMTP/API configurado devuelve el token en `modoPrueba` (solo desarrollo).

- **Servicio**: Brevo (plan free, 300 correos/día), relay `smtp-relay.sendinblue.com:587` con STARTTLS (`smtp-relay.brevo.com` falla por el certificado — el alias válido es `smtp-relay.sendinblue.com`).
- **Dos vías de envío** (por orden de prioridad en `authController.js`):
  1. **API REST Brevo** (`BREVO_API_KEY` seteada): `POST https://api.brevo.com/v3/smtp/email` por HTTPS. Es la vía recomendada: el tráfico TCP saliente de Render hacia puertos SMTP (465/587) puede estar bloqueado según la instancia, mientras que 443 siempre funciona.
  2. **SMTP clásico** (nodemailer) con `SMTP_HOST/PORT/USER/PASS` (usado cuando no hay clave API o la API falla — fallback automático). Funciona solo en instancias con egress SMTP habilitado.
- **Auth**: login del panel Brevo + clave SMTP (`xsmtpsib-…`, se crea en **SMTP & API → SMTP → Generar clave**) o clave API (`xkeysib-…`, en **SMTP & API → Claves API**).
- **En Brevo**: las claves SMTP deben poder enviar desde cualquier IP — en **Seguridad → IP autorizadas → Claves SMTP** desactivar el bloqueo (si queda activo, el relay responde `525 5.7.1 Unauthorized IP address`).
- **Sender**: `SMTP_FROM` debe estar verificado en Brevo (Transaccional → Senders). No es necesario que coincida con `SMTP_USER`.
- **Variables en Render** (metafit-backend): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `FRONTEND_URL` (para la URL del enlace) y **`BREVO_API_KEY` (configurada y activa, ago 2026)**. Timeouts 15/15/20 s en `createTransport` evitan que el endpoint cuelgue si el relay no responde.
- **Diseño del correo**: plantilla HTML en `backend/templates/recuperar-password.html`, rediseñada con las prácticas de correos transaccionales de Atlassian/Notion/Brevo (CSS 100 % inline, tablas, compatible Gmail/Outlook/Apple Mail). Fondo exterior neutro `#f4f4f4`; tarjeta central **blanca `#ffffff`** de **600px máx** (radio 8px, sombra suave); texto principal `#0a0a0f`, secundario `#6b7280`, divisor `#e5e7eb`, pie sutil (12px, `#9ca3af`); acentos moderados: solo el logo y el botón `#7c3aed`. Logo mancuerna roja como **PNG público de 512 px** (`frontend_web/public/app/logo-metafit.png`, mostrado a 48px centrado). `{{NOMBRE}}`, `{{ENLACE}}` y `{{ANIO}}` se reemplazan en `authController.js`; si la plantilla no se lee, el correo cae a texto plano. Remitente **"MetaFit" &lt;metafit.sistema@gmail.com&gt;**.
### Facturación por correo (pago de membresía)

Cuando se registra un pago de membresía, el sistema genera automáticamente una **factura por correo** con el diseño corporativo de MetaFit.

- **Flujo**: `POST /afiliados/:id/pagos` → `PagoModel.create` guarda el pago → `PagoController.create` dispara (en paralelo, sin bloquear la respuesta 201) `enviarFacturaPago(datosPago, afiliado)` de `backend/services/facturaService.js` → correo HTML al correo del afiliado.
- **Plantilla**: `backend/templates/factura-pago.html` (mismo estilo limpio que la recuperación: CSS inline, tablas, 600px, colores `#0a0a0f`/`#6b7280`/`#7c3aed`). Placeholders: `{{NOMBRE_AFILIADO}}`, `{{DOCUMENTO}}`, `{{CORREO}}`, `{{TELEFONO}}`, `{{NUMERO_FACTURA}}` (`FAC-{año}-{id_pago}`), `{{FECHA_EMISION}}`, `{{FECHA_PAGO}}`, `{{VALOR_PAGADO}}` (formato `$X.XXX COP`), `{{METODO_PAGO}}` (default "Efectivo"), `{{ESTADO_PAGO}}` y `{{ANIO}}`.
- **Asunto**: `Factura de pago - MetaFit - {nombre del afiliado}`. **Remitente**: "MetaFit" `<metafit.sistema@gmail.com>`.
- **Envío**: prioridad API REST Brevo (HTTPS) con fallback a SMTP (nodemailer), igual que la recuperación de contraseña.
- **Aislamiento de fallos**: el correo es un extra — si la factura falla (servicio, red, plantilla), el pago queda registrado igualmente y solo se loguea el error (`[facturaService]`, `[pagoController.create]`).
- **Verificado en producción (ago 2026)**: pago real id 43 → correo entregado (eventos Brevo `request`/`delivered`/`opened`) hacia `metafit.sistema@gmail.com`.

### Fotos de perfil de afiliados

El sistema permite subir una **foto de perfil** a cada afiliado, visible en la web (tabla y detalle) y en la app móvil (perfil propio).

- **Esquema**: columna `AFILIADO.foto VARCHAR(255) NULL` (ruta relativa, p. ej. `/uploads/172...-ab12.png`).
- **Migración automática**: `backend/migrations/migracionFotos.js` se ejecuta al arrancar (`index.js`) y es idempotente: crea la columna si no existe (necesario porque la BD de Render corre por socket local y no hay acceso SQL externo). También limpia los datos temporales de la prueba de factura (`PAGO 43`, `AFILIADO 10`, `USUARIO 10`) si siguen presentes.
- **Subida**: `multer` (`backend/middlewares/uploadFoto.js`) con almacenamiento en `backend/uploads/`, nombre único (timestamp + hex aleatorio), filtro de tipos (`image/png|jpe?g|webp|gif`) y límite de **5 MB**. Errores de multer se mapean a 400 en el error handler global de `server.js`.
- **Servido público**: `app.use('/uploads', express.static(...))` en `server.js` (la validación de Content-Type de BUG-003 permite `multipart/form-data`).
- **Endpoints** (en `routes/afiliadoRoutes.js`):
  - `POST /afiliados/me/foto` — el afiliado sube **su propia** foto (solo `requireAuth`).
  - `POST /afiliados/:id/foto` — admin o recepcionista sube la foto de cualquier afiliado (`requireAdminOrRecepcionista`).
  - Ambos devuelven `{ message, foto, url }`; el controller borra (best effort) el archivo de la foto anterior y el archivo recién subido si el afiliado no existe.
- **Modelo**: `afiliadoModel.js` incluye `a.foto` en los `SELECT` de `findAll`/`findById` y agrega `getFoto(id)`/`setFoto(id, ruta)`.
- **Web** (`frontend_web/src/views/AfiliadosView.jsx`): input de archivo + preview en los modales de crear/editar; avatar circular con la foto (o iniciales de color si no hay) en la tabla y en el detalle. La URL absoluta se arma con `API_BASE_URL` (`services/api.js`).
- **Móvil** (`movil/src/screens/MiPerfilScreen.js`): el avatar del header muestra la foto de `/afiliados/me` (componente `Avatar` con prop `foto`); al tocar el avatar se abre la galería (`expo-image-picker`) y se sube con FormData a `POST /afiliados/me/foto`, refrescando el perfil al terminar.
- **Limitación de Render**: las fotos viven en el filesystem efímero de la instancia (`backend/uploads/`); no persisten entre redeploys. Para persistencia real habría que usar un bucket externo (S3/Cloudinary).

### Analítica y SEO (Google Search Console + GA4 + GTM)

El frontend web incluye los snippets de Google en `frontend_web/index.html`, todos asociados a `metafit.sistema@gmail.com`:

- **Google Tag Manager (GTM)**: snippet principal en el `<head>` (lo más arriba posible) + iframe `noscript` al inicio del `<body>`. Container ID real: **`GTM-K6JZS4MG`**.
- **Google Search Console**: verificación por **archivo HTML** `frontend_web/public/google784a94e7c83aeb9e.html` (servido en `https://metafit-frontend-78x6.onrender.com/google784a94e7c83aeb9e.html`, método elegido al agregar la propiedad de tipo Prefijo de URL).
- **Google Analytics 4 (GA4)**: **NO** se incrusta gtag.js directo — se configura como **tag dentro de GTM** (consideración: el tag GA4 Configuration / Google Tag con el Measurement ID `G-XXXXXXXX`). Se evita el doble conteo de pageviews.
- **SPA / HashRouter**: la app usa `HashRouter` (rutas `#/...`). GTM captura los cambios de ruta automáticamente con el trigger **"History Change"** (incluye cambios de hash), por lo que **no hay pageviews manuales** en el código (`frontend_web/src/utils/analytics.js` documenta esto y deja a mano una función `pageview()` comentada y lista por si algún día se migra a gtag.js directo; `App.jsx` no se modifica).
- **Verificación**: en Search Console clic en "Verificar" tras publicar el meta tag; el estado del sitio se revisa en "Revisión de índice". En GTM, publicar el contenedor (botón **Enviar**) para que las etiquetas de GA4 queden activas. En GA4, el tráfico se ve en Tiempo real (En vivo) al entrar al sitio.
- **Placeholders**: `G-81SWBDG2P6` (GA4) se configura **dentro de GTM** (no está en el código).

## 1.6 Extras "1000/10" (mejoras de nivel)

### Modo claro/oscuro (web + móvil)

- **Web** (`frontend_web/src/utils/theme.js` + `index.css`): el tema se persiste en `localStorage` (`metafit_theme`, default `dark`). Se aplica al `<html>` vía `data-theme` en `main.jsx` (antes del render). Variables CSS globales `--mf-bg`, `--mf-bg-grad`, `--mf-sidebar`, `--mf-border`, `--mf-text`, `--mf-muted`, `--mf-accent` con paleta clara en `:root[data-theme='light']`; los módulos del shell (`AppLayout`, `Header`, `Sidebar`, `Footer`) las consumen. El toggle ☀️/🌙 vive en `Header.jsx` (botón `#btn-tema`) y re-renderiza el estado local.
- **Móvil** (`movil/src/context/ThemeContext.jsx`): decisión persistida en `AsyncStorage` (`metafit_theme_movil`), default = seguir el tema del sistema (`useColorScheme`). `swapPalette(isDark)` muta el objeto `COLORS` in-place (todos los consumidores comparten la referencia) y `AppNavigator` fuerza el remontaje con `key={isDark?'d':'l'}` para que todas las pantallas lean la paleta aplicada. Toggle en el header de `MiPerfilScreen`.

### Eventos de analítica (GA4 vía GTM dataLayer)

`frontend_web/src/utils/analytics.js` exporta `trackEvent(eventName, params)`, que hace `window.dataLayer.push({event, ...params})` con try/catch (la analítica nunca rompe la app). Eventos implementados:

| Evento | Lugar | Params |
|---|---|---|
| `metaFit_afiliado_creado` | `AfiliadosView.jsx` (handleCrear OK) | `rol_creador` |
| `metaFit_rutina_asignada` | `RutinasView.jsx` (asignación OK) | `afiliado_id` |
| `metaFit_dieta_asignada` | `DietasView.jsx` (asignación OK) | `afiliado_id` |
| `metaFit_apk_descargado` | `LandingPage.jsx` (botón APK) | — |

En GTM hay que crear **4 triggers “Custom Event”** con esos nombres y apuntarlos a un tag GA4 (Measurement ID `G-81SWBDG2P6`).

### Notificaciones push (Expo Push Service)

- **Columna** `USUARIO.push_token VARCHAR(255) NULL`, creada por migración de boot idempotente `backend/migrations/migracionPushToken.js`.
- **Endpoint**: `PUT /usuarios/me/push-token` (`requireAuth`) → `UsuarioService.guardarPushToken(id, token)`.
- **Servicio**: `backend/services/pushService.js` con `sendPush()`, `getPushToken()` y `enviarPushAUsuarioDelCiclo()`. Usa la API REST de Expo (`https://exp.host/--/api/v2/push/send`) con fetch — sin SDK pesado. Nunca lanza.
- **Trigger**: al crear plan de entrenamiento (`POST /planes/entrenamiento`) → push "🏋️ Nueva rutina asignada"; al crear plan nutricional (`POST /planes/nutricional`) → push "🥗 Nueva dieta asignada" (`planController`).
- **Móvil**: `movil/src/services/notifications.js` — `expo-notifications` con handler de banners, permisos, obtención del token (`getExpoPushTokenAsync` con `extra.eas.projectId` de `app.json`) y registro en el backend. Se activa tras el login (`LoginScreen`) y de forma idempotente en `MiPerfilScreen`.
- **Avísame**: para probar de punta a punta instala el APK, inicia sesión y pide que te asignen una rutina desde el panel web.

### Correo de bienvenida (Brevo)

- Servicio compartido `backend/services/correoService.js`: API REST Brevo (`api.brevo.com/v3/smtp/email`) con fallback SMTP (nodemailer). Devuelve true/false, nunca lanza.
- `backend/services/bienvenidaService.js` + plantilla `backend/templates/bienvenida-afiliado.html` (estilo 600px de marca): credenciales de acceso (correo + contraseña temporal `MF_<doc>@2025` si no se define una).
- Se dispara fire-and-forget en `afiliadoController.create`; la creación del afiliado nunca depende del correo.

### Recordatorio automático de pagos (cron)

- `backend/cron/recordatorioPagos.js` con **node-cron**: `0 * * * *` (cada hora). Consulta pagos `estado='Pagado'` con `fecha_vencimiento` dentro de los próximos **3 días** y envía la plantilla `backend/templates/recordatorio-pago.html`.
- **Dedupe diario**: tabla `PAGO_RECORDATORIO (id_pago PK, fecha_envio)` — un mismo pago solo recibe 1 recordatorio por día.
- Arranca en `backend/index.js` (`iniciarCron()`).

### Cloudinary (fotos en la nube, opcional)

`backend/middlewares/uploadFoto.js` selecciona el storage en caliente:

- Si existen `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y `CLOUDINARY_API_SECRET` → **CloudinaryStorage** (carpeta `metafit/afiliados`, formatos png/jpg/jpeg/webp/gif, transformación 600x600 limit).
- Sin esas variables → **disco local** (`uploads/`) como antes. La URL se guarda en `AFILIADO.foto` (https en Cloudinary, `/uploads/...` en disco).
- `eliminarFotoAnterior()` borra la versión previa en el storage correcto (destroy por public_id en Cloudinary, unlink en disco).

### Code Climate (calidad de código)

- `.codeclimate.yml` en la raíz: umbrales de complejidad/duplicación/líneas por archivo, exclusión de tests/builds/plantillas y plugins eslint + duplication + fixme.
- **Requisito manual**: el repo debe ser **público** en GitHub y entrar con la cuenta del equipo a [codeclimate.com](https://codeclimate.com) → "Add repository" una sola vez (la API del servicio no permite crearlos automáticamente). Informe: https://codeclimate.com/github/juanscarvajal04-droid/Equipo_Metafit

### GitHub Actions (CI/CD)

- `.github/workflows/ci.yml`:
  - **CI** (push a `main`/`feature/juan-carvajal` y PRs): Node 20 + `npm ci` + `npm test` en backend (25), frontend web (30 + build) y móvil (19).
  - **CD** (push a `main`, tras CI verde): deploy automático a Render vía API (`POST /services/{id}/deploys`) para backend `srv-d9ieq2rtqb8s738q2180` y frontend `srv-d9kbkdm1egvs7385ofu0`. Requiere el secret `RENDER_API_TOKEN` en el repo.
- La rama `feature/juan-carvajal` además desplega directo en Render por su auto-deploy (push = deploy).

### UptimeRobot (monitoreo)

Guía completa en `documentacion/UPTIME_ROBOT.md`: monitores HTTPS recomendados (backend `/health`, frontend y APK), configuración manual en el dashboard (la API gratuita no crea monitores), contactos de alerta y respuestas ante caída.

### Storybook (biblioteca de componentes)

- Storybook 10 (`npx storybook@latest init`) en `frontend_web` con addons a11y/docs/chromatic.
- Historias en `frontend_web/src/stories/metaFit.stories.jsx` (5): **Badge, Button, Card, Modal, Avatar** — tema oscuro MetaFit forzado desde `.storybook/preview.jsx` (decorador `data-theme="dark"` + CSS propio `src/stories/metaFit.css`).
- Scripts: `npm run storybook` (dev en :6006) y `npm run build-storybook` (build estático validado en CI local).
