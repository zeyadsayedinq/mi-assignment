import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Supabase admin (lazy-init) ────────────────────────────────────────────────
let _sa: any = null;
function sa() {
  if (!_sa) _sa = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false } }
  );
  return _sa;
}

// ── Plan limits ───────────────────────────────────────────────────────────────
const PLAN_LIMITS: Record<string, number> = {
  free:          3,      // per calendar month
  pro_monthly:   15,     // per calendar month
  pro_quarterly: 40,     // per 90 days
  pro_yearly:    999999, // effectively unlimited
};

// ── In-memory rate limiter (per user, per hour) ───────────────────────────────
const rateMap = new Map<string, { count: number; reset: number }>();
function checkRate(id: string, max: number): boolean {
  const now = Date.now();
  const e = rateMap.get(id);
  if (!e || now > e.reset) { rateMap.set(id, { count: 1, reset: now + 3600000 }); return true; }
  if (e.count >= max) return false;
  e.count++; return true;
}

// ── Prompt cache (30 min, for repeated short prompts) ─────────────────────────
const pCache = new Map<string, { r: any; t: number }>();
const CACHE_TTL = 1800000;

// ── Email (Resend) ────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "Mi-Assignment <support@mi-assignment.com>", to, subject, html }),
    });
    if (!r.ok) console.warn("[EMAIL] Failed:", r.status);
  } catch (e: any) { console.warn("[EMAIL]", e.message); }
}

function emailWrap(body: string, isAr = false): string {
  const appUrl = process.env.VITE_APP_URL || "https://mi-assignment.com";
  return `<!DOCTYPE html><html dir="${isAr ? "rtl" : "ltr"}"><head><meta charset="UTF-8"><style>
body{margin:0;background:#0F172A;font-family:${isAr ? "'Cairo',sans-serif" : "Helvetica,sans-serif"};color:#E2E8F0;}
.w{max-width:560px;margin:0 auto;padding:24px 16px;}
.c{background:#1E293B;border-radius:16px;padding:28px;border:1px solid #334155;}
.logo{font-size:20px;font-weight:900;background:linear-gradient(90deg,#22D3EE,#A855F7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
.tag{font-size:11px;color:#64748B;margin-bottom:20px;}
h2{font-size:20px;font-weight:700;color:#F8FAFC;margin:0 0 12px;}
p{font-size:14px;line-height:1.6;color:#94A3B8;margin:0 0 14px;}
.btn{display:inline-block;padding:12px 22px;background:linear-gradient(90deg,#22D3EE,#A855F7);color:#000;font-weight:900;border-radius:10px;text-decoration:none;font-size:13px;}
.box{background:#0F172A;border-radius:10px;padding:14px;margin:14px 0;font-size:13px;line-height:1.8;}
.foot{font-size:11px;color:#475569;margin-top:16px;padding-top:14px;border-top:1px solid #334155;}
</style></head><body><div class="w"><div class="c">
<div class="logo">Mi-Assignment</div>
<div class="tag">Your Online Assignment Helper</div>
${body}
<div class="foot">© ${new Date().getFullYear()} Mi-Assignment &nbsp;·&nbsp;
<a href="${appUrl}/terms" style="color:#475569">Terms</a> &nbsp;·&nbsp;
<a href="${appUrl}/privacy" style="color:#475569">Privacy</a>
</div></div></div></body></html>`;
}

// ── Subscription gate (server-side, accurate) ─────────────────────────────────
async function getSubStatus(userId: string) {
  let plan = "free";
  let limit = PLAN_LIMITS.free;

  try {
    const { data: sub } = await sa()
      .from("subscriptions")
      .select("plan,status,expires_at")
      .eq("user_id", userId)
      .single();

    if (sub?.status === "active" && (!sub.expires_at || new Date(sub.expires_at) > new Date())) {
      plan = sub.plan || "free";
      limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    }
  } catch {}

  // Period window depends on plan
  const periodStart = new Date();
  if (plan === "pro_quarterly") periodStart.setDate(periodStart.getDate() - 90);
  else if (plan === "pro_yearly") periodStart.setFullYear(periodStart.getFullYear() - 1);
  else { periodStart.setDate(1); periodStart.setHours(0, 0, 0, 0); } // start of month

  let missionsUsed = 0;
  try {
    const { count } = await sa()
      .from("missions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", periodStart.toISOString());
    missionsUsed = count || 0;
  } catch {}

  const isPro = plan !== "free";
  const canUse = limit >= 999999 || missionsUsed < limit;

  return { plan, limit, missionsUsed, isPro, canUse };
}

