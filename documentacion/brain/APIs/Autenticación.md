# 🔐 Autenticación

> Login JWT, recuperación de contraseña, rate limiting

---

## Endpoints

| Método | Ruta | Middlewares | Descripción |
|---|---|---|---|
| **POST** | `/login` | `loginLimiter` | Login con correo + contraseña → JWT 8h |
| **POST** | `/auth/recuperar-password` | `recuperarLimiter` | Genera token de un solo uso (15 min), envía correo |
| **POST** | `/auth/reset-password` | — | Aplica nueva contraseña con token válido |

---

## 🔑 Flujo de Login

```js
// POST /login
// Body: { "correo": "user@email.com", "contrasena": "123456" }

// Response exitoso:
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": 1,
    "email": "admin@metafit.com",
    "role": "Administrador",
    "nombres": "Juan",
    "apellidos": "Pérez"
  }
}

// Errores posibles:
// 400 → Correo y contraseña requeridos
// 401 → Correo o contraseña incorrectos
// 403 → Cuenta no activa
// 429 → Demasiados intentos (15 min)
```

---

## 🛡️ Rate Limiting

```js
// Login: 10 intentos / 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,  // No cuenta logins exitosos
});

// Recuperar password: 5 intentos / 15 min
const recuperarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});
```

---

## 🔑 Flujo de Recuperación de Contraseña

```
1. Usuario solicita recuperación → POST /auth/recuperar-password
2. Sistema genera JWT de un solo uso (expira en 15 min)
3. Sistema invalida tokens anteriores del mismo usuario
4. Envía correo con enlace (Brevo API → SMTP fallback)
5. Si no hay servicio de correo → devuelve token en JSON (modo prueba)
6. Siempre responde 200 (no revela si el correo existe)

7. Usuario hace clic en enlace → GET /reset-password/:token
8. Envía nueva contraseña → POST /auth/reset-password
9. Sistema verifica: JWT válido + no expirado + no usado en BD
10. Hashea nueva contraseña (bcrypt 12 rondas)
11. Marca token como usado (transacción)
```

---

## 🛡️ Seguridad

```js
// Contraseñas: bcrypt con 12 rondas
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// JWT payload:
{
  "sub": user.id_usuario,    // ID del usuario
  "email": user.correo,      // Correo electrónico
  "role": user.rol,          // Administrador|Entrenador|Recepcionista|Afiliado
  "iat": 1234567890,         // Emitido en
  "exp": 1234596690          // Expira en 8 horas
}
```

---

## 🔐 RBAC — Control de Acción por Rol

| Rol | Puede |
|---|---|
| **Administrador** | Todo |
| **Entrenador** | Afiliados (lectura), ciclos, planes, catálogos, restricciones |
| **Recepcionista** | Afiliados (CRUD), pagos por afiliado |
| **Afiliado** | Solo sus datos (`/me`), seguimiento diario |

---

## 📎 Notas Relacionadas

- [[Backend Node.js]]
- [[Afiliados]]
- [[Historial de bugs]]
- [[ManualPostman|Postman]]
