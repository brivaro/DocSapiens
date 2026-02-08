# Etapa 1: Construcción de la aplicación React
FROM node:20-alpine AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Habilitar pnpm usando Corepack
RUN corepack enable

# Copiar los archivos que definen las dependencias
COPY package.json ./
COPY pnpm-lock.yaml ./

# Instalar las dependencias usando pnpm
# --frozen-lockfile asegura que se use exactamente lo definido en el lockfile.
# Para desarrollo local usar --no-frozen-lockfile, pero no en CI, rompe reproducibilidad.
RUN pnpm install --no-frozen-lockfile

# Copiar el resto del código fuente de la aplicación
COPY . ./

# Construir la aplicación para producción
RUN pnpm run build

# Etapa 2: Servir la aplicación con Nginx
FROM nginx:1.23-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Copia nuestro archivo de configuración personalizado
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto
EXPOSE 80

# Comando para iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]