/**
 * server.cjs — MetaFit API Server
 * ─────────────────────────────────────────────────────────────────────────────
 * - POST /login            → autentica con correo + contraseña, devuelve JWT
 * - GET  /660/afiliados    → requiere JWT, devuelve todos los afiliados
 * - GET  /660/usuarios     → requiere JWT
 * - GET  /440/ejercicios   → requiere JWT (solo lectura)
 * - GET  /440/alimentos    → requiere JWT (solo lectura)
 * ─────────────────────────────────────────────────────────────────────────────
 * Usa Express 5 (ya instalado) + jsonwebtoken + la DB en metafit_nosql.json
 */

const express = require("express");
const fs      = require("fs");
const path    = require("path");
const crypto  = require("crypto");

const app    = express();
const PORT   = 3001;
const DB     = path.join(__dirname, "metafit_nosql.json");
const SECRET = "metafit_jwt_secret_2024";   // cámbialo en producción

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(express.json());

// CORS: permite que Vite (puerto 5173) acceda sin restricciones en desarrollo
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Lee la base de datos del JSON */
const readDB = () => JSON.parse(fs.readFileSync(DB, "utf-8"));

/** Escribe la base de datos al JSON */
const writeDB = (data) => fs.writeFileSync(DB, JSON.stringify(data, null, 2));

/** JWT mínimo sin dependencias externas (HS256) */
const base64url = (str) =>
  Buffer.from(str).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const signJWT = (payload) => {
  const header  = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body    = base64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }));
  const sig     = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
};

const verifyJWT = (token) => {
  try {
    const [header, body, sig] = token.split(".");
    const expected = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
};

/** Middleware de autenticación JWT */
const requireAuth = (req, res, next) => {
  const header = req.headers["authorization"] || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Token requerido" });
  const payload = verifyJWT(token);
  if (!payload) return res.status(401).json({ message: "Token inválido o expirado" });
  req.user = payload;
  next();
};

/**
 * Middleware exclusivo para Administrador.
 * Busca el user en la DB por sub (id del JWT) y verifica que role === 'Administrador'.
 * Debe ejecutarse DESPUÉS de requireAuth.
 */
const requireAdmin = (req, res, next) => {
  const db   = readDB();
  const self = (db.users || []).find((u) => u.id === req.user.sub);
  if (!self || self.role !== "Administrador") {
    return res.status(403).json({ message: "Acceso denegado: solo el Administrador puede realizar esta acción." });
  }
  next();
};

// ── Rutas públicas ────────────────────────────────────────────────────────────

/**
 * POST /login
 * Body: { email, password }
 *   → busca en la colección "users" del JSON
 *   → devuelve { accessToken, user }
 */
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Correo y contraseña son requeridos" });

  const db   = readDB();
  const user = (db.users || []).find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Credenciales incorrectas" });

  const { password: _, ...safeUser } = user;
  const accessToken = signJWT({ sub: user.id, email: user.email });

  // Buscar el perfil completo en 'usuarios' para devolver nombres y apellidos
  const profile = (db.usuarios || []).find(
    (u) => (u._id ?? u.id) === user.id || u.correo === user.email
  );
  const fullUser = profile
    ? { ...safeUser, nombres: profile.nombres || "", apellidos: profile.apellidos || "" }
    : safeUser;

  return res.json({ accessToken, user: fullUser });
});

/**
 * POST /register
 * Body: { email, password }
 */
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Correo y contraseña son requeridos" });

  const db = readDB();
  if (!db.users) db.users = [];
  if (db.users.find((u) => u.email === email))
    return res.status(400).json({ message: "El correo ya está registrado" });

  const newUser = { id: Date.now(), email, password };
  db.users.push(newUser);
  writeDB(db);

  const { password: _, ...safeUser } = newUser;
  const accessToken = signJWT({ sub: newUser.id, email: newUser.email });
  return res.status(201).json({ accessToken, user: safeUser });
});

// ── Rutas protegidas (/660/... requiere JWT) ──────────────────────────────────

// Colecciones de solo lectura pública (entre empleados) — requieren JWT
const PROTECTED = ["afiliados", "ejercicios", "alimentos"];

