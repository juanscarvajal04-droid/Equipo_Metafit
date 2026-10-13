# API REST MetaFit

> Documento generado a partir de la lectura directa del código fuente del backend
> (`backend/routes/`, `backend/server.js`, `backend/middlewares/`).
> Todas las referencias son `archivo:línea` verificables en el repositorio.

---

## 1. Visión general

### 1.1 Arquitectura

| Capa | Implementación | Referencia |
|---|---|---|
| Framework HTTP | Express 4 | `backend/package.json:25` |
| Punto de entrada / montaje de rutas | `server.js` (exporta `app`) | `backend/server.js:143-154`, `backend/server.js:243` |
| Routers (12 archivos, 91 endpoints) | `backend/routes/*.js` | `backend/server.js:128-139` |
| Controladores | `backend/controllers/*.js` | — |
| Modelos / servicios | `backend/models/*.js`, `backend/services/*.js` | — |
| Conexión a BD | Pool `mysql2/promise` | `backend/config/db.js` |
| Autenticación | JWT (`jsonwebtoken`) + bcrypt (12 rondas) | `backend/services/authService.js:31`, `backend/middlewares/auth.js:43-216` |
| Seguridad HTTP | Helmet (CSP desactivado para Swagger UI) | `backend/server.js:77` |
| CORS | Whitelist configurable | `backend/server.js:35-72` |
| Documentación | swagger-jsdoc + swagger-ui-express | `backend/config/swagger.js`, `backend/server.js:160-176` |
| Fotos de perfil | Multer → Cloudinary o disco local | `backend/middlewares/uploadFoto.js:30-61` |

Patrón por endpoint: **router → middleware(s) de autenticación/rol → controller →
service/model → MySQL**. Los routers no contienen lógica de negocio; solo declaran
la ruta, los middlewares y el manejador.

### 1.2 Base URL

| Entorno | URL | Fuente |
|---|---|---|
| Producción (Render) | `https://metafit-backend-rr18.onrender.com` | `movil/src/services/api.js:18`, `postman/MetaFit_Environment.postman_environment.json` (clave `base_url`) |
| Desarrollo local | `http://localhost:3001` | `frontend_web/src/services/api.js:25`, `backend/config/swagger.js:34` |

**No existe prefijo `/api`.** Los routers se montan directamente en la raíz:

```js
// backend/server.js:143-154
app.use('/',           authRoutes);
app.use('/usuarios',   usuarioRoutes);
app.use('/afiliados',  afiliadoRoutes);
app.use('/afiliados',  pagoRoutes);          // GET|POST /afiliados/:id/pagos
app.use('/pagos',      pagoAdminRoutes);
app.use('/planes',     planRoutes);
app.use('/catalogo',   catalogoRoutes);
app.use('/dashboard',  dashboardRoutes);
app.use('/configuracion', configuracionRoutes);
app.use('/notificaciones', notificacionRoutes);
app.use('/progreso',   progresoRoutes);
app.use('/ciclos',     cicloRoutes);
```

Nota: `/afiliados` recibe **dos** routers (`afiliadoRoutes` y `pagoRoutes`),
por eso los pagos de un afiliado viven bajo `/afiliados/:id/pagos`
(`backend/server.js:145-146`).

Rutas auxiliares **no incluidas en los 91**: `/health` (`backend/server.js:182`),
`/api-docs/` y `/swagger` (`backend/server.js:169-170`), `/api-docs.json`
(`backend/server.js:173-176`) y el estático `/uploads` (`backend/server.js:122`).

### 1.3 Formato de respuesta

- **Éxito**: el formato depende del endpoint. No hay envoltorio uniforme.
  - Colecciones → `200` con array JSON (ej. `GET /notificaciones`, `backend/__tests__/api.test.js:99-104`).
  - Recurso individual → `200` con objeto.
  - Creaciones → `201` con `{ "id": <n>, "message": "<texto>" }` (ej. `backend/__tests__/fase2.test.js:74-77`).
  - Operaciones de escritura sobre un recurso existente → `200` con `{ "message": "<texto>" }`.
- **Error**: siempre objeto plano con la clave `error`:

```json
{ "error": "Token requerido" }
```

Casos con una segunda clave: `POST /auth/recuperar-password` responde
`{ "mensaje": "..." }` en modo normal (`backend/controllers/authController.js:138`).
Los manejadores de error devuelven exclusivamente `{ error }`
(`backend/server.js:194-237`, `backend/middlewares/auth.js:48,60,82,107,135,161`).

### 1.4 Códigos HTTP que devuelve realmente el backend

