# syntax=docker/dockerfile:1
# Single-service production shape (Architecture.md §4): FastAPI serves both
# the built React SPA and the /api routes from one container.

FROM python:3.11-slim AS backend-deps

WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM node:22-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim AS runtime

WORKDIR /app/backend
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY --from=backend-deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin
COPY backend/ .
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Cloud Run supplies PORT; bind to 0.0.0.0 (Architecture.md §4).
EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
