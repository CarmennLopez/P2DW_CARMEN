# Imagen base de Node LTS sobre Alpine (ligera y segura)
FROM node:lts-alpine

# Instalar pnpm globalmente
RUN npm install -g pnpm

# Definir directorio de trabajo en el contenedor
WORKDIR /app

# Copiar solo package.json para aprovechar la cache en instalaciones
COPY package.json ./

# Instalar dependencias del proyecto
RUN pnpm install

# Instalar dependencias extra necesarias
RUN pnpm add mssql dotenv swagger-ui-express swagger-jsdoc

# Copiar todo el código del proyecto, incluyendo .env
COPY . .

# Exponer el puerto de la API
EXPOSE 80

# Comando de inicio
CMD ["pnpm", "start"]