| Código | Cuándo | Referencia |
|---|---|---|
| `200` | Lecturas y actualizaciones exitosas | respuestas `res.json(...)` sin `status()` |
| `201` | Creaciones (`POST` que inserta) | 20 ocurrencias de `res.status(201)` en backend |
| `400` | Datos faltantes/inválidos, JSON malformado, imagen > 5 MB | `backend/server.js:219,230`, `backend/server.js:98` no aplica (es 415) |
| `401` | Token ausente, inválido o expirado; credenciales incorrectas | `backend/middlewares/auth.js:48,60`, `backend/server.js:214` |
| `403` | Rol insuficiente; cuenta no activa; origen CORS rechazado | `backend/middlewares/auth.js:82,107,135,161`, `backend/server.js:209` |
| `404` | Recurso inexistente y ruta no registrada | `backend/server.js:195` |
| `409` | Conflicto (duplicado, FK referenciada, correo en uso) | 6 ocurrencias de `res.status(409)` |
| `415` | `Content-Type` distinto de `application/json` o `multipart/form-data` en POST/PUT/PATCH | `backend/server.js:93-104` |
| `500` | Error interno sin detalle (nunca se filtra el stack) | `backend/server.js:236` |

**Manejo global de errores** (`backend/server.js:203-237`), última barrera:

1. Error de CORS → `403` (`backend/server.js:208-210`).
2. `JsonWebTokenError` / `TokenExpiredError` → `401 { error: 'Token inválido o expirado' }` (`backend/server.js:213-215`).
3. Body JSON roto (`entity.parse.failed`) → `400 { error: 'JSON malformado en el body' }` (`backend/server.js:218-220`).
4. Multer: tipo no permitido → `400` (`backend/server.js:223-225`); `LIMIT_FILE_SIZE` → `400` con mensaje de 5 MB (`backend/server.js:228-233`).
5. Cualquier otro → `500 { error: 'Error interno del servidor' }`, con el detalle **solo en consola del servidor** (`backend/server.js:205,236`).

Conteo de ocurrencias de `res.status(<código>)` en `backend/` (sin `__tests__`),
útil como señal de qué códigos produce realmente el código:

| 201 | 400 | 401 | 403 | 404 | 409 | 415 | 500 |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 20 | 81 | 10 | 8 | 32 | 6 | 1 | 91 |

(No es una métrica de tráfico: es un conteo estático de apariciones en el código.)

### 1.5 CORS

- Whitelist por defecto (desarrollo): varios puertos de `localhost` y
  `https://metafit-frontend-78x6.onrender.com` (`backend/server.js:35-45`, la URL
  de producción está en la línea 44).
- En producción la lista se toma de la variable de entorno `CORS_ORIGINS`
  (`backend/server.js:53-57`).
- Peticiones **sin cabecera `Origin`** (app móvil, `curl`, Postman) siempre se
  aceptan (`backend/server.js:61-62`).
- Métodos permitidos: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
  (`backend/server.js:70`); cabeceras: `Content-Type, Authorization`
  (`backend/server.js:71`).
- Un origen no listado produce `403 { error: 'CORS no permitido para este origen' }`
  (`backend/server.js:67`, `backend/server.js:208-210`).

---

## 2. Autenticación

### 2.1 Obtener el token

`POST /login` con body JSON `{ "email": "...", "password": "..." }`
(`backend/routes/authRoutes.js:82`).

