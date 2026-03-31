# Cloudflare Setup

## DNS Records

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | cname.vercel-dns.com | Off |
| A | api | Your server IP | Off |
| CNAME | cdn | public.r2.dev | On |

## R2 Storage

Used for static assets (bank icons). Set up a custom domain on the R2 bucket:

1. Go to R2 -> your bucket -> Settings -> Custom Domains
2. Add `cdn.your-domain.com`
3. Ensure the CNAME DNS record is proxied (orange cloud)

## SSL

- Frontend (Vercel): Automatic SSL
- Backend (Coolify): Let's Encrypt via Coolify/Traefik
- CDN: Cloudflare edge SSL (proxied)
