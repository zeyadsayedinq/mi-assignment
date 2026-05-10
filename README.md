# Mi-Assignment

AI-powered academic assistant for university students in MENA.

## Stack
- React + TypeScript + Vite
- Vercel (hosting + serverless functions)
- Supabase (auth + database)
- Tailwind CSS

## Development

```bash
npm install --legacy-peer-deps
npm run dev
```

## Deployment
Push to `main` branch → Vercel auto-deploys.

Required environment variables:
- `MI_ENGINE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