Respuesta `200` real (`backend/controllers/authController.js:88-99`):

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@metafit.com",
    "role": "Administrador",
    "nombres": "Carlos",
    "apellidos": "Rodríguez"
  }
}
```

El payload del JWT contiene `{ sub, email, role }` (`backend/controllers/authController.js:82-86`):
el **rol viaja en el token**, de modo que los middlewares de autorización no
consultan la base en cada petición.

Respuestas de error del login:

| Código | Condición | Referencia |
|---|---|---|
| `400` | Faltan `email`/`password`, formato de correo inválido o contraseña > 72 bytes | `backend/controllers/authController.js` (validaciones previas al `try`) |
| `401` | Correo o contraseña incorrectos | `backend/controllers/authController.js` (dos `401` idénticos) |
| `403` | Cuenta con estado distinto de `Activo` | `backend/controllers/authController.js` (`'Cuenta no activa...'`) |
| `429` implícito | Rate limit del login → responde `429` con `{ error: 'Demasiados intentos...' }` | `backend/server.js:111-118` |
| `500` | Error interno | `backend/controllers/authController.js` |

### 2.2 Cabecera y expiración

```
Authorization: Bearer <accessToken>
```

- Extracción y verificación en `requireAuth`: `backend/middlewares/auth.js:44-45`
  (lee `req.headers['authorization']`, exige el prefijo `Bearer `).
- Sin cabecera → `401 { error: 'Token requerido' }` (`backend/middlewares/auth.js:47-49`).
- Firma inválida → `401 { error: 'Token inválido' }`; expirado → `401 { error: 'Token expirado' }`
  (`backend/middlewares/auth.js:56-61`).
- **Expiración: 8 horas** por defecto, configurable con `JWT_EXPIRES_IN`
  (`backend/services/authService.js:27`).
- El secreto `JWT_SECRET` es obligatorio: sin él el proceso no arranca
  (`backend/services/authService.js:15-23`).
- Token de recuperación de contraseña: **15 minutos**, un solo uso, claim
  `tipo: 'password_reset'` (`backend/services/authService.js:61-67`).

### 2.3 Middlewares disponibles

Definidos en `backend/middlewares/auth.js` y exportados en las líneas 218-228.

| Middleware | Rol admitido | Línea | Fin |
|---|---|---|---|
| `requireAuth` | Cualquier usuario con token válido | `backend/middlewares/auth.js:43-62` | Verifica firma y carga `req.user` |
| `requireAdmin` | `Administrador` | `backend/middlewares/auth.js:79-87` | Gestión de personal, borrados físicos, finanzas, KPIs |
| `requireAdminOrEntrenador` | `Administrador`, `Entrenador` | `backend/middlewares/auth.js:103-112` | Ciclos, planes, rutinas, catálogos deportivos, progreso |
| `requireAdminOrRecepcionista` | `Administrador`, `Recepcionista` | `backend/middlewares/auth.js:130-139` | Altas/edición en mostrador y registro de pagos |
| `requireStaff` | `Administrador`, `Entrenador`, `Recepcionista` | `backend/middlewares/auth.js:156-165` | Lecturas de gestión (excluye rol `Afiliado`) |

Complemento de propiedad (no es un middleware de rol): `requireOwnCiclo`
(`backend/middlewares/auth.js:190-216`) permite a un `Afiliado` leer solo su
propio `id_ciclo` (anti-IDOR); `Administrador`/`Entrenador` pasan sin
verificación.

**Distribución real de los 91 endpoints:**

| Cadena de middlewares | Endpoints |
|---|---:|
| `requireAuth` + `requireAdminOrEntrenador` | 21 |
| `requireAuth` (solo) | 33 |
| `requireAuth` + `requireAdmin` | 16 |
| `requireAuth` + `requireStaff` | 11 |
| `requireAuth` + `requireAdminOrRecepcionista` | 4 |
| `requireAuth` + `requireOwnCiclo` | 3 |
| Sin middleware (endpoints públicos de auth) | 3 |
| **Total** | **91** |

Semántica de error: sin token → `401`; token válido pero rol no permitido → `403`
con mensaje del middleware (ej. `'Acceso denegado: se requiere rol Administrador'`,
`backend/middlewares/auth.js:83`).

---

## 3. Catálogo completo de los 91 endpoints

Convención de la columna **Rol**:

- *Público* → sin token.
- *Autenticado* → cualquier rol con token.
- *Staff* → `Administrador` \| `Entrenador` \| `Recepcionista`.
- *Admin* → solo `Administrador`.
- *Admin/Entrenador*, *Admin/Recepcionista* → combinaciones indicadas.
- *Ciclo propio* → autenticado; si es `Afiliado`, el ciclo debe pertenecerle.

**Recuento: 91 = 3 + 7 + 40 + 4 + 2 + 9 + 6 + 12 + 1 + 2 + 1 + 4.**

### 3.1 Autenticación (3) — montado en `/` (`server.js:143`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| POST | `/login` | Iniciar sesión y emitir JWT de 8 h | Público | `authRoutes.js:82` |
| POST | `/auth/recuperar-password` | Solicitar token de recuperación (15 min, anti-spam) | Público | `authRoutes.js:109` |
| POST | `/auth/reset-password` | Aplicar nueva contraseña con token de un solo uso | Público | `authRoutes.js:133` |

### 3.2 Usuarios / personal (7) — montado en `/usuarios` (`server.js:144`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/usuarios` | Listar todo el personal | Admin | `usuarioRoutes.js:46` |
| PUT | `/usuarios/me/push-token` | Guardar el token de notificaciones push del usuario autenticado | Autenticado | `usuarioRoutes.js:47` |
| GET | `/usuarios/recepcionistas` | Listar solo recepcionistas | Admin | `usuarioRoutes.js:49` |
| GET | `/usuarios/:id` | Obtener un usuario por ID | Admin | `usuarioRoutes.js:75` |
| POST | `/usuarios` | Crear empleado (bcrypt, 12 rondas) | Admin | `usuarioRoutes.js:115` |
| PATCH | `/usuarios/:id` | Actualización parcial del empleado | Admin | `usuarioRoutes.js:153` |
| DELETE | `/usuarios/:id` | Eliminar empleado | Admin | `usuarioRoutes.js:184` |

