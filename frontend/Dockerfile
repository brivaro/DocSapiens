# --- Etapa 1: Builder ---
# Construye la aplicación de React
FROM node:20-alpine AS builder
WORKDIR /front
RUN npm install -g pnpm
# Copia solo los archivos de manifiesto para aprovechar el caché de Docker
COPY package.json pnpm-lock.yaml ./
# Instala TODAS las dependencias (incluyendo devDependencies) para poder construir
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build


# --- Etapa 2: Runner ---
# Esta es la imagen final, súper ligera
FROM node:20-alpine
WORKDIR /front
# Establece el entorno a producción
ENV NODE_ENV=production
# Instala 'serve', un servidor estático optimizado para producción
RUN npm install -g serve
# Copia ÚNICAMENTE la carpeta 'dist' (los archivos compilados) desde la etapa 'builder'
# No copiamos node_modules ni nada más.
COPY --from=builder /front/dist ./dist
EXPOSE 3000

# El comando final para iniciar el servidor de producción.
# -s indica "single-page application" (sirve index.html para rutas no encontradas)
# -l 3000 le dice que escuche en el puerto 3000
CMD ["serve", "-s", "dist", "-l", "3000"]