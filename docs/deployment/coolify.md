# Coolify Deployment (Backend)

## Setup

1. Add a new application in Coolify
2. Set the git repository URL
3. Set the base directory to `/backend`
4. Build pack: Dockerfile

## Environment Variables

Add all backend env vars in Coolify's environment settings.

## Health Check

- Path: `/api/health`
- Method: GET
- Expected status: 200
- Interval: 5 seconds

## Custom Domain

Set the FQDN in Coolify to your API domain (e.g., `https://api.your-domain.com`). Ensure DNS points to your Coolify server IP with no Cloudflare proxy (DNS-only).