### 3.3 Afiliados (40) — montado en `/afiliados` (`server.js:145`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/afiliados` | Listar afiliados con perfil, restricciones y ciclo activo | Staff | `afiliadoRoutes.js:60` |
| GET | `/afiliados/me` | Perfil del afiliado autenticado (usa `req.user.sub`) | Autenticado | `afiliadoRoutes.js:85` |
| POST | `/afiliados/me/notas-ejercicio` | Crear nota propia sobre un ejercicio | Autenticado | `afiliadoRoutes.js:88` |
| GET | `/afiliados/me/notas-ejercicio` | Listar mis notas de ejercicios | Autenticado | `afiliadoRoutes.js:89` |
| PATCH | `/afiliados/me/notas-ejercicio/:id_nota` | Editar una nota propia | Autenticado | `afiliadoRoutes.js:90` |
| DELETE | `/afiliados/me/notas-ejercicio/:id_nota` | Eliminar una nota propia | Autenticado | `afiliadoRoutes.js:91` |
| PATCH | `/afiliados/me` | Actualizar mi perfil (peso, talla, teléfono, correo) | Autenticado | `afiliadoRoutes.js:152` |
| GET | `/afiliados/me/ciclos` | Mis ciclos de entrenamiento | Autenticado | `afiliadoRoutes.js:176` |
| GET | `/afiliados/me/progreso` | Mi progreso físico | Autenticado | `afiliadoRoutes.js:194` |
| GET | `/afiliados/me/restricciones` | Mis restricciones médicas activas | Autenticado | `afiliadoRoutes.js:212` |
| GET | `/afiliados/me/ejercicios-disponibles` | Ejercicios permitidos para mí (filtra por restricciones) | Autenticado | `afiliadoRoutes.js:239` |
| GET | `/afiliados/me/alimentos-disponibles` | Alimentos permitidos para mí (con kcal/100 g) | Autenticado | `afiliadoRoutes.js:267` |
| POST | `/afiliados/me/registro-ejercicio` | Registrar ejecución real (series, reps, peso) | Autenticado | `afiliadoRoutes.js:321` |
| GET | `/afiliados/me/registro-ejercicio/historial` | Historial de registros (máx. 300) | Autenticado | `afiliadoRoutes.js:347` |
| POST | `/afiliados/me/consumo-alimento-real` | Registrar consumo real de un alimento del plan | Autenticado | `afiliadoRoutes.js:399` |
| GET | `/afiliados/me/consumo-alimento-real/historial` | Historial de consumos reales (máx. 300) | Autenticado | `afiliadoRoutes.js:425` |
| GET | `/afiliados/:id` | Detalle completo de un afiliado | Staff | `afiliadoRoutes.js:452` |
| POST | `/afiliados` | Registrar un nuevo afiliado (usuario + perfil, transaccional) | Admin/Recepcionista | `afiliadoRoutes.js:495` |
| PATCH | `/afiliados/:id` | Actualizar datos de un afiliado | Admin/Recepcionista | `afiliadoRoutes.js:530` |
| DELETE | `/afiliados/:id` | Eliminar afiliado y su usuario base | Admin | `afiliadoRoutes.js:565` |
| POST | `/afiliados/me/foto` | Subir mi foto de perfil (multipart, máx. 5 MB) | Autenticado | `afiliadoRoutes.js:608` |
| POST | `/afiliados/:id/foto` | Subir foto de perfil de un afiliado | Admin/Recepcionista | `afiliadoRoutes.js:651` |
| GET | `/afiliados/:id/ciclos` | Ciclos históricos de un afiliado | Staff | `afiliadoRoutes.js:682` |
| GET | `/afiliados/:id/notas-ejercicio` | Notas de ejercicios de un afiliado | Staff | `afiliadoRoutes.js:705` |
| POST | `/afiliados/ciclos` | Crear un ciclo (cierra el anterior por trigger) | Admin/Entrenador | `afiliadoRoutes.js:764` |
| GET | `/afiliados/:id/restricciones` | Restricciones médicas de un afiliado | Staff | `afiliadoRoutes.js:794` |
| POST | `/afiliados/:id/restricciones` | Asignar restricción médica a un afiliado | Staff | `afiliadoRoutes.js:828` |
| DELETE | `/afiliados/:id/restricciones/:id_restriccion` | Remover una restricción médica | Staff | `afiliadoRoutes.js:855` |
| GET | `/afiliados/:id/ejercicios-disponibles` | Ejercicios permitidos para ese afiliado | Staff | `afiliadoRoutes.js:879` |
| GET | `/afiliados/:id/alimentos-disponibles` | Alimentos permitidos para ese afiliado | Staff | `afiliadoRoutes.js:899` |
| GET | `/afiliados/:id/progreso` | Historial de progreso + observaciones de registros | Staff | `afiliadoRoutes.js:975` |
| POST | `/afiliados/progreso` | Registrar una medición de progreso físico | Admin/Entrenador | `afiliadoRoutes.js:1033` |
| POST | `/afiliados/me/progreso-ejercicio` | Guardar progreso diario de ejercicios (app móvil) | Autenticado | `afiliadoRoutes.js:1075` |
| GET | `/afiliados/me/progreso-ejercicio/:idCiclo/:fecha` | Progreso de ejercicios de un día (app móvil) | Autenticado | `afiliadoRoutes.js:1102` |
| POST | `/afiliados/me/agua` | Registrar consumo de agua (app móvil) | Autenticado | `afiliadoRoutes.js:1132` |
| GET | `/afiliados/me/agua/:fecha` | Vasos de agua de una fecha | Autenticado | `afiliadoRoutes.js:1161` |
| POST | `/afiliados/me/consumo-alimento` | Guardar consumo dietario del día (app móvil) | Autenticado | `afiliadoRoutes.js:1199` |
| GET | `/afiliados/me/agua/historial` | Historial de agua (últimos 30 días) | Autenticado | `afiliadoRoutes.js:1226` |
| GET | `/afiliados/me/consumo/historial` | Historial de consumo (últimos 100 registros) | Autenticado | `afiliadoRoutes.js:1249` |
| GET | `/afiliados/me/progreso-ejercicio/historial` | Historial de progreso (últimos 200 registros) | Autenticado | `afiliadoRoutes.js:1275` |

