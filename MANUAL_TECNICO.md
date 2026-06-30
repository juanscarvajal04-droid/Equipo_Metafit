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
  │                                                                  │
  │  Middlewares: requireAuth │ requireAdmin │ rateLimit │ helmet    │
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
  │                                                                  │
  │  5 Vistas · 1 Trigger · 15 Índices · 18 FK (RESTRICT/CASCADE)  │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │           App Móvil (React Native / Expo SDK 55)                │
  │  Dispositivo físico o emulador                                  │
  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
  │  │ MiPerfil │ │MiRutina  │ │ MiDieta  │ │MiProgreso│            │
  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
  │  Navegación: Stack (Auth) → Bottom Tabs (App)                   │
  └─────────────────────────────────────────────────────────────────┘
```

### Capas del sistema

1. **Frontend Web (React + Vite + Bootstrap 5)** — Interfaz de escritorio para Administración, Recepción y Entrenadores. Consume la API REST via axios. Renderizado del lado del cliente con React Router v7.
2. **Backend API (Node.js + Express)** — API REST con patrón MVC. Procesa peticiones, aplica middlewares de seguridad, orquesta lógica de negocio y accede a la base de datos.
3. **Base de Datos (MySQL 8.0)** — Almacenamiento relacional normalizado en 3FN. 17 tablas, 5 vistas, 1 trigger.
4. **App Móvil (React Native + Expo SDK 55)** — Aplicación nativa para afiliados. Consulta perfil, rutinas, dietas y progreso. Autenticación con JWT + AsyncStorage.

### Stack Tecnológico Completo

| Componente | Tecnología | Versión |
|---|---|---|
| **Frontend Web** | React | 19.2.4 |
| | Vite | 6.4.3 |
| | React Router | 7.14.0 |
| | Bootstrap | 5.3.8 |
| | Chart.js | 4.5.1 |
| | Axios | 1.14.0 |
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
├── docker-compose.yml                # Orquestación Docker
├── .env                              # Variables de entorno
├── README.md                         # Documentación general
├── AUDITORIA_FINAL.md                # Auditoría completa
├── MANUAL_TECNICO.md                 # ← Este archivo
├── MANUAL_USUARIO.md                 # Manual de usuario
├── DIAGRAMAS.md                      # Diagramas
├── PRESENTACION.md                   # Guion de sustentación
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
| `movil/` | App nativa para afiliados con 4 tabs |
| `database/` | Schema SQL, seed data, datos demo |
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

### Lista Completa de Endpoints

| # | Método | Ruta | Descripción | Rol Requerido |
|---|---|---|---|---|
| 1 | POST | `/login` | Iniciar sesión, devuelve JWT (8h) | Público |
| 2 | GET | `/usuarios` | Listar personal (staff no afiliados) | Cualquier auth |
| 3 | GET | `/usuarios/:id` | Obtener usuario por ID | Cualquier auth |
| 4 | POST | `/usuarios` | Crear nuevo empleado | Admin |
| 5 | PATCH | `/usuarios/:id` | Actualizar empleado | Admin |
| 6 | DELETE | `/usuarios/:id` | Eliminar empleado | Admin |
| 7 | GET | `/afiliados` | Listar afiliados (paginado) | Cualquier auth |
| 8 | GET | `/afiliados/me` | Perfil del afiliado autenticado | Cualquier auth |
| 9 | GET | `/afiliados/me/ciclos` | Ciclos del afiliado autenticado | Cualquier auth |
| 10 | GET | `/afiliados/me/progreso` | Progreso del afiliado autenticado | Cualquier auth |
| 11 | GET | `/afiliados/me/restricciones` | Restricciones del afiliado auth | Cualquier auth |
| 12 | GET | `/afiliados/:id` | Obtener afiliado por ID | Cualquier auth |
| 13 | POST | `/afiliados` | Registrar nuevo afiliado | Cualquier auth |
| 14 | PATCH | `/afiliados/:id` | Actualizar afiliado | Cualquier auth |
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
| 25 | GET | `/afiliados/:id/pagos` | Historial de pagos | Cualquier auth |
| 26 | POST | `/afiliados/:id/pagos` | Registrar pago | Admin o Recepcionista |
| 27 | GET | `/planes/entrenamiento/:id_ciclo` | Plan de entrenamiento | Propietario o Staff |
| 28 | POST | `/planes/entrenamiento` | Crear plan de entrenamiento | Admin o Entrenador |
| 29 | PATCH | `/planes/entrenamiento/:id` | Actualizar plan | Admin o Entrenador |
| 30 | POST | `/planes/rutinas` | Crear rutina en plan | Admin o Entrenador |
| 31 | POST | `/planes/rutinas/:id_rutina/ejercicios` | Agregar ejercicio a rutina | Admin o Entrenador |
| 32 | DELETE | `/planes/rutinas/:id_rutina/ejercicios/:id_ej` | Quitar ejercicio de rutina | Admin o Entrenador |
| 33 | GET | `/planes/nutricional/:id_ciclo` | Plan nutricional | Propietario o Staff |
| 34 | POST | `/planes/nutricional` | Crear plan nutricional | Admin o Entrenador |
| 35 | POST | `/planes/nutricional/:id_plan/detalle` | Agregar alimento a plan | Admin o Entrenador |
| 36 | GET | `/catalogo/ejercicios` | Listar ejercicios del catálogo | Cualquier auth |
| 37 | POST | `/catalogo/ejercicios` | Crear ejercicio en catálogo | Admin |
| 38 | GET | `/catalogo/alimentos` | Listar alimentos del catálogo | Cualquier auth |
| 39 | POST | `/catalogo/alimentos` | Crear alimento en catálogo | Admin |
| 40 | GET | `/catalogo/restricciones` | Listar restricciones médicas | Cualquier auth |
| 41 | GET | `/dashboard/kpis` | KPIs del gimnasio | Admin |
| 42 | GET | `/configuracion/precio-membresia` | Obtener precio membresía | Admin |
| 43 | PUT | `/configuracion/precio-membresia` | Actualizar precio membresía | Admin |
| 44 | GET | `/notificaciones` | Obtener notificaciones | Cualquier auth |
| 45 | GET | `/api-docs` | Swagger UI | Público |
| 46 | GET | `/swagger` | Swagger UI (alias) | Público |
| 47 | GET | `/api-docs.json` | OpenAPI spec JSON | Público |
| 48 | GET | `/health` | Health check del servidor | Público |

### Middlewares Implementados

| Middleware | Archivo | Función |
|---|---|---|
| `requireAuth` | `middlewares/auth.js` | Verifica token JWT Bearer en header Authorization. Fallo → 401 |
| `requireAdmin` | `middlewares/auth.js` | Requiere rol `Administrador`. Fallo → 403 |
| `requireAdminOrEntrenador` | `middlewares/auth.js` | Requiere Admin o Entrenador. Fallo → 403 |
| `requireAdminOrRecepcionista` | `middlewares/auth.js` | Requiere Admin o Recepcionista. Fallo → 403 |
| `requireOwnCiclo` | `middlewares/auth.js` | Verifica que el ciclo pertenezca al afiliado o que el rol sea staff |
| `loginLimiter` | `server.js` (rateLimit) | 10 intentos por ventana de 15 min en `/login` |
| `helmet()` | `server.js` | Headers de seguridad HTTP (CSP desactivado para Swagger UI) |
| `cors()` | `server.js` | CORS configurable por origen, abierto para Swagger y health |
| Content-Type validator | `server.js` | Rechaza POST/PUT/PATCH sin `application/json` → 415 |
| Error handler global | `server.js` | Captura errores no manejados, responde 500 con `{ error }` |
| 404 handler | `server.js` | Captura rutas no registradas, responde 404 |

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
```

