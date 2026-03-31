# Deployment Overview

Pulsar is designed to run as two separate services:

| Service | Platform | URL |
|---------|----------|-----|
| Frontend | Vercel | pulsar.investments |
| Backend | Coolify (Docker) | api.pulsar.investments |
| CDN | Cloudflare R2 | cdn.pulsar.investments |
| DNS | Cloudflare | -- |

## Architecture

```
                    Cloudflare DNS
                         │
          ┌──────────────┼──────────────┐
          │              │              │
    pulsar.investments   │    cdn.pulsar.investments
          │              │              │
          ▼              │              ▼
       Vercel            │        Cloudflare R2
    (Next.js SSR)        │      (bank icons, assets)
                         │
              api.pulsar.investments
                         │
                         ▼
                  Coolify Server
               (Docker container)
              ┌──────────────────┐
              │  FastAPI + Redis  │
              │  + MongoDB        │
              └──────────────────┘
```