PROTECTED.forEach((col) => {
  // GET /660/:col  o  /440/:col
  app.get(/^\/(660|440)\//, requireAuth, (req, res) => {
    const colName = req.path.split("/")[2];
    const db = readDB();
    if (!db[colName]) return res.status(404).json({ message: `Colección "${colName}" no encontrada` });
    return res.json(db[colName]);
  });

  // GET /660/:col/:id
  app.get(/^\/(660|440)\/[^/]+\/\d+$/, requireAuth, (req, res) => {
    const parts   = req.path.split("/");
    const colName = parts[2];
    const id      = parseInt(parts[3], 10);
    const db      = readDB();
    const item    = (db[colName] || []).find((i) => (i.id ?? i._id) === id);
    if (!item) return res.status(404).json({ message: "Recurso no encontrado" });
    return res.json(item);
  });
});

// ── Rutas sin prefijo: CRUD para afiliados, ejercicios, alimentos (JWT requerido) ──
PROTECTED.forEach((col) => {
  // GET /afiliados
  app.get(`/${col}`, requireAuth, (req, res) => {
    const db = readDB();
    return res.json(db[col] || []);
  });

  // GET /afiliados/:id
  app.get(`/${col}/:id`, requireAuth, (req, res) => {
    const db   = readDB();
    const id   = parseInt(req.params.id, 10);
    const item = (db[col] || []).find((i) => (i.id ?? i._id) === id);
    if (!item) return res.status(404).json({ message: "No encontrado" });
    return res.json(item);
  });

  // POST /afiliados
  app.post(`/${col}`, requireAuth, (req, res) => {
    const db = readDB();
    if (!db[col]) db[col] = [];
    const newItem = { ...req.body, fecha_creacion: new Date().toISOString() };
    db[col].push(newItem);
    writeDB(db);
    return res.status(201).json(newItem);
  });

  // PUT /afiliados/:id
  app.put(`/${col}/:id`, requireAuth, (req, res) => {
    const db  = readDB();
    const id  = parseInt(req.params.id, 10);
    const idx = (db[col] || []).findIndex((i) => (i.id ?? i._id) === id);
    if (idx === -1) return res.status(404).json({ message: "No encontrado" });
    db[col][idx] = { ...db[col][idx], ...req.body, id };
    db[col][idx].fecha_ultima_modificacion = new Date().toISOString();
    writeDB(db);
    return res.json(db[col][idx]);
  });

  // PATCH /afiliados/:id
  app.patch(`/${col}/:id`, requireAuth, (req, res) => {
    const db  = readDB();
    const id  = parseInt(req.params.id, 10);
    const idx = (db[col] || []).findIndex((i) => (i.id ?? i._id) === id);
    if (idx === -1) return res.status(404).json({ message: "No encontrado" });
    db[col][idx] = { ...db[col][idx], ...req.body };
    db[col][idx].fecha_ultima_modificacion = new Date().toISOString();
    writeDB(db);
    return res.json(db[col][idx]);
  });

  // DELETE /afiliados/:id
  app.delete(`/${col}/:id`, requireAuth, (req, res) => {
    const db  = readDB();
    const id  = parseInt(req.params.id, 10);
    const idx = (db[col] || []).findIndex((i) => (i.id ?? i._id) === id);
    if (idx === -1) return res.status(404).json({ message: "No encontrado" });
    const deleted = db[col].splice(idx, 1)[0];
    writeDB(db);
    return res.json(deleted);
  });
});

// ── 🛡️ Rutas de USUARIOS — Solo Administrador ─────────────────────────────────
// GET /usuarios  — listar todo el personal (requiere JWT, disponible para Admin UI)
app.get("/usuarios", requireAuth, (req, res) => {
  const db = readDB();
  // Devolvemos 'usuarios' (datos de perfil), sincronizados con 'users' (auth)
  return res.json(db.usuarios || []);
});

// GET /usuarios/:id
app.get("/usuarios/:id", requireAuth, requireAdmin, (req, res) => {
  const db   = readDB();
  const id   = parseInt(req.params.id, 10);
  const item = (db.usuarios || []).find((u) => (u.id ?? u._id) === id);
  if (!item) return res.status(404).json({ message: "Usuario no encontrado" });
  return res.json(item);
});

/**
 * POST /usuarios — Crear nuevo empleado (Solo Admin)
 * Crea el registro en 'usuarios' Y en 'users' (para autenticación).
 */
