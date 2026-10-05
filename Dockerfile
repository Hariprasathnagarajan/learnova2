# Multi-stage production Dockerfile for Learnova Unified Platform
# Stage 1: Build the React Native / Expo Web Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npx expo export -p web

# Stage 2: Production Python Backend Server
FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend dist from stage 1
COPY --from=frontend-builder /app/dist ./dist

WORKDIR /app/backend

# Collect static files
RUN python manage.py collectstatic --noinput --settings=learnova_server.settings || true

EXPOSE 8000

CMD ["gunicorn", "learnova_server.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "120"]
