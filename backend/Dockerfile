# ============================================================
# MetaFit — Dockerfile Backend Node.js
# Archivo: /backend/Dockerfile
# ============================================================

FROM node:22-alpine

WORKDIR /app

# Instala dependencias primero (capa cacheada)
COPY package*.json ./
RUN npm install --omit=dev

# Copia el código fuente
COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
