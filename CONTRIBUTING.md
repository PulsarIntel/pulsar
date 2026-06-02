# Contributing to Pulsar

Pulsar is a real-time market intelligence platform built with a FastAPI backend, a Next.js frontend, Redis pub/sub, MongoDB, and live market-data providers.

## Where to Start

- `frontend/` contains the Next.js app, terminal workspace, charts, and client-side stores.
- `backend/` contains the FastAPI API, WebSocket endpoints, market-data providers, portfolio logic, and persistence.
- `docs/` contains the project documentation.

## Development Setup

Backend:

```bash
cd backend
pdm install
pdm run uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
bun install
bun run dev
```

Docs:

```bash
cd docs
bun install
bun run dev
```

## Contribution Guidelines

- Keep changes focused and easy to review.
- Prefer small pull requests over large rewrites.
- Include clear reproduction steps for bug fixes.
- Add or update tests when changing behavior.
- Do not commit API keys, `.env` files, credentials, market-data tokens, or production URLs that are not already public.
- For market-data providers, keep provider-specific code behind a narrow adapter and preserve the Redis pub/sub boundary.
- For frontend state, update the relevant Zustand store directly rather than adding redundant global state.

## Pull Requests

Before opening a pull request:

```bash
cd frontend && bun run lint
cd ../backend && pdm run ruff check .
```

If a command is not available in your environment, mention that in the pull request.

## Reporting Issues

When filing an issue, include:

- What you expected to happen.
- What actually happened.
- Browser, OS, and relevant logs.
- Whether the issue affects frontend, backend, WebSockets, portfolio calculations, or a specific market-data provider.
