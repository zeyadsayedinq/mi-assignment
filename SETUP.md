# Mi-Assignment v2.2 — Setup Instructions

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure your API key**
   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

3. **Run the app**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Getting Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up / log in
3. Navigate to API Keys
4. Create a new key
5. Copy it into your `.env` file as `ANTHROPIC_API_KEY`

## What's New in v2.0

### Bug Fixes
- ✅ Fixed: Wrong Gemini model name causing all requests to fail
- ✅ Fixed: `process.env` (Node) used in Vite browser context — API key never loaded
- ✅ Fixed: AuthProvider outside IntroSequence breaking auth context
- ✅ Fixed: `data_sheet.columns` vs `data_sheet.headers` schema mismatch
- ✅ Fixed: IntelligenceBureau route pointing to wrong component
- ✅ Fixed: Dead `isVideoGenerated` setTimeout state

### New Features
- 🚀 Full Claude AI migration (from Gemini)
- 🎞️ In-app slide deck viewer with full presentation mode
- 🎨 Image Lab — AI image generation (free, no key needed)
- 🧠 Mi-Academy — fully functional with step-by-step learning breakdowns
- 📁 Mission type selector (essay, presentation, code, math, research, design)
- 🗑️ Vault delete + ⭐ star + search + filter + pagination
- 📊 Mission timeline + weekly activity chart on HQ
- 📋 Assignment Type Guide — assignment type guide with sample prompts
- 📱 Mobile navigation fixed
- 🔄 Claude API proxy server (secure, no key exposed to browser)

## Image Generation

Images are generated via **Pollinations AI** — completely free, no API key required.
Used for:
- Slide presentation images (auto-generated per slide)
- Standalone Image Lab (8 styles, 4 aspect ratios)

## Architecture

```
Browser (React + Vite)
    ↓ fetch /api/process-mission
Express Server (server.ts)
    ↓ Claude API (claude-sonnet-4-20250514)
Anthropic API
```

The API key lives on the server only — never exposed to the browser.

## Deployment

### Option A — Netlify (frontend) + Railway (backend) — RECOMMENDED

**Frontend on Netlify:**
```bash
# netlify.toml is already configured
# Set these env vars in Netlify dashboard → Site settings → Environment variables:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Backend on Railway:**
```bash
# Deploy the Express server (server.ts) on Railway
# Set these env vars in Railway:
ANTHROPIC_API_KEY=sk-ant-...
VITE_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
TAP_SECRET_KEY=...
NODE_ENV=production
PORT=3000
```
Then update your frontend's API calls to point to the Railway URL.

### Option B — Railway only (fullstack)
Deploy everything on Railway. Railway runs `npm start` which serves both the React app and the Express API.

### Build commands
- `npm run build:client` — builds just the React frontend (for Netlify)
- `npm run build:server` — bundles the Express server
- `npm run build` — builds both
- `npm start` — runs the production server

## What was fixed in v2.2
- ✅ Deleted old `gemini.ts` (was still being bundled and crashing build)
- ✅ Fixed `ResultsDashboard.tsx` JSX error from malformed TiltCard injection
- ✅ Fixed `netlify.toml` — removed `GEMINI_API_KEY` env reference
- ✅ Added `build:client` script for Netlify-only deploys

## Critical: Why /api/check-quota 404s and How to Fix It

The frontend (Netlify) calls `/api/check-quota`, `/api/record-mission`, etc.
These routes live on the **Express server (Railway)**, not on Netlify.

**The fix — 3 steps:**

### Step 1: Deploy Express server to Railway
1. Go to railway.app → New Project → Deploy from GitHub
2. Select your repo
3. Railway auto-detects Node and runs `npm start`
4. Set these env vars in Railway:
   ```
   GEMINI_API_KEY=...
   VITE_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   TAP_SECRET_KEY=...
   TAP_WEBHOOK_SECRET=...
   RESEND_API_KEY=...
   ADMIN_SECRET=...
   VITE_APP_URL=https://your-site.netlify.app
   NODE_ENV=production
   PORT=3000
   ```
5. Copy your Railway public URL (e.g. `https://mi-core.up.railway.app`)

### Step 2: Set VITE_API_URL in Netlify
1. Netlify Dashboard → Site Settings → Environment Variables
2. Add: `VITE_API_URL` = `https://mi-core.up.railway.app` (your Railway URL)
3. Redeploy (Netlify → Deploys → Trigger deploy)

### Step 3: Set Tap webhook URL in Tap Dashboard
- URL: `https://mi-core.up.railway.app/api/webhook/tap`

That's it. Every `/api/*` call from the browser will now go to Railway.
