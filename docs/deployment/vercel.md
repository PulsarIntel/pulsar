# Vercel Deployment (Frontend)

## Setup

1. Import the repository on [vercel.com](https://vercel.com)
2. Set the root directory to `frontend`
3. Framework preset: Next.js

## Environment Variables

Set in Vercel project settings:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.your-domain.com/api` |

## Custom Domain

Add your domain in Vercel project settings under Domains. Point your DNS CNAME to `cname.vercel-dns.com`.