### 3.4 Pagos (4) — montados en dos routers

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/afiliados/:id/pagos` | Historial de pagos de un afiliado | Staff | `pagoRoutes.js:19` |
| POST | `/afiliados/:id/pagos` | Registrar un pago de un afiliado | Admin/Recepcionista | `pagoRoutes.js:22` |
| GET | `/pagos` | Listar todos los pagos (filtros de fecha) | Admin | `pagoAdminRoutes.js:18` |
| GET | `/pagos/metricas` | Métricas financieras del gimnasio | Admin | `pagoAdminRoutes.js:19` |

`pagoRoutes` se monta en `/afiliados` (`backend/server.js:146`);
`pagoAdminRoutes` en `/pagos` (`backend/server.js:147`).

### 3.5 Ciclos (2) — montado en `/ciclos` (`server.js:154`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| PATCH | `/ciclos/:id_ciclo` | Actualizar fechas/objetivo de un ciclo | Admin/Entrenador | `cicloRoutes.js:81` |
| DELETE | `/ciclos/:id_ciclo` | Eliminar un ciclo | Admin | `cicloRoutes.js:113` |

### 3.6 Planes de entrenamiento y rutinas (9) — montado en `/planes` (`server.js:148`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/planes/entrenamiento/:id_ciclo` | Obtener el plan de entrenamiento de un ciclo | Ciclo propio | `planRoutes.js:77` |
| GET | `/planes/entrenamiento/:id_ciclo/rutina/:dia_numero` | Rutina del día filtrada por grupo muscular | Ciclo propio | `planRoutes.js:129` |
| POST | `/planes/entrenamiento` | Crear plan de entrenamiento para un ciclo | Admin/Entrenador | `planRoutes.js:174` |
| PATCH | `/planes/entrenamiento/:id` | Actualizar observaciones del plan | Admin/Entrenador | `planRoutes.js:203` |
| POST | `/planes/rutinas` | Crear una rutina en un plan | Admin/Entrenador | `planRoutes.js:246` |
| POST | `/planes/rutinas/:id_rutina/ejercicios` | Añadir ejercicio a una rutina | Admin/Entrenador | `planRoutes.js:289` |
| DELETE | `/planes/rutinas/:id_rutina/ejercicios/:id_ejercicio` | Quitar ejercicio de una rutina | Admin/Entrenador | `planRoutes.js:318` |
| PATCH | `/planes/rutinas/:id_rutina/ejercicios/:id_ejercicio` | Editar series/reps/peso/descanso del ejercicio | Admin/Entrenador | `planRoutes.js:361` |
| DELETE | `/planes/rutinas/:id_rutina` | Eliminar rutina y sus ejercicios | Admin/Entrenador | `planRoutes.js:386` |

### 3.7 Planes nutricionales (6) — mismo router `/planes`

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/planes/nutricional/:id_ciclo` | Obtener el plan nutricional de un ciclo | Ciclo propio | `planRoutes.js:428` |
| POST | `/planes/nutricional` | Crear plan nutricional para un ciclo | Admin/Entrenador | `planRoutes.js:468` |
| PATCH | `/planes/nutricional/:id` | Actualizar cabecera del plan nutricional | Admin/Entrenador | `planRoutes.js:511` |
| POST | `/planes/nutricional/:id_plan/detalle` | Agregar alimento a una comida | Admin/Entrenador | `planRoutes.js:517` |
| PATCH | `/planes/nutricional/:id_plan/detalle/:id_detalle` | Editar cantidad o mover alimento de comida | Admin/Entrenador | `planRoutes.js:563` |
| DELETE | `/planes/nutricional/:id_plan/detalle/:id_detalle` | Eliminar alimento del plan | Admin/Entrenador | `planRoutes.js:599` |

### 3.8 Catálogos (12) — montado en `/catalogo` (`server.js:149`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/catalogo/ejercicios` | Listar ejercicios | Autenticado | `catalogoRoutes.js:54` |
| POST | `/catalogo/ejercicios` | Crear ejercicio | Admin/Entrenador | `catalogoRoutes.js:94` |
| PUT | `/catalogo/ejercicios/:id` | Actualizar ejercicio | Admin/Entrenador | `catalogoRoutes.js:95` |
| DELETE | `/catalogo/ejercicios/:id` | Eliminar ejercicio | Admin/Entrenador | `catalogoRoutes.js:96` |
| GET | `/catalogo/alimentos` | Listar alimentos | Autenticado | `catalogoRoutes.js:133` |
| POST | `/catalogo/alimentos` | Crear alimento | Admin/Entrenador | `catalogoRoutes.js:171` |
| PUT | `/catalogo/alimentos/:id` | Actualizar alimento | Admin/Entrenador | `catalogoRoutes.js:172` |
| DELETE | `/catalogo/alimentos/:id` | Eliminar alimento | Admin/Entrenador | `catalogoRoutes.js:173` |
| GET | `/catalogo/restricciones` | Listar restricciones médicas | Autenticado | `catalogoRoutes.js:197` |
| POST | `/catalogo/restricciones` | Crear restricción médica | Admin | `catalogoRoutes.js:237` |
| PUT | `/catalogo/restricciones/:id` | Actualizar restricción médica | Admin | `catalogoRoutes.js:283` |
| DELETE | `/catalogo/restricciones/:id` | Eliminar restricción médica | Admin | `catalogoRoutes.js:315` |

