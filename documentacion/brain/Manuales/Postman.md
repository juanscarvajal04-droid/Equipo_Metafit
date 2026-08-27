# 📬 Manual de Postman

> Colecciones y guía para consumir la API de MetaFit

---

## 🔗 URL Base

```
Producción:  https://metafit-backend-rr18.onrender.com
Desarrollo:  http://localhost:3001
Swagger:     https://metafit-backend-rr18.onrender.com/api-docs
JSON Spec:   https://metafit-backend-rr18.onrender.com/api-docs.json
```

---

## 📥 Importar Colección

1. Abrir Postman
2. Import → Raw text → pegar JSON de `/api-docs.json`
3. O importar desde `postman/` en el repositorio

---

## 🔑 Autenticación

### Login
```http
POST /login
Content-Type: application/json

{
  "correo": "admin@metafit.com",
  "contrasena": "Admin123!"
}

# Response → copiar accessToken
```

### Usar Token
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Guardar como Variable
```
En Postman → Variables → add:
  Key: token
  Value: (pegar accessToken)
  
Usar en requests: {{token}}
```

---

## 📋 Endpoints Principales

### Afiliados
```http
GET    /afiliados                          # Lista todos (Staff)
GET    /afiliados/me                       # Mi perfil (Afiliado)
GET    /afiliados/:id                      # Perfil por ID
POST   /afiliados                          # Crear (Admin/Recepcionista)
PATCH  /afiliados/:id                      # Actualizar
DELETE /afiliados/:id                      # Eliminar (Admin)
POST   /afiliados/:id/foto                 # Subir foto (multipart)
```

### Pagos
```http
GET    /afiliados/:id/pagos                # Historial de pagos
POST   /afiliados/:id/pagos                # Registrar pago
GET    /pagos                              # Todos los pagos (Admin)
GET    /pagos/metricas                     # Métricas (Admin)
```

### Planes
```http
GET    /planes/entrenamiento/:id_ciclo     # Ver plan entrenamiento
POST   /planes/entrenamiento               # Crear plan
POST   /planes/rutinas                     # Crear rutina
POST   /planes/rutinas/:id/ejercicios      # Agregar ejercicio
GET    /planes/nutricional/:id_ciclo       # Ver plan nutricional
POST   /planes/nutricional                 # Crear plan
POST   /planes/nutricional/:id/detalle     # Agregar alimento
```

### Catálogos
```http
GET    /catalogo/ejercicios                # Ejercicios
POST   /catalogo/ejercicios                # Crear ejercicio
GET    /catalogo/alimentos                 # Alimentos
POST   /catalogo/alimentos                 # Crear alimento
GET    /catalogo/restricciones             # Restricciones médicas
```

### Otros
```http
GET    /dashboard/kpis                     # KPIs (Admin)
GET    /notificaciones                     # Notificaciones por rol
GET    /configuracion/precio-membresia     # Precio actual (Admin)
GET    /health                             # Health check
```

---

## 📷 Subir Foto (multipart)

```
POST /afiliados/1/foto
Content-Type: multipart/form-data

form-data:
  foto: (seleccionar archivo imagen)

Límites: 5MB, formatos: png/jpg/jpeg/webp/gif
```

---

## ⚠️ Errores Comunes

| Código | Significado |
|---|---|
| 400 | Campos requeridos faltantes |
| 401 | Token inválido o expirado |
| 403 | Rol insuficiente |
| 404 | Recurso no encontrado |
| 409 | Correo duplicado (ER_DUP_ENTRY) |
| 415 | Content-Type incorrecto |
| 429 | Rate limit excedido |

---

## 📎 Notas Relacionadas

- [[Autenticación]]
- [[Afiliados]]
- [[Pagos]]
- [[Planes]]
- [[Backend Node.js]]
