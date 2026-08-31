# 🚀 MetaFit - Sistema de Gestión Deportiva

Bienvenido a la rama de trabajo de la dirección del proyecto. Esta sección es administrada por el líder técnico para garantizar la integridad del código.

## 👤 Perfil del Integrante
**Nombre:** Juan Sebastián Carvajal

---

## 📋 Instalación local (sin Docker)

```bash
# 1. Clonar
git clone <repo-url> && cd Equipo_Metafit

# 2. Copiar variables de entorno
cp .env.example .env
# (editar .env si necesitas cambiar contraseña de MySQL, etc.)

# 3. Backend
cd backend && npm install && npm run dev

# 4. Frontend (otra terminal)
cd frontend_web && npm install && npm run dev
```

> El frontend usa `VITE_API_URL` (fallback: `http://localhost:3001`).
> En Docker, `frontend_web/.env.development` ya está configurado automáticamente.

## 🐳 Levantar el proyecto con Docker

```bash
# Clonar el repositorio
git clone <repo-url>
cd Equipo_Metafit

# Iniciar todos los servicios (MySQL + Backend + Frontend + phpMyAdmin)
docker compose up -d --build

# Verificar que los contenedores estén corriendo
docker compose ps
```

Los scripts SQL de [`database/`](./database) se ejecutan automáticamente al iniciar MariaDB por primera vez. El orden lexicográfico coincide con las dependencias: `01_estructura → 02_migracion_movil → 03_mejoras_estructura → 04_datos_iniciales → 05_password_reset` (detalles en [`database/README.md`](./database/README.md)).

## 🔌 Puertos

| Servicio   | Puerto | URL                        |
|------------|--------|----------------------------|
| Frontend   | 5173   | http://localhost:5173       |
| Backend    | 3001   | http://localhost:3001       |
| phpMyAdmin | 8080   | http://localhost:8080       |
| MySQL      | 3306   | localhost:3306              |

## 👤 Credenciales de prueba

| Rol             | Email                    | Contraseña     |
|-----------------|--------------------------|----------------|
| Administrador   | carlos@metafit.com       | Admin123!      |
| Recepcionista   | maria@metafit.com        | Maria123!      |
| Entrenador      | laura@metafit.com        | Laura123!      |
| Entrenador      | andres@metafit.com       | Andres123!     |
| Afiliado        | ana.lopez@example.com    | Afiliado123!   |

## 🔬 Tests

```bash
# Backend (25 tests — integración + unitarios)
cd backend && npm test
```

Respuesta esperada:
```
Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
```

Además: `frontend_web` (30 tests, `npm test`) y `movil` (19 tests, `npx jest`). Total: **74 tests verdes**. CI los corre todos en GitHub Actions (`.github/workflows/ci.yml`).

## 📬 Postman

Se proporcionan **dos** colecciones Postman (dentro de [`postman/`](./postman)):

| Colección | Archivo | Para quién |
|-----------|---------|------------|
| Web (Staff) | `postman/MetaFit_API_Web.postman_collection.json` | Admin / Recepcionista / Entrenador |
| Móvil (Afiliado) | `postman/MetaFit_API_Movil.postman_collection.json` | Afiliado (app móvil) |

**Configuración:**
1. Importa los 3 archivos de la carpeta `postman/` en Postman
2. Selecciona el entorno `MetaFit Environment`
3. Ejecuta primero el login — el token JWT se guarda automáticamente

## 📊 ISO 25000 — Cumplimiento

| Característica | Estado |
|----------------|--------|
| Mantenibilidad | ✅ Código modular MVC (controller → service → model) |
| Funcionalidad  | ✅ 30+ endpoints documentados con Swagger |
| Confiabilidad  | ✅ Manejo de errores con try-catch + códigos HTTP |
| Seguridad      | ✅ JWT + bcrypt (12 rondas) + rutas protegidas |
| Capacidad de prueba | ✅ 16 tests (integración + unitarios) pasando |
| Portabilidad   | ✅ Web (Vite) + Móvil (Expo) + Docker |

## 📚 Documentación

Todos los documentos se encuentran en la carpeta [`documentacion/`](./documentacion).