### 3.9 Dashboard (1) — montado en `/dashboard` (`server.js:150`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/dashboard/kpis` | KPIs del gimnasio (afiliados, ciclos, ingresos…) | Admin | `dashboardRoutes.js:46` |

### 3.10 Configuración (2) — montado en `/configuracion` (`server.js:151`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/configuracion/precio-membresia` | Leer el precio de membresía | Admin | `configuracionRoutes.js:9` |
| PUT | `/configuracion/precio-membresia` | Actualizar el precio de membresía | Admin | `configuracionRoutes.js:10` |

### 3.11 Notificaciones (1) — montado en `/notificaciones` (`server.js:152`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/notificaciones` | Notificaciones calculadas en vivo según el rol del token | Autenticado | `notificacionRoutes.js:49` |

### 3.12 Progreso diario (4) — montado en `/progreso` (`server.js:153`)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/progreso/resumen` | Resumen diario del afiliado autenticado | Autenticado | `progresoRoutes.js:62` |
| PUT | `/progreso/resumen` | Actualizar estado subjetivo del día (energía, ánimo) | Autenticado | `progresoRoutes.js:98` |
| GET | `/progreso/historial` | Historial de resúmenes (máx. 90 días) | Autenticado | `progresoRoutes.js:121` |
| GET | `/progreso/ejercicio/:idEjercicio/evolucion` | Evolución de un ejercicio (series, peso, volumen) | Autenticado | `progresoRoutes.js:153` |

### 3.13 Health check (fuera de los 91)

| Método | Ruta | Propósito | Rol | Ref. |
|---|---|---|---|---|
| GET | `/health` | Estado del proceso y de MySQL (`ok` / `degraded`) | Público | `server.js:182` |

---

## 4. Ejemplos reales de petición y respuesta

Los ejemplos provienen de la suite de pruebas del backend (supertest), no de
inputs inventados.

### 4.1 Login

```http
POST /login
Content-Type: application/json

{ "email": "carlos@metafit.com", "password": "Admin123!" }
```

```json
200
{
  "accessToken": "<JWT>",
  "user": { "id": 1, "email": "carlos@metafit.com", "role": "Administrador",
            "nombres": "Carlos", "apellidos": "Ramírez" }
}
```

Verificado en `backend/__tests__/api.test.js:26-42`.

### 4.2 Endpoint autenticado

```http
GET /afiliados/1/ejercicios-disponibles
Authorization: Bearer <token>
```

```json
200
[ { "id_ejercicio": 1, "nombre_ejercicio": "Sentadilla" } ]
```

`backend/__tests__/api.test.js:44-71`.

### 4.3 Sin token

```http
GET /afiliados/1/ejercicios-disponibles
```

```json
401
{ "error": "Token requerido" }
```

`backend/__tests__/api.test.js:73-80`, mensaje en `backend/middlewares/auth.js:48`.

### 4.4 Rol insuficiente

```http
POST /afiliados
Authorization: Bearer <token con role "Afiliado">
Content-Type: application/json

{ "nombres": "A", "apellidos": "B", "correo": "x@y.com", ... }
```

```json
403
{ "error": "Acceso denegado: se requiere rol Administrador o Recepcionista" }
```

`backend/__tests__/api.test.js:133-145`; mensaje en `backend/middlewares/auth.js:135`.

### 4.5 Creación exitosa (`201`)

```http
POST /catalogo/restricciones
Authorization: Bearer <token de Administrador>
Content-Type: application/json

{ "nombre_restriccion": "Asma", "tipo": "Enfermedad",
  "efecto_relevante": "Evitar alta intensidad" }
```

```json
201
{ "id": 20, "message": "Restricción creada correctamente" }
```

`backend/__tests__/fase2.test.js:69-78`.

### 4.6 Conflicto (`409`)

```http
PATCH /afiliados/me
Authorization: Bearer <token de afiliado>
Content-Type: application/json

{ "correo": "tomado@test.com" }
```

```json
409
{ "error": "El correo ya está en uso" }
```

`backend/__tests__/faseA.test.js:114-128` (afirmación `res.body.error` con
`/ya está en uso/`).

### 4.7 Notificaciones (lectura simple)

```http
GET /notificaciones
Authorization: Bearer <token>
```

```json
200
[ { "tipo": "...", "cantidad": 3, "mensaje": "..." } ]
```

`backend/__tests__/api.test.js:92-107`; el esquema documentado es
`{ tipo, mensaje, cantidad, icono, ruta }` (`backend/routes/notificacionRoutes.js:31-40`).

### 4.8 Content-Type incorrecto (`415`)

```http
POST /usuarios
Content-Type: text/plain

...
```

