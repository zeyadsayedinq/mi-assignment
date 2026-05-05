# Mi-Assignment V1 — Fix Changelog

All changes made to the original MI-V1 codebase. No Gemini AI or model-related files were touched.

---

## 🔴 Critical Fixes

### 1. Referral Code — Hardcoded ABCDEF Removed
**File:** `src/pages/LandingPage.tsx`

**Problem:** `copyLink()` was writing `/ref/ABCDEF` for every user — a single broken link shared by all.

**Fix:**
- Imported `generateReferralCode` and `getReferralLink` from `src/lib/referral.ts`
- Added `referralCode` state populated from the logged-in user's ID (deterministic, instant, no extra DB call)
- `copyLink()` now uses `getReferralLink(generateReferralCode(session.user.id))` — unique per user
- JSX display replaced `ABCDEF` with `{referralCode}` — logged-out users see a "Sign in for your code" placeholder

---

### 2. Payment Integration — Throws Error Removed
**File:** `src/lib/subscription.ts`

**Problem:** `createTapCharge()` literally threw `Error('Payment processing requires backend. Contact support.')` — zero users could pay.

**Fix:** Replaced with a proper `fetch('/api/create-charge', ...)` call to the new Netlify function. Now sends plan/userId/email/currency and receives `{ chargeUrl, chargeId }` for redirect to Tap checkout.

---

### 3. New Netlify Function: `/netlify/functions/create-charge.mjs`
Server-side Tap Payments charge creation. `TAP_SECRET_KEY` lives only in Netlify environment variables. Handles all 3 currencies (EGP/SAR/AED) and all 3 plans. Returns redirect URL for Tap hosted checkout.

---

### 4. New Netlify Function: `/netlify/functions/tap-webhook.mjs`
Receives Tap payment webhook → verifies charge with Tap API (never trusts webhook body alone) → upserts `subscriptions` table in Supabase → logs to `payment_events` table. Activated on `CAPTURED` status only.

---

## 🟠 High Priority Fixes

### 5. Plan Limits Updated
**Files:** `src/lib/subscription.ts`, `netlify/functions/check-quota.mjs`

| Plan | Before | After |
|------|--------|-------|
| Free | 3 | 3 (unchanged) |
| Pro Monthly | 15 | **25** |
| Pro Quarterly | 40 | **60** |
| Pro Yearly | 999999 | 999999 (unchanged) |

Both files updated so frontend and serverless quota checks are always in sync.

---

### 6. PWA Icons — Empty Array Fixed
**File:** `manifest.json`

**Problem:** `"icons": []` — no icons defined. PWA install showed blank icon.

**Fix:** Full `icons` array with 4 entries:
- `icon-192.png` (any)
- `icon-192-maskable.png` (maskable)
- `icon-512.png` (any)
- `icon-512-maskable.png` (maskable)

Also added `shortcuts` (New Mission, My Vault) and `screenshots` stubs.

---

### 7. PWA Icons Generated
**Files:** `public/icon-192.png`, `public/icon-192-maskable.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `public/apple-touch-icon.png`

Generated Mi brand icons (dark background `#020617`, cyan `#22D3EE` "Mi" text, purple accent dot) at correct sizes with both regular and maskable variants.

---

### 8. Service Worker Added (PWA Offline Support)
**Files:** `public/sw.js`, `index.html` (registration script)

- Cache-first for static assets (JS/CSS/images/fonts)
- Network-first for navigation requests, fallback to cached index
- Never intercepts API calls, Supabase, Gemini, or Netlify functions
- Push notification handler ready for future use
- Registered via inline script in `index.html` on `window.load`

---

## 🟡 Medium Priority Fixes

### 9. Vault — Supabase Now Primary Source
**File:** `src/pages/TheVault.tsx`

**Problem:** localStorage was primary source; history wiped on browser clear or device switch.

**Fix:** For authenticated users, Supabase is now fetched first and its result is used directly. localStorage is updated as an offline cache after each Supabase fetch. On success, anonymous localStorage missions are synced to Supabase and removed. Offline/unauthenticated fallback to localStorage still works.

---

### 10. Share Result Button Added
**File:** `src/components/ResultsDashboard.tsx`

Added a **Share** button in the mission result toolbar (left of the Download button). On click:
- If `navigator.share` is available (mobile): triggers native share sheet with mission summary + Mi URL
- Otherwise: copies pre-formatted share text to clipboard
- Bilingual: Arabic and English share text
- Button shows ✓ + "Copied!" confirmation for 2.5 seconds
- Pre-formatted text includes Mi watermark URL (`mi-assignment.com`)

---

### 11. Bonus Missions Factored Into Quota
**File:** `netlify/functions/check-quota.mjs`

The effective mission limit now equals `PLAN_LIMIT + SUM(bonus_missions)` for the user. Referral bonuses work end-to-end: user earns referral bonus → it's stored in `bonus_missions` table → check-quota adds it to their effective limit.

---

### 12. New Netlify Function: `/netlify/functions/apply-referral.mjs`
Handles referral code application on new user signup. Validates code, prevents self-referral, prevents double-use, awards `+2` bonus missions to both the new user and the referrer via `bonus_missions` table.

---

### 13. New Netlify Function: `/netlify/functions/send-email.mjs`
Transactional email via Resend API. Three email types:
- `welcome` — sent on signup, Arabic + English, branded dark template
- `limit_reached` — sent when free missions exhausted, includes upgrade CTA
- `payment_success` — sent after Pro activation, shows plan name and expiry

Requires `RESEND_API_KEY` in Netlify env vars. Silently skips if key not set (non-fatal).

---

### 14. metadata.json — Filled In
**File:** `metadata.json`

Filled all fields: name, description, majorCapabilities (text_generation, file_analysis, image_generation, code_generation, document_export), targetAudience, supportedLanguages, category, pricing.

---

## 📁 New Files Summary

| File | Purpose |
|------|---------|
| `netlify/functions/create-charge.mjs` | Tap payment server-side |
| `netlify/functions/tap-webhook.mjs` | Tap webhook → activate subscription |
| `netlify/functions/apply-referral.mjs` | Apply referral code on signup |
| `netlify/functions/send-email.mjs` | Transactional email via Resend |
| `public/sw.js` | Service worker for PWA |
| `public/icon-192.png` | PWA icon 192px |
| `public/icon-192-maskable.png` | PWA maskable icon 192px |
| `public/icon-512.png` | PWA icon 512px |
| `public/icon-512-maskable.png` | PWA maskable icon 512px |
| `public/apple-touch-icon.png` | iOS home screen icon |
| `supabase-schema.sql` | Full DB schema to run in Supabase SQL Editor |
| `.env.example` | All required env vars with instructions |

---

## ✅ NOT Touched

The following were explicitly not changed per instructions:
- `src/lib/mi.ts` (Gemini AI integration)
- Any model names or AI configuration
- `netlify/functions/record-mission.mjs`
- `netlify/functions/health.mjs`
- `netlify/functions/subscription.mjs`
- All UI components not related to the above fixes
- All routing, auth, i18n configuration

---

## 🚀 Next Steps Before Launch

1. **Run `supabase-schema.sql`** in Supabase SQL Editor
2. **Set all env vars** from `.env.example` in Netlify dashboard
3. **Configure Tap webhook URL** in Tap Dashboard → Webhooks → `https://www.mi-assignment.com/.netlify/functions/tap-webhook`
4. **Verify domain** in Resend for `mi-assignment.com`
5. **Test full payment flow** with Tap test card `4111 1111 1111 1111`
6. **Test referral flow** with 2 test accounts
7. **Deploy** via `netlify deploy --prod`
