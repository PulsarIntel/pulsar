import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Pulsar',
  description: 'Real-time Market Intelligence Platform',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Architecture', link: '/architecture/overview' },
      { text: 'API Reference', link: '/api/endpoints' },
      { text: 'Deployment', link: '/deployment/overview' },
      { text: 'pulsar.investments', link: 'https://pulsar.investments' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Project Structure', link: '/guide/project-structure' },
          ]
        },
        {
          text: 'Features',
          items: [
            { text: 'Dashboard', link: '/guide/features/dashboard' },
            { text: 'Stocks', link: '/guide/features/stocks' },
            { text: 'Currencies', link: '/guide/features/currencies' },
            { text: 'Crypto', link: '/guide/features/crypto' },
            { text: 'Portfolio', link: '/guide/features/portfolio' },
            { text: 'Watchlist', link: '/guide/features/watchlist' },
            { text: 'Heatmap', link: '/guide/features/heatmap' },
            { text: 'Terminal', link: '/guide/features/terminal' },
            { text: 'Financials', link: '/guide/features/financials' },
          ]
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Backend', link: '/architecture/backend' },
            { text: 'Frontend', link: '/architecture/frontend' },
            { text: 'Data Flow', link: '/architecture/data-flow' },
            { text: 'Providers', link: '/architecture/providers' },
            { text: 'WebSocket Streaming', link: '/architecture/websocket' },
            { text: 'State Management', link: '/architecture/state' },
          ]
        }
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Endpoints', link: '/api/endpoints' },
            { text: 'Authentication', link: '/api/authentication' },
            { text: 'Market Data', link: '/api/market' },
            { text: 'Crypto', link: '/api/crypto' },
            { text: 'Currencies (Doviz)', link: '/api/doviz' },
            { text: 'Financials', link: '/api/financials' },
            { text: 'Portfolio', link: '/api/portfolio' },
            { text: 'Watchlist', link: '/api/watchlist' },
            { text: 'Terminal', link: '/api/terminal' },
            { text: 'WebSocket', link: '/api/websocket' },
            { text: 'Rate Limiting', link: '/api/rate-limiting' },
          ]
        }
      ],
      '/deployment/': [
        {
          text: 'Deployment',
          items: [
            { text: 'Overview', link: '/deployment/overview' },
            { text: 'Environment Variables', link: '/deployment/env-vars' },
            { text: 'Docker', link: '/deployment/docker' },
            { text: 'Vercel (Frontend)', link: '/deployment/vercel' },
            { text: 'Coolify (Backend)', link: '/deployment/coolify' },
            { text: 'Cloudflare (DNS & CDN)', link: '/deployment/cloudflare' },
          ]
        }
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/PulsarIntel/pulsar' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright 2026 Pulsar'
    },
    search: {
      provider: 'local'
    }
  }
})