```json
415
{ "error": "Content-Type debe ser application/json" }
```

`backend/server.js:93-104`. Excepciones: rutas bajo `/api-docs` y `/swagger`, y
todo `multipart/form-data` (fotos).

---

## 5. Límites y rate limiting reales

| Límite | Valor | Aplicación | Referencia |
|---|---|---|---|
| Rate limit de login | 10 intentos / 15 min por IP; **las peticiones exitosas no cuentan** | Solo bajo la ruta `/login` | `backend/server.js:111-118`, aplicado en `backend/server.js:142` |
| Rate limit de recuperación de contraseña | 5 solicitudes / 15 min por IP; cuenta también las exitosas | `POST /auth/recuperar-password` | `backend/routes/authRoutes.js:17-24` |
| Tamaño de body | 50 KB | `express.json` y `urlencoded` globales | `backend/server.js:83-84` |
| Content-Type obligatorio | `application/json` o `multipart/form-data` en POST/PUT/PATCH | Todo el API (415 en caso contrario) | `backend/server.js:93-104` |
| Imágenes de perfil | 5 MB, solo `image/png`, `image/jpeg`, `image/webp`, `image/gif` | `POST /afiliados/me/foto`, `POST /afiliados/:id/foto` | `backend/middlewares/uploadFoto.js:22-24,61`; mensaje en `backend/server.js:230` |
| Límite de contraseña | 72 bytes (límite de bcrypt) | Login y creación/edición de usuarios | `backend/services/authService.js:35,94`, `backend/controllers/authController.js` |
| Historiales | 300 registros (ejercicio y consumo real), 200 (progreso de ejercicios), 100 (consumo), 90 días (resumen) | endpoints `/historial` y `/progreso/historial` | `afiliadoRoutes.js:327,405,1255,1232`, `progresoRoutes.js:104` |
| Timeout de cliente | 10 s | Axios web y móvil | `frontend_web/src/services/api.js` (`timeout: 10000`), `movil/src/services/api.js:23` |

No existe un rate limit global por IP en la API: solo las dos rutas indicadas.
Tampoco hay límite de paginación uniforme; los parámetros de query (ej.
`?page=&limit=` en `GET /afiliados`) se manejan dentro de los controllers.

---

## 6. Consumo por plataforma

Método: extracción estática de las llamadas `api.*/authAxios.*` en
`frontend_web/src/**` y `movil/src/**`, con normalización de parámetros de ruta
(`:id` / `${id}` → plantilla) y contraste contra los 91 endpoints reales.

### 6.1 Web (`frontend_web`) — 59 de 91

Cliente: `frontend_web/src/services/api.js` (axios + token en `localStorage`) y
`authAxios` usado por las vistas.

| Módulo | Endpoints usados |
|---|---|
| Auth (3) | `POST /login`, `POST /auth/recuperar-password`, `POST /auth/reset-password` |
| Usuarios (6) | `GET /usuarios`, `GET /usuarios/recepcionistas`, `POST /usuarios`, `PATCH /usuarios/:id`, `DELETE /usuarios/:id` (+ `GET /usuarios/:id`) |
| Afiliados (22) | `GET/POST/PATCH/DELETE /afiliados`, `GET /afiliados/:id`, `POST /afiliados/:id/foto`, `GET /afiliados/:id/ciclos`, `GET /afiliados/:id/notas-ejercicio`, `POST /afiliados/ciclos`, `GET/POST/DELETE /afiliados/:id/restricciones`, `GET /afiliados/:id/ejercicios-disponibles`, `GET /afiliados/:id/alimentos-disponibles`, `GET/POST /afiliados/progreso` |
| Pagos (3) | `GET /afiliados/:id/pagos`, `POST /afiliados/:id/pagos`, `GET /pagos/metricas` |
| Ciclos (2) | `PATCH /ciclos/:id_ciclo`, `DELETE /ciclos/:id_ciclo` |
| Planes y rutinas (8) | `GET/POST/PATCH /planes/entrenamiento[...]`, `POST /planes/rutinas`, `POST/PATCH/DELETE /planes/rutinas/:id/ejercicios[...]`, `DELETE /planes/rutinas/:id` |
| Planes nutricionales (6) | `GET/POST/PATCH /planes/nutricional[...]`, `POST/PATCH/DELETE /planes/nutricional/:id/detalle[...]` |
| Catálogos (12) | CRUD completo de `ejercicios`, `alimentos` y `restricciones` |
| Dashboard / Config / Notificaciones (4) | `GET /dashboard/kpis`, `GET`+`PUT /configuracion/precio-membresia`, `GET /notificaciones` |

La web **también** llama a `GET /health`, que no cuenta entre los 91
(`frontend_web/src/services/api.js:140`).

### 6.2 Móvil (`movil`) — 28 de 91

Cliente principal: `movil/src/services/api.js` (axios + token en `AsyncStorage`,
`movil/src/services/api.js:21-59`).