| Documento | Descripción |
|---|---|
| `documentacion/MANUAL_TECNICO.md` | Manual técnico completo: arquitectura, endpoints, BD, seguridad, despliegue |
| `documentacion/MANUAL_USUARIO.md` | Guías paso a paso para cada rol del sistema |
| `documentacion/MANUAL_POSTMAN.md` | Guía para probar la API con Postman desde cero |
| `documentacion/DIAGRAMAS.md` | Diagramas de arquitectura, componentes, navegación, BD y flujos |
| `documentacion/PRESENTACION.md` | Guion de sustentación (15-20 min) con diapositivas |
| `documentacion/QA_REPORT.md` | Reporte de aseguramiento de calidad |
| `documentacion/AUDITORIA_FINAL.md` | Auditoría final del proyecto |
| `documentacion/UPTIME_ROBOT.md` | Monitoreo 24/7 con UptimeRobot (config manual) |
| `documentacion/GUION_VIDEO_DEMO.md` | Guion del video demo (3–5 min, 3 roles) |

## 🚀 Mejoras "1000/10" (últimas fases)

| Mejora | Estado |
|---|---|
| Modo claro/oscuro (web + app móvil) | ✅ Toggle ☀️/🌙 persistente |
| Analítica GA4 + GTM + GSC | ✅ GTM-K6JZS4MG activo, 4 eventos dataLayer |
| Push notifications (Expo) | ✅ `push_token` + avisos de rutina/dieta |
| Correo de bienvenida (Brevo) | ✅ Plantilla 600px + credenciales |
| Recordatorio de pagos (cron) | ✅ Cada hora, vence en ≤3 días, dedupe diario |
| Code Climate | ⏳ `.codeclimate.yml` listo (requiere repo público + login manual) |
| GitHub Actions CI/CD | ✅ 74 tests en CI + deploy automático a Render en `main` |
| UptimeRobot | ⏳ Guía lista (`documentacion/UPTIME_ROBOT.md`), monitores manuales |
| Cloudinary | ✅ Con fallback a disco (activa con 3 env vars) |
| Storybook | ✅ 5 historias (Badge, Button, Card, Modal, Avatar) tema oscuro |
| n8n (automatizaciones) | ✅ 4 flujos: pagos, recordatorios, Telegram, Google Sheets |

---

## 🔒 CORS (lista blanca)

El backend usa una **whitelist de orígenes** — solo permite conexiones desde:

| Entorno | Orígenes permitidos |
|---|---|
| Desarrollo | `localhost:5173`, `127.0.0.1:5173`, `localhost:8081`, `127.0.0.1:8081` |
| Producción | `metafit-frontend-78x6.onrender.com` + los de desarrollo |

Configurable vía `CORS_ORIGINS` en `.env` o en Render. Solicitudes sin `Origin` (móvil, curl, Postman) siempre pasan.

---

## 🧠 Obsidian Vault

El proyecto incluye un **vault de Obsidian** con documentación viva en `documentacion/brain/`:

- **28 notas interconectadas** cubriendo arquitectura, APIs, despliegue, bugs, manuales y diseño.
- Cada nota usa enlaces `[[doble corchete]]` para navegar entre temas.
- Basado en el código real del proyecto (endpoints, middlewares, schemas, configs).

### Cómo abrirlo en Obsidian

1. Abrir Obsidian
2. `File > Open folder as vault`
3. Seleccionar `documentacion/brain/`
4. Explorar desde `Home.md` como punto de entrada

### Estructura

```
documentacion/brain/
├── Home.md              ← Punto de entrada
├── Proyecto/            ← Visión general, historias, roadmap
├── Arquitectura/        ← Backend, Frontend, Móvil, BD
├── APIs/                ← Autenticación, Afiliados, Pagos, Planes
├── Despliegue/          ← Render, Railway, Brevo, Cloudinary, CI/CD
├── Bugs y soluciones/   ← Historial y lecciones aprendidas
├── Manuales/            ← Técnico, Usuario, Postman
├── Diseño/              ← Colores, tokens CSS, favicon
└── Enlaces útiles.md
```

---
*MetaFit Inc. · Sport Gym Sede 80 · Bogotá, Colombia*