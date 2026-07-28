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