---

## 1.5 Frontend Web

### Patrón de Diseño Componentes + Hooks + Context

```
  ┌──────────────┐
  │   App.jsx    │  Router principal (BrowserRouter + Routes)
  └──────┬───────┘
         │
  ┌──────▼─────────────────────────────────────────────────────┐
  │  AuthProvider (AuthContext.jsx)                             │
  │  - user, token, isAuthReady                                │
  │  - login(), logout()                                       │
  │  - authAxios (instancia axios configurada)                 │
  └──────────────────────────┬──────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────────┐ ┌──────────┐ ┌──────────┐
    │  PublicLayout   │ │Protected │ │  AppLayout│
    │  (Landing,Login)│ │ Route    │ │(Sidebar + │
    └─────────────────┘ └────┬─────┘ │Header+Foot│
                            │       └──────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │Login        │ │Dashboard    │ │AfiliadosView│
    │LandingPage  │ │GestionPers. │ │RutinasView  │
    └─────────────┘ │PagosView    │ │DietasView   │
                    └─────────────┘ └─────────────┘
```

### Vistas y Componentes

| Vista | Ruta | Roles | Responsabilidad |
|---|---|---|---|
| `Login.jsx` | `/login` | Público | Formulario de inicio de sesión con selector de rol |
| `LandingPage.jsx` | `/` | Público | Página de aterrizaje informativa |
| `Dashboard.jsx` | `/dashboard` | Admin | KPIs, gráficos, métricas del gimnasio |
| `AfiliadosView.jsx` | `/afiliados` | Todos | CRUD completo de afiliados por rol |
| `GestionPersonal.jsx` | `/personal` | Admin | CRUD de empleados (staff) |
| `RutinasView.jsx` | `/rutinas` | Admin, Entrenador | Asignación y visualización de rutinas |
| `DietasView.jsx` | `/dietas` | Admin, Entrenador | Asignación y visualización de dietas |
| `PagosView.jsx` | `/pagos` | Admin, Recepcionista | Registro y consulta de pagos |

