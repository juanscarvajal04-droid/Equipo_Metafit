# 👥 API Afiliados

> CRUD completo, ciclos, progreso, restricciones, seguimiento diario

---

## 📋 Endpoints CRUD

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 1 | **GET** | `/afiliados` | Staff | Lista todos (paginable `?page=&limit=`) |
| 2 | **GET** | `/afiliados/me` | Auth | Perfil del afiliado autenticado |
| 3 | **GET** | `/afiliados/:id` | Staff | Perfil completo por ID |
| 4 | **POST** | `/afiliados` | Admin/Recepcionista | Crear (usuario + perfil en transacción) |
| 5 | **PATCH** | `/afiliados/:id` | Admin/Recepcionista | Actualización parcial |
| 6 | **DELETE** | `/afiliados/:id` | Admin | Eliminar (FK RESTRICT bloquea si tiene datos) |

---

## 📷 Fotos de Perfil

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 7 | **POST** | `/afiliados/me/foto` | Auth + uploadFoto | Subir mi foto (multipart, campo "foto") |
| 8 | **POST** | `/afiliados/:id/foto` | Admin/Recepcionista + uploadFoto | Subir foto de afiliado |

---

## 🔄 Ciclos de Entrenamiento

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 9 | **GET** | `/afiliados/:id/ciclos` | Staff | Todos los ciclos históricos |
| 10 | **GET** | `/afiliados/me/ciclos` | Auth | Mis ciclos |
| 11 | **POST** | `/afiliados/ciclos` | Admin/Entrenador | Crear ciclo (trigger cierra el anterior) |

---

## 🏥 Restricciones Médicas

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 12 | **GET** | `/afiliados/:id/restricciones` | Staff | Restricciones activas |
| 13 | **GET** | `/afiliados/me/restricciones` | Auth | Mis restricciones |
| 14 | **POST** | `/afiliados/:id/restricciones` | Admin/Entrenador | Asignar restricción |
| 15 | **DELETE** | `/afiliados/:id/restricciones/:id_restriccion` | Admin/Entrenador | Remover restricción |

---

## 📊 Progreso Físico

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 16 | **GET** | `/afiliados/:id/progreso` | Staff | Historial de mediciones con IMC |
| 17 | **GET** | `/afiliados/me/progreso` | Auth | Mi historial de progreso |
| 18 | **POST** | `/afiliados/progreso` | Admin/Entrenador | Registrar medición |

```js
// POST /afiliados/progreso
// Body: {
//   "id_afiliado": 1,
//   "id_ciclo": 3,
//   "peso_kg": 75.5,
//   "porcentaje_grasa": 18.5,
//   "medida_cintura": 82,
//   "medida_cadera": 95,
//   "medida_pecho": 100
// }
// IMC se calcula automáticamente
// Rechaza duplicados por fecha + ciclo
```

---

## 🏋️ Catálogos Filtrados

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 19 | **GET** | `/afiliados/:id/ejercicios-disponibles` | Staff | Ejercicios sin restricciones del afiliado |
| 20 | **GET** | `/afiliados/:id/alimentos-disponibles` | Staff | Alimentos sin restricciones del afiliado |

---

## 📱 Seguimiento Diario (App Móvil)

| # | Método | Ruta | Middleware | Descripción |
|---|---|---|---|---|
| 21 | **POST** | `/afiliados/me/progreso-ejercicio` | Auth | Marcar ejercicios completados/no |
| 22 | **GET** | `/afiliados/me/progreso-ejercicio/:idCiclo/:fecha` | Auth | Estado de ejercicios de un día |
| 23 | **POST** | `/afiliados/me/agua` | Auth | Registrar vasos de agua |
| 24 | **GET** | `/afiliados/me/agua/:fecha` | Auth | Obtener vasos de una fecha |
| 25 | **POST** | `/afiliados/me/consumo-alimento` | Auth | Guardar consumo de alimentos |

---

## 📎 Notas Relacionadas

- [[Autenticación]]
- [[Base de datos MySQL]]
- [[PlanEntrenamiento y Nutrición|Planes]]
- [[Cloudinary]]
