# 🏗️ Diagrama General de Arquitectura

> Visión de los 4 componentes del sistema MetaFit

---

## Componentes del Sistema

```
┌──────────────────────────────────────────────────────────┐
│                    USUARIOS FINALES                       │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Admin/Web   │  │ Staff/Web   │  │ Afiliado/Móvil  │  │
│  │  (Panel)     │  │ (Panel)     │  │ (App Expo)      │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
└─────────┼────────────────┼───────────────────┼────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌──────────────────────────────────────────────────────────┐
│                   FRONTEND WEB (React + Vite)            │
│  Puerto: 5173 | Deploy: Docker dev / Render (pendiente)  │
│  RBAC por rol | CSS Modules | HashRouter                 │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTP (axios + JWT interceptor)
                         ▼
┌──────────────────────────────────────────────────────────┐
│                 BACKEND API (Node.js + Express)           │
│  Puerto: 3001 | Deploy: Render.com (Docker)              │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Auth     │ │ Afiliados│ │ Pagos    │ │ Notificac. │  │
│  │ Routes   │ │ Routes   │ │ Routes   │ │ Routes     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │            │            │              │          │
│  ┌────▼────────────▼────────────▼──────────────▼──────┐  │
│  │           Controllers + Services                    │  │
│  └────────────────────┬───────────────────────────────┘  │
│                       │                                  │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │           Models (mysql2/promise nativo)            │  │
│  └────────────────────┬───────────────────────────────┘  │
└───────────────────────┼──────────────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────────────┐
│              BASE DE DATOS (MySQL 8.0)                    │
│  Deploy: Railway (cloud) / Docker local                   │
│  17 tablas + 5 vistas | Triggers | FK RESTRICT            │
│  Migraciones JS idempotentes al arrancar                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Brevo    │ │Cloudinary│ │ Expo     │ │ Uptime     │  │
│  │ (Correos)│ │ (Fotos)  │ │ (Push)   │ │ Robot      │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🔗 Flujo de Datos

### Request típico (Frontend → Backend)
```
1. Usuario hace acción en React
2. Axios interceptor inyecta JWT desde localStorage
3. HTTP request → Render.com (HTTPS)
4. Express: rate limit → content-type check → CORS → helmet
5. Middleware auth.js: verifica JWT → inyecta req.user
6. Controller → Service → Model → MySQL query
7. Response JSON → React actualiza estado
```

### Request Móvil → Backend
```
1. Expo app hace request
2. Axios interceptor inyecta JWT desde AsyncStorage
3. HTTP request → Render.com (HTTPS)
4. Misma pipeline que web
```

---

## 📦 Docker Compose (Desarrollo Local)

```yaml
Servicios:
  db:          mysql:8.0 (puerto 3307:3306)
  backend:     Build local (puerto 3001:3001)
  frontend:    Build local (puerto 5173:5173)
  phpmyadmin:  phpmyadmin (puerto 8080:80)
Red:           metafit_net (bridge)
Volumen:       metafit_db_data (persistencia)
```

---

## 📎 Notas Relacionadas

- [[Backend Node.js]]
- [[Frontend React]]
- [[App Móvil React Native]]
- [[Base de datos MySQL]]
- [[Visión general]]
