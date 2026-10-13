# Cobertura Swagger — MetaFit API

> Documento generado midiendo la spec real (no las intenciones del código).
> Método: se requirió `backend/config/swagger.js` con el CWD en `backend/`
> (igual que hace `npm start`) y se comparó el objeto `paths` resultante contra
> los 91 endpoints extraídos de `backend/routes/*.js`.
> Todas las referencias son `archivo:línea` verificables en el repositorio.

---

## 1. Resumen ejecutivo

| Métrica | Valor |
|---|---:|
| Endpoints reales en `backend/routes/` (12 archivos) | **91** |
| Operaciones renderizadas en la spec | **74** |
| Paths declarados en la spec | **58** |
| Endpoints **sin** presencia en Swagger | **17** |
| **Grado de cobertura real** | **74 / 91 = 81,3 %** |
| Bloques `@swagger` descartados por error de YAML | 2 |
| Archivos de rutas omitidos en el array `apis` | 2 de 12 |
| Endpoints sin ninguna anotación `@swagger` | 13 |

Desglose de las 17 ausencias:

| Causa | Endpoints |
|---|---:|
| Sin bloque `@swagger` en el archivo | 13 |
| Con bloque `@swagger`, pero descartado por error de YAML | 2 |
| Con bloque `@swagger`, pero el archivo no está en `apis` | 2 |
| **Total** | **17** |

---

## 2. Cómo se genera y se sirve la documentación

### 2.1 Generación

| Elemento | Referencia |
|---|---|
| Librería: `swagger-jsdoc@^6.2.8` + `swagger-ui-express@^5.0.1` | `backend/package.json:39-40` |
| Objeto `options` (definition + `apis`) | `backend/config/swagger.js:7-234` |
| Spec construida al hacer `require` del módulo | `backend/config/swagger.js:237-239` |
| Montaje de Swagger UI en la app Express | `backend/server.js:160-176` |
| Punto de proceso (`app.listen`) | `backend/index.js` |

La spec **se regenera cada vez que arranca el servidor**: `swaggerJsdoc(options)`
se ejecuta en el nivel superior del módulo (`backend/config/swagger.js:237`).
En `backend/package.json:6-10` **no existe ningún script** que genere o valide la
spec de forma independiente (`start`, `dev`, `test`, `tunnel`); por lo tanto no
hay artefacto `swagger.json` versionado ni paso de CI que verifique la cobertura.

### 2.2 Endpoints de la documentación

| URL | Contenido | Referencia |
|---|---|---|
| `GET /api-docs/` | Swagger UI (HTML) | `backend/server.js:170` |
| `GET /swagger` | Alias amigable de la misma UI | `backend/server.js:171` |
| `GET /api-docs.json` | JSON crudo de la spec (para Postman) | `backend/server.js:173-176` |

Opciones de la UI (`backend/server.js:163-168`): `customSiteTitle: 'MetaFit API Docs'`,
`persistAuthorization: true` (recuerda el token entre recargas),
`displayRequestDuration`, `filter: true` y `tryItOutEnabled: true`.

**Verificación empírica** (servidor arrancado en local con credenciales de BD de
relleno): `GET /api-docs/` → `200 OK` y `GET /api-docs.json` → `200 OK`
con un cuerpo de 64 502 bytes.

### 2.3 Advertencia: la spec depende del directorio de trabajo

Los archivos del array `apis` se declaran con rutas relativas:

```js
// backend/config/swagger.js:223-234
apis: [
  './routes/authRoutes.js',
  ...
]
```

`swagger-jsdoc` las resuelve contra `process.cwd()`. Verificado: si se hace
`require('backend/config/swagger.js')` con CWD en la raíz del repositorio, la
spec resultante tiene **`paths = {}` (0 operaciones)**. Con CWD en `backend/`
(como ocurre al ejecutar `npm start`) produce **58 paths / 74 operaciones**.
Consecuencia: iniciar el proceso desde otra carpeta deja la documentación vacía
sin lanzar ningún error.

---

## 3. Anatomía de la spec

