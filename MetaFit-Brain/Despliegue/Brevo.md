# 📧 Despliegue Brevo

> Servicio de correos transaccionales (API Brevo + SMTP fallback)

---

## 🔧 Configuración

Brevo se usa para el envío de correos transaccionales del sistema. No hay archivo de configuración dedicado; la integración está en 3 servicios.

---

## 📁 Archivos Relacionados

```
backend/services/
├── correoService.js      # Servicio centralizado de correo
├── facturaService.js     # Envío de facturas de pago
└── authController.js     # Recuperación de contraseña
```

---

## 🔑 Variables de Entorno

| Variable | Descripción |
|---|---|
| `BREVO_API_KEY` | API key de Brevo (prioridad sobre SMTP) |
| `SMTP_HOST` | Servidor SMTP (fallback) |
| `SMTP_PORT` | Puerto SMTP (default: 587) |
| `SMTP_USER` | Usuario SMTP |
| `SMTP_PASS` | Contraseña SMTP |
| `SMTP_SECURE` | `true`/`false` (TLS) |
| `SMTP_FROM` | Correo remitente (default: metafit.sistema@gmail.com) |

---

## 🔄 Flujo de Envío

```
1. Servicio necesita enviar correo
2. ¿BREVO_API_KEY definida?
   → SÍ: POST https://api.brevo.com/v3/smtp/email
         Headers: api-key: <BREVO_API_KEY>
   → NO: ¿SMTP_HOST definido?
         → SÍ: nodemailer con credenciales SMTP
         → NO: Modo silencioso (correo no enviado, no lanza error)
```

---

## 📧 Tipos de Correo

| Tipo | Template | Trigger |
|---|---|---|
| **Bienvenida** | — | `POST /afiliados` (fire-and-forget) |
| **Recuperar contraseña** | `templates/recuperar-password.html` | `POST /auth/recuperar-password` |
| **Factura de pago** | `templates/factura-pago.html` | `POST /afiliados/:id/pagos` (async) |
| **Recordatorio pago** | — | Cron cada hora (vencimiento ≤3 días) |

---

## 🛡️ Filosofía

```js
// El correo es OPCIONAL — nunca lanza excepciones
// Si falla el envío, la operación principal continúa igual
try {
  await enviarCorreo(datos);
} catch (err) {
  console.error('Error enviando correo:', err.message);
  // No re-lanza — la app sigue funcionando
}
```

---

## 📎 Notas Relacionadas

- [[Pagos]]
- [[Notificaciones]]
- [[Autenticación]]
- [[Render]]
