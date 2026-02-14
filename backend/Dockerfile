# Imagen base ligera de Python 3.11
FROM python:3.11-slim

# Variables de entorno para optimizar Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    # Evitar warnings de pip
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

WORKDIR /code

# Instalar dependencias del sistema necesarias
# libpq-dev: para psycopg2 (PostgreSQL)
# build-essential: para compilar extensiones de C (numpy, pandas, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements primero para aprovechar la caché de capas de Docker
COPY requirements.txt .

# Instalar dependencias de Python
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 8000

# Usuario no root por seguridad (opcional pero recomendado en prod)
# RUN useradd -m myuser
# USER myuser

# Comando de inicio
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8082", "--workers", "1", "--log-config", "/code/logging.ini"]