| Componente | Responsabilidad |
|---|---|
| `AppLayout.jsx` | Layout interno con Sidebar + Header + Footer |
| `PublicLayout.jsx` | Layout para páginas públicas (Landing, Login) |
| `Sidebar.jsx` | Navegación lateral con enlaces por rol |
| `Header.jsx` | Barra superior con información del usuario |
| `Footer.jsx` | Pie de página con enlaces |
| `ProtectedRoute.jsx` | Guard de ruta con verificación de token y rol |
| `HomeRedirect.jsx` | Redirección al home según el rol |
| `ErrorBoundary.jsx` | Captura de errores de renderizado |

### Sistema de Rutas y Protección por Roles (RBAC)

```
Ruta              Admin   Recepcionista   Entrenador
/                   ✔         ✔              ✔          (Landing)
/login              ✔         ✔              ✔          (Público)
/dashboard          ✔         ✘              ✘
/afiliados          ✔         ✔              ✔
/personal           ✔         ✘              ✘
/rutinas            ✔         ✘              ✔
/dietas             ✔         ✘              ✔
/pagos              ✔         ✔              ✘
```

Implementado con `ProtectedRoute` que verifica:
1. Token existe (si no, redirige a `/login`)
2. Rol del usuario está en `allowedRoles` (si no, redirige al home del rol)
3. Muestra spinner mientras `isAuthReady` es false

### Sistema de Estilos

- **Bootstrap 5.3.8** como framework CSS base (grid, componentes, utilidades)
- **CSS Modules** por vista (ej: `Login.module.css`, `Dashboard.module.css`) para estilos específicos
- Tema oscuro personalizado con gradientes, sombras y animaciones
- Paleta de colores por rol (Admin: morado, Entrenador: verde, Recepcionista: azul)

### Flujo de Autenticación

```
1. Usuario ingresa credenciales en Login.jsx
2. Login.jsx llama a AuthContext.login({ correo, contrasena })
3. AuthContext.login() llama a authService.loginUser()
   └─> POST /login con { email, password }
4. Backend verifica credenciales, devuelve { accessToken, user }
5. authService.persistSession() guarda en localStorage
6. AuthContext actualiza estado con flushSync()
7. Login.jsx navega al home del rol
8. ProtectedRoute verifica token + rol en cada ruta
9. Cada request usa authAxios con header Authorization: Bearer <token>
```