| Sección | Contenido | Referencia |
|---|---|---|
| Formato | OpenAPI **3.0.0** (`openapi: '3.0.0'`, inyectado por swagger-jsdoc) | `backend/config/swagger.js:8-9` |
| `info` | `title: MetaFit API`, `version: 1.0.0`, descripción con instrucciones de `POST /login` y Authorize, `contact: Equipo MetaFit`, `license: MIT` | `backend/config/swagger.js:11-29` |
| `servers` | Uno solo: `process.env.API_BASE_URL \|\| 'http://localhost:3001'` | `backend/config/swagger.js:34-35` |
| `tags` declarados | 7: `Autenticación`, `Usuarios (Personal)`, `Afiliados`, `Planes`, `Catálogos`, `Dashboard`, `Progreso`. **No** están en `swagger.js`: cada uno se declara en un bloque `tags:` superior dentro de un archivo de rutas (`afiliadoRoutes.js:25`, `authRoutes.js:27`, `catalogoRoutes.js:17`, `dashboardRoutes.js:15`, `planRoutes.js:20`, `progresoRoutes.js:18`, `usuarioRoutes.js:19`) y swagger-jsdoc los fusiona | `backend/routes/*.js` |
| `securitySchemes` | `bearerAuth` (http, bearer, JWT), descripción: token de `POST /login`, formato `Bearer <token>` | `backend/config/swagger.js:40-47` |
| `parameters` | `idParam` (ID numérico de recurso) | `backend/config/swagger.js:192-200` |
| `responses` | `Unauthorized` (401), `Forbidden` (403), `NotFound` (404), `InternalError` (500), todos con `$ref` a `ErrorResponse` | `backend/config/swagger.js:202-218` |
| `schemas` (10) | `ErrorResponse`, `LoginRequest`, `LoginResponse`, `Usuario`, `UsuarioCreate`, `Afiliado`, `AfiliadoCreate`, `Ciclo`, `Restriccion`, `DashboardKPIs` | `backend/config/swagger.js:49-190` |

Distribución por método de las 74 operaciones publicadas:

| Método | Operaciones |
|---|---:|
| GET | 33 |
| POST | 24 |
| DELETE | 8 |
| PATCH | 7 |
| PUT | 2 |
| **Total** | **74** |

### 3.1 Tags declarados vs. tags usados

| Tag | Declaración | Efecto en la UI |
|---|---|---|
| `Ciclos` | Bloque `tags:` en `cicloRoutes.js:19` y usado en `cicloRoutes.js:32,93` | No aparece: el archivo no está en `apis` (ver §4.3), así que su bloque tampoco se fusiona |
| `Notificaciones` | Usado en `notificacionRoutes.js:26`, **sin** bloque `tags:` superior en ningún archivo escaneado | La operación aparece agrupada bajo un tag que no tiene nombre ni descripción en `spec.tags` |

---

## 4. Cobertura endpoint por endpoint

Método de medida: se normalizaron los parámetros de ruta de Express (`:id`) a la
sintaxis OpenAPI (`{id}`) y se cruzó `method + path` contra `spec.paths`.

### 4.1 Cobertura por módulo

| Módulo (archivo) | Endpoints | En Swagger | Fuera |
|---|---:|---:|---:|
| Auth (`authRoutes.js`) | 3 | 3 | 0 |
| Usuarios (`usuarioRoutes.js`) | 7 | 5 | 2 |
| Afiliados (`afiliadoRoutes.js`) | 40 | 40 | 0 |
| Pagos (`pagoRoutes.js` + `pagoAdminRoutes.js`) | 4 | 0 | 4 |
| Ciclos (`cicloRoutes.js`) | 2 | 0 | 2 |
| Planes de entrenamiento (`planRoutes.js`) | 9 | 8 | 1 |
| Planes nutricionales (`planRoutes.js`) | 6 | 5 | 1 |
| Catálogos (`catalogoRoutes.js`) | 12 | 8 | 4 |
| Dashboard (`dashboardRoutes.js`) | 1 | 1 | 0 |
| Configuración (`configuracionRoutes.js`) | 2 | 0 | 2 |
| Notificaciones (`notificacionRoutes.js`) | 1 | 1 | 0 |
| Progreso (`progresoRoutes.js`) | 4 | 3 | 1 |
| **Total** | **91** | **74** | **17** |

### 4.2 Los 13 endpoints sin anotación `@swagger`

Todos están en archivos incluidos en `apis`; simplemente nunca se documentaron.

