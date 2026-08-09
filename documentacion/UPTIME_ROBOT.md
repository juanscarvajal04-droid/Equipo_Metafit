# UptimeRobot — Monitoreo 24/7 de MetaFit

UptimeRobot vigila la disponibilidad del **backend**, el **frontend** y la **app móvil (APK)** de MetaFit, y avisa por correo/canal si alguno cae.

## ⚠️ Nota importante

La API pública de UptimeRobot **no permite crear monitores de forma automatizada** sin una cuenta Thunder/Enterprise (los planes Free/Pro solo manejan monitores creados manualmente desde el dashboard, y la API gratuita requiere monitor IDs ya existentes). Por eso la configuración se hace **manualmente una sola vez** (10 minutos) y queda documentada aquí.

## Monitores recomendados

| Tipo | Nombre sugerido | URL | Intervalo | Alertas |
|---|---|---|---|---|
| HTTPS | `MetaFit Backend (API)` | `https://metafit-backend-rr18.onrender.com/health` | 5 min | Correo + Telegram |
| HTTPS | `MetaFit Frontend (Web)` | `https://metafit-frontend-78x6.onrender.com` | 5 min | Correo + Telegram |
| HTTPS | `MetaFit APK (descarga)` | `https://metafit-frontend-78x6.onrender.com/app/metafit.apk` | 30 min | Correo + Telegram |

> Verifica que el backend exponga un endpoint de salud (`/health`) que responda `200 OK`; si no existe, monitorea la raíz `https://metafit-backend-rr18.onrender.com` directamente.

## Pasos de configuración

1. Crea una cuenta en [uptimerobot.com](https://uptimerobot.com) (plan FREE alcanza).
2. **My Settings → Alert Contacts → Add Alert Contact**:
   - E-mail del equipo (o el tuyo), plus: Telegram/WhatsApp si prefieres.
   - Marca los eventos: **Down**, **Up** (y opcional **SSL Expiry**).
3. **Add New Monitor** (por cada fila de la tabla):
   - *Monitor Type*: **HTTPS**.
   - *URL or IP*: la URL indicada.
   - *Friendly Name*: el nombre sugerido.
   - *Monitoring Interval*: 5 minutos (30 para el APK).
   - *Notifications*: selecciona el contacto creado.
4. Guarda y espera. En minutos verás el estado **Up (OK)** verde.

## Respuesta ante caída

- UptimeRobot avisa por el canal configurado (Down).
- Render tiene **auto-deploy** desde `feature/juan-carvajal`; verifica `https://dashboard.render.com` → servicio caído suele ser por memory/re-deploy.
- Si el backend está `live` pero /health responde 503, reinícialo desde el dashboard de Render (Manual Deploy → Clear build cache and deploy).

## Estado

- [ ] Monitores creados manualmente con la cuenta del equipo (pendiente acción manual única).