---

## 1.6 App Móvil

### Framework

React Native 0.83.6 + Expo SDK ~55.0.0. Aplicación nativa para iOS y Android, con soporte web via `react-native-web`.

### Pantallas

| Pantalla | Responsabilidad | API Calls |
|---|---|---|
| `LandingScreen.js` | Página de bienvenida informativa | Ninguna |
| `LoginScreen.js` | Inicio de sesión del afiliado | `POST /login` |
| `MiPerfilScreen.js` | Perfil personal + datos físicos + restricciones | `GET /afiliados/me` |
| `MiRutinaScreen.js` | Plan de entrenamiento con ejercicios por día | `GET /afiliados/me/ciclos` → `GET /planes/entrenamiento/:id` |
| `MiDietaScreen.js` | Plan nutricional con calorías y comidas | `GET /afiliados/me/ciclos` → `GET /planes/nutricional/:id` |
| `MiProgresoScreen.js` | Historial de progreso físico | `GET /afiliados/me/progreso` |

### Sistema de Navegación

```
NavigationContainer
│
├─ [No token] Stack Navigator (headerShown: false)
│   ├── Landing → LandingScreen
│   └── Login   → LoginScreen
│
└─ [Token existe] Bottom Tab Navigator
    ├── Perfil   → MiPerfilScreen    (icono: 👤)
    ├── Rutina   → MiRutinaScreen    (icono: 💪)
    ├── Dieta    → MiDietaScreen     (icono: 🥗)
    └── Progreso → MiProgresoScreen  (icono: 📊)
```

El cambio entre Stack y Tabs es automático: cuando `AuthContext.token` cambia de `null` a valor, el navigador renderiza Tabs; cuando se cierra sesión, vuelve a Stack.

### Sistema de Temas (theme.js)

Tema oscuro unificado con paleta:

```js
COLORS = {
  bg: '#0a0a0f',             // Fondo principal
  bgSecondary: '#12121e',    // Fondo secundario
  bgCard: '#1a1a2e',         // Fondo tarjetas
  text: '#ffffff',           // Texto principal
  textSecondary: 'rgba(255,255,255,0.5)',
  textMuted: 'rgba(255,255,255,0.3)',
  red: '#e31c25',            // Color marca
  redDark: '#b71c1c',
  admin: '#7c3aed',          // Color rol Admin
  entrenador: '#059669',     // Color rol Entrenador
  recepcionista: '#2563eb',  // Color rol Recepcionista
  success: '#059669',
  warning: '#f59e0b',
  error: '#e31c25',
  border: 'rgba(255,255,255,0.1)',
  inputBg: '#1a1a2e',
}
```

### Flujo de Autenticación Móvil

```
1. Usuario abre app → LandingScreen (si no hay token)
2. Navega a LoginScreen
3. Ingresa credenciales → AuthContext.login(correo, contrasena)
   └─> api.loginRequest(correo, contrasena)
       └─> POST /login con { email: correo, password: contrasena }
4. Backend devuelve { accessToken, user }
5. AuthContext guarda en AsyncStorage: token, user, role
6. Token cambia de null a valor → Navigator cambia a MainTabs
7. Cada request API usa interceptor que lee token de AsyncStorage
8. Auto-logout en 401 (response interceptor excepto /login)
```

---

## 1.7 Base de Datos