// ── Claude master prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Mi-Assignment — a world-class academic AI that produces complete, submission-ready solutions for ANY university assignment. You write authentically like a real student, never like an AI.

═══ ABSOLUTE RULES ═══
1. Return ONE valid JSON object only. Zero markdown outside JSON. Zero preamble. Nothing before the opening {.
2. NEVER truncate. NEVER use placeholders like "[add content here]". Every section must be fully written.
3. Write like a real student: engaged, earnest, occasionally imperfect. NOT like a textbook or AI assistant.
4. BANNED PHRASES: "It is worth noting", "Delve into", "Shed light on", "Multifaceted", "Pivotal", "Leveraging", "It is evident that", "In today's rapidly changing world", "Furthermore," as opener, "In conclusion, it can be said".
5. When lang=ar: ALL prose fields in Modern Standard Arabic (فصحى). Code, math, SQL, variable names stay in English.
6. Match the academic level: IGCSE/A-Level (clear, structured), IB (analytical), Year 1-2 (intro theory), Year 3-4 (critical analysis), Masters (rigorous, concise).

═══ ASSIGNMENT TYPES (set assignment_type) ═══
essay | report | literature_review | case_study | lab_report | presentation | research_paper | math | physics | engineering | chemistry | biology | computer_science | data_analysis | sql_database | business_plan | financial_model | legal_brief | design_brief | architecture | psychology | sociology | history | economics | marketing | accounting | statistics | nursing | pharmacy | law | other

═══ OUTPUT RULES BY TYPE ═══

[ESSAYS / REPORTS / LIT REVIEWS / CASE STUDIES]
- Full paragraphs throughout. Min 5 substantial blocks. No bullet dumps in body text.
- Proper in-text citations (Harvard, APA, MLA, Chicago — match reference style if given).
- Introduction with clear thesis. Body with topic sentences. Conclusion that synthesizes.
- Student voice: vary sentence length, include hedged phrases ("One could argue", "The evidence suggests"), do NOT start every paragraph with the topic sentence.
- Word count: match requested length. If not specified: essay=1500w, report=2000w, lit review=2500w.

[MATH / PHYSICS / ENGINEERING / CHEMISTRY / STATISTICS]
- Show EVERY step. Never skip intermediate calculations.
- Use type:"math" blocks with solution_steps arrays.
- LaTeX notation for all equations: $inline$ or $$display$$.
- Label each step clearly: "Step 1: Define variables", "Step 2: Apply Newton's second law", etc.
- State given values, unknowns, formula used, substitution, calculation, final answer with units.
- For engineering: include free body diagrams described in SVG when relevant.
- data_sheet: include given values table.

[CODE — ANY LANGUAGE]
- Complete, runnable files. No pseudocode. No "# TODO: implement this".
- Student-style comments explaining logic in plain language.
- Sensible variable names (not x1, x2 — use descriptive names).
- Include sample input/output in comments.
- Languages supported: Python, JavaScript, TypeScript, Java, C, C++, C#, R, MATLAB, SQL, HTML/CSS, PHP, Swift, Kotlin, Go, Rust, Assembly, Bash, Ruby, Scala, and more.
- For web: complete HTML + CSS + JS in separate code_snippets entries.

[SQL / DATABASES]
- Full DDL: CREATE TABLE with constraints, PRIMARY KEY, FOREIGN KEY, NOT NULL, DEFAULT.
- Realistic sample INSERT data (min 5 rows per table).
- All required queries with comments explaining each.
- Include indexes where appropriate.
- data_sheet: ER diagram description.

[PRESENTATIONS]
- ALWAYS 8-12 slides. Never fewer.
- Slide titles must be punchy and specific — NEVER "Introduction" or "Overview" or "Conclusion".
- content_bullets: real substantive points with data/evidence, not vague statements.
- narrative: 2-3 sentences in student speaker voice for delivery.
- speaker_notes: verbatim speech script with transitions between slides.
- image_prompt: hyper-specific Pollinations AI prompt — describe subject, style, lighting, mood, camera angle, quality. Example: "Aerial view of Cairo University campus at golden hour, warm light, architectural photography, 8K, wide angle lens".
- image_layout: "left" | "right" | "background" | "full".

[BUSINESS PLANS / FINANCIAL MODELS]
- Complete executive summary, market analysis, operations, financials sections.
- 3-year financial projections in data_sheet.
- Realistic market sizing for the stated geography.

[LAB REPORTS]
- Full IMRaD structure: Introduction, Methods, Results, Discussion, Conclusion.
- data_sheet: experimental data table.
- Appropriate statistical analysis.

[DIAGRAMS / ARCHITECTURE / FLOWCHARTS]
- Generate raw SVG as type:"svg" block.
- Clean, professional diagrams with labels.

[LEGAL / NURSING / PHARMACY / PSYCHOLOGY / SOCIOLOGY]
- Follow the conventions of the specific discipline.
- Use appropriate terminology and citation style.
- For clinical: use SOAP notes, case study format as appropriate.

═══ STUDENT VOICE CALIBRATION ═══
- Write at the academic level of the university/course if provided.
- AUC/AUS/GUC/BUE/MIU: English-medium, internationally calibrated.
- Cairo University/Ain Shams/Mansoura: Egyptian public university standard.
- KFUPM/KAU/KSU: Saudi rigorous STEM focus.
- UAE universities: Gulf academic style, Vision 2030 framing where relevant.
- IB/IGCSE/A-Level: British-style analytical writing.
- North American style: thesis-driven, citation-heavy.

═══ JSON OUTPUT SCHEMA ═══
{
  "solution_text": "2-3 casual sentences summarizing what was done and key findings",
  "assignment_type": "type from the list above",
  "reconstructed_doc": {
    "title": "Full assignment title",
    "word_count": 0,
    "blocks": [
      {
        "type": "heading | paragraph | list | math | code | table | svg",
        "content": "Full text — NEVER truncated",
        "level": 1,
        "solution_steps": ["Step 1: ...", "Step 2: ..."],
        "language": "python",
        "headers": ["Col1", "Col2"],
        "rows": [["val1", "val2"]]
      }
    ]
  },
  "presentation_slides": [
    {
      "power_heading": "Punchy specific title",
      "content_bullets": ["Substantive point with evidence/data"],
      "narrative": "Student speaker voice 2-3 sentences",
      "speaker_notes": "Verbatim speech with transitions",
      "image_prompt": "Hyper-specific visual description for AI image generation",
      "image_layout": "left | right | background | full"
    }
  ],
  "data_sheet": {
    "sheet_name": "Sheet name",
    "headers": ["Column 1", "Column 2"],
    "rows": [["value1", "value2"]],
    "sql_table_name": "optional"
  },
  "code_snippets": [
    {
      "language": "python",
      "filename": "main.py",
      "code": "# Complete runnable code",
      "explanation": "Brief description of what this file does"
    }
  ],
  "steps": [
    {
      "title": "Academy step title",
      "content": "Pedagogical explanation — can be analytical and teaching-focused here"
    }
  ]
}`;

// ── Daily expiry warning cron (7am UTC = 9am Cairo) ───────────────────────────
async function runExpiryCheck() {
  if (!process.env.RESEND_API_KEY || !process.env.VITE_SUPABASE_URL) return;
  try {
    const in7 = new Date(); in7.setDate(in7.getDate() + 7);
    const d0 = new Date(in7); d0.setHours(0, 0, 0, 0);
    const d1 = new Date(in7); d1.setHours(23, 59, 59, 999);
    const { data: subs } = await sa()
      .from("subscriptions")
      .select("user_id,expires_at")
      .eq("status", "active")
      .gte("expires_at", d0.toISOString())
      .lte("expires_at", d1.toISOString());

    const appUrl = process.env.VITE_APP_URL || "https://mi-assignment.com";
    for (const sub of subs || []) {
      try {
        const { data: u } = await sa().auth.admin.getUserById(sub.user_id);
        if (!u?.user?.email) continue;
        const isAr = u.user.user_metadata?.language === "ar";
        const exp = new Date(sub.expires_at).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { day:"numeric", month:"long", year:"numeric" });
        await sendEmail(u.user.email,
          isAr ? "اشتراكك ينتهي خلال ٧ أيام ⏰" : "Your Mi-Assignment subscription expires in 7 days ⏰",
          emailWrap(isAr
            ? `<h2>اشتراكك ينتهي قريباً ⏰</h2><p>اشتراك Pro ينتهي في <strong style="color:#F59E0B">${exp}</strong>. جدّد دلوقتي علشان تفضل تستخدم Mi بدون انقطاع.</p><a href="${appUrl}/pricing" class="btn">جدّد الاشتراك ←</a>`
            : `<h2>Subscription expiring soon ⏰</h2><p>Your Pro subscription expires on <strong style="color:#F59E0B">${exp}</strong>. Renew now to keep unlimited access.</p><a href="${appUrl}/pricing" class="btn">Renew subscription →</a>`,
          isAr)
        );
        console.log(`[CRON] Expiry warning → ${u.user.email}`);
      } catch {}
    }
  } catch (e: any) { console.warn("[CRON]", e.message); }
}

function startCron() {
  const next = new Date();
  next.setUTCHours(7, 0, 0, 0);
  if (next <= new Date()) next.setDate(next.getDate() + 1);
  const ms = next.getTime() - Date.now();
  setTimeout(() => { runExpiryCheck(); setInterval(runExpiryCheck, 86400000); }, ms);
  console.log(`  [CRON] Expiry check scheduled in ${Math.round(ms / 3600000)}h`);
}

// ── Admin middleware ───────────────────────────────────────────────────────────
function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = (req.headers["x-admin-key"] || req.query.key) as string;
  if (!process.env.ADMIN_SECRET || key !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Raw body capture for Tap webhook HMAC
  app.use((req, res, next) => {
    if (req.path === "/api/webhook/tap") {
      let raw = ""; req.setEncoding("utf8");
      req.on("data", c => { raw += c; });
      req.on("end", () => {
        (req as any).rawBody = raw;
        try { req.body = JSON.parse(raw); } catch { req.body = {}; }
        next();
      });
    } else {
      express.json({ limit: "150mb" })(req, res, next);
    }
  });

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-key, hashstring");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
  });

  // ── Health ─────────────────────────────────────────────────────────────────
  app.get("/api/health", (_, res) => res.json({
    status: "ready",
    gemini: !!process.env.GEMINI_API_KEY,
    tap: !!process.env.TAP_SECRET_KEY,
    supabase: !!(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
    email: !!process.env.RESEND_API_KEY,
    admin: !!process.env.ADMIN_SECRET,
  }));

  // ── Welcome email ──────────────────────────────────────────────────────────
  app.post("/api/auth/welcome", async (req, res) => {
    try {
      const { email, language } = req.body;
      if (!email) return res.status(400).json({ error: "Missing email" });
      const isAr = language === "ar";
      const appUrl = process.env.VITE_APP_URL || "https://mi-assignment.com";
      await sendEmail(email,
        isAr ? "أهلاً بك في Mi-Assignment! 🎓" : "Welcome to Mi-Assignment! 🎓",
        emailWrap(isAr
          ? `<h2>أهلاً وسهلاً! 🎓</h2><p>حسابك جاهز. ابعتلي الواجب وخليني أحله في ثوانٍ — مقالات، بروزنتيشن، كود، رياضيات، وأكتر.</p><a href="${appUrl}/terminal" class="btn">ابدأ أول مهمة ←</a><p style="margin-top:12px;font-size:12px">الخطة المجانية: ٣ مهام/شهر · <a href="${appUrl}/pricing" style="color:#22D3EE">ترقية لـ Pro</a></p>`
          : `<h2>Welcome to Mi-Assignment! 🎓</h2><p>Your account is ready. Submit any assignment and get a complete solution in seconds — essays, presentations, code, math, and more.</p><a href="${appUrl}/terminal" class="btn">Start your first mission →</a><p style="margin-top:12px;font-size:12px">Free plan: 3 missions/month · <a href="${appUrl}/pricing" style="color:#22D3EE">Upgrade to Pro</a></p>`,
        isAr)
      );
      res.json({ sent: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── MAIN QUOTA ENDPOINT ────────────────────────────────────────────────────
  app.post("/api/check-quota", async (req, res) => {
    try {
      const { userId, lang } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const sub = await getSubStatus(userId);
      if (!sub.canUse) {
        return res.status(402).json({
          error: "LIMIT_REACHED",
          plan: sub.plan,
          missionsUsed: sub.missionsUsed,
          limit: sub.limit,
          message: lang === "ar"
            ? `وصلت للحد (${sub.limit} مهمة لهذه الفترة). اشترك في Pro للمزيد.`
            : `Limit reached (${sub.limit} missions this period). Upgrade to Pro.`,
        });
      }

      if (!checkRate(userId, sub.isPro ? 30 : 5)) {
        return res.status(429).json({
          error: lang === "ar" ? "كتير أوي في وقت قصير. انتظر قليلاً." : "Too many requests. Wait a moment.",
        });
      }

      res.json({ allowed: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── RECORD MISSION ENDPOINT ──────────────────────────────────────────────────
  app.post("/api/record-mission", async (req, res) => {
    try {
      const { userId, result, files, prompt, university, course, missionType, lang } = req.body;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const missionData = {
        user_id: userId,
        payload_name: files?.length > 0 ? files[0].name : (prompt?.substring(0, 80) || "Mission"),
        university: university || null,
        course: course || null,
        assignment_type: result?.assignment_type || missionType || "other",
        status: "SUCCESS",
        summary: result?.solution_text?.substring(0, 300) || "",
        solution_data: result,
        lang: lang || "en",
      };

      const { data, error } = await sa().from("missions").insert(missionData).select().single();
      if (error) throw error;

      res.json({ success: true, missionId: data.id });
    } catch (e: any) {
      console.error("[RECORD]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // Public mission counter (no auth)
  app.post("/api/admin/users-by-email", requireAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: "Missing email" });
      const { data: { users }, error } = await sa().auth.admin.listUsers();
      if (error) throw error;
      const found = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase().trim());
      if (!found) return res.status(404).json({ error: "User not found" });
      res.json({ userId: found.id, email: found.email });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });


  // ── REFERRAL PROCESSING ─────────────────────────────────────────────────────
  app.post("/api/referral/process", async (req, res) => {
    try {
      const { newUserId, refCode } = req.body;
      if (!newUserId || !refCode) return res.status(400).json({ error: "Missing params" });

      // Find the referral row with this code
      const { data: referral } = await sa()
        .from("referrals")
        .select("id,referrer_id,referred_id,bonus_granted")
        .eq("ref_code", refCode.toUpperCase())
        .is("referred_id", null) // not yet used
        .single();

      if (!referral) return res.status(404).json({ error: "Invalid or already used code" });
      if (referral.referrer_id === newUserId) return res.status(400).json({ error: "Cannot use own referral code" });

      // Mark referral as converted
      await sa().from("referrals").update({
        referred_id: newUserId,
        status: "converted",
        bonus_granted: true,
        converted_at: new Date().toISOString(),
      }).eq("id", referral.id);

      // Log bonus missions for both users in usage_events
      const now = new Date().toISOString();
      await sa().from("usage_events").insert([
        { user_id: referral.referrer_id, event_type: "referral_bonus", properties: { bonus: 2, ref_code: refCode, role: "referrer" }, created_at: now },
        { user_id: newUserId, event_type: "referral_bonus", properties: { bonus: 2, ref_code: refCode, role: "referred" }, created_at: now },
      ]).catch(() => {});

      console.log(`[REFERRAL] ${refCode}: ${referral.referrer_id} → ${newUserId} (+2 missions each)`);
      res.json({ success: true, bonusMissions: 2 });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // Public mission counter (no auth)
  app.get("/api/stats/missions", async (_, res) => {
    try {
      const { count } = await sa()
        .from("missions")
        .select("id", { count: "exact", head: true });
      res.json({ total: count || 0 });
    } catch { res.json({ total: 0 }); }
  });

  // ── Subscription status (frontend query) ─────────────────────────────────
  app.get("/api/subscription/:userId", async (req, res) => {
    try {
      const status = await getSubStatus(req.params.userId);
      res.json(status);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── TAP PAYMENTS — Create charge ──────────────────────────────────────────
  app.post("/api/payments/tap/charge", async (req, res) => {
    try {
      const { amount, currency, userId, email, firstName, plan, redirectUrl } = req.body;
      const tapKey = process.env.TAP_SECRET_KEY;
      if (!tapKey) return res.status(400).json({ error: "TAP_SECRET_KEY not configured." });

      const r = await fetch("https://api.tap.company/v2/charges", {
        method: "POST",
        headers: { Authorization: `Bearer ${tapKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount, currency,
          customer: { first_name: firstName, email, metadata: { user_id: userId, plan } },
          source: { id: "src_card" },
          redirect: { url: redirectUrl },
          post: { url: `${process.env.VITE_APP_URL}/api/webhook/tap` },
          metadata: { user_id: userId, plan },
        }),
      });
      if (!r.ok) { const e: any = await r.json().catch(()=>({})); return res.status(r.status).json({ error: e?.message || "Tap Payments error" }); }
      const charge: any = await r.json();
      res.json({ chargeUrl: charge.transaction?.url || charge.redirect?.url, chargeId: charge.id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ── TAP WEBHOOK — HMAC-SHA256 verified ───────────────────────────────────
  app.post("/api/webhook/tap", async (req, res) => {
    try {
      const rawBody: string = (req as any).rawBody || "";
      const secret = process.env.TAP_WEBHOOK_SECRET;

      if (secret) {
        const received = (req.headers["hashstring"] || req.headers["x-tap-signature"] || "") as string;
        if (!received) {
          console.warn("[WEBHOOK] Missing signature header");
          return res.status(401).json({ error: "Missing signature" });
        }
        const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
        let ok = false;
        try { ok = crypto.timingSafeEqual(Buffer.from(received.toLowerCase()), Buffer.from(expected.toLowerCase())); } catch {}
        if (!ok) {
          console.warn(`[WEBHOOK] Signature mismatch: got ${received.slice(0,8)}… expected ${expected.slice(0,8)}…`);
          return res.status(401).json({ error: "Invalid signature" });
        }
      } else {
        console.warn("[WEBHOOK] TAP_WEBHOOK_SECRET not set — signature verification skipped (unsafe for production)");
      }

      const { id: chargeId, status, metadata, amount, currency } = req.body;
      const userId = metadata?.user_id;
      const plan = metadata?.plan || "pro_quarterly";
      if (!userId) return res.json({ received: true });

      if (status === "CAPTURED") {
        // CORRECT expiry math — 90 days not 3 months
        const exp = new Date();
        if (plan.includes("yearly")) exp.setDate(exp.getDate() + 365);
        else if (plan.includes("quarterly")) exp.setDate(exp.getDate() + 90);
        else exp.setDate(exp.getDate() + 31);

        await sa().from("subscriptions").upsert({
          user_id: userId, plan, status: "active",
          started_at: new Date().toISOString(),
          expires_at: exp.toISOString(),
          tap_charge_id: chargeId,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        console.log(`[WEBHOOK] ✅ ${plan} for ${userId} until ${exp.toISOString()}`);

        // Send receipt email
        try {
          const { data: u } = await sa().auth.admin.getUserById(userId);
          if (u?.user?.email) {
            const isAr = u.user.user_metadata?.language === "ar";
            const expStr = exp.toLocaleDateString(isAr ? "ar-EG" : "en-GB", { day:"numeric", month:"long", year:"numeric" });
            const planLabel = plan.includes("yearly") ? (isAr?"سنوي":"Yearly") : plan.includes("quarterly") ? (isAr?"ربع سنوي":"Quarterly") : (isAr?"شهري":"Monthly");
            const appUrl = process.env.VITE_APP_URL || "https://mi-assignment.com";
            await sendEmail(u.user.email,
              isAr ? "تم تفعيل اشتراكك ✅" : "Your Mi-Assignment subscription is active ✅",
              emailWrap(isAr
                ? `<h2>تم التفعيل ✅</h2><div class="box"><div>الخطة: <strong style="color:#F8FAFC">${planLabel}</strong></div><div>المبلغ: <strong style="color:#22D3EE">${amount} ${currency}</strong></div><div>ينتهي في: <strong style="color:#F8FAFC">${expStr}</strong></div><div style="color:#475569;font-size:11px;margin-top:4px">مرجع: ${chargeId}</div></div><a href="${appUrl}/terminal" class="btn">ابدأ مهمة الآن ←</a>`
                : `<h2>Subscription active ✅</h2><div class="box"><div>Plan: <strong style="color:#F8FAFC">${planLabel}</strong></div><div>Amount: <strong style="color:#22D3EE">${amount} ${currency}</strong></div><div>Expires: <strong style="color:#F8FAFC">${expStr}</strong></div><div style="color:#475569;font-size:11px;margin-top:4px">Ref: ${chargeId}</div></div><a href="${appUrl}/terminal" class="btn">Start a mission →</a>`,
              isAr)
            );
          }
        } catch {}

      } else if (["FAILED", "VOIDED", "REFUNDED"].includes(status)) {
        await sa().from("subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
        console.log(`[WEBHOOK] ❌ ${status} for ${userId}`);
      }

      res.json({ received: true });
    } catch (e: any) {
      console.error("[WEBHOOK]", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  // ── ADMIN API ─────────────────────────────────────────────────────────────
  app.get("/api/admin/stats", requireAdmin, async (_, res) => {
    try {
      const [mRes, sRes, wRes] = await Promise.all([
        sa().from("missions").select("id,assignment_type", { count: "exact" }),
        sa().from("subscriptions").select("plan,status").eq("status", "active"),
        sa().from("missions").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 604800000).toISOString()),
      ]);
      const plans: Record<string,number> = (sRes.data||[]).reduce((a:any,s:any) => { a[s.plan]=(a[s.plan]||0)+1; return a; }, {});
      const types: Record<string,number> = (mRes.data||[]).reduce((a:any,m:any) => { a[m.assignment_type||"other"]=(a[m.assignment_type||"other"]||0)+1; return a; }, {});
      const revEGP = (plans.pro_quarterly||0)*1000 + (plans.pro_monthly||0)*390 + (plans.pro_yearly||0)*3500;
      res.json({
        totalMissions: mRes.count||0,
        activePro: sRes.data?.length||0,
        missionsLast7d: wRes.count||0,
        planBreakdown: plans,
        assignmentBreakdown: types,
        estimatedRevenueEGP: revEGP,
        generatedAt: new Date().toISOString(),
      });
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const page = Number(req.query.page)||1, limit = Math.min(Number(req.query.limit)||50,100);
      const { data: subs } = await sa().from("subscriptions").select("user_id,plan,status,expires_at,started_at,tap_charge_id").range((page-1)*limit,(page-1)*limit+limit-1).order("started_at",{ascending:false});
      const enriched = await Promise.all((subs||[]).map(async (s:any) => {
        try { const {data:u} = await sa().auth.admin.getUserById(s.user_id); return {...s,email:u?.user?.email||"unknown"}; }
        catch { return {...s,email:"unknown"}; }
      }));
      res.json({ users: enriched, page, limit });
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/admin/missions", requireAdmin, async (req, res) => {
    try {
      const page = Number(req.query.page)||1, limit = Math.min(Number(req.query.limit)||100,200);
      const { data, count } = await sa().from("missions").select("id,created_at,assignment_type,university,course,status,user_id",{count:"exact"}).range((page-1)*limit,(page-1)*limit+limit-1).order("created_at",{ascending:false});
      res.json({ missions: data||[], total: count||0, page, limit });
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/users/:userId/subscription", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { plan = "pro_quarterly", action = "grant", durationDays = 90 } = req.body;
      if (action === "revoke") {
        await sa().from("subscriptions").update({ status:"cancelled", updated_at:new Date().toISOString() }).eq("user_id",userId);
        return res.json({ success:true, action:"revoked" });
      }
      const exp = new Date(); exp.setDate(exp.getDate() + Number(durationDays));
      await sa().from("subscriptions").upsert({
        user_id:userId, plan, status:"active",
        started_at:new Date().toISOString(),
        expires_at:exp.toISOString(),
        tap_charge_id:`manual_${Date.now()}`,
        updated_at:new Date().toISOString(),
      }, { onConflict:"user_id" });
      res.json({ success:true, action:"granted", plan, expiresAt:exp.toISOString() });
    } catch (e:any) { res.status(500).json({ error: e.message }); }
  });

  // ── VITE / STATIC ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), "dist");
    app.use(express.static(dist));
    app.get("*", (_, res) => res.sendFile(path.join(dist, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n  [Mi-Assignment] http://localhost:${PORT}`);
    console.log(`  Gemini:   ${process.env.GEMINI_API_KEY ? "✓" : "✗ MISSING — set GEMINI_API_KEY"}`);
    console.log(`  Supabase: ${process.env.VITE_SUPABASE_URL ? "✓" : "✗ not set"}`);
    console.log(`  Tap:      ${process.env.TAP_SECRET_KEY ? "✓" : "○ not set"}`);
    console.log(`  Webhook:  ${process.env.TAP_WEBHOOK_SECRET ? "✓ secured" : "⚠  TAP_WEBHOOK_SECRET not set (unsafe)"}`);
    console.log(`  Email:    ${process.env.RESEND_API_KEY ? "✓" : "○ not set"}`);
    console.log(`  Admin:    ${process.env.ADMIN_SECRET ? "✓" : "○ ADMIN_SECRET not set"}\n`);
  });

  startCron();
}

startServer();
