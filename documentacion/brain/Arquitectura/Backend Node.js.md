# ⚙️ Backend Node.js

> API REST con Express — Puerto 3001

---

## 📁 Estructura de Carpetas

```
backend/
├── index.js                  # Punto de entrada (migraciones, cron, listen)
├── server.js                 # Express app + middleware global
├── config/
│   └── db.js                 # Pool MySQL (mysql2/promise)
├── routes/
│   ├── authRoutes.js         # Login, recuperar/reset password
│   ├── usuarioRoutes.js      # CRUD personal (staff)
│   ├── afiliadoRoutes.js     # CRUD afiliados + ciclos + progreso
│   ├── pagoRoutes.js         # Pagos por afiliado
│   ├── pagoAdminRoutes.js    # Vista admin de pagos + métricas
│   ├── planRoutes.js         # Planes entrenamiento + nutrición
│   ├── catalogoRoutes.js     # Catálogo ejercicios, alimentos, restricciones
│   ├── configuracionRoutes.js # Precio membresía
│   ├── dashboardRoutes.js    # KPIs
│   └── notificacionRoutes.js # Notificaciones por rol
├── controllers/              # 9 controllers
├── services/
│   ├── authService.js        # JWT + bcrypt
│   ├── correoService.js      # Brevo API + SMTP fallback
│   ├── facturaService.js     # Envío de facturas
│   └── afiliadoService.js    # Lógica de afiliados
├── models/                   # Queries MySQL directas
├── middlewares/
│   ├── auth.js               # JWT + RBAC (6 middlewares)
│   └── uploadFoto.js         # Multer (Cloudinary o disco)
├── migrations/               # Migraciones JS idempotentes
├── cron/
│   └── recordatorioPagos.js  # Cron cada hora
├── templates/                # HTML templates (correo)
├── uploads/                  # Fotos locales (fallback)
└── package.json
```

---

## 🛡️ Middlewares de Seguridad (server.js)

```js
// CORS — temporalmente abierto para pruebas en red SENA
app.use(cors({ origin: '*' }));

// Helmet — cabeceras seguras
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiting en login — 10 intentos / 15 min
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
});

// Validación Content-Type — POST/PUT/PATCH requieren JSON o multipart
app.use((req, res, next) => {
  if (!isSwaggerPath && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    if (!(ct.includes('application/json') || ct.includes('multipart/form-data'))) {
      return res.status(415).json({ error: 'Content-Type debe ser application/json' });
    }
  }
  next();
});

// Body limit — 50KB
app.use(express.json({ limit: '50kb' }));
```

---

## 🔑 Autenticación JWT (middlewares/auth.js)

```js
// Verifica token Bearer del header Authorization
const requireAuth = (req, res, next) => {
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  req.user = jwt.verify(token, SECRET);
  next();
};

// 6 middlewares de autorización:
// requireAuth           → JWT válido
// requireAdmin          → Solo Administrador
// requireAdminOrEntrenador → Admin o Entrenador
// requireAdminOrRecepcionista → Admin o Recepcionista
// requireStaff          → Admin, Entrenador o Recepcionista
// requireOwnCiclo       → Afiliado solo ve su propio ciclo
```

---

## 🔌 Montaje de Rutas (server.js)

```js
app.use('/login', loginLimiter);
app.use('/', authRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/afiliados', afiliadoRoutes);
app.use('/afiliados', pagoRoutes);        // Montado también aquí
app.use('/pagos', pagoAdminRoutes);
app.use('/planes', planRoutes);
app.use('/catalogo', catalogoRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/configuracion', configuracionRoutes);
app.use('/notificaciones', notificacionRoutes);
```

---

## 🏥 Health Check

```js
app.get('/health', async (req, res) => {
  // Ejecuta SELECT 1 a MySQL
  // Responde: { status: 'ok', db: 'MySQL conectado', timestamp: '...' }
});
```

---

## 📚 Swagger UI

```js
app.use('/api-docs', swaggerUi.serve, swaggerSetup);
app.use('/swagger', swaggerUi.serve, swaggerSetup);  // alias
app.get('/api-docs.json', (req, res) => { ... });     // JSON crudo
```

---

## ⏰ Cron Jobs

```js
// Recordatorio de pagos — cada hora
// Busca pagos con vencimiento en 3 días
// Envía correo al afiliado
// Usa tabla PAGO_RECORDATORIO para evitar reenvíos
```

---

## 🚀 Secuencia de Arranque (index.js)

1. `dotenv.config()` — carga `.env`
2. `config/db.js` — crea pool MySQL
3. `passwordResetModel.ensureTable()` — tabla PASSWORD_RESET
4. `migracionFotos.runMigraciones()` — columna `AFILIADO.foto`
5. `migracionPushToken.runMigraciones()` — columna `USUARIO.push_token`
6. `iniciarCron()` — cron de recordatorios
7. `app.listen(PORT)` — arranca Express

---

## 📎 Notas Relacionadas

- [[Autenticación]]
- [[Base de datos MySQL]]
- [[Render]]
- [[Diagrama general]]
- [[CI-CD]]
