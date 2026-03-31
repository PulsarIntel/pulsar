# Docker Deployment

The backend includes a Dockerfile for containerized deployment.

## Build

```bash
cd backend
docker build -t pulsar-backend .
```

## Run

```bash
docker run -d \
  --name pulsar-backend \
  -p 8000:8000 \
  -e JWT_SECRET=your-secret \
  -e MONGODB_URL=mongodb://host:27017 \
  -e REDIS_URL=redis://host:6379 \
  -e ALPACA_API_KEY=your-key \
  -e ALPACA_API_SECRET=your-secret \
  -e FINNHUB_API_KEY=your-key \
  -e ALLOWED_ORIGINS=https://your-frontend.com \
  pulsar-backend
```

## Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl wget && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir pdm
COPY pyproject.toml ./
RUN pdm lock && pdm install --prod --no-self
COPY src/ src/
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["pdm", "run", "uvicorn", "finance.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Health Check

The backend exposes `GET /api/health` which returns `{"status": "ok"}`.

Configure your orchestrator to check this endpoint. Both `curl` and `wget` are available in the image.