| # | Método y ruta | `archivo:línea` | Observación |
|---:|---|---|---|
| 1 | `PUT /usuarios/me/push-token` | `usuarioRoutes.js:47` | — |
| 2 | `GET /usuarios/recepcionistas` | `usuarioRoutes.js:49` | — |
| 3 | `GET /afiliados/:id/pagos` | `pagoRoutes.js:19` | Comentario en prosa (`pagoRoutes.js:5-8`), sin `@swagger` |
| 4 | `POST /afiliados/:id/pagos` | `pagoRoutes.js:22` | Ídem |
| 5 | `PUT /catalogo/ejercicios/:id` | `catalogoRoutes.js:95` | Solo `GET` (bloque en `catalogoRoutes.js:23`) y `POST` (`catalogoRoutes.js:57`) tienen anotación |
| 6 | `DELETE /catalogo/ejercicios/:id` | `catalogoRoutes.js:96` | Ídem |
| 7 | `PUT /catalogo/alimentos/:id` | `catalogoRoutes.js:172` | Solo `GET` (`catalogoRoutes.js:99`) y `POST` (`catalogoRoutes.js:136`) documentados |
| 8 | `DELETE /catalogo/alimentos/:id` | `catalogoRoutes.js:173` | Ídem |
| 9 | `PATCH /planes/nutricional/:id` | `planRoutes.js:511` | El bloque `@swagger` de la línea 471 documenta `POST /planes/nutricional/{id_plan}/detalle`, no este |
| 10 | `GET /configuracion/precio-membresia` | `configuracionRoutes.js:9` | `configuracionRoutes.js` tiene **0** anotaciones |
| 11 | `PUT /configuracion/precio-membresia` | `configuracionRoutes.js:10` | Ídem |
| 12 | `GET /pagos` | `pagoAdminRoutes.js:18` | `pagoAdminRoutes.js` tiene **0** anotaciones, pese a que su cabecera promete «los bloques @swagger de cada una» (`pagoAdminRoutes.js:7`) |
| 13 | `GET /pagos/metricas` | `pagoAdminRoutes.js:19` | Ídem |

### 4.3 Los 2 endpoints fuera del array `apis`

`backend/config/swagger.js:223-234` lista **10 de los 12** archivos de rutas.
Faltan `./routes/cicloRoutes.js` y `./routes/pagoAdminRoutes.js`.

| Método y ruta | Anotación presente en | Resultado |
|---|---|---|
| `PATCH /ciclos/:id_ciclo` | `cicloRoutes.js:25` (ruta en `cicloRoutes.js:81`) | Descartada: el archivo nunca se escanea |
| `DELETE /ciclos/:id_ciclo` | `cicloRoutes.js:84` (ruta en `cicloRoutes.js:113`) | Descartada: el archivo nunca se escanea |

(`pagoAdminRoutes.js` también está fuera de `apis`, pero además no tiene
anotaciones, por lo que su inclusión no añadiría operaciones sin escribir
documentación nueva.)

### 4.4 Los 2 endpoints con anotación descartada por error de YAML

Al arrancar, `swagger-jsdoc` imprime exactamente este aviso (verificado en
consola):

```
Not all input has been taken into account at your final specification.

Error in routes\planRoutes.js :
YAMLSemanticError: Nested mappings are not allowed in compact mappings at line 26, column 22:
        description: Grupo muscular por el que filtrar (default: enfoque_muscul…

Error in routes\progresoRoutes.js :
YAMLSemanticError: Nested mappings are not allowed in compact mappings at line 14, column 22:
        description: Fecha del resumen (YYYY-MM-DD). Default: hoy.
```

| Método y ruta | Bloque `@swagger` | Causa raíz |
|---|---|---|
| `GET /planes/entrenamiento/:id_ciclo/rutina/:dia_numero` | `planRoutes.js:80` (ruta en `planRoutes.js:129`) | Valor de `description:` sin comillas que contiene `: ` («default: …»); YAML interpreta un mapa anidado y descarta **todo** el bloque |
| `GET /progreso/resumen` | `progresoRoutes.js:24` (ruta en `progresoRoutes.js:62`) | Igual: «(YYYY-MM-DD). Default: hoy.» con dos puntos sin comillas |

Efecto colateral: `GET /progreso/resumen` tampoco queda documentado pese a tener
una de las anotaciones más extensas del proyecto. La solución es envolver esos
`description:` entre comillas simples o usar el operador `>` de YAML
(el propio archivo ya usa `description: >` en otros bloques, p. ej.
`planRoutes.js:84`).

