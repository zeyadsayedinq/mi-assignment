# Mi-Assignment — Full Codebase Reference
# Version: 3.1 · May 2026
# Founder: Zeyad El-Sayed
# Live: https://www.mi-assignment.com

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS + custom CSS |
| Animations | Framer Motion (motion/react) |
| Backend | Vercel Serverless Functions (Node.js) |
| Database | Supabase (PostgreSQL + Auth) |
| AI Engine | Google Gemini 3 Flash (gemini-3-flash-preview) |
| Export | jsPDF · docx.js · PptxGenJS · SheetJS · JSZip |
| Images | Pexels API |
| Email | Resend |
| Payments | InstaPay · Vodafone Cash · Tap.company (pending) |
| Hosting | Vercel (Frankfurt fra1) |
| Domain | mi-assignment.com (Cloudflare DNS) |

---

## Environment Variables (Vercel)

```
GEMINI_API_KEY=AIzaSyAGO9v_EEgeHJxaEv_-mKPcm5kSDjDJsL4
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
VITE_PEXELS_API_KEY=HfLNkod8pFrjPIB4fd4H2a5Iddt05SCcDcEOward18GA5fomCFoFxzqL
RESEND_API_KEY=...
```

---

## Pricing

| Plan | Price | Missions | Days |
|------|-------|----------|------|
| Free | 0 EGP | 3 | — |
| Pro Monthly | 350 EGP | 25 | 30 |
| Pro Quarterly | 1,000 EGP | 60 | 90 |

Payment: InstaPay mi-assignment@instapay · Vodafone Cash 01107743984
WhatsApp: wa.me/201107743984

Admin emails: zeyadsayedinq@gmail.com · ranafaraj30@gmail.com

---

## File Structure

```
mi-assignment/
├── index.html                          ← SEO: 3 JSON-LD schemas + meta tags
├── vercel.json
├── package.json
├── vite.config.ts
├── tailwind.config.js
│
├── public/
│   ├── llms.txt                        ← AI crawler context (short)
│   ├── llms-full.txt                   ← AI crawler context (full, 11KB)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── manifest.json
│   └── locales/                        ← i18n (en + ar)
│
├── api/                                ← Vercel Serverless Functions
│   ├── process-mission.js              ← MAIN: Gemini AI engine (Mi-CORE)
│   ├── record-mission.js               ← Save mission to Supabase
│   ├── check-quota.js                  ← Mission quota enforcement
│   ├── subscription.js                 ← Subscription status
│   ├── admin-subscription.js           ← Admin: grant/revoke Pro
│   ├── admin-users.js                  ← Admin: list users
│   ├── apply-referral.js               ← Referral system
│   ├── create-charge.js                ← Tap.company payment
│   ├── tap-webhook.js                  ← Tap.company webhook
│   ├── send-email.js                   ← Resend email
│   └── health.js                       ← Health check
│
└── src/
    ├── main.tsx
    ├── App.tsx                         ← Router + sidebar + layout
    ├── index.css
    │
    ├── contexts/
    │   ├── AuthContext.tsx             ← Supabase auth
    │   └── ExplosionContext.tsx        ← Particle explosion effect
    │
    ├── lib/
    │   ├── exporter.ts                 ← PDF/DOCX/PPTX/XLSX/SVG/ZIP export
    │   ├── supabase.ts                 ← Supabase client
    │   ├── safeSupabase.ts             ← Error-safe Supabase wrapper
    │   ├── subscription.ts             ← Quota + plan logic
    │   ├── mi.ts                       ← Mission submission logic
    │   ├── i18n.ts                     ← Arabic/English translations
    │   ├── utils.ts                    ← cn() + helpers
    │   ├── analytics.ts                ← Event tracking
    │   ├── referral.ts                 ← Referral logic
    │   ├── claude.ts                   ← (legacy, unused)
    │   └── pollinations.ts             ← (legacy image fallback)
    │
    ├── components/
    │   ├── Sidebar.tsx                 ← Nav sidebar (collapsible ««»»)
    │   ├── MILogo3D.tsx                ← Spinning 3D cube logo
    │   ├── ResultsDashboard.tsx        ← Mission output viewer
    │   ├── UploadHandler.tsx           ← File upload (PDF/image)
    │   ├── ImageGenerator.tsx          ← AI image generation
    │   ├── SlideViewer.tsx             ← Presentation preview
    │   ├── MissionStatus.tsx           ← Live progress tracker
    │   ├── OnboardingFlow.tsx          ← New user onboarding
    │   ├── UsageBanner.tsx             ← Mission quota banner
    │   ├── IntroSequence.tsx           ← Splash screen animation
    │   ├── Scene3D.tsx                 ← 3D background scene
    │   ├── ErrorBoundary.tsx           ← Error catch UI
    │   ├── GlitchText.tsx              ← Glitch text animation
    │   ├── LanguageSwitcher.tsx        ← EN/AR toggle
    │   ├── ParticleExplosion.tsx       ← Click explosion effect
    │   ├── ReferralWidget.tsx          ← Referral UI
    │   └── SEO.tsx                     ← Per-page meta tags
    │
    └── pages/
        ├── LandingPage.tsx             ← Public homepage + SEO blocks
        ├── AuthPage.tsx                ← Login/signup
        ├── TheHQ.tsx                   ← Dashboard (mission history)
        ├── TheTerminal.tsx             ← Mission submission form
        ├── TheVault.tsx                ← Saved missions archive
        ├── TheAcademy.tsx              ← Educational breakdowns
        ├── AdminDashboard.tsx          ← Admin panel (Zeyad + Rana)
        ├── PricingPage.tsx             ← Pricing + features
        ├── CheckoutPage.tsx            ← Payment flow
        ├── AssignmentTypeGuide.tsx     ← Assignment type reference
        ├── SettingsPage.tsx            ← User settings
        ├── PaymentSuccessPage.tsx      ← Post-payment confirmation
        ├── AuthPage.tsx                ← Login/signup
        ├── ContactPage.tsx             ← Contact form
        ├── PrivacyPage.tsx             ← Privacy policy
        ├── TermsPage.tsx               ← Terms of service
        ├── RefundPage.tsx              ← Refund policy
        └── SOPs.tsx                    ← Help / standard operating procedures
```

