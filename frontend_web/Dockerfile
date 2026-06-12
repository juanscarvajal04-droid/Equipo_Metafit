# 1. Usamos una versión ligera y estable de Node.js
FROM node:22-alpine

# 2. Creamos la carpeta de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos los archivos de dependencias para instalarlas dentro
COPY package*.json ./

# 4. Instalamos los paquetes de tu proyecto Metafit
RUN npm install

# 5. Copiamos todo el código del frontend a la carpeta /app del contenedor
COPY . .

# 6. Exponemos el puerto estándar en el que corre Vite
EXPOSE 5173

# 7. El comando mágico que arranca el servidor de desarrollo y abre el --host 
# para que Windows pueda comunicarse con el contenedor y cargue en tu navegador
CMD ["npm", "run", "dev", "--", "--host"] 