### Diagrama Entidad-Relación (Texto/ASCII)

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                          USUARIO                                    │
  │  id_usuario (PK) · nombres · apellidos · correo (UQ)               │
  │  contrasena (bcrypt) · rol (ENUM) · estado · fecha_registro        │
  └────────┬───────────────┬──────────────┬─────────────────────────────┘
           │               │              │
           │ 1:1           │ 1:N          │ 1:N
           ▼               ▼              ▼
  ┌────────────────┐ ┌──────────┐ ┌──────────────────┐
  │   AFILIADO     │ │   PAGO   │ │ CICLO            │
  │ id_usuario(PK) │ │ id_pago  │ │ id_ciclo (PK)    │
  │ · documento UQ │ │ · id_usr │ │ · id_usuario FK  │
  │ · fecha_nac    │ │ · fecha  │ │ · activo         │
  │ · sexo         │ │ · valor  │ └───────┬──────────┘
  │ · estatura_cm  │ └──────────┘         │
  └────┬───────────┘                      │ 1:1
       │                                  ├──────────────────┐
       │ N:M                              │                  │
       ├──────────────────────┐           ▼                  ▼
       │                      │ ┌────────────────┐ ┌────────────────┐
       ▼                      ▼ │PLAN_ENTRENA.   │ │PLAN_NUTRICIONAL│
  ┌────────────────────┐  ┌──────────┐ │ id_ciclo (PK) │ │ id_ciclo (PK)  │
  │AFILIADO_RESTRICCION│  │RESTRICC. │ │ · observac.    │ │ · cal_objetivo │
  │ id_usuario  (PK)   │  │id_rest(PK)└────────┬───────┘ │ · num_comidas  │
  │ id_restricc (PK)   │◀─┤ nombre             │1:N      └────────┬───────┘
  └────────────────────┘  │ tipo               │                  │
                          │ efecto             ▼                  │
                          └──────────┘ ┌────────────┐              │
                                       │   RUTINA   │              │
                          ┌──────────┐ │ id_rutina  │              │
                          │EJERCICIO │ │ id_ciclo   │              │
                          │id_ejer(PK)│ │ nombre     │              │
                          │ nombre   │ │ dia_numero │              │
                          │ grupo_mus│ └─────┬──────┘              │
                          └────┬─────┘       │1:N                  │
                               │             ▼                     │
                    ┌──────────┴──┐ ┌────────────────┐  ┌──────────┴──────┐
                    │EJERCICIO_   │ │RUTINA_EJERCICIO│  │DETALLE_NUTRI.   │
                    │RESTRIC_EXCL │ │· id_rutina (PK)│  │· id_ciclo (PK)  │
                    │· id_ejer(PK)│ │· orden     (PK)│  │· num_comida(PK) │
                    │· id_rest(PK)│ │· id_ejercicio  │  │· id_alimento(PK)│
                    └─────────────┘ │· series        │  │· cantidad_g     │
                                    │· repeticiones  │  └─────────────────┘
                        ┌──────────┴────────────────┐
                        │ALIMENTO_RESTRIC_EXCL      │
                        │· id_alimento (PK)         │
                        │· id_restriccion (PK)      │
                        └──────────────────────────┘
  ┌──────────┐  ┌──────────────────┐  ┌──────────────────┐
  │ALIMENTO  │  │PROGRESO_FISICO   │  │CONFIGURACION     │
  │id_alimPK │  │· id_ciclo (PK)   │  │· clave (PK)      │
  │ nombre   │  │· fecha_reg (PK)  │  │· valor           │
  │ macros   │  │· peso_kg         │  └──────────────────┘
  └──────────┘  │· %grasa         │
                │· medidas        │
                └─────────────────┘
