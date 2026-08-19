# 📖 Manual Técnico

> Arquitectura, seguridad, endpoints y configuración del sistema

---

## 🏗️ Arquitectura

Ver [[Diagrama general]] para la visión completa de los 4 componentes.

### Stack
| Capa | Tecnología |
|---|---|
| Runtime | Node.js 22 + Express |
| BD | MySQL 8.0 (mysql2/promise) |
| Auth | JWT (8h) + bcrypt (12 rondas) |
| Frontend | React 19 + Vite 6 |
| Móvil | Expo 55 + React Native 0.83 |
| Deploy | Render (BE) + Railway (DB) |

---

## 🔒 Seguridad

### Autenticación
- JWT con expiración de 8 horas
- Bcrypt con 12 rondas de hashing
- Tokens de reset de un solo uso (15 min)

### Autorización (RBAC)
Ver [[Autenticación]] → sección RBAC.

### Rate Limiting
- `/login`: 10 intentos / 15 min
- `/auth/recuperar-password`: 5 intentos / 15 min

### Headers Seguros
- Helmet habilitado (CSP deshabilitado para Swagger)
- Validación Content-Type en POST/PUT/PATCH

---

## 🔌 API Reference

Ver documentación completa en [[Autenticación]], [[Afiliados]], [[Pagos]], [[Planes]], [[Notificaciones]].

### Swagger UI
```
GET /api-docs    → Documentación interactiva
GET /swagger     → Alias
GET /api-docs.json → JSON crudo (para Postman)
```

### Health Check
```
GET /health → { status: 'ok', db: 'MySQL conectado', timestamp }
```

---

## 🗄️ Base de Datos

Ver [[Base de datos MySQL]] para esquema completo.

### Migraciones al Arrancar
1. `ensureTable()` → tabla PASSWORD_RESET
2. `migracionFotos.js` → columna `AFILIADO.foto`
3. `migracionPushToken.js` → columna `USUARIO.push_token`

---

## 📁 Estructura Backend

```
backend/
├── index.js           → Punto de entrada
├── server.js          → Express + middleware
├── config/db.js       → Pool MySQL
├── routes/            → 10 archivos de rutas
├── controllers/       → 9 controllers
├── services/          → authService, correoService, facturaService
├── models/            → Queries MySQL
├── middlewares/        → auth.js, uploadFoto.js
├── migrations/        → Migraciones JS idempotentes
├── cron/              → recordatorioPagos.js
├── templates/         → HTML para correos
└── uploads/           → Fotos locales (fallback)
```

---

## 📎 Notas Relacionadas

- [[Diagrama general]]
- [[Backend Node.js]]
- [[Base de datos MySQL]]
- [[Render]]