### 4.5 Checklist de cobertura completa

| Endpoint en la spec | Estado |
|---|---|
| `security` con `bearerAuth` en operaciones protegidas | Presente en las 74 publicadas |
| `tags` por operación | Presente |
| `401/403/404/500` con `$ref` a `components/responses` | Presente en la mayoría de bloques |
| `requestBody` con esquema en los `POST`/`PATCH` | Presente en los bloques de creación/edición |
| `servers` de producción en la spec | **Ausente**: solo `http://localhost:3001`, salvo que exista `API_BASE_URL` (`config/swagger.js:34`) |

---

## 5. Cobertura cruzada con los clientes y Postman

Detalle del consumo de endpoints en `API_REST_METAFIT.md`, §6. Resumen de
relevancia para Swagger:

| Cliente / artefacto | Endpoints | ¿Coincide con Swagger? |
|---|---:|---|
| Web (`frontend_web/src`) | 59 de 91 | Casi todo está documentado; la web usa también `GET /health` (fuera de los 91 y sin documentar) |
| Móvil (`movil/src`) | 28 de 91 | Coincide con la cobertura: el móvil usa rutas `/me` y `/historial` que sí están anotadas |
| Colección `postman/MetaFit_API_Web.postman_collection.json` | 55 peticiones | Incluye endpoints **fuera** de la spec (`GET /pagos`, `PUT/DELETE /catalogo/...`, `GET|PUT /configuracion/precio-membresia`) |
| Colección `postman/MetaFit_API_Movil.postman_collection.json` | 16 peticiones | Subconjunto del móvil |

Los 9 endpoints que no consume ningún cliente (ver `API_REST_METAFIT.md` §6.3)
incluyen los 4 de configuración y pagos sin documentar, lo que explica en parte
por qué la ausencia de Swagger no se detectó antes.

### 5.1 Importación en Postman

1. Abrir `GET https://metafit-backend-rr18.onrender.com/api-docs.json`
   (o `http://localhost:3001/api-docs.json` en desarrollo).
2. En Postman: **Import → Link** (o pegar el JSON).
3. El esquema `bearerAuth` no se autoaplica en Postman: usar la variable
   `token` del environment `postman/MetaFit_Environment.postman_environment.json`.

---

## 6. Hallazgos y recomendaciones (sin modificar código)

| # | Hallazgo | Impacto | Evidencia |
|---:|---|---|---|
| 1 | 17 de 91 endpoints no existen en Swagger (81,3 %) | La UI no es un catálogo completo; un consumidor nuevo no ve pagos, configuración ni ciclos | §4 |
| 2 | Dos archivos de rutas fuera de `apis` | 2 endpoints y el tag `Ciclos` desaparecen | `config/swagger.js:223-234` |
| 3 | Dos bloques descartados por YAML sin comillas | 2 endpoints invisibles con aviso en cada arranque | §4.4 |
| 4 | `configuracionRoutes.js` y `pagoAdminRoutes.js` sin ninguna anotación (4 endpoints) | Zona ciega total | §4.2 |
| 5 | La spec depende de `process.cwd()` | Arrancar desde la raíz produce `paths = {}` sin error | §2.3 |
| 6 | `servers` solo declara `localhost` | En prod, «Try it out» apunta a una URL local salvo `API_BASE_URL` | `config/swagger.js:34` |
| 7 | No hay script ni paso de CI que valide la spec | La cobertura puede degradarse sin detectarse (la CI además solo corre en `main` y `feature/juan-carvajal`, `.github/workflows/ci.yml:6-10`) | `backend/package.json:6-10` |

---

## 7. Verificación

| Comprobación | Resultado |
|---|---|
| `GET /api-docs/` (servidor local) | `200 OK` |
| `GET /api-docs.json` (servidor local) | `200 OK`, 64 502 bytes |
| `Object.keys(spec.paths).length` con CWD=`backend/` | 58 |
| Operaciones (`paths[p][method]`) | 74 |
| Endpoints en `backend/routes/` | 91 |
| `74 + 17 = 91` | Correcto |
| Avisos de `swagger-jsdoc` en consola | 2 (`planRoutes.js`, `progresoRoutes.js`) |