```

### Tablas (17)

| Tabla | Columnas Clave | Tipo | FK |
|---|---|---|---|
| **USUARIO** | id_usuario (PK), nombres, apellidos, correo (UQ), contrasena, rol ENUM, estado ENUM, fecha_registro | Super-tipo | — |
| **AFILIADO** | id_usuario (PK), documento (UQ), fecha_nacimiento, sexo ENUM, telefono, direccion, estatura_cm, estado_afiliacion ENUM, registrado_por | Sub-tipo | USUARIO (id_usuario), USUARIO (registrado_por) |
| **RESTRICCION** | id_restriccion (PK), nombre_restriccion (UQ), tipo ENUM, efecto_relevante | Catálogo | — |
| **EJERCICIO** | id_ejercicio (PK), nombre_ejercicio (UQ), grupo_muscular ENUM, descripcion, nivel_minimo ENUM | Catálogo | — |
| **ALIMENTO** | id_alimento (PK), nombre_alimento (UQ), proteinas, carbohidratos, grasas | Catálogo | — |
| **AFILIADO_RESTRICCION** | id_usuario (PK), id_restriccion (PK) | Pivot N:M | AFILIADO, RESTRICCION |
| **EJERCICIO_RESTRICCION_EXCLUIDA** | id_ejercicio (PK), id_restriccion (PK) | Pivot N:M | EJERCICIO, RESTRICCION |
| **ALIMENTO_RESTRICCION_EXCLUIDA** | id_alimento (PK), id_restriccion (PK) | Pivot N:M | ALIMENTO, RESTRICCION |
| **CICLO** | id_ciclo (PK), id_usuario, fecha_inicio, fecha_fin, activo, objetivo_fisico ENUM, grupo_muscular_prioritario, nivel_experiencia ENUM, disponibilidad_dias, registrado_por | Perfil dinámico | AFILIADO, USUARIO |
| **PLAN_ENTRENAMIENTO** | id_ciclo (PK), observaciones, modificado_por | 1:1 con CICLO | CICLO, USUARIO |
| **PLAN_NUTRICIONAL** | id_ciclo (PK), calorias_objetivo, num_comidas, observaciones, modificado_por | 1:1 con CICLO | CICLO, USUARIO |
| **RUTINA** | id_rutina (PK), id_ciclo, nombre_rutina, enfoque_muscular ENUM, dia_numero (UQ: ciclo+día) | Día de entreno | PLAN_ENTRENAMIENTO |
| **RUTINA_EJERCICIO** | id_rutina (PK), orden (PK), id_ejercicio, series, repeticiones | Pivot ordenada | RUTINA, EJERCICIO |
| **DETALLE_NUTRICIONAL** | id_ciclo (PK), num_comida (PK), id_alimento (PK), cantidad_g | Triple PK natural | PLAN_NUTRICIONAL, ALIMENTO |
| **PROGRESO_FISICO** | id_ciclo (PK), fecha_registro (PK), peso_kg, porcentaje_grasa, medida_cintura, medida_brazo, medida_pierna, observaciones, registrado_por | Alta frecuencia | CICLO, USUARIO |
| **PAGO** | id_pago (PK), id_usuario, fecha_pago, valor_pagado, estado ENUM, fecha_vencimiento | Transaccional | AFILIADO |
| **CONFIGURACION** | clave (PK), valor | Clave-valor | — |

### Vistas (5)

| Vista | Propósito |
|---|---|
| `v_alimento_calorias` | Calcula calorías por 100g con fórmula de Atwater (proteínas×4 + carbs×4 + grasas×9) |
| `v_perfil_afiliado` | Perfil completo con JOIN USUARIO + AFILIADO + edad calculada |
| `v_ciclo_activo_afiliado` | Ciclo activo con número de ciclo, días restantes, % avance |
| `v_ultimo_progreso` | Última medición por ciclo + IMC + clasificación OMS |
| `v_catalogo_ejercicios_disponibles` | Ejercicios filtrados por restricciones del afiliado |

### Triggers (1)

| Trigger | Evento | Propósito |
|---|---|---|
| `trg_ciclo_no_solapamiento_insert` | BEFORE INSERT ON CICLO | Rechaza ciclos con fechas solapadas sobre ciclos activos |

### Patrón de Herencia USUARIO → AFILIADO

```
USUARIO (super-tipo)
├── id_usuario (PK)
├── nombres, apellidos, correo, contrasena
├── rol = 'Afiliado' | 'Administrador' | 'Recepcionista' | 'Entrenador'
├── estado = 'Activo' | 'Inactivo' | 'Pendiente'
└── fecha_registro
      │
      ▼