---

## Key Architecture Decisions

### Mi-CORE Engine (api/process-mission.js)
- Model: `gemini-3-flash-preview`
- Single model, 55s AbortController timeout
- Thinking: `thinkingBudget: 0` for fast domains, `8000` for ENGINEERING|MATH|MEDICAL|CS|SCIENCE|DATA
- Token budget: 16000 for heavy domains, 10000 others
- Domain router order: BUSINESS → MEDICAL (with hasEngineeringIntent guard) → CS → HUMANITIES → ENGINEERING → MATH_STATS → MULTI → GENERAL
- JSON recovery: truncation-safe parser
- Mi-CORE identity: "You are the Mi-Assignment Expert Engine ('Mi-CORE'). NEVER mention Google, Gemini..."

### Export Engine (src/lib/exporter.ts)
- Single CLEAN master (white bg, no dark/light split)
- Title slide: dark navy, full-bleed image
- Content slides: white bg, text left 55% / image right 40%
- SVG files saved to ZIP as `Diagram_N_title.svg`
- Title dedup: heading block skipped if matches payloadName
- Watermark: "Powered by Mi-Assignment · www.mi-assignment.com"
- Domain extras: Drug_Interaction_Matrix.csv (medical), Case_Law_References.md (law), Financial_Projections.xlsx (business), Sizing_Calculator.xlsx (engineering)
- SQL export: only for CS/database assignments
- Minimum 10 slides enforced

### Sidebar (src/components/Sidebar.tsx)
- Collapsible: w-64 expanded → w-[60px] collapsed (icon-only rail)
- Toggle: PanelLeftClose/PanelLeftOpen icons, desktop only
- Hidden on public pages: /, /pricing, /terms, /privacy, /refund, /contact, /auth, /checkout
- Tooltips in collapsed mode via title attribute
- Admin: zeyadsayedinq@gmail.com + ranafaraj30@gmail.com

### Mi-Academy (src/pages/TheAcademy.tsx)
- Data source: Supabase missions table, `.select('*')`
- Also reads from localStorage vault: `mi_vault_${user.id}`
- Tabs: Summary | Steps (expandable, 400+ chars) | Defend (Q&A hidden) | Slides (with speaker notes)
- Data paths: `sd.steps`, `sd.defense_qa`, `sd.slides`, `sd.reconstructed_doc.blocks`

### Admin Dashboard (src/pages/AdminDashboard.tsx)
- Tabs: Overview | Activate User | Subscriptions | Missions
- subscriptions table: NO `notes` column, NO `updated_at`
- Grant Pro: upsert to subscriptions with plan, status, expires_at, started_at
- Expiring soon: 7-day alert

---

## Supabase Tables

### missions
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK → auth.users |
| payload_name | text |
| university | text |
| course | text |
| assignment_type | text |
| status | text |
| summary | text |
| solution_data | jsonb |
| lang | text |
| created_at | timestamptz |

### subscriptions
| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid FK → auth.users |
| plan | text |
| status | text |
| expires_at | timestamptz |
| started_at | timestamptz |
| tap_charge_id | text |

---

## Academic Domains

| Domain | Standards | Domain Extras |
|--------|-----------|---------------|
| ENGINEERING | ECP 203, SBC 304, UAE code | SVG diagram, BBS.xlsx, Sizing_Calculator.xlsx |
| MEDICAL | SOAP, MONA, MOH (EG/SA/UAE) | Drug_Interaction_Matrix.csv, Patient_Leaflet.txt |
| LAW | IRAC, Egyptian Civil Code, CRCICA | Case_Law_References.md |
| CS | ER diagrams, SQL, 3NF | .sql, source code, README |
| BUSINESS | PESTEL, SWOT, NPV/DCF | Financial_Projections.xlsx |
| MATH_STATS | LaTeX, Lagrange | — |
| HUMANITIES | APA 7th, Harvard, Chicago | — |

---

## SEO / GEO Status

- JSON-LD: SoftwareApplication + Organization + FAQPage (index.html)
- MIS disambiguation: explicit in FAQPage schema + meta description
- llms.txt: mi-assignment.com/llms.txt (2.2KB)
- llms-full.txt: mi-assignment.com/llms-full.txt (11KB)
- Semantic content blocks: 4 sections on LandingPage before footer
- Target: rank for "AI engineering assignment Egypt", "SOAP note generator Arabic", "حل واجب هندسة ذكاء اصطناعي"

---

## Universities Supported
94 universities across Egypt (40+), Saudi Arabia (25+), UAE (10+), Lebanon (5+)
Key: GUC, AUC, Cairo University, Alexandria University, Ain Shams, MSA, BUE, KSU, KFUPM, KAUST, UAEU, AUS, AUB, LAU

## Known Limitations
- LaTeX CID garbling in PDFs: jsPDF limitation
- Real .dwg AutoCAD files: requires Autodesk APIs
- Gemini-3-flash-preview latency: preview model instability

## Launch Status
- Public launch: ~3 days from May 13 2026
- First exam season window: May/June 2026
- Target: 100 paying subscribers in first 30 days
