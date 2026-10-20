# ============================================================
# MetaFit — Dockerfile Backend Node.js
# Archivo: /backend/Dockerfile
# ============================================================

FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Instala dependencias primero (capa cacheada)
COPY package*.json ./
RUN npm ci --omit=dev

# Copia explícita del código fuente (evita incluir secretos o archivos locales)
COPY --chown=node:node config ./config
COPY --chown=node:node controllers ./controllers
COPY --chown=node:node cron ./cron
COPY --chown=node:node middlewares ./middlewares
COPY --chown=node:node migrations ./migrations
COPY --chown=node:node models ./models
COPY --chown=node:node routes ./routes
COPY --chown=node:node services ./services
COPY --chown=node:node templates ./templates
COPY --chown=node:node utils ./utils
COPY --chown=node:node index.js server.js ./

# Directorio de subidas escribible por el usuario sin privilegios
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

EXPOSE 3001

CMD ["node", "index.js"]
