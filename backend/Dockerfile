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
