# 🚀 Despliegue en Render

> Backend API en Render.com con Docker — Puerto 3001

---

## 📄 Configuración (render.yaml)

```yaml
services:
  - type: web
    name: metafit-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    healthCheckPath: /health
    port: 3001
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        sync: false  # Configurar manualmente
      - key: JWT_SECRET
        sync: false  # Configurar manualmente
      - key: JWT_EXPIRES_IN
        value: 8h
      - key: CORS_ORIGINS
        value: https://metafit-backend.onrender.com,http://localhost:5173
      - key: PORT
        value: "3001"
```

---

## 🐳 Dockerfile (Backend)

```dockerfile
FROM node:22-alpine
RUN apk add --no-cache mariadb mariadb-client bash
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./
COPY database/ ./database/
RUN chmod +x start.sh
EXPOSE 3001
CMD ["bash", "start.sh"]
```

### ⚠️ Nota: Patrón All-in-One
El Dockerfile embebe MariaDB dentro del mismo contenedor que Node.js. `start.sh`:
1. Inicializa MariaDB (`mariadb-install-db`)
2. Arranca `mariadbd` en background
3. Crea BD + ejecuta schema + seed + migraciones
4. Arranca Node.js via `exec node`

> **Para producción separada:** usar Railway para MySQL (ya configurado).

---

## 🔗 Variables de Entorno (Producción)

| Variable | Valor | Descripción |
|---|---|---|
| `NODE_ENV` | `production` | Modo producción |
| `DATABASE_URL` | `mysql://...@host.railway.internal:3306/metafit` | URI Railway |
| `JWT_SECRET` | _(secreto de 64+ chars)_ | Clave JWT |
| `JWT_EXPIRES_IN` | `8h` | Vigencia del token |
| `CORS_ORIGINS` | `https://metafit-backend.onrender.com` | Dominios permitidos |
| `PORT` | `3001` | Puerto del servidor |

---

## 🏥 Health Check

```js
// GET /health
// Response:
{
  "status": "ok",
  "db": "MySQL conectado",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 📎 Notas Relacionadas

- [[Railway]]
- [[CI-CD]]
- [[Backend Node.js]]
- [[Diagrama general]]