AFILIADO (sub-tipo)
├── id_usuario (PK, FK → USUARIO)
├── documento, fecha_nacimiento, sexo, telefono, direccion
├── estatura_cm, estado_afiliacion
└── registrado_por (FK → USUARIO)
```

- Relación 1:1 con `ON DELETE RESTRICT ON UPDATE CASCADE`
- El afiliado se autentica via USUARIO (correo + contrasena)
- Los datos físicos están en AFILIADO (estáticos)
- Los datos de objetivo/nivel/disponibilidad están en CICLO (cambian por macrociclo)

### Normalización (3FN)

| Forma | Evidencia |
|---|---|
| **1FN** | Todas las columnas son atómicas. Sin grupos repetitivos. PKs compuestas donde es necesario. |
| **2FN** | Tablas pivote (AFILIADO_RESTRICCION, RUTINA_EJERCICIO, DETALLE_NUTRICIONAL) separan relaciones N:M con sus props. |
| **3FN** | Datos de objetivo/nivel/disponibilidad separados en CICLO (no en AFILIADO). Datos de personal (registrado_por) referencian USUARIO por FK. CHECK constraints garantizan integridad de dominios. |

---

## 1.8 Seguridad

### Autenticación JWT + bcrypt

- **JWT**: Token firmado con `JWT_SECRET`, expira en 8 horas. Payload: `{ sub: id, email, role, nombres, apellidos }`.
- **bcrypt**: 12 rondas de salt. Validación de límite de 72 bytes. Contraseña generada automática: `MF_{documento}@2025`.
- **Rate limiting**: 10 intentos por 15 minutos en `/login` (express-rate-limit).

### Protección de Rutas por Rol

5 middlewares progresivos:
- `requireAuth` → cualquier token válido
- `requireAdmin` → solo Administrador
- `requireAdminOrEntrenador` → Admin o Entrenador
- `requireAdminOrRecepcionista` → Admin o Recepcionista
- `requireOwnCiclo` → verifica propiedad del ciclo o rol staff

### Validación de Datos

- **Backend**: Validación de campos requeridos en servicios, CHECK constraints en MySQL, Content-Type validation (415 si no es JSON).
- **Frontend**: Validación de formularios con campos required, honeypot anti-autocomplete en login.
- **Móvil**: Validación de campos requeridos antes de enviar.

### Seguridad Adicional

- **Helmet**: Headers HTTP seguros (X-Content-Type-Options, X-Frame-Options, etc.)
- **CORS**: Solo orígenes configurados en `CORS_ORIGINS` (por defecto localhost:5173 y 3000).
- **Endpoints /me**: Los afiliados solo acceden a sus propios datos via `/afiliados/me/*`. Nunca reciben ID de otro usuario.
- **Sin secretos hardcodeados**: Todas las credenciales via variables de entorno.

---

## 1.9 Pruebas

### Tipos de Pruebas

| Tipo | Archivo | Framework | Cobertura |
|---|---|---|---|
| Integración API | `__tests__/api.test.js` | Jest + Supertest | Endpoints: login, usuarios, afiliados, pagos, notificaciones, dashboard, configuracion |
| Unitarias | `__tests__/afiliadoService.test.js` | Jest | `normalizarFecha()` utilidad |

### Resultados

```
Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
```

Casos de prueba cubiertos:
- Login exitoso con credenciales válidas
- Login fallido con credenciales inválidas → 401
- Acceso a rutas protegidas sin token → 401
- Acceso a rutas de admin sin rol Admin → 403
- CRUD de afiliados (listar, crear)
- Pagos y notificaciones con diferentes roles
- Dashboard KPIs solo para Admin
- Configuración de precio membresía solo para Admin
- Normalización de fechas (DD/MM/YYYY, YYYY-MM-DD, ISO 8601)
- Casos borde de fechas (null, undefined, string vacío, formato inválido)

---

## 1.10 Despliegue

### Docker Compose

```yaml
Servicios:
  mysql:      Imagen mysql:8.0, puerto 3306, volumen persistente
  backend:    Imagen node:22, puerto 3001, depende de mysql
  frontend:   Imagen nginx:alpine (build de Vite), puerto 5173
  phpmyadmin: Imagen phpmyadmin, puerto 8080, depende de mysql
```

### Instrucciones Paso a Paso

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd Equipo_Metafit

# 2. Configurar variables de entorno (opcional, hay defaults)
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar todos los servicios
docker compose up -d --build

# 4. Verificar estado
docker compose ps

# 5. Acceder a:
#    Frontend:  http://localhost:5173
#    Backend:   http://localhost:3001
#    Swagger:   http://localhost:3001/api-docs
#    phpMyAdmin: http://localhost:8080

# 6. Detener servicios
docker compose down

# 7. Eliminar volúmenes (borra datos)
docker compose down -v
```

### Sin Docker (desarrollo local)

```bash
# Backend
cd backend
npm install
cp .env.example .env  # configurar credenciales MySQL
npm run dev            # nodemon, http://localhost:3001

# Frontend Web
cd frontend_web
npm install
npm run dev            # Vite, http://localhost:5173

# App Móvil
cd movil
npm install
npx expo start         # Expo, escanear QR con Expo Go
```

---

## 1.11 Postman

### Colecciones Disponibles

| Colección | Archivo | Endpoints | Para quién |
|---|---|---|---|
| **Web (Staff)** | `MetaFit_API_Web.postman_collection.json` | 18 | Admin, Recepcionista, Entrenador |
| **Móvil (Afiliado)** | `MetaFit_API_Movil.postman_collection.json` | 7 | Afiliado |

### Cómo Importar y Configurar

1. Abrir Postman → File → Import → seleccionar el archivo `.json`
2. Crear un entorno: `base_url = http://localhost:3001`
3. Las variables `password_admin`, `password_recepcionista`, `password_entrenador`, `password_afiliado` ya están definidas en la colección
4. Ejecutar primero el login correspondiente — el script de test guarda `{{token}}` automáticamente
5. El resto de requests usan `Authorization: Bearer {{token}}`

### Endpoints por Colección

**Web (Staff)**: Health, Auth (3 logins), Usuarios/Personal (2), Afiliados (3), Catálogos Filtrados (2), Dashboard (1), Pagos (1), Configuración (2), Catálogo Global (3)

**Móvil (Afiliado)**: Auth (1), Mi Perfil, Mis Ciclos, Mi Progreso, Mis Restricciones, Plan de Entrenamiento, Plan Nutricional

---

## 1.12 Mantenimiento y Escalabilidad

### Cómo Agregar Nuevos Módulos

1. **Backend**: Crear modelo → service → controller → routes (con JSDoc)
2. **Registrar ruta** en `server.js` con `app.use('/ruta', rutaRoutes)`
3. **Agregar a Swagger**: incluir en `apis: []` de `swagger.js`
4. **Frontend**: Crear vista → sumar a `App.jsx` con `ProtectedRoute`
5. **Móvil**: Crear screen → agregar al navigator en `AppNavigator.js`
6. **Base de Datos**: Agregar migración SQL con `CREATE TABLE IF NOT EXISTS`

### Convenciones de Código

- **Backend**: camelCase en JS, snake_case en SQL. Servicios retornan objetos planos.
- **Frontend**: PascalCase para componentes, camelCase para hooks y funciones.
- **Móvil**: Sufijo `Screen.js` para pantallas. Theme centralizado en `theme.js`.
- **SQL**: Nombres en MAYÚSCULAS. Prefijo `uq_` para unique, `idx_` para índices, `fk_` para foreign keys, `trg_` para triggers.

### Estándares ISO 25000

| Característica | Implementación |
|---|---|
| **Mantenibilidad** | MVC + Services, responsabilidad única por archivo |
| **Modularidad** | Frontend/backend desacoplados via API REST |
| **Analizabilidad** | Swagger JSDoc, README, nombres autoexplicativos |
| **Seguridad** | JWT + bcrypt + helmet + rate limit + CORS |
| **Capacidad de prueba** | Jest + Supertest, servicios sin dependencias de red |
| **Funcionalidad** | 48 endpoints REST documentados |
| **Confiabilidad** | Try-catch + códigos HTTP semánticos + validación |
| **Eficiencia** | Índices en FKs, vistas materializadas, paginación |