| Archivo | Endpoints declarados |
|---|---:|
| `movil/src/services/api.js` | 22 |
| `movil/src/services/registroService.js` | 4 |
| `movil/src/services/notifications.js` (`PUT /usuarios/me/push-token`) | 1 |
| `movil/src/screens/MiPerfilScreen.js` (`POST /afiliados/me/foto`) | 1 |
| **Total (conjunto distinto)** | **28** |

Los 28: `POST /login`, `POST /auth/recuperar-password`, `POST /auth/reset-password`,
`PUT /usuarios/me/push-token`, `GET/PATCH /afiliados/me`, `GET /afiliados/me/ciclos`,
`GET /afiliados/me/progreso`, `GET /afiliados/me/restricciones`,
`POST/GET /afiliados/me/notas-ejercicio`, `PATCH /afiliados/me/notas-ejercicio/:id_nota`,
`GET /afiliados/me/ejercicios...` no aplica → en su lugar los de registro real:
`POST/GET /afiliados/me/registro-ejercicio[/historial]`,
`POST/GET /afiliados/me/consumo-alimento-real[/historial]`,
`POST /afiliados/me/foto`, `POST /afiliados/me/progreso-ejercicio`,
`GET /afiliados/me/progreso-ejercicio/:idCiclo/:fecha`,
`POST /afiliados/me/agua`, `GET /afiliados/me/agua/:fecha`,
`GET /afiliados/me/agua/historial`, `POST /afiliados/me/consumo-alimento`,
`GET /afiliados/me/consumo/historial`, `GET /afiliados/me/progreso-ejercicio/historial`,
`GET /planes/entrenamiento/:id_ciclo`,
`GET /planes/entrenamiento/:id_ciclo/rutina/:dia_numero`,
`GET /planes/nutricional/:id_ciclo`.

> **Discrepancia con el dato de partida.** Se indicaba que
> `movil/src/services/api.js` declara 27 endpoints. El conteo verificado es
> **22 funciones con llamada HTTP en `movil/src/services/api.js`** (líneas 64-148)
> y **28 endpoints distintos en todo `movil/src`** (22 + 4 de `registroService.js`
> + 1 de `notifications.js` + 1 de `MiPerfilScreen.js`). No se encontró ningún
> conteo de 27 en el código.

### 6.3 Compartidos y no usados

- **Compartidos por web y móvil (5):** `POST /login`, `POST /auth/recuperar-password`,
  `POST /auth/reset-password`, `GET /planes/entrenamiento/:id_ciclo`,
  `GET /planes/nutricional/:id_ciclo`.
- **Solo web:** 54. **Solo móvil:** 23.
- **Sin uso en ninguno de los dos clientes (9):**
  `GET /usuarios/:id` (sí lo declara el cliente web en `services/api.js`, ver nota),
  `DELETE /afiliados/me/notas-ejercicio/:id_nota`,
  `GET /afiliados/me/ejercicios-disponibles`,
  `GET /afiliados/me/alimentos-disponibles`,
  `GET /progreso/resumen`, `PUT /progreso/resumen`,
  `GET /progreso/historial`, `GET /progreso/ejercicio/:idEjercicio/evolucion`,
  `GET /pagos`.

Nota de método: el listado "sin uso" es conservador; un endpoint podría llamarse
construyendo la URL en una variable (caso detectado: `GET /pagos/metricas` en
`frontend_web/src/views/FinanzasView.jsx:109-110`, ya incluido en el conteo web).
Las colecciones Postman sí incluyen endpoints que la web no usa
(p. ej. `GET /pagos` en `postman/MetaFit_API_Web.postman_collection.json`).

---

## 7. Advertencia sobre la integración continua (CI)

`.github/workflows/ci.yml` **solo se dispara en circumstances concretas**
(`.github/workflows/ci.yml:6-10`):

```yaml
on:
  push:
    branches: [main, feature/juan-carvajal]
  pull_request:
    branches: [main]
```

Consecuencias prácticas:

1. Un `push` a cualquier otra rama (por ejemplo `feature/otro-nombre`) **no ejecuta
   ningún test**.
2. Un pull request hacia una rama distinta de `main` **tampoco** corre la CI.
3. El job `deploy` solo corre en `refs/heads/main` (`.github/workflows/ci.yml:51`).
4. La CI ejecuta `npm test` en `backend`, `frontend_web` y `movil`
   (`.github/workflows/ci.yml:30-47`), con Node 20 (`.github/workflows/ci.yml:20-28`).

Si trabajas en una rama que no sea `main` ni `feature/juan-carvajal`, ejecuta las
pruebas localmente (`npm test` en cada paquete) antes de asumir que la CI validó
el cambio.

---

## 8. Verificación del conteo

| Verificación | Resultado |
|---|---|
| Archivos en `backend/routes/` | 12 |
| Llamadas `router.get/post/put/patch/delete(...)` en esos archivos | **91** |
| Suma por módulo (§3) | 3 + 7 + 40 + 4 + 2 + 9 + 6 + 12 + 1 + 2 + 1 + 4 = **91** |
| Montaje en `backend/server.js:143-154` | 12 `app.use(...)` |
| Endpoints auxiliares fuera del recuento | `/health`, `/api-docs`, `/swagger`, `/api-docs.json`, `/uploads` |
