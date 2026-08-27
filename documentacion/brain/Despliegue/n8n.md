# 🔄 Automatización n8n

> Integración de MetaFit con WhatsApp (futuro), Telegram y Google Sheets

---

## 📁 Ubicación

- **Flujos n8n:** `n8n/flujos/`
- **Documentación completa:** `documentacion/n8n.md`
- **Servicio Docker:** `docker-compose.yml` → servicio `n8n`

---

## 🔄 Flujos

| Flujo | Trigger | Acción |
|---|---|---|
| `factura-pago.json` | Webhook POST | Envía factura por correo (Brevo) |
| `recordatorio-pago.json` | Cron 8:00 AM | Busca pagos por vencer, envía recordatorio |
| `notificaciones-telegram.json` | 3 webhooks | Notifica al staff por Telegram |
| `google-sheets-registro.json` | 2 webhooks | Registra afiliados y pagos en Sheets |

---

## 🔗 Webhooks del Backend

```js
// backend/services/n8nWebhookService.js
POST /webhook/factura-pago      → factura-pago.json
POST /webhook/nuevo-afiliado    → telegram + sheets
POST /webhook/rutina-asignada   → telegram
```

---

## 🔑 Credenciales (configurar en n8n UI)

- **Brevo:** Header Auth → `api-key: xkeysib-...`
- **Telegram:** Token `8705489577:AAF_...` | Chat ID `8824635784`
- **MySQL:** `db:3306` | `root` | `Admin123!`
- **Google Sheets:** Pendiente (Service Account)

---

## 📎 Notas Relacionadas

- [[Notificaciones]]
- [[Pagos]]
- [[Brevo]]
- [[Enlaces útiles]]
