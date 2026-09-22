---
tags: [arquitectura, infraestructura, diagrama]
---

# 🏗️ Arquitectura VPS

> Visión de cómo el **VPS de Oracle Cloud** se integra con Render y las integraciones externas.
> La BD de producción vive en el VPS; Render sigue alojando backend, frontend y Adminer.

---

## 🖥️ Diagrama ASCII

```text
                     ┌──────────────────────────────────────────────────────┐
                     │                 Render (cloud)                      │
                     │                                                     │
  Usuarios ───────►  │  ┌───────────────────┐        ┌───────────────────┐  │
  web / móvil       │  │ Frontend          │  CORS  │ Backend API       │  │
                     │  │ metafit-frontend │ ─────► │ metafit-backend   │  │
                     │  │ :5173 / :8081    │XXXXXXXX│ /health           │  │
                     │  └─────────┬─────────┘        └─────────┬─────────┘  │
                     └────────────┼────────────────────────────┼────────────┘
                                  │                            │
                                  │                            ▼
                     ┌────────────┴─────────────────────────────────────────┐
                     │           VPS ORACLE CLOUD  ·  141.148.94.173        │
                     │                                                      │
                     │   :3000  ─────────────►  Dokploy (panel / PaaS)      │
                     │                                                      │
                     │      ┌───────────────────────────┐                  │
                     │      │  MySQL 8  ·  base metafit │                  │
                     │      │  :3306  (producción)      │                  │
                     │      └───────────────────────────┘                  │
                     └─────────────────────────────────────────────────────┘

   Integraciones:
   ├── Cloudinary  fotos de afiliados     → res.cloudinary.com/llaq9vyl
   ├── Brevo       correos (API 401 → SMTP) → smtp-relay.sendinblue.com
   ├── Adminer     cliente web de la BD    → metafit-adminer.onrender.com
   └── n8n         automatización (LOCAL)  → localhost:5678
```

---

## 📝 Explicación de cada componente

### Render
- **Backend** (`https://metafit-backend-rr18.onrender.com`) — API REST, JWT, CORS en lista blanca.
- **Frontend** (`https://metafit-frontend-78x6.onrender.com`) — web app + enlace de descarga del APK.
- **Adminer** (`https://metafit-adminer.onrender.com`) — acceso gráfico a la BD del VPS.

### VPS Oracle Cloud (`141.148.94.173`)
- **Dokploy** (puerto 3000) — orquesta los servicios del VPS con Docker Compose.
- **MySQL 8** (puerto 3306) — base `metafit` de producción con los datos reales del seed.

### Integraciones externas
- **Cloudinary** — almacenamiento y CDN de fotos de perfil.
- **Brevo** — correos transaccionales (bienvenida, recordatorios de pago).
- **n8n** — automatizaciones (recordatorios, Telegram, Google Sheets); corre **local**, no en el VPS.

---

## 🔗 Notas relacionadas

- [[VPS Oracle Cloud]]
- [[Dokploy]]
- [[Base de datos MySQL]]
- [[Render]]
- [[Cloudinary]]
- [[Infraestructura]]