app.post("/usuarios", requireAuth, requireAdmin, (req, res) => {
  const { email, password, role, nombres, apellidos, estado_cuenta } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ message: "email, password y role son obligatorios." });
  }

  const db = readDB();
  if (!db.users)    db.users    = [];
  if (!db.usuarios) db.usuarios = [];

  // Verificar duplicado
  if (db.users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "Ya existe un empleado con ese correo." });
  }

  const newId = Date.now();

  // Documento de autenticación (users)
  const authUser = { id: newId, email, password, role };
  db.users.push(authUser);

  // Documento de perfil (usuarios)
  const profileUser = {
    _id: newId,
    nombres:       nombres    || "",
    apellidos:     apellidos  || "",
    correo:        email,
    rol:           role,
    role,
    estado_cuenta: estado_cuenta || "Activo",
    fecha_registro: new Date().toISOString(),
  };
  db.usuarios.push(profileUser);

  writeDB(db);

  const { password: _, ...safeAuth } = authUser;
  return res.status(201).json({ ...profileUser, ...safeAuth });
});

// PATCH /usuarios/:id — Editar empleado (Solo Admin: puede cambiar rol, estado, email, password)
app.patch("/usuarios/:id", requireAuth, requireAdmin, (req, res) => {
  const db    = readDB();
  const id    = parseInt(req.params.id, 10);

  // Actualizar en 'usuarios' (perfil)
  const uIdx = (db.usuarios || []).findIndex((u) => (u._id ?? u.id) === id);
  if (uIdx === -1) return res.status(404).json({ message: "Usuario no encontrado" });

  const { email, password, role, ...rest } = req.body;
  db.usuarios[uIdx] = {
    ...db.usuarios[uIdx],
    ...rest,
    ...(email && { correo: email }),
    ...(role  && { rol: role, role }),
  };

  // Sincronizar en 'users' (auth) si cambió email, password o role
  const aIdx = (db.users || []).findIndex((u) => u.id === id);
  if (aIdx !== -1) {
    if (email)    db.users[aIdx].email    = email;
    if (password) db.users[aIdx].password = password;
    if (role)     db.users[aIdx].role     = role;
  }

  writeDB(db);
  return res.json(db.usuarios[uIdx]);
});

// DELETE /usuarios/:id — Eliminar empleado (Solo Admin)
app.delete("/usuarios/:id", requireAuth, requireAdmin, (req, res) => {
  const db  = readDB();
  const id  = parseInt(req.params.id, 10);

  // Protección: no permitir que el Admin se elimine a sí mismo
  if (id === req.user.sub) {
    return res.status(403).json({ message: "No puedes eliminarte a ti mismo." });
  }

  const uIdx = (db.usuarios || []).findIndex((u) => (u._id ?? u.id) === id);
  const aIdx = (db.users    || []).findIndex((u) => u.id             === id);

  if (uIdx === -1 && aIdx === -1) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }

  let deleted;
  if (uIdx !== -1) deleted = db.usuarios.splice(uIdx, 1)[0];
  if (aIdx !== -1) db.users.splice(aIdx, 1);

  writeDB(db);
  return res.json(deleted || { id });
});


// ── Arranque ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║      ✅  MetaFit API — Puerto 3001               ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log("📋 Endpoints disponibles:");
  console.log(`   POST   http://localhost:${PORT}/login`);
  console.log(`   POST   http://localhost:${PORT}/register`);
  console.log(`   GET    http://localhost:${PORT}/660/afiliados   ← requiere JWT`);
  console.log(`   GET    http://localhost:${PORT}/660/usuarios    ← requiere JWT`);
  console.log(`   GET    http://localhost:${PORT}/440/ejercicios  ← requiere JWT`);
  console.log(`   GET    http://localhost:${PORT}/440/alimentos   ← requiere JWT`);
  console.log("");
  console.log("🛡️  Endpoints Admin-only (requireAdmin):");
  console.log(`   GET    http://localhost:${PORT}/usuarios         ← JWT + Admin`);
  console.log(`   POST   http://localhost:${PORT}/usuarios         ← JWT + Admin`);
  console.log(`   PATCH  http://localhost:${PORT}/usuarios/:id     ← JWT + Admin`);
  console.log(`   DELETE http://localhost:${PORT}/usuarios/:id     ← JWT + Admin`);
  console.log("\n🔑 Credenciales de prueba:");
  console.log("   carlos@metafit.com  /  Admin123!   (Administrador)");
  console.log("   maria@metafit.com   /  Maria123!   (Recepcionista)");
  console.log("   laura@metafit.com   /  Laura123!   (Entrenador)\n");
});
