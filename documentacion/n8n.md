# 🔄 n8n — Automatización MetaFit

> Integración de n8n con WhatsApp (futuro), Telegram y Google Sheets

---

## 🚀 Acceso

| Servicio | URL | Credenciales |
|---|---|---|
| **n8n UI** | http://localhost:5678 | admin / Admin123! |
| **n8n API** | http://localhost:5678/api/v1 | Ver n8n settings |

---

## 📁 Flujos Disponibles

### 1. `factura-pago.json` — Factura por Pago
- **Trigger:** Webhook POST `/webhook/factura-pago`
- **Flujo:** Recibe datos del pago → Formatea mensaje → Envía correo Brevo
- **Nodos:** Webhook → Code (formateo) → HTTP Request (Brevo) → Respond OK
- **Backbone del backend:** `pagoController.create` dispara este webhook automáticamente

### 2. `recordatorio-pago.json` — Recordatorio Diario
- **Trigger:** Cron diario a las 8:00 AM
- **Flujo:** Consulta MySQL (pagos por vencer en ≤3 días) → Formatea → Envía correo
- **Nodos:** Schedule Trigger → MySQL → Code (formateo) → Filter → HTTP Request (Brevo)
- **Requiere:** Credenciales MySQL en n8n

### 3. `notificaciones-telegram.json` — Staff por Telegram
- **Trigger:** 3 webhooks (nuevo afiliado, pago registrado, rutina asignada)
- **Flujo:** Recibe evento → Formatea mensaje → Envía a chat de Telegram
- **Nodos:** 3 Webhooks → 3 Code (formateo) → 1 Telegram node
- **Chat ID:** 8824635784
- **Bot:** @metafit_sport_bot

### 4. `google-sheets-registro.json` — Registro en Sheets
- **Trigger:** 2 webhooks (nuevo afiliado, pago registrado)
- **Flujo:** Recibe evento → Formatea → Appends a Google Sheet
- **Nodos:** 2 Webhooks → 2 Code (formateo) → 2 Google Sheets nodes
- **Pendiente:** Configurar credenciales de Google Sheets OAuth2 en n8n

---

## 🔧 Cómo Importar un Flujo

1. Abrir n8n → http://localhost:5678
2. Click en **"..."** (menú) → **Import from File**
3. Seleccionar el archivo JSON de `n8n/flujos/`
4. Configurar credenciales (ver abajo)
5. Activar el flujo (toggle "Active")

---

## 🔑 Credenciales a Configurar en n8n

### Brevo API Key
1. n8n → Settings → Credentials → Add → **Header Auth**
2. Name: `Brevo API Key`
3. Header Name: `api-key`
4. Header Value: *(tu Brevo API Key — ver .env o dashboard Brevo)*

### Telegram Bot
1. n8n → Settings → Credentials → Add → **Telegram API**
2. Name: `MetaFit Telegram Bot`
3. Access Token: *(tu token de @metafit_sport_bot — ver BotFather)*

### MySQL MetaFit
1. n8n → Settings → Credentials → Add → **MySQL**
2. Name: `MySQL MetaFit`
3. Host: `db` (Docker) o `localhost` (fuera de Docker)
4. Port: `3306`
5. Database: `metafit`
6. User: `root`
7. Password: `Admin123!`

### Google Sheets (pendiente)
1. Crear Service Account en Google Cloud Console
2. Descargar JSON de credenciales
3. n8n → Settings → Credentials → Add → **Google Sheets OAuth2**
4. Subir el JSON
5. Compartir la Google Sheet con el email del Service Account

---

## 🔗 Backends Webhooks (cómo se conectan)

El backend de MetaFit dispara webhooks a n8n automáticamente:

```js
// backend/services/n8nWebhookService.js
// URL base: http://n8n:5678 (Docker) o http://localhost:5678 (local)

// Endpoints n8n:
// POST /webhook/factura-pago     → Triggers factura-pago.json
// POST /webhook/nuevo-afiliado   → Triggers notificaciones-telegram.json + google-sheets-registro.json
// POST /webhook/rutina-asignada  → Triggers notificaciones-telegram.json
```

---

## 📊 Diagrama de Integración

```
                    ┌─────────────────┐
                    │   MetaFit BE    │
                    │  (Node.js)      │
                    └────────┬────────┘
                             │ fire-and-forget
                             ▼
                    ┌─────────────────┐
                    │   n8n Server    │
                    │  :5678          │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Brevo    │  │ Telegram │  │ Google   │
        │ (Email)  │  │ Bot API  │  │ Sheets   │
        └──────────┘  └──────────┘  └──────────┘
```

---

## 📎 Notas Relacionadas

- [[Enlaces útiles]]
- [[Backend Node.js]]
- [[Brevo]]
- [[Notificaciones]]
